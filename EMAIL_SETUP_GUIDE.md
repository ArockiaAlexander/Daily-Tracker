# Email Configuration Guide

## Issue Fixed
❌ **Old Error**: Email validation rejected `@cbpet.co` domain  
✅ **Solution**: Switched to `@company.io` domain (Supabase-compatible)

## Updated Email Addresses

### System Administrators
| Role | Email | Password* |
|------|-------|-----------|
| Super Admin | `ayaz@company.io` | Auto-generated |
| General Manager | `alex@company.io` | Auto-generated |

### Team Leads (Assigned to Teams)
| Team | Lead Name | Email | Team Assignment |
|------|-----------|-------|-----------------|
| Team 1 | Sumitha | `sumitha@company.io` | Team 1 (T1) |
| Team 2 | Farzana | `farzana@company.io` | Team 2 (T2) |
| Team 3 | Lakshmi | `lakshmi@company.io` | Team 3 (T3) |
| Team 4 | Harish | `harish@company.io` | Team 4 (T4) |

### Assistant Managers (No Team Assignment)
| Name | Email | Role |
|------|-------|------|
| Gansean | `gansean@company.io` | Assistant Manager |
| Deepan | `deepan@company.io` | Assistant Manager |

### Performers (Assigned to Teams)
| Team | Performer | Email |
|------|-----------|-------|
| Team 1 | Performer 1 | `performer1@company.io` |
| Team 2 | Performer 2 | `performer2@company.io` |
| Team 3 | Performer 3 | `performer3@company.io` |
| Team 4 | Performer 4 | `performer4@company.io` |

## Next Steps

### Option 1: Start Fresh (Recommended)
1. Delete your existing Supabase project or auth users
2. Run the updated `INIT_USERS_AND_TEAMS.sql` with new email addresses
3. Test with the new emails above

### Option 2: Add New Users via UI
1. Use the **"Add New User"** button in the dashboard (green button)
2. Enter email addresses using `@company.io` domain
3. The app will validate the email format before submitting
4. Users will receive confirmation emails

### Option 3: Use Real Email Domains
If you want to use real email addresses instead:
- Replace `@company.io` with your actual domain (e.g., `@gmail.com`, `@mycompany.com`)
- Ensure Supabase can validate the domain format
- Update `INIT_USERS_AND_TEAMS.sql` with real emails

## Testing the First User

To test the Add New User feature:
```
Email: testuser@company.io
Name: Test User
Role: performer
```

## Common Issues

| Issue | Solution |
|-------|----------|
| "Email address is invalid" | Use `@company.io` or another recognized domain |
| User already exists | Try a different username (email already created) |
| Password generation fails | Check browser console for auth errors |
| Profile creation fails | Ensure user exists in auth.users first |

## Passwords
All passwords are **auto-generated** temporary passwords. Users can reset them via the "Forgot Password" flow.

---

*Last Updated: March 7, 2026*
