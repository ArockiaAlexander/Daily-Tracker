-- ==========================================
-- Enterprise Analytics Phase 3 — Verification
-- ==========================================

select table_name
from information_schema.tables
where table_schema = 'public'
  and table_name in (
    'user_behaviour_snapshots',
    'feedback_records',
    'enterprise_audit_log'
  )
order by table_name;

select column_name, data_type
from information_schema.columns
where table_schema = 'public'
  and table_name = 'status_entries'
  and column_name in ('created_at', 'batch_number')
order by column_name;

select indexname
from pg_indexes
where schemaname = 'public'
  and indexname = 'idx_user_behaviour_snapshots_user_period';

select tablename, rowsecurity
from pg_tables
where schemaname = 'public'
  and tablename in (
    'user_behaviour_snapshots',
    'feedback_records',
    'enterprise_audit_log'
  )
order by tablename;

select tablename, policyname, cmd
from pg_policies
where schemaname = 'public'
  and tablename in (
    'user_behaviour_snapshots',
    'feedback_records',
    'enterprise_audit_log'
  )
order by tablename, policyname;
