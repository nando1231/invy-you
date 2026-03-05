-- Enable pg_net extension for HTTP calls from the database
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Function that fires the AI Coach Edge Function on new transactions
CREATE OR REPLACE FUNCTION public.notify_ai_coach()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM net.http_post(
    url := 'http://host.docker.internal:54321/functions/v1/ai-coach-trigger',
    body := json_build_object(
      'type', TG_OP,
      'table', TG_TABLE_NAME,
      'record', row_to_json(NEW)
    )::jsonb,
    headers := '{"Content-Type": "application/json"}'::jsonb
  );
  RETURN NEW;
END;
$$;

-- Trigger: fires after each new transaction INSERT
DROP TRIGGER IF EXISTS ai_coach_trigger ON public.transactions;
CREATE TRIGGER ai_coach_trigger
  AFTER INSERT ON public.transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_ai_coach();
