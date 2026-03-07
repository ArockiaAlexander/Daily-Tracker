# CBPET Daily Tracker - Repository Setup Notes

## Project Overview
Enterprise-grade performance tracking system with Role-Based Access Control (RBAC).
- **Tech Stack**: React 18 + Vite + Tailwind CSS + Supabase + Chart.js
- **Database**: PostgreSQL on Supabase with Row Level Security (RLS)
- **Roles**: Admin, Manager, Lead, Performer

## Critical Setup Steps

### 1. Environment Configuration
- `.env` file required with:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`

### 2. Database Migrations (IN ORDER)
1. Run `AUTH_SETUP.sql` first - Creates base tables, RLS, roles enum
2. Run `WORKFLOW_SETUP.sql` - Adds workflow-wise access control

### 3. First Admin User
After AUTH_SETUP.sql is applied:
```sql
UPDATE profiles SET role = 'admin' WHERE id = 'YOUR_USER_UUID_HERE';
```

## Workflow System (NEW)
- **Purpose**: Assign users to workflows for scoped access control
- **Tables**: `workflows`, `workflow_assignments`
- **UI Location**: System Administration → Workflow Management tab (Admin only)
- **Features**:
  - Create/Delete workflows
  - Assign/Remove users from workflows
  - RLS policies enforce automatic data filtering

## Key Features by Role

### Admin
- Create/Delete workflows
- Assign/Remove users to workflows
- Assign roles to any user
- Provision new users
- View all data across all workflows

### Manager
- View all workflows and assignments (read-only)
- View all performance data
- Cannot create workflows

### Lead
- View workflows they're assigned to
- Manage performers within their client
- Client-scoped analytics

### Performer
- Personal dashboard and data entry
- View own performance metrics
- Monthly leaderboard participation

## Common Tasks

**To provision a new user:**
1. Go to System Admin → User Management
2. Click "Provision User"
3. Copy signup link and send to new user
4. User signs up (automatically becomes Performer)
5. Refresh User Management and assign Role/Client

**To assign user to workflow:**
1. Go to System Admin → Workflow Management
2. Click on existing workflow (or create new)
3. Click "Assign" button
4. Select user from dropdown
5. Click "Assign" - complete!

## Performance Notes
- Status entries are indexed by user_id and date for fast queries
- RLS policies are efficient and cached by Supabase
- WorkflowManager component lazy-loads assignments on expand

## Important RLS Rules
- Performers can only see/delete their own entries
- Leads can only see entries from their client_id
- Managers/Admins see all entries
- Workflow members see entries tagged with their workflow
- All SELECT operations are READ-ONLY for non-admins

## Data Model Relationships
```
auth.users
    ↓
    ├→ profiles (role, client_id, performer_name)
    ├→ workflow_assignments (user_id ↔ workflow_id)
    └→ status_entries (daily performance logs)

workflows
    ↓
    ├→ workflow_assignments (N:M with users)
    └→ status_entries (N:M with entries)
```
