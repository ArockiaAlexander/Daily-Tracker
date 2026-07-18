-- ==========================================
-- Scope 1–4 hour limits to Miscellaneous only
-- Run this on existing projects that already
-- applied the global HOURS_RANGE_CONSTRAINT.
-- ==========================================

begin;

alter table public.status_entries
  drop constraint if exists status_entries_estimated_time_range;

alter table public.status_entries
  drop constraint if exists status_entries_taken_time_range;

alter table public.status_entries
  drop constraint if exists status_entries_estimated_time_nonnegative;

alter table public.status_entries
  drop constraint if exists status_entries_taken_time_nonnegative;

alter table public.status_entries
  drop constraint if exists status_entries_misc_estimated_time_range;

alter table public.status_entries
  drop constraint if exists status_entries_misc_taken_time_range;

-- All tasks: hours must be non-negative
alter table public.status_entries
  add constraint status_entries_estimated_time_nonnegative
  check ("estimatedTime" >= 0) not valid;

alter table public.status_entries
  add constraint status_entries_taken_time_nonnegative
  check ("takenTime" >= 0) not valid;

-- Miscellaneous only: hours must be between 1 and 4
alter table public.status_entries
  add constraint status_entries_misc_estimated_time_range
  check (
    "taskType" <> 'Miscellaneous'
    or ("estimatedTime" >= 1 and "estimatedTime" <= 4)
  ) not valid;

alter table public.status_entries
  add constraint status_entries_misc_taken_time_range
  check (
    "taskType" <> 'Miscellaneous'
    or ("takenTime" >= 1 and "takenTime" <= 4)
  ) not valid;

commit;
