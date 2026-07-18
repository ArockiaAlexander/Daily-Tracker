# CBPET Enterprise Migration - Level 3 Plan

## Enterprise Analytics, Behaviour Intelligence, Governance, And Feedback

### 1. Purpose

Level 3 adds the enterprise intelligence layer on top of Daily Tracker, Smart Request Hub, and Notifications. It helps managers, general managers, and super admins understand user behaviour, entry consistency, request contribution, resolution performance, team health, feedback, and governance activity.

Primary outcomes:

- Behaviour scores are calculated per user, team, division, and client.
- Missed entries, late entries, inconsistency, and delayed work become visible.
- Smart Request Hub contribution and resolution behaviour can be measured.
- Managers get focused review dashboards.
- Super admins get audited governance controls.
- Managers and general managers can record internal and external feedback.

**Naming rule:** **Behaviour Score** (this module) is not the same as existing Analytics **Performance Rating** / productivity score. Keep UI labels, routes, and docs distinct. Completion may *reuse* the productivity formula as one component — it must not replace or overwrite the Performance Rating tab.

### 2. Scope

In scope:

- Behaviour analytics module.
- Behaviour score from 0 to 100.
- Entry consistency metrics.
- Smart Request Hub request behaviour metrics.
- Leaderboards (Request Hub contribution — not a remount of orphan `Leaderboard.jsx` unless explicitly redesigned).
- Heatmaps.
- Manager dashboard.
- Super admin governance controls (uses Level 1 soft-archive columns).
- Feedback module.
- Duplicate Daily Entry prevention plan.
- Batch number on Entry Form.
- Audit logging for administrative actions.

Out of scope:

- AI suggestions.
- Reward/Penalty Engine.
- Automatic score deductions from feedback.
- Recognition system.
- Mobile application.
- HR or payroll automation.

**Depends on:** Level 1 Request Hub (+ soft-archive columns). Level 2 notifications optional but recommended for escalation visibility. Role/RLS preflight already applied. **FP Validation** canonicalized before scoring (see §4.1).

### 3. Database Migration

Create one incremental migration:

```text
sql_commands/ENTERPRISE_ANALYTICS_PHASE3.sql
```

Companion verify:

```text
sql_commands/ENTERPRISE_ANALYTICS_PHASE3_VERIFY.sql
```

#### 3.1 Table: user_behaviour_snapshots

Purpose: stores calculated behaviour metrics by period.

```sql
create table if not exists public.user_behaviour_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  period_type text not null,
  period_start date not null,
  period_end date not null,
  client_id text,
  client_ref uuid references public.clients(id) on delete set null,
  sub_division text,
  team_id uuid,
  daily_entry_percent numeric default 0,
  weekly_entry_percent numeric default 0,
  bi_weekly_entry_percent numeric default 0,
  monthly_entry_percent numeric default 0,
  missed_entries integer default 0,
  late_entries integer default 0,
  average_fill_time_minutes numeric default 0,
  entry_consistency numeric default 0,
  attendance_score numeric default 0,
  consistency_score numeric default 0,
  timeliness_score numeric default 0,
  completion_score numeric default 0,
  accuracy_score numeric default 0,
  overall_score numeric default 0,
  metadata jsonb not null default '{}'::jsonb,
  calculated_at timestamptz not null default now(),
  constraint user_behaviour_period_type_check
    check (period_type in ('daily', 'weekly', 'bi_weekly', 'monthly', 'quarterly', 'yearly'))
);
```

Uniqueness:

- Default unique key for global (no client) snapshots:

```sql
create unique index if not exists idx_user_behaviour_snapshots_user_period
on public.user_behaviour_snapshots (
  user_id, period_type, period_start, period_end
)
where client_id is null and team_id is null;
```

- If multi-client or per-team snapshots are required, use a separate unique index that includes `client_id` / `team_id` (or store scope only in `metadata` and keep one row per user/period). Do **not** assume a single `unique(user_id, period_type, period_start, period_end)` covering all scoped rows without deciding the product rule first.

Period types: `daily`, `weekly`, `bi_weekly`, `monthly`, `quarterly`, `yearly`.

#### 3.2 Table: feedback_records

Purpose: manager and general manager feedback.

