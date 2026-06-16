# Email Configuration Guide — Custom Domain & Multi-User Auth

Supabase Auth sends all transactional emails (signup confirmation, password reset, magic links) through its mail system. **By default this uses Supabase's shared sender** (`noreply@mail.app.supabase.io`). Emails often land in spam, hit rate limits quickly, and **will not deliver to fake domains** like `@company.io` unless you configure real SMTP.

---

## Why emails are not arriving

| Cause | What you see | Fix |
|-------|--------------|-----|
| **No custom SMTP** | No email, or from `supabase.io` in spam | Configure SMTP (see below) |
| **Fake / unregistered domain** | User created in Auth but inbox empty | Use real mailboxes or SMTP on a domain you control |
| **Confirm email enabled** | Signup succeeds, no login until link clicked | Check spam; or disable confirm for dev only |
| **Redirect URL not whitelisted** | Link opens app but auth fails | Add your app URL in Supabase → Authentication → URL Configuration |
| **Rate limit** | Error: "email rate limit exceeded" | Wait 15–60 min; use Provision User link instead of bulk admin signup |
| **Site URL mismatch** | Reset link goes to wrong host | Set Site URL to your production URL |

---

## Recommended setup: Custom domain email (production)

Use a real domain you own (e.g. `cbpet.com`, `yourcompany.io`) with an SMTP provider.

### Step 1 — Choose an SMTP provider

| Provider | Best for | Notes |
|----------|----------|-------|
| **[Google Workspace / Gmail](GMAIL_SMTP_SETUP.md)** | Already using Google mail | SMTP via App Password; good for small internal teams |
| **[Resend](https://resend.com)** | Simple setup, good deliverability | Free tier; verify domain with DNS |
| **[SendGrid](https://sendgrid.com)** | High volume | Requires sender verification |
| **[Amazon SES](https://aws.amazon.com/ses/)** | AWS users | Cheapest at scale |
| **[Google Workspace](https://workspace.google.com)** | Already using Gmail for company | SMTP relay from `smtp.gmail.com` |
| **[Microsoft 365](https://www.microsoft.com/microsoft-365)** | Outlook / Exchange org | SMTP via `smtp.office365.com` |

### Step 2 — Verify your domain (DNS)

In your SMTP provider dashboard, add DNS records they provide:

- **SPF** — `TXT` record authorizing the provider to send for your domain
- **DKIM** — `CNAME` or `TXT` for signed mail
- **DMARC** (optional but recommended) — `TXT` at `_dmarc.yourdomain.com`

Example (Resend):

```text
Type: TXT   Name: @              Value: v=spf1 include:amazonses.com ~all
Type: TXT   Name: resend._domainkey   Value: (provided by Resend)
```

Wait 5–30 minutes for DNS propagation, then verify in the provider dashboard.

### Step 3 — Configure Supabase SMTP

1. Open **[Supabase Dashboard](https://supabase.com/dashboard)** → your project
2. Go to **Project Settings** → **Authentication** → **SMTP Settings**
3. Enable **Custom SMTP** and fill in:

| Field | Example |
|-------|---------|
| Host | `smtp.resend.com` |
| Port | `465` (SSL) or `587` (TLS) |
| Username | `resend` (provider-specific) |
| Password | Your SMTP API key |
| Sender email | `noreply@yourdomain.com` |
| Sender name | `CBPET Daily Tracker` |

4. Click **Save** and use **Send test email** to confirm delivery.

### Step 4 — URL configuration (required for links in emails)

**Authentication → URL Configuration:**

| Setting | Value |
|---------|-------|
| **Site URL** | `https://your-app-domain.com` (or `http://localhost:5173` for dev) |
| **Redirect URLs** | Add all allowed callbacks: |

```text
http://localhost:5173
http://localhost:5173/#login
http://localhost:5173/#reset-password
http://localhost:5173/#signup
https://your-app-domain.com
https://your-app-domain.com/#login
https://your-app-domain.com/#reset-password
https://your-app-domain.com/#signup
```

This app uses **hash routing** (`#login`, `#signup`, `#reset-password`). Redirect URLs must include the hash variants.

### Step 5 — Email templates (optional)

**Authentication → Email Templates** — customize:

- **Confirm signup** — sent when admin adds user or user registers
- **Reset password** — sent from Forgot Password / Admin Reset
- **Magic link** — if using magic link auth

Set the action link to use your Site URL. Supabase replaces `{{ .ConfirmationURL }}` automatically.

### Step 6 — Auth settings for multi-user onboarding

**Authentication → Providers → Email:**

| Setting | Production | Development |
|---------|------------|-------------|
| Enable Email provider | ✅ On | ✅ On |
| Confirm email | ✅ On (recommended) | Optional off for faster testing |
| Secure email change | ✅ On | ✅ On |

**Multi-user flow with custom domain:**

1. Admin creates users with real emails: `user@yourdomain.com`
2. User receives **Confirm signup** from `noreply@yourdomain.com`
3. User clicks link → lands on app → sets password / logs in
4. Admin assigns role in User Management

**Alternative — no email per user:** Use **Provision User** and share `#signup` link; users self-register with their own `@yourdomain.com` mailbox.

---

## Development / testing without custom SMTP

### Option A — Disable email confirmation (dev only)

Supabase → Authentication → Providers → Email → **Disable "Confirm email"**

Users can log in immediately after signup. **Do not use in production.**

### Option B — Use real personal emails for testing

Use `@gmail.com` addresses you control. Supabase default sender may still go to spam — check Promotions/Spam.

### Option C — Supabase Auth logs

Dashboard → **Authentication → Logs** — confirms whether Supabase attempted to send mail and if it failed.

---

## Syncing email to profiles (app requirement)

Run this migration so admin password reset can read user emails:

```bash
# In Supabase SQL Editor:
# Run sql_commands/RLS_PROFILE_ROLE_FIX.sql
```

This adds `profiles.email`, backfills from `auth.users`, and protects role self-elevation.

---

## Checklist before go-live

- [ ] Custom SMTP configured and test email received
- [ ] SPF + DKIM verified on your domain
- [ ] Site URL set to production domain
- [ ] All `#login`, `#signup`, `#reset-password` redirect URLs whitelisted
- [ ] `RLS_PROFILE_ROLE_FIX.sql` applied
- [ ] First super_admin promoted via SQL after first signup
- [ ] Test full flow: signup → confirm email → login → forgot password → reset

---

## Quick test script

1. Sign up with `test@yourdomain.com` via `#signup`
2. Check inbox (and spam) for confirmation
3. Click link — should open app
4. Log in with email + password
5. Use **Forgot Password** — should receive reset link to `#reset-password`

---

## Common errors

| Error | Solution |
|-------|----------|
| `Email address is invalid` | Use a valid format; some TLDs blocked by Supabase — use a real domain |
| `email rate limit exceeded` | Wait; configure custom SMTP (higher limits); use Provision User link |
| Reset link opens app but no password form | Fixed in app — link must use `#reset-password` redirect |
| Admin add user logs admin out | Fixed in app — session restored after signup |
| User created as performer despite admin selecting role | Run `RLS_PROFILE_ROLE_FIX.sql`; app now UPDATEs profile after signup |

---

*Last updated: June 2026*
