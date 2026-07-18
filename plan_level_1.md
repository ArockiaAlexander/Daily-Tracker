# CBPET Enterprise Migration - Level 1 Plan

## Smart Request Hub: Enterprise Request, Issue, And Feature Management

### 1. Purpose

Level 1 introduces **Smart Request Hub**, a modular enterprise request-management system for CBPET Daily Tracker. It lets users raise bugs, improvements, feature updates, and enhancements as traceable tickets without changing existing Daily Tracker entry, Analytics, Admin, Auth, RLS, or performance-rating behavior.

Primary outcomes:

- Users can raise structured internal requests from inside the app.
- Every request receives a unique `SRH-########` ticket number.
- Screenshots and browser context are captured with the ticket.
- Leads, managers, general managers, and super admins can review, assign, prioritize, resolve, reject, and close requests.
- All lifecycle activity is auditable.
- A dedicated Smart Request Hub dashboard gives operational visibility.

### 2. Scope

In scope:

- Add **Smart Request Hub** after Analytics in main navigation.
- Add route `#request-hub` and React tab key `request_hub`.
- Add request ticket creation, list, detail, filters, dashboard, screenshots, remarks, and workflow actions.
- Add database tables `request_hub_tickets`, `request_hub_screenshots`, and `request_hub_events`.
- Add Supabase Storage bucket `request-hub-screenshots`.
- Add role-aware RLS for the active role hierarchy:
  - `performer`
  - `team_lead`
  - `group_lead`
  - `manager`
  - `general_manager`
  - `super_admin`
- Add audit events for all ticket lifecycle changes.
- Make the module feature-flag ready.

Out of scope for Level 1:

- Full enterprise notification center.
- Email reminders.
- 48 hour escalation engine.
- Behaviour analytics scoring.
- Feedback module.
- Advanced super admin merge/archive/restore controls.

### 3. Navigation And Routing

Current navigation:

```text
Entry Form
Analytics
Administration
```

Target navigation:

```text
Entry Form
Analytics
Smart Request Hub
Administration
```

Routing:

- `#form` maps to `form`.
- `#analytics` maps to `dashboard`.
- `#request-hub` maps to `request_hub`.
- `#admin` maps to `super_admin`.

Feature flag:

```text
VITE_ENABLE_SMART_REQUEST_HUB
```

Default behavior:

- Enabled when unset.
- Disabled only when explicitly set to `false`.
- If disabled, hide the navigation tab and redirect `#request-hub` to `#form`.

### 4. Database Migration

Create one incremental migration:

```text
sql_commands/SMART_REQUEST_HUB_PHASE1.sql
```

Do not rerun `FRESH_SUPABASE_SETUP.sql` on an existing database.

#### 4.1 Table: request_hub_tickets

Purpose: one row per request ticket.

```sql
create table if not exists public.request_hub_tickets (
  id uuid primary key default gen_random_uuid(),
  ticket_number text not null unique,
  project_name text,
  client text,
  sub_division text,
  task_type text,
  category text not null,
  title text not null,
  description text not null,
  additional_information text,
  current_page_url text,
  current_component text,
  browser text,
  resolution text,
  timezone text,
  created_by uuid not null references auth.users(id) on delete cascade,
  created_role text,
  created_date timestamptz not null default now(),
  status text not null default 'Request',
  priority text not null default 'Medium',
  assigned_to uuid references auth.users(id) on delete set null,
  lead_remark text,
  admin_remark text,
  manager_remark text,
  gm_remark text,
  closed_date timestamptz,
  updated_at timestamptz not null default now(),
  constraint request_hub_category_check
    check (category in ('Bug', 'Improvement', 'Feature Update', 'Enhancement')),
  constraint request_hub_status_check
    check (status in ('Request', 'Verified', 'Assigned', 'In Progress', 'Need Information', 'Resolved', 'Rejected', 'Closed')),
  constraint request_hub_priority_check
    check (priority in ('Low', 'Medium', 'High', 'Critical'))
);
```

Indexes:

```sql
create index if not exists idx_request_hub_tickets_created_by
on public.request_hub_tickets(created_by);

create index if not exists idx_request_hub_tickets_assigned_to
on public.request_hub_tickets(assigned_to);

create index if not exists idx_request_hub_tickets_status
on public.request_hub_tickets(status);

create index if not exists idx_request_hub_tickets_priority
on public.request_hub_tickets(priority);

create index if not exists idx_request_hub_tickets_client
on public.request_hub_tickets(client);

create index if not exists idx_request_hub_tickets_created_date
on public.request_hub_tickets(created_date desc);
```

#### 4.2 Table: request_hub_screenshots

Purpose: screenshot metadata for files stored in Supabase Storage.

```sql
create table if not exists public.request_hub_screenshots (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.request_hub_tickets(id) on delete cascade,
  storage_bucket text not null default 'request-hub-screenshots',
  storage_path text not null,
  file_name text not null,
  mime_type text,
  size_bytes integer,
  uploaded_by uuid not null references auth.users(id) on delete cascade,
  created_date timestamptz not null default now(),
  constraint request_hub_screenshot_size_check
    check (size_bytes is null or size_bytes <= 10485760)
);
```

