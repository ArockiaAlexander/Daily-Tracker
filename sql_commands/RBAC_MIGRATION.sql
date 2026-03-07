-- ==========================================
-- ENTERPRISE RBAC SYSTEM - 5-ROLE HIERARCHY
-- Supports: Super Admin, General Manager, Assistant Manager, Team Lead, Performer
-- ==========================================

-- ==========================================
-- 1. UPDATE ENUM - ADD NEW ROLES
-- ==========================================
-- PostgreSQL doesn't allow direct enum removal, so we create a migration path
DO $$ 
BEGIN
    -- Try to add new enum values if they don't exist
    BEGIN
        ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'super_admin' BEFORE 'admin';
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
    
    BEGIN
        ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'general_manager' AFTER 'super_admin';
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
    
    BEGIN
        ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'assistant_manager' AFTER 'general_manager';
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
    
    BEGIN
        ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'team_lead' AFTER 'assistant_manager';
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
END $$;

-- ==========================================
-- 2. TEAMS TABLE
-- ==========================================
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

-- ==========================================
-- 3. UPDATE PROFILES TABLE
-- ==========================================
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS department TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS reports_to UUID REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_profiles_team ON public.profiles(team_id);
CREATE INDEX IF NOT EXISTS idx_profiles_reports_to ON public.profiles(reports_to);

-- ==========================================
-- 4. PERFORMANCE METRICS TABLE (NEW)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.performance_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  metric_date DATE NOT NULL,
  month DATE NOT NULL, -- First day of month for grouping
  year INTEGER NOT NULL,
  total_pages NUMERIC DEFAULT 0,
  tasks_completed INTEGER DEFAULT 0,
  target_achieved NUMERIC DEFAULT 0,
  time_efficiency NUMERIC DEFAULT 0, -- percentage
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
-- 5. ENABLE RLS ON NEW TABLES
-- ==========================================
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.performance_metrics ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- 6. TEAMS TABLE POLICIES
-- ==========================================

-- Super Admin & General Manager can view all teams
DROP POLICY IF EXISTS "Admin view all teams" ON public.teams;
CREATE POLICY "Admin view all teams" ON public.teams
  FOR SELECT TO authenticated
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('super_admin', 'general_manager')
  );

-- Assistant Manager can view teams they manage or belong to
DROP POLICY IF EXISTS "Assistant Manager view assigned teams" ON public.teams;
CREATE POLICY "Assistant Manager view assigned teams" ON public.teams
  FOR SELECT TO authenticated
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('super_admin', 'general_manager') OR
    (
      (SELECT role FROM profiles WHERE id = auth.uid()) IN ('assistant_manager', 'team_lead') AND
      manager_id = auth.uid()
    ) OR
    (
      id IN (
        SELECT team_id FROM profiles WHERE id = auth.uid()
      )
    )
  );

-- Team Lead can view their team only
DROP POLICY IF EXISTS "Team Lead view own team" ON public.teams;
CREATE POLICY "Team Lead view own team" ON public.teams
  FOR SELECT TO authenticated
  USING (
    id = (SELECT team_id FROM profiles WHERE id = auth.uid())
  );

-- Super Admin can manage teams
DROP POLICY IF EXISTS "Super Admin manage teams" ON public.teams;
CREATE POLICY "Super Admin manage teams" ON public.teams
  FOR ALL TO authenticated
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'super_admin'
  )
  WITH CHECK (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'super_admin'
  );

-- ==========================================
-- 7. PERFORMANCE METRICS POLICIES
-- ==========================================

-- Super Admin & General Manager see all
DROP POLICY IF EXISTS "Admin view all metrics" ON public.performance_metrics;
CREATE POLICY "Admin view all metrics" ON public.performance_metrics
  FOR SELECT TO authenticated
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('super_admin', 'general_manager')
  );

-- Assistant Manager sees team metrics
DROP POLICY IF EXISTS "Assistant Manager view team metrics" ON public.performance_metrics;
CREATE POLICY "Assistant Manager view team metrics" ON public.performance_metrics
  FOR SELECT TO authenticated
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('super_admin', 'general_manager') OR
    (
      (SELECT role FROM profiles WHERE id = auth.uid()) = 'assistant_manager' AND
      user_id IN (
        SELECT id FROM profiles 
        WHERE team_id IN (
          SELECT id FROM teams WHERE manager_id = auth.uid()
        )
      )
    )
  );

-- Team Lead sees team member metrics
DROP POLICY IF EXISTS "Team Lead view team metrics" ON public.performance_metrics;
CREATE POLICY "Team Lead view team metrics" ON public.performance_metrics
  FOR SELECT TO authenticated
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('super_admin', 'general_manager') OR
    (
      (SELECT role FROM profiles WHERE id = auth.uid()) = 'team_lead' AND
      user_id IN (
        SELECT id FROM profiles 
        WHERE team_id = (SELECT team_id FROM profiles WHERE id = auth.uid())
      )
    ) OR
    (
      (SELECT role FROM profiles WHERE id = auth.uid()) = 'performer' AND
      user_id = auth.uid()
    )
  );

