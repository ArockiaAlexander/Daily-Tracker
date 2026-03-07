# Workflow-Wise Access Control - Implementation Complete ✅

## What Was Implemented

### 1. **SQL Migration - WORKFLOW_SETUP.sql**
   - **Workflows Table**: Store workflow metadata (name, description, created_by, is_active)
   - **Workflow Assignments Table**: Junction table linking users to workflows (N:M relationship)
   - **Updated Status Entries**: Added `workflow_id` column for data scoping
   - **RLS Policies**: Comprehensive role-based access control policies
   - **Helper Views**: `user_workflow_view` for quick user-workflow lookups
   - **Indexes**: Performance optimization on frequently queried columns

### 2. **WorkflowManager Component** (src/components/WorkflowManager.jsx)
   - **Create Workflows**: Admins can create new workflows with name + description
   - **View Workflows**: Organized, expandable workflow cards
   - **Assign Users**: Admins can add users to workflows
   - **Remove Users**: Admins can remove users from workflows with confirmation
   - **Delete Workflows**: Cascade deletion of assignments
   - **Error Handling**: User-friendly toast messages for all operations
   - **Dark Mode Support**: Full dark/light theme compatibility

### 3. **App.jsx Integration**
   - **WorkflowManager Import**: Added to component imports
   - **Admin SubTab State**: New state `adminSubTab` to switch between Users & Workflows
   - **Admin Section UI**: Added subtab buttons (👥 Users | 📋 Workflows)
   - **Conditional Rendering**: Shows appropriate UI based on selected subtab
   - **Seamless UX**: Both sections available without page reload

### 4. **RLS Policies** (Workflow-Aware)
   - **SELECT**: Admin/Manager see all, Leads see client-scoped, Performers see own, Workflow members see workflow data
   - **INSERT**: Only admins can assign workflows
   - **DELETE**: Only admins can remove workflows
   - **Soft Access**: Users automatically see workflows they're assigned to

---

## 🚀 Quick Start - First Steps

### **CRITICAL: Run the SQL Migration First**

If you're seeing this error:
```
Failed to fetch workflows: Could not find the table 'public.workflows' in the schema cache
```

**Follow these steps immediately:**

1. **Open Supabase Dashboard** → Your Project → **SQL Editor**
2. **Create a new query** and paste the entire contents of `WORKFLOW_SETUP.sql`
3. **Click "Run"** to execute the migration
4. **Verify Success** - You should see green checkmarks for all statements

**What this migration does:**
- ✅ Creates `workflows` table for workflow metadata
- ✅ Creates `workflow_assignments` table for user-workflow mappings
- ✅ Adds `workflow_id` column to `status_entries` table
- ✅ Sets up RLS policies for workflow-based access control
- ✅ Creates performance indexes
- ✅ Creates helper views for easier querying

**After Running:**
- Reload your app
- The error should disappear
- You can now create workflows as an admin

---

## Detailed: Running the SQL Migration in Supabase

### Step-by-Step Instructions

