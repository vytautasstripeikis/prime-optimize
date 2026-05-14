import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Plus, Trash2, Flag, Repeat, CalendarDays, Flame } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/_authenticated/tasks")({
  component: TasksPage,
});

interface Task {
  id: string;
  title: string;
  description: string | null;
  priority: "low" | "medium" | "high";
  completed: boolean;
  due_date: string | null;
  created_at: string;
  recurrence: "none" | "daily" | "weekly";
  recurrence_days: number[];
  last_completed_date: string | null;
}

const priorityColor = {
  low: "text-emerald-400 bg-emerald-500/10",
  medium: "text-amber-400 bg-amber-500/10",
  high: "text-rose-400 bg-rose-500/10",
};

const todayStr = () => new Date().toISOString().slice(0, 10);
const DOW = ["S", "M", "T", "W", "T", "F", "S"];

function isDueToday(t: Task) {
  if (t.recurrence === "daily") return true;
  if (t.recurrence === "weekly") return t.recurrence_days.includes(new Date().getDay());
  return false;
}

function TasksPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");
  const [recurrence, setRecurrence] = useState<"none" | "daily" | "weekly">("none");
  const [weekDays, setWeekDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [tab, setTab] = useState<"today" | "all">("today");

  const { data: tasks = [] } = useQuery({
    queryKey: ["tasks", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tasks").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data as Task[];
    },
  });

  const create = useMutation({
    mutationFn: async () => {
      if (!title.trim()) throw new Error("Title required");
      const { error } = await supabase.from("tasks").insert({
        user_id: user!.id,
        title: title.trim(),
        priority,
        recurrence,
        recurrence_days: recurrence === "weekly" ? weekDays : [],
      });
      if (error) throw error;
    },
    onSuccess: () => { setTitle(""); qc.invalidateQueries({ queryKey: ["tasks"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggle = useMutation({
    mutationFn: async (t: Task) => {
      if (t.recurrence !== "none") {
        const isDone = t.last_completed_date === todayStr();
        const { error } = await supabase.from("tasks")
          .update({ last_completed_date: isDone ? null : todayStr() })
          .eq("id", t.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("tasks").update({
          completed: !t.completed,
          completed_at: !t.completed ? new Date().toISOString() : null,
        }).eq("id", t.id);
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks"] }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("tasks").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks"] }),
  });

  const recurring = tasks.filter((t) => t.recurrence !== "none");
  const oneOffs = tasks.filter((t) => t.recurrence === "none");
  const open = oneOffs.filter((t) => !t.completed);
  const done = oneOffs.filter((t) => t.completed);
  const todayRoutines = recurring.filter(isDueToday);

  return (
    <div className="max-w-5xl mx-auto px-5 md:px-8 py-6 md:py-10">
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold">Tasks &amp; Routines</h1>
        <p className="text-muted-foreground mt-1">One-off tasks and recurring habits, in one place.</p>
      </div>

      <div className="glass rounded-3xl p-5 mb-6 space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && create.mutate()}
            placeholder={recurrence === "none" ? "What needs to get done?" : "New routine, e.g. Read 20 pages"}
            className="flex-1 glass rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary"
          />
          <div className="flex gap-1.5">
            {(["low", "medium", "high"] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPriority(p)}
                className={`px-3.5 py-2 rounded-xl text-xs font-medium capitalize transition ${
                  priority === p ? priorityColor[p] + " ring-1 ring-current" : "glass text-muted-foreground"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
          <button
            onClick={() => create.mutate()}
            className="flex items-center gap-2 bg-[image:var(--gradient-primary)] text-primary-foreground px-5 py-3 rounded-xl font-medium"
          >
            <Plus className="size-4" /> Add
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border/40">
          <span className="text-xs text-muted-foreground mr-1">Repeat:</span>
          {(["none", "daily", "weekly"] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRecurrence(r)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition ${
                recurrence === r ? "bg-[image:var(--gradient-primary)] text-primary-foreground" : "glass text-muted-foreground"
              }`}
            >
              {r === "none" ? "One-off" : r}
            </button>
          ))}
          {recurrence === "weekly" && (
            <div className="flex gap-1 ml-2">
              {DOW.map((d, i) => {
                const on = weekDays.includes(i);
                return (
                  <button
                    key={i}
                    onClick={() =>
                      setWeekDays((prev) => (on ? prev.filter((x) => x !== i) : [...prev, i].sort()))
                    }
                    className={`size-7 rounded-md text-[10px] font-semibold transition ${
                      on ? "bg-primary text-primary-foreground" : "glass text-muted-foreground"
                    }`}
                  >
                    {d}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        {(["today", "all"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-xl text-sm font-medium capitalize transition ${
              tab === t ? "bg-[image:var(--gradient-primary)] text-primary-foreground" : "glass text-muted-foreground"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "today" && (
        <>
          {todayRoutines.length > 0 && (
            <section className="mb-8">
              <div className="text-xs uppercase tracking-wider text-muted-foreground mb-3 px-2 flex items-center gap-2">
                <Repeat className="size-3" /> Today's routines
              </div>
              <div className="space-y-2">
                <AnimatePresence>
                  {todayRoutines.map((t) => (
                    <TaskRow key={t.id} task={t} onToggle={() => toggle.mutate(t)} onRemove={() => remove.mutate(t.id)} />
                  ))}
                </AnimatePresence>
              </div>
            </section>
          )}

          <section>
            <div className="text-xs uppercase tracking-wider text-muted-foreground mb-3 px-2 flex items-center gap-2">
              <CalendarDays className="size-3" /> One-off tasks
            </div>
            <div className="space-y-2">
              <AnimatePresence>
                {open.map((t) => (
                  <TaskRow key={t.id} task={t} onToggle={() => toggle.mutate(t)} onRemove={() => remove.mutate(t.id)} />
                ))}
              </AnimatePresence>
            </div>
            {done.length > 0 && (
              <div className="mt-8">
                <div className="text-xs uppercase tracking-wider text-muted-foreground mb-3 px-2">Completed</div>
                <div className="space-y-2 opacity-60">
                  <AnimatePresence>
                    {done.slice(0, 10).map((t) => (
                      <TaskRow key={t.id} task={t} onToggle={() => toggle.mutate(t)} onRemove={() => remove.mutate(t.id)} />
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            )}
          </section>
        </>
      )}

      {tab === "all" && (
        <div className="space-y-2">
          <AnimatePresence>
            {tasks.map((t) => (
              <TaskRow key={t.id} task={t} onToggle={() => toggle.mutate(t)} onRemove={() => remove.mutate(t.id)} />
            ))}
          </AnimatePresence>
        </div>
      )}

      {tasks.length === 0 && (
        <div className="glass rounded-2xl p-10 text-center text-muted-foreground">
          Nothing yet. Add a task or routine above to begin.
        </div>
      )}
    </div>
  );
}

function TaskRow({ task, onToggle, onRemove }: { task: Task; onToggle: () => void; onRemove: () => void }) {
  const recurring = task.recurrence !== "none";
  const doneToday = recurring ? task.last_completed_date === todayStr() : task.completed;
  return (
    <motion.div
      layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -10 }}
      className="glass rounded-2xl p-3.5 flex items-center gap-3"
    >
      <button
        onClick={onToggle}
        className={`size-6 rounded-md grid place-items-center transition shrink-0 ${
          doneToday ? "bg-[image:var(--gradient-primary)]" : "border border-border hover:border-primary"
        }`}
      >
        {doneToday && <Check className="size-3.5 text-primary-foreground" />}
      </button>
      <div className="flex-1 min-w-0">
        <div className={`text-sm ${doneToday && !recurring ? "line-through text-muted-foreground" : ""}`}>
          {task.title}
        </div>
        {recurring && (
          <div className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
            <Flame className="size-2.5 text-amber-400" />
            {task.recurrence === "daily" ? "Daily" : `Weekly · ${task.recurrence_days.map((d) => DOW[d]).join("")}`}
          </div>
        )}
      </div>
      {recurring ? (
        <span className="text-[10px] uppercase tracking-wider px-2 py-1 rounded-md bg-violet-500/10 text-violet-300">
          <Repeat className="inline size-2.5 mr-1" />Routine
        </span>
      ) : (
        <span className={`text-[10px] uppercase tracking-wider px-2 py-1 rounded-md ${priorityColor[task.priority]}`}>
          <Flag className="inline size-2.5 mr-1" />{task.priority}
        </span>
      )}
      <button onClick={onRemove} className="p-1.5 rounded-lg hover:bg-white/5 text-muted-foreground">
        <Trash2 className="size-4" />
      </button>
    </motion.div>
  );
}
