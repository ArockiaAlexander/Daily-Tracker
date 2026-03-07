-- ==========================================
-- 1. EXTENSIONS & TYPES
-- ==========================================
-- Create custom enum for user roles
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('super_admin', 'general_manager', 'assistant_manager', 'team_lead', 'performer');
    ELSE
        -- Add new enterprise roles if missing
        ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'super_admin' AFTER 'performer';
        ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'general_manager' AFTER 'performer';
        ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'assistant_manager' AFTER 'performer';
        ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'team_lead' AFTER 'performer';
    END IF;
END $$;

-- ==========================================
-- 2. TABLES SETUP
-- ==========================================

-- A. TEAMS TABLE
-- Stores team structure with hierarchy
CREATE TABLE IF NOT EXISTS public.teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  manager_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  parent_team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true
);

CREATE INDEX IF NOT EXISTS idx_teams_manager ON public.teams(manager_id);
CREATE INDEX IF NOT EXISTS idx_teams_parent ON public.teams(parent_team_id);

-- B. PROFILES TABLE
-- Stores user-specific settings and roles
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  performer_name TEXT,
  role user_role DEFAULT 'performer',
  team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
  department TEXT,
  reports_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  client_id TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add missing columns to existing profiles table (if they don't exist)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS department TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS reports_to UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Create indexes after columns are guaranteed to exist
CREATE INDEX IF NOT EXISTS idx_profiles_team ON public.profiles(team_id);
CREATE INDEX IF NOT EXISTS idx_profiles_reports_to ON public.profiles(reports_to);

-- C. STATUS ENTRIES TABLE
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

-- D. PERFORMANCE METRICS TABLE
-- Aggregated performance data by user and timeframe
CREATE TABLE IF NOT EXISTS public.performance_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  metric_date DATE NOT NULL,
  month DATE NOT NULL,
  year INTEGER NOT NULL,
  total_pages NUMERIC DEFAULT 0,
  tasks_completed INTEGER DEFAULT 0,
  target_achieved NUMERIC DEFAULT 0,
  time_efficiency NUMERIC DEFAULT 0,
  quality_score NUMERIC DEFAULT 0,
  rank_monthly INTEGER,
  rank_quarterly INTEGER,
  rank_yearly INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, metric_date)
);

CREATE INDEX IF NOT EXISTS idx_metrics_user_date ON public.performance_metrics(user_id, metric_date);
CREATE INDEX IF NOT EXISTS idx_metrics_month ON public.performance_metrics(month);
CREATE INDEX IF NOT EXISTS idx_metrics_year ON public.performance_metrics(year);

-- ==========================================
-- 3. ENABLE ROW LEVEL SECURITY (RLS)
-- ==========================================
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.status_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.performance_metrics ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- 4. POLICIES: PROFILES
-- ==========================================
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone." ON public.profiles
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can update their own profile." ON public.profiles;
CREATE POLICY "Users can update their own profile." ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Super admins can update all profiles" ON public.profiles;
CREATE POLICY "Super admins can update all profiles" ON public.profiles
  FOR UPDATE TO authenticated
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('super_admin', 'general_manager')
  );

-- ==========================================
-- 5. POLICIES: STATUS ENTRIES (RBAC)
-- ==========================================

-- Standard SELECT Policy for all roles
-- Performers see own, Team Leads see team, Managers/Super Admins see all
DROP POLICY IF EXISTS "RBAC Select Policy" ON public.status_entries;
CREATE POLICY "RBAC Select Policy" ON public.status_entries
  FOR SELECT TO authenticated
  USING (
    -- Super Admin and General Manager see all
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('super_admin', 'general_manager') OR
    -- Assistant Manager sees own team(s)
    ((SELECT role FROM profiles WHERE id = auth.uid()) = 'assistant_manager' AND 
     user_id IN (SELECT id FROM profiles WHERE team_id IN (SELECT id FROM teams WHERE manager_id = auth.uid()))) OR
    -- Team Lead sees own team
    ((SELECT role FROM profiles WHERE id = auth.uid()) = 'team_lead' AND 
     user_id IN (SELECT id FROM profiles WHERE team_id = (SELECT team_id FROM profiles WHERE id = auth.uid()))) OR
    -- Performer sees own entries
    ((SELECT role FROM profiles WHERE id = auth.uid()) = 'performer' AND user_id = auth.uid())
  );

-- INSERT Policy: Anyone authenticated can insert (limited to their own user_id)
DROP POLICY IF EXISTS "Insert own entries" ON public.status_entries;
CREATE POLICY "Insert own entries" ON public.status_entries
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- DELETE Policy: Performers can delete own, Managers/Super Admins can delete any
DROP POLICY IF EXISTS "Delete entries" ON public.status_entries;
CREATE POLICY "Delete entries" ON public.status_entries
  FOR DELETE TO authenticated
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('super_admin', 'general_manager', 'assistant_manager') OR
    (user_id = auth.uid())
  );

-- =========================================
-- 6. POLICIES: TEAMS
-- =========================================

-- Super Admin & General Manager can view all teams
DROP POLICY IF EXISTS "Admin view all teams" ON public.teams;
CREATE POLICY "Admin view all teams" ON public.teams
  FOR SELECT TO authenticated
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('super_admin', 'general_manager')
  );

-- Super Admin & General Manager can manage teams
DROP POLICY IF EXISTS "Admin manage teams" ON public.teams;
CREATE POLICY "Admin manage teams" ON public.teams
  FOR ALL TO authenticated
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('super_admin', 'general_manager')
  )
  WITH CHECK (
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('super_admin', 'general_manager')
  );

-- =========================================
-- 7. POLICIES: PERFORMANCE METRICS
-- =========================================

-- Super Admin & General Manager see all metrics
DROP POLICY IF EXISTS "Admin view all metrics" ON public.performance_metrics;
CREATE POLICY "Admin view all metrics" ON public.performance_metrics
  FOR SELECT TO authenticated
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('super_admin', 'general_manager')
  );

-- Team Leads see team metrics, Performers see own
DROP POLICY IF EXISTS "Team lead view team metrics" ON public.performance_metrics;
CREATE POLICY "Team lead view team metrics" ON public.performance_metrics
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid() OR
    ((SELECT role FROM profiles WHERE id = auth.uid()) = 'team_lead' AND 
     user_id IN (SELECT id FROM profiles WHERE team_id = (SELECT team_id FROM profiles WHERE id = auth.uid())))
  );

-- =========================================
-- 8. AUTOMATION (TRIGGERS)
-- =========================================

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
-- 9. HELPERS
-- =========================================
-- Promote user to Super Admin (replace YOUR_UUID_HERE with actual UUID):
-- UPDATE profiles SET role = 'super_admin' WHERE id = 'YOUR_UUID_HERE';
--
-- Promote user to General Manager:
-- UPDATE profiles SET role = 'general_manager' WHERE id = 'USER_UUID';
--
-- Assign performer to a team (replace PERFORMER_UUID and TEAM_UUID):
-- UPDATE profiles SET team_id = 'TEAM_UUID' WHERE id = 'PERFORMER_UUID';
--
-- Create a team and assign a team lead:
-- INSERT INTO teams (name, description, manager_id) VALUES ('Team Name', 'Description', 'TEAM_LEAD_UUID');
-- UPDATE profiles SET team_id = (SELECT id FROM teams WHERE name = 'Team Name') WHERE role = 'performer' AND team_id IS NULL;
