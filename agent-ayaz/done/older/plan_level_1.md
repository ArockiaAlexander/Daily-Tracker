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
- Add Supabase Storage bucket `request-hub-screenshots` (first Storage bucket in this project — no existing pattern to copy).
- Add role-aware RLS for the active role hierarchy:
  - `performer`
  - `team_lead`
  - `group_lead`
  - `manager`
  - `general_manager`
  - `super_admin`
- Add audit events for all ticket lifecycle changes.
- Make the module feature-flag ready.
- Include soft-archive and `last_activity_at` columns in Phase 1 so Level 2 reminders and Level 3 governance do not require mid-flight ALTERs.

Out of scope for Level 1:

- Full enterprise notification center.
- Email reminders.
- 48 hour escalation engine UI (column ready; engine is Level 2).
- Behaviour analytics scoring.
- Feedback module.
- Advanced super admin merge/archive/restore controls (columns ready; UI is Level 3).

**Prerequisite:** apply [`ROLE_RLS_PREFLIGHT.sql`](../sql_commands/ROLE_RLS_PREFLIGHT.sql) and verify with [`ROLE_RLS_PREFLIGHT_VERIFY.sql`](../sql_commands/ROLE_RLS_PREFLIGHT_VERIFY.sql). See [`ROLE_RLS_PREFLIGHT.md`](ROLE_RLS_PREFLIGHT.md). Do not copy stale `assistant_manager` policies into Request Hub RLS.

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

Exact edits in [`src/App.jsx`](../src/App.jsx):

```js
const HASH_TO_TAB = {
  form: 'form',
  analytics: 'dashboard',
  'request-hub': 'request_hub',
  admin: 'super_admin',
};
const TAB_TO_HASH = {
  form: 'form',
  dashboard: 'analytics',
  request_hub: 'request-hub',
  super_admin: 'admin',
};
const APP_HASHES = new Set(['form', 'analytics', 'request-hub', 'admin']);
```

Also:

- Add a nav button **Smart Request Hub** after Analytics, visible to **all authenticated users** (unlike Administration, which stays role-gated to `super_admin` / `general_manager` / `manager`).
- Render `<SmartRequestHub />` when `activeTab === 'request_hub'`.
- When `VITE_ENABLE_SMART_REQUEST_HUB === 'false'`, hide the tab and redirect `#request-hub` → `#form`.

Auth / hash rules ([`src/lib/authRedirect.js`](../src/lib/authRedirect.js)):

- Keep auth email redirects **hash-free** (base origin only). Do not put `#request-hub` in `emailRedirectTo` or invite redirects.
- Do not assume `#request-hub` survives invite/recovery URL sanitization; deep-link restore across auth is out of Level 1 scope.

Do **not** wire these orphan files:

- `src/components/ProtectedRoute.jsx` (expects missing `react-router-dom`)
- `src/components/TeamManagement.jsx`
- `src/components/Leaderboard.jsx`

Feature flag:

```text
VITE_ENABLE_SMART_REQUEST_HUB
```

Default behavior:

- Enabled when unset (`import.meta.env.VITE_ENABLE_SMART_REQUEST_HUB !== 'false'`).
- Disabled only when explicitly set to `false`.
- Vite embeds flags at **build time**; flipping a flag requires rebuild/redeploy.

### 4. Database Migration

Create one incremental migration:

```text
sql_commands/SMART_REQUEST_HUB_PHASE1.sql
```

Companion verify:

```text
sql_commands/SMART_REQUEST_HUB_PHASE1_VERIFY.sql
```

Do not rerun `FRESH_SUPABASE_SETUP.sql` on an existing database.

#### 4.1 Table: request_hub_tickets

Purpose: one row per request ticket.

Client scoping must match the live app:

- Prefer `client_id` text codes from `public.clients.code` (e.g. `OUP`), same as `status_entries.client_id`.
- Optionally store `client_ref uuid` FK to `public.clients(id)` for group_lead RLS that mirrors `profiles.client_ref`.
- Constrain `sub_division` to `PreEdit` / `Validation` (same as profiles/entries).

