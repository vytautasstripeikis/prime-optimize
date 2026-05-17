import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Repeat, ListTodo, Sparkles, TrendingUp, CheckCircle2, Dumbbell, Apple,
  Droplet, Flame, Moon, Smile, Target,
} from "lucide-react";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
  BarChart, Bar, PieChart, Pie, Cell, Legend,
} from "recharts";
import { format, subDays, parseISO } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { useProfile } from "@/lib/profile-hooks";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: Dashboard,
});

const PIE = ["#6366f1", "#8b5cf6", "#06b6d4", "#10b981", "#f59e0b", "#ef4444"];

const todayStr = () => new Date().toISOString().slice(0, 10);
function isDueToday(t: { recurrence: string; recurrence_days: number[] | null }) {
  if (t.recurrence === "daily") return true;
  if (t.recurrence === "weekly") return (t.recurrence_days ?? []).includes(new Date().getDay());
  return false;
}

function Dashboard() {
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const today = todayStr();
  const since30 = format(subDays(new Date(), 29), "yyyy-MM-dd");
  const since14iso = subDays(new Date(), 13).toISOString();

  const { data } = useQuery({
    queryKey: ["dashboard", user?.id],
    queryFn: async () => {
      const [tasksR, completionsR, workoutsR, foodsR, waterR, goalsR, sleepR, moodR] = await Promise.all([
        supabase.from("tasks").select("*").order("created_at", { ascending: false }).limit(300),
        supabase.from("task_completions").select("task_id, completed_on").gte("completed_on", since30),
        supabase.from("workouts").select("id, name, performed_on, duration_minutes, calories_burned").gte("performed_on", since30),
        supabase.from("food_logs").select("calories, protein_g, servings, logged_on"),
        supabase.from("water_logs").select("amount_ml, logged_on"),
        supabase.from("goals").select("title, progress, status"),
        supabase.from("sleep_logs").select("slept_on, duration_hours, quality").gte("slept_on", format(subDays(new Date(), 13), "yyyy-MM-dd")),
        supabase.from("mood_logs").select("logged_at, mood, energy").gte("logged_at", since14iso),
      ]);
      return {
        tasks: tasksR.data ?? [], completions: completionsR.data ?? [],
        workouts: workoutsR.data ?? [], foods: foodsR.data ?? [], water: waterR.data ?? [],
        goals: goalsR.data ?? [], sleep: sleepR.data ?? [], mood: moodR.data ?? [],
      };
    },
  });

  const tasks = data?.tasks ?? [];
  const completions = data?.completions ?? [];
  const recurring = tasks.filter((t) => t.recurrence !== "none" && isDueToday(t));
  const recurringDoneToday = recurring.filter((t) => t.last_completed_date === today).length;
  const recurringPct = recurring.length ? Math.round((recurringDoneToday / recurring.length) * 100) : 0;
  const oneOffs = tasks.filter((t) => t.recurrence === "none");
  const openTasks = oneOffs.filter((t) => !t.completed);
  const tasksDoneToday = oneOffs.filter((t) => t.completed).length;
  const xp = recurringDoneToday * 10 + tasksDoneToday * 15;
  const dailyScore = Math.min(100, recurringPct * 0.6 + Math.min(40, openTasks.length === 0 ? 40 : tasksDoneToday * 10));

  const foodsAll = data?.foods ?? [];
  const waterAll = data?.water ?? [];
  const workoutsAll = data?.workouts ?? [];
  const todayFoods = foodsAll.filter((f) => f.logged_on === today);
  const todayWater = waterAll.filter((w) => w.logged_on === today);
  const workoutsToday = workoutsAll.filter((w) => w.performed_on === today);
  const calToday = todayFoods.reduce((s, f) => s + f.calories * Number(f.servings), 0);
  const proteinToday = todayFoods.reduce((s, f) => s + Number(f.protein_g) * Number(f.servings), 0);
  const waterToday = todayWater.reduce((s, w) => s + w.amount_ml, 0);
  const calorieGoal = profile?.calorie_goal ?? 2200;
  const waterGoal = profile?.water_goal_ml ?? 2500;

  // ---- analytics ----
  const trend = Array.from({ length: 30 }, (_, i) => {
    const d = subDays(new Date(), 29 - i);
    const ds = format(d, "yyyy-MM-dd");
    return { date: format(d, "MMM d"), count: completions.filter((x) => x.completed_on === ds).length };
  });
  const maxDay = Math.max(1, ...trend.map((t) => t.count));
  const total30 = completions.length;

  const routines = tasks.filter((t) => t.recurrence !== "none");
  const streaks = routines.map((r) => {
    let s = 0;
    for (let i = 0; ; i++) {
      const d = format(subDays(new Date(), i), "yyyy-MM-dd");
      if (completions.some((c) => c.task_id === r.id && c.completed_on === d)) s++;
      else break;
    }
    return { name: r.title.length > 18 ? r.title.slice(0, 18) + "…" : r.title, streak: s };
  }).sort((a, b) => b.streak - a.streak).slice(0, 6);
  const longestStreak = streaks[0]?.streak ?? 0;

  const catCounts = tasks.reduce<Record<string, number>>((acc, t) => {
    acc[t.category] = (acc[t.category] ?? 0) + 1; return acc;
  }, {});
  const catData = Object.entries(catCounts).map(([name, value]) => ({ name, value }));

  const sleep = data?.sleep ?? [];
  const avgSleep = sleep.length ? (sleep.reduce((s, l) => s + Number(l.duration_hours ?? 0), 0) / sleep.length).toFixed(1) : "—";
  const sleepTrend = Array.from({ length: 14 }, (_, i) => {
    const d = format(subDays(new Date(), 13 - i), "yyyy-MM-dd");
    const e = sleep.find((s) => s.slept_on === d);
    return { date: format(parseISO(d), "M/d"), hours: e ? Number(e.duration_hours ?? 0) : 0 };
  });

  const mood = data?.mood ?? [];
  const avgMood = mood.length ? (mood.reduce((s, m) => s + m.mood, 0) / mood.length).toFixed(1) : "—";

  const goals = data?.goals ?? [];
  const activeGoals = goals.filter((g) => g.status === "active");

  return (
    <div className="max-w-6xl mx-auto px-5 md:px-8 py-6 md:py-10 space-y-6">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl md:text-4xl font-bold">
          Hey, <span className="text-gradient">{user?.email?.split("@")[0]}</span>
        </h1>
        <p className="text-muted-foreground mt-1">Here's how today is shaping up.</p>
      </motion.div>

      {/* Today scores */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <ScoreCard label="Daily Score" value={Math.round(dailyScore)} suffix="/100" icon={TrendingUp} />
        <ScoreCard label="Routines" value={`${recurringDoneToday}/${recurring.length}`} icon={Repeat} />
        <ScoreCard label="Tasks Open" value={openTasks.length} icon={ListTodo} />
        <ScoreCard label="XP Earned" value={xp} suffix=" xp" icon={Sparkles} />
      </div>

      {/* Health today */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MiniCard to="/workouts" label="Workouts" icon={Dumbbell}
          primary={`${workoutsToday.length}`}
          secondary={workoutsToday.length ? `${workoutsToday.reduce((s, w) => s + (w.duration_minutes ?? 0), 0)} min` : "none"} />
        <MiniCard to="/nutrition" label="Calories" icon={Flame}
          primary={`${Math.round(calToday)}`}
          secondary={`${Math.round(proteinToday)}g protein`}
          progress={Math.min(100, (calToday / calorieGoal) * 100)} />
        <MiniCard to="/nutrition" label="Water" icon={Droplet}
          primary={`${waterToday}`} suffix=" ml" secondary={`goal ${waterGoal}ml`}
          progress={Math.min(100, (waterToday / waterGoal) * 100)} />
        <MiniCard to="/wellness" label="Sleep avg" icon={Moon}
          primary={String(avgSleep)} suffix="h" secondary={`mood ${avgMood}/5`} />
      </div>

      {/* Routines + tasks */}
      <div className="grid lg:grid-cols-3 gap-6">
        <Panel className="lg:col-span-2" title="Today's routines" right={<Link to="/tasks" className="text-xs text-primary-glow">Manage →</Link>}>
          {recurring.length === 0 ? (
            <Empty>No routines for today. <Link to="/tasks" className="text-primary-glow">Create one →</Link></Empty>
          ) : (
            <div className="space-y-2">
              {recurring.slice(0, 8).map((t) => {
                const done = t.last_completed_date === today;
                return (
                  <div key={t.id} className="flex items-center gap-3 py-2">
                    <div className={`size-2.5 rounded-full ${done ? "bg-success" : "bg-muted"}`} />
                    <span className={`flex-1 text-sm ${done ? "" : "text-muted-foreground"}`}>{t.title}</span>
                    {done && <CheckCircle2 className="size-3.5 text-emerald-400" />}
                  </div>
                );
              })}
            </div>
          )}
        </Panel>

        <Panel title="Open tasks">
          {openTasks.length === 0 ? (
            <Empty>All clear ✨</Empty>
          ) : (
            <div className="space-y-2">
              {openTasks.slice(0, 6).map((t) => (
                <div key={t.id} className="flex items-center gap-3 py-1.5">
                  <div className="size-1.5 rounded-full bg-primary-glow" />
                  <span className="flex-1 text-sm truncate">{t.title}</span>
                  <span className="text-[10px] uppercase text-muted-foreground">{t.priority}</span>
                </div>
              ))}
            </div>
          )}
        </Panel>
      </div>

      {/* Analytics merged in */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <ScoreCard label="Completions (30d)" value={total30} icon={CheckCircle2} />
        <ScoreCard label="Avg / day" value={(total30 / 30).toFixed(1)} icon={TrendingUp} />
        <ScoreCard label="Longest streak" value={longestStreak} suffix="d" icon={Flame} />
        <ScoreCard label="Active goals" value={activeGoals.length} icon={Target} />
      </div>

      <Panel title="Completion trend · 30 days">
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={trend}>
            <defs>
              <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.6} />
                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.3)" />
            <XAxis dataKey="date" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} interval={4} />
            <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} allowDecimals={false} />
            <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12 }} />
            <Area type="monotone" dataKey="count" stroke="hsl(var(--primary))" fill="url(#g1)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </Panel>

      <div className="grid lg:grid-cols-2 gap-6">
        <Panel title="30-day activity heatmap">
          <div className="grid grid-cols-10 gap-1.5">
            {trend.map((d) => {
              const intensity = d.count / maxDay;
              return (
                <div key={d.date} title={`${d.date}: ${d.count}`}
                  className="aspect-square rounded-md"
                  style={{ background: intensity === 0 ? "hsl(var(--muted) / 0.3)" : `hsl(var(--primary) / ${0.15 + intensity * 0.85})` }} />
              );
            })}
          </div>
          <div className="text-[10px] text-muted-foreground mt-3 flex items-center gap-2">
            Less
            {[0, 0.25, 0.5, 0.75, 1].map((i) => (
              <div key={i} className="size-3 rounded" style={{ background: i === 0 ? "hsl(var(--muted) / 0.3)" : `hsl(var(--primary) / ${0.15 + i * 0.85})` }} />
            ))}
            More
          </div>
        </Panel>

        <Panel title="Top routine streaks">
          {streaks.length === 0 ? (
            <Empty>Create a routine to start tracking streaks.</Empty>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={streaks} layout="vertical" margin={{ left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.3)" />
                <XAxis type="number" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} allowDecimals={false} />
                <YAxis type="category" dataKey="name" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} width={110} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12 }} />
                <Bar dataKey="streak" fill="hsl(var(--primary))" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Panel>

        <Panel title="Sleep · last 14 days">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={sleepTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.3)" />
              <XAxis dataKey="date" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} />
              <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} domain={[0, 12]} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12 }} />
              <Bar dataKey="hours" fill="hsl(var(--primary-glow))" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Panel>

        <Panel title="Tasks by category">
          {catData.length === 0 ? (
            <Empty>No tasks yet.</Empty>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={catData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={45} outerRadius={80} paddingAngle={3}>
                  {catData.map((_, i) => <Cell key={i} fill={PIE[i % PIE.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Panel>
      </div>

      {activeGoals.length > 0 && (
        <Panel title="Active goals">
          <div className="space-y-3">
            {activeGoals.slice(0, 6).map((g) => (
              <div key={g.title}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="truncate">{g.title}</span>
                  <span className="text-muted-foreground">{g.progress}%</span>
                </div>
                <div className="h-2 rounded-full bg-muted/30 overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${g.progress}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="h-full bg-[image:var(--gradient-primary)]" />
                </div>
              </div>
            ))}
          </div>
        </Panel>
      )}

      {/* AI coach CTA */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        className="glass rounded-3xl p-6 flex flex-col md:flex-row md:items-center gap-4">
        <div className="size-12 rounded-2xl bg-[image:var(--gradient-primary)] grid place-items-center glow shrink-0">
          <Sparkles className="size-6 text-primary-foreground" />
        </div>
        <div className="flex-1">
          <h3 className="font-display font-semibold">Talk to your AI coach</h3>
          <p className="text-sm text-muted-foreground">Ask for a plan, a pep talk, or insights from your data.</p>
        </div>
        <Link to="/coach" className="bg-[image:var(--gradient-primary)] text-primary-foreground px-5 py-2.5 rounded-xl text-sm font-medium text-center">
          Open coach
        </Link>
      </motion.div>
    </div>
  );
}

function ScoreCard({ label, value, suffix, icon: Icon }: { label: string; value: number | string; suffix?: string; icon: React.ComponentType<{ className?: string }> }) {
  return (
    <motion.div whileHover={{ y: -2 }} className="glass rounded-2xl p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-muted-foreground">{label}</span>
        <Icon className="size-4 text-primary-glow" />
      </div>
      <div className="text-2xl md:text-3xl font-display font-bold">
        {value}<span className="text-sm text-muted-foreground font-normal">{suffix}</span>
      </div>
    </motion.div>
  );
}

function MiniCard({ to, label, icon: Icon, primary, suffix, secondary, progress }: { to: string; label: string; icon: React.ComponentType<{ className?: string }>; primary: string; suffix?: string; secondary: string; progress?: number }) {
  return (
    <Link to={to}>
      <motion.div whileHover={{ y: -2 }} className="glass rounded-2xl p-4 h-full">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] text-muted-foreground">{label}</span>
          <Icon className="size-4 text-primary-glow" />
        </div>
        <div className="text-xl font-display font-bold">
          {primary}<span className="text-xs text-muted-foreground font-normal">{suffix}</span>
        </div>
        <div className="text-[10px] text-muted-foreground mb-2 truncate">{secondary}</div>
        {progress != null && (
          <div className="h-1 rounded-full bg-white/5 overflow-hidden">
            <div className="h-full bg-[image:var(--gradient-primary)]" style={{ width: `${progress}%` }} />
          </div>
        )}
      </motion.div>
    </Link>
  );
}

function Panel({ title, right, className = "", children }: { title: string; right?: React.ReactNode; className?: string; children: React.ReactNode }) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      className={`glass rounded-3xl p-6 ${className}`}>
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-display font-semibold text-lg">{title}</h2>
        {right}
      </div>
      {children}
    </motion.div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <div className="text-sm text-muted-foreground text-center py-8">{children}</div>;
}
