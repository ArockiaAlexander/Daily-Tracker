# CBPET Enterprise Migration - Level 2 Plan

## Enterprise Notification Engine

### 1. Purpose

Level 2 introduces a reusable enterprise notification framework for CBPET. It must not be specific to Smart Request Hub. The notification system should support Daily Tracker, Smart Request Hub, Admin, Analytics, and future modules.

Primary outcome:

- Users receive timely in-app notifications.
- Important actions can expose contextual buttons such as Approve, Reject, View, Assign, Comment, and Complete.
- Toasts, bell notifications, drawer notifications, system alerts, and email-ready records use a shared service layer.
- Reminder and escalation logic can notify performers and leads when assigned work is stale.

### 2. Scope

In scope:

- New reusable notification database model.
- Notification provider and UI components.
- Notification service API.
- Smart Request Hub integration.
- Daily Tracker integration for selected events.
- Reminder engine for assigned Pipeline tickets not updated within 48 hours.
- Read/unread, delete, and action-required states.
- Feature-flag-ready rollout.

Out of scope:

- Complex user-configurable schedules beyond simple defaults.
- Full external email provider migration unless SMTP/API credentials are already available.
- Mobile push notifications.
- SMS or WhatsApp notifications.
- AI-generated notification text.

### 3. Database Migration

Create a new incremental migration:

```text
sql_commands/ENTERPRISE_NOTIFICATIONS_PHASE2.sql
```

#### 3.1 Table: notifications

Purpose: one notification per receiver.

```sql
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  receiver uuid not null references auth.users(id) on delete cascade,
  sender uuid references auth.users(id) on delete set null,
  module text not null,
  reference_id uuid,
  title text not null,
  message text not null,
  status text not null default 'active',
  action_required boolean not null default false,
  priority text not null default 'Normal',
  read boolean not null default false,
  created_date timestamptz not null default now(),
  expire_date timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  constraint notifications_status_check
    check (status in ('active', 'dismissed', 'completed', 'expired')),
  constraint notifications_priority_check
    check (priority in ('Low', 'Normal', 'High', 'Critical'))
);
```

Indexes:

```sql
create index if not exists idx_notifications_receiver_read
on public.notifications(receiver, read, created_date desc);

create index if not exists idx_notifications_module_reference
on public.notifications(module, reference_id);

create index if not exists idx_notifications_expire_date
on public.notifications(expire_date);
```

#### 3.2 Optional Table: notification_actions

Purpose: stores available action buttons for each notification.

```sql
create table if not exists public.notification_actions (
  id uuid primary key default gen_random_uuid(),
  notification_id uuid not null references public.notifications(id) on delete cascade,
  action_key text not null,
  label text not null,
  module text not null,
  reference_id uuid,
  created_date timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb
);
```

Supported action keys:

- `approve`
- `reject`
- `view`
- `assign`
- `comment`
- `complete`

#### 3.3 Optional Table: notification_preferences

Purpose: future-ready user preferences.

```sql
create table if not exists public.notification_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  module text not null,
  bell_enabled boolean not null default true,
  toast_enabled boolean not null default true,
  email_enabled boolean not null default false,
  system_alert_enabled boolean not null default true,
  created_date timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, module)
);
```

Preferences can be added in the migration but UI configuration may wait until later.

### 4. RLS And Security

Enable RLS on all notification tables.

Rules:

- Users can read their own notifications.
- Users can update `read` and `status` for their own notifications.
- Users cannot create arbitrary notifications for other users from the browser unless allowed through controlled service functions.
- Admins can read notifications only when needed for support/audit.
- Service role or secure RPC/Edge Function can insert notifications for system events.

Recommended write model:

- For simple in-app events, authenticated clients may call a restricted RPC:

```text
send_notification(...)
```

- For system reminders or email dispatch, use Edge Function with service role.

### 5. Notification Types

Supported types:

- Bell Notification: persistent notification in header bell and drawer.
- Toast: transient UI feedback after an action.
- Email: optional external message for critical or overdue events.
- System Alert: higher visibility in-app alert for important or overdue work.

Priority mapping:

| Priority | Use |
| --- | --- |
| Low | Informational updates |
| Normal | Common status changes |
| High | Assignment, approvals, action required |
| Critical | Overdue, escalated, blocker, urgent issue |

### 6. React Components

Recommended files:

```text
src/components/notifications/NotificationProvider.jsx
src/components/notifications/NotificationBell.jsx
src/components/notifications/NotificationDrawer.jsx
src/components/notifications/NotificationCenter.jsx
src/components/notifications/NotificationItem.jsx
src/lib/notifications/notificationService.js
src/lib/notifications/notificationActions.js
src/lib/notifications/notificationRules.js
```

#### NotificationProvider

Responsibilities:

- Load current user's notifications.
- Maintain unread count.
- Expose notification context.
- Support refresh after actions.
- Optionally subscribe to Supabase realtime later.

Context API:

```js
{
  notifications,
  unreadCount,
  loading,
  refreshNotifications,
  markAsRead,
  markAllRead,
  deleteNotification,
  sendNotification
}
```

#### NotificationBell

Responsibilities:

- Display unread count.
- Open notification drawer.
- Highlight critical/action-required notifications.

#### NotificationDrawer

Responsibilities:

- Show recent notifications.
- Filter by unread/action required.
- Render action buttons.
- Link to source module using hash route and reference ID.

#### NotificationCenter

