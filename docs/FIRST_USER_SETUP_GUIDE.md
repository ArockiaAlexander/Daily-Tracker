# First User Setup Guide

This guide explains the step `Create your first user from the app or Supabase Auth` for a brand-new Supabase project.

Use this when you have already run:

- [`FRESH_SUPABASE_SETUP.sql`](d:/PERSONAL/LIVE_PROJECTS/CBPET/Daily-Tracker/sql_commands/FRESH_SUPABASE_SETUP.sql)

After this, the first two bootstrap accounts should become:

- `ayaz@company.io` -> `super_admin`
- `alex@newgen.co` -> `general_manager`

## What this means

The database script creates the schema, tables, policies, and triggers.

It does not create Supabase Auth users by itself.

A user must first exist in `auth.users`. Once that happens, the trigger created by the SQL automatically creates a matching row in `public.profiles`.

That is why the order is:

1. Run fresh SQL
2. Create the user account(s)
3. Promote those users by email in `profiles`

## Option 1: Create user from the app

Use this if the frontend is already running and connected to the new Supabase project.

### Steps

1. Start the app:

```bash
npm install
npm run dev
```

2. Make sure your `.env` points to the new Supabase project:

```env
VITE_SUPABASE_URL=your-project-url
VITE_SUPABASE_ANON_KEY=your-anon-key
```

3. Open the app in the browser.

4. Go to the signup page.

If your app opens to login, use the signup link or open the URL with `#signup`.

Example:

```text
http://localhost:5173/#signup
```

5. Create these two accounts one by one:

- `ayaz@company.io`
- `alex@newgen.co`

6. After each signup, Supabase Auth creates the auth user.

7. The database trigger automatically creates the matching row in `public.profiles`.

## Option 2: Create user from Supabase Auth dashboard

Use this if you want to seed the first users directly from Supabase.

### Steps

1. Open your Supabase project.
2. Go to `Authentication` -> `Users`.
3. Click `Add user`.
4. Create:

- `ayaz@company.io`
- `alex@newgen.co`

5. Set temporary passwords if needed.
6. Save both users.

After each user is created in Auth, the trigger from the SQL setup creates the corresponding row in `public.profiles`.

## Verify the profile rows were created

Run this in the Supabase SQL Editor:

```sql
select id, email, performer_name, role, created_at
from public.profiles
where email in ('ayaz@company.io', 'alex@newgen.co')
order by email;
```

Expected result:

- both emails exist in `public.profiles`
- role is still `performer` initially

## Promote the first two users

After both users exist, run:

```sql
update public.profiles
set role = case
  when email = 'ayaz@company.io' then 'super_admin'::public.user_role
  when email = 'alex@newgen.co' then 'general_manager'::public.user_role
  else role
end
where email in ('ayaz@company.io', 'alex@newgen.co');
```

## Verify promotion worked

Run:

```sql
select email, performer_name, role
from public.profiles
where email in ('ayaz@company.io', 'alex@newgen.co')
order by email;
```

Expected result:

- `ayaz@company.io` has role `super_admin`
- `alex@newgen.co` has role `general_manager`

## First login flow

### Super Admin

Log in as `ayaz@company.io`.

This account should be able to:

- open the admin section
- manage users
- create workflows
- assign roles
- add future managers and team leads

### General Manager

Log in as `alex@newgen.co`.

This account should be able to:

- access manager-level visibility
- view users and data allowed by current app logic
- support reporting and monitoring

## Recommended next steps

After first login as super admin:

1. Add real managers and team leads.
2. Create teams.
3. Assign users to teams.
4. Create workflows if needed.
5. Test one performer account end to end.

## Troubleshooting

### No row appears in `public.profiles`

Check whether the auth user was really created:

```sql
select id, email, created_at
from auth.users
where email in ('ayaz@company.io', 'alex@newgen.co');
```

If the user exists in `auth.users` but not in `public.profiles`, check whether the trigger exists:

```sql
select trigger_name, event_object_table
from information_schema.triggers
where trigger_schema = 'public'
order by trigger_name;
```

Then run the verification script:

- [`FRESH_SUPABASE_VERIFY.sql`](d:/PERSONAL/LIVE_PROJECTS/CBPET/Daily-Tracker/sql_commands/FRESH_SUPABASE_VERIFY.sql)

### Promotion query updates zero rows

Usually one of these is true:

- the users have not signed up yet
- the email address differs from what was entered
- the new project is not the same one used by the app

Verify with:

```sql
select email, role
from public.profiles
order by created_at desc;
```

### Login works but admin features fail

Check the assigned role:

```sql
select email, role
from public.profiles
where email in ('ayaz@company.io', 'alex@newgen.co');
```

If needed, re-run the promotion query.