**1. Open Supabase SQL Editor**
   - Go to your [Supabase Dashboard](https://app.supabase.com)
   - Select your Daily-Tracker project
   - Click **SQL Editor** (left sidebar)
   - Click **New Query** button

**2. Copy the Migration Script**
   - Open `WORKFLOW_SETUP.sql` from your project folder
   - Select all text (Ctrl+A)
   - Copy (Ctrl+C)

**3. Paste into Supabase**
   - Click in the SQL editor query box
   - Paste the SQL (Ctrl+V)
   - You should see the entire migration script

**4. Execute the Migration**
   - Click **Run** button (bottom right or Ctrl+Enter)
   - Watch for green checkmarks on each statement
   - If any errors appear in red, contact support

**5. Verify Tables Were Created**
   - Click **Table Editor** (left sidebar)
   - Look for these tables:
     - `workflows` ✅
     - `workflow_assignments` ✅
     - `status_entries` (should have new `workflow_id` column) ✅

**6. Reload Your App**
   - Go back to your Daily-Tracker app
   - Refresh the page (F5)
   - Login as admin
   - Navigate to System Administration → Workflows
   - Error should be gone!

---

## How It Works - Step by Step

### For Admin User:
1. Go to **System Administration** (Users tab)
2. Switch to **📋 Workflow Management** subtab
3. Click **"New Workflow"** button
4. Enter workflow name (e.g., "Q1 2026 Performance Tracking")
5. Enter description (optional)
6. Click "Create Workflow"
7. Click on workflow to expand it
8. Click "Assign" button to add users
9. Select users from dropdown and confirm
10. Users are now assigned to this workflow

### For Users in Assigned Workflows:
- When entering status data, entries tagged with their assigned workflow_id
- RLS policies automatically restrict visibility based on workflow membership
- Managers/Admins can see workflow-wise performance metrics
- Leads can manage their assigned workflow members

---

## Database Schema

### workflows table
```
id (UUID) - Primary Key
name (TEXT) - Workflow name
description (TEXT) - Optional description
created_by (UUID) - Admin who created
created_at (TIMESTAMP) - Auto timestamp
updated_at (TIMESTAMP) - Auto timestamp
is_active (BOOLEAN) - Soft delete flag
```

### workflow_assignments table
```
id (UUID) - Primary Key
user_id (UUID) - Foreign Key → auth.users
workflow_id (UUID) - Foreign Key → workflows
assigned_by (UUID) - Admin who assigned
assigned_at (TIMESTAMP) - Auto timestamp
UNIQUE(user_id, workflow_id) - Prevents duplicates
```

### status_entries (UPDATED)
```
workflow_id (UUID) - NEW column linking to workflows
(All existing columns remain unchanged)
```

---

## Implementation Details

### RLS Policy Hierarchy
1. **Admins/Managers**: Full access to all workflows and assignments
2. **Workflow Members**: Can view workflows they're assigned to
3. **Leads**: Client-scoped access (existing behavior preserved)
4. **Performers**: Personal entries (existing behavior preserved)

### Error Handling
- Duplicate user-workflow assignments prevented (UNIQUE constraint)
- Confirmation dialogs for destructive actions
- Toast notifications for all operations
- User-friendly error messages

### Performance Considerations
- Indexes on `workflow_id` and `user_id` for fast queries
- Junction table design prevents data duplication
- Efficient RLS policies minimize query overhead

---

## Next Steps (Optional Enhancements)

1. **Workflow-Wise Status Rollup**
   - In form submission, let users select which workflow the entry belongs to
   - Create workflow-specific analytics dashboard

2. **Workflow Permissions**
   - Allow Managers to create/manage workflows (not just Admins)
   - Granular permission matrix

3. **Archive Old Workflows**
   - Use `is_active` flag for soft deletes
   - Archive UI for historical workflows

4. **Bulk User Assignment**
   - CSV import for assigning multiple users at once
   - Team management shortcuts

---

## Files Modified/Created

✅ **Created**: `WORKFLOW_SETUP.sql` - Database migration
✅ **Created**: `src/components/WorkflowManager.jsx` - React component
✅ **Modified**: `src/App.jsx` - Integration + state management
✅ **Reference**: `AUTH_SETUP.sql` - Existing RLS foundation (no changes needed)

---

## Deployment Checklist

### Phase 1: Database Setup (Required - Do This First!)
- [ ] Copy `WORKFLOW_SETUP.sql` from project root
- [ ] Go to Supabase → SQL Editor → Create New Query
- [ ] Paste the entire SQL file contents
- [ ] Click "Run" and confirm all statements executed successfully
- [ ] Check Supabase Tables to confirm:
  - `workflows` table exists
  - `workflow_assignments` table exists
  - `status_entries` has `workflow_id` column

### Phase 2: Application Testing
- [ ] Reload your app in browser
- [ ] Verify no "table not found" errors in console
- [ ] Login as Admin user
- [ ] Navigate to **System Administration** → **Workflows** tab
- [ ] Create a test workflow
- [ ] Assign test users to the workflow
- [ ] Verify assigned users can see the workflow
- [ ] Test workflow deletion and verify assignments cascade-delete
- [ ] Test Manager/Lead role restrictions
- [ ] Verify RLS policies work correctly (leads see client data, performers see own data)

---

## Support Notes

### ❌ "Could not find the table 'public.workflows' in the schema cache"
**Cause:** SQL migration hasn't been run yet  
**Solution:**
1. Open `WORKFLOW_SETUP.sql` file
2. Copy the entire contents
3. Go to Supabase → SQL Editor → New Query
4. Paste and click "Run"
5. Reload your app

### ❌ "Error creating workflow" or permission denied
**Cause:** RLS policies not applied correctly or user doesn't have admin role  
**Solution:**
1. Verify user has `role = 'admin'` in profiles table
2. Check that RLS policies were created (Supabase → SQL Editor → Policies tab)
3. Verify `workflows` table has RLS enabled
4. Try the SQL migration again to re-create policies

### ❌ "Workflows don't restrict data properly"
**Cause:** `workflow_id` not being set when users submit status entries  
**Solution:**
1. Check that `workflow_id` column exists on `status_entries` table
2. Update your status entry form to include workflow selection
3. Verify RLS policies are enabled on `status_entries` table
4. Ensure user is actually assigned to the workflow in `workflow_assignments`

### ❌ "User assignment fails with unique constraint error"
**Cause:** User is already assigned to this workflow  
**Solution:**
1. Check existing assignments in Supabase → `workflow_assignments` table
2. Remove duplicate assignment if needed
3. Note: UNIQUE(user_id, workflow_id) prevents duplicate assignments

If user assignment fails during form submission:
1. Check that user has been provisioned and has a profile
2. Verify workflow exists and `is_active = true`
3. Check Supabase logs (bottom right corner) for detailed error messages
4. Ensure user_id and workflow_id values are valid UUIDs
