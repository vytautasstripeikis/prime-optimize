
-- Extend profiles with full onboarding/personalization fields
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS onboarded boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS full_name text,
  ADD COLUMN IF NOT EXISTS age integer,
  ADD COLUMN IF NOT EXISTS gender text,
  ADD COLUMN IF NOT EXISTS height_cm numeric,
  ADD COLUMN IF NOT EXISTS weight_kg numeric,
  ADD COLUMN IF NOT EXISTS body_fat_pct numeric,
  ADD COLUMN IF NOT EXISTS fitness_level text,
  ADD COLUMN IF NOT EXISTS activity_level text,
  ADD COLUMN IF NOT EXISTS workout_preferences text[],
  ADD COLUMN IF NOT EXISTS sleep_start time,
  ADD COLUMN IF NOT EXISTS sleep_end time,
  ADD COLUMN IF NOT EXISTS sleep_goal_hours numeric DEFAULT 8,
  ADD COLUMN IF NOT EXISTS stress_level integer,
  ADD COLUMN IF NOT EXISTS productivity_level integer,
  ADD COLUMN IF NOT EXISTS career_goals text,
  ADD COLUMN IF NOT EXISTS financial_goals text,
  ADD COLUMN IF NOT EXISTS fitness_goals text,
  ADD COLUMN IF NOT EXISTS diet_preferences text[],
  ADD COLUMN IF NOT EXISTS allergies text,
  ADD COLUMN IF NOT EXISTS injuries text,
  ADD COLUMN IF NOT EXISTS medical_notes text,
  ADD COLUMN IF NOT EXISTS daily_routine text,
  ADD COLUMN IF NOT EXISTS work_schedule text,
  ADD COLUMN IF NOT EXISTS focus_times text[],
  ADD COLUMN IF NOT EXISTS personality_style text,
  ADD COLUMN IF NOT EXISTS motivation_style text,
  ADD COLUMN IF NOT EXISTS water_goal_ml integer DEFAULT 2500,
  ADD COLUMN IF NOT EXISTS calorie_goal integer DEFAULT 2200,
  ADD COLUMN IF NOT EXISTS timezone text;

-- Goals table
CREATE TABLE IF NOT EXISTS public.goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  category text NOT NULL DEFAULT 'general',
  priority text NOT NULL DEFAULT 'medium',
  timeframe text NOT NULL DEFAULT 'monthly', -- daily | weekly | monthly | short | long
  status text NOT NULL DEFAULT 'active',     -- active | completed | archived
  progress integer NOT NULL DEFAULT 0,        -- 0-100
  target_date date,
  notes text,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own goals all" ON public.goals FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Milestones table
CREATE TABLE IF NOT EXISTS public.milestones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id uuid NOT NULL REFERENCES public.goals(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  title text NOT NULL,
  completed boolean NOT NULL DEFAULT false,
  completed_at timestamptz,
  due_date date,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.milestones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own milestones all" ON public.milestones FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_goals_user ON public.goals(user_id);
CREATE INDEX IF NOT EXISTS idx_milestones_goal ON public.milestones(goal_id);

-- Updated-at trigger for goals
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

DROP TRIGGER IF EXISTS goals_touch ON public.goals;
CREATE TRIGGER goals_touch BEFORE UPDATE ON public.goals
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Enable realtime for cross-device sync
ALTER TABLE public.profiles REPLICA IDENTITY FULL;
ALTER TABLE public.habits REPLICA IDENTITY FULL;
ALTER TABLE public.habit_logs REPLICA IDENTITY FULL;
ALTER TABLE public.tasks REPLICA IDENTITY FULL;
ALTER TABLE public.chat_messages REPLICA IDENTITY FULL;
ALTER TABLE public.goals REPLICA IDENTITY FULL;
ALTER TABLE public.milestones REPLICA IDENTITY FULL;

DO $$
BEGIN
  PERFORM 1 FROM pg_publication WHERE pubname = 'supabase_realtime';
  IF FOUND THEN
    BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles; EXCEPTION WHEN duplicate_object THEN NULL; END;
    BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.habits; EXCEPTION WHEN duplicate_object THEN NULL; END;
    BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.habit_logs; EXCEPTION WHEN duplicate_object THEN NULL; END;
    BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.tasks; EXCEPTION WHEN duplicate_object THEN NULL; END;
    BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages; EXCEPTION WHEN duplicate_object THEN NULL; END;
    BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.goals; EXCEPTION WHEN duplicate_object THEN NULL; END;
    BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.milestones; EXCEPTION WHEN duplicate_object THEN NULL; END;
  END IF;
END $$;
