import { createFileRoute } from "@tanstack/react-router";
import { safeErrorMessage } from "@/lib/safe-error";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Dumbbell, Flame, Clock, Trash2, Activity, Search, X, Sparkles } from "lucide-react";
import { format, parseISO, subDays } from "date-fns";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import {
  EXERCISES, EXERCISES_BY_KEY, MUSCLE_GROUPS, searchExercises,
  type Exercise, type MuscleGroup,
} from "@/data/exercises";
import { BodyMuscleMap, computeMuscleVolumes } from "@/components/BodyMuscleMap";
import { STATUS_HEX, muscleStatus } from "@/lib/score";

export const Route = createFileRoute("/_authenticated/workouts")({
  component: WorkoutsPage,
});

const TYPES = [
  { value: "strength", label: "Strength" },
  { value: "cardio", label: "Cardio" },
  { value: "hiit", label: "HIIT" },
  { value: "yoga", label: "Yoga" },
  { value: "mobility", label: "Mobility" },
  { value: "sport", label: "Sport" },
] as const;
const INTENSITIES = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "max", label: "Max Effort" },
] as const;

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

interface WorkoutExercise {
  id: string;
  workout_id: string;
  exercise_key: string | null;
  custom_name: string | null;
  primary_muscle: string | null;
  secondary_muscles: string[];
  sets: number | null;
  reps: number | null;
  weight_kg: number | null;
  duration_seconds: number | null;
}

interface PendingExercise {
  exercise: Exercise | null;
  customName: string;
  sets: { reps: number; weight: number; duration: number }[];
}

function WorkoutsPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);

  const { data: workouts = [] } = useQuery({
    queryKey: ["workouts", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("workouts").select("*")
        .order("performed_on", { ascending: false }).limit(60);
      if (error) throw error;
      return (data ?? []) as Workout[];
    },
  });

  const { data: workoutExercises = [] } = useQuery({
    queryKey: ["workout_exercises", user?.id],
    queryFn: async () => {
      const since = format(subDays(new Date(), 27), "yyyy-MM-dd");
      const { data, error } = await supabase
        .from("workout_exercises")
        .select("id, workout_id, exercise_key, custom_name, primary_muscle, secondary_muscles, sets, reps, weight_kg, duration_seconds, workouts!inner(performed_on)")
        .gte("workouts.performed_on", since);
      if (error) throw error;
      return (data ?? []) as unknown as (WorkoutExercise & { workouts: { performed_on: string } })[];
    },
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("workouts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Workout removed");
      qc.invalidateQueries({ queryKey: ["workouts"] });
      qc.invalidateQueries({ queryKey: ["workout_exercises"] });
    },
    onError: (e) => toast.error(safeErrorMessage(e)),
  });

  // ===== muscle volume aggregation (last 28d, weeklyized) =====
  const muscleData = useMemo(() => {
    const primaryCounts: Record<string, number> = {};
    const secondaryCounts: Record<string, number> = {};
    for (const ex of workoutExercises) {
      const sets = ex.sets ?? 1;
      const primary = ex.primary_muscle ?? (ex.exercise_key ? EXERCISES_BY_KEY[ex.exercise_key]?.primary : null);
      const secondaries = (ex.secondary_muscles && ex.secondary_muscles.length > 0)
        ? ex.secondary_muscles
        : (ex.exercise_key ? EXERCISES_BY_KEY[ex.exercise_key]?.secondary ?? [] : []);
      if (primary) primaryCounts[primary] = (primaryCounts[primary] ?? 0) + sets;
      for (const s of secondaries) secondaryCounts[s] = (secondaryCounts[s] ?? 0) + sets;
    }
    // weekly = total / 4 (28d window)
    const weekly = (m: Record<string, number>) =>
      Object.fromEntries(Object.entries(m).map(([k, v]) => [k, v / 4]));
    return computeMuscleVolumes(weekly(primaryCounts), weekly(secondaryCounts));
  }, [workoutExercises]);

  const today = new Date().toISOString().slice(0, 10);
  const week = workouts.filter((w) => {
    const d = new Date(w.performed_on);
    return (Date.now() - d.getTime()) / (1000 * 60 * 60 * 24) <= 7;
  });
  const totalMin = week.reduce((s, w) => s + (w.duration_minutes ?? 0), 0);
  const totalCal = week.reduce((s, w) => s + (w.calories_burned ?? 0), 0);
  const todayCount = workouts.filter((w) => w.performed_on === today).length;

  return (
    <div className="max-w-6xl mx-auto px-5 md:px-8 py-6 md:py-10 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold">Workouts</h1>
          <p className="text-muted-foreground mt-1">Train hard. Track progress. Stay consistent.</p>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="bg-success hover:bg-success/90 text-success-foreground px-4 py-3 min-h-[48px] rounded-xl text-sm font-semibold flex items-center gap-2 glow"
        >
          <Plus className="size-4" /> Log Workout
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <Stat label="This Week" value={week.length} icon={Dumbbell} suffix=" sessions" />
        <Stat label="Minutes (7d)" value={totalMin} icon={Clock} />
        <Stat label="Calories (7d)" value={totalCal} icon={Flame} />
        <Stat label="Today" value={todayCount} icon={Activity} suffix=" done" />
      </div>

      {/* Body Muscle Map */}
      <div className="glass rounded-3xl p-5 md:p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-display font-semibold text-lg">Body Muscle Map</h2>
            <p className="text-xs text-muted-foreground">Coverage over the last 4 weeks vs target volume.</p>
          </div>
          <Sparkles className="size-4 text-success" />
        </div>
        <BodyMuscleMap data={muscleData} />
      </div>

      {/* Weekly volume per muscle */}
      <div className="glass rounded-3xl p-5 md:p-6">
        <h2 className="font-display font-semibold text-lg mb-4">Weekly Volume by Muscle Group</h2>
        <div className="space-y-2.5">
          {muscleData.map((m) => {
            const pct = Math.min(120, m.score * 100);
            const status = m.weeklySets === 0 ? "bad" : muscleStatus(Math.min(1.2, m.score));
            return (
              <div key={m.region}>
                <div className="flex justify-between text-xs mb-1">
                  <span>{m.region}</span>
                  <span className="text-muted-foreground">{m.weeklySets.toFixed(1)} sets/wk</span>
                </div>
                <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, pct)}%` }}
                    transition={{ duration: 0.6 }}
                    className="h-full"
                    style={{ background: STATUS_HEX[status] }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* History */}
      <div className="glass rounded-3xl p-5 md:p-6">
        <h2 className="font-display font-semibold text-lg mb-4">History</h2>
        {workouts.length === 0 ? (
          <EmptyState
            message="No workouts logged yet."
            cta="Log Your First Workout"
            onClick={() => setOpen(true)}
          />
        ) : (
          <div className="space-y-2">
            {workouts.map((w) => (
              <motion.div
                key={w.id} layout
                className="flex items-center gap-4 p-4 rounded-2xl bg-white/[0.02] border border-border/40"
              >
                <div className="size-10 rounded-xl bg-success/20 grid place-items-center shrink-0">
                  <Dumbbell className="size-4 text-success" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{w.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {capitalize(w.type)} · {intensityLabel(w.intensity)} · {format(parseISO(w.performed_on), "EEE, MMM d")}
                  </div>
                </div>
                <div className="hidden sm:flex items-center gap-4 text-xs text-muted-foreground">
                  {w.duration_minutes != null && <span><Clock className="size-3 inline mr-1" />{w.duration_minutes}m</span>}
                  {w.calories_burned != null && <span><Flame className="size-3 inline mr-1" />{w.calories_burned}</span>}
                </div>
                <button onClick={() => remove.mutate(w.id)} className="p-2 rounded-lg hover:bg-destructive/10 min-h-[40px] min-w-[40px]" aria-label="Delete">
                  <Trash2 className="size-4 text-muted-foreground" />
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {open && <WorkoutLogger onClose={() => setOpen(false)} userId={user!.id} />}
      </AnimatePresence>
    </div>
  );
}

function intensityLabel(v: string) {
  return INTENSITIES.find((i) => i.value === v)?.label ?? capitalize(v);
}
function capitalize(s: string) { return s.charAt(0).toUpperCase() + s.slice(1); }

function Stat({ label, value, suffix, icon: Icon }: { label: string; value: number; suffix?: string; icon: React.ComponentType<{ className?: string }> }) {
  return (
    <div className="glass rounded-2xl p-4 md:p-5">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-muted-foreground">{label}</span>
        <Icon className="size-4 text-success" />
      </div>
      <div className="text-2xl md:text-3xl font-display font-bold">
        {value}<span className="text-sm text-muted-foreground font-normal">{suffix}</span>
      </div>
    </div>
  );
}

function EmptyState({ message, cta, onClick }: { message: string; cta: string; onClick: () => void }) {
  return (
    <div className="text-center py-10">
      <p className="text-sm text-muted-foreground mb-4">{message}</p>
      <button
        onClick={onClick}
        className="bg-success hover:bg-success/90 text-success-foreground px-5 py-3 min-h-[48px] rounded-xl text-sm font-semibold inline-flex items-center gap-2"
      >
        <Plus className="size-4" /> {cta}
      </button>
    </div>
  );
}

/* ============ Workout Logger Modal ============ */
function WorkoutLogger({ onClose, userId }: { onClose: () => void; userId: string }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    name: "",
    type: "strength",
    duration_minutes: 45,
    intensity: "medium",
    calories_burned: 300,
    notes: "",
    performed_on: new Date().toISOString().slice(0, 10),
  });
  const [exercises, setExercises] = useState<PendingExercise[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);

  const save = useMutation({
    mutationFn: async () => {
      const { data: w, error } = await supabase
        .from("workouts").insert({ ...form, user_id: userId }).select("id").single();
      if (error || !w) throw error ?? new Error("Save failed");
      if (exercises.length > 0) {
        const rows = exercises.flatMap((e, i) =>
          e.sets.map((s, si) => ({
            user_id: userId,
            workout_id: w.id,
            exercise_key: e.exercise?.key ?? null,
            custom_name: e.exercise ? null : e.customName,
            primary_muscle: e.exercise?.primary ?? null,
            secondary_muscles: e.exercise?.secondary ?? [],
            sets: e.sets.length,
            set_number: si + 1,
            reps: s.reps || null,
            weight_kg: s.weight || null,
            duration_seconds: s.duration || null,
            sort_order: i,
          }))
        );
        const { error: e2 } = await supabase.from("workout_exercises").insert(rows);
        if (e2) throw e2;
      }
    },
    onSuccess: () => {
      toast.success("Workout logged");
      qc.invalidateQueries({ queryKey: ["workouts"] });
      qc.invalidateQueries({ queryKey: ["workout_exercises"] });
      onClose();
    },
    onError: (e) => toast.error(safeErrorMessage(e)),
  });

  const addExercise = (ex: Exercise) => {
    setExercises((p) => [...p, {
      exercise: ex, customName: "",
      sets: Array.from({ length: 3 }, () => ({ reps: 10, weight: 0, duration: 0 })),
    }]);
    setPickerOpen(false);
  };
  const addCustom = () => {
    setExercises((p) => [...p, {
      exercise: null, customName: "",
      sets: Array.from({ length: 3 }, () => ({ reps: 10, weight: 0, duration: 0 })),
    }]);
  };
  const updateExercise = (i: number, patch: Partial<PendingExercise>) =>
    setExercises((p) => p.map((e, idx) => idx === i ? { ...e, ...patch } : e));
  const updateSet = (i: number, si: number, patch: Partial<{ reps: number; weight: number; duration: number }>) =>
    setExercises((p) => p.map((e, idx) => idx === i
      ? { ...e, sets: e.sets.map((s, j) => j === si ? { ...s, ...patch } : s) }
      : e));
  const addSet = (i: number) => setExercises((p) => p.map((e, idx) => idx === i
    ? { ...e, sets: [...e.sets, { ...(e.sets[e.sets.length - 1] ?? { reps: 10, weight: 0, duration: 0 }) }] }
    : e));
  const removeSet = (i: number, si: number) => setExercises((p) => p.map((e, idx) => idx === i
    ? { ...e, sets: e.sets.filter((_, j) => j !== si) }
    : e));
  const removeExercise = (i: number) => setExercises((p) => p.filter((_, idx) => idx !== i));

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-background/85 backdrop-blur-sm grid place-items-center p-3 overflow-y-auto"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        className="glass rounded-3xl p-5 md:p-6 w-full max-w-2xl space-y-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="font-display font-semibold text-xl">Log Workout</h3>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/5 min-h-[40px] min-w-[40px]"><X className="size-4" /></button>
        </div>

        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Session Name</label>
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="e.g. Push Day, 5k Run"
            className="w-full bg-white/5 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 ring-success/40"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Type</label>
            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}
              className="w-full bg-white/5 rounded-xl px-3 py-3 text-sm">
              {TYPES.map((t) => <option key={t.value} value={t.value} className="bg-card">{t.label}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Intensity</label>
            <select value={form.intensity} onChange={(e) => setForm({ ...form, intensity: e.target.value })}
              className="w-full bg-white/5 rounded-xl px-3 py-3 text-sm">
              {INTENSITIES.map((i) => <option key={i.value} value={i.value} className="bg-card">{i.label}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Minutes</label>
            <input type="number" value={form.duration_minutes}
              onChange={(e) => setForm({ ...form, duration_minutes: +e.target.value })}
              className="w-full bg-white/5 rounded-xl px-3 py-2.5 text-sm" />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Calories</label>
            <input type="number" value={form.calories_burned}
              onChange={(e) => setForm({ ...form, calories_burned: +e.target.value })}
              className="w-full bg-white/5 rounded-xl px-3 py-2.5 text-sm" />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Date</label>
            <input type="date" value={form.performed_on}
              onChange={(e) => setForm({ ...form, performed_on: e.target.value })}
              className="w-full bg-white/5 rounded-xl px-3 py-2.5 text-sm" />
          </div>
        </div>

        {/* Exercises list */}
        <div className="space-y-2 pt-2 border-t border-border/40">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium">Exercises</div>
            <div className="flex gap-2">
              <button onClick={() => setPickerOpen(true)}
                className="text-xs bg-success/15 text-success px-3 py-2 rounded-lg flex items-center gap-1 min-h-[36px]">
                <Search className="size-3.5" /> Add from Library
              </button>
              <button onClick={addCustom}
                className="text-xs bg-white/5 px-3 py-2 rounded-lg flex items-center gap-1 min-h-[36px]">
                <Plus className="size-3.5" /> Custom
              </button>
            </div>
          </div>
          {exercises.length === 0 ? (
            <div className="text-xs text-muted-foreground text-center py-3">No exercises added yet.</div>
          ) : (
            <div className="space-y-2">
              {exercises.map((e, i) => (
                <div key={i} className="bg-white/[0.02] border border-border/40 rounded-xl p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    {e.exercise ? (
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{e.exercise.name}</div>
                        <div className="text-[10px] text-muted-foreground">
                          {e.exercise.group} · {e.exercise.primary}
                        </div>
                      </div>
                    ) : (
                      <input
                        value={e.customName}
                        onChange={(ev) => updateExercise(i, { customName: ev.target.value })}
                        placeholder="Custom exercise name"
                        className="flex-1 bg-white/5 rounded-lg px-3 py-2 text-sm"
                      />
                    )}
                    <button onClick={() => removeExercise(i)} className="p-2 text-muted-foreground hover:text-destructive">
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                  {(e.exercise?.mode === "duration") ? (
                    <div className="space-y-1.5">
                      {e.sets.map((s, si) => (
                        <div key={si} className="flex items-center gap-2">
                          <span className="text-[10px] text-muted-foreground w-10">Set {si + 1}</span>
                          <input type="number" placeholder="Seconds" value={s.duration || ""}
                            onChange={(ev) => updateSet(i, si, { duration: +ev.target.value })}
                            className="flex-1 bg-white/5 rounded-lg px-3 py-2 text-xs" />
                          {e.sets.length > 1 && (
                            <button onClick={() => removeSet(i, si)} className="p-1.5 text-muted-foreground hover:text-destructive">
                              <X className="size-3" />
                            </button>
                          )}
                        </div>
                      ))}
                      <button onClick={() => addSet(i)}
                        className="text-[11px] text-success hover:text-success/80 flex items-center gap-1 mt-1">
                        <Plus className="size-3" /> Add Set
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <div className="grid grid-cols-[2.5rem_1fr_1fr_1.5rem] gap-2 items-center text-[10px] text-muted-foreground px-1">
                        <span>Set</span><span>Reps</span><span>Weight (kg)</span><span></span>
                      </div>
                      {e.sets.map((s, si) => (
                        <div key={si} className="grid grid-cols-[2.5rem_1fr_1fr_1.5rem] gap-2 items-center">
                          <span className="text-xs text-muted-foreground text-center">{si + 1}</span>
                          <input type="number" placeholder="10" value={s.reps || ""}
                            onChange={(ev) => updateSet(i, si, { reps: +ev.target.value })}
                            className="bg-white/5 rounded-lg px-3 py-2 text-xs" />
                          <input type="number" step="0.5" placeholder="0" value={s.weight || ""}
                            onChange={(ev) => updateSet(i, si, { weight: +ev.target.value })}
                            className="bg-white/5 rounded-lg px-3 py-2 text-xs" />
                          {e.sets.length > 1 ? (
                            <button onClick={() => removeSet(i, si)} className="p-1 text-muted-foreground hover:text-destructive">
                              <X className="size-3" />
                            </button>
                          ) : <span />}
                        </div>
                      ))}
                      <button onClick={() => addSet(i)}
                        className="text-[11px] text-success hover:text-success/80 flex items-center gap-1 mt-1">
                        <Plus className="size-3" /> Add Set
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
          placeholder="Notes (optional)" rows={2}
          className="w-full bg-white/5 rounded-xl px-4 py-2.5 text-sm resize-none" />

        <div className="flex gap-2 pt-2">
          <button onClick={onClose} className="flex-1 px-4 py-3 min-h-[48px] rounded-xl bg-white/5 text-sm">Cancel</button>
          <button
            onClick={() => form.name.trim() && save.mutate()}
            disabled={!form.name.trim() || save.isPending}
            className="flex-1 px-4 py-3 min-h-[48px] rounded-xl bg-success text-success-foreground text-sm font-semibold disabled:opacity-50"
          >
            {save.isPending ? "Saving…" : "Save Workout"}
          </button>
        </div>
      </motion.div>

      <AnimatePresence>
        {pickerOpen && (
          <ExercisePicker onPick={addExercise} onClose={() => setPickerOpen(false)} />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ============ Exercise Picker ============ */
function ExercisePicker({ onPick, onClose }: { onPick: (e: Exercise) => void; onClose: () => void }) {
  const [q, setQ] = useState("");
  const [group, setGroup] = useState<MuscleGroup | "All">("All");
  const results = useMemo(() => searchExercises(q, group), [q, group]);

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] bg-background/90 backdrop-blur-md p-3 overflow-y-auto"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        className="glass rounded-3xl p-5 w-full max-w-2xl mx-auto space-y-3 max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="font-display font-semibold text-lg">Exercise Library</h3>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/5 min-h-[40px] min-w-[40px]"><X className="size-4" /></button>
        </div>
        <div className="relative">
          <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            autoFocus value={q} onChange={(e) => setQ(e.target.value)}
            placeholder="Search by name, muscle, equipment…"
            className="w-full bg-white/5 rounded-xl pl-10 pr-3 py-3 text-sm outline-none focus:ring-2 ring-success/40"
          />
        </div>
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {(["All", ...MUSCLE_GROUPS] as const).map((g) => (
            <button key={g} onClick={() => setGroup(g)}
              className={`px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition ${
                group === g ? "bg-success text-success-foreground" : "bg-white/5 text-muted-foreground"
              }`}>{g}</button>
          ))}
        </div>
        <div className="flex-1 overflow-y-auto -mx-2 px-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {results.map((e) => (
              <button key={e.key} onClick={() => onPick(e)}
                className="text-left p-3 rounded-xl bg-white/[0.02] border border-border/40 hover:bg-white/5 hover:border-success/40 transition min-h-[60px]">
                <div className="text-sm font-medium">{e.name}</div>
                <div className="text-[10px] text-muted-foreground mt-0.5">
                  {e.group} · {e.equipment}
                </div>
              </button>
            ))}
            {results.length === 0 && (
              <div className="col-span-full text-center text-sm text-muted-foreground py-8">No matches.</div>
            )}
          </div>
        </div>
        <div className="text-[10px] text-muted-foreground text-center">
          {EXERCISES.length} exercises in library
        </div>
      </motion.div>
    </motion.div>
  );
}
