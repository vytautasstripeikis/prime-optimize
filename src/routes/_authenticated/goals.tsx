import { createFileRoute } from "@tanstack/react-router";
import { safeErrorMessage } from "@/lib/safe-error";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Check, ChevronDown, ChevronUp, Plus, Target, Trash2, Trophy, Calendar, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";

export const Route = createFileRoute("/_authenticated/goals")({
  component: GoalsPage,
});

type Goal = Tables<"goals">;
type Milestone = Tables<"milestones">;

const TIMEFRAMES = ["daily", "weekly", "monthly", "short", "long"] as const;
const tfLabel: Record<string, string> = {
  daily: "Daily", weekly: "Weekly", monthly: "Monthly", short: "Short-term", long: "Long-term",
};
const PRIORITY_COLOR: Record<string, string> = {
  low: "text-emerald-400 bg-emerald-500/10",
  medium: "text-amber-400 bg-amber-500/10",
  high: "text-rose-400 bg-rose-500/10",
};

function GoalsPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [filter, setFilter] = useState<string>("all");
  const [creating, setCreating] = useState(false);

  const { data: goals = [] } = useQuery({
    queryKey: ["goals", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("goals").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data as Goal[];
    },
  });

  const { data: milestones = [] } = useQuery({
    queryKey: ["milestones", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("milestones").select("*").order("sort_order");
      if (error) throw error;
      return data as Milestone[];
    },
  });

  const create = useMutation({
    mutationFn: async (g: Omit<TablesInsert<"goals">, "user_id">) => {
      const { error } = await supabase.from("goals").insert({ ...g, user_id: user!.id });
      if (error) throw error;
    },
    onSuccess: () => { setCreating(false); qc.invalidateQueries({ queryKey: ["goals"] }); },
    onError: (e) => toast.error(safeErrorMessage(e)),
  });

  const filtered = filter === "all" ? goals : goals.filter((g) => g.timeframe === filter);
  const active = goals.filter((g) => g.status === "active").length;
  const completed = goals.filter((g) => g.status === "completed").length;
  const avgProgress = goals.length ? Math.round(goals.reduce((a, g) => a + g.progress, 0) / goals.length) : 0;

  return (
    <div className="max-w-5xl mx-auto px-5 md:px-8 py-6 md:py-10 space-y-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold flex items-center gap-3"><Target className="size-7 text-success" /> Goals</h1>
          <p className="text-muted-foreground mt-1">Define them, break them down, ship them.</p>
        </div>
        <button onClick={() => setCreating(true)} className="flex items-center gap-2 bg-success hover:bg-success/90 text-success-foreground px-4 py-3 min-h-[48px] rounded-xl text-sm font-semibold glow">
          <Plus className="size-4" /> New Goal
        </button>
      </motion.div>

      <div className="grid grid-cols-3 gap-3">
        <Stat label="Active" value={active} />
        <Stat label="Completed" value={completed} icon={<Trophy className="size-4 text-amber-400" />} />
        <Stat label="Avg progress" value={`${avgProgress}%`} />
      </div>

      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {(["all", ...TIMEFRAMES] as const).map((t) => (
          <button key={t} onClick={() => setFilter(t)}
            className={`px-3.5 py-2 min-h-[40px] rounded-xl text-xs font-medium whitespace-nowrap transition ${
              filter === t ? "bg-success text-success-foreground" : "glass text-muted-foreground"
            }`}
          >{t === "all" ? "All" : tfLabel[t]}</button>
        ))}
      </div>

      <AnimatePresence>
        {creating && (
          <CreateGoalCard onCancel={() => setCreating(false)} onCreate={(g) => create.mutate(g)} pending={create.isPending} />
        )}
      </AnimatePresence>

      <div className="space-y-3">
        {filtered.length === 0 && !creating && (
          <div className="glass rounded-2xl p-10 text-center">
            <p className="text-sm text-muted-foreground mb-4">No goals yet. Set your first one to start tracking.</p>
            <button onClick={() => setCreating(true)}
              className="bg-success hover:bg-success/90 text-success-foreground px-5 py-3 min-h-[48px] rounded-xl text-sm font-semibold inline-flex items-center gap-2">
              <Plus className="size-4" /> New Goal
            </button>
          </div>
        )}
        <AnimatePresence>
          {filtered.map((g) => (
            <GoalCard key={g.id} goal={g} milestones={milestones.filter((m) => m.goal_id === g.id)} />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

function Stat({ label, value, icon }: { label: string; value: number | string; icon?: React.ReactNode }) {
  return (
    <div className="glass rounded-2xl p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-muted-foreground">{label}</span>
        {icon}
      </div>
      <div className="text-2xl font-display font-bold">{value}</div>
    </div>
  );
}

function CreateGoalCard({ onCancel, onCreate, pending }: {
  onCancel: () => void;
  onCreate: (g: Omit<TablesInsert<"goals">, "user_id">) => void;
  pending: boolean;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [timeframe, setTimeframe] = useState<typeof TIMEFRAMES[number]>("monthly");
  const [target_date, setTargetDate] = useState("");

  const submit = () => {
    if (!title.trim()) return toast.error("Title required");
    onCreate({
      title: title.trim(),
      description: description.trim() || null,
      timeframe,
      target_date: target_date || null,
    });
  };

  return (
    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
      <div className="glass rounded-3xl p-5 space-y-3">
        <input autoFocus placeholder="What's the goal?" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full glass rounded-xl px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary" />
        <textarea placeholder="Why does this matter? (optional)" value={description} onChange={(e) => setDescription(e.target.value)} className="w-full glass rounded-xl px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary min-h-16" />
        <div className="flex flex-wrap gap-2 items-center">
          <div className="flex gap-1">
            {TIMEFRAMES.map((t) => (
              <button key={t} onClick={() => setTimeframe(t)} className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize ${timeframe === t ? "bg-success/20 text-success ring-1 ring-success/40" : "glass text-muted-foreground"}`}>{tfLabel[t]}</button>
            ))}
          </div>
          <input type="date" value={target_date} onChange={(e) => setTargetDate(e.target.value)} className="glass rounded-lg px-3 py-1.5 text-xs outline-none" />
        </div>
        <div className="flex gap-2 justify-end">
          <button onClick={onCancel} className="px-4 py-2 rounded-xl text-sm text-muted-foreground hover:bg-white/5">Cancel</button>
          <button onClick={submit} disabled={pending} className="flex items-center gap-2 bg-[image:var(--gradient-primary)] text-primary-foreground px-4 py-2 rounded-xl text-sm font-medium disabled:opacity-60">
            {pending && <Loader2 className="size-3.5 animate-spin" />} Create
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function GoalCard({ goal, milestones }: { goal: Goal; milestones: Milestone[] }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [newMs, setNewMs] = useState("");

  const completedMs = milestones.filter((m) => m.completed).length;
  const progress = milestones.length
    ? Math.round((completedMs / milestones.length) * 100)
    : goal.progress;

  const updateGoal = useMutation({
    mutationFn: async (patch: Partial<Goal>) => {
      const { error } = await supabase.from("goals").update(patch).eq("id", goal.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["goals"] }),
  });

  const remove = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("goals").delete().eq("id", goal.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["goals"] }),
  });

  const addMs = useMutation({
    mutationFn: async (title: string) => {
      const { error } = await supabase.from("milestones").insert({
        user_id: user!.id, goal_id: goal.id, title, sort_order: milestones.length,
      });
      if (error) throw error;
    },
    onSuccess: () => { setNewMs(""); qc.invalidateQueries({ queryKey: ["milestones"] }); },
  });

  const toggleMs = useMutation({
    mutationFn: async (m: Milestone) => {
      const { error } = await supabase.from("milestones").update({
        completed: !m.completed,
        completed_at: !m.completed ? new Date().toISOString() : null,
      }).eq("id", m.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["milestones"] }),
  });

  const removeMs = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("milestones").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["milestones"] }),
  });

  const isComplete = goal.status === "completed";

  return (
    <motion.div layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -10 }}
      className="glass rounded-3xl p-5">
      <div className="flex items-start gap-3">
        <button
          onClick={() => updateGoal.mutate({
            status: isComplete ? "active" : "completed",
            progress: isComplete ? progress : 100,
            completed_at: isComplete ? null : new Date().toISOString(),
          })}
          className={`size-7 rounded-lg grid place-items-center shrink-0 transition ${isComplete ? "bg-[image:var(--gradient-primary)]" : "border border-border hover:border-primary"}`}
        >
          {isComplete && <Check className="size-4 text-primary-foreground" />}
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className={`font-display font-semibold text-base ${isComplete ? "line-through text-muted-foreground" : ""}`}>{goal.title}</h3>
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{tfLabel[goal.timeframe] ?? goal.timeframe}</span>
            <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-md ${PRIORITY_COLOR[goal.priority] ?? ""}`}>{goal.priority}</span>
            {goal.target_date && <span className="text-[10px] text-muted-foreground flex items-center gap-1"><Calendar className="size-3" />{goal.target_date}</span>}
          </div>
          {goal.description && <p className="text-sm text-muted-foreground mt-1">{goal.description}</p>}
          <div className="mt-3 flex items-center gap-3">
            <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
              <motion.div initial={false} animate={{ width: `${progress}%` }} transition={{ type: "spring", stiffness: 120, damping: 20 }}
                className="h-full bg-[image:var(--gradient-primary)]" />
            </div>
            <span className="text-xs font-semibold text-primary-glow w-10 text-right">{progress}%</span>
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <button onClick={() => setOpen(!open)} className="p-1.5 rounded-lg hover:bg-white/5 text-muted-foreground">
            {open ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
          </button>
          <button onClick={() => remove.mutate()} className="p-1.5 rounded-lg hover:bg-white/5 text-muted-foreground">
            <Trash2 className="size-4" />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden mt-4 border-t border-border/50 pt-4">
            <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Milestones</div>
            <div className="space-y-1.5 mb-3">
              {milestones.map((m) => (
                <div key={m.id} className="flex items-center gap-2 group">
                  <button onClick={() => toggleMs.mutate(m)}
                    className={`size-5 rounded-md grid place-items-center shrink-0 transition ${m.completed ? "bg-[image:var(--gradient-primary)]" : "border border-border hover:border-primary"}`}>
                    {m.completed && <Check className="size-3 text-primary-foreground" />}
                  </button>
                  <span className={`flex-1 text-sm ${m.completed ? "line-through text-muted-foreground" : ""}`}>{m.title}</span>
                  <button onClick={() => removeMs.mutate(m.id)} className="opacity-0 group-hover:opacity-100 p-1 rounded text-muted-foreground hover:text-destructive">
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              ))}
              {milestones.length === 0 && <div className="text-xs text-muted-foreground">No milestones yet.</div>}
            </div>
            <div className="flex gap-2">
              <input value={newMs} onChange={(e) => setNewMs(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && newMs.trim()) addMs.mutate(newMs.trim()); }}
                placeholder="Add a milestone…"
                className="flex-1 glass rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary" />
              <button onClick={() => newMs.trim() && addMs.mutate(newMs.trim())}
                className="px-3 py-2 rounded-lg bg-primary/20 text-primary-glow text-sm hover:bg-primary/30">
                <Plus className="size-4" />
              </button>
            </div>

            <div className="mt-4">
              <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Manual progress</div>
              <input type="range" min={0} max={100} step={5} value={progress}
                onChange={(e) => updateGoal.mutate({ progress: Number(e.target.value) })}
                className="w-full accent-primary" disabled={milestones.length > 0} />
              {milestones.length > 0 && <div className="text-[10px] text-muted-foreground mt-1">Auto-calculated from milestones.</div>}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}