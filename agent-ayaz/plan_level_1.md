# CBPET Enterprise Migration - Level 1 Plan

## Smart Request Hub and Feature Request Management

### 1. Purpose

Level 1 converts CBPET Daily Tracker from a daily productivity tracker into the first version of an enterprise project-management ecosystem by adding an internal request-management module named **Smart Request Hub**.

This phase must be implemented as an extension, not a redesign. Existing Daily Tracker entry submission, Analytics, Admin, Auth, RLS, and performance rating behavior must continue to work unchanged.

Primary outcome:

- Users can raise bugs, improvements, feature updates, and enhancement requests.
- Each request becomes a traceable ticket.
- Leads, managers, general managers, and super admins can review, assign, prioritize, resolve, reject, and close tickets.
- Ticket lifecycle changes are audited.
- Screenshots and browser context are captured with each ticket.
- A dedicated Pipeline dashboard gives operational visibility.

### 2. Scope

In scope:

- New `Smart Request Hub` navigation tab after `Analytics`.
- New Supabase tables for tickets, screenshots, and audit events.
- Supabase Storage bucket for screenshots.
- Ticket number generation with unique 8 digit random suffix.
- Ticket create, list, detail, filter, dashboard, and workflow screens.
- Role-aware ticket visibility and actions.
- Audit logging for lifecycle, assignment, priority, screenshots, and remarks.
- Feature flag readiness.
- Phase 1 notification placeholder through structured ticket events.

Out of scope:

- Full enterprise notification center.
- Email reminders.
- 48 hour escalation engine.
- Behaviour analytics scoring.
- Feedback module.
- Super admin merge/archive/restore controls, except audit-ready schema design.

### 3. Current Product Fit

The current app uses:

- React 18 with Vite.
- Supabase Auth, Postgres, RLS, and Edge Functions.
- Hash routing in `src/App.jsx` using `#form`, `#analytics`, and `#admin`.
- Direct Supabase client calls from React components and helper libraries.
- Existing roles: `performer`, `team_lead`, `group_lead`, `manager`, `general_manager`, `super_admin`.
- Existing SQL migration convention in `sql_commands/`.

Level 1 should follow this structure and avoid introducing a new router, state manager, backend framework, or unrelated UI redesign.

### 4. Navigation And Routing

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

Routing changes:

- Add hash route `#pipeline`.
- Add internal tab key `pipeline`.
- Keep existing mappings:
  - `#form` -> `form`
  - `#analytics` -> `dashboard`
  - `#admin` -> `super_admin`
- Add:
  - `#pipeline` -> `pipeline`
- If feature flag disables Smart Request Hub, hide the tab and redirect `#pipeline` to `#form`.

Feature flag:

```text
VITE_ENABLE_PIPELINE_TRAIN
```

Default:

- Enabled when unset.
- Disabled only when explicitly set to `false`.

### 5. Database Migration

Create a new incremental migration:

```text
sql_commands/PIPELINE_TRAIN_PHASE1.sql
```

Do not modify or rerun `FRESH_SUPABASE_SETUP.sql` for an existing database.

#### 5.1 Table: pipeline_tickets

Purpose: one row per raised request.

Recommended schema:

```sql
create table if not exists public.pipeline_tickets (
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
  constraint pipeline_tickets_category_check
    check (category in ('Bug', 'Improvement', 'Feature Update', 'Enhancement')),
  constraint pipeline_tickets_status_check
    check (status in ('Request', 'Verified', 'Assigned', 'In Progress', 'Need Information', 'Resolved', 'Rejected', 'Closed')),
  constraint pipeline_tickets_priority_check
    check (priority in ('Low', 'Medium', 'High', 'Critical'))
);
```

Indexes:

```sql
create index if not exists idx_pipeline_tickets_created_by on public.pipeline_tickets(created_by);
create index if not exists idx_pipeline_tickets_assigned_to on public.pipeline_tickets(assigned_to);
create index if not exists idx_pipeline_tickets_status on public.pipeline_tickets(status);
create index if not exists idx_pipeline_tickets_priority on public.pipeline_tickets(priority);
create index if not exists idx_pipeline_tickets_client on public.pipeline_tickets(client);
create index if not exists idx_pipeline_tickets_created_date on public.pipeline_tickets(created_date desc);
```

#### 5.2 Table: pipeline_ticket_screenshots

Purpose: metadata for uploaded screenshots stored in Supabase Storage.

```sql
create table if not exists public.pipeline_ticket_screenshots (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.pipeline_tickets(id) on delete cascade,
  storage_bucket text not null default 'pipeline-screenshots',
  storage_path text not null,
  file_name text not null,
  mime_type text,
  size_bytes integer,
  uploaded_by uuid not null references auth.users(id) on delete cascade,
  created_date timestamptz not null default now(),
  constraint pipeline_screenshot_size_check
    check (size_bytes is null or size_bytes <= 10485760)
);
```

