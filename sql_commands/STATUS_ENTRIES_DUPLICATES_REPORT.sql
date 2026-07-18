-- ==========================================
-- Status entries duplicate report (read-only)
-- Do NOT add a unique index until these are cleaned.
-- Duplicate key: date + user_id + "titleName" + "taskType"
-- ==========================================

select
  date,
  user_id,
  "titleName" as title_name,
  "taskType" as task_type,
  count(*) as duplicate_count,
  array_agg(id order by created_at) as entry_ids
from public.status_entries
group by date, user_id, "titleName", "taskType"
having count(*) > 1
order by duplicate_count desc, date desc;
