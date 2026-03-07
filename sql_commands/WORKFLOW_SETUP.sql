-- ==========================================
-- WORKFLOW MANAGEMENT SYSTEM
-- Enables role-based, workflow-wise access control
-- ==========================================

-- ==========================================
-- 1. WORKFLOWS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS public.workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true
);

-- ==========================================
-- 2. WORKFLOW ASSIGNMENTS (User ↔ Workflow Junction)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.workflow_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workflow_id UUID NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, workflow_id)
);

-- ==========================================
-- 3. UPDATE STATUS_ENTRIES TO SUPPORT WORKFLOWS
-- ==========================================
-- Ensure status_entries table exists (fallback if AUTH_SETUP.sql didn't run)
CREATE TABLE IF NOT EXISTS public.status_entries (
  id BIGINT PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id TEXT DEFAULT 'DEFAULT_CLIENT',
  date DATE NOT NULL,
  "performerName" TEXT,
  "titleName" TEXT,
  "completedPages" NUMERIC,
  "taskType" TEXT,
  "estimatedTime" NUMERIC,
  "takenTime" NUMERIC,
  "timeAchieved" NUMERIC,
  "targetAchieved" NUMERIC,
  "status" TEXT
);

-- Add workflow_id column if table exists
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'status_entries') THEN
    ALTER TABLE public.status_entries ADD COLUMN IF NOT EXISTS workflow_id UUID REFERENCES workflows(id) ON DELETE SET NULL;
    CREATE INDEX IF NOT EXISTS idx_status_entries_workflow ON public.status_entries(workflow_id);
    CREATE INDEX IF NOT EXISTS idx_status_entries_user_date ON public.status_entries(user_id, date);
  END IF;
END $$;

-- ==========================================
-- 4. ENABLE RLS ON NEW TABLES
-- ==========================================
ALTER TABLE public.workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_assignments ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- 5. WORKFLOWS TABLE POLICIES
-- ==========================================

-- Super Admins/General Managers can view all workflows
DROP POLICY IF EXISTS "Workflows viewable by admin/manager" ON public.workflows;
CREATE POLICY "Workflows viewable by admin/manager" ON public.workflows
  FOR SELECT TO authenticated
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('super_admin', 'general_manager')
  );

-- All authenticated users can view workflows they're assigned to
DROP POLICY IF EXISTS "Workflows viewable by assigned users" ON public.workflows;
CREATE POLICY "Workflows viewable by assigned users" ON public.workflows
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM workflow_assignments 
      WHERE workflow_assignments.workflow_id = workflows.id 
      AND workflow_assignments.user_id = auth.uid()
    )
  );

-- Only Super Admins can create workflows
DROP POLICY IF EXISTS "Only admins create workflows" ON public.workflows;
CREATE POLICY "Only admins create workflows" ON public.workflows
  FOR INSERT TO authenticated
  WITH CHECK (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'super_admin'
  );

-- Only Super Admin can update workflows
DROP POLICY IF EXISTS "Only admin updates workflows" ON public.workflows;
CREATE POLICY "Only admin updates workflows" ON public.workflows
  FOR UPDATE TO authenticated
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'super_admin'
  );

-- Only Super Admin can delete workflows
DROP POLICY IF EXISTS "Only admin deletes workflows" ON public.workflows;
CREATE POLICY "Only admin deletes workflows" ON public.workflows
  FOR DELETE TO authenticated
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'super_admin'
  );

-- ==========================================
-- 6. WORKFLOW_ASSIGNMENTS TABLE POLICIES
-- ==========================================

-- Super Admins/General Managers can view all assignments
DROP POLICY IF EXISTS "Admin view all assignments" ON public.workflow_assignments;
CREATE POLICY "Admin view all assignments" ON public.workflow_assignments
  FOR SELECT TO authenticated
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('super_admin', 'general_manager')
  );

-- Users can view their own assignments
DROP POLICY IF EXISTS "Users view own assignments" ON public.workflow_assignments;
CREATE POLICY "Users view own assignments" ON public.workflow_assignments
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid() OR
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('super_admin', 'general_manager')
  );

-- Only Super Admin can create/assign workflows to users
DROP POLICY IF EXISTS "Only admin assigns workflows" ON public.workflow_assignments;
CREATE POLICY "Only admin assigns workflows" ON public.workflow_assignments
  FOR INSERT TO authenticated
  WITH CHECK (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'super_admin'
  );

-- Only Super Admin can remove assignments
DROP POLICY IF EXISTS "Only admin removes assignments" ON public.workflow_assignments;
CREATE POLICY "Only admin removes assignments" ON public.workflow_assignments
  FOR DELETE TO authenticated
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'super_admin'
  );

-- ==========================================
-- 7. UPDATE STATUS_ENTRIES RLS POLICIES
-- ==========================================
-- (Replace old "RBAC Select Policy" with workflow-aware version if table exists)

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'status_entries') THEN
    DROP POLICY IF EXISTS "RBAC Select Policy" ON public.status_entries;
    
    CREATE POLICY "RBAC Select Policy - Workflow Aware" ON public.status_entries
      FOR SELECT TO authenticated
      USING (
        -- Super Admin/General Manager can see all
        (SELECT role FROM profiles WHERE id = auth.uid()) IN ('super_admin', 'general_manager') OR
        -- Team Lead can see team entries
        ((SELECT role FROM profiles WHERE id = auth.uid()) = 'team_lead' AND 
         user_id IN (SELECT id FROM profiles WHERE team_id = (SELECT team_id FROM profiles WHERE id = auth.uid()))) OR
        -- Performer can see own entries
        ((SELECT role FROM profiles WHERE id = auth.uid()) = 'performer' AND 
         user_id = auth.uid()) OR
        -- User assigned to workflow can see entries within that workflow
        (workflow_id IS NOT NULL AND EXISTS (
          SELECT 1 FROM workflow_assignments 
          WHERE workflow_assignments.workflow_id = status_entries.workflow_id 
          AND workflow_assignments.user_id = auth.uid()
        ))
      );
  END IF;
END $$;

-- Keep existing INSERT and DELETE policies (unchanged)
-- INSERT: Anyone authenticated can insert their own entries
-- DELETE: Performers own entries, Admins can delete all

-- ==========================================
-- 8. HELPER VIEWS (Optional but useful)
-- ==========================================

-- View to see all users and their assigned workflows
DROP VIEW IF EXISTS public.user_workflow_view CASCADE;
CREATE VIEW public.user_workflow_view AS
SELECT 
  p.id,
  p.performer_name,
  p.role,
  p.client_id,
  w.id as workflow_id,
  w.name as workflow_name,
  w.is_active
FROM profiles p
LEFT JOIN workflow_assignments wa ON p.id = wa.user_id
LEFT JOIN workflows w ON wa.workflow_id = w.id;

-- Grant view access
GRANT SELECT ON public.user_workflow_view TO authenticated;

-- ==========================================
-- 9. MIGRATION NOTES
-- ==========================================
-- After running this migration:
-- 1. Manually create workflows in Supabase: admin → Workflows menu
-- 2. Assign users to workflows: admin → Workflow Assignments
-- 3. When creating status entries, include workflow_id for scoped access
-- 4. RLS will automatically restrict based on workflow membership
