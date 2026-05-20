import { useMemo } from "react";
import { motion } from "framer-motion";
import { STATUS_HEX, muscleStatus, type Status } from "@/lib/score";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";

/**
 * Stylized front + back anatomical map. Each region's color reflects training
 * volume in the past 4 weeks vs a personal target.
 */

const MUSCLE_REGIONS = [
  "Chest", "Back", "Shoulders", "Biceps", "Triceps",
  "Legs", "Glutes", "Core",
] as const;
type Region = typeof MUSCLE_REGIONS[number];

export interface MuscleVolume {
  region: Region;
  /** 0..1+ normalized vs target weekly sets */
  score: number;
  weeklySets: number;
}

interface Props {
  data: MuscleVolume[];
  className?: string;
}

const TARGETS: Record<Region, number> = {
  Chest: 12, Back: 14, Shoulders: 10, Biceps: 8, Triceps: 8,
  Legs: 14, Glutes: 10, Core: 10,
};

export function computeMuscleVolumes(
  primaryCounts: Partial<Record<Region, number>>,
  secondaryCounts: Partial<Record<Region, number>>,
): MuscleVolume[] {
  return MUSCLE_REGIONS.map((region) => {
    const weeklySets = (primaryCounts[region] ?? 0) + 0.5 * (secondaryCounts[region] ?? 0);
    const score = weeklySets / TARGETS[region];
    return { region, score, weeklySets };
  });
}

export function BodyMuscleMap({ data, className }: Props) {
  const map = useMemo(() => {
    const m = new Map<Region, MuscleVolume>();
    for (const d of data) m.set(d.region, d);
    return m;
  }, [data]);

  const colorFor = (region: Region) => {
    const v = map.get(region);
    if (!v || v.weeklySets === 0) return "oklch(0.30 0.01 260)";
    const s: Status = muscleStatus(Math.min(1.2, v.score));
    return STATUS_HEX[s];
  };

  const info = (region: Region) => {
    const v = map.get(region);
    const sets = v?.weeklySets ?? 0;
    const ratio = Math.min(1.2, v?.score ?? 0);
    const rating = Math.round(Math.min(1, ratio) * 100);
    const status: Status = sets === 0 ? "bad" : muscleStatus(ratio);
    const label = sets === 0 ? "Untrained" : status === "good" ? "Strong" : status === "warn" ? "Moderate" : "Weak";
    return { region, sets, rating, status, label };
  };

  return (
    <div className={className}>
      <div className="grid grid-cols-2 gap-4">
        <Silhouette label="Front" colorFor={colorFor} info={info} side="front" />
        <Silhouette label="Back" colorFor={colorFor} info={info} side="back" />
      </div>
      <div className="flex items-center justify-center gap-4 mt-4 text-[11px]">
        <Legend swatch="oklch(0.30 0.01 260)" label="Untrained" />
        <Legend swatch={STATUS_HEX.bad} label="Weak" />
        <Legend swatch={STATUS_HEX.warn} label="Moderate" />
        <Legend swatch={STATUS_HEX.good} label="Strong" />
      </div>
    </div>
  );
}

function Legend({ swatch, label }: { swatch: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5 text-muted-foreground">
      <span className="size-3 rounded" style={{ background: swatch }} />
      {label}
    </div>
  );
}

