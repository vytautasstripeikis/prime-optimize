
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TABLE public.sleep_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  slept_on DATE NOT NULL DEFAULT ((now() AT TIME ZONE 'utc')::date),
  bedtime TIME, wake_time TIME,
  duration_hours NUMERIC,
  quality INTEGER CHECK (quality BETWEEN 1 AND 5),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.sleep_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own sleep logs all" ON public.sleep_logs FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.mood_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  logged_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  mood INTEGER NOT NULL CHECK (mood BETWEEN 1 AND 5),
  energy INTEGER CHECK (energy BETWEEN 1 AND 5),
  stress INTEGER CHECK (stress BETWEEN 1 AND 5),
  tags TEXT[] NOT NULL DEFAULT '{}',
  notes TEXT
);
ALTER TABLE public.mood_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own mood logs all" ON public.mood_logs FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.journal_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT,
  content TEXT NOT NULL,
  mood INTEGER CHECK (mood BETWEEN 1 AND 5),
  tags TEXT[] NOT NULL DEFAULT '{}',
  entry_date DATE NOT NULL DEFAULT ((now() AT TIME ZONE 'utc')::date),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own journal entries all" ON public.journal_entries FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER trg_journal_updated BEFORE UPDATE ON public.journal_entries
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER PUBLICATION supabase_realtime ADD TABLE public.sleep_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.mood_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.journal_entries;

CREATE INDEX idx_sleep_logs_user_date ON public.sleep_logs(user_id, slept_on DESC);
CREATE INDEX idx_mood_logs_user_date ON public.mood_logs(user_id, logged_at DESC);
CREATE INDEX idx_journal_user_date ON public.journal_entries(user_id, entry_date DESC);
