# CBPET Enterprise Migration - Level 3 Plan

## Enterprise Analytics, Behaviour Intelligence, Governance, And Feedback

### 1. Purpose

Level 3 adds the enterprise intelligence layer on top of Daily Tracker, Smart Request Hub, and Notifications. The goal is to help managers and super admins understand user behaviour, ticket trends, team health, contribution quality, and governance risk.

Primary outcome:

- Behaviour scores are calculated per user, team, division, and client.
- Missed, late, inconsistent, and delayed work patterns become visible.
- Pipeline contribution and resolution behaviour can be measured.
- Managers get a focused dashboard for inactive users, pending reviews, delayed tickets, and team health.
- Super admins get governance controls with required audit logging.
- Feedback records can be added by managers and general managers.

### 2. Scope

In scope:

- New behaviour analytics module.
- Behaviour score 0 to 100.
- Entry consistency metrics.
- Pipeline ticket behaviour metrics.
- Leaderboards.
- Heatmaps.
- Manager dashboard.
- Super admin governance controls.
- Feedback module visible to managers and general managers.
- Duplicate Daily Entry prevention plan.
- Batch number on Entry Form.
- Audit log for administrative ticket actions.

Out of scope:

- AI suggestions beyond placeholder-ready architecture.
- Reward/penalty engine.
- Automatic credit deduction from performer score.
- Recognition system.
- Mobile app implementation.
- Payroll or HR disciplinary automation.

### 3. Analytics Data Model

Create a new incremental migration:

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

Purpose: manager/GM feedback for performance and behaviour review.

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

Use this table for:

- Super admin ticket overrides.
- Transfer ownership.
- Edit priority.
- Edit history.
- Merge tickets.
- Archive tickets.
- Restore tickets.
- Feedback edits.
- Manual score recalculation.

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
| Average Fill Time | Average minutes between expected start and submission time, if available |
| Entry Consistency | Stability of entry habit across selected period |

If existing `status_entries` does not store creation timestamp separately from work date, add a non-destructive `created_at timestamptz default now()` column in the Phase 3 migration or use available timestamps if present in the live database.

### 5. Behaviour Score Formula

Overall score range:

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
- Consistency: regular entry pattern across working days.
- Timeliness: entries submitted before cutoff.
- Completion: productivity achievement from existing performance rating.
- Accuracy: fewer rejected/reworked feedback records and fewer reopened tickets.

Default assumptions:

- Working days are Monday to Friday.
- Late cutoff is configurable, default 8:00 PM local time.
- Holidays are not included until a holiday calendar is added.
- Miscellaneous entries count for attendance but not productivity completion.

### 6. Pipeline Behaviour Metrics

Track:

- Number of bugs raised.
- Number of improvements raised.
- Number of feature requests raised.
- Number of enhancements raised.
- Average resolution time.
- Reopened percentage, once reopen exists.
- Rejected request percentage.
- Tickets resolved by user.
- Tickets delayed by assignee.

Level 3 should reuse `pipeline_tickets` and `pipeline_ticket_events` from Level 1.

### 7. Leaderboards

Leaderboards:

- Top Bug Reporter.
- Feature Contributor.
- Improvement Contributor.
- Fast Resolver.
- Most Active Team.

Rules:

- Leaderboards must be filterable by date range, client, division, and team.
- Exclude rejected tickets from positive contribution counts by default.
- Show a minimum activity threshold to avoid ranking users based on one ticket.

### 8. Heatmaps

Heatmap periods:

- Weekly.
- Monthly.
- Quarterly.
- Yearly.

Heatmap dimensions:

- User.
- Team.
- Client.
- Sub-division.
- Task type.
- Ticket category.

Visual intent:

- Make missed entries, late entries, ticket delays, and low consistency obvious.
- Use existing Chart.js patterns where possible.
- Avoid adding a large visualization dependency unless needed.

### 9. Manager Dashboard

Manager dashboard should show:

- Inactive users.
- Pending reviews.
- Delayed tickets.
- Average completion.
- Team health score.
- Users with missed entries.
- Users with repeated late entries.
- Users with unresolved assigned tickets.

