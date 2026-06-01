import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function buildUserContext(supabase: any, userId: string) {
  const today = new Date().toISOString().slice(0, 10);
  const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
  const fourWksAgo = new Date(Date.now() - 28 * 86400000).toISOString().slice(0, 10);

  const [
    { data: profile }, { data: tasks }, { data: goals },
    { data: workouts }, { data: foods }, { data: water },
    { data: sleep }, { data: moods }, { data: exercises },
  ] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
    supabase.from("tasks").select("title, priority, completed, due_date, recurrence, last_completed_date").order("created_at", { ascending: false }).limit(40),
    supabase.from("goals").select("title, timeframe, priority, progress, status, target_date").eq("status", "active").limit(20),
    supabase.from("workouts").select("name, type, intensity, duration_minutes, calories_burned, performed_on").gte("performed_on", fourWksAgo).order("performed_on", { ascending: false }),
    supabase.from("food_logs").select("name, meal, calories, protein_g, carbs_g, fat_g, servings, logged_on").gte("logged_on", sevenDaysAgo).order("logged_on", { ascending: false }),
    supabase.from("water_logs").select("amount_ml, logged_on").gte("logged_on", sevenDaysAgo),
    supabase.from("sleep_logs").select("slept_on, duration_hours, quality, bedtime, wake_time").gte("slept_on", sevenDaysAgo).order("slept_on", { ascending: false }),
    supabase.from("mood_logs").select("logged_at, mood, energy, stress, tags").gte("logged_at", new Date(Date.now() - 7 * 86400000).toISOString()).order("logged_at", { ascending: false }),
    supabase.from("workout_exercises").select("primary_muscle, secondary_muscles, sets, workouts!inner(performed_on)").gte("workouts.performed_on", fourWksAgo),
  ]);

  // Compute muscle volume (last 28d, weekly)
  const muscleSets: Record<string, number> = {};
  for (const e of (exercises ?? []) as any[]) {
    const sets = e.sets ?? 1;
    if (e.primary_muscle) muscleSets[e.primary_muscle] = (muscleSets[e.primary_muscle] ?? 0) + sets;
    for (const s of (e.secondary_muscles ?? [])) muscleSets[s] = (muscleSets[s] ?? 0) + 0.5 * sets;
  }
  const weeklyMuscle = Object.fromEntries(Object.entries(muscleSets).map(([k, v]) => [k, v / 4]));
  const TARGETS: Record<string, number> = { Chest: 12, Back: 14, Shoulders: 10, Biceps: 8, Triceps: 8, Legs: 14, Glutes: 10, Core: 10 };
  const weakMuscles = Object.entries(TARGETS)
    .map(([m, t]) => ({ m, ratio: (weeklyMuscle[m] ?? 0) / t }))
    .filter((x) => x.ratio < 0.5)
    .map((x) => `${x.m} (${Math.round(x.ratio * 100)}% of target)`).join(", ") || "none";
  const strongMuscles = Object.entries(TARGETS)
    .map(([m, t]) => ({ m, ratio: (weeklyMuscle[m] ?? 0) / t }))
    .filter((x) => x.ratio >= 0.8)
    .map((x) => x.m).join(", ") || "none";

  // Sleep summary
  const sleepArr = sleep ?? [];
  const avgSleep = sleepArr.length ? (sleepArr.reduce((s: number, l: any) => s + Number(l.duration_hours ?? 0), 0) / sleepArr.length) : 0;
  const sleepStatus = avgSleep === 0 ? "no data" : avgSleep >= 7 ? "Green / on target" : avgSleep >= 6 ? "Yellow / borderline" : "Red / dangerously low";

  // Workouts last 7d
  const workoutsLast7 = (workouts ?? []).filter((w: any) => w.performed_on >= sevenDaysAgo);
  const trainingFreq = workoutsLast7.length;

  // Daily score components
  const allTasks = tasks ?? [];
  const recurring = allTasks.filter((t: any) => t.recurrence && t.recurrence !== "none");
  const recurringDone = recurring.filter((t: any) => t.last_completed_date === today).length;
  const habitsPct = recurring.length ? Math.round((recurringDone / recurring.length) * 100) : 0;
  const oneOffs = allTasks.filter((t: any) => !t.recurrence || t.recurrence === "none");
  const openTasks = oneOffs.filter((t: any) => !t.completed).length;
  const doneTasks = oneOffs.filter((t: any) => t.completed).length;
  const tasksPct = (doneTasks + openTasks) > 0 ? Math.round((doneTasks / (doneTasks + openTasks)) * 100) : 100;
  const workoutToday = workoutsLast7.some((w: any) => w.performed_on === today);
  const sleepScore = avgSleep >= 7 ? 100 : avgSleep >= 6 ? 60 : avgSleep > 0 ? 30 : 0;
  const dailyScore = Math.round(habitsPct * 0.35 + sleepScore * 0.25 + (workoutToday ? 20 : 0) + tasksPct * 0.20);

  const p = (profile ?? {}) as Record<string, unknown>;
  const profileBlock = profile ? `Name: ${p.full_name ?? p.display_name ?? "User"} | Age: ${p.age ?? "?"} | Sex: ${p.gender ?? "?"} | ${p.height_cm ?? "?"}cm / ${p.weight_kg ?? "?"}kg
Fitness level: ${p.fitness_level ?? "?"} | Activity: ${p.activity_level ?? "?"}
Targets: ${p.sleep_goal_hours ?? "?"}h sleep, ${p.water_goal_ml ?? "?"}ml water, ${p.calorie_goal ?? "?"} kcal
Stress ${p.stress_level ?? "?"}/10 | Productivity ${p.productivity_level ?? "?"}/10
Motivation style: ${p.motivation_style ?? "?"} | Personality: ${p.personality_style ?? "?"}
Allergies: ${p.allergies ?? "none"} | Injuries: ${p.injuries ?? "none"}
Fitness goals: ${p.fitness_goals ?? "—"} | Career: ${p.career_goals ?? "—"}` : "Profile not set.";

  return {
    today, dailyScore, habitsPct, sleepScore, tasksPct, workoutToday,
    avgSleep, sleepStatus, weakMuscles, strongMuscles, trainingFreq,
    profileBlock, goals: goals ?? [], recurring, openOneOffs: oneOffs.filter((t: any) => !t.completed),
    workouts: workoutsLast7,
  };
}

