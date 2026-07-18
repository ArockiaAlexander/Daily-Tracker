# Skills — CBPET Daily Tracker

Capability catalog: what the product can do, inputs/outputs, and who can use each skill.

---

## Skill index

| ID | Skill | Primary roles |
|----|--------|----------------|
| S01 | Authenticate and recover account | All |
| S02 | Log daily task entry | Performer+ (managers can log for others) |
| S03 | Review Daily Summary | All (scoped) |
| S04 | Analyze Overview / Trends | All with analytics access |
| S05 | Manage division targets | Leads / managers / admins |
| S06 | Score Performance Rating | All with analytics access |
| S07 | Export data (CSV / XLSX) | Analytics users |
| S08 | Administer users and clients | Manager+ / admin |
| S09 | Invite / provision users | Admin Invite: GM+; Provision/Add: GM+ |
| S10 | Manage workflows | Admin |
| S11 | Weekly division performance email | System (Edge Function) |

---

## S01 — Authenticate and recover account

- **Inputs:** Email, password; or reset/invite link tokens in URL hash  
- **Outputs:** Session; profile load; route to app / reset / invite-accept  
- **Rules:** Hash auth callbacks sanitized via `authRedirect.js`; invite → Display Name + password; recovery → password only  
- **Components:** `Login`, `Signup`, `ForgotPassword`, `ResetPassword`, `InviteAccept`

---

## S02 — Log daily task entry

- **Inputs:** Performer, date, client, sub-division, title, task type, completed work, estimated hours, taken hours  
- **Outputs:** `status_entries` row with `timeAchieved`, `targetAchieved`, `status`  
- **Rules:**
  - Misc: hours 1–4; target N/A; status `N/A`
  - Other tasks: hours &gt; 0; target from division override or standard map
  - Achievement ≥100% → `Achieved`, else `Keep Trying!`
- **Components:** `App.jsx` form; `getTargetForEntry`

---

## S03 — Review Daily Summary

- **Inputs:** Role-scoped entries; period Day / Week / Month; Team or Individual  
- **Outputs:** Weighted target/time averages; task groups; delay-based suggestions  
- **Rules:** Week = Monday–Sunday local; Misc excluded from target avg, included in time avg; suggestion when avg delay &gt; 20%  
- **Components:** `DailySummary`, `targetUtils`

---

## S04 — Analyze Overview / Trends

- **Inputs:** Filtered entries (client, performer, group-by)  
- **Outputs:** Charts, ranking (month), overtime/bottleneck tables  
- **Rules:** Trends bucket monthly/quarterly/yearly; bottleneck suggests lower target when delay &gt; 20%  
- **Components:** `Dashboard`, `OverviewDashboard`, `TrendsDashboard`

---

## S05 — Manage division targets

- **Inputs:** Client, sub-division, task type, target value  
- **Outputs:** Upsert/delete in `division_targets`  
- **Rules:** Used for entry and analytics achievement when matching scope  
- **Components:** `DivisionTargetsManager`

---

## S06 — Score Performance Rating

- **Inputs:** Entries + profile map; group Individual/Team/Process; period key or week range  
- **Outputs:** Ranked scores, bands, doughnut/bar charts, improvement tips, CSV/XLSX  
- **Rules:** 60/40 composite capped; Misc = hours÷8×100; Excellent/Good/Needs Improvement  
- **Components:** `PerformanceRating`, `performanceRating.js`  
- **Deep link:** `#analytics?tab=ratings&...`

---

## S07 — Export data

- **Inputs:** Filtered or all entries; or rating rows + detail entries  
- **Outputs:** `.csv` / `.xlsx` downloads  
- **Components:** `DataExport`, `exportUtils`

---

## S08 — Administer users and clients

- **Inputs:** Role, status, client/sub-division assignments  
- **Outputs:** Updated `profiles` / `clients`  
- **Rules:** Email Verified vs Pending from `email_confirmed_at`; status active/idle/archive  
- **Components:** `UserManagement`, `ClientManagement`, `AdminUserRow`

---

## S09 — Invite / provision users

| Mode | Skill behavior |
|------|----------------|
| Admin Invite | Email + role → `invite-user` function → invite email → InviteAccept |
| Add New User | Immediate `signUp` + role on profile |
| Provision User | Clipboard `#signup` link; default performer |

- **Resend:** Pending users in User Management (GM / super_admin)  
- **Duplicate:** Verified email rejected on new invite  

---

## S10 — Manage workflows

- **Inputs:** Workflow name; user assignments  
- **Outputs:** `workflows` / `workflow_assignments`  
- **Rules:** RLS may scope entries by workflow membership  
- **Components:** `WorkflowManager`

---

## S11 — Weekly division performance email

- **Inputs:** Previous Mon–Sun entries; profiles  
- **Outputs:** Email per client + sub_division to group leads (managers CC); deep link to ratings  
- **Rules:** Idempotent via `weekly_report_deliveries`; service-role must keep division isolation  
- **Components:** Edge Function `weekly-performance-report`  
- **Docs:** `docs/WEEKLY_PERFORMANCE_REPORTS.md`

---

## Role × skill matrix (summary)

| Skill | Performer | Team/Group Lead | Manager | GM / Super Admin |
|-------|-----------|-----------------|---------|------------------|
| S01 Auth | Y | Y | Y | Y |
| S02 Log entry | Own | Own (+ team view) | Self + others | Self + others |
| S03 Summary | Own | Team/individual | Broad | Broad |
| S04–S07 Analytics | Limited | Scoped | Broad | Broad |
| S05 Targets | — | Y* | Y | Y |
| S08–S10 Admin | — | — | Partial | Full |
| S09 Admin Invite | — | — | — | Y |

\*Division Targets tab available to leads/managers as mounted in Dashboard.
