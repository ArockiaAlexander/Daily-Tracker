-- ==========================================
-- Enforce Estimated/Taken Hours range: 1–4
-- Safe for existing DBs: new checks are NOT VALID
-- so historical out-of-range rows are preserved,
-- while new inserts/updates must satisfy 1–4.
-- ==========================================

begin;

alter table public.status_entries
  drop constraint if exists status_entries_estimated_time_nonnegative;

alter table public.status_entries
  drop constraint if exists status_entries_taken_time_nonnegative;

alter table public.status_entries
  drop constraint if exists status_entries_estimated_time_range;

alter table public.status_entries
  drop constraint if exists status_entries_taken_time_range;

alter table public.status_entries
  add constraint status_entries_estimated_time_range
  check ("estimatedTime" >= 1 and "estimatedTime" <= 4) not valid;

alter table public.status_entries
  add constraint status_entries_taken_time_range
  check ("takenTime" >= 1 and "takenTime" <= 4) not valid;

commit;
