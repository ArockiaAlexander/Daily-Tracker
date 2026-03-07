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
-- 2. ASSIGN SUPER ADMIN
-- ==========================================
UPDATE public.profiles 
SET role = 'super_admin'
WHERE id IN (SELECT id FROM auth.users WHERE email = 'ayaz@yaztech.co');

-- ==========================================
-- 3. ASSIGN GENERAL MANAGER
-- ==========================================
UPDATE public.profiles 
SET role = 'general_manager'
WHERE id IN (SELECT id FROM auth.users WHERE email = 'alex@cbpet.co');

-- ==========================================
-- 4. ASSIGN TEAM LEADS (with their respective teams)
-- ==========================================
-- Sumitha -> Team Lead -> Team 1
UPDATE public.profiles 
SET role = 'team_lead', 
    team_id = (SELECT id FROM teams WHERE name = 'Team 1 (T1)')
WHERE id IN (SELECT id FROM auth.users WHERE email = 'sumitha@cbpet.co');

-- Farzana -> Team Lead -> Team 2
UPDATE public.profiles 
SET role = 'team_lead', 
    team_id = (SELECT id FROM teams WHERE name = 'Team 2 (T2)')
WHERE id IN (SELECT id FROM auth.users WHERE email = 'farzana@cbpet.co');

-- Lakshmi -> Team Lead -> Team 3
UPDATE public.profiles 
SET role = 'team_lead', 
    team_id = (SELECT id FROM teams WHERE name = 'Team 3 (T3)')
WHERE id IN (SELECT id FROM auth.users WHERE email = 'laskhmi@cbpet.co');

-- Harish -> Team Lead -> Team 4
UPDATE public.profiles 
SET role = 'team_lead', 
    team_id = (SELECT id FROM teams WHERE name = 'Team 4 (T4)')
WHERE id IN (SELECT id FROM auth.users WHERE email = 'harish@cbpet.co');

-- ==========================================
-- 5. ASSIGN ASSISTANT MANAGERS (no teams)
-- ==========================================
UPDATE public.profiles 
SET role = 'assistant_manager'
WHERE id IN (SELECT id FROM auth.users WHERE email = 'gansean@cbpet.co');

UPDATE public.profiles 
SET role = 'assistant_manager'
WHERE id IN (SELECT id FROM auth.users WHERE email = 'deepan@cbpet.co');

-- ==========================================
-- 6. ASSIGN PERFORMERS TO TEAMS
-- ==========================================
-- Performer 1 -> Team 1
UPDATE public.profiles 
SET role = 'performer', 
    team_id = (SELECT id FROM teams WHERE name = 'Team 1 (T1)')
WHERE id IN (SELECT id FROM auth.users WHERE email = 'performer1@cbpet.co');

-- Performer 2 -> Team 2
UPDATE public.profiles 
SET role = 'performer', 
    team_id = (SELECT id FROM teams WHERE name = 'Team 2 (T2)')
WHERE id IN (SELECT id FROM auth.users WHERE email = 'performer2@cbpet.co');

-- Performer 3 -> Team 3
UPDATE public.profiles 
SET role = 'performer', 
    team_id = (SELECT id FROM teams WHERE name = 'Team 3 (T3)')
WHERE id IN (SELECT id FROM auth.users WHERE email = 'performer3@cbpet.co');

-- Performer 4 -> Team 4
UPDATE public.profiles 
SET role = 'performer', 
    team_id = (SELECT id FROM teams WHERE name = 'Team 4 (T4)')
WHERE id IN (SELECT id FROM auth.users WHERE email = 'performer4@cbpet.co');

-- ==========================================
-- 7. UPDATE TEAM MANAGERS
-- ==========================================
-- Set team managers to their respective team leads
UPDATE public.teams 
SET manager_id = (SELECT id FROM auth.users WHERE email = 'sumitha@cbpet.co')
WHERE name = 'Team 1 (T1)';

UPDATE public.teams 
SET manager_id = (SELECT id FROM auth.users WHERE email = 'farzana@cbpet.co')
WHERE name = 'Team 2 (T2)';

UPDATE public.teams 
SET manager_id = (SELECT id FROM auth.users WHERE email = 'laskhmi@cbpet.co')
WHERE name = 'Team 3 (T3)';

UPDATE public.teams 
SET manager_id = (SELECT id FROM auth.users WHERE email = 'harish@cbpet.co')
WHERE name = 'Team 4 (T4)';

-- ==========================================
-- 8. VERIFICATION QUERIES
-- ==========================================
-- View all users with their roles and teams
SELECT 
  p.performer_name,
  p.role,
  t.name as team_name,
  u.email
FROM public.profiles p
LEFT JOIN public.teams t ON p.team_id = t.id
LEFT JOIN auth.users u ON p.id = u.id
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
