import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { motion } from "framer-motion";
import { Moon, Smile, BookOpen, Plus, Trash2, Zap, Flame as Stress } from "lucide-react";
import { format, subDays, parseISO } from "date-fns";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";

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
        <TabsList className="grid grid-cols-3 w-full bg-white/5 h-11">
          <TabsTrigger value="sleep" className="gap-2"><Moon className="size-4" />Sleep</TabsTrigger>
          <TabsTrigger value="mood" className="gap-2"><Smile className="size-4" />Mood</TabsTrigger>
          <TabsTrigger value="journal" className="gap-2"><BookOpen className="size-4" />Journal</TabsTrigger>
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
  const avg = logs.length ? (logs.reduce((s, l) => s + Number(l.duration_hours ?? 0), 0) / logs.length).toFixed(1) : "—";
  const avgQ = logs.filter((l) => l.quality).length
    ? (logs.reduce((s, l) => s + (l.quality ?? 0), 0) / logs.filter((l) => l.quality).length).toFixed(1)
    : "—";

  const computeDuration = (b: string, w: string) => {
    const [bh, bm] = b.split(":").map(Number);
    const [wh, wm] = w.split(":").map(Number);
    let mins = wh * 60 + wm - (bh * 60 + bm);
    if (mins < 0) mins += 24 * 60;
    return mins / 60;
  };

  const submit = async () => {
    if (!user) return;
    const duration = computeDuration(bedtime, wake);
    const { error } = await supabase.from("sleep_logs").insert({
      user_id: user.id, slept_on: format(new Date(), "yyyy-MM-dd"),
      bedtime, wake_time: wake, duration_hours: duration, quality, notes: notes || null,
    });
    if (error) return toast.error(error.message);
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
      <div className="grid grid-cols-2 gap-4">
        <StatTile icon={Moon} label="Avg sleep (14d)" value={avg} suffix="h" />
        <StatTile icon={Zap} label="Avg quality" value={avgQ} suffix="/5" />
      </div>

      <div className="glass rounded-3xl p-6 space-y-4">
        <h3 className="font-display font-semibold">Log last night</h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-muted-foreground">Bedtime</label>
            <Input type="time" value={bedtime} onChange={(e) => setBedtime(e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Wake</label>
            <Input type="time" value={wake} onChange={(e) => setWake(e.target.value)} />
          </div>
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Quality</label>
          <Rating value={quality} onChange={setQuality} />
        </div>
        <Textarea placeholder="Notes (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
        <Button onClick={submit} className="w-full bg-[image:var(--gradient-primary)]">
          <Plus className="size-4 mr-1" />Log sleep
        </Button>
      </div>

      <div className="glass rounded-3xl p-6">
        <h3 className="font-display font-semibold mb-4">Last 14 days</h3>
        {logs.length === 0 ? (
          <div className="text-sm text-muted-foreground text-center py-8">No entries yet.</div>
        ) : (
          <div className="space-y-2">
            {logs.map((l) => (
              <div key={l.id} className="flex items-center gap-3 py-2 border-b border-white/5 last:border-0">
                <Moon className="size-4 text-primary-glow" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium">{format(parseISO(l.slept_on), "EEE, MMM d")}</div>
                  <div className="text-xs text-muted-foreground">
                    {l.bedtime?.slice(0, 5) ?? "—"} → {l.wake_time?.slice(0, 5) ?? "—"} · {Number(l.duration_hours ?? 0).toFixed(1)}h · {"★".repeat(l.quality ?? 0)}
                  </div>
                </div>
                <button onClick={() => del(l.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="size-4" /></button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------------- MOOD ---------------- */
const MOOD_EMOJI = ["😔", "😕", "😐", "🙂", "😄"];
const MOOD_TAGS = ["calm", "anxious", "energized", "tired", "focused", "grateful", "stressed", "happy"];

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
    ? (logs.reduce((s, l) => s + (l.energy ?? 0), 0) / logs.filter((l) => l.energy).length).toFixed(1)
    : "—";

  const toggleTag = (t: string) => setTags((p) => p.includes(t) ? p.filter((x) => x !== t) : [...p, t]);

  const submit = async () => {
    if (!user) return;
    const { error } = await supabase.from("mood_logs").insert({
      user_id: user.id, mood, energy, stress, tags, notes: notes || null,
    });
    if (error) return toast.error(error.message);
    toast.success("Check-in saved");
    setNotes(""); setTags([]);
    refetch();
  };

  const del = async (id: string) => { await supabase.from("mood_logs").delete().eq("id", id); refetch(); };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <StatTile icon={Smile} label="Avg mood (14d)" value={avgMood} suffix="/5" />
        <StatTile icon={Zap} label="Avg energy" value={avgEnergy} suffix="/5" />
      </div>

      <div className="glass rounded-3xl p-6 space-y-5">
        <h3 className="font-display font-semibold">How are you, right now?</h3>
        <div>
          <label className="text-xs text-muted-foreground">Mood</label>
          <div className="flex justify-between mt-2">
            {MOOD_EMOJI.map((e, i) => (
              <button key={i} onClick={() => setMood(i + 1)}
                className={`text-3xl transition-all ${mood === i + 1 ? "scale-125" : "opacity-40 hover:opacity-70"}`}>
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
                className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                  tags.includes(t) ? "bg-primary/30 border-primary text-foreground" : "border-white/10 text-muted-foreground hover:bg-white/5"
                }`}>
                {t}
              </button>
            ))}
          </div>
        </div>
        <Textarea placeholder="Notes (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
        <Button onClick={submit} className="w-full bg-[image:var(--gradient-primary)]">
          <Plus className="size-4 mr-1" />Save check-in
        </Button>
      </div>

      <div className="glass rounded-3xl p-6">
        <h3 className="font-display font-semibold mb-4">Recent check-ins</h3>
        {logs.length === 0 ? (
          <div className="text-sm text-muted-foreground text-center py-8">No check-ins yet.</div>
        ) : (
          <div className="space-y-2">
            {logs.slice(0, 20).map((l) => (
              <div key={l.id} className="flex items-start gap-3 py-2 border-b border-white/5 last:border-0">
                <span className="text-2xl">{MOOD_EMOJI[l.mood - 1]}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-muted-foreground">{format(parseISO(l.logged_at), "MMM d · HH:mm")}</div>
                  <div className="text-sm">
                    Energy {l.energy ?? "—"}/5 · Stress {l.stress ?? "—"}/5
                  </div>
                  {l.tags.length > 0 && <div className="text-xs text-primary-glow mt-1">{l.tags.join(" · ")}</div>}
                  {l.notes && <p className="text-xs text-muted-foreground mt-1">{l.notes}</p>}
                </div>
                <button onClick={() => del(l.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="size-4" /></button>
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
    if (error) return toast.error(error.message);
    toast.success("Entry saved");
    setTitle(""); setContent(""); setMood(null);
    refetch();
  };

  const del = async (id: string) => { await supabase.from("journal_entries").delete().eq("id", id); refetch(); };

  return (
    <div className="space-y-5">
      <div className="glass rounded-3xl p-6 space-y-3">
        <h3 className="font-display font-semibold">New entry</h3>
        <Input placeholder="Title (optional)" value={title} onChange={(e) => setTitle(e.target.value)} />
        <Textarea placeholder="What's on your mind?" value={content} onChange={(e) => setContent(e.target.value)} rows={6} />
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Mood:</span>
            {MOOD_EMOJI.map((e, i) => (
              <button key={i} onClick={() => setMood(i + 1)}
                className={`text-xl transition-all ${mood === i + 1 ? "scale-125" : "opacity-40 hover:opacity-70"}`}>
                {e}
              </button>
            ))}
          </div>
          <Button onClick={submit} disabled={!content.trim()} className="bg-[image:var(--gradient-primary)]">
            <Plus className="size-4 mr-1" />Save
          </Button>
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
              <button onClick={() => del(e.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="size-4" /></button>
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
function StatTile({ icon: Icon, label, value, suffix }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string; suffix?: string }) {
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

function Rating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex gap-2 mt-2">
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} onClick={() => onChange(n)}
          className={`flex-1 h-9 rounded-lg border transition-all ${
            n <= value ? "bg-primary/40 border-primary" : "border-white/10 hover:bg-white/5"
          }`}>
          {n}
        </button>
      ))}
    </div>
  );
}
