/**
 * Performance scoring helpers — Red / Yellow / Green system.
 * 0–49 → red (poor), 50–79 → amber (needs attention), 80–100 → green (excellent).
 */
export type Status = "good" | "warn" | "bad";

export function scoreStatus(value: number): Status {
  if (value >= 80) return "good";
  if (value >= 50) return "warn";
  return "bad";
}

export const STATUS_BG: Record<Status, string> = {
  good: "bg-success",
  warn: "bg-warning",
  bad: "bg-destructive",
};

export const STATUS_TEXT: Record<Status, string> = {
  good: "text-success",
  warn: "text-warning",
  bad: "text-destructive",
};

export const STATUS_RING: Record<Status, string> = {
  good: "ring-success/40",
  warn: "ring-warning/40",
  bad: "ring-destructive/40",
};

export const STATUS_SOFT: Record<Status, string> = {
  good: "bg-success/15 text-success",
  warn: "bg-warning/15 text-warning",
  bad: "bg-destructive/15 text-destructive",
};

export const STATUS_LABEL: Record<Status, string> = {
  good: "Excellent",
  warn: "Needs Attention",
  bad: "Needs Work",
};

/** OKLCH hex-ish colors usable directly inside SVG/recharts fills */
export const STATUS_HEX: Record<Status, string> = {
  good: "oklch(0.70 0.19 150)",
  warn: "oklch(0.82 0.17 85)",
  bad: "oklch(0.65 0.24 27)",
};

export function sleepStatus(hours: number): Status {
  if (hours >= 7) return "good";
  if (hours >= 6) return "warn";
  return "bad";
}

export function muscleStatus(volumeScore: number): Status {
  // volumeScore is normalized 0..1 vs personal target (1.0 = on target)
  if (volumeScore >= 0.8) return "good";
  if (volumeScore >= 0.4) return "warn";
  return "bad";
}
