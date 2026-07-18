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

### 2. Scope

In scope:

- Behaviour analytics module.
- Behaviour score from 0 to 100.
- Entry consistency metrics.
- Smart Request Hub request behaviour metrics.
- Leaderboards.
- Heatmaps.
- Manager dashboard.
- Super admin governance controls.
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

### 3. Database Migration

Create one incremental migration:

```text
sql_commands/ENTERPRISE_ANALYTICS_PHASE3.sql
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
  client text,
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
  unique(user_id, period_type, period_start, period_end)
);
```

Period types:

- `daily`
- `weekly`
- `bi_weekly`
- `monthly`
- `quarterly`
- `yearly`

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
  client text,
  sub_division text,
  title text not null,
  description text not null,
  severity text not null default 'Normal',
  created_by uuid not null references auth.users(id) on delete cascade,
  created_role text,
  created_date timestamptz not null default now(),
  updated_at timestamptz not null default now(),
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
- Archive tickets.
- Restore tickets.
- Feedback edits.
- Manual score recalculation.
- Duplicate entry override, if allowed later.

### 4. Behaviour Metrics

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
| Missed Entries | Expected workdays without entries |
| Late Entries | Entries submitted after configured cutoff |
| Average Fill Time | Average minutes between expected time and submission time, if available |
| Entry Consistency | Stability of entry habit across selected period |

If `status_entries` does not have a reliable creation timestamp, add:

```sql
alter table public.status_entries
add column if not exists created_at timestamptz default now();
```

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
- Timeliness: entries submitted before cutoff.
- Completion: productivity achievement from existing performance rating.
- Accuracy: fewer rejected feedback records and fewer reopened requests.

Defaults:

- Working days are Monday to Friday.
- Late cutoff is 8:00 PM local time.
- Holidays are excluded only after a holiday calendar exists.
- Miscellaneous entries count for attendance but not productivity completion.

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

Use `request_hub_tickets` and `request_hub_events` from Level 1.

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

### 8. Heatmaps

Periods:

- Weekly.
- Monthly.
- Quarterly.
- Yearly.

Dimensions:

- User.
- Team.
- Client.
- Sub-division.
- Task type.
- Request category.

Heatmaps should reveal:

- Missed entries.
- Late entries.
- Request delays.
- Low consistency.
- Repeated review bottlenecks.

### 9. Manager Dashboard

Manager dashboard shows:

- Inactive users.
- Pending reviews.
- Delayed Smart Request Hub tickets.
- Average completion.
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

Filters:

- Date range.
- Client.
- Sub-division.
- Team.
- Performer.

### 10. Super Admin Governance

Super admin can:

- Modify any Smart Request Hub ticket.
- Override status.
- Transfer ownership.
- Edit priority.
- Edit history.
- Merge tickets.
- Archive tickets.
- Restore tickets.

Rules:

- Every governance action writes to `enterprise_audit_log`.
- Archive instead of hard delete.
- Merge preserves both histories.
- Restore records actor and reason.
- Override requires reason text.

### 11. Feedback Module

Visible to:

- `manager`
- `general_manager`
- `super_admin`

Feedback types:

- Internal.
- External.

Search filters:

- Project Name.
- Task Type.
- Performer.
- Date.
- Client.
- Sub-division.
- Feedback Type.

Behaviour:

- Create feedback.
- View feedback history.
- Edit feedback if role permits.
- Audit edits.
- Keep future-ready link to score deduction.

Future phase:

- Automatic score deduction.
- Reward/Penalty Engine.
- AI Suggestions.
- Recognition System.

### 12. Entry Form Enhancements

#### 12.1 Duplicate Entry Prevention

Rule:

Prevent duplicate entry for:

- Same date.
- Same user.
- Same project name.
- Same task type.

User message:

```text
Already Submitted. Edit Existing?
```

Safe rollout:

1. Add frontend warning.
2. Add SQL duplicate report.
3. Clean or archive existing duplicates.
4. Add unique database guard after cleanup.

#### 12.2 Batch Number

Add a dropdown below Project Name:

```text
Batch 1
Batch 2
...
Batch 25
```

Database change:

```sql
alter table public.status_entries
add column if not exists batch_number integer;

alter table public.status_entries
add constraint status_entries_batch_number_check
check (batch_number is null or (batch_number between 1 and 25));
```

Default:

- Optional field unless business later makes it mandatory.

### 13. Analytics Processing

Recommended approach:

- Use live client-side calculations only for small current-period views.
- Use `user_behaviour_snapshots` for larger or historical analytics.
- Add scheduled Edge Function for weekly/monthly snapshot calculation.

Suggested Edge Function:

```text
supabase/functions/calculate-behaviour-snapshots
```

Inputs:

- Period type.
- Start date.
- End date.
- Optional user/client scope.

Output:

- Upsert rows into `user_behaviour_snapshots`.

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

- Add inside Analytics as a new sub-tab named `Behaviour Intelligence`.
- Keep main navigation simple unless the module becomes a separate executive workspace later.

### 15. Feature Flags

Add:

```text
VITE_ENABLE_BEHAVIOUR_ANALYTICS
VITE_ENABLE_FEEDBACK_MODULE
VITE_ENABLE_SUPER_ADMIN_GOVERNANCE
VITE_ENABLE_ENTRY_DUPLICATE_GUARD
```

Defaults:

- Behaviour analytics disabled until migration is applied.
- Feedback disabled until RLS is verified.
- Super admin governance disabled until audit logging is verified.
- Duplicate guard can be frontend-first before database constraint.

### 16. Deployment

Recommended order:

1. Apply `ENTERPRISE_ANALYTICS_PHASE3.sql` in staging.
2. Calculate initial behaviour snapshots.
3. Enable Behaviour Analytics for admins only.
4. Validate manager and lead scoped views.
5. Enable Feedback Module for manager and general manager.
6. Enable duplicate entry frontend warning.
7. Add unique database guard only after duplicate cleanup.
8. Enable Super Admin Governance controls.

Rollback:

- Disable feature flags.
- Keep snapshot, feedback, and audit tables.
- Do not drop analytics data.

### 17. Testing

Automated:

- `npm test`
- `npm run build`
- Unit tests for `behaviourScore.js`.

Manual:

- Behaviour score calculates 0 to 100.
- Missed entries are detected for expected workdays.
- Late entries are detected using cutoff.
- Weekly and monthly percentages match sample data.
- Manager sees only scoped users.
- General Manager sees broad business scope.
- Super Admin sees all users.
- Feedback creation works for manager and general manager.
- Performer cannot access feedback module.
- Audit log records super admin override.
- Batch dropdown stores values 1 to 25.
- Duplicate entry warning appears for same date/user/project/task.
- Existing Daily Tracker, Analytics, Admin, Notifications, and Smart Request Hub still work.

### 18. Acceptance Criteria

Level 3 is complete when:

- Behaviour analytics are available by user, team, division, and client.
- Manager dashboard identifies inactive users, delayed requests, and team health.
- Leaderboards and heatmaps render with scoped data.
- Feedback records can be created and searched by authorized roles.
- Super admin governance actions are audited.
- Batch number is supported.
- Duplicate entry prevention is safely implemented.
- All new features are flag-controlled and independently deployable.

