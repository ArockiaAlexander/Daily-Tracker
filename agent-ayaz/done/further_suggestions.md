# CBPET Enterprise Migration - Further Suggestions

## 1. Product Naming

Use **Smart Request Hub** as the formal module name.

Recommended usage:

- Full product/module name: **Smart Request Hub**
- Navigation label: **Smart Request Hub**
- Compact label where space is tight: **Request Hub**
- Ticket prefix: `SRH`
- Route: `#request-hub`
- React tab key: `request_hub`
- Database prefix: `request_hub_*`
- Storage bucket: `request-hub-screenshots`

Avoid older internal names in new documentation, code, migrations, and UI labels.

## 2. Active Role Model

Use only the active role hierarchy:

- `performer`
- `team_lead`
- `group_lead`
- `manager`
- `general_manager`
- `super_admin`

Do not introduce other management role names in new migrations or frontend logic.

Recommended management interpretation:

- `manager`: operational management and broad review.
- `general_manager`: higher business-level visibility and approvals.
- `super_admin`: system-wide administration and override authority.

## 3. Recommended Implementation Order

Safest order:

1. Add database migrations.
2. Add RLS policies.
3. Add service-layer helpers.
4. Add isolated UI modules.
5. Add routing/navigation.
6. Add dashboards.
7. Add audit and notification integration.
8. Add feature flags and rollout controls.

Avoid starting with UI only. Enterprise features depend heavily on permissions, auditability, and reliable data contracts.

## 4. Keep Levels Independently Deployable

Each level should work without the next:

- Level 1 Smart Request Hub works without the notification center.
- Level 2 Notifications work even if email is disabled.
- Level 3 Behaviour Analytics works even if governance controls are disabled.

Recommended feature flags:

```text
VITE_ENABLE_SMART_REQUEST_HUB
VITE_ENABLE_NOTIFICATIONS
VITE_ENABLE_NOTIFICATION_EMAIL
VITE_ENABLE_REQUEST_HUB_REMINDERS
VITE_ENABLE_BEHAVIOUR_ANALYTICS
VITE_ENABLE_FEEDBACK_MODULE
VITE_ENABLE_SUPER_ADMIN_GOVERNANCE
VITE_ENABLE_ENTRY_DUPLICATE_GUARD
```

## 5. Strengthen The Service Layer

The current app has direct Supabase calls in several components. For enterprise scale, put new module logic behind service files.

Recommended services:

- `src/lib/requestHub/requestHubService.js`
- `src/lib/requestHub/requestHubWorkflow.js`
- `src/lib/notifications/notificationService.js`
- `src/lib/enterpriseAnalytics/analyticsService.js`
- `src/lib/enterpriseAnalytics/feedbackService.js`
- `src/lib/permissions.js`

Do not refactor all existing code at once. Start with new enterprise modules, then migrate older code only when needed.

## 6. Centralize Permissions

Create shared permission helpers:

```text
src/lib/permissions.js
```

Suggested functions:

- `isLeadRole(role)`
- `isManagerRole(role)`
- `isAdminRole(role)`
- `canManageUsers(role)`
- `canViewAllAnalytics(role)`
- `canManageRequestHub(role)`
- `canCloseRequestHubTicket(role)`
- `canViewFeedback(role)`

This reduces drift between React components, service helpers, and SQL policy assumptions.

## 7. Normalize Task Naming

Current documentation notes inconsistent task labels:

- `FP Validation`
- `FL Validation`

Recommendation:

- Choose one canonical value before expanding enterprise analytics.
- Prefer the value currently used in the Entry Form.
- Add compatibility mapping for historical data.
- Avoid building new dashboards on top of inconsistent labels.

## 8. Add Migration Verification Scripts

For each major migration, add a verification script:

```text
SMART_REQUEST_HUB_PHASE1_VERIFY.sql
ENTERPRISE_NOTIFICATIONS_PHASE2_VERIFY.sql
ENTERPRISE_ANALYTICS_PHASE3_VERIFY.sql
```

Each script should check:

- Tables exist.
- RLS is enabled.
- Important policies exist.
- Indexes exist.
- Storage bucket exists where applicable.
- Role values match the active hierarchy.

## 9. Avoid Destructive Production SQL

Continue the project rule:

- Do not rerun fresh setup on production.
- Do not drop production tables.
- Do not rewrite old rows without a tested backfill.
- Prefer `add column if not exists`.
- Add constraints only after checking existing data.

For duplicate Daily Entry prevention, do not add a unique index until existing duplicates are identified and cleaned.

## 10. Improve Auditability Early

Audit logs should be introduced before high-power admin controls.

Minimum audit events:

