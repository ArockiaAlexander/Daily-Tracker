-- ==========================================
-- Role / RLS Preflight Verification
-- Run after ROLE_RLS_PREFLIGHT.sql
-- ==========================================

-- 1. Active role enum values
select e.enumlabel as role_value
from pg_enum e
join pg_type t on t.oid = e.enumtypid
where t.typname = 'user_role'
order by e.enumsortorder;

-- Expect among others: performer, team_lead, group_lead, manager, general_manager, super_admin
-- Legacy assistant_manager may still exist as an unused enum label (cannot drop easily).

-- 2. No live profiles should still use assistant_manager
select id, performer_name, role::text as role
from public.profiles
where role::text = 'assistant_manager';
-- Expect: 0 rows

-- 3. Role distribution
select role::text as role, count(*) as user_count
from public.profiles
group by role::text
order by user_count desc;

-- 4. division_targets write policy uses manager (not assistant_manager)
select policyname, cmd, qual, with_check
from pg_policies
where schemaname = 'public'
  and tablename = 'division_targets'
  and policyname = 'Allow write access to team_lead and above';
-- Expect: qual/with_check mention 'manager', not only 'assistant_manager'

-- 5. clients manage policy uses manager
select policyname, cmd, qual, with_check
from pg_policies
where schemaname = 'public'
  and tablename = 'clients'
  and policyname = 'clients_manage_gm_am';
-- Expect: 'manager' present; 'assistant_manager' absent

-- 6. get_user_role_level maps manager and group_lead
select
  public.get_user_role_level(id) as level,
  role::text as role,
  count(*) as users
from public.profiles
group by role::text, public.get_user_role_level(id)
order by level desc;
-- Expect: manager → 4, group_lead → 3 (when those roles exist)

-- 7. Sanity: managers exist and can be targeted by policies
select count(*) as manager_count
from public.profiles
where role::text = 'manager';
