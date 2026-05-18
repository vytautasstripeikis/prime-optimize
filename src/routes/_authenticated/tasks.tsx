import { createFileRoute } from "@tanstack/react-router";
import { safeErrorMessage } from "@/lib/safe-error";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check, Plus, Trash2, Flag, Repeat, CalendarDays, Flame, Clock, Tag, AlertTriangle,
} from "lucide-react";
import { format, isBefore, isToday, isThisWeek, parseISO } from "date-fns";
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
  category: string;
  estimated_minutes: number | null;
}

const priorityColor = {
  low: "text-success bg-success/15",
  medium: "text-warning bg-warning/15",
  high: "text-destructive bg-destructive/15",
};
const priorityLabel = { low: "Low", medium: "Medium", high: "High" } as const;
const recurrenceLabel = { none: "One-Off", daily: "Daily", weekly: "Weekly" } as const;
const CATEGORY_LABEL: Record<string, string> = {
  general: "General", work: "Work", health: "Health",
  learning: "Learning", personal: "Personal", finance: "Finance",
};
const filterLabel: Record<string, string> = { today: "Today", week: "Week", overdue: "Overdue", all: "All" };

const CATEGORIES = ["general", "work", "health", "learning", "personal", "finance"] as const;
const todayStr = () => new Date().toISOString().slice(0, 10);
const DOW = ["S", "M", "T", "W", "T", "F", "S"];

function isRoutineDueToday(t: Task) {
  if (t.recurrence === "daily") return true;
  if (t.recurrence === "weekly") return t.recurrence_days.includes(new Date().getDay());
  return false;
}

type Filter = "today" | "week" | "overdue" | "all";

function TasksPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");
  const [recurrence, setRecurrence] = useState<"none" | "daily" | "weekly">("none");
  const [weekDays, setWeekDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [category, setCategory] = useState<string>("general");
  const [dueDate, setDueDate] = useState<string>("");
  const [estimate, setEstimate] = useState<string>("");
  const [filter, setFilter] = useState<Filter>("today");
  const [filterCat, setFilterCat] = useState<string>("all");

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
        category,
        due_date: dueDate || null,
        estimated_minutes: estimate ? parseInt(estimate, 10) : null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setTitle(""); setDueDate(""); setEstimate("");
      qc.invalidateQueries({ queryKey: ["tasks"] });
    },
    onError: (e) => toast.error(safeErrorMessage(e)),
  });

  const toggle = useMutation({
    mutationFn: async (t: Task) => {
      if (t.recurrence !== "none") {
        const isDone = t.last_completed_date === todayStr();
        if (isDone) {
          await supabase.from("tasks").update({ last_completed_date: null }).eq("id", t.id);
          await supabase.from("task_completions").delete().eq("task_id", t.id).eq("completed_on", todayStr());
        } else {
          await supabase.from("tasks").update({ last_completed_date: todayStr() }).eq("id", t.id);
          await supabase.from("task_completions").upsert(
            { user_id: user!.id, task_id: t.id, completed_on: todayStr() },
            { onConflict: "task_id,completed_on" },
          );
        }
      } else {
        const becomingComplete = !t.completed;
        await supabase.from("tasks").update({
          completed: becomingComplete,
          completed_at: becomingComplete ? new Date().toISOString() : null,
        }).eq("id", t.id);
        if (becomingComplete) {
          await supabase.from("task_completions").upsert(
            { user_id: user!.id, task_id: t.id, completed_on: todayStr() },
            { onConflict: "task_id,completed_on" },
          );
        } else {
          await supabase.from("task_completions").delete().eq("task_id", t.id).eq("completed_on", todayStr());
        }
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

  const filtered = useMemo(() => {
    const now = new Date();
    return tasks.filter((t) => {
      if (filterCat !== "all" && t.category !== filterCat) return false;
      if (filter === "all") return true;
      if (filter === "today") {
        if (t.recurrence !== "none") return isRoutineDueToday(t);
        if (t.due_date) return isToday(parseISO(t.due_date));
        return !t.completed;
      }
      if (filter === "week") {
        if (t.recurrence !== "none") return true;
        if (t.due_date) return isThisWeek(parseISO(t.due_date), { weekStartsOn: 1 });
        return false;
      }
      if (filter === "overdue") {
        if (t.recurrence !== "none" || t.completed || !t.due_date) return false;
        const d = parseISO(t.due_date);
        return isBefore(d, now) && !isToday(d);
      }
      return true;
    });
  }, [tasks, filter, filterCat]);

  const routines = filtered.filter((t) => t.recurrence !== "none");
  const oneOffsOpen = filtered.filter((t) => t.recurrence === "none" && !t.completed);
  const oneOffsDone = filtered.filter((t) => t.recurrence === "none" && t.completed);

  const overdueCount = tasks.filter(
    (t) =>
      t.recurrence === "none" &&
      !t.completed &&
      t.due_date &&
      isBefore(parseISO(t.due_date), new Date()) &&
      !isToday(parseISO(t.due_date)),
  ).length;

  return (
    <div className="max-w-5xl mx-auto px-5 md:px-8 py-6 md:py-10">
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold">Tasks &amp; Routines</h1>
        <p className="text-muted-foreground mt-1">One-off tasks and recurring habits, in one place.</p>
      </div>

      {/* Composer */}
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
              <button key={p} onClick={() => setPriority(p)}
                className={`px-3.5 py-2 min-h-[40px] rounded-xl text-xs font-medium transition ${
                  priority === p ? priorityColor[p] + " ring-1 ring-current" : "glass text-muted-foreground"
                }`}>{priorityLabel[p]}</button>
            ))}
          </div>
          <button
            onClick={() => create.mutate()}
            className="flex items-center gap-2 bg-success hover:bg-success/90 text-success-foreground px-5 py-3 min-h-[48px] rounded-xl font-semibold"
          >
            <Plus className="size-4" /> Add
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-border/40">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Repeat:</span>
            {(["none", "daily", "weekly"] as const).map((r) => (
              <button key={r} onClick={() => setRecurrence(r)}
                className={`px-3 py-2 min-h-[36px] rounded-lg text-xs font-medium transition ${
                  recurrence === r ? "bg-success text-success-foreground" : "glass text-muted-foreground"
                }`}>{recurrenceLabel[r]}</button>
            ))}
          </div>
          {recurrence === "weekly" && (
            <div className="flex gap-1">
              {DOW.map((d, i) => {
                const on = weekDays.includes(i);
                return (
                  <button key={i}
                    onClick={() => setWeekDays((prev) => (on ? prev.filter((x) => x !== i) : [...prev, i].sort()))}
                    className={`size-8 min-h-[36px] min-w-[36px] rounded-md text-[10px] font-semibold transition ${
                      on ? "bg-success text-success-foreground" : "glass text-muted-foreground"
                    }`}>{d}</button>
                );
              })}
            </div>
          )}
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="glass rounded-lg px-3 py-2 min-h-[36px] text-xs outline-none cursor-pointer"
          >
            {CATEGORIES.map((c) => <option key={c} value={c} className="bg-card">{CATEGORY_LABEL[c]}</option>)}
          </select>
          {recurrence === "none" && (
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="glass rounded-lg px-3 py-1.5 text-xs outline-none"
            />
          )}
          <input
            type="number" min="1" max="600" placeholder="Mins"
            value={estimate}
            onChange={(e) => setEstimate(e.target.value)}
            className="glass rounded-lg px-3 py-1.5 text-xs outline-none w-20"
          />
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        {(["today", "week", "overdue", "all"] as Filter[]).map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-2 min-h-[40px] rounded-xl text-sm font-medium transition flex items-center gap-1.5 ${
              filter === f ? "bg-success text-success-foreground" : "glass text-muted-foreground"
            }`}>
            {filterLabel[f]}
            {f === "overdue" && overdueCount > 0 && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-destructive/30 text-destructive">{overdueCount}</span>
            )}
          </button>
        ))}
        <div className="flex-1" />
        <select
          value={filterCat}
          onChange={(e) => setFilterCat(e.target.value)}
          className="glass rounded-xl px-3 py-2 min-h-[40px] text-sm outline-none cursor-pointer"
        >
          <option value="all" className="bg-card">All Categories</option>
          {CATEGORIES.map((c) => <option key={c} value={c} className="bg-card">{CATEGORY_LABEL[c]}</option>)}
        </select>
      </div>

      {routines.length > 0 && (
        <section className="mb-8">
          <div className="text-xs uppercase tracking-wider text-muted-foreground mb-3 px-2 flex items-center gap-2">
            <Repeat className="size-3" /> Routines
          </div>
          <div className="space-y-2">
            <AnimatePresence>
              {routines.map((t) => (
                <TaskRow key={t.id} task={t} onToggle={() => toggle.mutate(t)} onRemove={() => remove.mutate(t.id)} />
              ))}
            </AnimatePresence>
          </div>
        </section>
      )}

      <section>
        <div className="text-xs uppercase tracking-wider text-muted-foreground mb-3 px-2 flex items-center gap-2">
          <CalendarDays className="size-3" /> Tasks
        </div>
        <div className="space-y-2">
          <AnimatePresence>
            {oneOffsOpen.map((t) => (
              <TaskRow key={t.id} task={t} onToggle={() => toggle.mutate(t)} onRemove={() => remove.mutate(t.id)} />
            ))}
          </AnimatePresence>
        </div>
        {oneOffsDone.length > 0 && (
          <div className="mt-8">
            <div className="text-xs uppercase tracking-wider text-muted-foreground mb-3 px-2">Completed</div>
            <div className="space-y-2 opacity-60">
              <AnimatePresence>
                {oneOffsDone.slice(0, 20).map((t) => (
                  <TaskRow key={t.id} task={t} onToggle={() => toggle.mutate(t)} onRemove={() => remove.mutate(t.id)} />
                ))}
              </AnimatePresence>
            </div>
          </div>
        )}
      </section>

      {filtered.length === 0 && (
        <div className="glass rounded-2xl p-10 text-center">
          <p className="text-sm text-muted-foreground mb-4">Nothing here. Try a different filter or add a task above.</p>
          <button
            onClick={() => (document.querySelector('input[placeholder*="get done"]') as HTMLInputElement | null)?.focus()}
            className="bg-success hover:bg-success/90 text-success-foreground px-5 py-3 min-h-[48px] rounded-xl text-sm font-semibold inline-flex items-center gap-2"
          >
            <Plus className="size-4" /> Add Task
          </button>
        </div>
      )}
    </div>
  );
}

function TaskRow({ task, onToggle, onRemove }: { task: Task; onToggle: () => void; onRemove: () => void }) {
  const recurring = task.recurrence !== "none";
  const doneToday = recurring ? task.last_completed_date === todayStr() : task.completed;
  const overdue = !recurring && !task.completed && task.due_date &&
    isBefore(parseISO(task.due_date), new Date()) && !isToday(parseISO(task.due_date));

  return (
    <motion.div
      layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -10 }}
      className={`glass rounded-2xl p-3.5 flex items-center gap-3 ${overdue ? "ring-1 ring-rose-500/40" : ""}`}
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
        <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-0.5 text-[10px] text-muted-foreground">
          {recurring && (
            <span className="flex items-center gap-1">
              <Flame className="size-2.5 text-amber-400" />
              {task.recurrence === "daily" ? "Daily" : `Weekly · ${task.recurrence_days.map((d) => DOW[d]).join("")}`}
            </span>
          )}
          {task.due_date && !recurring && (
            <span className={`flex items-center gap-1 ${overdue ? "text-rose-400" : ""}`}>
              {overdue ? <AlertTriangle className="size-2.5" /> : <CalendarDays className="size-2.5" />}
              {format(parseISO(task.due_date), "MMM d")}
            </span>
          )}
          {task.estimated_minutes != null && (
            <span className="flex items-center gap-1"><Clock className="size-2.5" />{task.estimated_minutes}m</span>
          )}
          {task.category && task.category !== "general" && (
            <span className="flex items-center gap-1 capitalize"><Tag className="size-2.5" />{task.category}</span>
          )}
        </div>
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
