# Invite Link & Admin Invite Guide

CBPET supports **three** admin onboarding paths. Use the one that matches the situation.

## Which method to use

| Method | When to use | What happens |
|--------|-------------|--------------|
| **Admin Invite** | You know the email and role now | Invite email is sent; user sets display name + password |
| **Add New User** | Create account immediately | `signUp` with temp password; confirmation email |
| **Provision User** | Share a link (chat/email yourself) | Copies `#signup` link; user self-registers as Performer |

---

## 1. Admin Invite (emailed)

1. Administration → **Admin Invite**
2. Enter **email** and **role**
3. Confirm **Display Name preview** (from email local-part)
4. Click **Send Invite**

Requires Edge Function deploy:

```bash
supabase functions deploy invite-user
```

Secrets / env for the function:

| Name | Purpose |
|------|---------|
| `APP_URL` | App root, e.g. `https://arockiaalexander.github.io/Daily-Tracker/` |
| `SUPABASE_SERVICE_ROLE_KEY` | Provided by platform |
| `SUPABASE_ANON_KEY` | For caller JWT validation |

Invite delivery uses **Supabase Auth SMTP** (your Gmail SMTP settings) — not Resend.

### What the invitee sees

1. Opens the invite link from email
2. App opens **Complete Your Invite**
3. Confirms **Display Name** (editable)
4. Sets **New password** + confirm
5. Continues into the app

### Resend

In **User Management**, pending (unverified) users show a **Resend** button for `super_admin` / `general_manager`.

---

## 2. Add New User (immediate create)

1. Administration → **Add New User**
2. Email, Full Name, Role
3. Account is created; user gets confirmation / uses reset if needed

---

## 3. Provision User (clipboard signup link)

1. Administration → **Provision User**
2. Copy `#signup` link or invite message
3. User registers with name, email, password
4. Default role is **Performer** — assign role later in User Management

Example link:

```text
https://your-app-url/#signup
```

---

## Email verified status

Run SQL once:

```text
sql_commands/EMAIL_CONFIRMED_SYNC.sql
```

This adds `profiles.email_confirmed_at` and syncs from `auth.users`.

User Management then shows:

- **Verified** — email confirmed
- **Pending** — not confirmed yet

Filters: All email / Verified / Pending.

---

## Redirect URLs

In Supabase → Authentication → URL Configuration, keep Site URL as your app origin (no hash). Invite/recovery tokens are handled by the app via hash fragments.

Also ensure Redirect URLs include your production and localhost origins.

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Invite button fails | Deploy `invite-user` function; check `VITE_SUPABASE_URL` |
| No invite email | Check Auth → SMTP (Gmail); spam folder |
| Verified always Pending | Run `EMAIL_CONFIRMED_SYNC.sql` and refresh |
| User already exists | Use Resend for pending, or edit role in User Management |
| Invite opens login only | Confirm invite callback sets `#invite-accept` |

---

*Updated: July 2026*
