-- ==========================================
-- INITIALIZE USERS, TEAMS, AND ROLE ASSIGNMENTS
-- ==========================================

-- ==========================================
-- 1. CREATE TEAMS
-- ==========================================
INSERT INTO public.teams (name, description, is_active) VALUES
  ('Team 1 (T1)', 'Team 1 managed by Sumitha', true),
  ('Team 2 (T2)', 'Team 2 managed by Farzana', true),
  ('Team 3 (T3)', 'Team 3 managed by Lakshmi', true),
  ('Team 4 (T4)', 'Team 4 managed by Harish', true)
ON CONFLICT (name) DO NOTHING;

-- ==========================================
-- 1.5. CREATE USER PROFILES (if missing)
-- ==========================================
INSERT INTO public.profiles (id, performer_name, role, client_id)
SELECT 
  id,
  SPLIT_PART(email, '@', 1) as performer_name,
  'performer' as role,
  'DEFAULT_CLIENT' as client_id
FROM auth.users
WHERE email IN (
  'ayaz@company.io',
  'alex@company.io',
  'sumitha@company.io',
  'farzana@company.io',
  'lakshmi@company.io',
  'harish@company.io',
  'gansean@company.io',
  'deepan@company.io',
  'performer1@company.io',
  'performer2@company.io',
  'performer3@company.io',
  'performer4@company.io'
)
ON CONFLICT (id) DO NOTHING;

-- ==========================================
-- 2. ASSIGN SUPER ADMIN (with existence check)
-- ==========================================
UPDATE public.profiles 
SET role = 'super_admin'
WHERE performer_name LIKE '%ayaz%';

-- ==========================================
-- 3. ASSIGN GENERAL MANAGER (with existence check)
-- ==========================================
UPDATE public.profiles 
SET role = 'general_manager'
WHERE performer_name LIKE '%alex%';

-- ==========================================
-- 4. ASSIGN TEAM LEADS (with their respective teams)
-- ==========================================
-- Sumitha -> Team Lead -> Team 1
UPDATE public.profiles 
SET role = 'team_lead', 
    team_id = (SELECT id FROM teams WHERE name = 'Team 1 (T1)')
WHERE performer_name LIKE '%sumitha%';

-- Farzana -> Team Lead -> Team 2
UPDATE public.profiles 
SET role = 'team_lead', 
    team_id = (SELECT id FROM teams WHERE name = 'Team 2 (T2)')
WHERE performer_name LIKE '%farzana%';

-- Lakshmi -> Team Lead -> Team 3
UPDATE public.profiles 
SET role = 'team_lead', 
    team_id = (SELECT id FROM teams WHERE name = 'Team 3 (T3)')
WHERE performer_name LIKE '%lakshmi%';

-- Harish -> Team Lead -> Team 4
UPDATE public.profiles 
SET role = 'team_lead', 
    team_id = (SELECT id FROM teams WHERE name = 'Team 4 (T4)')
WHERE performer_name LIKE '%harish%';

-- ==========================================
-- 5. ASSIGN ASSISTANT MANAGERS (no teams)
-- ==========================================
UPDATE public.profiles 
SET role = 'assistant_manager'
WHERE performer_name LIKE '%gansean%';

UPDATE public.profiles 
SET role = 'assistant_manager'
WHERE performer_name LIKE '%deepan%';

-- ==========================================
-- 6. ASSIGN PERFORMERS TO TEAMS
-- ==========================================
-- Performer 1 -> Team 1
UPDATE public.profiles 
SET role = 'performer', 
    team_id = (SELECT id FROM teams WHERE name = 'Team 1 (T1)')
WHERE performer_name LIKE '%performer1%';

-- Performer 2 -> Team 2
UPDATE public.profiles 
SET role = 'performer', 
    team_id = (SELECT id FROM teams WHERE name = 'Team 2 (T2)')
WHERE performer_name LIKE '%performer2%';

-- Performer 3 -> Team 3
UPDATE public.profiles 
SET role = 'performer', 
    team_id = (SELECT id FROM teams WHERE name = 'Team 3 (T3)')
WHERE performer_name LIKE '%performer3%';

-- Performer 4 -> Team 4
UPDATE public.profiles 
SET role = 'performer', 
    team_id = (SELECT id FROM teams WHERE name = 'Team 4 (T4)')
WHERE performer_name LIKE '%performer4%';

-- ==========================================
-- 7. UPDATE TEAM MANAGERS
-- ==========================================
-- Set team managers to their respective team leads
UPDATE public.teams 
SET manager_id = (SELECT id FROM public.profiles WHERE performer_name LIKE '%sumitha%' LIMIT 1)
WHERE name = 'Team 1 (T1)';

UPDATE public.teams 
SET manager_id = (SELECT id FROM public.profiles WHERE performer_name LIKE '%farzana%' LIMIT 1)
WHERE name = 'Team 2 (T2)';

UPDATE public.teams 
SET manager_id = (SELECT id FROM public.profiles WHERE performer_name LIKE '%lakshmi%' LIMIT 1)
WHERE name = 'Team 3 (T3)';

UPDATE public.teams 
SET manager_id = (SELECT id FROM public.profiles WHERE performer_name LIKE '%harish%' LIMIT 1)
WHERE name = 'Team 4 (T4)';

-- ==========================================
-- 8. VERIFICATION QUERIES
-- ==========================================
-- View all users with their roles and teams
SELECT 
  p.id,
  p.performer_name,
  p.role,
  t.name as team_name
FROM public.profiles p
LEFT JOIN public.teams t ON p.team_id = t.id
ORDER BY p.role DESC, t.name, p.performer_name;

-- View all teams with their managers
SELECT 
  t.name as team_name,
  t.description,
  p.performer_name as manager_name,
  t.is_active
FROM public.teams t
LEFT JOIN public.profiles p ON t.manager_id = p.id
ORDER BY t.name;

-- Count users by role
SELECT role, COUNT(*) as count
FROM public.profiles
GROUP BY role
ORDER BY role DESC;