```sql
create table if not exists public.request_hub_tickets (
  id uuid primary key default gen_random_uuid(),
  ticket_number text not null unique,
  project_name text,
  client_id text,
  client_ref uuid references public.clients(id) on delete set null,
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
  last_activity_at timestamptz not null default now(),
  archived_at timestamptz,
  archived_by uuid references auth.users(id) on delete set null,
  archive_reason text,
  updated_at timestamptz not null default now(),
  constraint request_hub_category_check
    check (category in ('Bug', 'Improvement', 'Feature Update', 'Enhancement')),
  constraint request_hub_status_check
    check (status in ('Request', 'Verified', 'Assigned', 'In Progress', 'Need Information', 'Resolved', 'Rejected', 'Closed')),
  constraint request_hub_priority_check
    check (priority in ('Low', 'Medium', 'High', 'Critical')),
  constraint request_hub_sub_division_check
    check (sub_division is null or sub_division in ('PreEdit', 'Validation'))
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

create index if not exists idx_request_hub_tickets_client_id
on public.request_hub_tickets(client_id);

create index if not exists idx_request_hub_tickets_client_ref
on public.request_hub_tickets(client_ref);

create index if not exists idx_request_hub_tickets_created_date
on public.request_hub_tickets(created_date desc);

create index if not exists idx_request_hub_tickets_last_activity
on public.request_hub_tickets(last_activity_at);

create index if not exists idx_request_hub_tickets_archived_at
on public.request_hub_tickets(archived_at);
```

Default list queries should exclude `archived_at is not null` rows unless an archive view is explicitly requested (Level 3).

Keep `last_activity_at` updated on status, remark, assignment, screenshot, and priority changes (service layer responsibility in Level 1; reminder engine consumes it in Level 2).

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

### 5. Storage (greenfield — first bucket)

This project has **no existing Supabase Storage usage**. Level 1 must define bucket + `storage.objects` policies completely.

Create private bucket:

```text
request-hub-screenshots
```

Recommended SQL (adjust to project conventions; run via Dashboard or migration with service role as needed):

```sql
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'request-hub-screenshots',
  'request-hub-screenshots',
  false,
  10485760,
  array['image/png', 'image/jpeg', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;
```

Storage path convention:

```text
request-hub/{ticket_id}/{timestamp}-{safe_filename}
```

`storage.objects` policy intent:

- **Upload (insert):** authenticated user; path under `request-hub/{ticket_id}/...`; user is ticket `created_by` or an authorized manager of that ticket; MIME/size already constrained by bucket + client validation.
- **Read (select):** authenticated user who can view the related `request_hub_tickets` row (same scope as ticket RLS).
- **Update/Delete:** generally deny for browser clients in Level 1 (metadata soft-managed via app tables); super_admin governance can revisit in Level 3.

Rules:

- Maximum 10 screenshots per ticket (enforce in service + optional DB trigger/count check).
- Maximum 10MB per screenshot.
- Accepted MIME types: `image/png`, `image/jpeg`, `image/webp`.
- Frontend must validate count, size, and MIME before upload.
- Screenshot table RLS must follow ticket visibility; never expose storage paths for tickets the user cannot read.

### 6. RLS And Role Access

Enable RLS:

```sql
alter table public.request_hub_tickets enable row level security;
alter table public.request_hub_screenshots enable row level security;
alter table public.request_hub_events enable row level security;
```

Access model (mirror App.jsx scoping — do not invent a new model):

| Role | Read Access | Create | Workflow Actions |
| --- | --- | --- | --- |
| `performer` | Own tickets and tickets assigned to them | Yes | Add information, comments, start assigned work, resolve assigned work |
| `team_lead` | Tickets where creator/assignee shares `profiles.team_id` with the lead (plus own) | Yes | Approve, reject, request information, assign, reassign, prioritize |
| `group_lead` | Tickets matching lead `client_ref` / `client_id` and optional `sub_division` (plus own) | Yes | Approve, reject, request information, assign, reassign, prioritize |
| `manager` | Broad business scope (same breadth as Analytics manager filters) | Yes | Assign, prioritize, review, resolve, close |
| `general_manager` | Broad / all business scope | Yes | Manager actions plus GM remarks |
| `super_admin` | All tickets | Yes | All Level 1 actions |

**New helper functions** (they do **not** exist today — create them; do not call stale `get_user_role_level` until preflight has refreshed it):