-- Performers see own and colleague metrics
DROP POLICY IF EXISTS "Performer view own metrics" ON public.performance_metrics;
CREATE POLICY "Performer view own metrics" ON public.performance_metrics
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid() OR
    (
      (SELECT role FROM profiles WHERE id = auth.uid()) = 'performer' AND
      user_id IN (
        SELECT id FROM profiles 
        WHERE team_id = (SELECT team_id FROM profiles WHERE id = auth.uid())
      )
    )
  );

-- Anyone can insert their own metrics
DROP POLICY IF EXISTS "Insert own metrics" ON public.performance_metrics;
CREATE POLICY "Insert own metrics" ON public.performance_metrics
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Admin can update metrics
DROP POLICY IF EXISTS "Admin update metrics" ON public.performance_metrics;
CREATE POLICY "Admin update metrics" ON public.performance_metrics
  FOR UPDATE TO authenticated
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('super_admin', 'general_manager')
  );

-- ==========================================
-- 8. UPDATED STATUS_ENTRIES POLICIES
-- ==========================================

-- Redefine with new role hierarchy
DROP POLICY IF EXISTS "RBAC Select Policy - Workflow Aware" ON public.status_entries;
CREATE POLICY "RBAC Select Policy - Extended" ON public.status_entries
  FOR SELECT TO authenticated
  USING (
    -- Super Admin: See all
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'super_admin' OR
    -- General Manager: See all employees
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'general_manager' OR
    -- Assistant Manager: See teams they manage
    (
      (SELECT role FROM profiles WHERE id = auth.uid()) = 'assistant_manager' AND
      user_id IN (
        SELECT id FROM profiles 
        WHERE team_id IN (
          SELECT id FROM teams WHERE manager_id = auth.uid()
        )
      )
    ) OR
    -- Team Lead: See team members
    (
      (SELECT role FROM profiles WHERE id = auth.uid()) = 'team_lead' AND
      user_id IN (
        SELECT id FROM profiles 
        WHERE team_id = (SELECT team_id FROM profiles WHERE id = auth.uid())
      )
    ) OR
    -- Performer: See own entries
    ((SELECT role FROM profiles WHERE id = auth.uid()) = 'performer' AND user_id = auth.uid())
  );

-- Insert/Delete policies remain similar
DROP POLICY IF EXISTS "Insert own entries" ON public.status_entries;
CREATE POLICY "Insert own entries" ON public.status_entries
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Delete entries" ON public.status_entries;
CREATE POLICY "Delete entries" ON public.status_entries
  FOR DELETE TO authenticated
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('super_admin', 'general_manager') OR
    (user_id = auth.uid())
  );

-- ==========================================
-- 9. LEADERBOARD VIEWS
-- ==========================================

-- Monthly Leaderboard
DROP VIEW IF EXISTS public.monthly_leaderboard CASCADE;
CREATE VIEW public.monthly_leaderboard AS
SELECT 
  pm.user_id,
  p.performer_name,
  p.role,
  p.team_id,
  t.name as team_name,
  pm.metric_date,
  pm.month,
  pm.total_pages,
  pm.tasks_completed,
  pm.target_achieved,
  pm.time_efficiency,
  pm.quality_score,
  pm.rank_monthly,
  ROW_NUMBER() OVER (PARTITION BY pm.month ORDER BY pm.total_pages DESC) as calculated_rank
FROM performance_metrics pm
JOIN profiles p ON pm.user_id = p.id
LEFT JOIN teams t ON p.team_id = t.id
WHERE pm.metric_date IS NOT NULL;

-- Quarterly Leaderboard
DROP VIEW IF EXISTS public.quarterly_leaderboard CASCADE;
CREATE VIEW public.quarterly_leaderboard AS
SELECT 
  pm.user_id,
  p.performer_name,
  p.role,
  p.team_id,
  t.name as team_name,
  EXTRACT(QUARTER FROM pm.month)::INTEGER as quarter,
  pm.year,
  SUM(pm.total_pages) as total_pages_quarter,
  SUM(pm.tasks_completed) as tasks_completed_quarter,
  AVG(pm.target_achieved) as avg_target_achieved,
  AVG(pm.time_efficiency) as avg_time_efficiency,
  AVG(pm.quality_score) as avg_quality_score,
  pm.rank_quarterly,
  ROW_NUMBER() OVER (
    PARTITION BY EXTRACT(QUARTER FROM pm.month), pm.year 
    ORDER BY SUM(pm.total_pages) DESC
  ) as calculated_rank
FROM performance_metrics pm
JOIN profiles p ON pm.user_id = p.id
LEFT JOIN teams t ON p.team_id = t.id
WHERE pm.metric_date IS NOT NULL
GROUP BY pm.user_id, p.performer_name, p.role, p.team_id, t.name, quarter, pm.year, pm.rank_quarterly;

