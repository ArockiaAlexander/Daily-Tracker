# Invite Link First-Time Password Guide

This guide explains what happens when a new user opens the invite link for the first time.

## Short answer

If the user comes through the signup invite link, they set their password directly on the signup page.

They do not need an admin to set the password for them.

## Current flow in this project

The invite link points users to the signup route.

Example:

```text
https://your-app-url/#signup
```

When the user opens that link:

1. the signup page opens
2. the user enters name, email, password, and confirm password
3. the user submits the form
4. Supabase creates the auth account
5. the database trigger creates the `public.profiles` row
6. the user can log in with the same password they just created

## Step-by-step for the user

1. Open the invite link shared by admin.
2. Wait for the signup page to load.
3. Enter your full name.
4. Enter your email address.
5. Enter a password.
6. Re-enter the same password in confirm password.
7. Click the signup button.
8. Complete any email confirmation if Supabase asks for it.
9. Log in with the same email and password.

## What password should the user enter

The user chooses their own password during signup.

Recommended:

- at least 8 characters
- mix of uppercase, lowercase, number, and symbol if possible
- avoid using name or email in password

## What happens after signup

By default, the new user is created in `profiles` with the default role from the system.

In your current project, that is usually:

- `performer`

If the admin wants a different role later, they can update it from the app.

## Important difference from admin-created users

There are two different onboarding paths:

### Invite link signup

- user opens `#signup`
- user creates their own password on the form
- user signs in with that password

### Admin adds user from the dashboard

- admin creates the account
- user usually receives email setup/reset flow
- user sets password from email link

So if you are using the invite link, the password is created by the user on the first page itself.

## Troubleshooting

### User says "I opened the link but I don’t see signup"

Check:

- the link really ends with `#signup`
- the app is connected to the correct Supabase project
- the browser is not stuck on an old session

Example valid link:

```text
http://localhost:5173/#signup
```

### User says "Signup worked but I can’t log in"

Check:

1. they are using the same email they signed up with
2. they are using the same password they created on signup
3. they completed email verification if required
4. their user exists in `public.profiles`

Admin can verify with:

```sql
select id, email, performer_name, role
from public.profiles
order by created_at desc;
```

### User forgot the password they created during signup

They should:

1. click `Forgot Password`
2. use the reset email flow

Or admin can send a reset link from the app.

## Admin note

Invite-link users typically enter the system as self-registered users.

If they need a role like:

- `team_lead`
- `assistant_manager`
- `general_manager`

then the admin should update the role after signup from the user management section.

## Related docs

- [`FIRST_USER_SETUP_GUIDE.md`](d:/PERSONAL/LIVE_PROJECTS/CBPET/Daily-Tracker/docs/FIRST_USER_SETUP_GUIDE.md)
- [`ADD_NEW_USER_GUIDE.md`](d:/PERSONAL/LIVE_PROJECTS/CBPET/Daily-Tracker/docs/ADD_NEW_USER_GUIDE.md)
- [`MANAGER_TEAM_LEAD_PASSWORD_SETUP.md`](d:/PERSONAL/LIVE_PROJECTS/CBPET/Daily-Tracker/docs/MANAGER_TEAM_LEAD_PASSWORD_SETUP.md)
