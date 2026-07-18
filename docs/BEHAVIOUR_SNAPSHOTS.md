# Behaviour snapshot calculation

## Edge Function

`supabase/functions/calculate-behaviour-snapshots`

- Upserts global `user_behaviour_snapshots` rows (one per active user / period)
- Default period: current **weekly** (Monday–Sunday UTC); pass `period_type: "monthly"` for month
- Late entries use UTC hour >= 20 (document timezone when aligning with live client calc)
- Requires Phase 3 SQL (`ENTERPRISE_ANALYTICS_PHASE3.sql`)

## Prerequisites

1. `ROLE_RLS_PREFLIGHT.sql`
2. `SMART_REQUEST_HUB_PHASE1.sql` (optional for Request Hub metrics elsewhere)
3. `ENTERPRISE_ANALYTICS_PHASE3.sql`
4. Deploy this function with service role

## Cron

Same pattern as [WEEKLY_PERFORMANCE_REPORTS.md](WEEKLY_PERFORMANCE_REPORTS.md) / [REQUEST_HUB_REMINDERS.md](REQUEST_HUB_REMINDERS.md):

```sql
select cron.schedule(
  'behaviour-snapshots-weekly',
  '15 1 * * 1',
  $$
  select net.http_post(
    url := 'https://YOUR_PROJECT.supabase.co/functions/v1/calculate-behaviour-snapshots',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true),
      'Content-Type', 'application/json'
    ),
    body := '{"period_type":"weekly"}'::jsonb
  );
  $$
);
```

Enable the Analytics **Behaviour Intelligence** tab with `VITE_ENABLE_BEHAVIOUR_ANALYTICS=true` after verifying snapshots.
