import { createFileRoute } from "@tanstack/react-router";
import { safeErrorMessage } from "@/lib/safe-error";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { motion } from "framer-motion";
import { Moon, Smile, BookOpen, Plus, Trash2, Zap, Flame as Stress, Star, Target } from "lucide-react";
import { format, subDays, parseISO } from "date-fns";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell } from "recharts";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { useProfile } from "@/lib/profile-hooks";
import { toast } from "sonner";
import { sleepStatus, STATUS_HEX, STATUS_TEXT } from "@/lib/score";

export const Route = createFileRoute("/_authenticated/wellness")({
  component: WellnessPage,
});

function WellnessPage() {
  return (
    <div className="max-w-5xl mx-auto px-5 md:px-8 py-6 md:py-10 space-y-6">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl md:text-4xl font-bold">Wellness</h1>
        <p className="text-muted-foreground mt-1">Sleep, mood, and your inner voice.</p>
      </motion.div>

      <Tabs defaultValue="sleep" className="w-full">
        <TabsList className="grid grid-cols-3 w-full bg-white/5 h-12">
          <TabsTrigger value="sleep" className="gap-2 min-h-[44px]"><Moon className="size-4" />Sleep</TabsTrigger>
          <TabsTrigger value="mood" className="gap-2 min-h-[44px]"><Smile className="size-4" />Mood</TabsTrigger>
          <TabsTrigger value="journal" className="gap-2 min-h-[44px]"><BookOpen className="size-4" />Journal</TabsTrigger>
        </TabsList>
        <TabsContent value="sleep" className="mt-5"><SleepTab /></TabsContent>
        <TabsContent value="mood" className="mt-5"><MoodTab /></TabsContent>
        <TabsContent value="journal" className="mt-5"><JournalTab /></TabsContent>
      </Tabs>
    </div>
  );
}

