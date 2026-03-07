# Enterprise RBAC System - 5-Role Hierarchy Documentation

## Overview

This document describes the enhanced role-based access control system with 5 distinct roles designed for enterprise performance tracking. The system uses Supabase Row Level Security (RLS) to enforce permissions at the database level.

---

## 📊 Role Hierarchy

### Level 5: Super Admin
**Access Level**: Full System Control

**Permissions:**
- View all employees across all teams
- Create, edit, delete teams
- Create, edit, delete workflows
- Manage all user roles and permissions
- View all performance metrics (daily, monthly, quarterly, yearly)
- Full system analytics and reporting
- Access all configurations

**Visibility:**
- All status entries
- All performance data
- All team hierarchies
- All user profiles

**Example Use Cases:**
- System owner
- Platform administrator
- Executive overseeing entire organization

---

### Level 4: General Manager
**Access Level**: Organizational Overview

**Permissions:**
- View all employees across organization
- View all team structures
- Generate organizational analytics
- View quarterly and yearly performance reports
- Cannot assign roles or manage workflows (Super Admin only)
- Cannot modify team assignments

**Visibility:**
- All status entries (read-only in most contexts)
- All team performance metrics
- Employee leaderboards (monthly, quarterly, yearly)
- Team-level aggregations
- Department-wide analytics

**Example Use Cases:**
- VP of Operations
- Regional Manager
- Organizational Performance Lead

---

### Level 3: Assistant Manager
**Access Level**: Multi-Team Oversight

**Permissions:**
- View multiple assigned teams' data
- See all team members' performance within managed teams
- Compare team performance
- Generate team-level analytics
- Limited to teams assigned to them

**Visibility:**
- Status entries from assigned teams only
- Performance metrics for team members
- Team-level leaderboards
- Team comparison dashboards

**Example Use Cases:**
- Area Manager (oversees 2-3 teams)
- Department Head
- Program Manager

---

### Level 2: Team Lead
**Access Level**: Team Management

**Permissions:**
- View all team members' performance
- See individual member metrics
- View team leaderboards
- Cannot modify data
- Limited to own team only

**Visibility:**
- Own team members' status entries
- Team member performance metrics
- Team-based rankings
- Colleague comparisons (team members only)

**Example Use Cases:**
- Shift Supervisor
- Team Lead
- Department Coordinator

---

### Level 1: Performer
**Access Level**: Personal & Colleague Comparison

**Permissions:**
- Submit own daily status updates
- View own performance metrics
- See team colleagues' rankings (for motivation)
- Cannot view other teams
- Cannot access any management functions

**Visibility:**
- Own status entries only
- Own monthly/quarterly/yearly rankings
- Team colleague leaderboards (ranking only, not details)
- Cannot see individual performance details of others

**Example Use Cases:**
- Individual Contributor
- Regular Employee
- Team Member

---

## 🔐 Permission Matrix

| Action | Super Admin | General Manager | Assistant Manager | Team Lead | Performer |
|--------|:-:|:-:|:-:|:-:|:-:|
| **View All Employees** | ✅ | ✅ | ❌ | ❌ | ❌ |
| **View Team Data** | ✅ | ✅ | ✅* | ✅* | ✅* |
| **View Own Data** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Submit Status** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Manage Teams** | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Assign Roles** | ✅ | ❌ | ❌ | ❌ | ❌ |
| **View Workflows** | ✅ | ✅ | ✅* | ✅* | ❌ |
| **Manage Workflows** | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Analytics** | ✅ | ✅ | ✅* | ✅* | ❌ |
| **Export Reports** | ✅ | ✅ | ✅* | ❌ | ❌ |

*Only for assigned scope (team/workflow)

---

## 📈 Leaderboard Rules

### Performer View
```
Monthly Leaderboard:
- Rank: All team colleagues (by pages completed)
- Profile: Name, Role, Pages, Target Achieved, Time Efficiency
- Motivation: See how you compare to peers
- Own ranking highlighted
```

### Team Lead / Assistant Manager View
```
Team Leaderboard (Monthly):
- Rank: All team members
- Filter by: Team, Month, Metric (Pages, Quality, Efficiency)
- Grouping: Team comparison possible (for Asst. Manager)
- Analytics: Team average, highest performer, lowest performer

Quarterly/Yearly Views:
- Aggregated metrics across all quarters/years
- Trend analysis
- Team performance trends
```