```sql
create table if not exists public.feedback_records (
  id uuid primary key default gen_random_uuid(),
  feedback_type text not null,
  project_name text,
  task_type text,
  performer_id uuid references auth.users(id) on delete set null,
  feedback_date date not null default current_date,
  client_id text,
  sub_division text,
  title text not null,
  description text not null,
  severity text not null default 'Normal',
  created_by uuid not null references auth.users(id) on delete cascade,
  created_role text,
  created_date timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  archived_by uuid references auth.users(id) on delete set null,
  archive_reason text,
  constraint feedback_type_check
    check (feedback_type in ('Internal', 'External')),
  constraint feedback_severity_check
    check (severity in ('Low', 'Normal', 'High', 'Critical'))
);
```

#### 3.3 Table: enterprise_audit_log

Purpose: governance audit across modules.

```sql
create table if not exists public.enterprise_audit_log (
  id uuid primary key default gen_random_uuid(),
  module text not null,
  entity_type text not null,
  entity_id uuid,
  actor_id uuid references auth.users(id) on delete set null,
  actor_role text,
  action text not null,
  old_values jsonb,
  new_values jsonb,
  reason text,
  created_date timestamptz not null default now()
);
```

Use for:

- Smart Request Hub status overrides.
- Transfer ownership.
- Edit priority.
- Edit history.
- Merge tickets.
- Archive tickets / restore tickets (Level 1 columns).
- Feedback edits.
- Manual score recalculation.
- Duplicate entry override, if allowed later.

Do not conflate this with `weekly_report_deliveries` (email delivery audit only).

### 4. Behaviour Metrics

#### 4.1 Prerequisite: task label canon

Before expanding behaviour analytics:

- Canonical Entry Form value: **`FP Validation`**.
- [`DivisionTargetsManager.jsx`](../src/components/DivisionTargetsManager.jsx) still defaults / offers `FL Validation` in places.
- Analytics maps in Dashboard / `targetUtils` currently include both.

Actions:

1. Prefer `FP Validation` for new targets and UI.
2. Keep a compatibility alias so historical `FL Validation` rows still aggregate under FP until data is cleaned.
3. Do not build new enterprise scores on both labels as if they were different tasks.

#### 4.2 Metrics

Calculate:

- Daily Entry Percentage.
- Weekly Entry Percentage.
- Bi Weekly Entry Percentage.
- Monthly Entry Percentage.
- Missed Entries.
- Late Entries.
- Average Fill Time.
- Entry Consistency.
- Behaviour Score.

Recommended definitions:

| Metric | Definition |
| --- | --- |
| Daily Entry Percent | Actual submitted workdays divided by expected workdays |
| Weekly Percent | Weeks with required entries divided by total weeks |
| Bi Weekly Percent | Two-week periods with expected entry coverage |
| Monthly Percent | Submitted workdays divided by expected workdays in month |
| Missed Entries | Expected workdays without entries (by work `date`) |
| Late Entries | Entries where **submission** `created_at` is after the configured cutoff on the work day (or next calendar rules as defined) |
| Average Fill Time | Average minutes between expected time and submission `created_at`, if available |
| Entry Consistency | Stability of entry habit across selected period |

#### 4.3 `status_entries.created_at`

Fresh / auth setup scripts already define `created_at timestamptz default now()` on `status_entries`. The React app does not currently use it for late detection.

**Do not** unconditionally `add column created_at`. In the Phase 3 migration:

```sql
-- Verify-then-add only
alter table public.status_entries
add column if not exists created_at timestamptz default now();
```

Document the semantic split:

- `date` — work day the entry belongs to.
- `created_at` — when the row was submitted (use for late / fill-time metrics).

Note: `status_entries.id` is a bigint (`Date.now()` style in the app), not a uuid — metrics joins must not assume uuid PKs.

Quoted camelCase columns (`"taskType"`, `"performerName"`, etc.) must be used correctly in SQL.

### 5. Behaviour Score Formula

Overall score:

```text
0 to 100
```

Recommended formula:

```text
Overall =
  Attendance Score * 0.25
  + Consistency Score * 0.25
  + Timeliness Score * 0.20
  + Completion Score * 0.20
  + Accuracy Score * 0.10
```

Component definitions:

