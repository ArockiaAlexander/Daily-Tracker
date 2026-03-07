# SQL Archive

This folder contains migration and utility SQL scripts that are used one-time or infrequently.

## Files

### ROLE_MIGRATION.sql
**Purpose**: Safely migrate users from old 4-role system to new 5-role system

**When to use**: 
- After both system roles exist (old: admin, manager, lead + new: super_admin, general_manager, assistant_manager, team_lead)
- Run migration once to update all user roles

**Contents**:
- Batch migration queries (commented for safety)
- Verification queries to check migration status
- Manual update commands for individual users
- Rollback procedures

**Status**: Optional - Dashboard works with both old and new roles automatically

---

## How to Use an Archive Script

1. Open the script file from this folder
2. Read the comments carefully
3. Test in development database first
4. Copy relevant sections to Supabase SQL Editor
5. Execute carefully (some queries are commented out for safety)

---

## Current SQL Files (In Root)

For reference, these are the main SQL migrations that are active:

- **AUTH_SETUP.sql** - Database baseline (4-role system, required)
- **WORKFLOW_SETUP.sql** - Workflow system (required)
- **RBAC_MIGRATION.sql** - Enterprise RBAC upgrade (5-role system, required)

---

**Archive Created**: March 7, 2026
