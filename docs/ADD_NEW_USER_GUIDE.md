# Adding New Users - Complete Guide

## Overview
This guide walks you through adding new users to the CBPET Daily Tracker system. There are **two methods** depending on your access level and use case.

---

## Prerequisites

### Required Access Level
- **Super Admin** (ayaz@company.io) - Full access to all user management features
- **General Manager** (alex@company.io) - Full access to all user management features
- **Other Roles** - ❌ Cannot add new users

### System Requirements
- ✅ Active internet connection
- ✅ Super Admin or General Manager logged in
- ✅ Valid email address for new user
- ✅ User not already in system

---

## Method 1: Add New User (Recommended for Full Setup)

### When to Use This Method
✅ Creating a new employee/contractor account  
✅ You have password requirements for the user  
✅ You need to assign a specific role immediately  
✅ User needs immediate access  

### Step-by-Step Instructions

#### **STEP 1: Log In as Admin**
1. Navigate to the CBPET Daily Tracker login page
2. Enter your email: `ayaz@company.io` or `alex@company.io`
3. Enter your password
4. Click **"Login"**
5. Wait for dashboard to load (may take 5-10 seconds)

✅ You should see:
- Dashboard with analytics tabs
- **Users Management** tab (purple) appears in navigation
- Top navigation with 🔒, 🔑, 🌙, and 🚪 buttons

---

#### **STEP 2: Navigate to User Management**
1. Look at the tab bar below the header:
   - **Entry Form** (blue)
   - **Analytics** (blue)
   - **User Management** (purple) ← Click this

2. Click on **"User Management"** tab
3. Wait for user list to load

✅ You should see:
- A list of existing users in a table
- Search bar to filter users
- **"Add New User"** button (GREEN) at top
- **"Provision User"** button (PURPLE) at top

---

#### **STEP 3: Click "Add New User" Button**
1. Look at the top right of the User Management section
2. Find the **GREEN** button that says **"+ Add New User"**
3. Click it

✅ A modal dialog should pop up with:
- "Add New User" heading
- Email Address field
- Full Name field
- Assign Role dropdown
- Create User button
- Cancel button

---

#### **STEP 4: Enter Email Address**
1. Click the **"Email Address"** field
2. Type the new user's email (valid format required)

**Valid email formats:**
```
user@company.io
newuser@gmail.com
employee@example.com
first.last@domain.com
```

❌ **Invalid formats (will be rejected):**
```
user@cbpet.co        ← Invalid domain
username              ← No @ symbol
@company.io           ← No username
user @company.io      ← Space in email
```

**Example:**
```
Email: sumitha.new@company.io
```

---

#### **STEP 5: Enter Full Name**
1. Click the **"Full Name"** field
2. Type the user's full name

**Format guidelines:**
- Use proper capitalization: "John Smith" ✅
- Use lowercase: "john smith" ⚠️ (works but not recommended)
- Use uppercase: "JOHN SMITH" ⚠️ (works but not recommended)

**Example:**
```
Full Name: Sumitha Kumar
```

---

#### **STEP 6: Assign Role**
1. Click the **"Assign Role"** dropdown
2. Select one of 5 available roles:

| Role | Icon | Best For |
|------|------|----------|
| 👤 **Performer** | Person icon | Regular team members doing work |
| 👨‍💼 **Team Lead** | Manager icon | Team managers/supervisors |
| 📊 **Assistant Manager** | Chart icon | Middle management |
| 🏢 **General Manager** | Building icon | High-level management |
| 🔐 **Super Admin** | Lock icon | System administrators |

**Common Assignments:**
- New employee → **Performer**
- Team supervisor → **Team Lead**
- Department head → **General Manager**
- System admin → **Super Admin**

**Example:**
```
Role: Performer
```

---

#### **STEP 7: Review Information**
Before clicking Create, verify:

```
✓ Email looks correct: sumitha.new@company.io
✓ Name is spelled right: Sumitha Kumar
✓ Role makes sense: Performer
```

**Preview box shows:**
```
✅ User will be created with the selected role and full access permissions.
```

---

