import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
  BarChart, Bar, PieChart, Pie, Cell, Legend,
} from "recharts";
import { format, subDays } from "date-fns";
import { Flame, TrendingUp, Target, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/_authenticated/analytics")({
  component: AnalyticsPage,
});

interface Task {
  id: string; title: string; completed: boolean; recurrence: string;
  recurrence_days: number[]; last_completed_date: string | null; category: string;
  priority: string; estimated_minutes: number | null;
}
interface Completion { task_id: string; completed_on: string }

const PIE_COLORS = ["#6366f1", "#8b5cf6", "#06b6d4", "#10b981", "#f59e0b", "#ef4444"];

function AnalyticsPage() {
  const { user } = useAuth();
  const since30 = format(subDays(new Date(), 29), "yyyy-MM-dd");

  const { data } = useQuery({
    queryKey: ["analytics", user?.id],
    queryFn: async () => {
      const [{ data: tasks }, { data: completions }, { data: goals }] = await Promise.all([
        supabase.from("tasks").select("*"),
        supabase.from("task_completions").select("task_id, completed_on").gte("completed_on", since30),
        supabase.from("goals").select("title, progress, status, priority"),
      ]);
      return {
        tasks: (tasks ?? []) as Task[],
        completions: (completions ?? []) as Completion[],
        goals: (goals ?? []) as { title: string; progress: number; status: string; priority: string }[],
      };
    },
  });

  const tasks = data?.tasks ?? [];
  const completions = data?.completions ?? [];
  const goals = data?.goals ?? [];

  // 30-day completion trend
  const trend = Array.from({ length: 30 }, (_, i) => {
    const d = subDays(new Date(), 29 - i);
    const ds = format(d, "yyyy-MM-dd");
    const c = completions.filter((x) => x.completed_on === ds).length;
    return { date: format(d, "MMM d"), count: c };
  });

  // Category distribution
  const catCounts = tasks.reduce<Record<string, number>>((acc, t) => {
    acc[t.category] = (acc[t.category] ?? 0) + 1;
    return acc;
  }, {});
  const catData = Object.entries(catCounts).map(([name, value]) => ({ name, value }));

  // Routine streaks
  const routines = tasks.filter((t) => t.recurrence !== "none");
  const streaks = routines.map((r) => {
    let streak = 0;
    for (let i = 0; ; i++) {
      const d = format(subDays(new Date(), i), "yyyy-MM-dd");
      if (completions.some((c) => c.task_id === r.id && c.completed_on === d)) streak++;
      else break;
    }
    return { name: r.title, streak };
  }).sort((a, b) => b.streak - a.streak).slice(0, 8);

  // Heatmap (last 30 days completion intensity)
  const maxDay = Math.max(1, ...trend.map((t) => t.count));

  // Stats
  const total30 = completions.length;
  const avgPerDay = (total30 / 30).toFixed(1);
  const longestStreak = streaks[0]?.streak ?? 0;
  const completedTasks = tasks.filter((t) => t.completed).length;

  // Priority breakdown of open tasks
  const open = tasks.filter((t) => !t.completed && t.recurrence === "none");
  const prioData = ["high", "medium", "low"].map((p) => ({
    priority: p,
    count: open.filter((t) => t.priority === p).length,
  }));

  return (
    <div className="max-w-6xl mx-auto px-5 md:px-8 py-6 md:py-10 space-y-6">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl md:text-4xl font-bold">Analytics</h1>
        <p className="text-muted-foreground mt-1">Your last 30 days, visualized.</p>
      </motion.div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Stat icon={CheckCircle2} label="Completions (30d)" value={total30} />
        <Stat icon={TrendingUp} label="Avg / day" value={avgPerDay} />
        <Stat icon={Flame} label="Longest streak" value={longestStreak} suffix=" days" />
        <Stat icon={Target} label="Tasks done" value={completedTasks} />
      </div>

      <Panel title="Completion trend (30 days)">
        <ResponsiveContainer width="100%" height={240}>
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
                <div key={d.date}
                  title={`${d.date}: ${d.count}`}
                  className="aspect-square rounded-md transition-colors"
                  style={{
                    background: intensity === 0
                      ? "hsl(var(--muted) / 0.3)"
                      : `hsl(var(--primary) / ${0.15 + intensity * 0.85})`,
                  }}
                />
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
            <Empty msg="Create a routine to start tracking streaks." />
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={streaks} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.3)" />
                <XAxis type="number" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} allowDecimals={false} />
                <YAxis type="category" dataKey="name" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} width={120} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12 }} />
                <Bar dataKey="streak" fill="hsl(var(--primary))" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Panel>

        <Panel title="Tasks by category">
          {catData.length === 0 ? (
            <Empty msg="No tasks yet." />
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={catData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={90} paddingAngle={3}>
                  {catData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Panel>

        <Panel title="Open tasks by priority">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={prioData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.3)" />
              <XAxis dataKey="priority" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
              <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} allowDecimals={false} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12 }} />
              <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                {prioData.map((d, i) => (
                  <Cell key={i} fill={d.priority === "high" ? "#f43f5e" : d.priority === "medium" ? "#f59e0b" : "#10b981"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Panel>
      </div>

      <Panel title="Active goals progress">
        {goals.filter((g) => g.status === "active").length === 0 ? (
          <Empty msg="No active goals." />
        ) : (
          <div className="space-y-3">
            {goals.filter((g) => g.status === "active").map((g) => (
              <div key={g.title}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="truncate">{g.title}</span>
                  <span className="text-muted-foreground">{g.progress}%</span>
                </div>
                <div className="h-2 rounded-full bg-muted/30 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }} animate={{ width: `${g.progress}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="h-full bg-[image:var(--gradient-primary)]"
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}

function Stat({ icon: Icon, label, value, suffix }: { icon: React.ComponentType<{ className?: string }>; label: string; value: number | string; suffix?: string }) {
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

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-3xl p-6">
      <h2 className="font-display font-semibold text-lg mb-5">{title}</h2>
      {children}
    </motion.div>
  );
}

function Empty({ msg }: { msg: string }) {
  return <div className="text-sm text-muted-foreground text-center py-10">{msg}</div>;
}
