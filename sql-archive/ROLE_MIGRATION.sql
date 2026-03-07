-- ==========================================
-- ROLE MIGRATION: Old System → New System
-- This migration maps old roles to new enterprise roles
-- ==========================================

-- STEP 1: Run this SQL in Supabase SQL Editor to migrate existing users

-- Migrate OLD ROLES to NEW ROLES (safest approach - manual mapping)
-- IMPORTANT: Review and customize before running!

-- Option A: Batch migration with assumptions
-- WARNING: Only run if you're sure about these mappings

/*
-- Map old 'admin' → 'super_admin'
UPDATE profiles SET role = 'super_admin' 
WHERE role = 'admin' AND role NOT IN ('super_admin', 'general_manager', 'assistant_manager', 'team_lead', 'performer');

-- Map old 'manager' → 'general_manager'
UPDATE profiles SET role = 'general_manager' 
WHERE role = 'manager' AND role NOT IN ('super_admin', 'general_manager', 'assistant_manager', 'team_lead', 'performer');

-- Map old 'lead' → 'team_lead'
UPDATE profiles SET role = 'team_lead' 
WHERE role = 'lead' AND role NOT IN ('super_admin', 'general_manager', 'assistant_manager', 'team_lead', 'performer');

-- 'performer' stays as 'performer'
-- (Already in new system)
*/

-- STEP 2: Verify the migration (run this to check)
SELECT 
  COUNT(*) as total_users,
  SUM(CASE WHEN role = 'super_admin' THEN 1 ELSE 0 END) as super_admins,
  SUM(CASE WHEN role = 'general_manager' THEN 1 ELSE 0 END) as general_managers,
  SUM(CASE WHEN role = 'assistant_manager' THEN 1 ELSE 0 END) as assistant_managers,
  SUM(CASE WHEN role = 'team_lead' THEN 1 ELSE 0 END) as team_leads,
  SUM(CASE WHEN role = 'performer' THEN 1 ELSE 0 END) as performers,
  SUM(CASE WHEN role IN ('admin', 'manager', 'lead') THEN 1 ELSE 0 END) as old_roles_remaining
FROM profiles;

-- STEP 3: View detailed breakdown
SELECT performer_name, role, team_id 
FROM profiles 
ORDER BY role, performer_name;

-- STEP 4: Manual migrations for specific users
-- Uncomment and customize these for individual users:

-- Update specific user to super_admin
-- UPDATE profiles SET role = 'super_admin' WHERE performer_name = 'John Doe';

-- Update specific user to general_manager
-- UPDATE profiles SET role = 'general_manager' WHERE performer_name = 'Jane Smith';

-- Update specific user to assistant_manager with team
-- UPDATE profiles SET role = 'assistant_manager', team_id = '[TEAM_UUID]' WHERE performer_name = 'Bob Johnson';

-- Update specific user to team_lead with team
-- UPDATE profiles SET role = 'team_lead', team_id = '[TEAM_UUID]' WHERE performer_name = 'Alice Williams';

-- STEP 5: Post-migration cleanup
-- If you want to disable old roles (optional - only after migration is complete):

-- DROP POLICY IF EXISTS "Old admin policy" ON public.status_entries;
-- (Remove any old policies that reference 'admin', 'manager', 'lead' if you have new ones)

-- STEP 6: Verification queries
-- Run these to confirm everything is working:

-- Check all users and their new roles:
SELECT 
  id,
  performer_name,
  role,
  team_id,
  client_id,
  updated_at
FROM profiles
ORDER BY role DESC, performer_name;

-- Check team assignments:
SELECT 
  p.performer_name,
  p.role,
  t.name as team_name,
  t.description,
  COUNT(DISTINCT st.id) as status_entries
FROM profiles p
LEFT JOIN teams t ON p.team_id = t.id
LEFT JOIN status_entries st ON p.id = st.user_id
WHERE p.role IN ('super_admin', 'general_manager', 'assistant_manager', 'team_lead')
GROUP BY p.id, p.performer_name, p.role, t.id, t.name, t.description
ORDER BY p.role DESC, p.performer_name;

-- Check performers who can see own data:
SELECT 
  p.performer_name,
  p.role,
  t.name as team_name,
  COUNT(DISTINCT st.id) as own_entries
FROM profiles p
LEFT JOIN teams t ON p.team_id = t.id
LEFT JOIN status_entries st ON p.id = st.user_id AND st.user_id = p.id
WHERE p.role = 'performer'
GROUP BY p.id, p.performer_name, p.role, t.id, t.name
ORDER BY p.performer_name;

-- ==========================================
-- ROLLBACK (if needed - reverts to old system)
-- ==========================================
-- Only run this if migration failed and you need to revert

/*
-- Revert all migrations
UPDATE profiles SET role = 'admin' WHERE role = 'super_admin';
UPDATE profiles SET role = 'manager' WHERE role IN ('general_manager', 'assistant_manager');
UPDATE profiles SET role = 'lead' WHERE role = 'team_lead';
*/