#### **STEP 8: Create User**
1. Click the **GREEN** button: **"Create User"**
2. Wait 3-5 seconds for processing

✅ You'll see:
- Success message in toast notification (top right)
- Modal closes automatically
- New user appears in user list

⏱️ **What happens behind the scenes:**
1. Supabase creates auth user with temporary password
2. System creates user profile with assigned role
3. Confirmation email sent to user's email
4. User added to appropriate access groups

---

#### **STEP 9: User Receives Email**
The new user will receive an email from Supabase:

```
Subject: Confirm your signup
From: noreply@supabase.io

Body:
Hi,

Click this link to confirm your email and set your password:
[Confirmation Link]

This link expires in 24 hours.
```

---

#### **STEP 10: User Sets Up Account**
1. User clicks the confirmation link in email
2. Browser opens to password reset page
3. User enters a new password (6+ characters)
4. User logs in with:
   - Email: Their email address
   - Password: The one they just created

✅ **User now has full access to the system!**

---

## Method 2: Provision User (For Early-Stage Setup)

### When to Use This Method
✅ You don't want to set individual passwords  
✅ User will self-register via signup link  
✅ User starts as **Performer** role  
✅ Admin can change role later  

### Step-by-Step Instructions

#### **STEP 1-2: Same as Method 1**
Log in as admin → Navigate to User Management

---

#### **STEP 3: Click "Provision User" Button**
1. Find the **PURPLE** button: **"+ Provision User"**
2. Click it

✅ A modal shows:
- Professional Invite Link (copy button)
- Invite message template (copy button)
- Instructions for sharing

---

#### **STEP 4: Copy Signup Link**
1. Click the **copy icon** next to the signup link
2. Link copied to clipboard:
   ```
   https://your-domain.com#signup
   ```

---

#### **STEP 5: Share Link with User**
Send via email/message:
```
Hi [User Name],

You've been invited to join CBPET Daily Tracker.
Please register here:
https://your-domain.com#signup

You'll be set up as a Performer. Your admin can
adjust your role later if needed.
```

---

#### **STEP 6: User Self-Registers**
1. User clicks the link
2. User fills in signup form:
   - Email
   - Password (6+ characters)
   - Confirm password
3. User clicks **"Create Account"**
4. User automatically logged in
5. User's profile created with **default role: Performer**

---

#### **STEP 7: Admin Assigns Final Role (Optional)**
If user needs different role:
1. Admin goes to User Management
2. Finds the user in list
3. Changes **Role** dropdown
4. Clicks **"Save"** button
5. User's new role applied immediately

✅ **User now has appropriate access!**

---

## Quick Reference: Both Methods Side-by-Side

| Aspect | Method 1: Add New User | Method 2: Provision User |
|--------|----------------------|-------------------------|
| **Who Uses** | Admin (direct entry) | User (self-signup) |
| **Initial Role** | Admin assigns | Performer (default) |
| **Password** | Temp password → email | User creates in signup |
| **Steps** | 8 (all admin) | 6 (mixed) |
| **Speed** | Medium (email + confirm) | Fast (direct signup) |
| **Best For** | Immediate access | Bulk invitations |

---

## Common Scenarios

### Scenario 1: Hire New Performer
```
STEP 1: Log in as Super Admin
STEP 2: Go to User Management
STEP 3: Click "Add New User"
STEP 4: Email: newperformer@company.io
STEP 5: Name: John Performer
STEP 6: Role: Performer
STEP 7: Review
STEP 8: Create User
STEP 9: John gets email
STEP 10: John confirms and logs in
✅ Done!
```

### Scenario 2: Promote to Team Lead
```
STEP 1: Log in as Super Admin
STEP 2: Go to User Management
STEP 3: Find user "John Performer" in list
STEP 4: Change Role from "Performer" to "Team Lead"
STEP 5: Click "Save"
STEP 6: John's role updated
STEP 7: Refresh page to see changes
✅ Done!
```

