import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { motion } from "framer-motion";
import {
  Repeat, ListTodo, Sparkles, CheckCircle2, Dumbbell,
  Droplet, Flame, Moon, Target, AlertTriangle, Calendar, Loader2,
} from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell } from "recharts";
import { format, subDays } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { useProfile } from "@/lib/profile-hooks";
import { scoreStatus, STATUS_HEX, STATUS_TEXT, sleepStatus } from "@/lib/score";
import { getTodaysPlan } from "@/lib/coach.functions";
import { getDailyTip } from "@/lib/coach.functions";
import { computeDailyNeeds } from "@/lib/needs";
import { useState } from "react";
import { useEffect } from "react";
import { toast } from "sonner";
import { safeErrorMessage } from "@/lib/safe-error";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: Dashboard,
});

const todayStr = () => new Date().toISOString().slice(0, 10);
function isDueToday(t: { recurrence: string; recurrence_days: number[] | null }) {
  if (t.recurrence === "daily") return true;
  if (t.recurrence === "weekly") return (t.recurrence_days ?? []).includes(new Date().getDay());
  return false;
}

function computeDayScore(args: {
  habitsPct: number; sleepHours: number; workoutDone: boolean; tasksPct: number;
}) {
  const sleepScore = args.sleepHours >= 7 ? 100 : args.sleepHours >= 6 ? 60 : args.sleepHours > 0 ? 30 : 0;
  return Math.round(args.habitsPct * 0.35 + sleepScore * 0.25 + (args.workoutDone ? 20 : 0) + args.tasksPct * 0.20);
}

