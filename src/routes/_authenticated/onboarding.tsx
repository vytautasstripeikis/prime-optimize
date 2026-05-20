import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { safeErrorMessage } from "@/lib/safe-error";
import { useState, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { useProfile } from "@/lib/profile-hooks";

export const Route = createFileRoute("/_authenticated/onboarding")({
  component: OnboardingPage,
});

type Form = {
  full_name: string;
  age: string;
  gender: string;
  height_cm: string;
  weight_kg: string;
  fitness_level: string;
  activity_level: string;
  workout_preferences: string[];
  diet_preferences: string[];
  allergies: string;
  injuries: string;
  sleep_start: string;
  sleep_end: string;
  sleep_goal_hours: string;
  stress_level: number;
  productivity_level: number;
  career_goals: string;
  financial_goals: string;
  fitness_goals: string;
  daily_routine: string;
  work_schedule: string;
  focus_times: string[];
  motivation_style: string;
  personality_style: string;
};

const initial: Form = {
  full_name: "", age: "", gender: "", height_cm: "", weight_kg: "",
  fitness_level: "intermediate", activity_level: "moderate",
  workout_preferences: [], diet_preferences: [],
  allergies: "", injuries: "",
  sleep_start: "23:00", sleep_end: "07:00", sleep_goal_hours: "8",
  stress_level: 5, productivity_level: 5,
  career_goals: "", financial_goals: "", fitness_goals: "",
  daily_routine: "", work_schedule: "",
  focus_times: [], motivation_style: "discipline", personality_style: "balanced",
};

function OnboardingPage() {
  const { user } = useAuth();
  const { data: profile, isLoading } = useProfile();
  const nav = useNavigate();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<Form>(initial);
  const [saving, setSaving] = useState(false);

  // Skip if already onboarded
  if (!isLoading && profile?.onboarded) {
    nav({ to: "/dashboard" });
    return null;
  }

  const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm((f) => ({ ...f, [k]: v }));
  const toggle = (k: "workout_preferences" | "diet_preferences" | "focus_times", v: string) =>
    setForm((f) => ({ ...f, [k]: f[k].includes(v) ? f[k].filter((x) => x !== v) : [...f[k], v] }));

  const steps: { title: string; subtitle: string; render: ReactNode }[] = [
    {
      title: "Welcome to Aurora",
      subtitle: "Let's tailor everything to you. This takes about 2 minutes.",
      render: (
        <div className="space-y-4">
          <Field label="Full name">
            <input className={inputCls} value={form.full_name} onChange={(e) => set("full_name", e.target.value)} placeholder="Jane Doe" autoFocus />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Age"><input className={inputCls} type="number" value={form.age} onChange={(e) => set("age", e.target.value)} /></Field>
            <Field label="Gender">
              <select className={inputCls} value={form.gender} onChange={(e) => set("gender", e.target.value)}>
                <option value="">Prefer not to say</option><option>Female</option><option>Male</option><option>Non-binary</option><option>Other</option>
              </select>
            </Field>
          </div>
        </div>
      ),
    },
    {
      title: "Body & fitness",
      subtitle: "Helps the AI calibrate workout and recovery advice.",
      render: (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Height (cm)"><input className={inputCls} type="number" value={form.height_cm} onChange={(e) => set("height_cm", e.target.value)} /></Field>
            <Field label="Weight (kg)"><input className={inputCls} type="number" value={form.weight_kg} onChange={(e) => set("weight_kg", e.target.value)} /></Field>
          </div>
          <Field label="Fitness level">
            <PillGroup options={["beginner", "intermediate", "advanced", "elite"]} value={form.fitness_level} onChange={(v) => set("fitness_level", v)} />
          </Field>
          <Field label="Activity level">
            <PillGroup options={["sedentary", "light", "moderate", "active", "very active"]} value={form.activity_level} onChange={(v) => set("activity_level", v)} />
          </Field>
          <Field label="Workout preferences (pick any)">
            <ChipGroup options={["Strength", "Hypertrophy", "Running", "Cycling", "Mobility", "HIIT", "Sports", "Yoga"]} value={form.workout_preferences} onToggle={(v) => toggle("workout_preferences", v)} />
          </Field>
        </div>
      ),
    },
    {
      title: "Sleep & nutrition",
      subtitle: "Set your daily targets — you can change these anytime.",
      render: (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Sleep start"><input className={inputCls} type="time" value={form.sleep_start} onChange={(e) => set("sleep_start", e.target.value)} /></Field>
            <Field label="Wake up"><input className={inputCls} type="time" value={form.sleep_end} onChange={(e) => set("sleep_end", e.target.value)} /></Field>
          </div>
          <div className="grid grid-cols-1 gap-3">
            <Field label="Sleep goal (h)"><input className={inputCls} type="number" step="0.5" value={form.sleep_goal_hours} onChange={(e) => set("sleep_goal_hours", e.target.value)} /></Field>
          </div>
          <p className="text-xs text-muted-foreground">Calorie and water goals are calculated automatically from your body data.</p>
          <Field label="Diet preferences">
            <ChipGroup options={["Omnivore", "Vegetarian", "Vegan", "Keto", "Paleo", "Mediterranean", "Pescatarian", "Halal", "Kosher", "Gluten-free"]} value={form.diet_preferences} onToggle={(v) => toggle("diet_preferences", v)} />
          </Field>
          <Field label="Allergies"><input className={inputCls} value={form.allergies} onChange={(e) => set("allergies", e.target.value)} placeholder="Peanuts, shellfish…" /></Field>
          <Field label="Injuries / limitations"><input className={inputCls} value={form.injuries} onChange={(e) => set("injuries", e.target.value)} placeholder="Lower back, left knee…" /></Field>
        </div>
      ),
    },
    {
      title: "Mind & rhythm",
      subtitle: "Tell Aurora when you're at your best.",
      render: (
        <div className="space-y-5">
          <SliderField label="Current stress level" value={form.stress_level} onChange={(v) => set("stress_level", v)} hint={`${form.stress_level}/10`} />
          <SliderField label="Productivity level lately" value={form.productivity_level} onChange={(v) => set("productivity_level", v)} hint={`${form.productivity_level}/10`} />
          <Field label="Peak focus times">
            <ChipGroup options={["Early morning", "Mid morning", "Afternoon", "Evening", "Late night"]} value={form.focus_times} onToggle={(v) => toggle("focus_times", v)} />
          </Field>
          <Field label="Work / school schedule"><input className={inputCls} value={form.work_schedule} onChange={(e) => set("work_schedule", e.target.value)} placeholder="9-to-5 remote, classes 8am–2pm…" /></Field>
          <Field label="Motivation style">
            <PillGroup options={["discipline", "curiosity", "competition", "purpose", "reward"]} value={form.motivation_style} onChange={(v) => set("motivation_style", v)} />
          </Field>
        </div>
      ),
    },
    {
      title: "Goals",
      subtitle: "What's pulling you forward right now?",
      render: (
        <div className="space-y-4">
          <Field label="Career goals"><textarea className={`${inputCls} min-h-20`} value={form.career_goals} onChange={(e) => set("career_goals", e.target.value)} placeholder="Ship MVP, get promoted…" /></Field>
          <Field label="Financial goals"><textarea className={`${inputCls} min-h-20`} value={form.financial_goals} onChange={(e) => set("financial_goals", e.target.value)} placeholder="Save 20k, hit 100k revenue…" /></Field>
          <Field label="Fitness goals"><textarea className={`${inputCls} min-h-20`} value={form.fitness_goals} onChange={(e) => set("fitness_goals", e.target.value)} placeholder="Squat 2x BW, sub-25 5K…" /></Field>
          <Field label="Daily routine"><textarea className={`${inputCls} min-h-20`} value={form.daily_routine} onChange={(e) => set("daily_routine", e.target.value)} placeholder="Briefly describe a typical day" /></Field>
        </div>
      ),
    },
  ];

  const finish = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const num = (s: string) => (s === "" ? null : Number(s));
      const { error } = await supabase.from("profiles").update({
        onboarded: true,
        display_name: form.full_name || null,
        full_name: form.full_name || null,
        age: num(form.age) as number | null,
        gender: form.gender || null,
        height_cm: num(form.height_cm),
        weight_kg: num(form.weight_kg),
        fitness_level: form.fitness_level,
        activity_level: form.activity_level,
        workout_preferences: form.workout_preferences,
        diet_preferences: form.diet_preferences,
        allergies: form.allergies || null,
        injuries: form.injuries || null,
        sleep_start: form.sleep_start || null,
        sleep_end: form.sleep_end || null,
        sleep_goal_hours: num(form.sleep_goal_hours),
        stress_level: form.stress_level,
        productivity_level: form.productivity_level,
        career_goals: form.career_goals || null,
        financial_goals: form.financial_goals || null,
        fitness_goals: form.fitness_goals || null,
        daily_routine: form.daily_routine || null,
        work_schedule: form.work_schedule || null,
        focus_times: form.focus_times,
        motivation_style: form.motivation_style,
        personality_style: form.personality_style,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      }).eq("id", user.id);
      if (error) throw error;
      toast.success("Welcome aboard. Aurora is calibrated.");
      nav({ to: "/dashboard" });
    } catch (e) {
      toast.error(safeErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  const isLast = step === steps.length - 1;
  const current = steps[step];

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-xl glass rounded-3xl p-6 md:p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="size-10 rounded-2xl bg-[image:var(--gradient-primary)] grid place-items-center glow shrink-0">
            <Sparkles className="size-5 text-primary-foreground" />
          </div>
          <div className="flex-1">
            <div className="text-xs text-muted-foreground">Step {step + 1} of {steps.length}</div>
            <h2 className="font-display text-xl font-bold leading-tight">{current.title}</h2>
          </div>
        </div>

        <div className="h-1.5 bg-white/5 rounded-full mb-6 overflow-hidden">
          <motion.div
            className="h-full bg-[image:var(--gradient-primary)]"
            initial={false}
            animate={{ width: `${((step + 1) / steps.length) * 100}%` }}
            transition={{ type: "spring", stiffness: 150, damping: 20 }}
          />
        </div>

        <p className="text-sm text-muted-foreground mb-5">{current.subtitle}</p>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {current.render}
          </motion.div>
        </AnimatePresence>

        <div className="flex items-center justify-between mt-7">
          <button
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm text-muted-foreground hover:bg-white/5 disabled:opacity-30"
          >
            <ArrowLeft className="size-4" /> Back
          </button>
          {isLast ? (
            <button onClick={finish} disabled={saving} className="flex items-center gap-2 bg-[image:var(--gradient-primary)] text-primary-foreground px-5 py-2.5 rounded-xl text-sm font-medium glow disabled:opacity-60">
              {saving ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />} Finish setup
            </button>
          ) : (
            <button onClick={() => setStep((s) => s + 1)} className="flex items-center gap-2 bg-[image:var(--gradient-primary)] text-primary-foreground px-5 py-2.5 rounded-xl text-sm font-medium">
              Continue <ArrowRight className="size-4" />
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}

const inputCls = "w-full glass rounded-xl px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary";

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1.5">{label}</div>
      {children}
    </label>
  );
}

function PillGroup({ options, value, onChange }: { options: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => (
        <button
          key={o} type="button" onClick={() => onChange(o)}
          className={`px-3.5 py-2 rounded-xl text-xs font-medium capitalize transition ${
            value === o ? "bg-[image:var(--gradient-primary)] text-primary-foreground" : "glass text-muted-foreground"
          }`}
        >{o}</button>
      ))}
    </div>
  );
}

function ChipGroup({ options, value, onToggle }: { options: string[]; value: string[]; onToggle: (v: string) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => {
        const on = value.includes(o);
        return (
          <button
            key={o} type="button" onClick={() => onToggle(o)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition border ${
              on ? "border-primary bg-primary/15 text-primary-glow" : "border-border text-muted-foreground hover:border-primary/40"
            }`}
          >{on && <Check className="inline size-3 mr-1" />}{o}</button>
        );
      })}
    </div>
  );
}

function SliderField({ label, value, onChange, hint }: { label: string; value: number; onChange: (v: number) => void; hint?: string }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs uppercase tracking-wider text-muted-foreground">{label}</span>
        <span className="text-xs text-primary-glow font-semibold">{hint}</span>
      </div>
      <input
        type="range" min={1} max={10} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-primary"
      />
    </div>
  );
}