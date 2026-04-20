-- Tabela de resumos semanais proativos da Invy
CREATE TABLE public.weekly_summaries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  week_start date NOT NULL,
  week_end date NOT NULL,
  content text NOT NULL,
  total_income numeric DEFAULT 0,
  total_expense numeric DEFAULT 0,
  top_category text,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, week_start)
);

ALTER TABLE public.weekly_summaries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own summaries" ON public.weekly_summaries
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users update own summaries" ON public.weekly_summaries
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own summaries" ON public.weekly_summaries
  FOR DELETE USING (auth.uid() = user_id);
-- Insert apenas via service role (edge function), então sem policy de INSERT pública

CREATE INDEX idx_weekly_summaries_user_week ON public.weekly_summaries (user_id, week_start DESC);

-- Cron: rodar todo domingo 20h (BRT = 23h UTC)
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

SELECT cron.schedule(
  'invy-weekly-summary',
  '0 23 * * 0',
  $$
  SELECT net.http_post(
    url := 'https://knibrepitgiejyqgpofi.supabase.co/functions/v1/invy-weekly-summary',
    headers := jsonb_build_object('Content-Type', 'application/json'),
    body := jsonb_build_object('triggered_at', now())
  );
  $$
);