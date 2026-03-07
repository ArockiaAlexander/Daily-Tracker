-- ==========================================
-- PASSWORD RESET & TEAM LEAD SETUP
-- ==========================================

-- ⚠️ NOTE: You CANNOT set passwords directly via SQL in Supabase
-- Passwords are managed by Supabase Auth and are encrypted
-- Use one of these methods instead:
--   1. User clicks "Forgot Password" link
--   2. Admin clicks Key 🔑 icon in dashboard
--   3. Use Supabase CLI: supabase auth admin resetpassword alex@company.io
--   4. Use Supabase dashboard: Auth > Users > alex > Reset Password

-- ==========================================
-- 1. VERIFY ALEX IS SET UP AS GENERAL MANAGER
-- ==========================================
-- Check if alex is properly configured
SELECT 
  id,
  performer_name,
  role,
  email,
  CASE 
    WHEN role = 'general_manager' THEN '✅ Correct'
    ELSE '❌ Wrong Role'
  END as status
FROM public.profiles
WHERE performer_name LIKE '%alex%';

-- ==========================================
-- 2. ENSURE ALL TEAM LEADS ARE MANAGING THEIR TEAMS
-- ==========================================
-- Verify team leads are assigned to teams AND have manager_id set
SELECT 
  t.name as team_name,
  t.manager_id,
  p.performer_name as manager_name,
  p.role,
  CASE 
    WHEN p.role = 'team_lead' THEN '✅ Correct'
    ELSE '❌ Wrong Role'
  END as status
FROM public.teams t
LEFT JOIN public.profiles p ON t.manager_id = p.id
ORDER BY t.name;

-- ==========================================
-- 3. VERIFY TEAM LEAD + TEAM ASSIGNMENTS
-- ==========================================
-- Check all team leads have proper team assignments
SELECT 
  performer_name,
  role,
  team_id,
  t.name as team_name,
  CASE 
    WHEN role = 'team_lead' AND team_id IS NOT NULL THEN '✅ Properly Set'
    WHEN role = 'team_lead' AND team_id IS NULL THEN '⚠️ No Team'
    ELSE '❌ Not a Team Lead'
  END as status
FROM public.profiles p
LEFT JOIN public.teams t ON p.team_id = t.id
WHERE performer_name LIKE '%sumitha%'
   OR performer_name LIKE '%farzana%'
   OR performer_name LIKE '%lakshmi%'
   OR performer_name LIKE '%harish%'
ORDER BY performer_name;

-- ==========================================
-- 4. FIX: ENSURE TEAM LEADS MANAGE THEIR TEAMS (if needed)
-- ==========================================
-- Run this ONLY if team managers are not set correctly

-- Sumitha manages Team 1
UPDATE public.teams 
SET manager_id = (
  SELECT id FROM public.profiles 
  WHERE performer_name LIKE '%sumitha%' 
  AND role = 'team_lead' 
  LIMIT 1
)
WHERE name = 'Team 1 (T1)';

-- Farzana manages Team 2
UPDATE public.teams 
SET manager_id = (
  SELECT id FROM public.profiles 
  WHERE performer_name LIKE '%farzana%' 
  AND role = 'team_lead' 
  LIMIT 1
)
WHERE name = 'Team 2 (T2)';

-- Lakshmi manages Team 3
UPDATE public.teams 
SET manager_id = (
  SELECT id FROM public.profiles 
  WHERE performer_name LIKE '%lakshmi%' 
  AND role = 'team_lead' 
  LIMIT 1
)
WHERE name = 'Team 3 (T3)';

-- Harish manages Team 4
UPDATE public.teams 
SET manager_id = (
  SELECT id FROM public.profiles 
  WHERE performer_name LIKE '%harish%' 
  AND role = 'team_lead' 
  LIMIT 1
)
WHERE name = 'Team 4 (T4)';

-- ==========================================
-- 5. VERIFY FINAL SETUP
-- ==========================================
-- Run after above updates to confirm everything is correct
SELECT 
  'Team Managers' as category,
  t.name,
  p.performer_name,
  p.role
FROM public.teams t
LEFT JOIN public.profiles p ON t.manager_id = p.id
UNION ALL
SELECT 
  'Team Members' as category,
  t.name,
  p.performer_name,
  p.role
FROM public.profiles p
LEFT JOIN public.teams t ON p.team_id = t.id
WHERE p.team_id IS NOT NULL
ORDER BY category, name, performer_name;
