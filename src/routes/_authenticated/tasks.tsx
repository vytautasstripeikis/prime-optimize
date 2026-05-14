import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Plus, Trash2, Flag } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/_authenticated/tasks")({
  component: TasksPage,
});

interface Task {
  id: string; title: string; description: string | null;
  priority: "low" | "medium" | "high"; completed: boolean;
  due_date: string | null; created_at: string;
}

const priorityColor = {
  low: "text-emerald-400 bg-emerald-500/10",
  medium: "text-amber-400 bg-amber-500/10",
  high: "text-rose-400 bg-rose-500/10",
};

function TasksPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");

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
        user_id: user!.id, title: title.trim(), priority,
      });
      if (error) throw error;
    },
    onSuccess: () => { setTitle(""); qc.invalidateQueries({ queryKey: ["tasks"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggle = useMutation({
    mutationFn: async (t: Task) => {
      const { error } = await supabase.from("tasks").update({
        completed: !t.completed,
        completed_at: !t.completed ? new Date().toISOString() : null,
      }).eq("id", t.id);
      if (error) throw error;
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

  const open = tasks.filter((t) => !t.completed);
  const done = tasks.filter((t) => t.completed);

  return (
    <div className="max-w-5xl mx-auto px-5 md:px-8 py-6 md:py-10">
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold">Tasks</h1>
        <p className="text-muted-foreground mt-1">Plan, prioritize, ship.</p>
      </div>

      <div className="glass rounded-3xl p-5 mb-6">
        <div className="flex flex-col md:flex-row gap-3">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && create.mutate()}
            placeholder="What needs to get done?"
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
      </div>

      <div className="space-y-2">
        <AnimatePresence>
          {open.map((t) => (
            <TaskRow key={t.id} task={t} onToggle={() => toggle.mutate(t)} onRemove={() => remove.mutate(t.id)} />
          ))}
        </AnimatePresence>
      </div>

      {done.length > 0 && (
        <div className="mt-10">
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

      {tasks.length === 0 && (
        <div className="glass rounded-2xl p-10 text-center text-muted-foreground">
          No tasks. Type one above to begin.
        </div>
      )}
    </div>
  );
}

function TaskRow({ task, onToggle, onRemove }: { task: Task; onToggle: () => void; onRemove: () => void }) {
  return (
    <motion.div
      layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -10 }}
      className="glass rounded-2xl p-3.5 flex items-center gap-3"
    >
      <button
        onClick={onToggle}
        className={`size-6 rounded-md grid place-items-center transition shrink-0 ${
          task.completed ? "bg-[image:var(--gradient-primary)]" : "border border-border hover:border-primary"
        }`}
      >
        {task.completed && <Check className="size-3.5 text-primary-foreground" />}
      </button>
      <div className="flex-1 min-w-0">
        <div className={`text-sm ${task.completed ? "line-through text-muted-foreground" : ""}`}>{task.title}</div>
      </div>
      <span className={`text-[10px] uppercase tracking-wider px-2 py-1 rounded-md ${priorityColor[task.priority]}`}>
        <Flag className="inline size-2.5 mr-1" />{task.priority}
      </span>
      <button onClick={onRemove} className="p-1.5 rounded-lg hover:bg-white/5 text-muted-foreground">
        <Trash2 className="size-4" />
      </button>
    </motion.div>
  );
}
