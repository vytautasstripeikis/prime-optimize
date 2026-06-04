import { createFileRoute } from "@tanstack/react-router";
import { safeErrorMessage } from "@/lib/safe-error";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Loader2, Save, User } from "lucide-react";
import { toast } from "sonner";
import { useProfile, useUpdateProfile } from "@/lib/profile-hooks";
import type { TablesUpdate } from "@/integrations/supabase/types";

export const Route = createFileRoute("/_authenticated/profile")({
  component: ProfilePage,
});

function ProfilePage() {
  const { data: profile, isLoading } = useProfile();
  const update = useUpdateProfile();
  const [form, setForm] = useState<TablesUpdate<"profiles">>({});

  useEffect(() => {
    if (profile) setForm(profile);
  }, [profile]);

  if (isLoading || !profile) {
    return <div className="grid place-items-center min-h-[60vh]"><Loader2 className="size-5 animate-spin text-muted-foreground" /></div>;
  }

  const set = <K extends keyof TablesUpdate<"profiles">>(k: K, v: TablesUpdate<"profiles">[K]) =>
    setForm((f) => ({ ...f, [k]: v }));
  const num = (v: string) => (v === "" ? null : Number(v));

  const save = async () => {
    try {
      await update.mutateAsync(form);
      toast.success("Profile saved.");
    } catch (e) {
      toast.error(safeErrorMessage(e));
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-5 md:px-8 py-6 md:py-10 space-y-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold flex items-center gap-3"><User className="size-7 text-primary-glow" />Profile</h1>
          <p className="text-muted-foreground mt-1">Aurora uses this to personalize every recommendation.</p>
        </div>
        <button onClick={save} disabled={update.isPending} className="flex items-center gap-2 bg-[image:var(--gradient-primary)] text-primary-foreground px-4 py-2.5 rounded-xl text-sm font-medium disabled:opacity-60">
          {update.isPending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />} Save
        </button>
      </motion.div>

      <Section title="Identity">
        <Grid cols={2}>
          <Field label="Display name"><Input value={form.display_name ?? ""} onChange={(v) => set("display_name", v)} /></Field>
          <Field label="Full name"><Input value={form.full_name ?? ""} onChange={(v) => set("full_name", v)} /></Field>
          <Field label="Age"><Input type="number" value={form.age?.toString() ?? ""} onChange={(v) => set("age", num(v) as number | null)} /></Field>
          <Field label="Gender">
            <Select value={form.gender ?? ""} onChange={(v) => set("gender", v || null)} options={["", "Female", "Male", "Non-binary", "Other"]} />
          </Field>
        </Grid>
      </Section>

      <Section title="Body & fitness">
        <Grid cols={2}>
          <Field label="Height (cm)"><Input type="number" value={form.height_cm?.toString() ?? ""} onChange={(v) => set("height_cm", num(v))} /></Field>
        </Grid>
        <p className="text-xs text-muted-foreground">Weight is tracked in the Body tab. Calorie and water targets are auto-calculated from your latest body data.</p>
        <Grid cols={2}>
          <Field label="Fitness level"><Select value={form.fitness_level ?? ""} onChange={(v) => set("fitness_level", v)} options={["beginner", "intermediate", "advanced", "elite"]} /></Field>
          <Field label="Activity level"><Select value={form.activity_level ?? ""} onChange={(v) => set("activity_level", v)} options={["sedentary", "light", "moderate", "active", "very active"]} /></Field>
        </Grid>
      </Section>

      <Section title="Sleep & hydration">
        <Grid cols={3}>
          <Field label="Sleep start"><Input type="time" value={(form.sleep_start as string | null) ?? ""} onChange={(v) => set("sleep_start", v || null)} /></Field>
          <Field label="Wake up"><Input type="time" value={(form.sleep_end as string | null) ?? ""} onChange={(v) => set("sleep_end", v || null)} /></Field>
          <Field label="Sleep goal (h)"><Input type="number" step="0.5" value={form.sleep_goal_hours?.toString() ?? ""} onChange={(v) => set("sleep_goal_hours", num(v))} /></Field>
        </Grid>
      </Section>

      <Section title="Health notes">
        <Field label="Allergies"><Input value={form.allergies ?? ""} onChange={(v) => set("allergies", v)} /></Field>
        <Field label="Injuries / limitations"><Input value={form.injuries ?? ""} onChange={(v) => set("injuries", v)} /></Field>
        <Field label="Medical notes"><Textarea value={form.medical_notes ?? ""} onChange={(v) => set("medical_notes", v)} /></Field>
      </Section>

      <Section title="Goals (free-form)">
        <Field label="Career"><Textarea value={form.career_goals ?? ""} onChange={(v) => set("career_goals", v)} /></Field>
        <Field label="Financial"><Textarea value={form.financial_goals ?? ""} onChange={(v) => set("financial_goals", v)} /></Field>
        <Field label="Fitness"><Textarea value={form.fitness_goals ?? ""} onChange={(v) => set("fitness_goals", v)} /></Field>
      </Section>

      <Section title="Rhythm">
        <Field label="Daily routine"><Textarea value={form.daily_routine ?? ""} onChange={(v) => set("daily_routine", v)} /></Field>
        <Field label="Work / school schedule"><Input value={form.work_schedule ?? ""} onChange={(v) => set("work_schedule", v)} /></Field>
        <Grid cols={2}>
          <Field label="Motivation style"><Select value={form.motivation_style ?? ""} onChange={(v) => set("motivation_style", v)} options={["discipline", "curiosity", "competition", "purpose", "reward"]} /></Field>
          <Field label="Personality style"><Select value={form.personality_style ?? ""} onChange={(v) => set("personality_style", v)} options={["balanced", "structured", "spontaneous", "analytical", "creative"]} /></Field>
        </Grid>
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-3xl p-5 md:p-6 space-y-4">
      <h2 className="font-display font-semibold text-lg">{title}</h2>
      {children}
    </motion.section>
  );
}
function Grid({ cols, children }: { cols: 2 | 3; children: React.ReactNode }) {
  return <div className={cols === 3 ? "grid grid-cols-1 sm:grid-cols-3 gap-3" : "grid grid-cols-1 sm:grid-cols-2 gap-3"}>{children}</div>;
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1.5">{label}</div>
      {children}
    </label>
  );
}
const baseInput = "w-full glass rounded-xl px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary";
function Input(props: { value: string; onChange: (v: string) => void; type?: string; step?: string }) {
  return <input type={props.type ?? "text"} step={props.step} value={props.value} onChange={(e) => props.onChange(e.target.value)} className={baseInput} />;
}
function Textarea(props: { value: string; onChange: (v: string) => void }) {
  return <textarea value={props.value} onChange={(e) => props.onChange(e.target.value)} className={`${baseInput} min-h-24`} />;
}
function Select(props: { value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <select value={props.value} onChange={(e) => props.onChange(e.target.value)} className={baseInput}>
      {props.options.map((o) => <option key={o} value={o}>{o || "—"}</option>)}
    </select>
  );
}