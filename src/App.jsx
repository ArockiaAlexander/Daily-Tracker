import { useState, useEffect } from 'react';
import Modal from './components/Modal';
import Toast from './components/Toast';
import Dashboard from './components/Dashboard';
import Login from './components/Login';
import Signup from './components/Signup';
import ForgotPassword from './components/ForgotPassword';
import ResetPassword from './components/ResetPassword';
import LandingPage from './components/LandingPage';
import { supabase } from './lib/supabase';
import {
    LayoutDashboard,
    ClipboardList,
    RefreshCw,
    LogOut,
    User,
    ShieldCheck,
    Briefcase,
    Loader2,
    Users,
    Settings,
    Search,
    UserPlus,
    Copy,
    Check,
    Trash2
} from 'lucide-react';

const App = () => {
    // ── Auth & Session State ──
    const [session, setSession] = useState(null);
    const [profile, setProfile] = useState(null);
    const [authLoading, setAuthLoading] = useState(true);
    const [view, setView] = useState('landing'); // 'landing', 'login', 'signup', 'forgot-password', 'reset-password', 'app'

    // ── App State ──
    const getTodayISO = () => new Date().toISOString().slice(0, 10);
    const [performerName, setPerformerName] = useState('');
    const [titleName, setTitleName] = useState('');
    const [completedPages, setCompletedPages] = useState('');
    const [taskType, setTaskType] = useState('');
    const [estimatedTime, setEstimatedTime] = useState('');
    const [takenTime, setTakenTime] = useState('');
    const [entryDate, setEntryDate] = useState(getTodayISO);
    const [statusEntries, setStatusEntries] = useState([]);
    const [darkMode, setDarkMode] = useState(() => localStorage.getItem('cbpet_darkMode') === 'true');
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [filterDate, setFilterDate] = useState('');
    const [showErrorModal, setShowErrorModal] = useState(false);
    const [activeTab, setActiveTab] = useState('form');
    const [isSyncing, setIsSyncing] = useState(false);

    // ── Admin State ──
    const [allProfiles, setAllProfiles] = useState([]);
    const [isAdminSyncing, setIsAdminSyncing] = useState(false);
    const [userSearchTerm, setUserSearchTerm] = useState('');
    const [showInviteModal, setShowInviteModal] = useState(false);

    // ── Auth Effects ──
    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            if (session) fetchProfile(session.user.id);
            setAuthLoading(false);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            if (session) {
                fetchProfile(session.user.id);
                const hash = window.location.hash;
                if (hash && hash.includes('access_token') && hash.includes('type=recovery')) {
                    setView('reset-password');
                } else {
                    setView('app');
                }
            } else {
                setProfile(null);
                // Keep the landing page if that was the intent, otherwise login
                setView(prev => prev === 'signup' ? 'signup' : (prev === 'landing' ? 'landing' : 'login'));
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const fetchProfile = async (uid) => {
        try {
            const { data, error } = await supabase.from('profiles').select('*').eq('id', uid).single();
            if (error) throw error;
            setProfile(data);
            if (data.performer_name) setPerformerName(data.performer_name);
        } catch (error) {
            console.error('Error fetching profile:', error.message);
        }
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
    };

    // ── App Data Effects ──
    useEffect(() => {
        if (darkMode) document.documentElement.classList.add('dark');
        else document.documentElement.classList.remove('dark');
        localStorage.setItem('cbpet_darkMode', darkMode);
    }, [darkMode]);

    useEffect(() => {
        if (session) {
            fetchFromSupabase();
            if (profile?.role === 'admin' || profile?.role === 'manager') fetchAllProfiles();
        }
    }, [session, profile]);

    // ── Data Logic ──
    const fetchFromSupabase = async () => {
        if (!supabase || !session) return;
        setIsSyncing(true);
        try {
            let query = supabase.from('status_entries').select('*').order('date', { ascending: false });
            if (profile?.role === 'performer') {
                query = query.eq('user_id', session.user.id);
            } else if (profile?.role === 'lead') {
                query = query.eq('client_id', profile.client_id);
            }
            const { data, error } = await query;
            if (error) throw error;
            setStatusEntries(data || []);
        } catch (error) {
            console.error('Error fetching entries:', error.message);
        } finally {
            setIsSyncing(false);
        }
    };

    const fetchAllProfiles = async () => {
        if (profile?.role !== 'admin' && profile?.role !== 'manager') return;
        setIsAdminSyncing(true);
        try {
            const { data, error } = await supabase.from('profiles').select('*').order('performer_name', { ascending: true });
            if (error) throw error;
            setAllProfiles(data || []);
        } catch (error) {
            console.error('Error fetching profiles:', error.message);
        } finally {
            setIsAdminSyncing(false);
        }
    };

    const handleUpdateUserRole = async (userId, newRole, clientId) => {
        try {
            const { error } = await supabase
                .from('profiles')
                .update({ role: newRole, client_id: clientId })
                .eq('id', userId);

            if (error) throw error;
            setToastMessage('✅ User updated successfully');
            setShowToast(true);
            fetchAllProfiles();
        } catch (error) {
            alert('Error updating user: ' + error.message);
        }
    };

    const handleDeleteUser = async (userId) => {
        if (!window.confirm('Are you sure you want to delete this user profile? This removes their access metadata.')) return;
        try {
            const { error } = await supabase.from('profiles').delete().eq('id', userId);
            if (error) throw error;
            setToastMessage('🗑️ User profile removed');
            setShowToast(true);
            fetchAllProfiles();
        } catch (error) {
            alert('Error deleting user: ' + error.message);
        }
    };

    const syncToSupabase = async (newEntry) => {
        if (!supabase || !session) return;
        try {
            const entryWithAuth = {
                ...newEntry,
                user_id: session.user.id,
                client_id: profile?.client_id || 'DEFAULT_CLIENT'
            };
            const { error } = await supabase.from('status_entries').insert([entryWithAuth]);
            if (error) throw error;
        } catch (error) {
            console.error('Error syncing:', error.message);
            setToastMessage('❌ Sync failed: ' + error.message);
            setShowToast(true);
        }
    };

    // ── Config ──
    const standardTargets = {
        Prestyle: 900, Preedit: 300, 'FL Validation': 600, 'Revises Validation': 1200,
        Normalisation: 300, 'Cast-off XML Conversion': 4, 'Ref Edit': 400, 'Style Editing': 80
    };
    const STANDARD_WORK_HOURS_PER_DAY = 8;
    const MOTIVATIONAL_MESSAGE = 'Keep Trying!';

    const timeAchievedPercentage = estimatedTime > 0 && takenTime > 0
        ? ((estimatedTime / takenTime) * 100).toFixed(2) : 0;

    const targetAchievedPercentage = taskType && standardTargets[taskType] > 0 && takenTime > 0
        ? ((completedPages / ((standardTargets[taskType] / STANDARD_WORK_HOURS_PER_DAY) * takenTime)) * 100).toFixed(2) : 0;

    // ── Handlers ──
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!performerName || !titleName || !completedPages || !taskType || !estimatedTime || !takenTime || !entryDate) {
            setShowErrorModal(true);
            return;
        }
        const achievementStatus = targetAchievedPercentage >= 100 ? 'Achieved' : MOTIVATIONAL_MESSAGE;
        const newEntry = {
            id: Date.now(), date: entryDate, performerName: performerName.trim(),
            titleName: titleName.trim(), completedPages: Number(completedPages), taskType,
            estimatedTime: Number(estimatedTime), takenTime: Number(takenTime),
            timeAchieved: timeAchievedPercentage, targetAchieved: targetAchievedPercentage, status: achievementStatus
        };
        setStatusEntries(prev => [newEntry, ...prev]);
        await syncToSupabase(newEntry);
        setTitleName(''); setCompletedPages(''); setTaskType(''); setEstimatedTime(''); setTakenTime('');
        setToastMessage('✅ Status saved and synced!'); setShowToast(true);
    };

    const handleDeleteEntry = async (id) => {
        if (!window.confirm('Delete this entry?')) return;
        try {
            const { error } = await supabase.from('status_entries').delete().eq('id', id);
            if (error) throw error;
            setStatusEntries(prev => prev.filter(e => e.id !== id));
            setToastMessage('🗑️ Entry deleted'); setShowToast(true);
        } catch (err) {
            alert('Error: ' + err.message);
        }
    };

    if (authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
                <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
            </div>
        );
    }

    if (!session) {
        if (view === 'landing') return <LandingPage onGetStarted={() => setView('login')} />;
        if (view === 'signup') return <Signup setView={setView} />;
        if (view === 'forgot-password') return <ForgotPassword setView={setView} />;
        if (view === 'reset-password') return <ResetPassword setView={setView} />;
        return <Login setView={setView} />;
    }

    const displayedEntries = filterDate ? statusEntries.filter(e => e.date === filterDate) : statusEntries;

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-800 dark:text-gray-100 p-4 transition-colors duration-300 font-sans">
            <Toast show={showToast} message={toastMessage} onDone={() => setShowToast(false)} />

            <nav className="container mx-auto max-w-7xl mb-6 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                        <ShieldCheck size={24} />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">CBPET Tracker</h1>
                        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400">
                            <span className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded border border-gray-100 dark:border-gray-700">{profile?.role || 'Performer'}</span>
                            {profile?.client_id && <span>• {profile.client_id}</span>}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-gray-50 dark:bg-gray-800 rounded-lg text-xs font-bold font-mono">
                        <User size={14} className="text-gray-400" />
                        <span>{session.user.email}</span>
                    </div>
                    <button onClick={() => setDarkMode(!darkMode)} className="p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                        {darkMode ? '☀️' : '🌙'}
                    </button>
                    <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2.5 bg-red-50 hover:bg-red-100 dark:bg-red-950/30 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 rounded-xl font-bold transition-all text-sm uppercase tracking-widest">
                        <LogOut size={18} />
                        Logout
                    </button>
                </div>
            </nav>

            <div className="container mx-auto max-w-7xl mb-8 flex justify-center">
                <div className="bg-white dark:bg-gray-900 p-1.5 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-800 flex gap-2 overflow-x-auto">
                    <button onClick={() => setActiveTab('form')} className={`flex items-center gap-2 px-6 py-3 rounded-xl font-black uppercase tracking-widest text-xs transition-all ${activeTab === 'form' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
                        <ClipboardList size={18} />Entry Form
                    </button>
                    <button onClick={() => setActiveTab('dashboard')} className={`flex items-center gap-2 px-6 py-3 rounded-xl font-black uppercase tracking-widest text-xs transition-all ${activeTab === 'dashboard' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
                        <LayoutDashboard size={18} />Analytics
                    </button>
                    {(profile?.role === 'admin' || profile?.role === 'manager') && (
                        <button onClick={() => setActiveTab('admin')} className={`flex items-center gap-2 px-6 py-3 rounded-xl font-black uppercase tracking-widest text-xs transition-all ${activeTab === 'admin' ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/30' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
                            <Users size={18} />User Management
                        </button>
                    )}
                </div>
            </div>

            <div className="container mx-auto max-w-7xl bg-white dark:bg-gray-900 rounded-3xl p-6 md:p-10 shadow-xl border border-gray-100 dark:border-gray-800 min-h-[600px]">
                {activeTab === 'dashboard' ? (
                    <Dashboard entries={statusEntries} userProfile={profile} />
                ) : activeTab === 'admin' ? (
                    <div className="space-y-8">
                        <div className="flex justify-between items-center">
                            <h2 className="text-2xl font-black flex items-center gap-3">
                                <Users className="text-purple-600" />
                                System Administration
                            </h2>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setShowInviteModal(true)}
                                    className="flex items-center gap-2 px-6 py-2.5 bg-purple-600 text-white font-black rounded-xl shadow-lg shadow-purple-500/20 transition-all text-xs uppercase tracking-widest active:scale-95"
                                >
                                    <UserPlus size={16} /> Provision User
                                </button>
                                <button onClick={fetchAllProfiles} disabled={isAdminSyncing} className={`p-2 bg-purple-50 dark:bg-purple-900/30 text-purple-600 rounded-lg ${isAdminSyncing ? 'animate-spin' : ''}`}>
                                    <RefreshCw size={20} />
                                </button>
                            </div>
                        </div>

                        {/* Search Bar */}
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                                type="text"
                                placeholder="Search users by name, role or ID..."
                                value={userSearchTerm}
                                onChange={(e) => setUserSearchTerm(e.target.value)}
                                className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-purple-500 rounded-2xl outline-none transition-all text-sm font-bold"
                            />
                        </div>

                        {/* User Invite Modal */}
                        {showInviteModal && (
                            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                                <div className="bg-white dark:bg-gray-900 rounded-[40px] p-10 max-w-lg w-full shadow-2xl border border-gray-100 dark:border-gray-800 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full -mr-16 -mt-16 blur-3xl" />

                                    <h3 className="text-2xl font-black mb-2 tracking-tight">Provision New User</h3>
                                    <p className="text-gray-500 dark:text-gray-400 text-sm mb-8 font-medium">Generate a registration link for new team members. They will join as 'Performer' by default.</p>

                                    <div className="space-y-6">
                                        <div className="p-6 bg-gray-50 dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3">Copy Registration URL</p>
                                            <div className="flex items-center gap-2 bg-white dark:bg-gray-950 p-3 rounded-xl border border-gray-100 dark:border-gray-800">
                                                <code className="flex-1 text-[10px] font-bold text-gray-500 truncate">{window.location.origin}/signup</code>
                                                <button
                                                    onClick={() => {
                                                        navigator.clipboard.writeText(`${window.location.origin}/signup`);
                                                        setToastMessage('📋 Link copied to clipboard!');
                                                        setShowToast(true);
                                                    }}
                                                    className="p-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                                                >
                                                    <Copy size={16} />
                                                </button>
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            <div className="flex items-start gap-4 p-4 rounded-2xl bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900">
                                                <div className="p-2 bg-blue-600 rounded-lg text-white font-black text-xs">1</div>
                                                <p className="text-xs font-semibold text-blue-800 dark:text-blue-300">New user signs up via this link.</p>
                                            </div>
                                            <div className="flex items-start gap-4 p-4 rounded-2xl bg-purple-50/50 dark:bg-purple-900/10 border border-purple-100 dark:border-purple-900/30">
                                                <div className="p-2 bg-purple-600 rounded-lg text-white font-black text-xs">2</div>
                                                <p className="text-xs font-semibold text-purple-800 dark:text-purple-300">You refresh this tab and assign their Role/Client ID.</p>
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => setShowInviteModal(false)}
                                        className="w-full mt-10 py-4 bg-gray-900 dark:bg-gray-800 text-white font-black rounded-2xl uppercase tracking-widest text-xs transition-all hover:bg-black"
                                    >
                                        Close Management
                                    </button>
                                </div>
                            </div>
                        )}

                        <div className="overflow-x-auto rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-gray-50 dark:bg-gray-800/50">
                                    <tr>
                                        <th className="p-4 text-[10px] font-black uppercase tracking-widest text-gray-400">User Name</th>
                                        <th className="p-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Assignment</th>
                                        <th className="p-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Role</th>
                                        <th className="p-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y dark:divide-gray-800">
                                    {allProfiles.filter(p =>
                                        p.performer_name?.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
                                        p.role?.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
                                        p.id?.toLowerCase().includes(userSearchTerm.toLowerCase())
                                    ).map(p => (
                                        <AdminUserRow
                                            key={p.id}
                                            user={p}
                                            onUpdate={handleUpdateUserRole}
                                            onDelete={handleDeleteUser}
                                            isSelf={p.id === session.user.id}
                                            currentUserRole={profile?.role}
                                        />
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col lg:flex-row gap-12">
                        <div className="flex-1 max-w-xl">
                            <div className="flex items-center gap-3 mb-8">
                                <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg text-blue-600"><Briefcase size={24} /></div>
                                <h2 className="text-2xl font-bold">Log Activity</h2>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-2 ml-1">Performer</label>
                                        {(profile?.role === 'admin' || profile?.role === 'manager') ? (
                                            <select
                                                value={performerName}
                                                onChange={e => setPerformerName(e.target.value)}
                                                className="w-full p-3.5 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22currentColor%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C/polyline%3E%3C/svg%3E')] bg-[length:20px_20px] bg-[right_1rem_center] bg-no-repeat"
                                            >
                                                <option value={profile.performer_name}>{profile.performer_name} (You)</option>
                                                {allProfiles.filter(p => p.id !== session.user.id).map(p => (
                                                    <option key={p.id} value={p.performer_name}>{p.performer_name}</option>
                                                ))}
                                            </select>
                                        ) : (
                                            <input type="text" value={performerName} readOnly className="w-full p-3.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-500 cursor-not-allowed font-medium" />
                                        )}
                                    </div>
                                    <div>
                                        <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-2 ml-1">Date</label>
                                        <input type="date" value={entryDate} onChange={e => setEntryDate(e.target.value)} className="w-full p-3.5 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium" required />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-2 ml-1">Project/Title Name</label>
                                    <input type="text" value={titleName} onChange={e => setTitleName(e.target.value)} className="w-full p-3.5 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium" placeholder="e.g., Springer Nature Vol 42" required />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-2 ml-1">Task Type</label>
                                        <select value={taskType} onChange={e => setTaskType(e.target.value)} className="w-full p-3.5 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 outline-none transition-all appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22currentColor%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C/polyline%3E%3C/svg%3E')] bg-[length:20px_20px] bg-[right_1rem_center] bg-no-repeat font-medium" required>
                                            <option value="">Select Task</option>
                                            {Object.keys(standardTargets).map(k => <option key={k} value={k}>{k}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-2 ml-1">Work Done</label>
                                        <input type="number" value={completedPages} onChange={e => setCompletedPages(e.target.value)} className="w-full p-3.5 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium" placeholder="150" required />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-2 ml-1">Estimated Hours</label>
                                        <input type="number" value={estimatedTime} onChange={e => setEstimatedTime(e.target.value)} className="w-full p-3.5 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium" step="0.1" placeholder="8.0" required />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-2 ml-1">Taken Hours</label>
                                        <input type="number" value={takenTime} onChange={e => setTakenTime(e.target.value)} className="w-full p-3.5 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium" step="0.1" placeholder="7.5" required />
                                    </div>
                                </div>

                                <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-xl shadow-lg shadow-blue-500/30 active:scale-[0.98] transition-all flex items-center justify-center gap-2 uppercase tracking-widest text-sm">
                                    <ShieldCheck size={20} />Authorize and Log
                                </button>
                            </form>
                        </div>

                        <div className="flex-1 space-y-8">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-6 rounded-2xl bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-900">
                                    <p className="text-[10px] font-black text-green-600 uppercase tracking-widest mb-1">Target Achievement</p>
                                    <span className={`text-4xl font-extrabold ${Number(targetAchievedPercentage) >= 100 ? 'text-green-700 dark:text-green-400' : 'text-amber-600'}`}>{targetAchievedPercentage}%</span>
                                </div>
                                <div className="p-6 rounded-2xl bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-900">
                                    <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-1">Time Efficiency</p>
                                    <span className="text-4xl font-extrabold text-indigo-700 dark:text-indigo-400">{timeAchievedPercentage}%</span>
                                </div>
                            </div>

                            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-3xl p-6 border border-gray-100 dark:border-gray-800">
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-sm font-black uppercase tracking-widest text-gray-500 flex items-center gap-2">History Log <span className="text-[10px] bg-white dark:bg-gray-700 px-2 py-0.5 rounded-full border border-gray-100 dark:border-gray-600">{statusEntries.length}</span></h3>
                                    <div className="flex items-center gap-2">
                                        <input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)} className="p-2 text-xs border border-gray-200 dark:border-gray-700 dark:bg-gray-900 rounded-lg outline-none font-bold" />
                                        <button onClick={fetchFromSupabase} disabled={isSyncing} className={`p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg ${isSyncing ? 'animate-spin' : ''}`}>
                                            <RefreshCw size={14} />
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                    {displayedEntries.length > 0 ? displayedEntries.map(e => (
                                        <div key={e.id} className="p-4 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex items-center justify-between hover:border-blue-200 transition-colors group">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-[10px] font-black text-gray-400">{e.date}</span>
                                                    <span className="text-[9px] font-black uppercase py-0.5 px-1.5 bg-blue-50 dark:bg-blue-900/40 text-blue-600 rounded border border-blue-100 dark:border-blue-900">{e.taskType}</span>
                                                </div>
                                                <p className="font-bold text-sm truncate max-w-[200px] group-hover:text-blue-600 transition-colors" title={e.titleName}>{e.titleName}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className={`font-black text-sm ${e.targetAchieved >= 100 ? 'text-green-600' : 'text-amber-500'}`}>{e.targetAchieved}%</p>
                                                <button onClick={() => handleDeleteEntry(e.id)} className="text-[10px] font-black uppercase text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">Delete</button>
                                            </div>
                                        </div>
                                    )) : <div className="text-center py-20 bg-gray-50/50 dark:bg-gray-800/30 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-800"><p className="text-xs font-black uppercase text-gray-400">System Ready • No Logs Found</p></div>}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <footer className="container mx-auto max-w-7xl mt-8 text-center text-xs font-bold text-gray-400 dark:text-gray-600 uppercase tracking-[0.3em]">
                &copy; {new Date().getFullYear()} CBPET Engine Alpha • Real-time Monitoring Active
            </footer>
        </div>
    );
};

// ── Admin Sub-Component ──
const AdminUserRow = ({ user, onUpdate, onDelete, isSelf, currentUserRole }) => {
    const [role, setRole] = useState(user.role);
    const [clientId, setClientId] = useState(user.client_id || '');
    const [changed, setChanged] = useState(false);

    const handleSave = () => {
        onUpdate(user.id, role, clientId);
        setChanged(false);
    };

    // Define which roles the current user can assign
    const getAvailableRoles = () => {
        if (currentUserRole === 'admin') {
            return [
                { value: 'performer', label: 'Performer' },
                { value: 'lead', label: 'Client Lead' },
                { value: 'manager', label: 'Manager' },
                { value: 'admin', label: 'Admin' }
            ];
        }
        if (currentUserRole === 'manager') {
            // Managers can only assign performer or lead roles
            return [
                { value: 'performer', label: 'Performer' },
                { value: 'lead', label: 'Client Lead' }
            ];
        }
        return [];
    };

    const availableRoles = getAvailableRoles();

    return (
        <tr className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors group">
            <td className="p-4">
                <p className="font-bold text-sm tracking-tight">{user.performer_name}</p>
                <p className="text-[10px] text-gray-400 font-medium font-mono">{user.id.slice(0, 8)}...</p>
            </td>
            <td className="p-4">
                <input
                    type="text"
                    value={role === 'lead' ? clientId : 'ALL ACCESS'}
                    disabled={role !== 'lead'}
                    onChange={(e) => { setClientId(e.target.value); setChanged(true); }}
                    placeholder="Enter Client ID"
                    className="w-full bg-gray-50 dark:bg-gray-800 text-xs font-bold p-2.5 rounded-lg border border-transparent focus:border-purple-500 outline-none transition-all disabled:opacity-50"
                />
            </td>
            <td className="p-4">
                <select
                    value={role}
                    onChange={(e) => { setRole(e.target.value); setChanged(true); }}
                    className="bg-gray-50 dark:bg-gray-800 text-xs font-bold p-2.5 rounded-lg border border-transparent focus:border-purple-500 outline-none transition-all"
                    disabled={isSelf || (currentUserRole === 'manager' && (user.role === 'admin' || user.role === 'manager'))}
                >
                    {availableRoles.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                    {/* If current user is manager and target user is higher, show their current role as read-only */}
                    {currentUserRole === 'manager' && (user.role === 'admin' || user.role === 'manager') && (
                        <option value={user.role} disabled>{user.role.charAt(0).toUpperCase() + user.role.slice(1)}</option>
                    )}
                </select>
            </td>
            <td className="p-4 flex items-center gap-3">
                {changed ? (
                    <button onClick={handleSave} className="px-4 py-2 bg-purple-600 text-white text-[10px] font-black uppercase tracking-widest rounded-lg shadow-lg shadow-purple-500/30">Save</button>
                ) : (
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 opacity-40">Sync</span>
                )}
                {!isSelf && currentUserRole === 'admin' && (
                    <button
                        onClick={() => onDelete(user.id)}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-all"
                        title="Delete User Profile"
                    >
                        <Trash2 size={14} />
                    </button>
                )}
            </td>
        </tr>
    );
};

export default App;