/* ---------------- SLEEP ---------------- */
function SleepTab() {
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const [bedtime, setBedtime] = useState("23:00");
  const [wake, setWake] = useState("07:00");
  const [quality, setQuality] = useState(4);
  const [notes, setNotes] = useState("");

  const { data, refetch } = useQuery({
    queryKey: ["sleep_logs", user?.id],
    queryFn: async () => {
      const since = format(subDays(new Date(), 13), "yyyy-MM-dd");
      const { data } = await supabase.from("sleep_logs").select("*").gte("slept_on", since).order("slept_on", { ascending: false });
      return data ?? [];
    },
  });

  const logs = data ?? [];
  const last7 = logs.filter((l) => l.slept_on >= format(subDays(new Date(), 6), "yyyy-MM-dd"));
  const avg7 = last7.length ? last7.reduce((s, l) => s + Number(l.duration_hours ?? 0), 0) / last7.length : 0;
  const status7 = sleepStatus(avg7);
  const sleepScore7 = avg7 >= 7 ? 100 : avg7 >= 6 ? 60 : avg7 > 0 ? 30 : 0;

  const targetStart = profile?.sleep_start ?? null;
  const targetEnd = profile?.sleep_end ?? null;

  const chartData = Array.from({ length: 7 }, (_, i) => {
    const d = format(subDays(new Date(), 6 - i), "yyyy-MM-dd");
    const e = logs.find((l) => l.slept_on === d);
    const hrs = Number(e?.duration_hours ?? 0);
    return { date: format(parseISO(d), "EEE"), hours: hrs, _status: hrs > 0 ? sleepStatus(hrs) : "bad" as const };
  });

  const computeDuration = (b: string, w: string) => {
    const [bh, bm] = b.split(":").map(Number);
    const [wh, wm] = w.split(":").map(Number);
    let mins = wh * 60 + wm - (bh * 60 + bm);
    if (mins < 0) mins += 24 * 60;
    return mins / 60;
  };

  const hitWindow = (logBed: string | null, logWake: string | null) => {
    if (!targetStart || !targetEnd || !logBed || !logWake) return null;
    const within = (a: string, target: string, tolMin = 30) => {
      const [ah, am] = a.split(":").map(Number);
      const [th, tm] = target.split(":").map(Number);
      let diff = Math.abs((ah * 60 + am) - (th * 60 + tm));
      if (diff > 720) diff = 1440 - diff;
      return diff <= tolMin;
    };
    return within(logBed, targetStart) && within(logWake, targetEnd);
  };

  const submit = async () => {
    if (!user) return;
    const duration = computeDuration(bedtime, wake);
    const { error } = await supabase.from("sleep_logs").insert({
      user_id: user.id, slept_on: format(new Date(), "yyyy-MM-dd"),
      bedtime, wake_time: wake, duration_hours: duration, quality, notes: notes || null,
    });
    if (error) return toast.error(safeErrorMessage(error));
    toast.success(`Logged ${duration.toFixed(1)}h sleep`);
    setNotes("");
    refetch();
  };

  const del = async (id: string) => {
    await supabase.from("sleep_logs").delete().eq("id", id);
    refetch();
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-3">
        <StatTile icon={Moon} label="7-Day Avg" value={avg7 > 0 ? avg7.toFixed(1) : "—"} suffix="h" color={STATUS_HEX[status7]} />
        <StatTile icon={Star} label="Sleep Score" value={`${sleepScore7}`} suffix="/100" color={STATUS_HEX[status7]} />
        <StatTile icon={Target} label="Window" value={targetStart ? `${targetStart.slice(0,5)}–${targetEnd?.slice(0,5)}` : "Not Set"} color="oklch(0.7 0.01 260)" />
      </div>

      <div className="glass rounded-3xl p-5 md:p-6">
        <h3 className="font-display font-semibold mb-4">Last 7 Days</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 0.06)" />
            <XAxis dataKey="date" tick={{ fill: "oklch(0.7 0.01 260)", fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "oklch(0.7 0.01 260)", fontSize: 10 }} domain={[0, 12]} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ background: "oklch(0.16 0.008 260)", border: "1px solid oklch(1 0 0 / 0.1)", borderRadius: 12, fontSize: 12 }} />
            <Bar dataKey="hours" radius={[8, 8, 0, 0]}>
              {chartData.map((d, i) => <Cell key={i} fill={d.hours === 0 ? "oklch(0.3 0.01 260)" : STATUS_HEX[d._status]} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div className="flex items-center justify-center gap-4 mt-3 text-[11px] text-muted-foreground">
          <Legend swatch={STATUS_HEX.good} label="≥ 7h" />
          <Legend swatch={STATUS_HEX.warn} label="6–7h" />
          <Legend swatch={STATUS_HEX.bad} label="< 6h" />
        </div>
      </div>

      <div className="glass rounded-3xl p-5 md:p-6 space-y-4">
        <h3 className="font-display font-semibold">Log Last Night</h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-muted-foreground">Bedtime</label>
            <Input type="time" value={bedtime} onChange={(e) => setBedtime(e.target.value)} className="min-h-[44px]" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Wake Time</label>
            <Input type="time" value={wake} onChange={(e) => setWake(e.target.value)} className="min-h-[44px]" />
          </div>
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Sleep Quality</label>
          <StarRating value={quality} onChange={setQuality} />
        </div>
        <Textarea placeholder="Notes (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
        <button onClick={submit} className="w-full bg-success hover:bg-success/90 text-success-foreground px-4 py-3 min-h-[48px] rounded-xl text-sm font-semibold flex items-center justify-center gap-2">
          <Plus className="size-4" />Log Sleep
        </button>
      </div>

      <div className="glass rounded-3xl p-5 md:p-6">
        <h3 className="font-display font-semibold mb-4">Recent Entries</h3>
        {logs.length === 0 ? (
          <div className="text-sm text-muted-foreground text-center py-8">No entries yet. Log your first night above.</div>
        ) : (
          <div className="space-y-2">
            {logs.map((l) => {
              const hrs = Number(l.duration_hours ?? 0);
              const s = sleepStatus(hrs);
              const hitW = hitWindow(l.bedtime, l.wake_time);
              return (
                <div key={l.id} className="flex items-center gap-3 py-2 border-b border-white/5 last:border-0">
                  <Moon className="size-4" style={{ color: STATUS_HEX[s] }} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium">{format(parseISO(l.slept_on), "EEE, MMM d")}</div>
                    <div className="text-xs text-muted-foreground">
                      {l.bedtime?.slice(0, 5) ?? "—"} → {l.wake_time?.slice(0, 5) ?? "—"} · <span style={{ color: STATUS_HEX[s] }}>{hrs.toFixed(1)}h</span> · {"★".repeat(l.quality ?? 0)}
                      {hitW !== null && (
                        <span className={`ml-2 ${hitW ? "text-success" : "text-destructive"}`}>
                          {hitW ? "✓ Window" : "✗ Off Window"}
                        </span>
                      )}
                    </div>
                  </div>
                  <button onClick={() => del(l.id)} className="text-muted-foreground hover:text-destructive p-2 min-h-[40px] min-w-[40px]" aria-label="Delete"><Trash2 className="size-4" /></button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function Legend({ swatch, label }: { swatch: string; label: string }) {
  return <div className="flex items-center gap-1.5"><span className="size-3 rounded" style={{ background: swatch }} />{label}</div>;
}

function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex gap-1 mt-2">
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} onClick={() => onChange(n)}
          className={`flex-1 min-h-[44px] rounded-lg border transition-all flex items-center justify-center ${
            n <= value ? "bg-warning/20 border-warning" : "border-white/10 hover:bg-white/5"
          }`}>
          <Star className={`size-5 ${n <= value ? "fill-warning text-warning" : "text-muted-foreground"}`} />
        </button>
      ))}
    </div>
  );
}

/* ---------------- MOOD ---------------- */
const MOOD_EMOJI = ["😔", "😕", "😐", "🙂", "😄"];
const MOOD_TAGS = ["Calm", "Anxious", "Energized", "Tired", "Focused", "Grateful", "Stressed", "Happy"];

function MoodTab() {
  const { user } = useAuth();
  const [mood, setMood] = useState(4);
  const [energy, setEnergy] = useState(3);
  const [stress, setStress] = useState(2);
  const [tags, setTags] = useState<string[]>([]);
  const [notes, setNotes] = useState("");

  const { data, refetch } = useQuery({
    queryKey: ["mood_logs", user?.id],
    queryFn: async () => {
      const since = subDays(new Date(), 14).toISOString();
      const { data } = await supabase.from("mood_logs").select("*").gte("logged_at", since).order("logged_at", { ascending: false });
      return data ?? [];
    },
  });

  const logs = data ?? [];
  const avgMood = logs.length ? (logs.reduce((s, l) => s + l.mood, 0) / logs.length).toFixed(1) : "—";
  const avgEnergy = logs.filter((l) => l.energy).length
    ? (logs.reduce((s, l) => s + (l.energy ?? 0), 0) / logs.filter((l) => l.energy).length).toFixed(1) : "—";

  const toggleTag = (t: string) => setTags((p) => p.includes(t) ? p.filter((x) => x !== t) : [...p, t]);

  const submit = async () => {
    if (!user) return;
    const { error } = await supabase.from("mood_logs").insert({
      user_id: user.id, mood, energy, stress, tags, notes: notes || null,
    });
    if (error) return toast.error(safeErrorMessage(error));
    toast.success("Check-in saved");
    setNotes(""); setTags([]);
    refetch();
  };

  const del = async (id: string) => { await supabase.from("mood_logs").delete().eq("id", id); refetch(); };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3">
        <StatTile icon={Smile} label="Avg Mood (14d)" value={String(avgMood)} suffix="/5" />
        <StatTile icon={Zap} label="Avg Energy" value={String(avgEnergy)} suffix="/5" />
      </div>

      <div className="glass rounded-3xl p-5 md:p-6 space-y-5">
        <h3 className="font-display font-semibold">How Are You, Right Now?</h3>
        <div>
          <label className="text-xs text-muted-foreground">Mood</label>
          <div className="flex justify-between mt-2">
            {MOOD_EMOJI.map((e, i) => (
              <button key={i} onClick={() => setMood(i + 1)}
                className={`text-3xl transition-all min-h-[48px] min-w-[48px] ${mood === i + 1 ? "scale-125" : "opacity-40 hover:opacity-70"}`}>
                {e}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="text-xs text-muted-foreground flex items-center gap-1.5"><Zap className="size-3" />Energy</label>
          <Rating value={energy} onChange={setEnergy} />
        </div>
        <div>
          <label className="text-xs text-muted-foreground flex items-center gap-1.5"><Stress className="size-3" />Stress</label>
          <Rating value={stress} onChange={setStress} />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Tags</label>
          <div className="flex flex-wrap gap-2 mt-2">
            {MOOD_TAGS.map((t) => (
              <button key={t} onClick={() => toggleTag(t)}
                className={`text-xs px-3 py-2 rounded-full border transition-colors min-h-[36px] ${
                  tags.includes(t) ? "bg-success/20 border-success text-success" : "border-white/10 text-muted-foreground hover:bg-white/5"
                }`}>{t}</button>
            ))}
          </div>
        </div>
        <Textarea placeholder="Notes (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
        <button onClick={submit} className="w-full bg-success hover:bg-success/90 text-success-foreground px-4 py-3 min-h-[48px] rounded-xl text-sm font-semibold flex items-center justify-center gap-2">
          <Plus className="size-4" />Save Check-In
        </button>
      </div>

      <div className="glass rounded-3xl p-5 md:p-6">
        <h3 className="font-display font-semibold mb-4">Recent Check-Ins</h3>
        {logs.length === 0 ? (
          <div className="text-sm text-muted-foreground text-center py-8">No check-ins yet.</div>
        ) : (
          <div className="space-y-2">
            {logs.slice(0, 20).map((l) => (
              <div key={l.id} className="flex items-start gap-3 py-2 border-b border-white/5 last:border-0">
                <span className="text-2xl">{MOOD_EMOJI[l.mood - 1]}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-muted-foreground">{format(parseISO(l.logged_at), "MMM d · HH:mm")}</div>
                  <div className="text-sm">Energy {l.energy ?? "—"}/5 · Stress {l.stress ?? "—"}/5</div>
                  {l.tags?.length > 0 && <div className="text-xs text-success mt-1">{l.tags.join(" · ")}</div>}
                  {l.notes && <p className="text-xs text-muted-foreground mt-1">{l.notes}</p>}
                </div>
                <button onClick={() => del(l.id)} className="text-muted-foreground hover:text-destructive p-2"><Trash2 className="size-4" /></button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------------- JOURNAL ---------------- */
function JournalTab() {
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [mood, setMood] = useState<number | null>(null);

  const { data, refetch } = useQuery({
    queryKey: ["journal_entries", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("journal_entries").select("*").order("created_at", { ascending: false }).limit(50);
      return data ?? [];
    },
  });

  const entries = data ?? [];

  const submit = async () => {
    if (!user || !content.trim()) return;
    const { error } = await supabase.from("journal_entries").insert({
      user_id: user.id, title: title || null, content, mood, tags: [],
    });
    if (error) return toast.error(safeErrorMessage(error));
    toast.success("Entry saved");
    setTitle(""); setContent(""); setMood(null);
    refetch();
  };

  const del = async (id: string) => { await supabase.from("journal_entries").delete().eq("id", id); refetch(); };

  return (
    <div className="space-y-5">
      <div className="glass rounded-3xl p-5 md:p-6 space-y-3">
        <h3 className="font-display font-semibold">New Entry</h3>
        <Input placeholder="Title (optional)" value={title} onChange={(e) => setTitle(e.target.value)} className="min-h-[44px]" />
        <Textarea placeholder="What's on your mind?" value={content} onChange={(e) => setContent(e.target.value)} rows={6} />
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-1">
            <span className="text-xs text-muted-foreground mr-2">Mood:</span>
            {MOOD_EMOJI.map((e, i) => (
              <button key={i} onClick={() => setMood(i + 1)}
                className={`text-xl transition-all min-h-[40px] min-w-[40px] ${mood === i + 1 ? "scale-125" : "opacity-40 hover:opacity-70"}`}>
                {e}
              </button>
            ))}
          </div>
          <button onClick={submit} disabled={!content.trim()}
            className="bg-success hover:bg-success/90 text-success-foreground px-5 py-3 min-h-[44px] rounded-xl text-sm font-semibold flex items-center gap-2 disabled:opacity-50">
            <Plus className="size-4" />Save
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {entries.length === 0 ? (
          <div className="glass rounded-3xl p-10 text-center text-sm text-muted-foreground">
            Your journal is empty. Write your first entry above.
          </div>
        ) : entries.map((e) => (
          <div key={e.id} className="glass rounded-2xl p-5">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                {e.mood && <span className="text-lg">{MOOD_EMOJI[e.mood - 1]}</span>}
                <h4 className="font-semibold">{e.title || format(parseISO(e.entry_date), "MMM d, yyyy")}</h4>
              </div>
              <button onClick={() => del(e.id)} className="text-muted-foreground hover:text-destructive p-2"><Trash2 className="size-4" /></button>
            </div>
            <div className="text-xs text-muted-foreground mb-2">{format(parseISO(e.created_at), "MMM d, yyyy · HH:mm")}</div>
            <p className="text-sm whitespace-pre-wrap text-foreground/90">{e.content}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------------- Shared ---------------- */
function StatTile({ icon: Icon, label, value, suffix, color }: { icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>; label: string; value: string; suffix?: string; color?: string }) {
  return (
    <div className="glass rounded-2xl p-4 md:p-5">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-muted-foreground">{label}</span>
        <Icon className="size-4" style={{ color: color ?? "oklch(0.70 0.19 150)" }} />
      </div>
      <div className="text-xl md:text-2xl font-display font-bold" style={{ color: color ?? undefined }}>
        {value}<span className="text-sm text-muted-foreground font-normal">{suffix}</span>
      </div>
    </div>
  );
}

function Rating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex gap-2 mt-2">
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} onClick={() => onChange(n)}
          className={`flex-1 min-h-[44px] rounded-lg border transition-all ${
            n <= value ? "bg-success/30 border-success text-success" : "border-white/10 hover:bg-white/5"
          }`}>{n}</button>
      ))}
    </div>
  );
}
