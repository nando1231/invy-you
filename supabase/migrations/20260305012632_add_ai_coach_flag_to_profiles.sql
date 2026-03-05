-- Add ai_coach_enabled flag to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS ai_coach_enabled BOOLEAN DEFAULT FALSE;

-- Create an AI Log table to store insights (optional but recommended for debugging)
CREATE TABLE IF NOT EXISTS public.ai_coach_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    insight TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on the logs table
ALTER TABLE public.ai_coach_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own AI logs" 
ON public.ai_coach_logs FOR SELECT 
USING (auth.uid() = user_id);