function Dashboard() {
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const qc = useQueryClient();
  const today = todayStr();
  const since14 = format(subDays(new Date(), 13), "yyyy-MM-dd");
  const isSunday = new Date().getDay() === 0;

  const { data } = useQuery({
    queryKey: ["dashboard", user?.id],
    queryFn: async () => {
      const [tasksR, completionsR, workoutsR, goalsR, sleepR, bodyR] = await Promise.all([
        supabase.from("tasks").select("*").order("created_at", { ascending: false }).limit(300),
        supabase.from("task_completions").select("task_id, completed_on").gte("completed_on", since14),
        supabase.from("workouts").select("id, name, performed_on, duration_minutes, calories_burned").gte("performed_on", since14),
        supabase.from("goals").select("title, progress, status"),
        supabase.from("sleep_logs").select("slept_on, duration_hours, quality").gte("slept_on", since14),
        supabase.from("body_logs").select("weight_kg, logged_on").order("logged_on", { ascending: false }).limit(30),
      ]);
      return {
        tasks: tasksR.data ?? [], completions: completionsR.data ?? [],
        workouts: workoutsR.data ?? [],
        goals: goalsR.data ?? [], sleep: sleepR.data ?? [],
        body: bodyR.data ?? [],
      };
    },
  });

  const tasks = data?.tasks ?? [];
  const completions = data?.completions ?? [];
  const sleep = data?.sleep ?? [];
  const workoutsAll = data?.workouts ?? [];
  const goals = data?.goals ?? [];

  const recurring = tasks.filter((t) => t.recurrence !== "none" && isDueToday(t));
  const recurringDoneToday = recurring.filter((t) => t.last_completed_date === today).length;
  const habitsPct = recurring.length ? Math.round((recurringDoneToday / recurring.length) * 100) : 0;
  const habitsAtRisk = recurring.filter((t) => t.last_completed_date !== today);

  const oneOffs = tasks.filter((t) => t.recurrence === "none");
  const openTasks = oneOffs.filter((t) => !t.completed);
  const completedToday = oneOffs.filter(
    (t) => t.completed && typeof t.completed_at === "string" && t.completed_at.slice(0, 10) === today,
  );
  const visibleTasks = [...openTasks, ...completedToday];
  const doneTasks = oneOffs.filter((t) => t.completed).length;
  const tasksPct = (doneTasks + openTasks.length) > 0
    ? Math.round((doneTasks / (doneTasks + openTasks.length)) * 100) : 100;

  const sleepToday = sleep.find((s) => s.slept_on === today);
  const sleepHoursToday = Number(sleepToday?.duration_hours ?? 0);
  const avg7Sleep = (() => {
    const last7 = sleep.filter((s) => s.slept_on >= format(subDays(new Date(), 6), "yyyy-MM-dd"));
    return last7.length ? last7.reduce((a, s) => a + Number(s.duration_hours ?? 0), 0) / last7.length : 0;
  })();

  const workoutToday = workoutsAll.some((w) => w.performed_on === today);
  const dailyScore = computeDayScore({ habitsPct, sleepHours: sleepHoursToday || avg7Sleep, workoutDone: workoutToday, tasksPct });
  const status = scoreStatus(dailyScore);
  const activeGoals = goals.filter((g) => g.status === "active");

  // 7-day performance bars
  const weekTrend = Array.from({ length: 7 }, (_, i) => {
    const d = subDays(new Date(), 6 - i);
    const ds = format(d, "yyyy-MM-dd");
    const dueRoutines = tasks.filter((t) => t.recurrence !== "none");
    const doneCount = dueRoutines.filter((t) =>
      completions.some((c) => c.task_id === t.id && c.completed_on === ds)
    ).length;
    const hPct = dueRoutines.length ? (doneCount / dueRoutines.length) * 100 : 0;
    const sl = sleep.find((s) => s.slept_on === ds);
    const slHrs = Number(sl?.duration_hours ?? 0);
    const wDone = workoutsAll.some((w) => w.performed_on === ds);
    const score = computeDayScore({ habitsPct: hPct, sleepHours: slHrs, workoutDone: wDone, tasksPct: 100 });
    return { date: format(d, "EEE"), score, _status: scoreStatus(score) };
  });

  const needs = computeDailyNeeds(profile, data?.body);

  // Weekly report (Sunday only)
  const week7 = weekTrend;
  const avgScoreWeek = Math.round(week7.reduce((s, d) => s + d.score, 0) / 7);
  const workoutsThisWeek = workoutsAll.filter((w) => w.performed_on >= format(subDays(new Date(), 6), "yyyy-MM-dd")).length;

  const displayName: string =
    (profile as { full_name?: string; display_name?: string } | undefined)?.full_name?.trim() ||
    (profile as { full_name?: string; display_name?: string } | undefined)?.display_name?.trim() ||
    user?.email?.split("@")[0] ||
    "there";

  const completeRoutine = useMutation({
    mutationFn: async (taskId: string) => {
      const { error: ce } = await supabase
        .from("task_completions")
        .insert({ task_id: taskId, user_id: user!.id, completed_on: today });
      if (ce && !String(ce.message).toLowerCase().includes("duplicate")) throw ce;
      const { error: ue } = await supabase
        .from("tasks")
        .update({ last_completed_date: today })
        .eq("id", taskId);
      if (ue) throw ue;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["dashboard"] }),
    onError: (e) => toast.error(safeErrorMessage(e)),
  });

  const completeTask = useMutation({
    mutationFn: async (taskId: string) => {
      const { error } = await supabase.from("tasks")
        .update({ completed: true, completed_at: new Date().toISOString() })
        .eq("id", taskId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["dashboard"] }),
    onError: (e) => toast.error(safeErrorMessage(e)),
  });

  return (
    <div className="max-w-6xl mx-auto px-5 md:px-8 py-6 md:py-10 space-y-6">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl md:text-4xl font-bold text-white">
          Hey, {displayName}
        </h1>
        <p className="text-muted-foreground mt-1">Here's how today is shaping up.</p>
      </motion.div>

      {/* Daily Score hero + breakdown */}
      <div className="grid lg:grid-cols-3 gap-4 md:gap-6">
        <DailyScoreRing score={dailyScore} status={status} />
        <div className="lg:col-span-2 grid grid-cols-2 gap-3 md:gap-4">
          <BreakdownTile label="Habits" value={`${habitsPct}%`} icon={Repeat} status={scoreStatus(habitsPct)} hint={`${recurringDoneToday}/${recurring.length} done`} />
          <BreakdownTile label="Sleep" value={sleepHoursToday > 0 ? `${sleepHoursToday.toFixed(1)}h` : avg7Sleep > 0 ? `${avg7Sleep.toFixed(1)}h` : "—"}
            icon={Moon} status={sleepStatus(sleepHoursToday || avg7Sleep)} hint={sleepHoursToday > 0 ? "Last night" : "7d avg"} />
          <BreakdownTile label="Workout" value={workoutToday ? "Done" : "Not Yet"} icon={Dumbbell}
            status={workoutToday ? "good" : "warn"} hint={workoutToday ? "Logged today" : "Log a session"} />
          <BreakdownTile label="Tasks" value={`${tasksPct}%`} icon={ListTodo} status={scoreStatus(tasksPct)} hint={`${openTasks.length} open`} />
        </div>
      </div>

      {/* AI Today's Plan */}
      <TodaysPlanCard />

      {/* AI Daily Tip */}
      <DailyTipStrip />

      {/* Weekly performance graph */}
      <Panel title="Weekly Performance">
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={weekTrend}>
            <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 0.06)" />
            <XAxis dataKey="date" tick={{ fill: "oklch(0.7 0.01 260)", fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "oklch(0.7 0.01 260)", fontSize: 10 }} domain={[0, 100]} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ background: "oklch(0.16 0.008 260)", border: "1px solid oklch(1 0 0 / 0.1)", borderRadius: 12, fontSize: 12 }} />
            <Bar dataKey="score" radius={[8, 8, 0, 0]}>
              {weekTrend.map((d, i) => <Cell key={i} fill={STATUS_HEX[d._status]} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Panel>

      {/* Streaks at risk */}
      {habitsAtRisk.length > 0 && (
        <Panel
          title="Streaks at Risk"
          right={<span className="text-xs text-warning flex items-center gap-1"><AlertTriangle className="size-3" />{habitsAtRisk.length} not done today</span>}
        >
          <div className="space-y-2">
            {habitsAtRisk.slice(0, 6).map((t) => (
              <div key={t.id} className="flex items-center gap-3 py-2 border-l-2 border-warning pl-3 bg-warning/5 rounded">
                <span className="flex-1 text-sm">{t.title}</span>
                <span className="text-xs text-warning">Pending</span>
              </div>
            ))}
          </div>
        </Panel>
      )}

      {/* Weekly report (Sunday only) */}
      {isSunday && (
        <Panel title="Weekly Report" right={<span className="text-xs text-muted-foreground flex items-center gap-1"><Calendar className="size-3" />Sunday</span>}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <MiniStat label="Avg Score" value={`${avgScoreWeek}`} status={scoreStatus(avgScoreWeek)} />
            <MiniStat label="Workouts" value={`${workoutsThisWeek}`} status={workoutsThisWeek >= 3 ? "good" : workoutsThisWeek >= 1 ? "warn" : "bad"} />
            <MiniStat label="Sleep Avg" value={`${avg7Sleep.toFixed(1)}h`} status={sleepStatus(avg7Sleep)} />
            <MiniStat label="Goals Active" value={`${activeGoals.length}`} status="good" />
          </div>
          <p className="text-sm text-muted-foreground">
            Use the AI Coach to get a full breakdown and a plan for the week ahead.{" "}
            <Link to="/coach" className="text-success underline">Open Coach →</Link>
          </p>
        </Panel>
      )}

      {/* Quick health tiles */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <QuickTile to="/body" label="Calories" icon={Flame}
          primary={needs.calories != null ? `${needs.calories}` : "—"}
          secondary="Auto target / day" />
        <QuickTile to="/body" label="Water" icon={Droplet}
          primary={needs.waterMl != null ? `${needs.waterMl}` : "—"} suffix=" ml"
          secondary="Auto target / day" />
        <QuickTile to="/workouts" label="Workouts" icon={Dumbbell}
          primary={`${workoutsAll.filter((w) => w.performed_on === today).length}`}
          secondary={workoutToday ? "Today done" : "None yet"} />
        <QuickTile to="/wellness" label="Sleep" icon={Moon}
          primary={sleepHoursToday > 0 ? sleepHoursToday.toFixed(1) : avg7Sleep > 0 ? avg7Sleep.toFixed(1) : "—"}
          suffix="h" secondary={sleepHoursToday > 0 ? "Last night" : "7d avg"} />
      </div>

      {/* Today's routines & open tasks */}
      <div className="grid lg:grid-cols-3 gap-6">
        <Panel className="lg:col-span-2" title="Today's Routines" right={<Link to="/tasks" className="text-xs text-success">Manage →</Link>}>
          {recurring.length === 0 ? (
            <Empty>No routines for today. <Link to="/tasks" className="text-success">Create one →</Link></Empty>
          ) : (
            <div className="space-y-2">
              {recurring.slice(0, 5).map((t) => {
                const done = t.last_completed_date === today;
                return (
                  <button key={t.id} onClick={() => !done && completeRoutine.mutate(t.id)} disabled={done}
                    className="w-full flex items-center gap-3 py-2 px-2 min-h-[48px] rounded-xl hover:bg-white/5 transition text-left disabled:opacity-70">
                    <span className={`size-6 rounded-lg grid place-items-center shrink-0 transition ${done ? "bg-success" : "border-2 border-warning/60 hover:border-success"}`}>
                      {done && <CheckCircle2 className="size-3.5 text-success-foreground" />}
                    </span>
                    <span className={`flex-1 text-sm ${done ? "line-through text-muted-foreground" : ""}`}>{t.title}</span>
                  </button>
                );
              })}
            </div>
          )}
        </Panel>

        <Panel title="Open Tasks">
          {visibleTasks.length === 0 ? (
            <Empty>All clear ✨</Empty>
          ) : (
            <div className="space-y-2">
              {visibleTasks.slice(0, 8).map((t) => {
                const done = !!t.completed;
                return (
                  <button key={t.id} onClick={() => !done && completeTask.mutate(t.id)} disabled={done}
                    className={`w-full flex items-center gap-3 py-2 px-2 min-h-[48px] rounded-xl text-left transition ${done ? "opacity-60" : "hover:bg-white/5"}`}>
                    <span className={`size-6 rounded-lg grid place-items-center shrink-0 transition ${done ? "bg-success" : "border-2 border-success/60 hover:border-success hover:bg-success/10"}`}>
                      {done && <CheckCircle2 className="size-3.5 text-success-foreground" />}
                    </span>
                    <span className={`flex-1 text-sm truncate ${done ? "line-through text-muted-foreground" : ""}`}>{t.title}</span>
                  </button>
                );
              })}
            </div>
          )}
        </Panel>
      </div>

      {activeGoals.length > 0 && (
        <Panel title="Active Goals" right={<Link to="/goals" className="text-xs text-success">All Goals →</Link>}>
          <div className="space-y-3">
            {activeGoals.slice(0, 6).map((g) => {
              const s = scoreStatus(g.progress);
              return (
                <div key={g.title}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="truncate flex items-center gap-2"><Target className="size-3" />{g.title}</span>
                    <span className={STATUS_TEXT[s]}>{g.progress}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${g.progress}%` }}
                      transition={{ duration: 0.6 }} className="h-full"
                      style={{ background: STATUS_HEX[s] }} />
                  </div>
                </div>
              );
            })}
          </div>
        </Panel>
      )}

      {/* Coach CTA */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        className="glass rounded-3xl p-5 md:p-6 flex flex-col md:flex-row md:items-center gap-4">
        <div className="size-12 rounded-2xl bg-success grid place-items-center glow shrink-0">
          <Sparkles className="size-6 text-success-foreground" />
        </div>
        <div className="flex-1">
          <h3 className="font-display font-semibold">Talk to Your AI Coach</h3>
          <p className="text-sm text-muted-foreground">Ask for a plan, a pep talk, or insights from your data.</p>
        </div>
        <Link to="/coach" className="bg-success hover:bg-success/90 text-success-foreground px-5 py-3 min-h-[48px] rounded-xl text-sm font-semibold text-center">
          Open Coach
        </Link>
      </motion.div>
    </div>
  );
}

/* ============ subcomponents ============ */

function DailyScoreRing({ score, status }: { score: number; status: "good" | "warn" | "bad" }) {
  const color = STATUS_HEX[status];
  const r = 70;
  const C = 2 * Math.PI * r;
  const offset = C - (score / 100) * C;
  const label = status === "good" ? "Excellent" : status === "warn" ? "Keep Going" : "Push Harder";
  return (
    <div className="glass rounded-3xl p-6 flex flex-col items-center justify-center">
      <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Daily Score</div>
      <div className="relative size-44">
        <svg viewBox="0 0 160 160" className="size-full -rotate-90">
          <circle cx="80" cy="80" r={r} stroke="oklch(1 0 0 / 0.08)" strokeWidth="14" fill="none" />
          <motion.circle
            cx="80" cy="80" r={r}
            stroke={color} strokeWidth="14" fill="none" strokeLinecap="round"
            strokeDasharray={C}
            initial={{ strokeDashoffset: C }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
        </svg>
        <div className="absolute inset-0 grid place-items-center flex-col">
          <div className="text-center">
            <div className="font-display font-bold text-5xl leading-none" style={{ color }}>{score}</div>
            <div className="text-[10px] text-muted-foreground mt-1">/ 100</div>
          </div>
        </div>
      </div>
      <div className="mt-3 text-sm font-semibold" style={{ color }}>{label}</div>
    </div>
  );
}

function BreakdownTile({ label, value, icon: Icon, status, hint }: {
  label: string; value: string; icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  status: "good" | "warn" | "bad"; hint: string;
}) {
  return (
    <div className="glass rounded-2xl p-4 md:p-5">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-muted-foreground">{label}</span>
        <Icon className="size-4" style={{ color: STATUS_HEX[status] }} />
      </div>
      <div className="text-xl md:text-2xl font-display font-bold" style={{ color: STATUS_HEX[status] }}>{value}</div>
      <div className="text-[10px] text-muted-foreground mt-1">{hint}</div>
    </div>
  );
}

function MiniStat({ label, value, status }: { label: string; value: string; status: "good" | "warn" | "bad" }) {
  return (
    <div className="bg-white/[0.02] rounded-xl p-3 border border-border/40">
      <div className="text-[10px] uppercase text-muted-foreground">{label}</div>
      <div className="font-display font-bold text-lg" style={{ color: STATUS_HEX[status] }}>{value}</div>
    </div>
  );
}

function QuickTile({ to, label, icon: Icon, primary, suffix, secondary, progress }: {
  to: string; label: string; icon: React.ComponentType<{ className?: string }>;
  primary: string; suffix?: string; secondary: string; progress?: number;
}) {
  return (
    <Link to={to}>
      <motion.div whileHover={{ y: -2 }} className="glass rounded-2xl p-4 h-full">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] text-muted-foreground">{label}</span>
          <Icon className="size-4 text-success" />
        </div>
        <div className="text-xl font-display font-bold">
          {primary}<span className="text-xs text-muted-foreground font-normal">{suffix}</span>
        </div>
        <div className="text-[10px] text-muted-foreground mb-2 truncate">{secondary}</div>
        {progress != null && (
          <div className="h-1 rounded-full bg-white/5 overflow-hidden">
            <div className="h-full bg-success" style={{ width: `${progress}%` }} />
          </div>
        )}
      </motion.div>
    </Link>
  );
}

function Panel({ title, right, className = "", children }: { title: string; right?: React.ReactNode; className?: string; children: React.ReactNode }) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      className={`glass rounded-3xl p-5 md:p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display font-semibold text-lg">{title}</h2>
        {right}
      </div>
      {children}
    </motion.div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <div className="text-sm text-muted-foreground text-center py-6">{children}</div>;
}

function TodaysPlanCard() {
  const fetchPlan = useServerFn(getTodaysPlan);
  const [plan, setPlan] = useState<string | null>(null);
  const mut = useMutation({
    mutationFn: () => fetchPlan(),
    onSuccess: (r) => setPlan(r.plan),
    onError: (e) => toast.error(safeErrorMessage(e)),
  });
  return (
    <div className="glass rounded-3xl p-5 md:p-6">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="font-display font-semibold text-lg flex items-center gap-2">
            <Sparkles className="size-4 text-success" /> Today's Plan
          </h2>
          <p className="text-xs text-muted-foreground">Generated by Aurora from your latest data.</p>
        </div>
        <button
          onClick={() => mut.mutate()} disabled={mut.isPending}
          className="bg-success hover:bg-success/90 text-success-foreground px-4 py-2.5 min-h-[40px] rounded-xl text-xs font-semibold inline-flex items-center gap-2 disabled:opacity-50"
        >
          {mut.isPending ? <Loader2 className="size-3.5 animate-spin" /> : <Sparkles className="size-3.5" />}
          {plan ? "Regenerate" : "Generate"}
        </button>
      </div>
      {plan ? (
        <div className="text-sm whitespace-pre-wrap leading-relaxed">{plan}</div>
      ) : (
        <div className="text-sm text-muted-foreground">
          Tap <span className="text-success font-medium">Generate</span> to get a personal AI plan based on yesterday's score, sleep, and weak spots.
        </div>
      )}
    </div>
  );
}

function DailyTipStrip() {
  const fetchTip = useServerFn(getDailyTip);
  const [tip, setTip] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let alive = true;
    fetchTip()
      .then((r) => { if (alive) setTip(r.tip); })
      .catch(() => { if (alive) setTip(null); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [fetchTip]);
  if (loading) {
    return (
      <div className="glass rounded-2xl px-4 py-3 flex items-center gap-3">
        <Loader2 className="size-4 text-success animate-spin shrink-0" />
        <span className="text-sm text-muted-foreground">Aurora is reading your data…</span>
      </div>
    );
  }
  if (!tip) return null;
  return (
    <div className="glass rounded-2xl px-4 py-3 flex items-start gap-3 border-l-2 border-success">
      <Sparkles className="size-4 text-success shrink-0 mt-0.5" />
      <span className="text-sm leading-relaxed">{tip}</span>
    </div>
  );
}
