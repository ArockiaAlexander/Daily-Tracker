# Weekly Performance Reports

Automated Monday–Sunday division reports emailed to group leads (managers CC’d), with an authenticated deep link into the Performance Rating charts.

## Score model

- Standard tasks: `60% × capped target achievement + 40% × capped time efficiency` (cap 100)
- Miscellaneous: `(takenHours / 8) × 100` (cap 100)
- Aggregates are taken-hour weighted
- Bands: Excellent ≥90, Good ≥75, Needs Improvement &lt;75

## Prerequisites

1. Run SQL migration: [`sql_commands/WEEKLY_REPORT_DELIVERIES.sql`](../sql_commands/WEEKLY_REPORT_DELIVERIES.sql)
2. Deploy the Edge Function:

```bash
supabase functions deploy weekly-performance-report
```

3. Set secrets (Supabase Dashboard → Edge Functions → Secrets, or CLI):

| Secret | Purpose |
|--------|---------|
| `RESEND_API_KEY` | Resend API key |
| `REPORT_FROM_EMAIL` | Verified sender, e.g. `CBPET Reports <reports@yourdomain.com>` |
| `APP_URL` | App root, e.g. `https://arockiaalexander.github.io/Daily-Tracker` |
| `SUPABASE_SERVICE_ROLE_KEY` | Usually injected automatically |

`SUPABASE_URL` is provided by the platform.

## Recipients

- **To:** `group_lead` profiles whose `client_id` + `sub_division` match the report partition
- **Cc:** all active `manager` and `general_manager` emails
- If no group lead is mapped for a division, managers receive the report as To

Division = `client_id` + `sub_division` (missing sub-division treated as `General`).

## Deep link

Emails include a link like:

```text
{APP_URL}/#analytics?tab=ratings&period=weekly&client=OUP&division=PreEdit&start=2026-07-06&end=2026-07-12&groupBy=individual
```

Recipients must sign in. RLS still limits what each user can see.

## Schedule (Supabase Cron)

Example: every Monday 08:00 UTC

```sql
select cron.schedule(
  'weekly-performance-report',
  '0 8 * * 1',
  $$
  select net.http_post(
    url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/weekly-performance-report',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
    ),
    body := '{}'::jsonb
  );
  $$
);
```

Prefer storing the service role in Vault and referencing it from cron, rather than hard-coding.

## Manual invoke

```bash
curl -X POST \
  "https://YOUR_PROJECT_REF.supabase.co/functions/v1/weekly-performance-report" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json"
```

## Idempotency

`weekly_report_deliveries` is unique on `(week_start, client_id, sub_division)`. Re-runs skip divisions already marked `sent`.

## Isolation note

The function uses the service role and **must** keep queries week-scoped and partition results by client + sub-division before emailing. Do not send cross-division detail to a group lead.
