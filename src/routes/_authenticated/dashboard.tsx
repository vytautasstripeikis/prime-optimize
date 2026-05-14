import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Flame, Target, ListTodo, Sparkles, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: Dashboard,
});

function Dashboard() {
  const { user } = useAuth();
  const today = new Date().toISOString().slice(0, 10);
  const since = new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString().slice(0, 10);

  const { data } = useQuery({
    queryKey: ["dashboard", user?.id],
    queryFn: async () => {
      const [h, l, t] = await Promise.all([
        supabase.from("habits").select("id, name, color").eq("archived", false),
        supabase.from("habit_logs").select("habit_id, log_date").gte("log_date", since),
        supabase.from("tasks").select("id, title, completed, priority").order("created_at", { ascending: false }).limit(50),
      ]);
      return { habits: h.data ?? [], logs: l.data ?? [], tasks: t.data ?? [] };
    },
  });

  const habits = data?.habits ?? [];
  const logs = data?.logs ?? [];
  const tasks = data?.tasks ?? [];
  const todayDone = logs.filter((l) => l.log_date === today).length;
  const habitPct = habits.length ? Math.round((todayDone / habits.length) * 100) : 0;
  const openTasks = tasks.filter((t) => !t.completed);
  const tasksDoneToday = tasks.filter((t) => t.completed).length;
  const xp = todayDone * 10 + tasksDoneToday * 15;
  const dailyScore = Math.min(100, habitPct * 0.6 + Math.min(40, openTasks.length === 0 ? 40 : tasksDoneToday * 10));

  // 7-day heatmap
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i));
    const ds = d.toISOString().slice(0, 10);
    const c = logs.filter((l) => l.log_date === ds).length;
    return { ds, c, label: d.toLocaleDateString(undefined, { weekday: "short" }) };
  });
  const maxC = Math.max(1, ...days.map((d) => d.c));

  return (
    <div className="max-w-6xl mx-auto px-5 md:px-8 py-6 md:py-10 space-y-6">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl md:text-4xl font-bold">
          Hey, <span className="text-gradient">{user?.email?.split("@")[0]}</span>
        </h1>
        <p className="text-muted-foreground mt-1">Here's how today is shaping up.</p>
      </motion.div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <ScoreCard label="Daily Score" value={Math.round(dailyScore)} suffix="/100" icon={TrendingUp} />
        <ScoreCard label="Habits Today" value={`${todayDone}/${habits.length}`} icon={Target} />
        <ScoreCard label="Tasks Open" value={openTasks.length} icon={ListTodo} />
        <ScoreCard label="XP Earned" value={xp} suffix=" xp" icon={Sparkles} />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Today's habits */}
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="glass rounded-3xl p-6 lg:col-span-2"
        >
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-display font-semibold text-lg">Today's habits</h2>
            <Link to="/habits" className="text-xs text-primary-glow">Manage →</Link>
          </div>
          {habits.length === 0 ? (
            <div className="text-sm text-muted-foreground text-center py-8">
              No habits yet. <Link to="/habits" className="text-primary-glow">Add your first.</Link>
            </div>
          ) : (
            <div className="space-y-2">
              {habits.slice(0, 6).map((h) => {
                const done = logs.some((l) => l.habit_id === h.id && l.log_date === today);
                return (
                  <div key={h.id} className="flex items-center gap-3 py-2">
                    <div className={`size-2.5 rounded-full ${done ? "bg-success" : "bg-muted"}`} />
                    <span className={`flex-1 text-sm ${done ? "" : "text-muted-foreground"}`}>{h.name}</span>
                    {done && <Flame className="size-3.5 text-amber-400" />}
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>

        {/* 7-day momentum */}
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="glass rounded-3xl p-6"
        >
          <h2 className="font-display font-semibold text-lg mb-5">7-day momentum</h2>
          <div className="flex items-end gap-2 h-32">
            {days.map((d) => (
              <div key={d.ds} className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full flex-1 flex items-end">
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${(d.c / maxC) * 100}%` }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="w-full rounded-t-lg bg-[image:var(--gradient-primary)] min-h-[4px]"
                  />
                </div>
                <span className="text-[10px] text-muted-foreground">{d.label[0]}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
        className="glass rounded-3xl p-6 flex flex-col md:flex-row md:items-center gap-4"
      >
        <div className="size-12 rounded-2xl bg-[image:var(--gradient-primary)] grid place-items-center glow shrink-0">
          <Sparkles className="size-6 text-primary-foreground" />
        </div>
        <div className="flex-1">
          <h3 className="font-display font-semibold">Talk to your AI coach</h3>
          <p className="text-sm text-muted-foreground">Ask for a plan, a pep talk, or insights from your data.</p>
        </div>
        <Link to="/coach" className="bg-[image:var(--gradient-primary)] text-primary-foreground px-5 py-2.5 rounded-xl text-sm font-medium">
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
