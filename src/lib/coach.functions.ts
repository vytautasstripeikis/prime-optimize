import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const sendCoachMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ message: z.string().min(1).max(4000) }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("AI not configured");

    await supabase.from("chat_messages").insert({ user_id: userId, role: "user", content: data.message });

    const today = new Date().toISOString().slice(0, 10);
    const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
    const [
      { data: profile }, { data: tasks }, { data: goals }, { data: history },
      { data: workouts }, { data: foods }, { data: water },
    ] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
      supabase.from("tasks").select("title, priority, completed, due_date, recurrence, last_completed_date").order("created_at", { ascending: false }).limit(40),
      supabase.from("goals").select("title, timeframe, priority, progress, status, target_date").eq("status", "active").limit(20),
      supabase.from("chat_messages").select("role, content").order("created_at", { ascending: false }).limit(10),
      supabase.from("workouts").select("name, type, intensity, duration_minutes, calories_burned, performed_on").gte("performed_on", sevenDaysAgo).order("performed_on", { ascending: false }),
      supabase.from("food_logs").select("name, meal, calories, protein_g, carbs_g, fat_g, servings, logged_on").gte("logged_on", sevenDaysAgo).order("logged_on", { ascending: false }),
      supabase.from("water_logs").select("amount_ml, logged_on").gte("logged_on", sevenDaysAgo),
    ]);

    const p = (profile ?? {}) as Record<string, unknown>;
    const profileBlock = profile ? `Name: ${p.full_name ?? p.display_name ?? "User"}
Age: ${p.age ?? "?"} | Gender: ${p.gender ?? "?"} | Height: ${p.height_cm ?? "?"}cm | Weight: ${p.weight_kg ?? "?"}kg
Fitness: ${p.fitness_level ?? "?"} | Activity: ${p.activity_level ?? "?"}
Sleep target: ${p.sleep_goal_hours ?? "?"}h (${p.sleep_start ?? "?"}–${p.sleep_end ?? "?"}) | Water: ${p.water_goal_ml ?? "?"}ml | Calories: ${p.calorie_goal ?? "?"}
Stress: ${p.stress_level ?? "?"}/10 | Productivity: ${p.productivity_level ?? "?"}/10
Motivation style: ${p.motivation_style ?? "?"} | Personality: ${p.personality_style ?? "?"}
Allergies: ${p.allergies ?? "none"} | Injuries: ${p.injuries ?? "none"}
Career goals: ${p.career_goals ?? "—"}
Financial goals: ${p.financial_goals ?? "—"}
Fitness goals: ${p.fitness_goals ?? "—"}
Routine: ${p.daily_routine ?? "—"} | Schedule: ${p.work_schedule ?? "—"}` : "Profile not set.";

    const allTasks = tasks ?? [];
    const recurring = allTasks.filter((t) => t.recurrence && t.recurrence !== "none");
    const oneOffs = allTasks.filter((t) => !t.recurrence || t.recurrence === "none");

    const contextSummary = `Today: ${today}

PROFILE:
${profileBlock}

ACTIVE GOALS: ${(goals ?? []).map((g) => `${g.title} [${g.timeframe}, ${g.priority}, ${g.progress}%${g.target_date ? `, due ${g.target_date}` : ""}]`).join("; ") || "none"}

Recurring tasks (habits): ${recurring.map((t) => `${t.title} [${t.recurrence}${t.last_completed_date === today ? ", done today" : ""}]`).join("; ") || "none"}
Open one-off tasks: ${oneOffs.filter((t) => !t.completed).map((t) => `${t.title} [${t.priority}]`).join("; ") || "none"}
Completed recently: ${oneOffs.filter((t) => t.completed).length}`;

    const todayFoods = (foods ?? []).filter((f) => f.logged_on === today);
    const todayCal = todayFoods.reduce((s, f) => s + f.calories * Number(f.servings), 0);
    const todayProtein = todayFoods.reduce((s, f) => s + Number(f.protein_g) * Number(f.servings), 0);
    const todayWater = (water ?? []).filter((w) => w.logged_on === today).reduce((s, w) => s + w.amount_ml, 0);
    const healthBlock = `\nWORKOUTS (7d): ${(workouts ?? []).map((w) => `${w.name} [${w.type}, ${w.duration_minutes}m, ${w.performed_on}]`).join("; ") || "none"}\nTODAY NUTRITION: ${Math.round(todayCal)} kcal, ${Math.round(todayProtein)}g protein, ${todayWater}ml water (goal ${p.water_goal_ml ?? 2500}ml, ${p.calorie_goal ?? 2200} kcal)`;

    const messages = [
      {
        role: "system",
        content: `You are Aurora, a warm, sharp, no-fluff AI life optimization coach. Use the user's full profile, goals and tasks to give deeply personal, specific, actionable advice — match their motivation style, respect their injuries/allergies, and tie suggestions back to their stated goals. Keep replies concise (under 220 words), use markdown, occasional emoji. Never invent data not in context.

USER CONTEXT:
${contextSummary}${healthBlock}`,
      },
      ...((history ?? []).reverse().map((m) => ({ role: m.role, content: m.content }))),
    ];

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: "google/gemini-3-flash-preview", messages }),
    });

    if (!res.ok) {
      const txt = await res.text();
      if (res.status === 429) throw new Error("Rate limited. Try again in a moment.");
      if (res.status === 402) throw new Error("AI credits exhausted. Add credits in workspace settings.");
      throw new Error(`AI error: ${txt.slice(0, 200)}`);
    }

    const json = await res.json();
    const reply = json.choices?.[0]?.message?.content ?? "(no reply)";

    await supabase.from("chat_messages").insert({ user_id: userId, role: "assistant", content: reply });
    return { reply };
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
