-- Enable pg_cron and pg_net extensions for scheduled Ivy weekly summary
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Schedule ivy-weekly-summary-all every Sunday at 09:00 UTC
-- Update url and x-cron-secret to match CRON_SECRET in supabase/.env
SELECT cron.schedule(
  'ivy-weekly-summary-cron',
  '0 9 * * 0',
  $$
  SELECT net.http_post(
    url := 'http://host.docker.internal:54321/functions/v1/ivy-weekly-summary-all',
    headers := '{"Content-Type":"application/json","x-cron-secret":"change-me"}'::jsonb,
    body := '{}'::jsonb
  )
  $$
);