### General Manager View
```
Organizational Leaderboard (Monthly):
- Rank: All employees across all teams
- Grouping: By team, by department, by region
- Aggregations: Team totals, department totals, organization totals
- Time Period: Monthly, Quarterly, Yearly analytics

Insights:
- Top performing teams
- Top performing individuals
- Performance trends by department
- Comparative analysis across teams
```

---

## 🗂️ Team Hierarchy Structure

```
Organization
├── Team A (Manager: Alice)
│   ├── Team Lead: Bob
│   ├── Performer: Carol
│   ├── Performer: David
│   └── SubTeam A1 (Manager: Carol)
│       └── Performer: Eve
├── Team B (Manager: Frank)
│   ├── Team Lead: Grace
│   ├── Performer: Henry
│   └── Performer: Iris
└── Department Region X (Asst Manager: Jack)
    ├── Team C (Manager: Karen)
    │   └── [Members...]
    └── Team D (Manager: Leo)
        └── [Members...]
```

**Key Relationships:**
- Each person belongs to exactly one team
- Team Lead reports into their team
- Assistant Manager oversees multiple teams
- General Manager sees all
- Super Admin manages everything

---

## 🚀 Deployment Steps

### Step 1: Run the SQL Migration

**In Supabase SQL Editor:**
1. Create a new query
2. Copy entire contents of `RBAC_MIGRATION.sql`
3. Click "Run"
4. Verify all tables were created:
   - ✅ `teams` table
   - ✅ `performance_metrics` table
   - ✅ Updated `profiles` with `team_id`, `department`, `reports_to`
   - ✅ Leaderboard views (monthly, quarterly, yearly)
   - ✅ Helper functions

### Step 2: Assign Existing Users to New Roles

```sql
-- Example: Promote user to Super Admin
UPDATE profiles SET role = 'super_admin' WHERE id = 'UUID_HERE';

-- Example: Create a General Manager
UPDATE profiles SET role = 'general_manager' WHERE id = 'UUID_HERE';

-- Example: Create a Team Lead
UPDATE profiles SET role = 'team_lead', team_id = 'TEAM_UUID' WHERE id = 'UUID_HERE';
```

### Step 3: Create Teams

```sql
-- Create a team
INSERT INTO teams (name, description, manager_id)
VALUES ('Engineering', 'Software Development Team', 'MANAGER_UUID');

-- Assign users to team
UPDATE profiles SET team_id = 'TEAM_UUID' WHERE id = 'USER_UUID';
```

### Step 4: Set Up Performance Metrics Aggregation

**Option A: Manual Update (for testing)**
```sql
INSERT INTO performance_metrics 
(user_id, metric_date, month, year, total_pages, tasks_completed, target_achieved, time_efficiency, quality_score)
SELECT 
  user_id,
  DATE(MAX(created_at)) as metric_date,
  DATE_TRUNC('month', MAX(created_at))::DATE as month,
  EXTRACT(YEAR FROM MAX(created_at))::INTEGER as year,
  SUM(COALESCE("completedPages", 0)) as total_pages,
  COUNT(*) as tasks_completed,
  AVG(COALESCE("targetAchieved", 0)) as target_achieved,
  AVG(COALESCE("timeAchieved", 0)) as time_efficiency,
  0 as quality_score
FROM status_entries
WHERE DATE(created_at) = CURRENT_DATE
GROUP BY user_id
ON CONFLICT (user_id, metric_date) DO UPDATE SET
  total_pages = EXCLUDED.total_pages,
  tasks_completed = EXCLUDED.tasks_completed,
  target_achieved = EXCLUDED.target_achieved,
  time_efficiency = EXCLUDED.time_efficiency;
```

**Option B: Scheduled Job (Production)**
- Set up a Supabase Edge Function or external cron job
- Run daily at 23:55 to aggregate previous day's metrics
- Automatically calculate rankings

### Step 5: Test RLS Policies

**Test as Different Roles:**

1. **Super Admin Test:**
   - Login as super_admin
   - Should see all users and teams
   - Can access all workflows and analytics

2. **General Manager Test:**
   - Login as general_manager
   - Should see all employees and teams
   - Can view all analytics but cannot modify
   - Cannot see workflows

3. **Assistant Manager Test:**
   - Login as assistant_manager
   - Should only see assigned teams
   - Cannot see other teams' data
   - Can view team analytics

4. **Team Lead Test:**
   - Login as team_lead
   - Should only see own team members
   - Cannot see other teams
   - Can view team leaderboards

5. **Performer Test:**
   - Login as performer
   - Should only see own data
   - Can see team colleagues in leaderboard
   - Cannot access management features

---

## 📋 Performance Metrics Calculation

