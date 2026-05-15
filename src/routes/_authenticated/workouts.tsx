import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Dumbbell, Flame, Clock, Trash2, Activity } from "lucide-react";
import { format, parseISO } from "date-fns";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/_authenticated/workouts")({
  component: WorkoutsPage,
});

const TYPES = ["strength", "cardio", "hiit", "yoga", "mobility", "sport"] as const;
const INTENSITIES = ["low", "medium", "high"] as const;

interface Workout {
  id: string;
  name: string;
  type: string;
  duration_minutes: number | null;
  intensity: string;
  calories_burned: number | null;
  notes: string | null;
  performed_on: string;
}

function WorkoutsPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    type: "strength",
    duration_minutes: 30,
    intensity: "medium",
    calories_burned: 250,
    notes: "",
    performed_on: new Date().toISOString().slice(0, 10),
  });

  const { data: workouts = [] } = useQuery({
    queryKey: ["workouts", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("workouts")
        .select("*")
        .order("performed_on", { ascending: false })
        .limit(60);
      if (error) throw error;
      return (data ?? []) as Workout[];
    },
  });

  const create = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("not signed in");
      const { error } = await supabase.from("workouts").insert({ ...form, user_id: user.id });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Workout logged");
      setOpen(false);
      setForm({ ...form, name: "", notes: "" });
      qc.invalidateQueries({ queryKey: ["workouts"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("workouts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["workouts"] }),
  });

  const today = new Date().toISOString().slice(0, 10);
  const week = workouts.filter((w) => {
    const d = new Date(w.performed_on);
    const diff = (Date.now() - d.getTime()) / (1000 * 60 * 60 * 24);
    return diff <= 7;
  });
  const totalMin = week.reduce((s, w) => s + (w.duration_minutes ?? 0), 0);
  const totalCal = week.reduce((s, w) => s + (w.calories_burned ?? 0), 0);
  const todayCount = workouts.filter((w) => w.performed_on === today).length;

  return (
    <div className="max-w-5xl mx-auto px-5 md:px-8 py-6 md:py-10 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold">Workouts</h1>
          <p className="text-muted-foreground mt-1">Train hard. Track progress. Stay consistent.</p>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="bg-[image:var(--gradient-primary)] text-primary-foreground px-4 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2 glow"
        >
          <Plus className="size-4" /> Log workout
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Stat label="This week" value={week.length} icon={Dumbbell} suffix=" sessions" />
        <Stat label="Minutes (7d)" value={totalMin} icon={Clock} />
        <Stat label="Calories (7d)" value={totalCal} icon={Flame} />
        <Stat label="Today" value={todayCount} icon={Activity} suffix=" done" />
      </div>

      <div className="glass rounded-3xl p-6">
        <h2 className="font-display font-semibold text-lg mb-4">History</h2>
        {workouts.length === 0 ? (
          <div className="text-sm text-muted-foreground text-center py-10">
            No workouts yet. Log your first session to get started.
          </div>
        ) : (
          <div className="space-y-2">
            {workouts.map((w) => (
              <motion.div
                key={w.id}
                layout
                className="flex items-center gap-4 p-4 rounded-2xl bg-white/[0.02] border border-border/40"
              >
                <div className="size-10 rounded-xl bg-[image:var(--gradient-primary)] grid place-items-center shrink-0">
                  <Dumbbell className="size-4 text-primary-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{w.name}</div>
                  <div className="text-xs text-muted-foreground capitalize">
                    {w.type} · {w.intensity} · {format(parseISO(w.performed_on), "EEE, MMM d")}
                  </div>
                </div>
                <div className="hidden sm:flex items-center gap-4 text-xs text-muted-foreground">
                  {w.duration_minutes != null && <span><Clock className="size-3 inline mr-1" />{w.duration_minutes}m</span>}
                  {w.calories_burned != null && <span><Flame className="size-3 inline mr-1" />{w.calories_burned}</span>}
                </div>
                <button onClick={() => remove.mutate(w.id)} className="p-2 rounded-lg hover:bg-white/5">
                  <Trash2 className="size-4 text-muted-foreground" />
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm grid place-items-center p-4"
            onClick={() => setOpen(false)}
          >
            <motion.div
              initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
              className="glass rounded-3xl p-6 w-full max-w-md space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="font-display font-semibold text-xl">Log workout</h3>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Push day, 5k run"
                className="w-full bg-white/5 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 ring-primary/40"
              />
              <div className="grid grid-cols-2 gap-3">
                <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}
                  className="bg-white/5 rounded-xl px-3 py-3 text-sm capitalize">
                  {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
                <select value={form.intensity} onChange={(e) => setForm({ ...form, intensity: e.target.value })}
                  className="bg-white/5 rounded-xl px-3 py-3 text-sm capitalize">
                  {INTENSITIES.map((i) => <option key={i} value={i}>{i}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <label className="space-y-1">
                  <div className="text-xs text-muted-foreground">Minutes</div>
                  <input type="number" value={form.duration_minutes}
                    onChange={(e) => setForm({ ...form, duration_minutes: +e.target.value })}
                    className="w-full bg-white/5 rounded-xl px-4 py-2.5 text-sm" />
                </label>
                <label className="space-y-1">
                  <div className="text-xs text-muted-foreground">Calories</div>
                  <input type="number" value={form.calories_burned}
                    onChange={(e) => setForm({ ...form, calories_burned: +e.target.value })}
                    className="w-full bg-white/5 rounded-xl px-4 py-2.5 text-sm" />
                </label>
              </div>
              <input type="date" value={form.performed_on}
                onChange={(e) => setForm({ ...form, performed_on: e.target.value })}
                className="w-full bg-white/5 rounded-xl px-4 py-2.5 text-sm" />
              <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Notes (optional)" rows={2}
                className="w-full bg-white/5 rounded-xl px-4 py-2.5 text-sm resize-none" />
              <div className="flex gap-2 pt-2">
                <button onClick={() => setOpen(false)} className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 text-sm">Cancel</button>
                <button
                  onClick={() => form.name.trim() && create.mutate()}
                  disabled={!form.name.trim() || create.isPending}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-[image:var(--gradient-primary)] text-primary-foreground text-sm font-medium disabled:opacity-50"
                >
                  Save
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Stat({ label, value, suffix, icon: Icon }: { label: string; value: number; suffix?: string; icon: React.ComponentType<{ className?: string }> }) {
  return (
    <div className="glass rounded-2xl p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-muted-foreground">{label}</span>
        <Icon className="size-4 text-primary-glow" />
      </div>
      <div className="text-2xl md:text-3xl font-display font-bold">
        {value}<span className="text-sm text-muted-foreground font-normal">{suffix}</span>
      </div>
    </div>
  );
}