- Attendance: expected entries submitted.
- Consistency: stable entry pattern across working days.
- Timeliness: entries submitted before cutoff (via `created_at`).
- Completion: productivity achievement from existing **Performance Rating** / target-achieved logic (`src/lib/performanceRating.js`, division targets). Reuse the formula; do not replace the Performance Rating UI.
- Accuracy: fewer rejected feedback records and fewer reopened requests (after reopen exists).

Defaults:

- Working days are Monday to Friday.
- Late cutoff is 8:00 PM local time (define timezone source explicitly at implementation).
- Holidays are excluded only after a holiday calendar exists.
- Miscellaneous entries count for attendance but not productivity completion (aligns with existing App / weekly report practice).

UI labels must say **Behaviour Score** / **Behaviour Intelligence**, never reuse “Performance Rating” for this module.

### 6. Smart Request Hub Behaviour Metrics

Track:

- Bugs raised.
- Improvements raised.
- Feature updates raised.
- Enhancements raised.
- Average resolution time.
- Reopened percentage, after reopen exists.
- Rejected request percentage.
- Requests resolved by user.
- Delayed assigned requests.

Use `request_hub_tickets` and `request_hub_events` from Level 1 (`client_id` / `client_ref` for scoping).

### 7. Leaderboards

Leaderboards:

- Top Bug Reporter.
- Feature Contributor.
- Improvement Contributor.
- Fast Resolver.
- Most Active Team.

Rules:

- Filter by date range, client, division, and team.
- Exclude rejected requests from positive contribution counts by default.
- Apply a minimum activity threshold so one request does not unfairly rank a user.
- Implement under `src/components/enterpriseAnalytics/Leaderboards.jsx` — do not blindly mount orphan `src/components/Leaderboard.jsx`.

### 8. Heatmaps

Periods: Weekly, Monthly, Quarterly, Yearly.

Dimensions: User, Team, Client, Sub-division, Task type, Request category.

Heatmaps should reveal missed entries, late entries, request delays, low consistency, and review bottlenecks.

### 9. Manager Dashboard

Manager dashboard shows:

- Inactive users.
- Pending reviews.
- Delayed Smart Request Hub tickets.
- Average completion (productivity component — labelled clearly).
- Team health score.
- Users with missed entries.
- Users with repeated late entries.
- Users with unresolved assigned requests.

Team Health Score:

```text
Team Health =
  Average Behaviour Score * 0.50
  + Request Resolution Health * 0.25
  + Entry Coverage * 0.25
```

Filters: Date range, Client, Sub-division, Team, Performer — keep consistent with Analytics and Request Hub filters.

### 10. Super Admin Governance

Super admin can:

- Modify any Smart Request Hub ticket.
- Override status.
- Transfer ownership.
- Edit priority.
- Edit history.
- Merge tickets.
- Archive tickets / restore tickets (set/clear `archived_at`, `archived_by`, `archive_reason` from Level 1).

Rules:

- Every governance action writes to `enterprise_audit_log`.
- Archive instead of hard delete.
- Merge preserves both histories.
- Restore records actor and reason.
- Override requires reason text.
- Feature-flagged until audit logging is verified.

### 11. Feedback Module

Visible to:

- `manager`
- `general_manager`
- `super_admin`

Feedback types: Internal, External.

Search filters: Project Name, Task Type, Performer, Date, Client, Sub-division, Feedback Type.

Behaviour: create, view history, edit if role permits, audit edits, soft-archive preferred over hard delete. Keep future-ready link to score deduction (out of scope to automate).

### 12. Entry Form Enhancements

#### 12.1 Duplicate Entry Prevention

Rule: prevent duplicate for same date + user + project name + task type.

User message:

```text
Already Submitted. Edit Existing?
```

Safe rollout:

1. Add frontend warning.
2. Add SQL duplicate report.
3. Clean or archive existing duplicates.
4. Add unique database guard only after cleanup.

#### 12.2 Batch Number

Add a dropdown below Project Name: Batch 1 … Batch 25.

```sql
alter table public.status_entries
add column if not exists batch_number integer;

alter table public.status_entries
add constraint status_entries_batch_number_check
check (batch_number is null or (batch_number between 1 and 25));
```

Default: optional unless business later makes it mandatory. `batch_number` does not exist today — this alter is correct.