Responsibilities:

- Full page or modal view for all notifications.
- Search and filter by module, priority, read status, date.
- Bulk mark as read.

### 7. Service API

Required reusable functions:

```js
sendNotification(payload)
markAsRead(notificationId)
markAllRead(userId)
getUnreadCount(userId)
getNotifications(filters)
deleteNotification(notificationId)
```

Payload shape:

```js
{
  receiver,
  sender,
  module,
  referenceId,
  title,
  message,
  actionRequired,
  priority,
  expireDate,
  actions,
  metadata
}
```

Module values:

- `daily_tracker`
- `pipeline`
- `admin`
- `analytics`
- `system`

### 8. Smart Request Hub Integration

Trigger notifications when:

- Ticket Raised.
- Assigned.
- Reassigned.
- Comment Added.
- Priority Changed.
- Status Changed.
- Need More Information.
- Resolved.
- Closed.

Receiver rules:

| Event | Receivers |
| --- | --- |
| Ticket Raised | Relevant lead, manager, optionally admin |
| Assigned | Assigned user |
| Reassigned | New assigned user, previous assigned user |
| Comment Added | Ticket creator, assigned user, reviewers |
| Priority Changed | Ticket creator, assigned user, scoped reviewers |
| Status Changed | Ticket creator, assigned user, scoped reviewers |
| Need More Information | Ticket creator |
| Resolved | Ticket creator, reviewer |
| Closed | Ticket creator, assigned user |

Action buttons:

- Lead receives `View`, `Approve`, `Reject`.
- Performer receives `View`, `Comment`.
- Assigned user receives `View`, `Complete`.
- Manager receives `View`, `Assign`, `Comment`.

### 9. Daily Tracker Integration

Initial Daily Tracker notification events:

- Entry submitted successfully.
- Manager logs entry on behalf of performer.
- Entry deleted by manager/admin.
- Duplicate entry blocked, if duplicate prevention is implemented.
- Weekly performance report available, if the weekly report module is active.

Keep this minimal in Level 2 to avoid destabilizing existing Daily Tracker workflows.

### 10. Reminder Engine

Requirement:

If a performer does not update an assigned ticket within 48 hours:

- Notify performer.
- Notify lead.
- Show in escalation dashboard.
- Optionally send email if enabled.

Recommended implementation:

- Add `last_activity_at` to `pipeline_tickets` in either Level 1 or Level 2 migration.
- Update `last_activity_at` on status, remark, assignment, and screenshot changes.
- Create Edge Function:

```text
supabase/functions/pipeline-ticket-reminders
```

Function behavior:

- Runs on schedule from Supabase cron or external scheduler.
- Finds tickets where:
  - `status in ('Assigned', 'In Progress', 'Need Information')`
  - `last_activity_at < now() - interval '48 hours'`
  - no reminder notification sent for same ticket in last 24 hours.
- Sends notifications to performer and lead.
- Marks metadata to prevent notification spam.

Future configurable reminder windows:

- 24 hours.
- 48 hours.
- 72 hours.
- Weekly.

Default for Level 2:

```text
48 hours
```

### 11. Email Strategy

Level 2 should be email-ready but not blocked by email provider setup.

Options:

- Use existing Edge Function SMTP pattern if credentials are available.
- Store email notification intent in `notifications.metadata`.
- Add `email_sent_at` only if email is implemented.

Recommended default:

- Implement in-app notifications first.
- Add email dispatch only for critical overdue reminders if SMTP configuration is confirmed.

### 12. Feature Flags

Add:

```text
VITE_ENABLE_NOTIFICATIONS
VITE_ENABLE_NOTIFICATION_EMAIL
VITE_ENABLE_PIPELINE_REMINDERS
```

Defaults:

- Notifications enabled when unset.
- Email disabled unless explicitly enabled.
- Reminder UI enabled with in-app records; scheduled function deployment can be separate.

### 13. Deployment Steps

1. Apply `ENTERPRISE_NOTIFICATIONS_PHASE2.sql`.
2. Add notification service and provider.
3. Wrap authenticated app shell in `NotificationProvider`.
4. Add `NotificationBell` to the top nav.
5. Integrate Smart Request Hub events with `sendNotification()`.
6. Add minimal Daily Tracker events.
7. Deploy reminder Edge Function in staging.
8. Validate with multiple roles.
9. Enable in production.

Rollback:

- Disable `VITE_ENABLE_NOTIFICATIONS`.
- Keep notification tables.
- Disable scheduled reminder job.

### 14. Testing

Automated:

- `npm test`
- `npm run build`
- Unit tests for notification filtering/action helpers if added.

Manual:

- User sees unread count after receiving notification.
- Mark one notification as read.
- Mark all as read.
- Delete/dismiss notification.
- Action button opens correct Pipeline ticket.
- Ticket assignment sends notification to assignee.
- Need Information sends notification to creator.
- Reminder engine creates one reminder and does not spam duplicates.
- User cannot read another user's notifications.
- Existing app remains usable if notifications feature flag is disabled.

### 15. Acceptance Criteria

Level 2 is complete when:

- A reusable notification system exists outside Smart Request Hub.
- Header bell displays unread count.
- Drawer/center shows user notifications.
- Notification APIs work for multiple modules.
- Smart Request Hub emits notifications for key events.
- Reminder engine supports the 48 hour assigned-ticket rule.
- RLS protects receiver-specific notification data.
- Email remains optional and feature-flagged.

