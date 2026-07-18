-- ==========================================
-- Enterprise Notifications Phase 2 — Verification
-- ==========================================

select table_name
from information_schema.tables
where table_schema = 'public'
  and table_name in (
    'notifications',
    'notification_actions',
    'notification_preferences',
    'request_hub_reminder_deliveries'
  )
order by table_name;

select tablename, rowsecurity
from pg_tables
where schemaname = 'public'
  and tablename in (
    'notifications',
    'notification_actions',
    'notification_preferences',
    'request_hub_reminder_deliveries'
  )
order by tablename;

select tablename, policyname, cmd
from pg_policies
where schemaname = 'public'
  and tablename in (
    'notifications',
    'notification_actions',
    'notification_preferences',
    'request_hub_reminder_deliveries'
  )
order by tablename, policyname;

-- Expect: no INSERT policy for authenticated on notifications (service role only)
select policyname, cmd
from pg_policies
where schemaname = 'public'
  and tablename = 'notifications'
  and cmd = 'INSERT';