Team Health Score:

```text
Team Health =
  Average Behaviour Score * 0.50
  + Ticket Resolution Health * 0.25
  + Entry Coverage * 0.25
```

Dashboard filters:

- Date range.
- Client.
- Sub-division.
- Team.
- Performer.

### 10. Super Admin Dashboard And Controls

Super admin can:

- Modify any ticket.
- Override status.
- Transfer ownership.
- Edit priority.
- Edit history.
- Merge tickets.
- Archive tickets.
- Restore tickets.

Every control must write to `enterprise_audit_log`.

Recommended rule:

- Destructive-looking operations should be soft actions.
- Archive instead of delete.
- Merge should preserve both ticket histories.
- Restore should record who restored and why.

### 11. Feedback Module

Visible only to:

- General Manager.
- Manager.
- Super Admin, if business permits administrative visibility.

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

- Create feedback record.
- View feedback history.
- Edit feedback if role permits.
- Audit edits.
- Future-ready link to score deduction.

Future phase:

- Automatically deduct credits from performer score.
- Reward/Penalty Engine.
- AI Suggestions.
- Recognition System.

### 12. Entry Form Enhancements

#### 12.1 Duplicate Entry Prevention

Rule:

Do not allow duplicate entry for:

- Same date.
- Same user.
- Same project name.
- Same task type.

User message:

```text
Already Submitted. Edit Existing?
```

Recommended database protection:

Create a unique index on normalized values if live data is clean. If existing duplicates may exist, first create a verification query and cleanup process before adding a unique constraint.

Safer Level 3 rollout:

1. Add duplicate warning in frontend.
2. Add SQL report to find existing duplicates.
3. Clean or archive duplicates.
4. Add unique index.

#### 12.2 Batch Number

Add field below Project Name:

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

UI:

- Dropdown below Project Name.
- Optional unless business decides all project entries require batch.

### 13. Analytics Processing

Recommended approach:

- Start with client-side calculations for MVP-sized data.
- Add materialized snapshots in `user_behaviour_snapshots` for larger datasets.
- Add scheduled Edge Function for weekly/monthly recalculation.

Suggested Edge Function:

```text
supabase/functions/calculate-behaviour-snapshots
```

Inputs:

- Period type.
- Start date.
- End date.
- Optional user/client scope.

Outputs:

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

Navigation:

- Either add as a new Analytics sub-tab named `Behaviour Intelligence`.
- Or add a separate enterprise analytics tab if the product owner wants stronger separation.

Recommended default:

- Add inside Analytics as a new sub-tab to preserve navigation simplicity.

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
- Duplicate guard can be enabled frontend-first before database constraint.

### 16. Deployment Steps

1. Apply Phase 3 migration in staging.
2. Backfill or calculate initial behaviour snapshots.
3. Enable Behaviour Analytics for admins only.
4. Validate manager and lead scoped views.
5. Enable Feedback Module for GM/Manager.
6. Enable duplicate entry frontend warning.
7. After duplicate cleanup, add unique database guard if approved.
8. Enable Super Admin Governance controls.

Rollback:

- Disable feature flags.
- Keep snapshot and feedback tables.
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
- Monthly and weekly percentages match sample data.
- Manager sees only scoped users.
- Super admin sees all users.
- Feedback creation works for manager/GM.
- Performer cannot access feedback module.
- Audit log records super admin override.
- Batch dropdown stores values 1 to 25.
- Duplicate entry warning appears for same date/user/project/task.
- Existing Daily Tracker and Smart Request Hub still work.

### 18. Acceptance Criteria

Level 3 is complete when:

- Behaviour analytics are available by user, team, division, and client.
- Manager dashboard identifies inactive users, delayed tickets, and team health.
- Leaderboards and heatmaps render with scoped data.
- Feedback records can be created and searched by authorized roles.
- Super admin governance actions are audited.
- Batch number is supported.
- Duplicate entry prevention is implemented safely.
- All new modules are feature-flagged and independently deployable.

