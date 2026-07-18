# Request Hub 48-hour reminders

## Edge Function

`supabase/functions/request-hub-reminders`

- Finds Smart Request Hub tickets in `Assigned`, `In Progress`, or `Need Information`
- With `archived_at` null and `last_activity_at` older than 48 hours
- Skips tickets that already have a `request_hub_reminder_deliveries` row for `stale_assigned_48h` in the last 24 hours
- Inserts notifications for assignee and scoped leads via service role

## Prerequisites

1. Apply `ROLE_RLS_PREFLIGHT.sql`
2. Apply `SMART_REQUEST_HUB_PHASE1.sql`
3. Apply `ENTERPRISE_NOTIFICATIONS_PHASE2.sql`
4. Deploy `request-hub-reminders` (and `dispatch-notification`) Edge Functions

## Cron (same pattern as weekly performance reports)

See [WEEKLY_PERFORMANCE_REPORTS.md](WEEKLY_PERFORMANCE_REPORTS.md) for `cron.schedule` + `net.http_post` examples.

Suggested schedule: hourly or every 6 hours.

```sql
-- Example only — adjust project URL and service role vault secret
select cron.schedule(
  'request-hub-reminders-hourly',
  '0 * * * *',
  $$
  select net.http_post(
    url := 'https://YOUR_PROJECT.supabase.co/functions/v1/request-hub-reminders',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true),
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  );
  $$
);
```

Feature flag `VITE_ENABLE_REQUEST_HUB_REMINDERS` controls client-side reminder UX hooks only; the scheduled job is independent and should be disabled in Supabase when rolling back.