### Scenario 3: Invite Multiple Users
```
STEP 1: Log in as General Manager
STEP 2: Go to User Management
STEP 3: Click "Provision User"
STEP 4: Copy signup link
STEP 5: Send to 10 people via email
STEP 6: Each person signs up individually
STEP 7: Adjust roles as needed
✅ Done!
```

---

## Troubleshooting

### Problem: "Email address is invalid"
**Cause:** Domain not recognized by Supabase

**Solutions:**
- Use `@company.io` domain ✅
- Use `@gmail.com` for testing ✅
- Use `@example.com` for testing ✅
- Check for spaces in email
- Check for typos

**Example of valid emails:**
```
✅ user@company.io
✅ john.smith@gmail.com
✅ alice@example.com
❌ user@cbpet.co (invalid domain)
❌ user name@company.io (space)
```

---

### Problem: "User Management tab not showing"
**Cause:** You're not logged in as Super Admin or General Manager

**Verify:**
1. Check top-left corner: What role does it show?
2. Only Super Admin and General Manager see this tab
3. If you're another role, ask your admin to add user

**Identity Check:**
```
✅ Super Admin: ayaz@company.io
✅ General Manager: alex@company.io
❌ Team Lead, Performer, etc. - no access
```

---

### Problem: "User created but can't log in"
**Causes & Solutions:**

| Cause | Solution |
|-------|----------|
| User hasn't clicked email link | Send them the confirmation email again |
| Email link expired (24 hrs) | User asks admin to reset password |
| Wrong email address | Admin resets password via Key icon 🔑 |
| Wrong password | User clicks "Forgot Password" to reset |

---

### Problem: "Role not updating"
**Cause:** Permission issue or cache

**Solution:**
1. Verify you're Super Admin or General Manager
2. Find user in the list
3. Change the Role dropdown
4. Click **"Save"** button (not just changing dropdown)
5. **Refresh the page** (F5 or Cmd+R)
6. Check if role changed

---

### Problem: "Can't find user in list"
**Solution:**
1. Use the **Search bar** at top of user table
2. Type user's name or email
3. List filters in real-time
4. If not found, user may not exist yet
5. Click **"Refresh"** button (circular arrows) to reload

---

### Problem: "Error adding user: email rate limit exceeded"
**Cause:** Too many confirmation emails sent too quickly (Supabase rate limiting)

**Immediate Solutions:**
1. **Wait 15-30 minutes** - Rate limit resets automatically
2. **Use "Provision User" instead** - Share signup link instead of sending admin emails
3. **Space out user creation** - Wait 5 minutes between each user addition
4. **Contact Supabase** - If problem persists, may need plan upgrade

**Which Method to Use:**
- **1-2 users:** Use "Add New User", wait between each
- **3-10 users:** Use "Provision User" (no email limit)
- **10+ users:** Contact your Supabase plan admin

**Example Workflow for Multiple Users:**
```
10:00 AM - Add User 1 → Success ✅
10:05 AM - Add User 2 → Success ✅
10:10 AM - Add User 3 → Success ✅
(Rate limit triggered if less than 5 min gaps)
```

---

## Email Address Guidelines

### Recommended Domains
```
✅ @company.io      - Primary company domain (BEST)
✅ @gmail.com       - Testing with Gmail accounts
✅ @outlook.com     - Testing with Outlook
✅ @example.com     - Testing (won't receive emails)
```

### NOT Recommended
```
❌ @cbpet.co        - Doesn't work with Supabase validation
❌ @test.local      - Not a valid public domain
❌ @localhost       - Not a valid public domain
❌ old.cbpet.io     - May have DNS issues
```

### Email Format Rules
```
Valid: user@company.io
Valid: john.smith@company.io
Valid: john_smith@company.io
Valid: john123@company.io

Invalid: @company.io              (no user)
Invalid: john smith@company.io    (space)
Invalid: john@                    (no domain)
Invalid: john company.io          (no @)
```

---

## Security Notes

### During User Creation
- ✅ Admin enters email and name
- ✅ Admin assigns role (all 5 levels available)
- ✅ Supabase generates temporary password
- ✅ User receives secure email link
- ✅ User must click link to verify email
- ✅ User must create their own password
- ✅ User then logs in with email + password

