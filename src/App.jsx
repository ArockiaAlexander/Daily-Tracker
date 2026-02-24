import { useState, useEffect } from 'react';
import Modal from './components/Modal';
import Toast from './components/Toast';
import Dashboard from './components/Dashboard';
import { supabase } from './lib/supabase';
import { LayoutDashboard, ClipboardList, RefreshCw } from 'lucide-react';

const App = () => {
    // ── Helper: today as YYYY-MM-DD ──
    const getTodayISO = () => new Date().toISOString().slice(0, 10);

    // ── Form State ──
    const [performerName, setPerformerName] = useState(
        () => localStorage.getItem('lastPerformerName') || ''
    );
    const [titleName, setTitleName] = useState('');
    const [completedPages, setCompletedPages] = useState('');
    const [taskType, setTaskType] = useState('');
    const [estimatedTime, setEstimatedTime] = useState('');
    const [takenTime, setTakenTime] = useState('');
    const [entryDate, setEntryDate] = useState(getTodayISO);

    // ── Data State ──
    const [statusEntries, setStatusEntries] = useState(() => {
        try {
            const saved = localStorage.getItem('cbpet_statusEntries');
            return saved ? JSON.parse(saved) : [];
        } catch {
            return [];
        }
    });

    // ── UI State ──
    const [darkMode, setDarkMode] = useState(() => {
        const saved = localStorage.getItem('cbpet_darkMode');
        return saved === 'true';
    });
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [filterDate, setFilterDate] = useState('');

    // ── Modal State ──
    const [showErrorModal, setShowErrorModal] = useState(false);
    const [showNoDataModal, setShowNoDataModal] = useState(false);
    const [showConfirmClearModal, setShowConfirmClearModal] = useState(false);
    const [showDailySummaryModal, setShowDailySummaryModal] = useState(false);
    const [dailySummaryData, setDailySummaryData] = useState({});
    const [activeTab, setActiveTab] = useState('form');
    const [isSyncing, setIsSyncing] = useState(false);

    // ── Effects ──
    useEffect(() => {
        localStorage.setItem('cbpet_statusEntries', JSON.stringify(statusEntries));
    }, [statusEntries]);

    useEffect(() => {
        localStorage.setItem('cbpet_darkMode', darkMode);
        if (darkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [darkMode]);

    useEffect(() => {
        fetchFromSupabase();
    }, []);

    // ── Supabase Logic ──
    const fetchFromSupabase = async () => {
        if (!supabase) return;
        setIsSyncing(true);
        try {
            const { data, error } = await supabase
                .from('status_entries')
                .select('*')
                .order('date', { ascending: false });

            if (error) throw error;
            if (data && data.length > 0) {
                setStatusEntries(data);
                setToastMessage('🔄 Synced from cloud');
                setShowToast(true);
            }
        } catch (error) {
            console.error('Error fetching from Supabase:', error.message);
        } finally {
            setIsSyncing(false);
        }
    };

    const syncToSupabase = async (newEntry) => {
        if (!supabase) return;
        try {
            const { error } = await supabase
                .from('status_entries')
                .insert([newEntry]);
            if (error) throw error;
        } catch (error) {
            console.error('Error syncing to Supabase:', error.message);
        }
    };

    // ── Config ──
    const standardTargets = {
        Prestyle: 900, Preedit: 300, 'FL Validation': 600, 'Revises Validation': 1200,
        Normalisation: 300, 'Cast-off XML Conversion': 4, 'Ref Edit': 400, 'Style Editing': 80
    };
    const standardTargetUnits = {
        Prestyle: 'pages/day', Preedit: 'pages/day', 'FL Validation': 'pages/day', 'Revises Validation': 'pages/day',
        Normalisation: 'pages/day', 'Cast-off XML Conversion': 'titles/day', 'Ref Edit': 'references/day', 'Style Editing': 'pages/day'
    };
    const STANDARD_WORK_HOURS_PER_DAY = 8;
    const MOTIVATIONAL_MESSAGE = 'Keep Trying!';

    // ── Calculations ──
    const timeAchievedPercentage = estimatedTime > 0 && takenTime > 0
        ? ((estimatedTime / takenTime) * 100).toFixed(2) : 0;

    const targetAchievedPercentage = taskType && standardTargets[taskType] > 0 && takenTime > 0
        ? ((completedPages / ((standardTargets[taskType] / STANDARD_WORK_HOURS_PER_DAY) * takenTime)) * 100).toFixed(2) : 0;

    // ── Handlers ──
    const handleSubmit = (e) => {
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
        setStatusEntries(prev => [...prev, newEntry]);
        syncToSupabase(newEntry);
        localStorage.setItem('lastPerformerName', performerName.trim());
        setTitleName(''); setCompletedPages(''); setTaskType(''); setEstimatedTime(''); setTakenTime('');
        setToastMessage('✅ Entry saved successfully!'); setShowToast(true);
    };

    const handleDeleteEntry = (id) => setStatusEntries(prev => prev.filter(e => e.id !== id));
    const confirmClearHistory = () => {
        setStatusEntries([]); setShowConfirmClearModal(false);
        setToastMessage('🗑️ History cleared'); setShowToast(true);
    };

    const handleCompleteDailySubmission = () => {
        const today = getTodayISO();
        const dailyEntries = statusEntries.filter(e => e.date === today);
        if (dailyEntries.length === 0) { setShowNoDataModal(true); return; }
        let totalCompletedWork = 0, totalTakenTime = 0, sumOfWeightedTargetAchievement = 0;
        dailyEntries.forEach(entry => {
            totalCompletedWork += entry.completedPages; totalTakenTime += entry.takenTime;
            const target = standardTargets[entry.taskType] || 0;
            if (target > 0) {
                const units = (entry.completedPages / target) * STANDARD_WORK_HOURS_PER_DAY;
                sumOfWeightedTargetAchievement += (units / entry.takenTime) * 100 * entry.takenTime;
            }
        });
        const dailyTargetAchieved = totalTakenTime > 0 ? (sumOfWeightedTargetAchievement / totalTakenTime).toFixed(2) : 0;
        setDailySummaryData({ totalCompletedWork, totalTakenTime, dailyTargetAchieved, isAchieved: dailyTargetAchieved >= 100 });
        setShowDailySummaryModal(true);
    };

    const handleDownloadCSV = () => {
        if (statusEntries.length === 0) { setShowNoDataModal(true); return; }
        const headers = ['Date', 'Performer Name', 'Title Name', 'Task Type', 'Standard Target', 'Completed Work', 'Estimated Time (hours)', 'Taken Time (hours)', 'Time Achieved (%)', 'Target Achieved (%)', 'Status'];
        const escapeCSV = val => {
            const str = String(val);
            return str.includes(',') || str.includes('"') ? `"${str.replace(/"/g, '""')}"` : str;
        };
        const rows = statusEntries.map(e => [
            e.date, escapeCSV(e.performerName || ''), escapeCSV(e.titleName), escapeCSV(e.taskType),
            `${standardTargets[e.taskType] || ''} ${standardTargetUnits[e.taskType] || ''}`.trim(),
            e.completedPages, e.estimatedTime, e.takenTime, e.timeAchieved, e.targetAchieved, e.status
        ]);
        const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url); link.setAttribute('download', `daily_report_${getTodayISO()}.csv`);
        link.style.visibility = 'hidden'; document.body.appendChild(link);
        link.click(); document.body.removeChild(link); URL.revokeObjectURL(url);
    };

    const displayedEntries = filterDate ? statusEntries.filter(e => e.date === filterDate) : statusEntries;

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-100 p-4 transition-colors duration-300">
            <Toast show={showToast} message={toastMessage} onDone={() => setShowToast(false)} />

            <Modal show={showErrorModal} onClose={() => setShowErrorModal(false)}>
                <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-red-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>
                </div>
                <h3 className="text-xl font-bold mb-2 text-red-600">Validation Error</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-6">Please fill out all fields.</p>
                <button onClick={() => setShowErrorModal(false)} className="px-8 py-2.5 bg-blue-600 text-white rounded-xl">OK</button>
            </Modal>

            <Modal show={showNoDataModal} onClose={() => setShowNoDataModal(false)}>
                <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-amber-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
                </div>
                <h3 className="text-xl font-bold mb-2 text-amber-600">No Data Found</h3>
                <button onClick={() => setShowNoDataModal(false)} className="px-8 py-2.5 bg-blue-600 text-white rounded-xl">OK</button>
            </Modal>

            <Modal show={showConfirmClearModal} onClose={() => setShowConfirmClearModal(false)}>
                <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-red-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
                </div>
                <h3 className="text-xl font-bold mb-2 text-red-600">Clear All History?</h3>
                <div className="flex gap-3 justify-center">
                    <button onClick={() => setShowConfirmClearModal(false)} className="px-6 py-2.5 bg-gray-200">Cancel</button>
                    <button onClick={confirmClearHistory} className="px-6 py-2.5 bg-red-600 text-white">Yes, Clear All</button>
                </div>
            </Modal>

            <Modal show={showDailySummaryModal} onClose={() => setShowDailySummaryModal(false)} maxWidth="max-w-lg">
                <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${dailySummaryData.isAchieved ? 'bg-green-100' : 'bg-blue-100'}`}>
                    {dailySummaryData.isAchieved ? <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-8.08" /><polyline points="22 4 12 14.01 9 11.01" /></svg> : <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>}
                </div>
                <h3 className={`text-2xl font-bold mb-4 ${dailySummaryData.isAchieved ? 'text-green-600' : 'text-blue-600'}`}>Summary</h3>
                <div className="space-y-2 mb-6 text-left bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
                    <p className="flex justify-between"><span>Work:</span> <strong>{dailySummaryData.totalCompletedWork}</strong></p>
                    <p className="flex justify-between"><span>Hours:</span> <strong>{dailySummaryData.totalTakenTime}</strong></p>
                    <p className="flex justify-between"><span>Achievement:</span> <strong className={dailySummaryData.isAchieved ? 'text-green-600' : 'text-amber-600'}>{dailySummaryData.dailyTargetAchieved}%</strong></p>
                </div>
                <button onClick={() => setShowDailySummaryModal(false)} className="px-8 py-2.5 bg-blue-600 text-white rounded-xl">Close</button>
            </Modal>

            <div className="container mx-auto max-w-7xl mb-6 flex justify-center">
                <div className="bg-white dark:bg-gray-800 p-1.5 rounded-2xl shadow-lg flex gap-2">
                    <button onClick={() => setActiveTab('form')} className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold ${activeTab === 'form' ? 'bg-blue-600 text-white' : 'text-gray-500'}`}><ClipboardList size={20} />Entry Form</button>
                    <button onClick={() => setActiveTab('dashboard')} className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold ${activeTab === 'dashboard' ? 'bg-blue-600 text-white' : 'text-gray-500'}`}><LayoutDashboard size={20} />Dashboard</button>
                </div>
            </div>

            <div className="container mx-auto max-w-7xl p-6 md:p-10 bg-white dark:bg-gray-800 rounded-2xl shadow-xl">
                <header className="text-center mb-10 relative">
                    <button onClick={() => setDarkMode(!darkMode)} className="absolute top-0 right-0 p-3 rounded-xl bg-gray-100 dark:bg-gray-700">{darkMode ? '☀️' : '🌙'}</button>
                    <button onClick={fetchFromSupabase} disabled={isSyncing} className={`absolute top-0 right-14 p-3 rounded-xl bg-gray-100 dark:bg-gray-700 ${isSyncing ? 'animate-spin' : ''}`}><RefreshCw size={24} /></button>
                    <h1 className="text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Daily Status Tracker CBPET</h1>
                </header>

                {activeTab === 'dashboard' ? (
                    <Dashboard entries={statusEntries} />
                ) : (
                    <div className="flex flex-col lg:flex-row gap-8">
                        <div className="w-full lg:w-5/12">
                            <h2 className="text-2xl font-bold mb-4">New Entry</h2>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div><label className="block text-sm mb-1">Performer</label><input type="text" value={performerName} onChange={e => setPerformerName(e.target.value)} className="w-full p-3 rounded-lg border dark:bg-gray-700" required /></div>
                                <div><label className="block text-sm mb-1">Date</label><input type="date" value={entryDate} onChange={e => setEntryDate(e.target.value)} className="w-full p-3 rounded-lg border dark:bg-gray-700" required /></div>
                                <div><label className="block text-sm mb-1">Title</label><input type="text" value={titleName} onChange={e => setTitleName(e.target.value)} className="w-full p-3 rounded-lg border dark:bg-gray-700" required /></div>
                                <div>
                                    <label className="block text-sm mb-1">Task</label>
                                    <select value={taskType} onChange={e => setTaskType(e.target.value)} className="w-full p-3 rounded-lg border dark:bg-gray-700" required>
                                        <option value="">Select</option>
                                        {Object.keys(standardTargets).map(k => <option key={k} value={k}>{k}</option>)}
                                    </select>
                                </div>
                                <div><label className="block text-sm mb-1">Work Done</label><input type="number" value={completedPages} onChange={e => setCompletedPages(e.target.value)} className="w-full p-3 rounded-lg border dark:bg-gray-700" required /></div>
                                <div><label className="block text-sm mb-1">Est Hours</label><input type="number" value={estimatedTime} onChange={e => setEstimatedTime(e.target.value)} className="w-full p-3 rounded-lg border dark:bg-gray-700" step="0.1" required /></div>
                                <div><label className="block text-sm mb-1">Taken Hours</label><input type="number" value={takenTime} onChange={e => setTakenTime(e.target.value)} className="w-full p-3 rounded-lg border dark:bg-gray-700" step="0.1" required /></div>
                                <button type="submit" className="w-full bg-blue-600 text-white font-bold py-3.5 rounded-xl">Save Status</button>
                            </form>
                        </div>

                        <div className="w-full lg:w-7/12">
                            <h2 className="text-2xl font-bold mb-4">Live Preview</h2>
                            <div className="grid grid-cols-2 gap-4 mb-8">
                                <div className="p-5 rounded-xl bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500">
                                    <h3 className="text-sm">Target Achieved</h3>
                                    <p className="text-3xl font-extrabold text-green-600">{targetAchievedPercentage}%</p>
                                </div>
                                <div className="p-5 rounded-xl bg-purple-50 dark:bg-purple-900/20 border-l-4 border-purple-500">
                                    <h3 className="text-sm">Time Efficiency</h3>
                                    <p className="text-3xl font-extrabold text-purple-600">{timeAchievedPercentage}%</p>
                                </div>
                            </div>

                            <div className="flex justify-between mb-4">
                                <h3 className="text-xl font-bold">History</h3>
                                {statusEntries.length > 0 && <input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)} className="p-2 text-sm border dark:bg-gray-700" />}
                            </div>

                            {displayedEntries.length > 0 ? (
                                <>
                                    <div className="overflow-x-auto rounded-xl shadow-md mb-4">
                                        <table className="min-w-full divide-y dark:divide-gray-700">
                                            <thead className="bg-gray-100 dark:bg-gray-700">
                                                <tr>
                                                    <th className="px-4 py-3 text-left text-xs uppercase">Date</th>
                                                    <th className="px-4 py-3 text-left text-xs uppercase">Performer</th>
                                                    <th className="px-4 py-3 text-left text-xs uppercase">Title</th>
                                                    <th className="px-4 py-3 text-left text-xs uppercase">Task</th>
                                                    <th className="px-4 py-3 text-left text-xs uppercase">Done</th>
                                                    <th className="px-4 py-3 text-left text-xs uppercase">Tgt %</th>
                                                    <th className="px-4 py-3 text-center text-xs uppercase">X</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y dark:divide-gray-700">
                                                {displayedEntries.map(e => (
                                                    <tr key={e.id}>
                                                        <td className="px-4 py-3 text-sm">{e.date}</td>
                                                        <td className="px-4 py-3 text-sm">{e.performerName}</td>
                                                        <td className="px-4 py-3 text-sm truncate max-w-[100px]">{e.titleName}</td>
                                                        <td className="px-4 py-3 text-sm">{e.taskType}</td>
                                                        <td className="px-4 py-3 text-sm">{e.completedPages}</td>
                                                        <td className="px-4 py-3 text-sm">{e.targetAchieved}%</td>
                                                        <td className="px-4 py-3 text-center"><button onClick={() => handleDeleteEntry(e.id)} className="text-red-500">🗑️</button></td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    <div className="flex gap-3">
                                        <button onClick={handleDownloadCSV} className="flex-1 bg-green-600 text-white py-3 rounded-xl">CSV</button>
                                        <button onClick={() => setShowConfirmClearModal(true)} className="flex-1 bg-red-600 text-white py-3 rounded-xl">Clear</button>
                                        <button onClick={handleCompleteDailySubmission} className="flex-1 bg-blue-600 text-white py-3 rounded-xl">Complete</button>
                                    </div>
                                </>
                            ) : <div className="p-8 text-center text-gray-400 bg-gray-50 dark:bg-gray-700/30 rounded-xl">No entries.</div>}
                        </div>
                    </div>
                )}
            </div>
            <footer className="text-center mt-8 text-sm text-gray-400">© {new Date().getFullYear()} Daily Status Tracker</footer>
        </div>
    );
};

export default App;