- Request created.
- Status changed.
- Priority changed.
- Assignment changed.
- Remark added.
- Screenshot uploaded.
- Request closed.
- Super admin override.
- Feedback created or edited.
- Duplicate entry override, if allowed later.

Audit entries should include:

- Actor.
- Actor role.
- Entity.
- Old value.
- New value.
- Reason.
- Timestamp.

## 11. Use Soft Delete For Enterprise Records

Avoid hard deletion for:

- Smart Request Hub tickets.
- Feedback records.
- Notifications with audit value.
- Governance records.

Recommended fields:

- `archived_at`
- `archived_by`
- `archive_reason`

Hard delete should be limited to accidental non-production test data.

## 12. Add Pagination Before Data Grows

Recommended defaults:

- Request list page size: 25 or 50.
- Notification drawer: latest 20.
- Notification center: paginated 50.
- Audit timeline: latest 100 with load more.

Avoid loading all enterprise data into React once records grow.

## 13. Prepare For Mobile Without Building Mobile Yet

Design service APIs and data shapes so a future mobile app can reuse them.

Recommendations:

- Keep module services separate from React components.
- Avoid UI-only names in database fields.
- Use stable status/category/priority values.
- Keep audit records machine-readable.
- Use explicit `module` and `reference_id` fields for cross-module links.

## 14. Use Edge Functions For Trusted Work

Good Edge Function candidates:

- Reminder engine.
- Email notification dispatch.
- Behaviour snapshot calculation.
- Weekly/monthly analytics rollups.
- Admin-only bulk operations.

Avoid trusted cross-user operations entirely from the browser.

## 15. Add Realtime Later

Realtime updates are useful, but not required for the first enterprise rollout.

Recommended order:

1. Build stable refresh and polling.
2. Refresh unread counts after user actions.
3. Add Supabase realtime only after RLS and data volume are stable.

## 16. UX Suggestions

Smart Request Hub:

- Keep request creation short.
- Put technical metadata behind a collapsible section.
- Show the `SRH-########` ticket number immediately after creation.
- Use clear status badges.
- Keep workflow actions near the request detail header.
- Show audit timeline clearly.

Notifications:

- Keep the bell drawer compact.
- Avoid showing every low-value event as a toast.
- Reserve system alerts for critical or action-required items.

Analytics:

- Use the same filters across Analytics, Smart Request Hub, and Behaviour Intelligence.
- Add exports only after enterprise metrics stabilize.

## 17. Security Suggestions

Important checks:

- Performers cannot view unrelated requests.
- Leads cannot view outside their team/client/sub-division.
- Managers cannot perform super admin governance actions.
- Users cannot forge `created_by`, `created_role`, or audit actor fields.
- Storage paths should not expose private information.
- Screenshot reads must follow ticket visibility.

RLS should be the primary protection. Frontend checks are only for better user experience.

## 18. Performance Suggestions

Add indexes before production usage:

- Request status.
- Request assignee.
- Request creator.
- Request client.
- Request created date.
- Notification receiver/read/date.
- Audit entity/date.
- Behaviour snapshot user/period.

For analytics:

- Use snapshots for older date ranges.
- Calculate current short ranges live only while data volume is small.

## 19. Documentation Suggestions

After implementation, update:

- `README.md` with Smart Request Hub summary.
- `Skills.md` with new skills:
  - Raise Smart Request Hub Request.
  - Review Smart Request Hub Request.
  - Receive Notifications.
  - Review Behaviour Analytics.
  - Manage Feedback.
- `dev_remark.md` with migration order and production cautions.
- `test_use_case.md` with manual enterprise scenarios.

## 20. Risk Register

| Risk | Impact | Mitigation |
| --- | --- | --- |
| RLS too permissive | Data leakage | Verify with test users per role |
| RLS too restrictive | Broken workflows | Add role-based SQL smoke tests |
| Screenshot uploads fail | Evidence missing | Validate bucket, path, and policies before rollout |
| Notification spam | Users ignore alerts | Deduplicate reminders and limit toast usage |
| Analytics score disputed | Low trust | Publish scoring formula and source metrics |
| Duplicate entry constraint breaks old data | Production insert failures | Detect and clean duplicates before adding unique index |
| Direct component Supabase calls grow messy | Hard maintenance | Put new enterprise logic in services |

## 21. Suggested Milestones

Milestone 1:

- Smart Request Hub migration.
- Request create/list/detail.
- Screenshot upload.
- Basic role visibility.

Milestone 2:

- Request workflow actions.
- Audit timeline.
- Request Hub dashboard.
- Production feature flag rollout.

Milestone 3:

- Notification database.
- Notification provider, bell, drawer.
- Smart Request Hub notification integration.

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