Indexes:

```sql
create index if not exists idx_pipeline_screenshots_ticket_id
on public.pipeline_ticket_screenshots(ticket_id);
```

#### 5.3 Table: pipeline_ticket_events

Purpose: audit trail and future notification source.

```sql
create table if not exists public.pipeline_ticket_events (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.pipeline_tickets(id) on delete cascade,
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
create index if not exists idx_pipeline_events_ticket_id
on public.pipeline_ticket_events(ticket_id, created_date desc);

create index if not exists idx_pipeline_events_actor_id
on public.pipeline_ticket_events(actor_id);
```

### 6. Storage

Create Supabase Storage bucket:

```text
pipeline-screenshots
```

Rules:

- Authenticated users can upload screenshots for tickets they create.
- Authorized reviewers can read screenshots for tickets they can view.
- Maximum 10 screenshots per ticket.
- Maximum 10MB per screenshot.
- Recommended accepted MIME types:
  - `image/png`
  - `image/jpeg`
  - `image/webp`

Storage path convention:

```text
pipeline/{ticket_id}/{timestamp}-{safe_filename}
```

The frontend should validate count and size before upload. Database constraints enforce size metadata, but object size enforcement should be handled by client validation and optional Supabase Storage policies.

### 7. RLS And Role Access

Enable RLS:

```sql
alter table public.pipeline_tickets enable row level security;
alter table public.pipeline_ticket_screenshots enable row level security;
alter table public.pipeline_ticket_events enable row level security;
```

Access model:

| Role | Read | Create | Workflow Actions |
| --- | --- | --- | --- |
| Performer | Own tickets and assigned tickets | Yes | Add info, comment, move assigned work to in progress/resolved |
| Team Lead | Own team tickets | Yes | Approve, reject, need info, assign/reassign within scope |
| Group Lead | Own client/sub-division tickets | Yes | Approve, reject, need info, assign/reassign within scope |
| Manager | Broad scoped tickets | Yes | Assign, prioritize, resolve review, close where allowed |
| General Manager | All or broad business scope | Yes | Manager actions plus GM remark |
| Super Admin | All tickets | Yes | All actions and overrides |

Recommended helper functions:

- `public.current_user_role()`
- `public.can_view_pipeline_ticket(ticket_row public.pipeline_tickets)`
- `public.can_manage_pipeline_ticket(ticket_row public.pipeline_tickets)`

If PostgreSQL composite helper functions are too heavy for the first migration, inline policy logic may be used, but helper functions are preferred because they reduce duplication and support future mobile/API usage.

### 8. Ticket Number Generation

Default format:

```text
PLT-########
```

Example:

```text
PLT-48391284
```

Rules:

- Generate an 8 digit random number.
- Never duplicate.
- Enforce uniqueness with `ticket_number unique`.
- On unique violation, retry generation up to a small limit, such as 5 attempts.

Optional future display format:

```text
CBP-2026-48391284
```

Do not hard-code year format into the database in Level 1. Keep `ticket_number` flexible.

