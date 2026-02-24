-- ==========================================
-- 1. EXTENSIONS & TYPES
-- ==========================================
-- Create custom enum for user roles
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('admin', 'manager', 'lead', 'performer');
    ELSE
        -- Add admin if missing from previous setup
        ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'admin' BEFORE 'manager';
    END IF;
END $$;

-- ==========================================
-- 2. TABLES SETUP
-- ==========================================

-- A. PROFILES TABLE
-- Stores user-specific settings and roles
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  performer_name TEXT,
  role user_role DEFAULT 'performer',
  client_id TEXT, -- For Lead role to restrict access
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- B. STATUS ENTRIES TABLE
-- The main table for all logs
CREATE TABLE IF NOT EXISTS public.status_entries (
  id BIGINT PRIMARY KEY, -- Using frontend-generated Date.now()
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id TEXT DEFAULT 'DEFAULT_CLIENT',
  date DATE NOT NULL,
  "performerName" TEXT, -- Matching frontend camelCase
  "titleName" TEXT,
  "completedPages" NUMERIC,
  "taskType" TEXT,
  "estimatedTime" NUMERIC,
  "takenTime" NUMERIC,
  "timeAchieved" NUMERIC,
  "targetAchieved" NUMERIC,
  "status" TEXT
);

-- ==========================================
-- 3. ENABLE ROW LEVEL SECURITY (RLS)
-- ==========================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.status_entries ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- 4. POLICIES: PROFILES
-- ==========================================
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone." ON public.profiles
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can update their own profile." ON public.profiles;
CREATE POLICY "Users can update their own profile." ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
CREATE POLICY "Admins can update all profiles" ON public.profiles
  FOR UPDATE TO authenticated
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

-- ==========================================
-- 5. POLICIES: STATUS ENTRIES (RBAC)
-- ==========================================

-- Standard SELECT Policy for all roles
-- Performers see own, Leads see client, Admins/Managers see all
DROP POLICY IF EXISTS "RBAC Select Policy" ON public.status_entries;
CREATE POLICY "RBAC Select Policy" ON public.status_entries
  FOR SELECT TO authenticated
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'manager') OR
    ((SELECT role FROM profiles WHERE id = auth.uid()) = 'lead' AND client_id = (SELECT client_id FROM profiles WHERE id = auth.uid())) OR
    ((SELECT role FROM profiles WHERE id = auth.uid()) = 'performer' AND user_id = auth.uid())
  );

-- INSERT Policy: Anyone authenticated can insert (limited to their own user_id)
DROP POLICY IF EXISTS "Insert own entries" ON public.status_entries;
CREATE POLICY "Insert own entries" ON public.status_entries
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- DELETE Policy: Performers can delete own, Admins can delete all
DROP POLICY IF EXISTS "Delete entries" ON public.status_entries;
CREATE POLICY "Delete entries" ON public.status_entries
  FOR DELETE TO authenticated
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'manager') OR
    (user_id = auth.uid())
  );

-- ==========================================
-- 6. AUTOMATION (TRIGGERS)
-- ==========================================

-- Create profile automatically on Signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, performer_name, role)
  VALUES (
    new.id, 
    COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'performer_name', 'New Performer'), 
    'performer'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ==========================================
-- 7. HELPERS
-- ==========================================
-- Run this manually replace with your user's UUID to become Admin:
-- UPDATE profiles SET role = 'admin' WHERE id = 'YOUR_UUID_HERE';