### Daily Aggregation
```
Field: total_pages
Source: status_entries.completedPages
Aggregation: SUM per user per day

Field: tasks_completed
Source: COUNT of status entries
Aggregation: COUNT per user per day

Field: target_achieved
Source: status_entries.targetAchieved
Aggregation: AVG per user per day

Field: time_efficiency
Source: (takenTime / estimatedTime) * 100
Aggregation: AVG per user per day

Field: quality_score
Source: Custom scoring (0-100)
Aggregation: AVG per user per day
```

### Ranking Calculation
**Monthly Ranking:**
```sql
ROW_NUMBER() OVER (PARTITION BY month ORDER BY total_pages DESC)
```

**Quarterly Ranking:**
```sql
ROW_NUMBER() OVER (
  PARTITION BY EXTRACT(QUARTER FROM month), year 
  ORDER BY SUM(total_pages) DESC
)
```

**Yearly Ranking:**
```sql
ROW_NUMBER() OVER (
  PARTITION BY year 
  ORDER BY SUM(total_pages) DESC
)
```

---

## 🔄 Database Views for Querying

### `monthly_leaderboard`
Returns ranking data for current/past months
- Used by Performer and Team Lead views
- Shows name, role, team, pages, target, efficiency

### `quarterly_leaderboard`
Aggregated data for quarter analysis
- Used by General Manager and Assistant Manager
- Shows aggregated metrics and rankings

### `yearly_leaderboard`
Year-over-year performance data
- Used by General Manager only
- Shows annual trends and achievements

### `team_performance`
Team-level aggregations
- Shows average per member, total team output
- Used for team comparison dashboards

---

## ⚠️ Important Notes

### Migration Impact
- **Old roles** (admin, manager, lead, performer) will continue to work
- **New roles** (super_admin, general_manager, assistant_manager, team_lead) are added
- **Recommendation**: Update all users to new roles after migration

### Backward Compatibility
- The old `'admin'` and `'manager'` roles still exist in enum
- RLS policies updated to recognize both old and new roles
- Gradual migration possible

### Team Assignment
- Required for Assistant Manager, Team Lead
- Optional for Super Admin, General Manager, Performer
- Assigned via `team_id` column in profiles

### Performance Metrics
- Calculated daily (ideally via automated job)
- Rankings reset monthly/quarterly/yearly
- Manual calculation available for testing

---

## 🛠️ Troubleshooting

### "Permission Denied" Errors
**Cause:** User doesn't have proper role or team assignment  
**Solution:** 
1. Check user's role: `SELECT role FROM profiles WHERE id = 'UUID'`
2. Check team assignment: `SELECT team_id FROM profiles WHERE id = 'UUID'`
3. Verify RLS policies are enabled

### Leaderboard Shows No Data
**Cause:** No performance_metrics rows exist  
**Solution:**
1. Run the aggregation query manually (see Step 4)
2. Or create test data:
   ```sql
   INSERT INTO performance_metrics 
   (user_id, metric_date, month, year, total_pages, tasks_completed)
   VALUES ('UUID', CURRENT_DATE, DATE_TRUNC('month', CURRENT_DATE)::DATE, 2025, 100, 5);
   ```

### Users Can't See Expected Data
**Cause:** RLS policies overly restrictive  
**Solution:**
1. Check RLS is enabled: `SELECT * FROM pg_tables WHERE tablename = 'status_entries' AND rowsecurity = true;`
2. Verify role hierarchy: `SELECT role FROM profiles WHERE id = auth.uid();`
3. Debug with: `SET ROLE authenticated; SELECT * FROM status_entries WHERE user_id = 'UUID';`

---

## 📚 Related Documents
- [README.md](./README.md) - Project overview
- [WORKFLOW_IMPLEMENTATION.md](./WORKFLOW_IMPLEMENTATION.md) - Workflow features
- [AUTH_SETUP.sql](./AUTH_SETUP.sql) - Original authentication setup
- [RBAC_MIGRATION.sql](./RBAC_MIGRATION.sql) - SQL migration file

---

## 🎯 Next Steps

1. ✅ Run RBAC_MIGRATION.sql in Supabase
2. ✅ Update user roles and assign to teams
3. ⏳ Create Leaderboard React components
4. ⏳ Update Dashboard for role-specific views
5. ⏳ Set up automated metrics aggregation job
6. ⏳ Test all role hierarchies
7. ⏳ Deploy to production

---

**Last Updated:** March 7, 2026  
**Version:** 1.0.0 - Enterprise Edition