### 9. Workflow

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
Performer raises ticket
-> Request
-> Lead Review
-> Super Admin / Manager / General Manager review as applicable
-> Assigned
-> In Progress
-> Resolved
-> Closed
```

Action mapping:

| Action | Allowed Roles | Result |
| --- | --- | --- |
| Raise ticket | All authenticated users | `Request` |
| Approve | Lead, Manager, GM, Super Admin | `Verified` |
| Reject | Lead, Manager, GM, Super Admin | `Rejected` |
| Need More Information | Lead, Manager, GM, Super Admin | `Need Information` |
| Add information | Ticket creator | Keeps or returns to `Request` based on reviewer choice |
| Assign | Lead, Manager, GM, Super Admin | `Assigned` |
| Reassign | Lead, Manager, GM, Super Admin | `Assigned` |
| Start work | Assigned user, Manager, GM, Super Admin | `In Progress` |
| Mark resolved | Assigned user, Manager, GM, Super Admin | `Resolved` |
| Close | Manager, GM, Super Admin | `Closed` |
| Change priority | Lead, Manager, GM, Super Admin | Same status |
| Add remark | Relevant reviewer role | Same status |

Terminal states:

- `Rejected`
- `Closed`

Super admin override can be added in Level 3. In Level 1, avoid reopen unless the business explicitly asks for it.

### 10. Audit Logging

Every meaningful ticket change must insert a `pipeline_ticket_events` row.

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

Audit event content:

- Ticket ID.
- Actor ID.
- Actor role.
- Old and new values where applicable.
- Remark or reason.
- Timestamp.
- Extra metadata as JSON.

The audit table is also the bridge for Level 2 notifications.

### 11. React Module Structure

Recommended files:

```text
src/components/pipeline/PipelineTrain.jsx
src/components/pipeline/PipelineDashboard.jsx
src/components/pipeline/TicketCreateForm.jsx
src/components/pipeline/TicketList.jsx
src/components/pipeline/TicketDetail.jsx
src/components/pipeline/TicketActions.jsx
src/components/pipeline/TicketTimeline.jsx
src/components/pipeline/ScreenshotUploader.jsx
src/lib/pipeline/ticketService.js
src/lib/pipeline/ticketWorkflow.js
src/lib/pipeline/ticketNumber.js
src/lib/pipeline/pipelineAudit.js
```

`PipelineTrain.jsx` owns:

- Load tickets.
- Load scoped profiles for assignment.
- Load clients.
- Manage selected ticket.
- Switch between dashboard/list/create/detail views.
- Trigger refresh after ticket actions.

`ticketService.js` owns Supabase calls:

- `createTicket(payload, files)`
- `getTickets(filters)`
- `getTicketById(id)`
- `updateTicketStatus(ticketId, nextStatus, remark)`
- `assignTicket(ticketId, userId, remark)`
- `changePriority(ticketId, priority, remark)`
- `addRemark(ticketId, remarkType, remark)`
- `uploadScreenshots(ticketId, files)`
- `getTicketEvents(ticketId)`
- `getPipelineDashboardStats(filters)`

`ticketWorkflow.js` owns:

- `getAvailableActions(ticket, profile)`
- `canViewTicket(ticket, profile)`
- `canAssignTicket(ticket, profile)`
- `canCloseTicket(ticket, profile)`
- `getNextStatusForAction(action, ticket)`

### 12. Create Ticket Form

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

Auto captured fields:

- Current page URL.
- Browser/user agent.
- Resolution.
- Timezone.
- Logged user.
- Role.
- Date.
- Current module.

Validation:

- Category required.
- Title required.
- Description required.
- Maximum 10 screenshots.
- Maximum 10MB per screenshot.
- Only image files.

### 13. Dashboard

Cards:

- Open Tickets.
- Critical.
- Assigned.
- Resolved.
- Rejected.
- Overdue.
- My Tickets.

Charts:

- Priority distribution.
- Category distribution.
- Status distribution.
- Team distribution.
- Client distribution.
- Monthly ticket trend.

Overdue definition for Level 1:

- Ticket is not `Resolved`, `Rejected`, or `Closed`.
- Ticket `created_date` is older than 7 days.

This can become configurable in Level 2.

### 14. Notifications In Level 1

Do not build the full notification framework yet.

Level 1 behavior:

- Show existing toast after create/update actions.
- Write structured audit events for all notification-worthy actions.
- Create a small adapter function:

```js
recordPipelineEvent(event)
```

The adapter will later be replaced or expanded by Level 2 `sendNotification()`.

Notification-worthy events:

- Ticket Raised.
- Assigned.
- Reassigned.
- Comment Added.
- Priority Changed.
- Status Changed.

### 15. Deployment Steps

Recommended order:

1. Apply `PIPELINE_TRAIN_PHASE1.sql`.
2. Create or verify `pipeline-screenshots` bucket.
3. Deploy frontend with Pipeline feature flag enabled in non-production.
4. Validate RLS with multiple roles.
5. Enable in production.

Rollback:

- Disable `VITE_ENABLE_PIPELINE_TRAIN`.
- Keep database tables in place.
- Do not drop data during rollback.

### 16. Testing

Automated:

- `npm test`
- `npm run build`

Manual:

- Performer creates ticket with no screenshot.
- Performer creates ticket with 10 screenshots.
- Upload greater than 10MB is blocked.
- Lead approves, rejects, requests info, assigns, changes priority.
- Assigned performer moves ticket to `In Progress` and `Resolved`.
- Manager or GM closes resolved ticket.
- Super admin sees all tickets.
- Performer cannot see unrelated tickets.
- Pipeline dashboard counts match filtered tickets.
- Existing Daily Tracker entry submission still works.
- Existing Analytics and Admin tabs still work.

### 17. Acceptance Criteria

Level 1 is complete when:

- `Smart Request Hub` appears between Analytics and Administration.
- Tickets can be created and stored in Supabase.
- Unique ticket numbers are generated.
- Screenshots upload to Supabase Storage.
- Ticket list/detail/dashboard work by role.
- Workflow actions update status and audit events.
- RLS prevents unauthorized ticket visibility.
- Existing Daily Tracker functionality is unaffected.
- Production rollback can be done by disabling the feature flag.

