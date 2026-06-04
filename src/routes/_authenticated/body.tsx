import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Ruler, Trash2, X, Scale } from "lucide-react";
import { format, parseISO } from "date-fns";
import { toast } from "sonner";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { safeErrorMessage } from "@/lib/safe-error";
import { useProfile } from "@/lib/profile-hooks";
import { computeDailyNeeds } from "@/lib/needs";
import { Activity, Flame, Droplet } from "lucide-react";
import { toast as sonnerToast } from "sonner";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";

export const Route = createFileRoute("/_authenticated/body")({
  component: BodyPage,
});

type BodyLog = Tables<"body_logs">;

const MEASUREMENTS = [
  { key: "weight_kg", label: "Weight", suffix: "kg" },
  { key: "neck_cm", label: "Neck", suffix: "cm" },
  { key: "shoulders_cm", label: "Shoulders", suffix: "cm" },
  { key: "chest_cm", label: "Chest", suffix: "cm" },
  { key: "left_arm_cm", label: "Left Arm", suffix: "cm" },
  { key: "right_arm_cm", label: "Right Arm", suffix: "cm" },
  { key: "waist_cm", label: "Waist", suffix: "cm" },
  { key: "hips_cm", label: "Hips", suffix: "cm" },
  { key: "left_thigh_cm", label: "Left Thigh", suffix: "cm" },
  { key: "right_thigh_cm", label: "Right Thigh", suffix: "cm" },
  { key: "left_calf_cm", label: "Left Calf", suffix: "cm" },
  { key: "right_calf_cm", label: "Right Calf", suffix: "cm" },
] as const;

type FieldKey = (typeof MEASUREMENTS)[number]["key"];

function BodyPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const { data: profile } = useProfile();

  const { data: logs = [] } = useQuery({
    queryKey: ["body_logs", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("body_logs").select("*")
        .order("logged_on", { ascending: true });
      if (error) throw error;
      return (data ?? []) as BodyLog[];
    },
  });

  const needs = computeDailyNeeds(profile, logs);

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("body_logs").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Entry removed");
      qc.invalidateQueries({ queryKey: ["body_logs"] });
    },
    onError: (e) => toast.error(safeErrorMessage(e)),
  });

  const latest = (key: FieldKey): { value: number; date: string } | null => {
    for (let i = logs.length - 1; i >= 0; i--) {
      const v = (logs[i] as BodyLog)[key];
      if (v != null) return { value: Number(v), date: logs[i].logged_on };
    }
    return null;
  };

  const weightSeries = logs
    .filter((l) => l.weight_kg != null)
    .map((l) => ({ date: format(parseISO(l.logged_on), "MMM d"), value: Number(l.weight_kg) }));

  return (
    <div className="max-w-5xl mx-auto px-5 md:px-8 py-6 md:py-10 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold flex items-center gap-3">
            <Ruler className="size-7 text-success" /> Body
          </h1>
          <p className="text-muted-foreground mt-1">Weight and measurements over time.</p>
        </div>
        <button onClick={() => setOpen(true)}
          className="bg-success hover:bg-success/90 text-success-foreground px-4 py-3 min-h-[48px] rounded-xl text-sm font-semibold flex items-center gap-2 glow">
          <Plus className="size-4" /> Log Entry
        </button>
      </div>

      {/* Weight chart */}
      <div className="glass rounded-3xl p-5 md:p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-display font-semibold text-lg flex items-center gap-2">
              <Scale className="size-4 text-success" /> Weight Tracker
            </h2>
            <p className="text-xs text-muted-foreground">
              {latest("weight_kg")
                ? `Latest: ${latest("weight_kg")!.value} kg · ${format(parseISO(latest("weight_kg")!.date), "MMM d")}`
                : "No weight logged yet."}
            </p>
          </div>
        </div>
        {weightSeries.length >= 2 ? (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={weightSeries}>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 0.06)" />
              <XAxis dataKey="date" tick={{ fill: "oklch(0.7 0.01 260)", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "oklch(0.7 0.01 260)", fontSize: 10 }} domain={["dataMin - 2", "dataMax + 2"]} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: "oklch(0.16 0.008 260)", border: "1px solid oklch(1 0 0 / 0.1)", borderRadius: 12, fontSize: 12 }} />
              <Line type="monotone" dataKey="value" stroke="oklch(0.70 0.19 150)" strokeWidth={2.5} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="text-sm text-muted-foreground py-6 text-center">
            Log at least two weight entries to see your trend.
          </div>
        )}
      </div>

      {/* Latest measurements grid */}
      <div className="glass rounded-3xl p-5 md:p-6">
        <h2 className="font-display font-semibold text-lg mb-4">Latest Measurements</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {MEASUREMENTS.filter((m) => m.key !== "weight_kg").map((m) => {
            const l = latest(m.key);
            return (
              <div key={m.key} className="rounded-2xl bg-white/[0.02] border border-border/40 p-4">
                <div className="text-xs text-muted-foreground">{m.label}</div>
                <div className="text-xl font-display font-bold mt-1">
                  {l ? l.value : "—"}
                  {l && <span className="text-xs text-muted-foreground font-normal"> {m.suffix}</span>}
                </div>
                <div className="text-[10px] text-muted-foreground mt-0.5">
                  {l ? format(parseISO(l.date), "MMM d, yyyy") : "Not logged"}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Auto-calculated daily targets (read-only) */}
      <div className="glass rounded-3xl p-5 md:p-6">
        <h2 className="font-display font-semibold text-lg mb-1">Daily Targets</h2>
        <p className="text-xs text-muted-foreground mb-4">Calculated automatically from your latest weight, height, age, and activity level.</p>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-white/[0.02] border border-border/40 p-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground"><Flame className="size-3.5 text-success" />Calories</div>
            <div className="text-2xl font-display font-bold mt-1">{needs.calories ?? "—"}<span className="text-xs text-muted-foreground font-normal"> kcal</span></div>
          </div>
          <div className="rounded-2xl bg-white/[0.02] border border-border/40 p-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground"><Droplet className="size-3.5 text-success" />Water</div>
            <div className="text-2xl font-display font-bold mt-1">{needs.waterMl ?? "—"}<span className="text-xs text-muted-foreground font-normal"> ml</span></div>
          </div>
        </div>
        {needs.missing.length > 0 && (
          <p className="text-xs text-warning mt-3">Add {needs.missing.join(", ")} to unlock precise targets.</p>
        )}
      </div>

      {/* Connect Device — Mi Band / Google Fit */}
      <div className="glass rounded-3xl p-5 md:p-6">
        <div className="flex items-start gap-3 mb-3">
          <div className="size-10 rounded-2xl bg-success/15 grid place-items-center shrink-0">
            <Activity className="size-5 text-success" />
          </div>
          <div className="flex-1">
            <h2 className="font-display font-semibold text-lg">Connect Device</h2>
            <p className="text-xs text-muted-foreground">Import steps, heart rate, sleep, and workouts from your Xiaomi Mi Band.</p>
          </div>
        </div>
        <div className="rounded-2xl bg-white/[0.02] border border-border/40 p-4 text-sm space-y-2">
          <p className="font-medium">Xiaomi Mi Band → Mi Fitness → Google Fit → Aurora</p>
          <p className="text-muted-foreground text-xs leading-relaxed">
            Mi Fitness does not have a public API. The simplest pipeline is to enable Google Fit
            sync inside the Mi Fitness app, then connect Google Fit here. Aurora will pull the
            last 7 days of steps, heart rate, sleep sessions, and workouts on every sync.
          </p>
          <ol className="text-xs text-muted-foreground list-decimal pl-4 space-y-1">
            <li>In Mi Fitness, open Profile → Add accounts → Google Fit, sign in.</li>
            <li>Come back here and tap Connect Google Fit.</li>
            <li>Aurora will sync the last 7 days and refresh on demand.</li>
          </ol>
        </div>
        <button
          onClick={() => sonnerToast.info("Google Fit sync setup is coming — your developer needs to add Google OAuth credentials before this can be enabled.")}
          className="mt-3 w-full md:w-auto bg-success/30 text-success-foreground/80 px-4 py-3 min-h-[48px] rounded-xl text-sm font-semibold inline-flex items-center justify-center gap-2 cursor-not-allowed"
        >
          <Activity className="size-4" /> Connect Google Fit — Setup required
        </button>
      </div>

      {/* History */}
      <div className="glass rounded-3xl p-5 md:p-6">
        <h2 className="font-display font-semibold text-lg mb-4">History</h2>
        {logs.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-sm text-muted-foreground mb-4">No body entries yet.</p>
            <button onClick={() => setOpen(true)}
              className="bg-success hover:bg-success/90 text-success-foreground px-5 py-3 min-h-[48px] rounded-xl text-sm font-semibold inline-flex items-center gap-2">
              <Plus className="size-4" /> Log Your First Entry
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {[...logs].reverse().map((l) => {
              const filled = MEASUREMENTS.filter((m) => (l as BodyLog)[m.key] != null);
              return (
                <div key={l.id} className="rounded-2xl bg-white/[0.02] border border-border/40 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm font-medium">{format(parseISO(l.logged_on), "EEE, MMM d, yyyy")}</div>
                    <button onClick={() => remove.mutate(l.id)} className="p-2 rounded-lg hover:bg-destructive/10 min-h-[36px] min-w-[36px]" aria-label="Delete">
                      <Trash2 className="size-4 text-muted-foreground" />
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    {filled.map((m) => (
                      <span key={m.key}>
                        <span className="text-foreground">{(l as BodyLog)[m.key]} {m.suffix}</span> {m.label}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <AnimatePresence>
        {open && <BodyLogger onClose={() => setOpen(false)} userId={user!.id} />}
      </AnimatePresence>
    </div>
  );
}

function BodyLogger({ onClose, userId }: { onClose: () => void; userId: string }) {
  const qc = useQueryClient();
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [values, setValues] = useState<Record<string, string>>({});

  const save = useMutation({
    mutationFn: async () => {
      const row: TablesInsert<"body_logs"> = { user_id: userId, logged_on: date };
      let any = false;
      for (const m of MEASUREMENTS) {
        const v = values[m.key];
        if (v != null && v !== "") {
          (row as Record<string, unknown>)[m.key] = Number(v);
          any = true;
        }
      }
      if (!any) throw new Error("Enter at least one value");
      const { error } = await supabase.from("body_logs").insert(row);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Logged");
      qc.invalidateQueries({ queryKey: ["body_logs"] });
      onClose();
    },
    onError: (e) => toast.error(safeErrorMessage(e)),
  });

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-background/85 backdrop-blur-sm grid place-items-center p-3 overflow-y-auto"
      onClick={onClose}>
      <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        className="glass rounded-3xl p-5 md:p-6 w-full max-w-2xl space-y-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="font-display font-semibold text-xl">Log Body Entry</h3>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/5 min-h-[40px] min-w-[40px]">
            <X className="size-4" />
          </button>
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Date</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
            className="w-full bg-white/5 rounded-xl px-3 py-2.5 text-sm" />
        </div>
        <p className="text-xs text-muted-foreground">Fill any fields you measured today. Skip the rest.</p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {MEASUREMENTS.map((m) => (
            <label key={m.key} className="space-y-1">
              <div className="text-xs text-muted-foreground">{m.label} ({m.suffix})</div>
              <input type="number" step="0.1" value={values[m.key] ?? ""}
                onChange={(e) => setValues((v) => ({ ...v, [m.key]: e.target.value }))}
                className="w-full bg-white/5 rounded-xl px-3 py-2.5 text-sm" />
            </label>
          ))}
        </div>
        <div className="flex gap-2 pt-2">
          <button onClick={onClose} className="flex-1 px-4 py-3 min-h-[48px] rounded-xl bg-white/5 text-sm">Cancel</button>
          <button onClick={() => save.mutate()} disabled={save.isPending}
            className="flex-1 px-4 py-3 min-h-[48px] rounded-xl bg-success text-success-foreground text-sm font-semibold disabled:opacity-50">
            {save.isPending ? "Saving…" : "Save Entry"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}