function Silhouette({
  side, colorFor, info, label,
}: {
  side: "front" | "back";
  colorFor: (r: Region) => string;
  info: (r: Region) => { region: Region; sets: number; rating: number; status: Status; label: string };
  label: string;
}) {
  // Simplified anatomical regions positioned over a humanoid silhouette.
  // viewBox 100x220 — keep proportions readable.
  return (
    <div className="rounded-2xl bg-white/[0.02] border border-border/40 p-3 flex flex-col items-center">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">{label}</div>
      <svg viewBox="0 0 100 220" className="w-full max-w-[180px] h-auto">
        {/* body outline */}
        <path
          d="M50 8 c8 0 14 6 14 14 c0 6 -3 10 -7 12 c10 2 18 8 22 18 l4 24 c1 6 -2 10 -6 12 l-4 22 c4 2 6 6 6 12 l-2 18 c4 22 0 50 -6 70 c-2 6 -6 8 -10 8 c-4 0 -6 -4 -7 -10 l-4 -42 l-4 42 c-1 6 -3 10 -7 10 c-4 0 -8 -2 -10 -8 c-6 -20 -10 -48 -6 -70 l-2 -18 c0 -6 2 -10 6 -12 l-4 -22 c-4 -2 -7 -6 -6 -12 l4 -24 c4 -10 12 -16 22 -18 c-4 -2 -7 -6 -7 -12 c0 -8 6 -14 14 -14 z"
          fill="oklch(0.20 0.005 260)" stroke="oklch(1 0 0 / 0.08)" strokeWidth="0.6"
        />
        {side === "front" ? (
          <>
            <RegionHover info={info("Shoulders")} d="M27 40 q-2 8 0 14 q4 -4 10 -4 q-2 -8 -4 -12 q-3 -2 -6 2 z" fill={colorFor("Shoulders")} />
            <RegionHover info={info("Shoulders")} d="M73 40 q2 8 0 14 q-4 -4 -10 -4 q2 -8 4 -12 q3 -2 6 2 z" fill={colorFor("Shoulders")} />
            <RegionHover info={info("Chest")} d="M50 40 c-12 0 -16 6 -16 14 c0 6 5 10 16 10 c11 0 16 -4 16 -10 c0 -8 -4 -14 -16 -14 z" fill={colorFor("Chest")} />
            <RegionHover info={info("Biceps")} d="M24 56 q-4 10 -4 22 q4 2 8 0 q1 -12 0 -22 z" fill={colorFor("Biceps")} />
            <RegionHover info={info("Biceps")} d="M76 56 q4 10 4 22 q-4 2 -8 0 q-1 -12 0 -22 z" fill={colorFor("Biceps")} />
            <RegionHover info={info("Core")} d="M40 70 h20 v36 h-20 z" fill={colorFor("Core")} />
            <RegionHover info={info("Legs")} d="M36 116 q-6 26 -4 56 q6 2 10 0 q2 -28 0 -56 z" fill={colorFor("Legs")} />
            <RegionHover info={info("Legs")} d="M64 116 q6 26 4 56 q-6 2 -10 0 q-2 -28 0 -56 z" fill={colorFor("Legs")} />
          </>
        ) : (
          <>
            <RegionHover info={info("Back")} d="M50 36 c-8 0 -14 4 -14 10 q14 4 28 0 c0 -6 -6 -10 -14 -10 z" fill={colorFor("Back")} />
            <RegionHover info={info("Back")} d="M34 50 q-4 14 0 28 q12 4 32 0 q4 -14 0 -28 q-16 6 -32 0 z" fill={colorFor("Back")} />
            <RegionHover info={info("Triceps")} d="M24 56 q-4 10 -4 22 q4 2 8 0 q1 -12 0 -22 z" fill={colorFor("Triceps")} />
            <RegionHover info={info("Triceps")} d="M76 56 q4 10 4 22 q-4 2 -8 0 q-1 -12 0 -22 z" fill={colorFor("Triceps")} />
            <RegionHover info={info("Core")} d="M40 82 h20 v22 h-20 z" fill={colorFor("Core")} />
            <RegionHover info={info("Glutes")} d="M36 108 q-2 14 4 18 q10 4 20 0 q6 -4 4 -18 q-14 6 -28 0 z" fill={colorFor("Glutes")} />
            <RegionHover info={info("Legs")} d="M36 130 q-4 22 -2 42 q6 2 10 0 q2 -22 0 -42 z" fill={colorFor("Legs")} />
            <RegionHover info={info("Legs")} d="M64 130 q4 22 2 42 q-6 2 -10 0 q-2 -22 0 -42 z" fill={colorFor("Legs")} />
          </>
        )}
      </svg>
    </div>
  );
}

function RegionHover({
  info, d, fill,
}: {
  info: { region: Region; sets: number; rating: number; status: Status; label: string };
  d: string; fill: string;
}) {
  const swatch = info.sets === 0 ? "oklch(0.30 0.01 260)" : STATUS_HEX[info.status];
  return (
    <HoverCard openDelay={80} closeDelay={60}>
      <HoverCardTrigger asChild>
        <motion.path
          initial={{ opacity: 0.4 }} animate={{ opacity: 1, fill }} transition={{ duration: 0.6 }}
          d={d} fill={fill} stroke="oklch(0 0 0 / 0.25)" strokeWidth="0.5"
          className="cursor-pointer hover:opacity-80 focus:outline-none"
          tabIndex={0}
        >
          <title>{`${info.region} — ${info.rating}/100 · ${info.label}`}</title>
        </motion.path>
      </HoverCardTrigger>
      <HoverCardContent className="w-48 p-3" side="top">
        <div className="text-sm font-semibold">{info.region}</div>
        <div className="flex items-baseline gap-1 mt-1">
          <span className="text-xl font-display font-bold" style={{ color: swatch }}>{info.rating}</span>
          <span className="text-xs text-muted-foreground">/ 100</span>
        </div>
        <div className="text-xs mt-0.5" style={{ color: swatch }}>{info.label}</div>
        <div className="text-[10px] text-muted-foreground mt-1">{info.sets.toFixed(1)} sets / week</div>
      </HoverCardContent>
    </HoverCard>
  );
}
