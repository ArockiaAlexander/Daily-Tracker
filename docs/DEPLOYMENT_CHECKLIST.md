# Enterprise RBAC - Deployment Checklist

## Phase 1: Database Setup (Required)
- [ ] **RBAC Migration**: Run `RBAC_MIGRATION.sql` in Supabase SQL Editor
  - Copy entire file contents
  - Create new query in Supabase
  - Click "Run" and verify all statements succeed
  
- [ ] **Verify Tables Created**:
  - [ ] `teams` table exists
  - [ ] `performance_metrics` table exists
  - [ ] `profiles` table has `team_id`, `department`, `reports_to` columns
  - [ ] RLS is enabled on all tables
  - [ ] Indexes are created for performance

- [ ] **Verify Views Created**:
  - [ ] `monthly_leaderboard` view
  - [ ] `quarterly_leaderboard` view
  - [ ] `yearly_leaderboard` view
  - [ ] `team_performance` view

---

## Phase 2: Configure Users and Roles
- [ ] **Identify Key Users** (write UUIDs):
  - Super Admin: `_________________________`
  - General Manager: `_________________________`
  - Assistant Manager 1: `_________________________`
  - Assistant Manager 2: `_________________________`
  - Team Leads: `_________________________`

- [ ] **Update User Roles in Supabase**:
  ```sql
  UPDATE profiles SET role = 'super_admin' WHERE id = '[SUPER_ADMIN_UUID]';
  UPDATE profiles SET role = 'general_manager' WHERE id = '[GM_UUID]';
  UPDATE profiles SET role = 'assistant_manager' WHERE id = '[AM_UUID]';
  UPDATE profiles SET role = 'team_lead' WHERE id = '[TL_UUID]';
  ```

- [ ] **Verify Role Updates**: Query to check:
  ```sql
  SELECT performer_name, role, team_id FROM profiles ORDER BY role DESC;
  ```

---

## Phase 3: Team Structure Setup
- [ ] **Create Teams** (run in Supabase SQL Editor or via app):
  ```sql
  INSERT INTO teams (name, description, manager_id)
  VALUES ('Team Engineering', 'Software Development', '[AM_UUID_1]');
  
  INSERT INTO teams (name, description, manager_id)
  VALUES ('Team Operations', 'Business Operations', '[AM_UUID_2]');
  ```

- [ ] **Record Team IDs** for later assignment:
  - Team 1: `_________________________`
  - Team 2: `_________________________`
  - Team 3: `_________________________`

- [ ] **Assign Users to Teams**:
  ```sql
  UPDATE profiles SET team_id = '[TEAM_UUID]' WHERE performer_name = 'User Name';
  UPDATE profiles SET team_id = '[TEAM_UUID]' WHERE performer_name = 'User Name';
  ```

- [ ] **Verify Team Assignments**:
  ```sql
  SELECT performer_name, team_id, role 
  FROM profiles 
  WHERE team_id IS NOT NULL 
  ORDER BY team_id;
  ```

---

## Phase 4: Sample Data & Metrics
- [ ] **Create Test Performance Data** (optional, for demo):
  ```sql
  INSERT INTO performance_metrics 
  (user_id, metric_date, month, year, total_pages, tasks_completed, target_achieved, time_efficiency, quality_score)
  VALUES 
  ('[USER_UUID]', CURRENT_DATE, DATE_TRUNC('month', CURRENT_DATE)::DATE, 2025, 500, 10, 92.5, 85.0, 95.0),
  ('[USER_UUID]', CURRENT_DATE, DATE_TRUNC('month', CURRENT_DATE)::DATE, 2025, 450, 9, 88.0, 82.0, 92.0);
  ```

- [ ] **Verify Metrics Data**:
  ```sql
  SELECT user_id, metric_date, total_pages FROM performance_metrics LIMIT 10;
  ```

---

## Phase 5: React Components Integration
- [ ] **Import New Components** in `src/App.jsx`:
  ```javascript
  import Leaderboard from './components/Leaderboard';
  import TeamManagement from './components/TeamManagement';
  ```

- [ ] **Add Routes/Navigation**:
  - [ ] Leaderboard accessible to: Performer, Team Lead, Assistant Manager, General Manager, Super Admin
  - [ ] Team Management accessible to: Super Admin, General Manager

- [ ] **Update Admin Section** in App.jsx:
  ```javascript
  // Add TeamManagement as new admin subtab
  const [adminSubTab, setAdminSubTab] = useState('users'); // 'users' | 'workflows' | 'teams'
  
  {adminSubTab === 'teams' && <TeamManagement />}
  ```

- [ ] **Add Dashboard Enhancements**:
  - Role-specific views for each role level
  - Team performance cards for managers
  - Quick stats for dashboards

---

## Phase 6: RLS Testing
- [ ] **Test Super Admin**:
  - [ ] Can view all employees
  - [ ] Can see all teams
  - [ ] Can access all analytics
  - [ ] Can manage workflows and teams

- [ ] **Test General Manager**:
  - [ ] Can view all employees
  - [ ] Cannot modify user roles or teams
  - [ ] Can access organizational analytics
  - [ ] Can export reports

- [ ] **Test Assistant Manager**:
  - [ ] Can only see assigned teams
  - [ ] Can see team metrics
  - [ ] Cannot see other teams' data
  - [ ] No access to organizational data

