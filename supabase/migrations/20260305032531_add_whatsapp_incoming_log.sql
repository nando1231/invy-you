-- Add direction and user_message to ai_coach_logs
ALTER TABLE public.ai_coach_logs
  ADD COLUMN IF NOT EXISTS direction TEXT DEFAULT 'outbound' CHECK (direction IN ('inbound', 'outbound')),
  ADD COLUMN IF NOT EXISTS user_message TEXT;

-- Policy for insert (service role handles inbound messages)
CREATE POLICY "Users can insert own AI logs"
ON public.ai_coach_logs FOR INSERT
WITH CHECK (auth.uid() = user_id);