Index:

```sql
create index if not exists idx_request_hub_screenshots_ticket_id
on public.request_hub_screenshots(ticket_id);
```

#### 4.3 Table: request_hub_events

Purpose: audit log and future notification source for Smart Request Hub.

```sql
create table if not exists public.request_hub_events (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.request_hub_tickets(id) on delete cascade,
  actor_id uuid references auth.users(id) on delete set null,
  actor_role text,
  event_type text not null,
  old_status text,
  new_status text,
  old_priority text,
  new_priority text,
  old_assigned_to uuid references auth.users(id) on delete set null,
  new_assigned_to uuid references auth.users(id) on delete set null,
  remark text,
  metadata jsonb not null default '{}'::jsonb,
  created_date timestamptz not null default now()
);
```

Indexes:

```sql
create index if not exists idx_request_hub_events_ticket_id
on public.request_hub_events(ticket_id, created_date desc);

create index if not exists idx_request_hub_events_actor_id
on public.request_hub_events(actor_id);
```

### 5. Storage

Create Supabase Storage bucket:

```text
request-hub-screenshots
```

Storage path convention:

```text
request-hub/{ticket_id}/{timestamp}-{safe_filename}
```

Rules:

- Authenticated users can upload screenshots for tickets they create.
- Authorized reviewers can read screenshots for tickets they can view.
- Maximum 10 screenshots per ticket.
- Maximum 10MB per screenshot.
- Accepted image MIME types:
  - `image/png`
  - `image/jpeg`
  - `image/webp`

The frontend must validate file count, size, and MIME type before upload.

### 6. RLS And Role Access

Enable RLS:

```sql
alter table public.request_hub_tickets enable row level security;
alter table public.request_hub_screenshots enable row level security;
alter table public.request_hub_events enable row level security;
```

Access model:

| Role | Read Access | Create | Workflow Actions |
| --- | --- | --- | --- |
| `performer` | Own tickets and tickets assigned to them | Yes | Add information, comments, start assigned work, resolve assigned work |
| `team_lead` | Own team tickets | Yes | Approve, reject, request information, assign, reassign, prioritize |
| `group_lead` | Own client/sub-division tickets | Yes | Approve, reject, request information, assign, reassign, prioritize |
| `manager` | Managed business scope | Yes | Assign, prioritize, review, resolve, close |
| `general_manager` | Broad business scope | Yes | Manager actions plus GM remarks |
| `super_admin` | All tickets | Yes | All actions and overrides |

Recommended helper functions:

- `public.current_user_role()`
- `public.can_view_request_hub_ticket(ticket_id uuid)`
- `public.can_manage_request_hub_ticket(ticket_id uuid)`

Use frontend checks for UX only. RLS remains the source of truth.

### 7. Ticket Number

Format:

```text
SRH-########
```

Example:

```text
SRH-48391284
```

Rules:

- Generate an 8 digit random number.
- Enforce uniqueness through `ticket_number unique`.
- Retry on unique violation up to 5 times.
- Show the final ticket number immediately after successful creation.

### 8. Workflow

Initial status:

```text
Request
```

Supported statuses:

- `Request`
- `Verified`
- `Assigned`
- `In Progress`
- `Need Information`
- `Resolved`
- `Rejected`
- `Closed`

Workflow:

```text
User raises request
-> Request
-> Lead Review
-> Manager / General Manager / Super Admin review as applicable
-> Assigned
-> In Progress
-> Resolved
-> Closed
```

Action mapping:

| Action | Allowed Roles | Result |
| --- | --- | --- |
| Raise request | All authenticated users | `Request` |
| Approve | Lead, Manager, General Manager, Super Admin | `Verified` |
| Reject | Lead, Manager, General Manager, Super Admin | `Rejected` |
| Need More Information | Lead, Manager, General Manager, Super Admin | `Need Information` |
| Add Information | Ticket creator | Keeps status or returns to `Request`, based on reviewer choice |
| Assign | Lead, Manager, General Manager, Super Admin | `Assigned` |
| Reassign | Lead, Manager, General Manager, Super Admin | `Assigned` |
| Start Work | Assigned user, Manager, General Manager, Super Admin | `In Progress` |
| Mark Resolved | Assigned user, Manager, General Manager, Super Admin | `Resolved` |
| Close | Manager, General Manager, Super Admin | `Closed` |
| Change Priority | Lead, Manager, General Manager, Super Admin | Same status |
| Add Remark | Relevant reviewer role | Same status |

Terminal states for Level 1:

- `Rejected`
- `Closed`

Reopen, merge, archive, restore, and ownership transfer are deferred to Level 3 governance.

### 9. Audit Logging

Every meaningful change inserts a `request_hub_events` row.

Required event types:

- `ticket_created`
- `screenshot_uploaded`
- `status_changed`
- `priority_changed`
- `assigned`
- `reassigned`
- `remark_added`
- `information_requested`
- `information_added`
- `resolved`
- `rejected`
- `closed`

