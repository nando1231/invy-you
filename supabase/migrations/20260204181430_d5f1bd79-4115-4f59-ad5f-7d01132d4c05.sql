-- Add trial_ends_at column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMP WITH TIME ZONE;

-- Update existing profiles to have trial_ends_at set to 3 days from their creation
UPDATE public.profiles 
SET trial_ends_at = created_at + INTERVAL '3 days'
WHERE trial_ends_at IS NULL;

-- Set default for new profiles: 3 days from now
ALTER TABLE public.profiles 
ALTER COLUMN trial_ends_at SET DEFAULT (now() + INTERVAL '3 days');

-- Create or replace function to auto-create profile with trial on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, trial_ends_at)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    now() + INTERVAL '3 days'
  )
  ON CONFLICT (user_id) DO UPDATE SET
    trial_ends_at = COALESCE(profiles.trial_ends_at, now() + INTERVAL '3 days');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Drop existing trigger if exists and recreate
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();