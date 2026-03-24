-- ==========================================
-- CBPET Daily Tracker - Fresh Setup Verification
-- Run this after FRESH_SUPABASE_SETUP.sql
-- ==========================================

-- 1. Confirm core tables exist
select table_name
from information_schema.tables
where table_schema = 'public'
  and table_name in (
    'teams',
    'profiles',
    'workflows',
    'workflow_assignments',
    'status_entries',
    'performance_metrics'
  )
order by table_name;

-- 2. Confirm key views exist
select table_name
from information_schema.views
where table_schema = 'public'
  and table_name in (
    'user_workflow_view',
    'monthly_leaderboard',
    'quarterly_leaderboard',
    'yearly_leaderboard',
    'team_performance'
  )
order by table_name;

-- 3. Confirm important columns
select table_name, column_name, data_type, is_nullable
from information_schema.columns
where table_schema = 'public'
  and (
    (table_name = 'profiles' and column_name in ('email', 'performer_name', 'role', 'team_id', 'client_id'))
    or (table_name = 'status_entries' and column_name in ('workflow_id', 'client_id', 'date'))
    or (table_name = 'workflow_assignments' and column_name in ('user_id', 'workflow_id'))
  )
order by table_name, column_name;

-- 4. Confirm RLS is enabled
select schemaname, tablename, rowsecurity
from pg_tables
where schemaname = 'public'
  and tablename in (
    'teams',
    'profiles',
    'workflows',
    'workflow_assignments',
    'status_entries',
    'performance_metrics'
  )
order by tablename;

-- 5. Confirm policies exist
select tablename, policyname, cmd
from pg_policies
where schemaname = 'public'
  and tablename in (
    'teams',
    'profiles',
    'workflows',
    'workflow_assignments',
    'status_entries',
    'performance_metrics'
  )
order by tablename, policyname;

-- 6. Confirm triggers exist
select event_object_table as table_name, trigger_name, event_manipulation
from information_schema.triggers
where trigger_schema = 'public'
  and event_object_table in ('teams', 'profiles', 'workflows', 'status_entries', 'performance_metrics')
order by event_object_table, trigger_name;

-- 7. Confirm functions exist
select routine_name
from information_schema.routines
where routine_schema = 'public'
  and routine_name in (
    'set_updated_at',
    'handle_new_user',
    'sync_profile_email',
    'refresh_performance_metrics_for_user',
    'refresh_performance_metrics_for_entry'
  )
order by routine_name;

-- 8. Inspect auth/profile sync after at least one signup
select
  p.id,
  p.email,
  p.performer_name,
  p.role,
  p.team_id,
  p.client_id,
  p.created_at
from public.profiles p
order by p.created_at desc
limit 20;

-- 9. Promote your first admin after signup
-- run after these users sign up
-- update public.profiles
-- set role = case
--   when email = 'ayaz@company.io' then 'super_admin'::public.user_role
--   when email = 'alex@newgen.co' then 'general_manager'::public.user_role
--   else role
-- end
-- where email in ('ayaz@company.io', 'alex@newgen.co');

-- 10. Quick health counts
select
  (select count(*) from public.profiles) as profiles_count,
  (select count(*) from public.teams) as teams_count,
  (select count(*) from public.workflows) as workflows_count,
  (select count(*) from public.status_entries) as status_entries_count,
  (select count(*) from public.performance_metrics) as performance_metrics_count;
