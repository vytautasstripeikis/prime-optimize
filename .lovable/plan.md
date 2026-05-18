This is a substantial multi-system upgrade. I'll execute it in 4 focused phases so each ships in a working state. Phase 1 lays the foundation (color tokens + capitalization) that the rest builds on.

## Phase 1 — Design system foundation
- Rewrite `src/styles.css` color tokens: deep charcoal background, with semantic `--success` (green), `--warning` (amber), `--destructive` (red) as the primary accent system. Replace indigo-as-primary with a neutral primary; keep red/yellow/green as performance status colors.
- Add reusable utilities/helpers: `scoreColor(value)` returning a token class (`bg-success`, `bg-warning`, `bg-destructive`) based on 0–49 / 50–79 / 80–100 thresholds.
- Capitalization sweep: every `<SelectItem>`, badge, chip, button label, intensity option, recurrence option, priority option across `tasks.tsx`, `workouts.tsx`, `nutrition.tsx`, `wellness.tsx`, `goals.tsx`, `onboarding.tsx`, `profile.tsx`, `AppShell.tsx`. Use Title Case for options, Sentence case for sentences.
- Mobile bottom nav: switch primary items to Dashboard / Workouts / Wellness (Sleep lives here) / Tasks (Habits) / AI Coach per request.
- Ensure 48px min touch targets on bottom nav and primary buttons.
- Hide the "Edit with Lovable" badge via publish settings.

## Phase 2 — Workout module overhaul
- Seed an exercise library: a `src/data/exercises.ts` file with ~200 curated exercises tagged by `primaryMuscle`, `secondaryMuscles`, `category` (Chest, Back, Shoulders, Biceps, Triceps, Legs, Glutes, Core, Cardio, Full Body), `equipment`.
- Migration: add `workout_exercises` table (workout_id, exercise_key, sets, reps, weight_kg, duration_seconds, notes) — replace the loose `exercises` table usage with exercise-key references plus optional custom name.
- Workout logger: searchable exercise picker (command palette style), add custom exercise, set intensity (Low / Medium / High / Max Effort).
- Body Muscle Map: SVG front+back silhouette with per-muscle paths. Aggregate last 28 days of training volume per muscle (primary = 1.0, secondary = 0.5 weight) and color each region Red/Yellow/Green vs personal rolling baseline. Include legend.
- Weekly summary card: volume per muscle group as horizontal bars, color-coded.

## Phase 3 — Sleep, dashboard & AI coach
- Sleep: ensure logger captures bedtime, wake, quality stars, notes. Weekly bar chart color-coded by duration thresholds (Green ≥7h, Yellow 6–7h, Red <6h). Rolling 7-day sleep score. Sleep-window adherence indicator using profile's `sleep_start`/`sleep_end`.
- Dashboard redesign:
  - Large Daily Score (0–100) ring with semantic color.
  - Breakdown chips: Habits %, Sleep score, Workout done?, Tasks %.
  - 7-day performance bar chart, color-coded per day.
  - "Streaks at risk" list (recurring tasks not completed today, amber).
  - Sunday-only "Weekly Report" card with totals + AI summary.
- AI Coach prompt update: explicitly compute and inject weak-muscle/sleep-trend signals so it can proactively flag them. Add a "Today's Plan" server fn that generates a morning plan, surfaced on the dashboard.

## Phase 4 — Polish & QA
- Empty states with green CTA across tasks, workouts, nutrition, wellness, goals.
- Skeleton loaders for all loading states.
- Toast colors: success → green token, error → red token (sonner richColors).
- Consistent card padding/radius/shadow via base `.card` utility.
- Mobile responsive pass on every page (stack grids, prevent text overflow).

## Technical notes
- Color tokens via `oklch` in `src/styles.css`; status helpers in `src/lib/score.ts`.
- Body map: hand-built SVG paths in `src/components/BodyMuscleMap.tsx`, ~14 muscle regions front + back.
- Exercise library is a static TypeScript array (no migration) — keeps it fast and version-controlled. `workout_exercises` is the only schema change.
- All migrations include RLS policies scoped to `auth.uid()`.
- No new secrets needed; Lovable AI key already configured.
- Realtime sync continues to work — new table will be added to the realtime subscription list.

Approve and I'll start with Phase 1 immediately; I'll proceed through Phase 2–4 in the same session.