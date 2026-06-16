-- Prevent users from self-promoting their role via direct profile updates.
-- Run this in Supabase SQL Editor after AUTH_SETUP.sql.

-- 1. Add email column to profiles (for admin password reset UI)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;

-- 2. Backfill email from auth.users for existing profiles
UPDATE public.profiles p
SET email = u.email
FROM auth.users u
WHERE p.id = u.id AND (p.email IS NULL OR p.email = '');

-- 3. Trigger: block non-admins from changing role or team_id on their own profile
CREATE OR REPLACE FUNCTION public.protect_profile_privileged_fields()
RETURNS trigger AS $$
DECLARE
  actor_role user_role;
BEGIN
  IF OLD.role IS DISTINCT FROM NEW.role OR OLD.team_id IS DISTINCT FROM NEW.team_id THEN
    SELECT role INTO actor_role FROM public.profiles WHERE id = auth.uid();
    IF actor_role IS NULL OR actor_role NOT IN ('super_admin', 'general_manager') THEN
      RAISE EXCEPTION 'Only super_admin or general_manager can change role or team assignment';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS protect_profile_privileged_fields ON public.profiles;
CREATE TRIGGER protect_profile_privileged_fields
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.protect_profile_privileged_fields();

-- 4. Sync email into profiles when a new auth user is created
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, performer_name, role, email)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'performer_name', 'New Performer'),
    'performer',
    new.email
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 5. Tighten self-update policy: users may update own row, trigger enforces role/team
DROP POLICY IF EXISTS "Users can update their own profile." ON public.profiles;
CREATE POLICY "Users can update their own profile." ON public.profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);
