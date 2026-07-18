-- ==========================================
-- Role / RLS Preflight (assistant_manager → manager)
-- ==========================================
-- Run BEFORE Smart Request Hub / enterprise migrations.
-- Live UI and invite Edge Function use `manager`.
-- Older policies still check `assistant_manager` and lock out managers.
--
-- Safe for production:
-- - Does not drop tables or enum values
-- - Does not rerun FRESH_SUPABASE_SETUP.sql
-- - Rewrites known stale policies to the active six-role hierarchy
-- ==========================================

begin;

-- 1. Ensure active role values exist on the enum (no-op if already present)
do $$
begin
  if not exists (
    select 1 from pg_enum e
    join pg_type t on t.oid = e.enumtypid
    where t.typname = 'user_role' and e.enumlabel = 'manager'
  ) then
    alter type public.user_role add value 'manager';
  end if;
exception
  when duplicate_object then null;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_enum e
    join pg_type t on t.oid = e.enumtypid
    where t.typname = 'user_role' and e.enumlabel = 'group_lead'
  ) then
    alter type public.user_role add value 'group_lead';
  end if;
exception
  when duplicate_object then null;
end $$;

-- 2. Migrate any remaining profile rows (idempotent)
update public.profiles
set role = 'manager'
where role::text = 'assistant_manager';

-- 3. division_targets write policy: assistant_manager → manager
drop policy if exists "Allow write access to team_lead and above" on public.division_targets;
create policy "Allow write access to team_lead and above"
on public.division_targets
for all
to authenticated
using (
  exists (
    select 1 from public.profiles
    where public.profiles.id = auth.uid()
      and public.profiles.role in (
        'super_admin',
        'general_manager',
        'manager',
        'team_lead',
        'group_lead'
      )
  )
)
with check (
  exists (
    select 1 from public.profiles
    where public.profiles.id = auth.uid()
      and public.profiles.role in (
        'super_admin',
        'general_manager',
        'manager',
        'team_lead',
        'group_lead'
      )
  )
);

-- 4. clients manage policy: assistant_manager → manager
--    Aligns with ClientManagement.jsx (super_admin, general_manager, manager)
drop policy if exists "clients_manage_gm_am" on public.clients;
create policy "clients_manage_gm_am"
on public.clients
for all
to authenticated
using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.role in ('super_admin', 'general_manager', 'manager')
  )
)
with check (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.role in ('super_admin', 'general_manager', 'manager')
  )
);

-- 5. Refresh get_user_role_level if present (stale assistant_manager map)
create or replace function public.get_user_role_level(user_uuid uuid)
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select case (select role::text from public.profiles where id = user_uuid)
    when 'super_admin' then 6
    when 'general_manager' then 5
    when 'manager' then 4
    when 'group_lead' then 3
    when 'team_lead' then 2
    when 'performer' then 1
    when 'assistant_manager' then 4  -- legacy alias only
    else 0
  end;
$$;

commit;
