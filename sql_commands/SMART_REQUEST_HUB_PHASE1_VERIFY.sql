-- ==========================================
-- Smart Request Hub Phase 1 — Verification
-- Run after SMART_REQUEST_HUB_PHASE1.sql
-- ==========================================

-- 1. Tables exist
select table_name
from information_schema.tables
where table_schema = 'public'
  and table_name in (
    'request_hub_tickets',
    'request_hub_screenshots',
    'request_hub_events'
  )
order by table_name;

-- 2. Key columns on tickets
select column_name, data_type
from information_schema.columns
where table_schema = 'public'
  and table_name = 'request_hub_tickets'
  and column_name in (
    'ticket_number', 'client_id', 'client_ref', 'sub_division',
    'last_activity_at', 'archived_at', 'archived_by', 'archive_reason', 'status'
  )
order by column_name;

-- 3. RLS enabled
select tablename, rowsecurity
from pg_tables
where schemaname = 'public'
  and tablename in (
    'request_hub_tickets',
    'request_hub_screenshots',
    'request_hub_events'
  )
order by tablename;

-- 4. Policies exist
select tablename, policyname, cmd
from pg_policies
where schemaname = 'public'
  and tablename like 'request_hub_%'
order by tablename, policyname;

-- 5. Helpers exist
select routine_name
from information_schema.routines
where routine_schema = 'public'
  and routine_name in (
    'current_user_role',
    'can_view_request_hub_ticket',
    'can_manage_request_hub_ticket'
  )
order by routine_name;

-- 6. Storage bucket
select id, name, public, file_size_limit, allowed_mime_types
from storage.buckets
where id = 'request-hub-screenshots';

-- 7. Storage policies
select policyname, cmd
from pg_policies
where schemaname = 'storage'
  and tablename = 'objects'
  and policyname like 'request_hub_screenshots%'
order by policyname;
