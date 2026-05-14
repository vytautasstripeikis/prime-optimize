import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Flame, Plus, Trash2, Target } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/_authenticated/habits")({
  component: HabitsPage,
});

const today = () => new Date().toISOString().slice(0, 10);

const PALETTE = ["indigo", "violet", "cyan", "emerald", "amber", "rose"] as const;
const colorMap: Record<string, string> = {
  indigo: "from-indigo-500 to-violet-500",
  violet: "from-violet-500 to-fuchsia-500",
  cyan: "from-cyan-400 to-sky-500",
  emerald: "from-emerald-400 to-teal-500",
  amber: "from-amber-400 to-orange-500",
  rose: "from-rose-400 to-pink-500",
};

interface Habit { id: string; name: string; color: string; category: string; created_at: string }
interface Log { habit_id: string; log_date: string }

function HabitsPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [color, setColor] = useState<string>("indigo");

  const { data: habits = [] } = useQuery({
    queryKey: ["habits", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("habits").select("*").eq("archived", false).order("created_at", { ascending: true });
      if (error) throw error;
      return data as Habit[];
    },
  });

  const { data: logs = [] } = useQuery({
    queryKey: ["habit_logs_30", user?.id],
    queryFn: async () => {
      const since = new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString().slice(0, 10);
      const { data, error } = await supabase
        .from("habit_logs").select("habit_id, log_date").gte("log_date", since);
      if (error) throw error;
      return data as Log[];
    },
  });

  const create = useMutation({
    mutationFn: async () => {
      if (!name.trim()) throw new Error("Name required");
      const { error } = await supabase.from("habits").insert({
        user_id: user!.id, name: name.trim(), color, category: "general",
      });
      if (error) throw error;
    },
    onSuccess: () => { setName(""); qc.invalidateQueries({ queryKey: ["habits"] }); toast.success("Habit added"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggleToday = useMutation({
    mutationFn: async (h: Habit) => {
      const todays = logs.find((l) => l.habit_id === h.id && l.log_date === today());
      if (todays) {
        const { error } = await supabase.from("habit_logs").delete()
          .eq("habit_id", h.id).eq("log_date", today());
        if (error) throw error;
      } else {
        const { error } = await supabase.from("habit_logs").insert({
          user_id: user!.id, habit_id: h.id, log_date: today(),
        });
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["habit_logs_30"] }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("habits").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["habits"] }),
  });

  const streakOf = (habitId: string) => {
    let n = 0;
    for (let i = 0; ; i++) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const ds = d.toISOString().slice(0, 10);
      if (logs.some((l) => l.habit_id === habitId && l.log_date === ds)) n++;
      else break;
    }
    return n;
  };

  return (
    <div className="max-w-5xl mx-auto px-5 md:px-8 py-6 md:py-10">
      <div className="flex items-end justify-between mb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold">Habits</h1>
          <p className="text-muted-foreground mt-1">Small wins, every day. Compounded.</p>
        </div>
      </div>

      <div className="glass rounded-3xl p-5 mb-6">
        <div className="flex flex-col md:flex-row gap-3">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && create.mutate()}
            placeholder="New habit, e.g. Read 20 pages"
            className="flex-1 glass rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary"
          />
          <div className="flex gap-2">
            {PALETTE.map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className={`size-9 rounded-lg bg-gradient-to-br ${colorMap[c]} ${color === c ? "ring-2 ring-white/70" : "opacity-70"}`}
                aria-label={c}
              />
            ))}
          </div>
          <button
            onClick={() => create.mutate()}
            disabled={create.isPending}
            className="flex items-center gap-2 bg-[image:var(--gradient-primary)] text-primary-foreground px-5 py-3 rounded-xl font-medium"
          >
            <Plus className="size-4" /> Add
          </button>
        </div>
      </div>

      <div className="grid gap-3">
        <AnimatePresence>
          {habits.map((h) => {
            const done = logs.some((l) => l.habit_id === h.id && l.log_date === today());
            const streak = streakOf(h.id);
            return (
              <motion.div
                key={h.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="glass rounded-2xl p-4 flex items-center gap-4"
              >
                <button
                  onClick={() => toggleToday.mutate(h)}
                  className={`size-12 rounded-xl grid place-items-center transition ${
                    done
                      ? `bg-gradient-to-br ${colorMap[h.color] ?? colorMap.indigo} text-white scale-105`
                      : "glass hover:bg-white/10"
                  }`}
                >
                  {done ? <Check className="size-5" /> : <Target className="size-5 text-muted-foreground" />}
                </button>
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{h.name}</div>
                  <div className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                    <Flame className="size-3 text-amber-400" /> {streak} day streak
                  </div>
                </div>
                <button
                  onClick={() => remove.mutate(h.id)}
                  className="p-2 rounded-lg hover:bg-white/5 text-muted-foreground"
                >
                  <Trash2 className="size-4" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
        {habits.length === 0 && (
          <div className="glass rounded-2xl p-10 text-center text-muted-foreground">
            No habits yet. Add your first one above.
          </div>
        )}
      </div>
    </div>
  );
}
