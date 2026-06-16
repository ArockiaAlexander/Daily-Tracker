# Gmail SMTP Setup for Supabase (CBPET Daily Tracker)

Step-by-step guide to send Supabase Auth emails (password reset, signup confirmation) through **Gmail** or **Google Workspace**.

Use this for **internal team** use (small user count). For larger production apps, prefer [Resend](./EMAIL_SETUP_GUIDE.md#recommended-setup-custom-domain-email-production).

---

## Before you start

| Requirement | Details |
|-------------|---------|
| Google account | Personal Gmail **or** Google Workspace (company email) |
| 2-Step Verification | **Required** to create an App Password |
| Supabase project | Admin access to Authentication → SMTP Settings |
| App URL | Your tracker URL (e.g. `https://tracker.yourcompany.com`) |

---

## Gmail SMTP credentials (reference)

| Field | Value |
|-------|--------|
| **Host** | `smtp.gmail.com` |
| **Port** | `587` (TLS — recommended) or `465` (SSL) |
| **Username** | Full Gmail address (e.g. `tracker-notifications@gmail.com` or `noreply@yourcompany.com`) |
| **Password** | **App Password** (16 characters) — not your normal Gmail password |
| **Sender email** | Same as Username |
| **Sender name** | `CBPET Daily Tracker` |

> **Do not** use your regular Google password in Supabase. Always use an **App Password**.

---

## Part 1 — Create a Google App Password

### Step 1: Enable 2-Step Verification

1. Open [Google Account → Security](https://myaccount.google.com/security)
2. Under **How you sign in to Google**, click **2-Step Verification**
3. Follow the steps to turn it on (phone or authenticator app)

*(Google Workspace admins: users must be allowed to use App Passwords — Admin Console → Security → Less secure apps / App access controls.)*

### Step 2: Generate App Password

1. Go to [Google Account → Security → App passwords](https://myaccount.google.com/apppasswords)  
   *(If link is hidden, search “App passwords” in account settings after 2FA is on.)*
2. **Select app:** Mail  
3. **Select device:** Other (Custom name) → type `Supabase CBPET Tracker`
4. Click **Generate**
5. Copy the **16-character password** (e.g. `abcd efgh ijkl mnop`)  
   Remove spaces when pasting into Supabase: `abcdefghijklmnop`

Save this password — you cannot view it again.

### Step 3 (recommended) — Use a dedicated mailbox

For internal tracking, create a dedicated account or alias:

| Option | Example | Notes |
|--------|---------|-------|
| Personal Gmail | `cbpet.tracker@gmail.com` | Free; ~500 emails/day limit |
| Workspace user | `noreply@yourcompany.com` | Professional; uses your domain |
| Workspace group alias | `tracker@yourcompany.com` | Forwards to admin inbox |

Use that address as both **Username** and **Sender email** in Supabase.

---

## Part 2 — Configure Supabase SMTP

### Step 4: Open SMTP settings

1. [Supabase Dashboard](https://supabase.com/dashboard) → your project
2. **Authentication** → **Email** (under Notifications) → **SMTP Settings**  
   *(Alternative path: Project Settings → Authentication → SMTP)*

### Step 5: Enter Gmail SMTP details

1. Toggle **Enable Custom SMTP** → **ON**
2. Fill in:

| Supabase field | Value |
|----------------|-------|
| **Sender email** | `your-mailbox@gmail.com` (or `@yourcompany.com`) |
| **Sender name** | `CBPET Daily Tracker` |
| **Host** | `smtp.gmail.com` |
| **Port number** | `587` |
| **Username** | Same as Sender email |
| **Password** | App Password (16 chars, no spaces) |

3. Click **Save**

### Step 6: If port 587 fails

Try these alternatives in order:

| Port | Encryption | When to use |
|------|------------|-------------|
| `465` | SSL | Network blocks 587 |
| `587` | TLS/STARTTLS | Default — try first |

Username and App Password stay the same.

---

## Part 3 — URL configuration (required)

Links in emails must match your app. This project uses **hash routes**.

### Step 7: Site URL

**Authentication** → **URL Configuration**

| Setting | Example |
|---------|---------|
| **Site URL** | `https://tracker.yourcompany.com` |

### Step 8: Redirect URLs

Add every URL below (adjust domain):

```text
https://tracker.yourcompany.com
https://tracker.yourcompany.com/#login
https://tracker.yourcompany.com/#signup
https://tracker.yourcompany.com/#reset-password
http://localhost:5173
http://localhost:5173/#login
http://localhost:5173/#signup
http://localhost:5173/#reset-password
```

Click **Save**.

---

## Part 4 — Auth settings (internal team)

**Authentication** → **Providers** → **Email**

| Setting | Internal recommendation |
|---------|-------------------------|
| Enable Email provider | ✅ On |
| Confirm email | ❌ Off (faster onboarding) |
| Secure password change | ✅ On |

Run once in **SQL Editor**:

```text
sql_commands/RLS_PROFILE_ROLE_FIX.sql
```

---

## Part 5 — Test

### Test forgot password

1. Open the app → **Recover?**
2. Enter an email that exists in **Supabase → Authentication → Users**
3. Check inbox (and **Spam**) for mail from your Gmail sender
4. Click the link → app should open **`#reset-password`**
5. Set a new password and log in

### Test admin reset (optional)

1. Log in as `super_admin` or `general_manager`
2. Click 🔑 **Reset User Password**
3. Select user → enter email if needed → **Send Reset Link**

### Check delivery

| Where | What to look for |
|-------|------------------|
| Gmail **Sent** folder | Outgoing auth emails |
| Supabase **Authentication → Logs** | Send attempts / errors |
| User inbox | Reset or confirm message |

---

## Gmail sending limits

| Account type | Daily limit (approx.) | Good for |
|--------------|----------------------|----------|
| Personal Gmail | ~500 emails/day | Small internal team (< 50 users) |
| Google Workspace | ~2,000 emails/day | Company internal apps |
| Supabase default (no SMTP) | ~3–4/hour | Not recommended |

For password resets only (internal tracker), Gmail limits are usually enough.

---

## Google Workspace SMTP relay (advanced)

If your IT team manages Google Workspace, they may prefer **SMTP relay** instead of a single mailbox:

| Field | Value |
|-------|--------|
| Host | `smtp-relay.gmail.com` |
| Port | `587` |
| Auth | IP allowlist or SMTP credentials (Workspace admin configures) |

Setup: [Google Workspace SMTP relay guide](https://support.google.com/a/answer/176600)

Ask IT for relay host, port, and whether IP allowlisting is required.

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| **Authentication failed** | Use App Password, not normal password; confirm 2FA is on |
| **App passwords option missing** | Enable 2-Step Verification; Workspace admin may block app passwords |
| **Connection timeout on 587** | Try port `465` |
| **Email not received** | Check Spam; verify user exists in Auth → Users |
| **Link opens wrong page** | Add `#reset-password` to Redirect URLs |
| **Rate limit / too many emails** | Gmail daily cap hit; wait 24h or switch to Resend |
| **Sender rejected** | Username must match Sender email exactly |
| **Less secure app blocked** | Do not use normal password — only App Password with 2FA |

---

## Security notes (internal production)

- Use a **dedicated** mailbox (not your personal daily email)
- Store App Password only in Supabase SMTP settings (not in git)
- Rotate App Password if exposed: revoke old one in Google → create new → update Supabase
- Do not commit `.env` or SMTP passwords to the repository

---

## Gmail vs Resend (quick choice)

| | Gmail SMTP | Resend |
|---|------------|--------|
| Setup time | ~15 min | ~30–60 min (DNS) |
| Custom domain sender | Workspace only (`@yourcompany.com`) | Any verified domain |
| Best for | Internal team, low email volume | Production, branded `noreply@domain` |
| Free tier | Gmail / Workspace account | ~100 emails/day |

**Internal CBPET tracker:** Gmail SMTP is fine for password reset only.  
**Branded company email:** Use Resend + DNS (see [EMAIL_SETUP_GUIDE.md](./EMAIL_SETUP_GUIDE.md)).

---

## Quick copy-paste checklist

```text
[ ] 2-Step Verification enabled on Google account
[ ] App Password created (Mail → Supabase CBPET Tracker)
[ ] Supabase SMTP: smtp.gmail.com : 587
[ ] Username = Sender email = mailbox address
[ ] Password = App Password (no spaces)
[ ] Site URL + redirect URLs (#login, #signup, #reset-password)
[ ] Confirm email OFF (internal)
[ ] RLS_PROFILE_ROLE_FIX.sql executed
[ ] Forgot password test passed
```

---

*Last updated: June 2026*
