# Password Management Features

## Overview
Comprehensive password management system with self-service password change and admin-controlled password reset capabilities.

---

## Features

### 1. **Self-Service Password Change** 
**For All Users**

#### Access
- Click the **🔒 Lock icon** in the top navigation bar  
- Opens "Change Password" modal

#### What It Does
- Users can change their own password securely
- Requires verification of current password
- Confirms matching new passwords
- Eye icons to toggle password visibility
- Real-time validation (min 6 characters)

#### User Flow
1. Click **Lock icon** → Modal opens
2. Enter **Current Password** (required for security)
3. Enter **New Password** (min 6 characters)
4. Enter **Confirm New Password** (must match)
5. Click **"Update Password"** or **"Cancel"**
6. Success message displayed on completion
7. Modal auto-closes after 2 seconds

#### Features
✅ Current password verification  
✅ Password strength requirements  
✅ Confirmation matching  
✅ Show/hide password toggles  
✅ Clear success notification  
✅ Error handling with helpful messages  

---

### 2. **Admin Password Reset**
**For Super Admin & General Manager Only**

#### Access
- Click the **🔑 Key icon** in the top navigation bar  
- Only visible to super_admin and general_manager
- Opens "Reset User Password" modal

#### What It Does
- Admins can reset other users' passwords
- Sends secure password reset email to user
- User must verify via email to set new password
- Full user search/filter functionality
- Audit logging (console) of all reset actions

#### Admin Flow
1. Click **Key icon** → Modal opens
2. **Search for user** (by name or role)
3. **Select user** from dropdown
4. Click **"Send Reset Link"**
5. Reset email sent to user's email address
6. User receives password reset email
7. User verifies email and sets new password
8. Success confirmation shown to admin

#### Features
✅ User search & filtering  
✅ Dropdown selection  
✅ Email-based verification  
✅ Audit trail (console logging)  
✅ RBAC enforcement (super_admin/general_manager only)  
✅ Clear status messaging  
✅ Excludes current user from list  

#### Security
- ⚠️ Warning message displayed to admin
- User must verify via email before changing password
- No temporary passwords exposed
- Password reset tokens managed by Supabase
- All actions logged for compliance

---

## User Interface

### Top Navigation Bar
```
[Logo] [User Email] [Lock🔒] [Key🔑*] [Dark Mode] [Logout]
                     ↑         ↑
              All Users    Admin Only
```

### Change Password Modal
```
╔════════════════════════════╗
║  🔒 Change Password        ║
║                            ║
║  Current Password:    [___] [👁️]
║  New Password:       [___] [👁️]
║  Confirm Password:   [___] [👁️]
║                            ║
║  [Cancel]  [Update Password]
╚════════════════════════════╝
```

### Admin Reset User Password Modal
```
╔══════════════════════════════════╗
║  🔑 Reset User Password          ║
║                                  ║
║  ⚠️ Warning: Sends reset email   ║
║                                  ║
║  Search User: [Search box]       ║
║  Select User: [Dropdown v]       ║
║                                  ║
║  📝 Email notification sent to:  ║
║     selecteduser@example.com     ║
║                                  ║
║  [Cancel]  [Send Reset Link]     ║
╚══════════════════════════════════╝
```

---

## Role-Based Access

| Feature | Super Admin | General Manager | Other Roles |
|---------|-------------|-----------------|-------------|
| Change Own Password | ✅ Yes | ✅ Yes | ✅ Yes |
| Reset Other Users' Passwords | ✅ Yes | ✅ Yes | ❌ No |
| Admin Reset Button Visible | ✅ Yes | ✅ Yes | ❌ No |

---

## Error Handling

### Change Password Errors
| Error | Cause | Solution |
|-------|-------|----------|
| "All fields required" | Empty field(s) | Fill in all fields |
| "Passwords don't match" | New passwords don't match | Ensure both new password fields match |
| "Password must be 6+ chars" | Too short | Use minimum 6 characters |
| "New password must differ" | Same as current | Choose a different password |
| "Current password incorrect" | Wrong current password | Enter correct current password |

