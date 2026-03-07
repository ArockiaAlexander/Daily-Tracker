# Enterprise RBAC - Quick Integration Guide

## Adding Components to Your App

### Step 1: Import the New Components

In your `src/App.jsx`, add these imports at the top:

```javascript
import Leaderboard from './components/Leaderboard';
import TeamManagement from './components/TeamManagement';
```

### Step 2: Add Admin Sub-Tabs

Update your admin section state:

```javascript
// In your useState section
const [adminSubTab, setAdminSubTab] = useState('users'); // 'users' | 'workflows' | 'teams' | 'leaderboard'
```

### Step 3: Update Admin UI with New Tabs

In your admin section rendering, update the tabs:

```jsx
{userRole === 'admin' && (
  <div className="space-y-4">
    {/* Admin Subtabs */}
    <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
      <button
        onClick={() => setAdminSubTab('users')}
        className={`px-4 py-2 font-medium ${
          adminSubTab === 'users' 
            ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600' 
            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300'
        }`}
      >
        👥 Users
      </button>
      <button
        onClick={() => setAdminSubTab('workflows')}
        className={`px-4 py-2 font-medium ${
          adminSubTab === 'workflows' 
            ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600' 
            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300'
        }`}
      >
        📋 Workflows
      </button>
      <button
        onClick={() => setAdminSubTab('teams')}
        className={`px-4 py-2 font-medium ${
          adminSubTab === 'teams' 
            ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600' 
            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300'
        }`}
      >
        🏢 Teams
      </button>
    </div>

    {/* Render Selected Tab */}
    {adminSubTab === 'users' && <UserManagement />}
    {adminSubTab === 'workflows' && <WorkflowManager />}
    {adminSubTab === 'teams' && <TeamManagement />}
  </div>
)}
```

### Step 4: Add Leaderboard to Dashboard or Separate Page

Option A - Add as dashboard section:

```jsx
{/* In your main content area, after status entry form */}
<div className="mt-8">
  <Leaderboard />
</div>
```

Option B - Create separate route:

```javascript
// Import
import Leaderboard from './components/Leaderboard';

// In your routing logic
if (currentPage === 'leaderboard') {
  return <Leaderboard />;
}
```

### Step 5: Add Navigation Link to Leaderboard

Add to your main navigation menu:

```jsx
<button
  onClick={() => setCurrentPage('leaderboard')}
  className="px-4 py-2 rounded hover:bg-blue-100 dark:hover:bg-blue-900/30"
>
  🏆 Leaderboard
</button>
```

---

## Required Database Migration

Before the components will work, run this in Supabase SQL Editor:

1. Copy entire contents of `RBAC_MIGRATION.sql`
2. Create new query in Supabase
3. Paste the SQL
4. Click "Run"

See `RBAC_IMPLEMENTATION.md` for detailed setup.

---

## Complete Example Integration

Here's what a typical admin page might look like with full integration:

```jsx
import React, { useState } from 'react';
import UserManagement from './components/UserManagement';
import WorkflowManager from './components/WorkflowManager';
import TeamManagement from './components/TeamManagement';
import Leaderboard from './components/Leaderboard';

export default function SystemAdmin() {
  const [adminSubTab, setAdminSubTab] = useState('users');

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">System Administration</h1>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
        {[
          { id: 'users', label: '👥 Users', icon: '👥' },
          { id: 'workflows', label: '📋 Workflows', icon: '📋' },
          { id: 'teams', label: '🏢 Teams', icon: '🏢' },
          { id: 'leaderboard', label: '🏆 Leaderboard', icon: '🏆' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setAdminSubTab(tab.id)}
            className={`px-4 py-2 font-medium transition ${
              adminSubTab === tab.id
                ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {adminSubTab === 'users' && <UserManagement />}
      {adminSubTab === 'workflows' && <WorkflowManager />}
      {adminSubTab === 'teams' && <TeamManagement />}
      {adminSubTab === 'leaderboard' && <Leaderboard />}
    </div>
  );
}
```

---

## Styling & Customization

### Matching Your Theme

The components support dark mode out of the box. To customize colors:

1. **Leaderboard.jsx** - Search for `bg-blue-`, `text-blue-` and replace
2. **TeamManagement.jsx** - Search for `bg-green-`, `text-green-` and replace

Example: Replace all blue accents with your brand color:

```javascript
// Find
className="px-4 py-2 bg-blue-500 text-white"

// Replace with your color
className="px-4 py-2 bg-indigo-500 text-white"
```

### Sizing & Spacing

Components use Tailwind classes. Adjust:
- `w-full` → width
- `p-4` → padding
- `gap-2` → spacing between items
- `text-2xl` → text size

---

## Testing the Integration

### 1. Test as Super Admin
- [ ] Can see all tabs
- [ ] Can create teams
- [ ] Can view all leaderboards
- [ ] Can manage users and workflows

### 2. Test as General Manager
- [ ] Can see leaderboard
- [ ] Cannot see team management
- [ ] Can view all employee data
- [ ] Cannot edit roles

### 3. Test as Team Lead
- [ ] Can see own team leaderboard
- [ ] Cannot see other teams
- [ ] Cannot access team management
- [ ] Can view team member names

### 4. Test as Performer
- [ ] Can see leaderboard
- [ ] Only shows own team members
- [ ] Cannot access admin features
- [ ] Can submit own entries

---

## Troubleshooting Integration

### Component Not Showing
- [ ] Verify imports are correct
- [ ] Check userRole state is being set properly
- [ ] Ensure RLS migration has been run
- [ ] Check browser console for errors

### "Permission Denied" Errors
- [ ] Run RBAC_MIGRATION.sql in Supabase
- [ ] Verify user role is updated in profiles table
- [ ] Check team_id is assigned to user
- [ ] Reload page to refresh auth context

### Leaderboard Shows No Data
- [ ] Check performance_metrics table has data
- [ ] Run aggregation query manually
- [ ] Verify user belongs to a team
- [ ] Check RLS policies are enabled

---

## Performance Tips

1. **Limit Leaderboard Results**: Add `.limit(100)` to reduce data
2. **Pagination**: Implement pagination for large teams
3. **Caching**: Store leaderboard data in state when possible
4. **Indexes**: Ensure Supabase has created recommended indexes

---

## Next Steps

1. ✅ Run `RBAC_MIGRATION.sql` in Supabase
2. ✅ Update user roles via SQL or app interface
3. ✅ Create 2-3 test teams
4. ✅ Assign users to teams
5. ✅ Import components in App.jsx
6. ✅ Add navigation to new components
7. ✅ Test all 5 roles thoroughly
8. ✅ Deploy to production

---

## Documentation Reference

- **[RBAC_IMPLEMENTATION.md](./RBAC_IMPLEMENTATION.md)** - Complete system guide
- **[DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md)** - Setup checklist
- **[RBAC_OVERVIEW.md](./RBAC_OVERVIEW.md)** - System summary

---

**Happy deploying!** 🚀

For questions or issues, refer to DEPLOYMENT_CHECKLIST.md troubleshooting section.
