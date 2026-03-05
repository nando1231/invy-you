-- Add pending_tx JSONB to profiles for WhatsApp confirmation flow
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS pending_tx JSONB DEFAULT NULL;
