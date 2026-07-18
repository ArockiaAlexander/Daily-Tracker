# CBPET Enterprise Migration — Role / RLS Preflight

## Purpose

Before applying Smart Request Hub or other enterprise migrations, align live Postgres RLS with the **active six-role hierarchy** used by the React app and `invite-user` Edge Function.

Active roles only:

- `performer`
- `team_lead`
- `group_lead`
- `manager`
- `general_manager`
- `super_admin`

Do **not** introduce `assistant_manager` in new Request Hub / notification / analytics policies. That name is a legacy enum leftover only.

## Why this is required

Older scripts still authorize `assistant_manager`:

- [`sql_commands/ADD_DIVISION_TARGETS.sql`](../sql_commands/ADD_DIVISION_TARGETS.sql)
- [`sql_commands/CLIENT_HIERARCHY_MIGRATION.sql`](../sql_commands/CLIENT_HIERARCHY_MIGRATION.sql)
- [`sql_commands/Client Structure.sql`](../sql_commands/Client%20Structure.sql)
- Parts of [`sql_commands/RBAC_MIGRATION.sql`](../sql_commands/RBAC_MIGRATION.sql) / [`AUTH_SETUP.sql`](../sql_commands/AUTH_SETUP.sql)

[`UPDATE_USER_STATUS_AND_ROLES.sql`](../sql_commands/UPDATE_USER_STATUS_AND_ROLES.sql) renamed profile rows to `manager` but did not refresh all policies. Managers can appear authorized in the UI while Postgres still denies writes.

## Scripts

1. Apply: [`sql_commands/ROLE_RLS_PREFLIGHT.sql`](../sql_commands/ROLE_RLS_PREFLIGHT.sql)
2. Verify: [`sql_commands/ROLE_RLS_PREFLIGHT_VERIFY.sql`](../sql_commands/ROLE_RLS_PREFLIGHT_VERIFY.sql)

What the preflight does:

- Ensures `manager` and `group_lead` exist on `user_role` if missing.
- Migrates any remaining `assistant_manager` profile rows → `manager`.
- Rewrites `division_targets` write policy to include `manager`.
- Rewrites `clients` manage policy to `super_admin` / `general_manager` / `manager` (matches `ClientManagement.jsx`).
- Replaces `get_user_role_level()` with an active-role map (`assistant_manager` kept only as a legacy alias level).

What it does **not** do:

- Drop the `assistant_manager` enum value (PostgreSQL limitation).
- Rerun `FRESH_SUPABASE_SETUP.sql`.
- Create Smart Request Hub tables.

## Gate (Level 1 + Level 2 build)

**Required before** `SMART_REQUEST_HUB_PHASE1.sql` and `ENTERPRISE_NOTIFICATIONS_PHASE2.sql`.

Do not apply `SMART_REQUEST_HUB_PHASE1.sql` until verification shows:

- Zero profiles with `role = assistant_manager`.
- `division_targets` / `clients` policies reference `manager`.
- New enterprise RLS copy the active six-role list only — never paste from fresh-setup snippets that still say `assistant_manager`.
