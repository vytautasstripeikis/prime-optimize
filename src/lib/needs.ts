/**
 * Calorie + water needs computed from user body data (Mifflin-St Jeor).
 */
import type { Tables } from "@/integrations/supabase/types";

type BodyLog = Tables<"body_logs">;
type Profile = Tables<"profiles">;

const ACTIVITY_MULT: Record<string, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  "very active": 1.9,
};

export function latestWeightKg(bodyLogs: Pick<BodyLog, "weight_kg" | "logged_on">[] | undefined | null): number | null {
  if (!bodyLogs || bodyLogs.length === 0) return null;
  const withWeight = bodyLogs
    .filter((b) => b.weight_kg != null)
    .sort((a, b) => (a.logged_on < b.logged_on ? 1 : -1));
  return withWeight[0]?.weight_kg != null ? Number(withWeight[0].weight_kg) : null;
}

export interface DailyNeeds {
  calories: number | null;
  waterMl: number | null;
  bmr: number | null;
  tdee: number | null;
  weightKg: number | null;
  missing: string[];
}

export function computeDailyNeeds(
  profile: Pick<Profile, "age" | "gender" | "height_cm" | "activity_level"> | null | undefined,
  bodyLogs: Pick<BodyLog, "weight_kg" | "logged_on">[] | null | undefined,
): DailyNeeds {
  const missing: string[] = [];
  const weight = latestWeightKg(bodyLogs);
  const height = profile?.height_cm != null ? Number(profile.height_cm) : null;
  const age = profile?.age ?? null;
  const gender = (profile?.gender ?? "").toLowerCase();
  const activity = (profile?.activity_level ?? "moderate").toLowerCase();

  if (weight == null) missing.push("weight");
  if (height == null) missing.push("height");
  if (age == null) missing.push("age");

  if (weight == null || height == null || age == null) {
    return { calories: null, waterMl: weight ? Math.round(weight * 35) : null, bmr: null, tdee: null, weightKg: weight, missing };
  }

  const base = 10 * weight + 6.25 * height - 5 * age;
  const bmr = gender === "male" ? base + 5 : gender === "female" ? base - 161 : base - 78;
  const mult = ACTIVITY_MULT[activity] ?? 1.55;
  const tdee = bmr * mult;
  return {
    calories: Math.round(tdee),
    waterMl: Math.round(weight * 35),
    bmr: Math.round(bmr),
    tdee: Math.round(tdee),
    weightKg: weight,
    missing,
  };
}