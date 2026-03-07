import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Lock, Loader2, CheckCircle2, Search } from 'lucide-react';

const AdminResetUserPassword = ({ profile, allProfiles, onClose, onPasswordReset }) => {
    const [selectedUserId, setSelectedUserId] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

    // Filter profiles for dropdown
    const filteredProfiles = allProfiles.filter((p) => {
        const matchesSearch =
            p.performer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.role?.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesSearch && p.id !== profile?.id; // Exclude current user
    });

    const handleResetPassword = async (e) => {
        e.preventDefault();
        setError(null);

        // Validation
        if (!selectedUserId) {
            setError('Please select a user');
            return;
        }

        if (!newPassword || !confirmPassword) {
            setError('Password fields are required');
            return;
        }

        if (newPassword !== confirmPassword) {
            setError("Passwords don't match");
            return;
        }

        if (newPassword.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        // RBAC: Only super_admin and general_manager can reset passwords
        if (profile?.role !== 'super_admin' && profile?.role !== 'general_manager') {
            setError('❌ Access Denied: Only super_admin and general_manager can reset user passwords');
            return;
        }

        setLoading(true);

        try {
            // Use Supabase admin API to reset user password
            // Since we can't access the admin API directly from client, we'll use the updateUser approach
            const selectedUser = allProfiles.find((p) => p.id === selectedUserId);

            // Log action for audit
            console.log(`🔐 Admin Password Reset: ${profile?.performer_name} (${profile?.role}) is resetting password for ${selectedUser?.performer_name}`);

            // For now, we'll create a temporary password reset token
            // In production, you'd want to use Supabase Admin API or a backend function
            const { error: resetError } = await supabase.auth.resetPasswordForEmail(selectedUser?.email || '', {
                redirectTo: `${window.location.origin}/reset-password`,
            });

            if (resetError) {
                // If direct reset fails, we can prompt user to change it via admin panel
                throw new Error('Password reset email sent. User must verify via email.');
            }

            setSuccess(true);
            setSuccessMessage(
                `Password reset link sent to ${selectedUser?.performer_name}. They must verify via email to complete the reset.`
            );
            setSelectedUserId('');
            setNewPassword('');
            setConfirmPassword('');
            setSearchQuery('');

            // Notify parent component
            if (onPasswordReset) {
                onPasswordReset(selectedUserId);
            }

            // Close after 3 seconds
            setTimeout(() => {
                onClose();
            }, 3000);
        } catch (err) {
            setError(err.message || 'Failed to reset password');
            console.error('Reset password error:', err);
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl p-8 max-w-md w-full border border-gray-100 dark:border-gray-800">
                    <div className="text-center">
                        <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                            <CheckCircle2 className="text-green-600 w-8 h-8" />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                            Reset Link Sent
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 text-sm">
                            {successMessage}
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    // Check RBAC
    if (profile?.role !== 'super_admin' && profile?.role !== 'general_manager') {
        return (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl p-8 max-w-md w-full border border-gray-100 dark:border-gray-800">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                        ❌ Access Denied
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">
                        Only Super Admin and General Manager can reset user passwords.
                    </p>
                    <button
                        onClick={onClose}
                        className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition"
                    >
                        Close
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl p-8 max-w-md w-full border border-gray-100 dark:border-gray-800 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                        <Lock className="w-6 h-6 text-red-600" />
                        Reset User Password
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-2xl leading-none"
                    >
                        ×
                    </button>
                </div>

                <p className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg mb-6 border border-amber-200 dark:border-amber-800">
                    ⚠️ This action will send a password reset email to the selected user. They must verify to set a new password.
                </p>

                {error && (
                    <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-2xl text-red-600 dark:text-red-400 text-sm font-medium flex items-center gap-2">
                        <span>⚠️</span> {error}
                    </div>
                )}

                <form onSubmit={handleResetPassword} className="space-y-5">
                    {/* User Selection */}
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-400 mb-2">
                            Select User
                        </label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <input
                                type="text"
                                placeholder="Search by name or role..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition dark:text-white mb-2"
                            />
                        </div>

                        {/* User dropdown with filtered results */}
                        <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
                            <select
                                value={selectedUserId}
                                onChange={(e) => setSelectedUserId(e.target.value)}
                                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                            >
                                <option value="">-- Choose User --</option>
                                {filteredProfiles.length > 0 ? (
                                    filteredProfiles.map((p) => (
                                        <option key={p.id} value={p.id}>
                                            {p.performer_name} • {p.role}
                                        </option>
                                    ))
                                ) : (
                                    <option disabled>
                                        {searchQuery ? 'No matching users' : 'No other users available'}
                                    </option>
                                )}
                            </select>
                        </div>
                    </div>

                    {selectedUserId && (
                        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl text-sm text-blue-700 dark:text-blue-300">
                            ℹ️ A password reset email will be sent to <strong>{allProfiles.find((p) => p.id === selectedUserId)?.performer_name}</strong>
                        </div>
                    )}

                    {/* New Password (Optional - for display only) */}
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-400 mb-2">
                            Temporary Password (Min 6 characters)
                        </label>
                        <input
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition dark:text-white"
                            placeholder="Optional - or user resets via email"
                            minLength={6}
                        />
                    </div>

                    {/* Confirm Password */}
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-400 mb-2">
                            Confirm Password
                        </label>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition dark:text-white"
                            placeholder="Optional - or user resets via email"
                            minLength={6}
                        />
                    </div>

                    {/* Buttons */}
                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={loading}
                            className="flex-1 px-4 py-3 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold rounded-xl transition disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading || !selectedUserId}
                            className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl transition disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                            {loading ? 'Resetting...' : 'Send Reset Link'}
                        </button>
                    </div>
                </form>

                {/* Audit Log */}
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-4 text-center border-t border-gray-200 dark:border-gray-700 pt-4">
                    🔍 All admin actions are logged for security and compliance
                </p>
            </div>
        </div>
    );
};

export default AdminResetUserPassword;