### Passwords
- ❌ Admin never sees user password
- ❌ Passwords not stored in plain text
- ✅ Each user chooses their own password
- ✅ Passwords encrypted in transit (HTTPS)
- ✅ Passwords hashed in database

### Access Control
- Super Admin can manage all users
- General Manager can manage all users
- Other roles cannot add/edit users
- Role-based features enforced at database level (RLS)
- All changes logged for audit trail

---

## Role Details

### Performer (👤)
- **Access:** Can enter own daily logs
- **Can see:** Own data, team leaderboard
- **Cannot:** Edit other users, manage system

### Team Lead (👨‍💼)
- **Access:** All performer features
- **Can see:** Team member logs, team analytics
- **Can do:** Assign work, approve logs
- **Cannot:** Create users, manage other teams

### Assistant Manager (📊)
- **Access:** Team Lead features
- **Can see:** Multiple team analytics
- **Can do:** Manage performers & team leads
- **Cannot:** Create users, manage general settings

### General Manager (🏢)
- **Access:** All features
- **Can do:** Everything
- **Includes:** User creation, role management
- **Best for:** Department heads

### Super Admin (🔐)
- **Access:** Complete system access
- **Can do:** Everything General Manager + override system
- **Best for:** System administrators
- **Count:** Typically 1-2 per organization

---

## Next Steps

### After Adding User
1. **Confirm they received email** - Check their inbox/spam
2. **Help them set password** - If they need assistance
3. **Verify they can log in** - Have them test login
4. **Assign to team** (optional) - If Team Lead/Performer with team
5. **Test their access** - Verify they see correct data

### First Day Setup
- [ ] User completes signup
- [ ] User logs in successfully
- [ ] User sees their role badge
- [ ] User can submit daily logs
- [ ] User can see analytics (if applicable)
- [ ] User receives team assignment (if applicable)

---

## Support Contacts

### Technical Issues
- **Email:** admin@company.io
- **Slack:** #tech-support
- **Hours:** 9 AM - 5 PM EST

### Account Lockout
1. User can't log in → Click "Forgot Password"
2. User resets via email link
3. If email not working, admin uses Key 🔑 icon to reset

### Questions About Roles
Contact your Super Admin (ayaz@company.io) or ask your manager.

---

## FAQ

**Q: How long does user creation take?**
A: Instant in system, but email delivery depends on email provider (usually 1-5 minutes).

**Q: Can I add a user without email?**
A: No, email is required for password reset and notifications.

**Q: What if user loses their password?**
A: They click "Forgot Password" or admin clicks Key 🔑 icon to reset.

**Q: Can I edit user information after creation?**
A: Yes, you can change role, client_id. Name/email cannot be changed from UI.

**Q: How many users can I add?**
A: Unlimited (depends on Supabase plan).

**Q: Can users add other users?**
A: Only Super Admin and General Manager can add users.

**Q: What if email is already in use?**
A: Error message: "User already exists". Use a different email.

**Q: Can I change user's email?**
A: Not from this UI. Contact Supabase support or database admin.

**Q: I got "email rate limit exceeded" error**
A: Wait 15-30 minutes or use "Provision User" instead. Supabase limits emails to prevent spam. Spacing out user additions (5 min apart) also helps.

---

## Checklist for Adding Users

### Pre-Addition
- [ ] Username/email decided (user@company.io format)
- [ ] Full name ready
- [ ] Role determined (Performer, Team Lead, etc.)
- [ ] You're logged in as Super Admin or General Manager

### During Addition
- [ ] Clicked User Management tab
- [ ] Clicked "Add New User" button
- [ ] Entered valid email
- [ ] Entered full name
- [ ] Selected appropriate role
- [ ] Clicked "Create User"

### Post-Addition
- [ ] Saw success message
- [ ] User appears in user list
- [ ] User received confirmation email
- [ ] User clicked email link
- [ ] User created password
- [ ] User logged in successfully

---

*Last Updated: March 7, 2026*  
*Version: 2.0*  
*Audience: Super Admin, General Manager, New Users*
