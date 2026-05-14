import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Repeat, ListTodo, Sparkles, TrendingUp, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: Dashboard,
});

const todayStr = () => new Date().toISOString().slice(0, 10);

function isDueToday(t: { recurrence: string; recurrence_days: number[] | null }) {
  if (t.recurrence === "daily") return true;
  if (t.recurrence === "weekly") {
    const dow = new Date().getDay();
    return (t.recurrence_days ?? []).includes(dow);
  }
  return false;
}

function Dashboard() {
  const { user } = useAuth();
  const today = todayStr();

  const { data } = useQuery({
    queryKey: ["dashboard", user?.id],
    queryFn: async () => {
      const { data: tasks } = await supabase
        .from("tasks")
        .select("id, title, completed, priority, recurrence, recurrence_days, last_completed_date, created_at")
        .order("created_at", { ascending: false })
        .limit(200);
      return { tasks: tasks ?? [] };
    },
  });

  const tasks = data?.tasks ?? [];
  const recurring = tasks.filter((t) => t.recurrence !== "none" && isDueToday(t));
  const recurringDoneToday = recurring.filter((t) => t.last_completed_date === today).length;
  const recurringPct = recurring.length ? Math.round((recurringDoneToday / recurring.length) * 100) : 0;
  const oneOffs = tasks.filter((t) => t.recurrence === "none");
  const openTasks = oneOffs.filter((t) => !t.completed);
  const tasksDoneToday = oneOffs.filter((t) => t.completed).length;
  const xp = recurringDoneToday * 10 + tasksDoneToday * 15;
  const dailyScore = Math.min(
    100,
    recurringPct * 0.6 + Math.min(40, openTasks.length === 0 ? 40 : tasksDoneToday * 10),
  );

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
        <ScoreCard label="Routines" value={`${recurringDoneToday}/${recurring.length}`} icon={Repeat} />
        <ScoreCard label="Tasks Open" value={openTasks.length} icon={ListTodo} />
        <ScoreCard label="XP Earned" value={xp} suffix=" xp" icon={Sparkles} />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="glass rounded-3xl p-6 lg:col-span-2"
        >
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-display font-semibold text-lg">Today's routines</h2>
            <Link to="/tasks" className="text-xs text-primary-glow">Manage →</Link>
          </div>
          {recurring.length === 0 ? (
            <div className="text-sm text-muted-foreground text-center py-8">
              No routines for today. <Link to="/tasks" className="text-primary-glow">Create a recurring task →</Link>
            </div>
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
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="glass rounded-3xl p-6"
        >
          <h2 className="font-display font-semibold text-lg mb-5">Open tasks</h2>
          {openTasks.length === 0 ? (
            <div className="text-sm text-muted-foreground py-6">All clear ✨</div>
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