- [ ] **Test Team Lead**:
  - [ ] Can only see own team members
  - [ ] Can view team leaderboards
  - [ ] Cannot access management features
  - [ ] Can see individual metrics

- [ ] **Test Performer**:
  - [ ] Can only view own data
  - [ ] Can see team ranking/leaderboard
  - [ ] No access to any management features
  - [ ] Cannot edit other users' data

---

## Phase 7: Performance Optimization
- [ ] **Verify Indexes Exist**:
  ```sql
  SELECT indexname FROM pg_indexes 
  WHERE tablename IN ('teams', 'profiles', 'performance_metrics');
  ```

- [ ] **Monitor Query Performance**:
  - Leaderboard load time < 1 second
  - Team list load time < 500ms
  - Analytics aggregation < 2 seconds

- [ ] **Enable Query & Logs Monitoring**:
  - [ ] Check Supabase Logs for slow queries
  - [ ] Monitor RLS policy execution time
  - [ ] Identify N+1 query problems

---

## Phase 8: Documentation & Training
- [ ] **Share Documentation** with team:
  - [ ] [RBAC_IMPLEMENTATION.md](./RBAC_IMPLEMENTATION.md) - Full system guide
  - [ ] Permission matrix - Print or share
  - [ ] Role-specific walkthrough guides

- [ ] **Create Training Videos** (optional):
  - Super Admin capabilities
  - Manager analytics features
  - Team Lead team management
  - Performer self-service features

- [ ] **Update Help/Support**:
  - [ ] Create FAQ for common questions
  - [ ] Set up support documentation
  - [ ] Train support team on new roles

---

## Phase 9: Monitoring & Maintenance
- [ ] **Set Up Alerts** (optional):
  - Leaderboard query timeout alerts
  - Permission denied error tracking
  - Performance metric aggregation failures

- [ ] **Scheduled Maintenance**:
  - [ ] Daily: Metrics aggregation runs successfully
  - [ ] Weekly: Review new user role assignments
  - [ ] Monthly: Archive old leaderboard data

- [ ] **Regular Audits**:
  - [ ] Verify RLS policies working correctly
  - [ ] Check unauthorized access attempts
  - [ ] Review role escalations/changes

---

## Phase 10: Production Deployment
- [ ] **Pre-Deployment Checklist**:
  - [ ] All tests passing
  - [ ] RLS policies verified
  - [ ] Performance baseline established
  - [ ] Data backup created

- [ ] **Deploy Components**:
  - [ ] Push updated code to repository
  - [ ] Run production build: `npm run build`
  - [ ] Deploy to GitHub Pages or hosting

- [ ] **Post-Deployment**:
  - [ ] Verify all roles can access their features
  - [ ] Monitor performance metrics
  - [ ] Collect user feedback
  - [ ] Be ready to debug issues

---

## Quick SQL Reference

### Get User Role and Team
```sql
SELECT id, performer_name, role, team_id 
FROM profiles 
WHERE performer_name = 'John Doe';
```

### Get Team Members
```sql
SELECT performer_name, role 
FROM profiles 
WHERE team_id = '[TEAM_UUID]' 
ORDER BY performer_name;
```

### Get Current Month Leaderboard
```sql
SELECT performer_name, team_name, total_pages, calculated_rank 
FROM monthly_leaderboard 
WHERE month = DATE_TRUNC('month', CURRENT_DATE)::DATE
ORDER BY calculated_rank;
```

### Get Team Performance
```sql
SELECT team_name, team_size, avg_pages_per_member, avg_target_achieved
FROM team_performance
WHERE month = DATE_TRUNC('month', CURRENT_DATE)::DATE
ORDER BY avg_pages_per_member DESC;
```

### Update User Role
```sql
UPDATE profiles 
SET role = 'team_lead', team_id = '[TEAM_UUID]'
WHERE id = '[USER_UUID]';
```

---

## Troubleshooting

### Issue: "Permission Denied" when accessing data
**Solution:**
1. Verify RLS is enabled: `SELECT * FROM pg_tables WHERE tablename = 'status_entries';`
2. Check user's role: `SELECT role FROM profiles WHERE id = auth.uid();`
3. Check team assignment: `SELECT team_id FROM profiles WHERE id = auth.uid();`
4. Reload page and try again

### Issue: Leaderboard shows no data
**Solution:**
1. Check performance_metrics table: `SELECT COUNT(*) FROM performance_metrics;`
2. Run metrics aggregation manually (see Phase 4)
3. Verify user has correct role and team_id

### Issue: Team assignment not working
**Solution:**
1. Verify team exists: `SELECT * FROM teams WHERE id = '[TEAM_UUID]';`
2. Ensure team is active: `SELECT is_active FROM teams WHERE id = '[TEAM_UUID]';`
3. Check user profile exists: `SELECT * FROM profiles WHERE id = '[USER_UUID]';`

### Issue: RLS policies seem broken
**Solution:**
1. Reconnect/login again to refresh auth context
2. Check recent SQL migrations executed without errors
3. Verify DROP POLICY statements completed successfully
4. Run the entire RBAC_MIGRATION.sql again to re-create policies

---

## Support Resources
- Supabase Documentation: https://supabase.com/docs
- PostgreSQL RLS: https://www.postgresql.org/docs/current/ddl-rowsecurity.html
- Project GitHub: [Your Repo URL]

---

**Completion Date**: _______________  
**Deployed By**: _______________  
**Notes**: ________________________________________________________________