-- Yearly Leaderboard
DROP VIEW IF EXISTS public.yearly_leaderboard CASCADE;
CREATE VIEW public.yearly_leaderboard AS
SELECT 
  pm.user_id,
  p.performer_name,
  p.role,
  p.team_id,
  t.name as team_name,
  pm.year,
  SUM(pm.total_pages) as total_pages_year,
  SUM(pm.tasks_completed) as tasks_completed_year,
  AVG(pm.target_achieved) as avg_target_achieved,
  AVG(pm.time_efficiency) as avg_time_efficiency,
  AVG(pm.quality_score) as avg_quality_score,
  pm.rank_yearly,
  ROW_NUMBER() OVER (
    PARTITION BY pm.year 
    ORDER BY SUM(pm.total_pages) DESC
  ) as calculated_rank
FROM performance_metrics pm
JOIN profiles p ON pm.user_id = p.id
LEFT JOIN teams t ON p.team_id = t.id
WHERE pm.metric_date IS NOT NULL
GROUP BY pm.user_id, p.performer_name, p.role, p.team_id, t.name, pm.year, pm.rank_yearly;

-- Team Performance View
DROP VIEW IF EXISTS public.team_performance CASCADE;
CREATE VIEW public.team_performance AS
SELECT 
  t.id as team_id,
  t.name as team_name,
  COUNT(DISTINCT p.id) as team_size,
  ROUND(AVG(pm.total_pages)::NUMERIC, 2) as avg_pages_per_member,
  ROUND(AVG(pm.target_achieved)::NUMERIC, 2) as avg_target_achieved,
  ROUND(AVG(pm.time_efficiency)::NUMERIC, 2) as avg_time_efficiency,
  SUM(pm.total_pages) as total_team_pages,
  pm.month,
  pm.year
FROM teams t
LEFT JOIN profiles p ON t.id = p.team_id
LEFT JOIN performance_metrics pm ON p.id = pm.user_id
WHERE pm.metric_date IS NOT NULL
GROUP BY t.id, t.name, pm.month, pm.year;

-- Grant view access to authenticated users
GRANT SELECT ON public.monthly_leaderboard TO authenticated;
GRANT SELECT ON public.quarterly_leaderboard TO authenticated;
GRANT SELECT ON public.yearly_leaderboard TO authenticated;
GRANT SELECT ON public.team_performance TO authenticated;

-- ==========================================
-- 10. HELPER FUNCTIONS
-- ==========================================

-- Function to get user's accessible scope based on role
CREATE OR REPLACE FUNCTION get_user_role_level(user_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
  role_level INTEGER;
BEGIN
  SELECT 
    CASE 
      WHEN role = 'super_admin' THEN 5
      WHEN role = 'general_manager' THEN 4
      WHEN role = 'assistant_manager' THEN 3
      WHEN role = 'team_lead' THEN 2
      WHEN role = 'performer' THEN 1
      ELSE 0
    END INTO role_level
  FROM profiles WHERE id = user_uuid;
  
  RETURN COALESCE(role_level, 0);
END
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to get team hierarchy
CREATE OR REPLACE FUNCTION get_team_hierarchy(team_uuid UUID)
RETURNS TABLE (
  team_id UUID,
  team_name TEXT,
  manager_id UUID,
  manager_name TEXT,
  member_count INTEGER,
  level INTEGER
) AS $$
WITH RECURSIVE team_tree AS (
  SELECT t.id, t.name, t.manager_id, 1 as level
  FROM teams t
  WHERE t.id = team_uuid
  UNION ALL
  SELECT t.id, t.name, t.manager_id, tt.level + 1
  FROM teams t
  JOIN team_tree tt ON t.parent_team_id = tt.team_id
)
SELECT 
  tt.id,
  tt.name,
  tt.manager_id,
  p.performer_name,
  COUNT(DISTINCT profiles.id),
  tt.level
FROM team_tree tt
LEFT JOIN profiles p ON tt.manager_id = p.id
LEFT JOIN profiles ON profiles.team_id = tt.id
GROUP BY tt.id, tt.name, tt.manager_id, p.performer_name, tt.level;
$$ LANGUAGE SQL STABLE;

-- ==========================================
-- 11. MIGRATION NOTES
-- ==========================================
-- After running this migration:
-- 1. Update existing users' roles:
--    UPDATE profiles SET role = 'super_admin' WHERE id = 'ADMIN_UUID';
--    UPDATE profiles SET role = 'general_manager' WHERE id = 'MANAGER_UUID';
--    UPDATE profiles SET role = 'team_lead' WHERE id = 'LEAD_UUID';
--
-- 2. Create teams in Supabase (example):
--    INSERT INTO teams (name, manager_id) VALUES ('Engineering', 'MANAGER_UUID');
--
-- 3. Assign users to teams:
--    UPDATE profiles SET team_id = 'TEAM_UUID' WHERE id = 'USER_UUID';
--
-- 4. Update performance metrics (automated by trigger or daily job):
--    Performance aggregation from status_entries to performance_metrics
--
-- Role Hierarchy (from highest to lowest):
-- 1. Super Admin (5) - Full system access
-- 2. General Manager (4) - All employees + analytics
-- 3. Assistant Manager (3) - Multiple teams
-- 4. Team Lead (2) - Own team
-- 5. Performer (1) - Self only
