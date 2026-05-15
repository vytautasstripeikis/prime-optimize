import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Apple, Droplet, Trash2, Beef, Wheat, Flame } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { useProfile } from "@/lib/profile-hooks";

export const Route = createFileRoute("/_authenticated/nutrition")({
  component: NutritionPage,
});

const MEALS = ["breakfast", "lunch", "dinner", "snack"] as const;
const todayStr = () => new Date().toISOString().slice(0, 10);

interface Food {
  id: string;
  meal: string;
  name: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  servings: number;
  logged_on: string;
}
interface Water {
  id: string;
  amount_ml: number;
  logged_on: string;
}

function NutritionPage() {
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const qc = useQueryClient();
  const today = todayStr();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    meal: "breakfast",
    name: "",
    calories: 0,
    protein_g: 0,
    carbs_g: 0,
    fat_g: 0,
    servings: 1,
  });

  const { data: foods = [] } = useQuery({
    queryKey: ["food_logs", user?.id, today],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("food_logs").select("*").eq("logged_on", today).order("created_at");
      if (error) throw error;
      return (data ?? []) as Food[];
    },
  });

  const { data: water = [] } = useQuery({
    queryKey: ["water_logs", user?.id, today],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("water_logs").select("*").eq("logged_on", today).order("created_at");
      if (error) throw error;
      return (data ?? []) as Water[];
    },
  });

  const addFood = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("not signed in");
      const { error } = await supabase.from("food_logs").insert({
        ...form, logged_on: today, user_id: user.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Logged");
      setOpen(false);
      setForm({ ...form, name: "", calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0, servings: 1 });
      qc.invalidateQueries({ queryKey: ["food_logs"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const removeFood = useMutation({
    mutationFn: async (id: string) => { await supabase.from("food_logs").delete().eq("id", id); },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["food_logs"] }),
  });

  const addWater = useMutation({
    mutationFn: async (amount_ml: number) => {
      if (!user) throw new Error("not signed in");
      const { error } = await supabase.from("water_logs").insert({ amount_ml, logged_on: today, user_id: user.id });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["water_logs"] }),
  });

  const removeWater = useMutation({
    mutationFn: async (id: string) => { await supabase.from("water_logs").delete().eq("id", id); },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["water_logs"] }),
  });

  const totals = foods.reduce(
    (acc, f) => {
      const m = Number(f.servings) || 1;
      acc.cal += f.calories * m;
      acc.p += Number(f.protein_g) * m;
      acc.c += Number(f.carbs_g) * m;
      acc.f += Number(f.fat_g) * m;
      return acc;
    },
    { cal: 0, p: 0, c: 0, f: 0 },
  );
  const calorieGoal = profile?.calorie_goal ?? 2200;
  const waterMl = water.reduce((s, w) => s + w.amount_ml, 0);
  const waterGoal = profile?.water_goal_ml ?? 2500;

  return (
    <div className="max-w-5xl mx-auto px-5 md:px-8 py-6 md:py-10 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold">Nutrition</h1>
          <p className="text-muted-foreground mt-1">Fuel your body. Hit your macros.</p>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="bg-[image:var(--gradient-primary)] text-primary-foreground px-4 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2 glow"
        >
          <Plus className="size-4" /> Add food
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Macro label="Calories" value={Math.round(totals.cal)} goal={calorieGoal} icon={Flame} />
        <Macro label="Protein" value={Math.round(totals.p)} goal={Math.round(calorieGoal * 0.3 / 4)} icon={Beef} suffix="g" />
        <Macro label="Carbs" value={Math.round(totals.c)} goal={Math.round(calorieGoal * 0.45 / 4)} icon={Wheat} suffix="g" />
        <Macro label="Fat" value={Math.round(totals.f)} goal={Math.round(calorieGoal * 0.25 / 9)} icon={Apple} suffix="g" />
      </div>

      <div className="glass rounded-3xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display font-semibold text-lg">Water</h2>
          <span className="text-sm text-muted-foreground">{waterMl} / {waterGoal} ml</span>
        </div>
        <div className="h-3 rounded-full bg-white/5 overflow-hidden mb-4">
          <div
            className="h-full bg-gradient-to-r from-sky-400 to-cyan-400 transition-all"
            style={{ width: `${Math.min(100, (waterMl / waterGoal) * 100)}%` }}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {[250, 500, 750].map((ml) => (
            <button key={ml} onClick={() => addWater.mutate(ml)}
              className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-sm flex items-center gap-2">
              <Droplet className="size-4 text-cyan-400" /> +{ml}ml
            </button>
          ))}
        </div>
        {water.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {water.map((w) => (
              <button key={w.id} onClick={() => removeWater.mutate(w.id)}
                className="text-xs px-2 py-1 rounded-lg bg-white/5 hover:bg-rose-500/20 flex items-center gap-1">
                {w.amount_ml}ml <Trash2 className="size-3" />
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="glass rounded-3xl p-6">
        <h2 className="font-display font-semibold text-lg mb-4">Today's meals</h2>
        {foods.length === 0 ? (
          <div className="text-sm text-muted-foreground text-center py-10">
            No food logged yet today.
          </div>
        ) : (
          <div className="space-y-4">
            {MEALS.map((m) => {
              const items = foods.filter((f) => f.meal === m);
              if (!items.length) return null;
              return (
                <div key={m}>
                  <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">{m}</div>
                  <div className="space-y-1.5">
                    {items.map((f) => (
                      <div key={f.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-border/40">
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm truncate">{f.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {Math.round(f.calories * Number(f.servings))} kcal · P{Math.round(Number(f.protein_g) * Number(f.servings))} C{Math.round(Number(f.carbs_g) * Number(f.servings))} F{Math.round(Number(f.fat_g) * Number(f.servings))}
                            {Number(f.servings) !== 1 && ` · ×${f.servings}`}
                          </div>
                        </div>
                        <button onClick={() => removeFood.mutate(f.id)} className="p-2 rounded-lg hover:bg-white/5">
                          <Trash2 className="size-4 text-muted-foreground" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
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
              <h3 className="font-display font-semibold text-xl">Add food</h3>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Greek yogurt with berries"
                className="w-full bg-white/5 rounded-xl px-4 py-3 text-sm" />
              <select value={form.meal} onChange={(e) => setForm({ ...form, meal: e.target.value })}
                className="w-full bg-white/5 rounded-xl px-3 py-3 text-sm capitalize">
                {MEALS.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Calories" value={form.calories} onChange={(v) => setForm({ ...form, calories: v })} />
                <Field label="Servings" value={form.servings} step={0.5} onChange={(v) => setForm({ ...form, servings: v })} />
                <Field label="Protein (g)" value={form.protein_g} onChange={(v) => setForm({ ...form, protein_g: v })} />
                <Field label="Carbs (g)" value={form.carbs_g} onChange={(v) => setForm({ ...form, carbs_g: v })} />
                <Field label="Fat (g)" value={form.fat_g} onChange={(v) => setForm({ ...form, fat_g: v })} />
              </div>
              <div className="flex gap-2 pt-2">
                <button onClick={() => setOpen(false)} className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 text-sm">Cancel</button>
                <button onClick={() => form.name.trim() && addFood.mutate()}
                  disabled={!form.name.trim() || addFood.isPending}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-[image:var(--gradient-primary)] text-primary-foreground text-sm font-medium disabled:opacity-50">
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

function Field({ label, value, step, onChange }: { label: string; value: number; step?: number; onChange: (v: number) => void }) {
  return (
    <label className="space-y-1">
      <div className="text-xs text-muted-foreground">{label}</div>
      <input type="number" step={step ?? 1} value={value}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        className="w-full bg-white/5 rounded-xl px-4 py-2.5 text-sm" />
    </label>
  );
}

function Macro({ label, value, goal, suffix, icon: Icon }: { label: string; value: number; goal: number; suffix?: string; icon: React.ComponentType<{ className?: string }> }) {
  const pct = Math.min(100, (value / Math.max(1, goal)) * 100);
  return (
    <div className="glass rounded-2xl p-5">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-muted-foreground">{label}</span>
        <Icon className="size-4 text-primary-glow" />
      </div>
      <div className="text-2xl font-display font-bold">{value}{suffix}</div>
      <div className="text-xs text-muted-foreground mb-2">/ {goal}{suffix}</div>
      <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
        <div className="h-full bg-[image:var(--gradient-primary)]" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}