### 13. Analytics Processing

Recommended approach:

- Live client-side calculations only for small current-period views.
- Use `user_behaviour_snapshots` for larger or historical analytics.
- Scheduled Edge Function for weekly/monthly snapshot calculation:

```text
supabase/functions/calculate-behaviour-snapshots
```

Follow `weekly-performance-report` + cron doc patterns for scheduling. Service role for upserts.

### 14. React Module Structure

Recommended files:

```text
src/components/enterpriseAnalytics/EnterpriseAnalytics.jsx
src/components/enterpriseAnalytics/BehaviourDashboard.jsx
src/components/enterpriseAnalytics/ManagerDashboard.jsx
src/components/enterpriseAnalytics/SuperAdminGovernance.jsx
src/components/enterpriseAnalytics/FeedbackModule.jsx
src/components/enterpriseAnalytics/Leaderboards.jsx
src/components/enterpriseAnalytics/HeatmapPanel.jsx
src/lib/enterpriseAnalytics/behaviourScore.js
src/lib/enterpriseAnalytics/analyticsService.js
src/lib/enterpriseAnalytics/feedbackService.js
src/lib/enterpriseAnalytics/governanceService.js
```

Recommended placement:

- Add inside Analytics as a new sub-tab named **Behaviour Intelligence**.
- Keep main navigation simple unless the module becomes a separate executive workspace later.
- Do not confuse with existing Performance Rating / Trends / Overview tabs.

### 15. Feature Flags

Add:

```text
VITE_ENABLE_BEHAVIOUR_ANALYTICS
VITE_ENABLE_FEEDBACK_MODULE
VITE_ENABLE_SUPER_ADMIN_GOVERNANCE
VITE_ENABLE_ENTRY_DUPLICATE_GUARD
```

Defaults (Vite build-time; document in `.env.example`):

- Behaviour analytics disabled until migration is applied (or enabled only for admins in staging).
- Feedback disabled until RLS is verified.
- Super admin governance disabled until audit logging is verified.
- Duplicate guard can be frontend-first before database constraint.
- Check with `import.meta.env.VITE_ENABLE_X !== 'false'` when default-on; use explicit `=== 'true'` when default-off.

### 16. Deployment

Recommended order:

1. Canonize FP Validation / FL alias in targets + analytics maps (or accept documented alias).
2. Apply `ENTERPRISE_ANALYTICS_PHASE3.sql` in staging (verify-then-add `created_at`; add `batch_number`).
3. Calculate initial behaviour snapshots.
4. Enable Behaviour Analytics for admins only.
5. Validate manager and lead scoped views.
6. Enable Feedback Module for manager and general manager.
7. Enable duplicate entry frontend warning.
8. Add unique database guard only after duplicate cleanup.
9. Enable Super Admin Governance controls.

Rollback:

- Disable feature flags and rebuild.
- Keep snapshot, feedback, and audit tables.
- Do not drop analytics data.

### 17. Testing

Automated:

- `npm test`
- `npm run build`
- Unit tests for `behaviourScore.js`.

Manual:

- Behaviour score calculates 0 to 100 and is labelled distinctly from Performance Rating.
- Missed entries use work `date`; late entries use submission `created_at`.
- FP / FL historical rows do not double-count.
- Weekly and monthly percentages match sample data.
- Manager sees only scoped users.
- General Manager sees broad business scope.
- Super Admin sees all users.
- Feedback creation works for manager and general manager.
- Performer cannot access feedback module.
- Audit log records super admin override / archive / restore.
- Batch dropdown stores values 1 to 25.
- Duplicate entry warning appears for same date/user/project/task.
- Existing Daily Tracker, Analytics (incl. Performance Rating), Admin, Notifications, and Smart Request Hub still work.

### 18. Acceptance Criteria

Level 3 is complete when:

- Behaviour analytics are available by user, team, division, and client.
- Manager dashboard identifies inactive users, delayed requests, and team health.
- Leaderboards and heatmaps render with scoped data.
- Feedback records can be created and searched by authorized roles.
- Super admin governance actions are audited and soft-archive based.
- Batch number is supported.
- Duplicate entry prevention is safely implemented.
- Behaviour Score remains clearly separate from Performance Rating.
- All new features are flag-controlled and independently deployable.
