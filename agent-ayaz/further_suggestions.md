# CBPET Enterprise Migration - Further Suggestions

## 1. Recommended Implementation Order

The safest order is:

1. Add database migrations.
2. Add service-layer helpers.
3. Add isolated UI modules.
4. Add routing/navigation.
5. Add dashboards.
6. Add audit and notification integrations.
7. Add feature flags and rollout controls.

Avoid starting with UI only. The enterprise features depend heavily on permissions, auditability, and reliable data contracts.

## 2. Keep Phases Independently Deployable

Each level should be deployable without requiring the next level:

- Level 1 works without notifications.
- Level 2 works even if email is disabled.
- Level 3 works even if super admin governance is disabled.

Use feature flags for all new modules:

```text
VITE_ENABLE_PIPELINE_TRAIN
VITE_ENABLE_NOTIFICATIONS
VITE_ENABLE_NOTIFICATION_EMAIL
VITE_ENABLE_PIPELINE_REMINDERS
VITE_ENABLE_BEHAVIOUR_ANALYTICS
VITE_ENABLE_FEEDBACK_MODULE
VITE_ENABLE_SUPER_ADMIN_GOVERNANCE
VITE_ENABLE_ENTRY_DUPLICATE_GUARD
```

## 3. Strengthen The Service Layer

The current app has many direct Supabase calls in components. For enterprise scale, gradually move new module logic into service files:

- Ticket service.
- Notification service.
- Analytics service.
- Feedback service.
- Permission helpers.

Do not refactor all existing code at once. Start with new modules, then migrate old code only when touched for a real feature.

## 4. Centralize Role Permissions

Create shared role helpers:

```text
src/lib/permissions.js
```

Suggested functions:

- `isAdminRole(role)`
- `isManagerRole(role)`
- `isLeadRole(role)`
- `canManageUsers(role)`
- `canViewAllAnalytics(role)`
- `canManagePipeline(role)`
- `canClosePipelineTicket(role)`
- `canViewFeedback(role)`

This reduces drift between App, Analytics, Pipeline, Notifications, and SQL policy assumptions.

## 5. Normalize Role Naming

Documentation and SQL mention both `manager` and `assistant_manager` in places. Before adding many new policies, confirm the live enum values.

Recommendation:

- Use `manager` in the UI and new SQL policies if it is live.
- Keep compatibility checks for `assistant_manager` only if old production databases still use it.
- Add a small verification SQL script before enterprise migrations.

## 6. Normalize FP Validation And FL Validation

Current docs mention a known mismatch:

- Entry Form uses `FP Validation`.
- Some analytics maps include `FL Validation`.

Recommendation:

- Pick one canonical value.
- Prefer `FP Validation` if that is what users currently enter.
- Add compatibility mapping in analytics until old data is cleaned.
- Avoid adding new enterprise analytics on top of inconsistent task labels.

## 7. Add Migration Verification Scripts

For each major migration, add a companion verification script:

```text
PIPELINE_TRAIN_PHASE1_VERIFY.sql
ENTERPRISE_NOTIFICATIONS_PHASE2_VERIFY.sql
ENTERPRISE_ANALYTICS_PHASE3_VERIFY.sql
```

Each script should check:

- Tables exist.
- RLS is enabled.
- Important policies exist.
- Indexes exist.
- Storage bucket exists where applicable.
- Current role enum values are compatible.

## 8. Avoid Destructive Production SQL

Continue the existing project rule:

- Do not rerun fresh setup on production.
- Do not drop production tables.
- Do not rewrite old rows unless a tested backfill exists.
- Prefer `add column if not exists`.
- Add constraints only after checking existing data.

For duplicate Daily Entry prevention, do not add a unique index until existing duplicates are identified.

## 9. Improve Auditability Early

Audit logs should be introduced before high-power admin controls.

Minimum audit events:

- Ticket created.
- Status changed.
- Priority changed.
- Assignment changed.
- Remark added.
- Screenshot uploaded.
- Ticket closed.
- Super admin override.
- Feedback created/edited.
- Duplicate entry override, if allowed later.

Audit logs should include:

- Actor.
- Actor role.
- Entity.
- Old value.
- New value.
- Reason.
- Timestamp.

## 10. Use Soft Delete For Enterprise Records

Avoid hard deletion for:

- Pipeline tickets.
- Feedback records.
- Notifications with audit value.
- Governance records.

Recommended pattern:

- `archived_at`
- `archived_by`
- `archive_reason`

Hard delete should be limited to accidental test data in non-production environments.