Each event records:

- Ticket ID.
- Actor ID.
- Actor role.
- Old and new values when applicable.
- Remark or reason.
- Timestamp.
- Extra metadata as JSON.

### 10. React Module Structure

Recommended files:

```text
src/components/requestHub/SmartRequestHub.jsx
src/components/requestHub/RequestHubDashboard.jsx
src/components/requestHub/RequestCreateForm.jsx
src/components/requestHub/RequestList.jsx
src/components/requestHub/RequestDetail.jsx
src/components/requestHub/RequestActions.jsx
src/components/requestHub/RequestTimeline.jsx
src/components/requestHub/ScreenshotUploader.jsx
src/lib/requestHub/requestHubService.js
src/lib/requestHub/requestHubWorkflow.js
src/lib/requestHub/requestHubNumber.js
src/lib/requestHub/requestHubAudit.js
```

`SmartRequestHub.jsx` owns:

- Loading scoped tickets.
- Loading scoped assignable users.
- Loading clients.
- Switching between dashboard, list, create, and detail views.
- Refreshing data after actions.

`requestHubService.js` owns:

- `createRequest(payload, files)`
- `getRequests(filters)`
- `getRequestById(id)`
- `updateRequestStatus(ticketId, nextStatus, remark)`
- `assignRequest(ticketId, userId, remark)`
- `changeRequestPriority(ticketId, priority, remark)`
- `addRequestRemark(ticketId, remarkType, remark)`
- `uploadRequestScreenshots(ticketId, files)`
- `getRequestEvents(ticketId)`
- `getRequestHubDashboardStats(filters)`

`requestHubWorkflow.js` owns:

- `getAvailableRequestActions(ticket, profile)`
- `canViewRequest(ticket, profile)`
- `canAssignRequest(ticket, profile)`
- `canCloseRequest(ticket, profile)`
- `getNextStatusForRequestAction(action, ticket)`

### 11. Create Request Form

Fields:

- Project name.
- Client.
- Sub-division.
- Task type.
- Category.
- Title.
- Description.
- Additional information.
- Screenshots.

Category options:

- `Bug`
- `Improvement`
- `Feature Update`
- `Enhancement`

Auto-captured fields:

- Current page URL.
- Browser/user agent summary.
- Screen resolution.
- Timezone.
- Logged-in user.
- Role.
- Date.
- Current module.

Validation:

- Category required.
- Title required.
- Description required.
- Maximum 10 screenshots.
- Maximum 10MB per screenshot.
- Image files only.

### 12. Dashboard

Cards:

- Open Requests.
- Critical.
- Assigned.
- Resolved.
- Rejected.
- Overdue.
- My Requests.

Charts:

- Priority distribution.
- Category distribution.
- Status distribution.
- Team distribution.
- Client distribution.
- Monthly trend.

Default overdue rule for Level 1:

- Status is not `Resolved`, `Rejected`, or `Closed`.
- Created date is older than 7 days.

This becomes configurable in Level 2.

### 13. Level 1 Notification Handling

Do not build the full notification system in Level 1.

Level 1 behavior:

- Use existing toast feedback after actions.
- Record structured events in `request_hub_events`.
- Keep event records ready for Level 2 notification integration.

Notification-worthy events:

- Request Raised.
- Assigned.
- Reassigned.
- Comment Added.
- Priority Changed.
- Status Changed.
- Need Information.
- Resolved.
- Closed.

### 14. Deployment

Recommended order:

1. Apply `SMART_REQUEST_HUB_PHASE1.sql`.
2. Create or verify `request-hub-screenshots` bucket.
3. Add request-hub service helpers.
4. Add Smart Request Hub UI.
5. Add `#request-hub` route and navigation item.
6. Validate RLS with multiple users.
7. Enable the feature flag in production.

Rollback:

- Set `VITE_ENABLE_SMART_REQUEST_HUB=false`.
- Keep database tables and storage bucket.
- Do not drop ticket data.

### 15. Testing

Automated:

- `npm test`
- `npm run build`

Manual:

- Performer creates request without screenshots.
- Performer creates request with 1 to 10 screenshots.
- Upload above 10MB is blocked.
- Lead approves, rejects, requests information, assigns, changes priority.
- Assigned user moves request to `In Progress` and `Resolved`.
- Manager or General Manager closes resolved request.
- Super Admin can see all requests.
- Performer cannot see unrelated requests.
- Dashboard counts match visible scoped records.
- Existing Daily Tracker entry submission still works.
- Existing Analytics and Admin tabs still work.

### 16. Acceptance Criteria

Level 1 is complete when:

- Smart Request Hub appears after Analytics.
- Requests can be created and stored in Supabase.
- Unique `SRH-########` numbers are generated.
- Screenshots upload to Supabase Storage.
- List, detail, filters, and dashboard work by role.
- Workflow actions update request status.
- Audit events are created for all lifecycle changes.
- RLS blocks unauthorized visibility.
- Existing Daily Tracker functionality is unaffected.
- Production rollback is possible through the feature flag.

