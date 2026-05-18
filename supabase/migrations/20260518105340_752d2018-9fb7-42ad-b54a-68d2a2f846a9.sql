CREATE TABLE public.workout_exercises (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  workout_id uuid NOT NULL,
  exercise_key text,
  custom_name text,
  primary_muscle text,
  secondary_muscles text[] NOT NULL DEFAULT '{}',
  sets integer,
  reps integer,
  weight_kg numeric,
  duration_seconds integer,
  distance_km numeric,
  notes text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.workout_exercises ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own workout_exercises all" ON public.workout_exercises
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_workout_exercises_workout ON public.workout_exercises(workout_id);
CREATE INDEX idx_workout_exercises_user_created ON public.workout_exercises(user_id, created_at DESC);
CREATE INDEX idx_workout_exercises_user_muscle ON public.workout_exercises(user_id, primary_muscle);