-- ==========================================
-- Sync email_confirmed_at onto profiles
-- for User Management verified badges
-- ==========================================

begin;

alter table public.profiles
  add column if not exists email_confirmed_at timestamptz;

create or replace function public.sync_profile_email_confirmed()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles
  set
    email = coalesce(new.email, public.profiles.email),
    email_confirmed_at = new.email_confirmed_at,
    updated_at = now()
  where id = new.id;

  return new;
end;
$$;

drop trigger if exists on_auth_user_email_confirmed on auth.users;
create trigger on_auth_user_email_confirmed
after insert or update of email, email_confirmed_at on auth.users
for each row
execute function public.sync_profile_email_confirmed();

-- Backfill from auth.users
update public.profiles p
set
  email_confirmed_at = u.email_confirmed_at,
  email = coalesce(p.email, u.email),
  updated_at = now()
from auth.users u
where u.id = p.id;

commit;
