# CBPET Enterprise Migration - Level 2 Plan

## Enterprise Notification Engine

### 1. Purpose

Level 2 introduces a reusable notification framework for CBPET. It supports Smart Request Hub, Daily Tracker, Admin, Analytics, and future modules.

Primary outcomes:

- Users receive in-app notifications for important work.
- The header bell shows unread counts.
- A notification drawer and center show actionable messages.
- Contextual actions such as Approve, Reject, View, Assign, Comment, and Complete can be attached to notifications.
- Assigned Smart Request Hub tickets can trigger reminders after 48 hours without updates.
- Email support is prepared but feature-flagged.

### 2. Scope

In scope:

- Notification database tables.
- Notification provider and UI components.
- Reusable notification service API.
- Smart Request Hub notification integration.
- Selected Daily Tracker notification integration.
- 48 hour assigned-request reminder engine.
- Read, unread, delete, dismiss, and action-required states.
- Feature flags for safe rollout.

Out of scope:

- Mobile push notifications.
- SMS or chat integrations.
- AI-generated notification content.
- Advanced user-configurable schedules beyond default reminder timing.
- Mandatory email delivery.

### 3. Database Migration

Create one incremental migration:

```text
sql_commands/ENTERPRISE_NOTIFICATIONS_PHASE2.sql
```

#### 3.1 Table: notifications

Purpose: one notification row per receiver.

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

#### 3.2 Table: notification_actions

Purpose: action buttons attached to a notification.

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

#### 3.3 Table: notification_preferences

Purpose: future-ready per-user module preferences.

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

### 4. RLS And Security

Enable RLS:

```sql
alter table public.notifications enable row level security;
alter table public.notification_actions enable row level security;
alter table public.notification_preferences enable row level security;
```

Rules:

- Users can read their own notifications.
- Users can update `read` and `status` for their own notifications.
- Users can read actions linked to their own notifications.
- Users can manage their own notification preferences.
- Browser clients cannot create arbitrary notifications for other users.
- System-generated notifications should be inserted through an RPC or Edge Function.
- Super admins may receive audit/support visibility only if explicitly added through separate policy.

### 5. Notification Types

Supported notification channels:

- Bell notification.
- Toast.
- Email-ready notification.
- System alert.

Priority use:

| Priority | Use |
| --- | --- |
| Low | Informational updates |
| Normal | Standard status changes |
| High | Assignments and review actions |
| Critical | Overdue, escalated, blocker, or urgent issue |

Module values:

- `daily_tracker`
- `smart_request_hub`
- `admin`
- `analytics`
- `system`

### 6. React Module Structure

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

`NotificationProvider` responsibilities:

- Load notifications for the current user.
- Maintain unread count.
- Provide context methods.
- Refresh after notification actions.
- Leave room for Supabase realtime later.

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

`NotificationBell` responsibilities:

- Show unread count.
- Open drawer.
- Highlight critical or action-required notifications.

`NotificationDrawer` responsibilities:

- Show recent notifications.
- Filter unread and action-required messages.
- Render action buttons.
- Link back to source module by route and reference ID.

`NotificationCenter` responsibilities:

- Full notification view.
- Filter by module, priority, read status, and date.
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

### 8. Smart Request Hub Integration

Trigger notifications when:

- Request Raised.
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
| Request Raised | Relevant lead, manager, optionally super admin |
| Assigned | Assigned user |
| Reassigned | New assigned user and previous assigned user |
| Comment Added | Creator, assigned user, scoped reviewers |
| Priority Changed | Creator, assigned user, scoped reviewers |
| Status Changed | Creator, assigned user, scoped reviewers |
| Need More Information | Request creator |
| Resolved | Request creator and reviewer |
| Closed | Request creator and assigned user |

Action buttons:

- Lead receives `View`, `Approve`, and `Reject`.
- Request creator receives `View` and `Comment`.
- Assigned user receives `View` and `Complete`.
- Manager receives `View`, `Assign`, and `Comment`.
- General Manager and Super Admin receive all relevant review actions.

### 9. Daily Tracker Integration

Initial Daily Tracker notifications:

- Entry submitted successfully.
- Manager logs an entry on behalf of a performer.
- Entry deleted by manager, general manager, or super admin.
- Duplicate entry blocked, when duplicate prevention is implemented.
- Weekly performance report available, if that feature is active.

Keep Daily Tracker integration intentionally small to avoid destabilizing existing workflows.

### 10. Reminder Engine

Requirement:

If a performer does not update an assigned Smart Request Hub ticket within 48 hours:

- Notify performer.
- Notify relevant lead.
- Show it as escalation data.
- Optionally send email if email notification is enabled.

Recommended implementation:

- Add `last_activity_at timestamptz` to `request_hub_tickets` in the Level 2 migration if not added in Level 1.
- Update `last_activity_at` on status, remark, assignment, screenshot, and priority changes.
- Add Edge Function:

```text
supabase/functions/request-hub-reminders
```

Function behavior:

- Finds tickets with status `Assigned`, `In Progress`, or `Need Information`.
- Checks `last_activity_at < now() - interval '48 hours'`.
- Avoids duplicate reminder notifications for the same ticket within the last 24 hours.
- Creates notifications for performer and lead.
- Optionally dispatches email if enabled.

Future reminder options:

- 24 hours.
- 48 hours.
- 72 hours.
- Weekly.

Default:

```text
48 hours
```

### 11. Email Strategy

Email should be optional in Level 2.

Recommended default:

- Implement in-app notifications first.
- Store email intent in metadata.
- Add email dispatch only for high-priority or overdue events after SMTP/API credentials are confirmed.

Optional columns if email is implemented:

- `email_sent_at`
- `email_error`
- `email_attempts`

### 12. Feature Flags

Add:

```text
VITE_ENABLE_NOTIFICATIONS
VITE_ENABLE_NOTIFICATION_EMAIL
VITE_ENABLE_REQUEST_HUB_REMINDERS
```

Defaults:

- Notifications enabled when unset.
- Email disabled unless explicitly enabled.
- Reminder UI enabled separately from the scheduled reminder function.

### 13. Deployment

Recommended order:

1. Apply `ENTERPRISE_NOTIFICATIONS_PHASE2.sql`.
2. Add notification service and provider.
3. Wrap authenticated app shell in `NotificationProvider`.
4. Add `NotificationBell` to the top navigation.
5. Connect Smart Request Hub events to `sendNotification()`.
6. Add minimal Daily Tracker events.
7. Deploy reminder Edge Function in staging.
8. Validate RLS with multiple users.
9. Enable in production.

Rollback:

- Set `VITE_ENABLE_NOTIFICATIONS=false`.
- Disable scheduled reminder job.
- Keep notification tables.

### 14. Testing

Automated:

- `npm test`
- `npm run build`
- Unit tests for notification rules if added.

Manual:

- User receives notification and unread count increases.
- User marks one notification as read.
- User marks all notifications as read.
- User dismisses or deletes a notification.
- Action button opens the correct Smart Request Hub ticket.
- Assignment sends notification to assignee.
- Need Information sends notification to creator.
- 48 hour reminder creates only one recent reminder per ticket.
- User cannot read another user's notifications.
- App remains usable when notifications are disabled.

### 15. Acceptance Criteria

Level 2 is complete when:

- Reusable notification tables and services exist.
- Header bell and drawer work for authenticated users.
- Smart Request Hub emits notifications for key events.
- Selected Daily Tracker events can emit notifications.
- Reminder engine supports the 48 hour assigned-ticket rule.
- RLS protects receiver-specific notification data.
- Email remains optional and feature-flagged.