function summaryPrompt(ctx: any) {
  return `Today: ${ctx.today}
DAILY SCORE: ${ctx.dailyScore}/100 (Habits ${ctx.habitsPct}% | Sleep score ${ctx.sleepScore}/100 | Workout today: ${ctx.workoutToday ? "yes" : "no"} | Tasks ${ctx.tasksPct}%)
SLEEP (7d): avg ${ctx.avgSleep.toFixed(1)}h — ${ctx.sleepStatus}
TRAINING (7d): ${ctx.trainingFreq} sessions
WEAK muscles (<50% of target volume, last 4w): ${ctx.weakMuscles}
STRONG muscles (≥80% target): ${ctx.strongMuscles}

PROFILE:
${ctx.profileBlock}

ACTIVE GOALS: ${ctx.goals.map((g: any) => `${g.title} [${g.timeframe}, ${g.priority}, ${g.progress}%${g.target_date ? `, due ${g.target_date}` : ""}]`).join("; ") || "none"}
Recurring habits today: ${ctx.recurring.map((t: any) => `${t.title}${t.last_completed_date === ctx.today ? " ✓" : ""}`).join("; ") || "none"}
Open tasks: ${ctx.openOneOffs.map((t: any) => `${t.title} [${t.priority}]`).join("; ") || "none"}`;
}

