# Manager and Team Lead Password Setup

This guide explains what happens after a Super Admin or General Manager adds a manager or team lead from the app.

It covers:

- how to add them
- how they get their password
- how to reset it later

## Short answer

When you add a manager or team lead from the app, the system creates the account and sends them an email-based setup flow.

The password is not manually fixed by the admin inside the current app flow.

The new user sets their own password by using the email link sent by Supabase.

## Current app behavior

### Add user flow

When Super Admin or General Manager clicks `Add New User`:

1. the app creates the auth user
2. the database/profile row is created
3. the selected role is assigned
4. the user receives an email from Supabase

This is the right flow for:

- `general_manager`
- `assistant_manager`
- `team_lead`
- `performer`

## How the new manager or team lead sets password

### Method 1: First-time setup email

After you add the user from the app:

1. tell the user to check their email inbox
2. ask them to open the Supabase confirmation or setup email
3. they click the link
4. they complete account setup
5. they create or confirm their password
6. they log in with that email and password

### Example

If you add:

- `manager1@company.io` as `general_manager`
- `lead1@company.io` as `team_lead`

then each of those users should complete the email flow from their mailbox before trying to log in normally.

## If the user did not receive the email

Use one of these options.

### Option 1: Admin sends reset link from the app

The current password reset screen in the app sends a password reset email.

It does not directly assign the password typed by the admin.

So the actual working flow is:

1. log in as `super_admin` or `general_manager`
2. click the key/reset password icon
3. select the user
4. submit reset
5. user receives reset email
6. user clicks the email link
7. user sets a new password

## Important note about the current UI

The reset password modal shows `Temporary Password` and `Confirm Password` fields.

But in the current implementation, the app still sends an email reset link instead of setting that typed password directly.

So for now, treat that screen as:

- `Send reset link to user`

not:

- `Admin manually sets user password`

## If the user already logged in once and wants to change password

They can change it themselves:

1. log in
2. click the lock icon
3. enter current password
4. enter new password
5. save

## Recommended process for adding managers and team leads

Use this exact workflow:

1. Log in as `ayaz@company.io` or another admin account.
2. Go to User Management.
3. Click `Add New User`.
4. Enter the email and full name.
5. Choose role:
   - `general_manager`
   - `assistant_manager`
   - `team_lead`
6. Create the user.
7. Tell the user to check email immediately.
8. Ask them to complete the email link flow and create their password.
9. Ask them to log in once.
10. If needed, assign team/workflow after login.

## Best practice

For managers and team leads, the safest approach is:

- admin creates the user
- user creates their own password via email

This avoids sharing passwords over chat, email, or documents.

## Troubleshooting

### User says "I don’t know my password"

That is expected for newly added users.

Tell them:

1. check the signup/confirmation email
2. if not found, check spam
3. if still not found, admin should send a reset link

### User says "I never got the email"

Try:

1. verify the email was entered correctly
2. check spam/junk
3. use the admin reset-password flow
4. wait a few minutes in case of delivery delay

### Admin wants to set password directly

The current app does not truly do that yet.

Right now it uses email reset flow.

If you want true admin-set passwords, that should be implemented with a secure backend or Supabase Admin API, not directly from the browser client.

## Related files

- [`ADD_NEW_USER_GUIDE.md`](d:/PERSONAL/LIVE_PROJECTS/CBPET/Daily-Tracker/docs/ADD_NEW_USER_GUIDE.md)
- [`PASSWORD_MANAGEMENT.md`](d:/PERSONAL/LIVE_PROJECTS/CBPET/Daily-Tracker/docs/PASSWORD_MANAGEMENT.md)
- [`EMAIL_SETUP_GUIDE.md`](d:/PERSONAL/LIVE_PROJECTS/CBPET/Daily-Tracker/docs/EMAIL_SETUP_GUIDE.md)