### Admin Reset Errors
| Error | Cause | Solution |
|-------|-------|----------|
| "Access Denied" | Not super_admin/general_manager | Only admins can reset |
| "No user selected" | Didn't choose user | Select user from dropdown |
| "Password reset email failed" | Email service issue | Check email configuration |

---

## Implementation Details

### Components
- **ChangePassword.jsx** - Self-service password change modal
- **AdminResetUserPassword.jsx** - Admin password reset interface
- **App.jsx** - Main app with modal state & navigation buttons

### State Management
```javascript
// App state
const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
const [showAdminResetPasswordModal, setShowAdminResetPasswordModal] = useState(false);
```

### API Integration
- Uses Supabase Authentication API
- `supabase.auth.updateUser()` - Change password
- `supabase.auth.resetPasswordForEmail()` - Send reset email

### Icons
- **🔒 Lock Icon** (lucide-react's `Lock`) - Change password
- **🔑 Key Icon** (lucide-react's `KeyRound`) - Admin reset

---

## Testing Checklist

### Self-Service (All Users)
- [ ] Click Lock icon → ChangePassword modal appears
- [ ] All password fields work with show/hide toggle
- [ ] Current password verification works
- [ ] New passwords must match
- [ ] Password must be 6+ characters
- [ ] Different from current password check
- [ ] Success message displays on completion
- [ ] Modal auto-closes
- [ ] Invalid password shows error

### Admin Reset (Super Admin/General Manager)
- [ ] Key icon only visible to admins
- [ ] User search filter works
- [ ] Dropdown shows filtered users
- [ ] Current user excluded from list
- [ ] Reset email sent successfully
- [ ] User receives password reset email
- [ ] User can verify email and set new password
- [ ] Success message shows in modal
- [ ] Non-admins see access denied

### RBAC
- [ ] Super Admin has both icons
- [ ] General Manager has both icons
- [ ] Team Lead only has Lock icon
- [ ] Performer only has Lock icon
- [ ] Assistant Manager only has Lock icon
- [ ] Non-admins cannot access Key icon

---

## Audit & Compliance

### Console Logging
All admin password reset actions are logged to browser console:
```
🔐 Admin Password Reset: [admin_name] ([role]) is resetting password for [user_name]
```

### Email Notifications
Users receive Supabase-managed password reset emails:
- From: noreply@supabase.io (or configured sender)
- Subject: Reset Password
- Contains secure verification link
- Link expires after configured period
- User must verify email before changing password

---

## Deployment Notes

### Environment Variables
No new environment variables required. Uses existing Supabase configuration.

### Supabase Configuration
Ensure password reset email is configured in Supabase:
1. Go to Authentication → Email Templates
2. Customize "Reset Password" email (optional)
3. Ensure SMTP is configured if using custom domain

### Database Requirements
No new tables/columns required. Uses existing auth.users table.

---

## Future Enhancements

Potential improvements:
- [ ] Password complexity requirements (uppercase, numbers, symbols)
- [ ] Password history (prevent reuse of last N passwords)
- [ ] Forced password change on first login
- [ ] Two-factor authentication (2FA)
- [ ] Session timeout & password expiration
- [ ] Admin password reset activity dashboard
- [ ] Email verification for password changes
- [ ] IP address logging for security events
- [ ] Bulk password reset for multiple users
- [ ] Custom password policy enforcement

---

## Troubleshooting

### "Password change not working"
1. Check Supabase authentication status
2. Verify user is properly authenticated
3. Check browser console for errors
4. Ensure network connection is active

### "Admin can't see Key icon"
1. Verify user role is super_admin or general_manager
2. Check profile is properly loaded
3. Refresh page to reload role
4. Check database for correct role assignment

### "Reset email not received"
1. Check spam/junk folder
2. Verify email address is correct in profiles table
3. Check Supabase email configuration
4. Verify SMTP settings in Supabase

---

*Last Updated: March 7, 2026*  
*Version: 1.0*
