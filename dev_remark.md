# Developer remarks — CBPET Daily Tracker

Practical notes for maintainers. Prefer this file over outdated marketing README sections.

---

## 1. Do not break live databases

- **Never** re-run [`sql_commands/FRESH_SUPABASE_SETUP.sql`](sql_commands/FRESH_SUPABASE_SETUP.sql) on an existing production project.
- Use incremental scripts (`MISC_HOURS_*`, `EMAIL_CONFIRMED_SYNC`, hierarchy, targets, weekly deliveries).
- Constraints added with `NOT VALID` still enforce new inserts; they do not rewrite old rows.

### Recommended SQL order for current feature set (existing DB)

1. Hierarchy / clients / roles (if not already): `CLIENT_HIERARCHY_MIGRATION.sql`, role/status updates as needed  
2. `ADD_DIVISION_TARGETS.sql`  
3. `MISC_HOURS_RANGE_CONSTRAINT.sql` (replaces global 1–4)  
4. `EMAIL_CONFIRMED_SYNC.sql`  
5. `WEEKLY_REPORT_DELIVERIES.sql` (if using weekly email)

---

## 2. Hours rule (important)

- **Only `Miscellaneous`** is limited to 1–4 hours (estimated + taken).
- Other tasks: any positive hours; placeholders suggest a full day (e.g. 8.0).
- Auto-estimated hours for productive tasks are **not implemented yet** — leave manual.

If an old global 1–4 constraint is still live, inserts of 6–8h on Preedit will fail until `MISC_HOURS_RANGE_CONSTRAINT.sql` is applied.

---

## 3. Edge Functions

| Function | Path | Secrets / notes |
|----------|------|-----------------|
| `invite-user` | `supabase/functions/invite-user` | `APP_URL`, platform `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ANON_KEY`; caller must be GM/super_admin JWT |
| `weekly-performance-report` | `supabase/functions/weekly-performance-report` | `APP_URL`, Gmail SMTP secrets if switched from Resend; partition by client+sub_division |

Deploy example:

```bash
supabase functions deploy invite-user
supabase functions deploy weekly-performance-report
```

Frontend calls invite via:

`POST ${VITE_SUPABASE_URL}/functions/v1/invite-user`  
Headers: `Authorization: Bearer <user_access_token>`, `apikey: <anon>`

---

## 4. Email systems are separate

| Channel | What it sends | Config |
|---------|---------------|--------|
| Supabase Auth SMTP (Gmail) | Signup confirm, password reset, **inviteUserByEmail** | Dashboard → Auth → SMTP |
| Weekly report function | Custom HTML division reports | Function SMTP/API secrets — **not** Auth SMTP settings |

Do not expect Auth SMTP alone to power arbitrary Edge Function emails unless the function sends via SMTP itself.

---

## 5. Naming inconsistencies to watch

- Entry form / App targets: **`FP Validation`**
- Some analytics / `STANDARD_TARGETS` copies: **`FL Validation`**
- Prefer aligning both to one label over time; until then, division targets and filters may miss matches across the two names.
- Role enum historically used `assistant_manager` in SQL while UI uses `manager` — confirm live enum values before casting in triggers.

---

## 6. Dead / secondary code

- [`src/components/Leaderboard.jsx`](src/components/Leaderboard.jsx) — not mounted in Analytics tabs; Performance Rating is the active ranking UX.
- Duplicate target maps in `App.jsx`, `Dashboard.jsx`, `targetUtils.js` — change all three when adjusting standards.

---

## 7. Routing and auth callbacks

- App tabs: `#form`, `#analytics`, `#admin` (mapped inside `App.jsx`).
- Auth redirect URL must be **origin + base path without `#`**. Tokens arrive in hash; `completeAuthCallback` sets session then sanitizes to `#invite-accept` / `#reset-password` / `#login`.
- Double-hash quirks (`#login#access_token=...`) are handled in `authRedirect.js`.

---

## 8. Git / deploy

- Production build: `npm run build` → `dist/`; Pages must serve `dist`, not source.
- Push may fail if local Git credentials belong to a user without write access to `ArockiaAlexander/Daily-Tracker` (403). Fix remotes/credentials before forcing pushes.
- Commit only related files; do not commit `.env`.

---

## 9. Testing

```bash
npm test    # performanceRating unit tests (node:test)
npm run build
```

Manual scenarios: [`test_use_case.md`](./test_use_case.md).

---

## 10. Product backlog hints (not implemented)

- Automated estimate hours for non-Misc tasks  
- Unify FP/FL Validation naming  
- Mount or remove Leaderboard  
- Harden invite **resend** email delivery when user already exists (Auth may only regenerate links)  
- Server-side date-range fetch if entry volume grows beyond full client-side lists
