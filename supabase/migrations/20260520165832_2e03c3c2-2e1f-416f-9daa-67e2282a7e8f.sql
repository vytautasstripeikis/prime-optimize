
-- Body logs (weight + measurements)
CREATE TABLE public.body_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  logged_on DATE NOT NULL DEFAULT ((now() AT TIME ZONE 'utc')::date),
  weight_kg NUMERIC,
  neck_cm NUMERIC,
  shoulders_cm NUMERIC,
  chest_cm NUMERIC,
  left_arm_cm NUMERIC,
  right_arm_cm NUMERIC,
  waist_cm NUMERIC,
  hips_cm NUMERIC,
  left_thigh_cm NUMERIC,
  right_thigh_cm NUMERIC,
  left_calf_cm NUMERIC,
  right_calf_cm NUMERIC,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.body_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own body logs all" ON public.body_logs
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX body_logs_user_date_idx ON public.body_logs (user_id, logged_on DESC);
ALTER PUBLICATION supabase_realtime ADD TABLE public.body_logs;

-- Per-set logging
ALTER TABLE public.workout_exercises
  ADD COLUMN IF NOT EXISTS set_number INTEGER NOT NULL DEFAULT 1;

-- Daily AI tip cache
CREATE TABLE public.daily_tips (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  tip_date DATE NOT NULL DEFAULT ((now() AT TIME ZONE 'utc')::date),
  tip TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, tip_date)
);
ALTER TABLE public.daily_tips ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own daily tips all" ON public.daily_tips
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
ALTER PUBLICATION supabase_realtime ADD TABLE public.daily_tips;