```sql
-- NEW functions to create in SMART_REQUEST_HUB_PHASE1.sql
public.current_user_role() returns text
public.can_view_request_hub_ticket(ticket_id uuid) returns boolean
public.can_manage_request_hub_ticket(ticket_id uuid) returns boolean
```

Implementation notes:

- `current_user_role()` reads `profiles.role` for `auth.uid()`.
- View/manage helpers join ticket `created_by` / `assigned_to` / `client_ref` / `client_id` / `sub_division` against the caller's profile the same way entry scoping works in App.
- Use `manager`, never `assistant_manager`, in all new policies.
- Frontend checks (`requestHubWorkflow.js` + `permissions.js`) are UX only. RLS remains the source of truth.
- Users must not be able to forge `created_by`, `created_role`, or audit `actor_id` from the client; set those server-side from `auth.uid()` / profile in the service layer (and prefer triggers or RPC for actor fields if forging becomes a risk).

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

Reopen, merge, archive UI, restore, and ownership transfer are deferred to Level 3 governance (archive columns already present).

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

Also bump `last_activity_at` on the ticket for every event type above except pure reads.

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
src/lib/permissions.js
```

Introduce [`src/lib/permissions.js`](../src/lib/permissions.js) in Level 1 **before** hub UI. Use it for nav gates and `requestHubWorkflow.js`. Do not mass-refactor unrelated screens in the same change set — only new + touched call sites.

`SmartRequestHub.jsx` owns:

- Loading scoped tickets (exclude archived by default).
- Loading scoped assignable users.
- Loading clients from `public.clients` (codes into `client_id` / `client_ref`).
- Switching between dashboard, list, create, and detail views.
- Refreshing data after actions.
- Passing toast callbacks into App’s existing toast API.

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

Keep App.jsx changes minimal: hash maps, nav, feature flag, toast wiring, mount point. Optional: lazy-load the hub module.

### 11. Create Request Form

Fields:

- Project name.
- Client (dropdown from `clients` → stores `client_id` / `client_ref`).
- Sub-division (`PreEdit` | `Validation`).
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
- Not archived.

This becomes configurable in Level 2.

Pagination defaults: request list 25 or 50; audit timeline latest 100 with load more.

### 13. Level 1 Notification Handling

Do not build the full notification system in Level 1.

Level 1 behavior:

- Use existing App toast feedback after actions (`Toast.jsx` success pattern is sufficient for Level 1).
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

0. Apply `ROLE_RLS_PREFLIGHT.sql` and run `ROLE_RLS_PREFLIGHT_VERIFY.sql`.
1. Apply `SMART_REQUEST_HUB_PHASE1.sql`.
2. Create or verify `request-hub-screenshots` bucket + storage policies.
3. Run `SMART_REQUEST_HUB_PHASE1_VERIFY.sql`.
4. Add `permissions.js` and request-hub service helpers.
5. Add Smart Request Hub UI.
6. Add `#request-hub` route and navigation item (three hash maps + `APP_HASHES`).
7. Document `VITE_ENABLE_SMART_REQUEST_HUB` in `.env.example`.
8. Validate RLS with multiple users (one per role).
9. Enable the feature flag in production (rebuild/redeploy).

Rollback:

- Set `VITE_ENABLE_SMART_REQUEST_HUB=false` and rebuild.
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
- Team lead cannot see outside team scope.
- Group lead scoped by client_ref / sub_division.
- Dashboard counts match visible scoped records.
- Existing Daily Tracker entry submission still works.
- Existing Analytics and Admin tabs still work.

### 16. Acceptance Criteria

Level 1 is complete when:

- Smart Request Hub appears after Analytics for all authenticated users (when flag enabled).
- Requests can be created and stored in Supabase with `client_id` / optional `client_ref`.
- Unique `SRH-########` numbers are generated.
- Screenshots upload to Supabase Storage under the first-bucket policies.
- List, detail, filters, and dashboard work by role.
- Workflow actions update request status and `last_activity_at`.
- Audit events are created for all lifecycle changes.
- Soft-archive columns exist (UI unused until Level 3).
- RLS blocks unauthorized visibility.
- Existing Daily Tracker functionality is unaffected.
- Production rollback is possible through the feature flag + rebuild.
