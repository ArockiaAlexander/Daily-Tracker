-- 1. Add 'group_lead' to user_role enum
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'group_lead' BEFORE 'team_lead';

-- 2. Create clients table
CREATE TABLE IF NOT EXISTS public.clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,         -- e.g., 'OUP', 'T&F'
  name text NOT NULL,                -- e.g., 'Oxford University Press'
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 3. Seed the 5 clients
INSERT INTO public.clients (code, name) VALUES
  ('OUP', 'OUP'),
  ('T&F', 'T&F'),
  ('OOH', 'OOH'),
  ('MCB', 'MCB'),
  ('SPW', 'SPW')
ON CONFLICT (code) DO NOTHING;

-- 4. Add sub_division to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS sub_division text DEFAULT NULL
  CHECK (sub_division IN ('PreEdit', 'Validation', NULL));

-- 5. Add client reference (keep existing client_id text for backward compat,
--    add new FK column)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS client_ref uuid REFERENCES public.clients(id) ON DELETE SET NULL;

-- 6. Add sub_division to status_entries
ALTER TABLE public.status_entries
  ADD COLUMN IF NOT EXISTS sub_division text DEFAULT NULL;

-- 7. RLS for clients table
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

-- Everyone can read clients
CREATE POLICY "clients_select_authenticated" ON public.clients
  FOR SELECT TO authenticated USING (true);

-- Only GM and AM can manage clients
CREATE POLICY "clients_manage_gm_am" ON public.clients
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('super_admin', 'general_manager', 'assistant_manager')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('super_admin', 'general_manager', 'assistant_manager')
    )
  );

-- 8. Timestamps trigger for clients
CREATE TRIGGER set_updated_at_clients
  BEFORE UPDATE ON public.clients
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 9. Indexes
CREATE INDEX IF NOT EXISTS idx_profiles_client_ref ON public.profiles (client_ref);
CREATE INDEX IF NOT EXISTS idx_profiles_sub_division ON public.profiles (sub_division);
CREATE INDEX IF NOT EXISTS idx_clients_active ON public.clients (is_active) WHERE is_active = true;