async function callGateway(messages: any[], model = "google/gemini-3-flash-preview") {
  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) throw new Error("AI not configured");
  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model, messages }),
  });
  if (!res.ok) {
    const txt = await res.text();
    console.error("[coach] AI gateway error", res.status, txt);
    if (res.status === 429) throw new Error("Rate limited. Try again in a moment.");
    if (res.status === 402) throw new Error("AI credits exhausted. Add credits in workspace settings.");
    throw new Error("The AI coach is temporarily unavailable. Please try again.");
  }
  const json = await res.json();
  return json.choices?.[0]?.message?.content ?? "";
}

export const sendCoachMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ message: z.string().min(1).max(4000) }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await supabase.from("chat_messages").insert({ user_id: userId, role: "user", content: data.message });

    const ctx = await buildUserContext(supabase, userId);
    const { data: history } = await supabase.from("chat_messages").select("role, content").order("created_at", { ascending: false }).limit(10);

    const messages = [
      {
        role: "system",
        content: `You are Aurora, a warm, sharp, no-fluff AI life & performance coach. Use the user's full profile, daily score breakdown, sleep, training, and muscle coverage to give deeply personal, specific, actionable advice. PROACTIVELY flag weak signals — e.g. "You haven't trained legs in 10 days, your leg coverage is in the Red zone" or "Your 7-day sleep average is 5.8h — that's the Red zone, here's what to do tonight". Match their motivation style, respect their injuries/allergies, and tie suggestions back to stated goals. Keep replies under 220 words, markdown, occasional emoji. Never invent data not in context.

USER CONTEXT:
${summaryPrompt(ctx)}`,
      },
      ...((history ?? []).reverse().map((m: any) => ({ role: m.role, content: m.content }))),
    ];

    const reply = await callGateway(messages);
    await supabase.from("chat_messages").insert({ user_id: userId, role: "assistant", content: reply || "(no reply)" });
    return { reply: reply || "(no reply)" };
  });

export const getCoachHistory = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("chat_messages").select("id, role, content, created_at")
      .order("created_at", { ascending: true }).limit(100);
    if (error) throw error;
    return { messages: data ?? [] };
  });

export const getTodaysPlan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const ctx = await buildUserContext(supabase, userId);
    const messages = [
      {
        role: "system",
        content: `You are Aurora. Generate a SHORT "Today's Plan" for the user — max 6 bullet points covering the morning, workout focus (target their WEAK muscles or rest if overtrained), sleep window, top 2 priority tasks/habits, and one mindset cue. Use the live user context below. Be concrete (times, set counts, minute counts). 110 words max. Markdown bullets only — no preamble.

CONTEXT:
${summaryPrompt(ctx)}`,
      },
      { role: "user", content: "Generate my Today's Plan." },
    ];
    const plan = await callGateway(messages);
    return { plan: plan || "Could not generate a plan right now.", dailyScore: ctx.dailyScore };
  });

export const getDailyTip = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const today = new Date().toISOString().slice(0, 10);

    // Return cached tip for today if it exists
    const { data: cached } = await supabase
      .from("daily_tips")
      .select("tip")
      .eq("user_id", userId)
      .eq("tip_date", today)
      .maybeSingle();
    if (cached?.tip) return { tip: cached.tip as string, cached: true };

    const ctx = await buildUserContext(supabase, userId);
    const messages = [
      {
        role: "system",
        content: `You are Aurora. Produce ONE punchy, data-driven daily tip (≤180 chars, plain text, no markdown, no emoji). Tie it to the user's weakest signal right now — Red sleep, weak muscle group, missed habit, low daily score, or overdue goal. Address the user directly. No preamble.

CONTEXT:
${summaryPrompt(ctx)}`,
      },
      { role: "user", content: "Give me today's tip." },
    ];
    const raw = await callGateway(messages);
    const tip = (raw || "Stay consistent — small reps compound.").trim().slice(0, 280);
    await supabase.from("daily_tips").insert({ user_id: userId, tip_date: today, tip });
    return { tip, cached: false };
  });
