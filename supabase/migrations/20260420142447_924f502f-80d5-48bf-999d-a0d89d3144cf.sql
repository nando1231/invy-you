-- Remove privilege escalation surface: admin role assignment must be done via service role only.
DROP POLICY IF EXISTS "Admins can insert roles" ON public.user_roles;

-- Restrict remaining admin policies to authenticated users only (not public/anon).
DROP POLICY IF EXISTS "Admins can delete roles" ON public.user_roles;
CREATE POLICY "Admins can delete roles"
  ON public.user_roles
  FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can update roles" ON public.user_roles;
CREATE POLICY "Admins can update roles"
  ON public.user_roles
  FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));