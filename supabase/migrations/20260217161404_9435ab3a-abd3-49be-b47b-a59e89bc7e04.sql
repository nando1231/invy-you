-- Fix handle_new_user: remove trial_ends_at references
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  )
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Fix missing RLS: habit_logs UPDATE
CREATE POLICY "Users can update own habit logs"
ON public.habit_logs
FOR UPDATE
USING (auth.uid() = user_id);

-- Fix missing RLS: recurring_transaction_logs UPDATE and DELETE
CREATE POLICY "Users can update own logs"
ON public.recurring_transaction_logs
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own logs"
ON public.recurring_transaction_logs
FOR DELETE
USING (auth.uid() = user_id);

-- Fix missing RLS: user_roles admin management
CREATE POLICY "Admins can insert roles"
ON public.user_roles
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update roles"
ON public.user_roles
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete roles"
ON public.user_roles
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));