## 11. Add Pagination Before Data Grows

Pipeline tickets, notifications, and analytics snapshots can grow quickly.

Recommended defaults:

- Ticket list page size: 25 or 50.
- Notification drawer: latest 20.
- Notification center: paginated 50.
- Audit timeline: latest 100 with load more.

Avoid loading all enterprise data into React once volume grows.

## 12. Prepare For Mobile Without Building Mobile Yet

Design service APIs and data shapes so a future mobile app can reuse them.

Recommendations:

- Keep module services separate from React components.
- Avoid UI-only field names in database tables.
- Use stable status/category/priority values.
- Keep audit/event records machine-readable.
- Prefer explicit `module` and `reference_id` fields for cross-module links.

## 13. Use Edge Functions For Trusted System Work

Good Edge Function candidates:

- Reminder engine.
- Email notification dispatch.
- Behaviour snapshot calculation.
- Weekly/monthly analytics rollups.
- Admin-only bulk operations.

Avoid performing trusted cross-user operations entirely from the browser.

## 14. Add Basic Realtime Later, Not First

Realtime notifications and ticket updates are useful, but not required for the first enterprise rollout.

Recommended sequence:

1. Build stable polling/refresh.
2. Add unread count refresh after actions.
3. Add Supabase realtime only after RLS and volume are stable.

## 15. UX Suggestions

Smart Request Hub:

- Keep creation form short.
- Put advanced metadata behind a collapsible panel.
- Show ticket number immediately after creation.
- Use status badges with consistent colors.
- Keep workflow actions near the ticket detail header.
- Show audit timeline in chronological or reverse chronological order with filters.

Notifications:

- Keep bell drawer compact.
- Avoid showing every low-value event as a toast.
- Reserve system alerts for action-required or critical events.

Analytics:

- Use filters consistently across Analytics, Pipeline, and Behaviour Intelligence.
- Add export later for enterprise analytics after the metrics stabilize.

## 16. Security Suggestions

Important checks:

- Performers cannot view other performers' tickets unless assigned.
- Leads cannot view outside their team/client/sub-division.
- Managers cannot perform super admin governance actions.
- Users cannot forge `created_by`, `created_role`, or audit actor fields from the UI.
- Storage paths should not expose private data.
- Screenshot reads must follow ticket visibility.

Prefer RLS as the primary protection and frontend checks as UX convenience.

## 17. Performance Suggestions

Add indexes before production usage:

- Ticket status.
- Ticket assignee.
- Ticket creator.
- Ticket client.
- Ticket created date.
- Notification receiver/read/date.
- Audit entity/date.
- Behaviour snapshot user/period.

For analytics:

- Use snapshots for older date ranges.
- Calculate current short ranges live only while data volume is small.

## 18. Documentation Suggestions

After implementation, update:

- `README.md` with new module summary.
- `Skills.md` with new skills:
  - Raise Pipeline Ticket.
  - Review Pipeline Ticket.
  - Receive Notifications.
  - Review Behaviour Analytics.
  - Manage Feedback.
- `dev_remark.md` with migration order and production cautions.
- `test_use_case.md` with manual enterprise scenarios.

## 19. Risk Register

| Risk | Impact | Mitigation |
| --- | --- | --- |
| RLS too permissive | Data leakage | Verify with test users per role |
| RLS too restrictive | Broken workflows | Add role-based SQL smoke tests |
| Screenshot uploads fail | Ticket evidence missing | Validate bucket, path, and policies before rollout |
| Notification spam | Users ignore alerts | Deduplicate reminders and limit toast usage |
| Analytics score disputed | Low trust | Publish scoring formula and keep audit/source data visible |
| Duplicate entry constraint breaks old data | Production insert failures | Detect and clean duplicates before adding unique index |
| Direct component Supabase calls grow messy | Hard maintenance | Put new enterprise logic in services |

## 20. Suggested Milestones

Milestone 1:

- Pipeline migration.
- Ticket create/list/detail.
- Screenshot upload.
- Basic role visibility.

Milestone 2:

- Pipeline workflow actions.
- Audit timeline.
- Pipeline dashboard.
- Production feature flag rollout.

Milestone 3:

- Notification database.
- Notification provider, bell, drawer.
- Pipeline notification integration.

Milestone 4:

- Reminder engine.
- Optional email.
- Notification center.

Milestone 5:

- Behaviour analytics snapshots.
- Manager dashboard.
- Feedback module.

Milestone 6:

- Super admin governance.
- Heatmaps and leaderboards.
- Duplicate entry database guard after cleanup.

