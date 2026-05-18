/**
 * Built-in exercise library — keyed catalog used by the workout logger
 * and the body muscle map. Each entry tags a primary muscle plus secondary
 * muscles so volume can be aggregated across groups.
 */
export type MuscleGroup =
  | "Chest" | "Back" | "Shoulders" | "Biceps" | "Triceps"
  | "Legs" | "Glutes" | "Core" | "Cardio" | "Full Body";

export const MUSCLE_GROUPS: MuscleGroup[] = [
  "Chest", "Back", "Shoulders", "Biceps", "Triceps",
  "Legs", "Glutes", "Core", "Cardio", "Full Body",
];

export type Equipment =
  | "Barbell" | "Dumbbell" | "Machine" | "Cable" | "Bodyweight"
  | "Kettlebell" | "Bands" | "Cardio" | "Other";

export type LoggingMode = "sets-reps" | "duration" | "distance";

export interface Exercise {
  key: string;
  name: string;
  group: MuscleGroup;
  primary: string;
  secondary: string[];
  equipment: Equipment;
  mode: LoggingMode;
}

const sr: LoggingMode = "sets-reps";
const du: LoggingMode = "duration";
const di: LoggingMode = "distance";

export const EXERCISES: Exercise[] = [
  // ============ CHEST ============
  { key: "bench-press", name: "Barbell Bench Press", group: "Chest", primary: "Chest", secondary: ["Triceps", "Shoulders"], equipment: "Barbell", mode: sr },
  { key: "incline-bench", name: "Incline Barbell Bench", group: "Chest", primary: "Chest", secondary: ["Shoulders", "Triceps"], equipment: "Barbell", mode: sr },
  { key: "decline-bench", name: "Decline Barbell Bench", group: "Chest", primary: "Chest", secondary: ["Triceps"], equipment: "Barbell", mode: sr },
  { key: "db-bench", name: "Dumbbell Bench Press", group: "Chest", primary: "Chest", secondary: ["Triceps", "Shoulders"], equipment: "Dumbbell", mode: sr },
  { key: "incline-db-bench", name: "Incline Dumbbell Press", group: "Chest", primary: "Chest", secondary: ["Shoulders"], equipment: "Dumbbell", mode: sr },
  { key: "db-fly", name: "Dumbbell Fly", group: "Chest", primary: "Chest", secondary: [], equipment: "Dumbbell", mode: sr },
  { key: "cable-fly", name: "Cable Fly", group: "Chest", primary: "Chest", secondary: [], equipment: "Cable", mode: sr },
  { key: "cable-crossover", name: "Cable Crossover", group: "Chest", primary: "Chest", secondary: [], equipment: "Cable", mode: sr },
  { key: "pec-deck", name: "Pec Deck Machine", group: "Chest", primary: "Chest", secondary: [], equipment: "Machine", mode: sr },
  { key: "machine-press", name: "Chest Press Machine", group: "Chest", primary: "Chest", secondary: ["Triceps"], equipment: "Machine", mode: sr },
  { key: "pushup", name: "Push-Up", group: "Chest", primary: "Chest", secondary: ["Triceps", "Core"], equipment: "Bodyweight", mode: sr },
  { key: "incline-pushup", name: "Incline Push-Up", group: "Chest", primary: "Chest", secondary: ["Shoulders"], equipment: "Bodyweight", mode: sr },
  { key: "decline-pushup", name: "Decline Push-Up", group: "Chest", primary: "Chest", secondary: ["Shoulders", "Triceps"], equipment: "Bodyweight", mode: sr },
  { key: "diamond-pushup", name: "Diamond Push-Up", group: "Chest", primary: "Chest", secondary: ["Triceps"], equipment: "Bodyweight", mode: sr },
  { key: "dips-chest", name: "Chest Dips", group: "Chest", primary: "Chest", secondary: ["Triceps", "Shoulders"], equipment: "Bodyweight", mode: sr },
  { key: "svend-press", name: "Svend Press", group: "Chest", primary: "Chest", secondary: [], equipment: "Dumbbell", mode: sr },
  { key: "landmine-press", name: "Landmine Press", group: "Chest", primary: "Chest", secondary: ["Shoulders"], equipment: "Barbell", mode: sr },
  { key: "smith-bench", name: "Smith Machine Bench", group: "Chest", primary: "Chest", secondary: ["Triceps"], equipment: "Machine", mode: sr },

  // ============ BACK ============
  { key: "deadlift", name: "Barbell Deadlift", group: "Back", primary: "Back", secondary: ["Glutes", "Legs", "Core"], equipment: "Barbell", mode: sr },
  { key: "romanian-deadlift", name: "Romanian Deadlift", group: "Back", primary: "Back", secondary: ["Glutes", "Legs"], equipment: "Barbell", mode: sr },
  { key: "rack-pull", name: "Rack Pull", group: "Back", primary: "Back", secondary: ["Glutes"], equipment: "Barbell", mode: sr },
  { key: "bent-over-row", name: "Bent-Over Barbell Row", group: "Back", primary: "Back", secondary: ["Biceps"], equipment: "Barbell", mode: sr },
  { key: "pendlay-row", name: "Pendlay Row", group: "Back", primary: "Back", secondary: ["Biceps"], equipment: "Barbell", mode: sr },
  { key: "db-row", name: "Single-Arm Dumbbell Row", group: "Back", primary: "Back", secondary: ["Biceps"], equipment: "Dumbbell", mode: sr },
  { key: "chest-supported-row", name: "Chest-Supported Row", group: "Back", primary: "Back", secondary: ["Biceps"], equipment: "Dumbbell", mode: sr },
  { key: "tbar-row", name: "T-Bar Row", group: "Back", primary: "Back", secondary: ["Biceps"], equipment: "Barbell", mode: sr },
  { key: "seated-cable-row", name: "Seated Cable Row", group: "Back", primary: "Back", secondary: ["Biceps"], equipment: "Cable", mode: sr },
  { key: "lat-pulldown", name: "Lat Pulldown", group: "Back", primary: "Back", secondary: ["Biceps"], equipment: "Cable", mode: sr },
  { key: "wide-pulldown", name: "Wide-Grip Pulldown", group: "Back", primary: "Back", secondary: ["Biceps"], equipment: "Cable", mode: sr },
  { key: "close-grip-pulldown", name: "Close-Grip Pulldown", group: "Back", primary: "Back", secondary: ["Biceps"], equipment: "Cable", mode: sr },
  { key: "pullup", name: "Pull-Up", group: "Back", primary: "Back", secondary: ["Biceps", "Core"], equipment: "Bodyweight", mode: sr },
  { key: "chinup", name: "Chin-Up", group: "Back", primary: "Back", secondary: ["Biceps"], equipment: "Bodyweight", mode: sr },
  { key: "neutral-pullup", name: "Neutral-Grip Pull-Up", group: "Back", primary: "Back", secondary: ["Biceps"], equipment: "Bodyweight", mode: sr },
  { key: "inverted-row", name: "Inverted Row", group: "Back", primary: "Back", secondary: ["Biceps"], equipment: "Bodyweight", mode: sr },
  { key: "straight-arm-pulldown", name: "Straight-Arm Pulldown", group: "Back", primary: "Back", secondary: [], equipment: "Cable", mode: sr },
  { key: "shrug", name: "Barbell Shrug", group: "Back", primary: "Back", secondary: [], equipment: "Barbell", mode: sr },
  { key: "db-shrug", name: "Dumbbell Shrug", group: "Back", primary: "Back", secondary: [], equipment: "Dumbbell", mode: sr },
  { key: "back-extension", name: "Back Extension", group: "Back", primary: "Back", secondary: ["Glutes"], equipment: "Bodyweight", mode: sr },
  { key: "good-morning", name: "Good Morning", group: "Back", primary: "Back", secondary: ["Glutes", "Legs"], equipment: "Barbell", mode: sr },
  { key: "face-pull", name: "Face Pull", group: "Back", primary: "Back", secondary: ["Shoulders"], equipment: "Cable", mode: sr },

  // ============ SHOULDERS ============
  { key: "ohp", name: "Overhead Press", group: "Shoulders", primary: "Shoulders", secondary: ["Triceps", "Core"], equipment: "Barbell", mode: sr },
  { key: "push-press", name: "Push Press", group: "Shoulders", primary: "Shoulders", secondary: ["Triceps", "Legs"], equipment: "Barbell", mode: sr },
  { key: "seated-db-press", name: "Seated Dumbbell Press", group: "Shoulders", primary: "Shoulders", secondary: ["Triceps"], equipment: "Dumbbell", mode: sr },
  { key: "arnold-press", name: "Arnold Press", group: "Shoulders", primary: "Shoulders", secondary: ["Triceps"], equipment: "Dumbbell", mode: sr },
  { key: "machine-shoulder-press", name: "Machine Shoulder Press", group: "Shoulders", primary: "Shoulders", secondary: ["Triceps"], equipment: "Machine", mode: sr },
  { key: "lateral-raise", name: "Lateral Raise", group: "Shoulders", primary: "Shoulders", secondary: [], equipment: "Dumbbell", mode: sr },
  { key: "cable-lateral-raise", name: "Cable Lateral Raise", group: "Shoulders", primary: "Shoulders", secondary: [], equipment: "Cable", mode: sr },
  { key: "front-raise", name: "Front Raise", group: "Shoulders", primary: "Shoulders", secondary: [], equipment: "Dumbbell", mode: sr },
  { key: "rear-delt-fly", name: "Rear Delt Fly", group: "Shoulders", primary: "Shoulders", secondary: ["Back"], equipment: "Dumbbell", mode: sr },
  { key: "reverse-pec-deck", name: "Reverse Pec Deck", group: "Shoulders", primary: "Shoulders", secondary: ["Back"], equipment: "Machine", mode: sr },
  { key: "upright-row", name: "Upright Row", group: "Shoulders", primary: "Shoulders", secondary: ["Back"], equipment: "Barbell", mode: sr },
  { key: "pike-pushup", name: "Pike Push-Up", group: "Shoulders", primary: "Shoulders", secondary: ["Triceps"], equipment: "Bodyweight", mode: sr },
  { key: "handstand-pushup", name: "Handstand Push-Up", group: "Shoulders", primary: "Shoulders", secondary: ["Triceps"], equipment: "Bodyweight", mode: sr },
  { key: "band-pull-apart", name: "Band Pull-Apart", group: "Shoulders", primary: "Shoulders", secondary: ["Back"], equipment: "Bands", mode: sr },
  { key: "landmine-rotation", name: "Landmine Rotation", group: "Shoulders", primary: "Shoulders", secondary: ["Core"], equipment: "Barbell", mode: sr },

  // ============ BICEPS ============
  { key: "barbell-curl", name: "Barbell Curl", group: "Biceps", primary: "Biceps", secondary: [], equipment: "Barbell", mode: sr },
  { key: "ez-curl", name: "EZ-Bar Curl", group: "Biceps", primary: "Biceps", secondary: [], equipment: "Barbell", mode: sr },
  { key: "db-curl", name: "Dumbbell Curl", group: "Biceps", primary: "Biceps", secondary: [], equipment: "Dumbbell", mode: sr },
  { key: "hammer-curl", name: "Hammer Curl", group: "Biceps", primary: "Biceps", secondary: [], equipment: "Dumbbell", mode: sr },
  { key: "incline-curl", name: "Incline Dumbbell Curl", group: "Biceps", primary: "Biceps", secondary: [], equipment: "Dumbbell", mode: sr },
  { key: "preacher-curl", name: "Preacher Curl", group: "Biceps", primary: "Biceps", secondary: [], equipment: "Barbell", mode: sr },
  { key: "concentration-curl", name: "Concentration Curl", group: "Biceps", primary: "Biceps", secondary: [], equipment: "Dumbbell", mode: sr },
  { key: "cable-curl", name: "Cable Curl", group: "Biceps", primary: "Biceps", secondary: [], equipment: "Cable", mode: sr },
  { key: "spider-curl", name: "Spider Curl", group: "Biceps", primary: "Biceps", secondary: [], equipment: "Dumbbell", mode: sr },
  { key: "zottman-curl", name: "Zottman Curl", group: "Biceps", primary: "Biceps", secondary: [], equipment: "Dumbbell", mode: sr },
  { key: "drag-curl", name: "Drag Curl", group: "Biceps", primary: "Biceps", secondary: [], equipment: "Barbell", mode: sr },
  { key: "machine-curl", name: "Machine Curl", group: "Biceps", primary: "Biceps", secondary: [], equipment: "Machine", mode: sr },

  // ============ TRICEPS ============
  { key: "close-grip-bench", name: "Close-Grip Bench", group: "Triceps", primary: "Triceps", secondary: ["Chest"], equipment: "Barbell", mode: sr },
  { key: "skullcrusher", name: "Skull Crusher", group: "Triceps", primary: "Triceps", secondary: [], equipment: "Barbell", mode: sr },
  { key: "overhead-tri-ext", name: "Overhead Tricep Extension", group: "Triceps", primary: "Triceps", secondary: [], equipment: "Dumbbell", mode: sr },
  { key: "tricep-pushdown", name: "Tricep Pushdown", group: "Triceps", primary: "Triceps", secondary: [], equipment: "Cable", mode: sr },
  { key: "rope-pushdown", name: "Rope Pushdown", group: "Triceps", primary: "Triceps", secondary: [], equipment: "Cable", mode: sr },
  { key: "kickback", name: "Tricep Kickback", group: "Triceps", primary: "Triceps", secondary: [], equipment: "Dumbbell", mode: sr },
  { key: "dips-tri", name: "Tricep Dips", group: "Triceps", primary: "Triceps", secondary: ["Chest"], equipment: "Bodyweight", mode: sr },
  { key: "bench-dips", name: "Bench Dips", group: "Triceps", primary: "Triceps", secondary: [], equipment: "Bodyweight", mode: sr },
  { key: "jm-press", name: "JM Press", group: "Triceps", primary: "Triceps", secondary: ["Chest"], equipment: "Barbell", mode: sr },
  { key: "machine-dip", name: "Machine Dip", group: "Triceps", primary: "Triceps", secondary: ["Chest"], equipment: "Machine", mode: sr },

  // ============ LEGS ============
  { key: "back-squat", name: "Barbell Back Squat", group: "Legs", primary: "Legs", secondary: ["Glutes", "Core"], equipment: "Barbell", mode: sr },
  { key: "front-squat", name: "Front Squat", group: "Legs", primary: "Legs", secondary: ["Glutes", "Core"], equipment: "Barbell", mode: sr },
  { key: "goblet-squat", name: "Goblet Squat", group: "Legs", primary: "Legs", secondary: ["Glutes"], equipment: "Dumbbell", mode: sr },
  { key: "bulgarian-split", name: "Bulgarian Split Squat", group: "Legs", primary: "Legs", secondary: ["Glutes"], equipment: "Dumbbell", mode: sr },
  { key: "walking-lunge", name: "Walking Lunge", group: "Legs", primary: "Legs", secondary: ["Glutes"], equipment: "Dumbbell", mode: sr },
  { key: "reverse-lunge", name: "Reverse Lunge", group: "Legs", primary: "Legs", secondary: ["Glutes"], equipment: "Dumbbell", mode: sr },
  { key: "step-up", name: "Step-Up", group: "Legs", primary: "Legs", secondary: ["Glutes"], equipment: "Dumbbell", mode: sr },
  { key: "leg-press", name: "Leg Press", group: "Legs", primary: "Legs", secondary: ["Glutes"], equipment: "Machine", mode: sr },
  { key: "hack-squat", name: "Hack Squat", group: "Legs", primary: "Legs", secondary: ["Glutes"], equipment: "Machine", mode: sr },
  { key: "leg-extension", name: "Leg Extension", group: "Legs", primary: "Legs", secondary: [], equipment: "Machine", mode: sr },
  { key: "leg-curl", name: "Leg Curl", group: "Legs", primary: "Legs", secondary: [], equipment: "Machine", mode: sr },
  { key: "seated-leg-curl", name: "Seated Leg Curl", group: "Legs", primary: "Legs", secondary: [], equipment: "Machine", mode: sr },
  { key: "calf-raise", name: "Standing Calf Raise", group: "Legs", primary: "Legs", secondary: [], equipment: "Machine", mode: sr },
  { key: "seated-calf-raise", name: "Seated Calf Raise", group: "Legs", primary: "Legs", secondary: [], equipment: "Machine", mode: sr },
  { key: "donkey-calf", name: "Donkey Calf Raise", group: "Legs", primary: "Legs", secondary: [], equipment: "Bodyweight", mode: sr },
  { key: "pistol-squat", name: "Pistol Squat", group: "Legs", primary: "Legs", secondary: ["Glutes", "Core"], equipment: "Bodyweight", mode: sr },
  { key: "box-jump", name: "Box Jump", group: "Legs", primary: "Legs", secondary: ["Glutes"], equipment: "Bodyweight", mode: sr },
  { key: "jump-squat", name: "Jump Squat", group: "Legs", primary: "Legs", secondary: ["Glutes"], equipment: "Bodyweight", mode: sr },
  { key: "wall-sit", name: "Wall Sit", group: "Legs", primary: "Legs", secondary: [], equipment: "Bodyweight", mode: du },
  { key: "sissy-squat", name: "Sissy Squat", group: "Legs", primary: "Legs", secondary: [], equipment: "Bodyweight", mode: sr },
  { key: "nordic-curl", name: "Nordic Hamstring Curl", group: "Legs", primary: "Legs", secondary: [], equipment: "Bodyweight", mode: sr },

  // ============ GLUTES ============
  { key: "hip-thrust", name: "Barbell Hip Thrust", group: "Glutes", primary: "Glutes", secondary: ["Legs"], equipment: "Barbell", mode: sr },
  { key: "glute-bridge", name: "Glute Bridge", group: "Glutes", primary: "Glutes", secondary: [], equipment: "Bodyweight", mode: sr },
  { key: "single-leg-bridge", name: "Single-Leg Bridge", group: "Glutes", primary: "Glutes", secondary: [], equipment: "Bodyweight", mode: sr },
  { key: "cable-kickback", name: "Cable Glute Kickback", group: "Glutes", primary: "Glutes", secondary: [], equipment: "Cable", mode: sr },
  { key: "sumo-deadlift", name: "Sumo Deadlift", group: "Glutes", primary: "Glutes", secondary: ["Back", "Legs"], equipment: "Barbell", mode: sr },
  { key: "kb-swing", name: "Kettlebell Swing", group: "Glutes", primary: "Glutes", secondary: ["Back", "Core"], equipment: "Kettlebell", mode: sr },
  { key: "hip-abduction", name: "Hip Abduction Machine", group: "Glutes", primary: "Glutes", secondary: [], equipment: "Machine", mode: sr },
  { key: "frog-pump", name: "Frog Pump", group: "Glutes", primary: "Glutes", secondary: [], equipment: "Bodyweight", mode: sr },
  { key: "curtsy-lunge", name: "Curtsy Lunge", group: "Glutes", primary: "Glutes", secondary: ["Legs"], equipment: "Dumbbell", mode: sr },
  { key: "fire-hydrant", name: "Fire Hydrant", group: "Glutes", primary: "Glutes", secondary: [], equipment: "Bodyweight", mode: sr },
  { key: "band-clamshell", name: "Banded Clamshell", group: "Glutes", primary: "Glutes", secondary: [], equipment: "Bands", mode: sr },

  // ============ CORE ============
  { key: "plank", name: "Plank", group: "Core", primary: "Core", secondary: [], equipment: "Bodyweight", mode: du },
  { key: "side-plank", name: "Side Plank", group: "Core", primary: "Core", secondary: [], equipment: "Bodyweight", mode: du },
  { key: "hollow-hold", name: "Hollow Body Hold", group: "Core", primary: "Core", secondary: [], equipment: "Bodyweight", mode: du },
  { key: "dead-bug", name: "Dead Bug", group: "Core", primary: "Core", secondary: [], equipment: "Bodyweight", mode: sr },
  { key: "bird-dog", name: "Bird Dog", group: "Core", primary: "Core", secondary: ["Back"], equipment: "Bodyweight", mode: sr },
  { key: "crunch", name: "Crunch", group: "Core", primary: "Core", secondary: [], equipment: "Bodyweight", mode: sr },
  { key: "bicycle-crunch", name: "Bicycle Crunch", group: "Core", primary: "Core", secondary: [], equipment: "Bodyweight", mode: sr },
  { key: "russian-twist", name: "Russian Twist", group: "Core", primary: "Core", secondary: [], equipment: "Bodyweight", mode: sr },
  { key: "leg-raise", name: "Hanging Leg Raise", group: "Core", primary: "Core", secondary: [], equipment: "Bodyweight", mode: sr },
  { key: "knee-raise", name: "Hanging Knee Raise", group: "Core", primary: "Core", secondary: [], equipment: "Bodyweight", mode: sr },
  { key: "toes-to-bar", name: "Toes to Bar", group: "Core", primary: "Core", secondary: [], equipment: "Bodyweight", mode: sr },
  { key: "ab-rollout", name: "Ab Wheel Rollout", group: "Core", primary: "Core", secondary: [], equipment: "Other", mode: sr },
  { key: "cable-crunch", name: "Cable Crunch", group: "Core", primary: "Core", secondary: [], equipment: "Cable", mode: sr },
  { key: "mountain-climber", name: "Mountain Climbers", group: "Core", primary: "Core", secondary: ["Cardio"], equipment: "Bodyweight", mode: du },
  { key: "v-up", name: "V-Up", group: "Core", primary: "Core", secondary: [], equipment: "Bodyweight", mode: sr },
  { key: "sit-up", name: "Sit-Up", group: "Core", primary: "Core", secondary: [], equipment: "Bodyweight", mode: sr },
  { key: "pallof-press", name: "Pallof Press", group: "Core", primary: "Core", secondary: [], equipment: "Cable", mode: sr },
  { key: "windmill", name: "Kettlebell Windmill", group: "Core", primary: "Core", secondary: ["Shoulders"], equipment: "Kettlebell", mode: sr },

  // ============ CARDIO ============
  { key: "run-outdoor", name: "Outdoor Run", group: "Cardio", primary: "Cardio", secondary: ["Legs"], equipment: "Cardio", mode: di },
  { key: "treadmill", name: "Treadmill Run", group: "Cardio", primary: "Cardio", secondary: ["Legs"], equipment: "Cardio", mode: di },
  { key: "incline-walk", name: "Incline Walk", group: "Cardio", primary: "Cardio", secondary: ["Legs"], equipment: "Cardio", mode: du },
  { key: "cycling", name: "Cycling", group: "Cardio", primary: "Cardio", secondary: ["Legs"], equipment: "Cardio", mode: di },
  { key: "spin", name: "Spin Class", group: "Cardio", primary: "Cardio", secondary: ["Legs"], equipment: "Cardio", mode: du },
  { key: "rowing", name: "Rowing Machine", group: "Cardio", primary: "Cardio", secondary: ["Back", "Legs"], equipment: "Cardio", mode: di },
  { key: "elliptical", name: "Elliptical", group: "Cardio", primary: "Cardio", secondary: ["Legs"], equipment: "Cardio", mode: du },
  { key: "stair-master", name: "Stair Master", group: "Cardio", primary: "Cardio", secondary: ["Legs", "Glutes"], equipment: "Cardio", mode: du },
  { key: "jump-rope", name: "Jump Rope", group: "Cardio", primary: "Cardio", secondary: ["Legs"], equipment: "Cardio", mode: du },
  { key: "swimming", name: "Swimming", group: "Cardio", primary: "Cardio", secondary: ["Full Body"], equipment: "Cardio", mode: di },
  { key: "hiit-sprint", name: "Sprint Intervals", group: "Cardio", primary: "Cardio", secondary: ["Legs"], equipment: "Cardio", mode: du },
  { key: "assault-bike", name: "Assault Bike", group: "Cardio", primary: "Cardio", secondary: ["Full Body"], equipment: "Cardio", mode: du },
  { key: "boxing", name: "Boxing", group: "Cardio", primary: "Cardio", secondary: ["Shoulders", "Core"], equipment: "Cardio", mode: du },
  { key: "hike", name: "Hike", group: "Cardio", primary: "Cardio", secondary: ["Legs"], equipment: "Cardio", mode: di },

  // ============ FULL BODY ============
  { key: "burpee", name: "Burpee", group: "Full Body", primary: "Full Body", secondary: ["Chest", "Legs", "Core"], equipment: "Bodyweight", mode: sr },
  { key: "thruster", name: "Thruster", group: "Full Body", primary: "Full Body", secondary: ["Legs", "Shoulders"], equipment: "Barbell", mode: sr },
  { key: "clean", name: "Power Clean", group: "Full Body", primary: "Full Body", secondary: ["Back", "Legs"], equipment: "Barbell", mode: sr },
  { key: "clean-jerk", name: "Clean & Jerk", group: "Full Body", primary: "Full Body", secondary: ["Back", "Legs", "Shoulders"], equipment: "Barbell", mode: sr },
  { key: "snatch", name: "Snatch", group: "Full Body", primary: "Full Body", secondary: ["Back", "Shoulders"], equipment: "Barbell", mode: sr },
  { key: "turkish-getup", name: "Turkish Get-Up", group: "Full Body", primary: "Full Body", secondary: ["Shoulders", "Core"], equipment: "Kettlebell", mode: sr },
  { key: "farmers-walk", name: "Farmer's Walk", group: "Full Body", primary: "Full Body", secondary: ["Back", "Core"], equipment: "Dumbbell", mode: du },
  { key: "sled-push", name: "Sled Push", group: "Full Body", primary: "Full Body", secondary: ["Legs"], equipment: "Other", mode: di },
  { key: "tire-flip", name: "Tire Flip", group: "Full Body", primary: "Full Body", secondary: ["Back", "Legs"], equipment: "Other", mode: sr },
  { key: "battle-ropes", name: "Battle Ropes", group: "Full Body", primary: "Full Body", secondary: ["Shoulders", "Core"], equipment: "Other", mode: du },
  { key: "bear-crawl", name: "Bear Crawl", group: "Full Body", primary: "Full Body", secondary: ["Core", "Shoulders"], equipment: "Bodyweight", mode: du },
  { key: "man-maker", name: "Man Maker", group: "Full Body", primary: "Full Body", secondary: ["Chest", "Legs"], equipment: "Dumbbell", mode: sr },
  { key: "yoga-flow", name: "Yoga Flow", group: "Full Body", primary: "Full Body", secondary: ["Core"], equipment: "Bodyweight", mode: du },
  { key: "pilates", name: "Pilates Session", group: "Full Body", primary: "Full Body", secondary: ["Core"], equipment: "Bodyweight", mode: du },
  { key: "mobility-flow", name: "Mobility Flow", group: "Full Body", primary: "Full Body", secondary: [], equipment: "Bodyweight", mode: du },
];

export const EXERCISES_BY_KEY: Record<string, Exercise> =
  Object.fromEntries(EXERCISES.map((e) => [e.key, e]));

export function searchExercises(query: string, group?: MuscleGroup | "All"): Exercise[] {
  const q = query.trim().toLowerCase();
  return EXERCISES.filter((e) => {
    if (group && group !== "All" && e.group !== group) return false;
    if (!q) return true;
    return (
      e.name.toLowerCase().includes(q) ||
      e.primary.toLowerCase().includes(q) ||
      e.group.toLowerCase().includes(q) ||
      e.equipment.toLowerCase().includes(q)
    );
  });
}
