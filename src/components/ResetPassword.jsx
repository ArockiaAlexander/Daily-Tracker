import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Lock, Loader2, CheckCircle2 } from 'lucide-react';

const ResetPassword = ({ setView }) => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    const handleUpdatePassword = async (e) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            setError("Passwords don't match");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const { error: updateError } = await supabase.auth.updateUser({
                password: password,
            });

            if (updateError) throw updateError;
            setSuccess(true);
            setTimeout(() => setView('login'), 3000);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 px-4">
            <div className="max-w-md w-full bg-white dark:bg-gray-900 rounded-3xl shadow-2xl p-10 border border-gray-100 dark:border-gray-800">
                <div className="text-center mb-10">
                    <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight">New Password</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-3 font-medium">Re-establish secure access</p>
                </div>

                {success ? (
                    <div className="text-center">
                        <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-3xl flex items-center justify-center mx-auto mb-8">
                            <CheckCircle2 className="text-green-600 w-10 h-10" />
                        </div>
                        <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-3">Password Secured</h3>
                        <p className="text-gray-500 dark:text-gray-400 font-medium">
                            Your credentials have been updated. Redirecting to terminal...
                        </p>
                    </div>
                ) : (
                    <>
                        {error && (
                            <div className="mb-8 p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-2xl text-red-600 dark:text-red-400 text-sm font-bold flex items-center gap-2">
                                <span>⚠️</span> {error}
                            </div>
                        )}

                        <form onSubmit={handleUpdatePassword} className="space-y-6">
                            <div>
                                <label className="block text-[11px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-2 ml-1">
                                    New Access Key
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-blue-500 focus:bg-white dark:focus:bg-gray-900 rounded-2xl outline-none transition-all dark:text-white font-medium"
                                        placeholder="••••••••"
                                        required
                                        minLength={6}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-[11px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-2 ml-1">
                                    Confirm Key
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                                    <input
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-blue-500 focus:bg-white dark:focus:bg-gray-900 rounded-2xl outline-none transition-all dark:text-white font-medium"
                                        placeholder="••••••••"
                                        required
                                        minLength={6}
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-2xl shadow-xl shadow-blue-500/30 active:scale-[0.98] transition-all flex items-center justify-center gap-2 uppercase tracking-widest text-sm"
                            >
                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Update Credentials'}
                            </button>
                        </form>
                    </>
                )}
            </div>
        </div>
    );
};

export default ResetPassword;
