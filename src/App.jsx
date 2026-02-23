import { useState, useEffect } from 'react';
import Modal from './components/Modal';
import Toast from './components/Toast';

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

    // ── Data State (persisted in localStorage) ──
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

    // ── Persist statusEntries to localStorage ──
    useEffect(() => {
        localStorage.setItem('cbpet_statusEntries', JSON.stringify(statusEntries));
    }, [statusEntries]);

    // ── Persist dark mode ──
    useEffect(() => {
        localStorage.setItem('cbpet_darkMode', darkMode);
        if (darkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [darkMode]);

    // ── Initialize dark mode on mount ──
    useEffect(() => {
        if (darkMode) document.documentElement.classList.add('dark');
    }, []);

    // ── Standard Targets Configuration ──
    const standardTargets = {
        Prestyle: 900,
        Preedit: 300,
        'FL Validation': 600,
        'Revises Validation': 1200,
        Normalisation: 300,
        'Cast-off XML Conversion': 4,
        'Ref Edit': 400,
        'Style Editing': 80,
    };

    const standardTargetUnits = {
        Prestyle: 'pages/day',
        Preedit: 'pages/day',
        'FL Validation': 'pages/day',
        'Revises Validation': 'pages/day',
        Normalisation: 'pages/day',
        'Cast-off XML Conversion': 'titles/day',
        'Ref Edit': 'references/day',
        'Style Editing': 'pages/day',
    };

    const STANDARD_WORK_HOURS_PER_DAY = 8;
    const MOTIVATIONAL_MESSAGE = 'Keep Trying!';

    // ── Live Preview Calculations ──
    const timeAchievedPercentage =
        estimatedTime > 0 && takenTime > 0
            ? ((estimatedTime / takenTime) * 100).toFixed(2)
            : 0;

    const targetAchievedPercentage =
        taskType && standardTargets[taskType] > 0 && takenTime > 0
            ? (
                (completedPages /
                    ((standardTargets[taskType] / STANDARD_WORK_HOURS_PER_DAY) *
                        takenTime)) *
                100
            ).toFixed(2)
            : 0;

    // ── Form Submit ──
    const handleSubmit = (e) => {
        e.preventDefault();

        if (
            !performerName ||
            !titleName ||
            !completedPages ||
            !taskType ||
            !estimatedTime ||
            !takenTime ||
            !entryDate
        ) {
            setShowErrorModal(true);
            return;
        }

        const achievementStatus =
            targetAchievedPercentage >= 100 ? 'Achieved' : MOTIVATIONAL_MESSAGE;

        const newEntry = {
            id: Date.now(),
            date: entryDate,
            performerName: performerName.trim(),
            titleName: titleName.trim(),
            completedPages: Number(completedPages),
            taskType,
            estimatedTime: Number(estimatedTime),
            takenTime: Number(takenTime),
            timeAchieved: timeAchievedPercentage,
            targetAchieved: targetAchievedPercentage,
            status: achievementStatus,
        };

        setStatusEntries((prev) => [...prev, newEntry]);
        localStorage.setItem('lastPerformerName', performerName.trim());

        // Reset form (keep performer name & date for convenience)
        setTitleName('');
        setCompletedPages('');
        setTaskType('');
        setEstimatedTime('');
        setTakenTime('');

        setToastMessage('✅ Entry saved successfully!');
        setShowToast(true);
    };

    // ── Delete Single Entry ──
    const handleDeleteEntry = (id) => {
        setStatusEntries((prev) => prev.filter((entry) => entry.id !== id));
    };

    // ── Clear History (with confirmation) ──
    const handleClearHistory = () => {
        setShowConfirmClearModal(true);
    };
    const confirmClearHistory = () => {
        setStatusEntries([]);
        setShowConfirmClearModal(false);
        setToastMessage('🗑️ History cleared');
        setShowToast(true);
    };

    // ── Complete Daily Submission ──
    const handleCompleteDailySubmission = () => {
        const today = getTodayISO();
        const dailyEntries = statusEntries.filter((entry) => entry.date === today);

        if (dailyEntries.length === 0) {
            setShowNoDataModal(true);
            return;
        }

        let totalCompletedWork = 0;
        let totalTakenTime = 0;
        let sumOfWeightedTargetAchievement = 0;

        dailyEntries.forEach((entry) => {
            totalCompletedWork += entry.completedPages;
            totalTakenTime += entry.takenTime;

            const individualStandardTarget = standardTargets[entry.taskType] || 0;
            if (individualStandardTarget > 0) {
                const equivalentEightHourWorkUnits =
                    (entry.completedPages / individualStandardTarget) *
                    STANDARD_WORK_HOURS_PER_DAY;
                sumOfWeightedTargetAchievement +=
                    (equivalentEightHourWorkUnits / entry.takenTime) *
                    100 *
                    entry.takenTime;
            }
        });

        const dailyTargetAchieved =
            totalTakenTime > 0
                ? (sumOfWeightedTargetAchievement / totalTakenTime).toFixed(2)
                : 0;

        setDailySummaryData({
            totalCompletedWork,
            totalTakenTime,
            dailyTargetAchieved,
            isAchieved: dailyTargetAchieved >= 100,
        });
        setShowDailySummaryModal(true);
    };

    // ── CSV Download ──
    const handleDownloadCSV = () => {
        if (statusEntries.length === 0) {
            setShowNoDataModal(true);
            return;
        }

        const headers = [
            'Date',
            'Performer Name',
            'Title Name',
            'Task Type',
            'Standard Target',
            'Completed Work',
            'Estimated Time (hours)',
            'Taken Time (hours)',
            'Time Achieved (%)',
            'Target Achieved (%)',
            'Status',
        ];

        const escapeCSV = (val) => {
            const str = String(val);
            return str.includes(',') || str.includes('"')
                ? `"${str.replace(/"/g, '""')}"`
                : str;
        };

        const rows = statusEntries.map((entry) => [
            entry.date,
            escapeCSV(entry.performerName || ''),
            escapeCSV(entry.titleName),
            escapeCSV(entry.taskType),
            `${standardTargets[entry.taskType] || ''} ${standardTargetUnits[entry.taskType] || ''}`.trim(),
            entry.completedPages,
            entry.estimatedTime,
            entry.takenTime,
            entry.timeAchieved,
            entry.targetAchieved,
            entry.status,
        ]);

        // Cumulative row
        let totalCompletedWorkCumulative = 0;
        let totalTakenTimeCumulative = 0;
        let sumOfWeightedTargetAchievementCumulative = 0;

        statusEntries.forEach((entry) => {
            totalCompletedWorkCumulative += entry.completedPages;
            totalTakenTimeCumulative += entry.takenTime;
            const individualStandardTarget = standardTargets[entry.taskType] || 0;
            if (individualStandardTarget > 0) {
                const equivalentEightHourWorkUnits =
                    (entry.completedPages / individualStandardTarget) *
                    STANDARD_WORK_HOURS_PER_DAY;
                sumOfWeightedTargetAchievementCumulative +=
                    (equivalentEightHourWorkUnits / entry.takenTime) *
                    100 *
                    entry.takenTime;
            }
        });

        const cumulativeTargetAchieved =
            totalTakenTimeCumulative > 0
                ? (
                    sumOfWeightedTargetAchievementCumulative / totalTakenTimeCumulative
                ).toFixed(2)
                : 0;
        const cumulativeStatus =
            cumulativeTargetAchieved >= 100 ? 'Achieved' : MOTIVATIONAL_MESSAGE;

        rows.push([
            'Cumulative Total',
            '',
            '',
            '',
            '',
            totalCompletedWorkCumulative,
            '',
            totalTakenTimeCumulative,
            '',
            cumulativeTargetAchieved,
            cumulativeStatus,
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map((row) => row.join(',')),
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `daily_status_report_${getTodayISO()}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    // ── Filtered entries for display ──
    const displayedEntries = filterDate
        ? statusEntries.filter((entry) => entry.date === filterDate)
        : statusEntries;

    // ══════════════════════════
    // ── RENDER ──
    // ══════════════════════════
    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-100 p-4 transition-colors duration-300">
            {/* ── Success Toast ── */}
            <Toast
                show={showToast}
                message={toastMessage}
                onDone={() => setShowToast(false)}
            />

            {/* ── Error Modal ── */}
            <Modal show={showErrorModal} onClose={() => setShowErrorModal(false)}>
                <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-red-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="15" y1="9" x2="9" y2="15" />
                        <line x1="9" y1="9" x2="15" y2="15" />
                    </svg>
                </div>
                <h3 className="text-xl font-bold mb-2 text-red-600">Validation Error</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-6">Please fill out all fields before submitting.</p>
                <button onClick={() => setShowErrorModal(false)} className="px-8 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl shadow-lg hover:shadow-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 font-semibold">
                    OK
                </button>
            </Modal>

            {/* ── No Data Modal ── */}
            <Modal show={showNoDataModal} onClose={() => setShowNoDataModal(false)}>
                <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-amber-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                        <line x1="12" y1="9" x2="12" y2="13" />
                        <line x1="12" y1="17" x2="12.01" y2="17" />
                    </svg>
                </div>
                <h3 className="text-xl font-bold mb-2 text-amber-600">No Data Found</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-6">There is no data to process yet. Please submit an entry first.</p>
                <button onClick={() => setShowNoDataModal(false)} className="px-8 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 font-semibold">
                    OK
                </button>
            </Modal>

            {/* ── Confirm Clear History Modal ── */}
            <Modal show={showConfirmClearModal} onClose={() => setShowConfirmClearModal(false)}>
                <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-red-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    </svg>
                </div>
                <h3 className="text-xl font-bold mb-2 text-red-600">Clear All History?</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                    This will permanently delete <strong>{statusEntries.length}</strong> entries. This action cannot be undone.
                </p>
                <div className="flex gap-3 justify-center">
                    <button onClick={() => setShowConfirmClearModal(false)} className="px-6 py-2.5 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-300 dark:hover:bg-gray-600 transition-all duration-200 font-semibold">
                        Cancel
                    </button>
                    <button onClick={confirmClearHistory} className="px-6 py-2.5 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 font-semibold">
                        Yes, Clear All
                    </button>
                </div>
            </Modal>

            {/* ── Daily Summary Modal ── */}
            <Modal show={showDailySummaryModal} onClose={() => setShowDailySummaryModal(false)} maxWidth="max-w-lg">
                <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${dailySummaryData.isAchieved ? 'bg-green-100 dark:bg-green-900/30' : 'bg-blue-100 dark:bg-blue-900/30'}`}>
                    {dailySummaryData.isAchieved ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-8.08" />
                            <polyline points="22 4 12 14.01 9 11.01" />
                        </svg>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10" />
                            <polyline points="12 6 12 12 16 14" />
                        </svg>
                    )}
                </div>
                <h3 className={`text-2xl font-bold mb-4 ${dailySummaryData.isAchieved ? 'text-green-600' : 'text-blue-600'}`}>
                    {dailySummaryData.isAchieved ? '🎉 Daily Achievement!' : 'Daily Summary'}
                </h3>
                <div className="space-y-2 mb-6 text-left bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
                    <p className="text-gray-700 dark:text-gray-300 flex justify-between">
                        <span>Total Work Completed:</span>
                        <strong>{dailySummaryData.totalCompletedWork} items</strong>
                    </p>
                    <p className="text-gray-700 dark:text-gray-300 flex justify-between">
                        <span>Total Hours Logged:</span>
                        <strong>{dailySummaryData.totalTakenTime} hours</strong>
                    </p>
                    <p className="text-gray-700 dark:text-gray-300 flex justify-between">
                        <span>Daily Target Achieved:</span>
                        <strong className={dailySummaryData.isAchieved ? 'text-green-600' : 'text-amber-600'}>
                            {dailySummaryData.dailyTargetAchieved}%
                        </strong>
                    </p>
                </div>
                <p className={`mb-6 font-bold text-lg ${dailySummaryData.isAchieved ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'}`}>
                    {dailySummaryData.isAchieved
                        ? 'Fantastic work! You hit your cumulative daily target! 🎉'
                        : `You're at ${dailySummaryData.dailyTargetAchieved}% of your daily target. ${MOTIVATIONAL_MESSAGE}`}
                </p>
                <button onClick={() => setShowDailySummaryModal(false)} className="px-8 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 font-semibold">
                    Close
                </button>
            </Modal>

            {/* ══════════════════════════════ */}
            {/* ── MAIN CONTENT ── */}
            {/* ══════════════════════════════ */}
            <div className="container mx-auto max-w-7xl p-6 md:p-10 bg-white dark:bg-gray-800 rounded-2xl shadow-xl">
                {/* ── Header with Dark Mode Toggle ── */}
                <header className="text-center mb-10 relative">
                    <button
                        id="dark-mode-toggle"
                        onClick={() => setDarkMode((prev) => !prev)}
                        className="absolute top-0 right-0 p-3 rounded-xl bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 shadow-md transition-all duration-200 hover:scale-110"
                        title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                    >
                        {darkMode ? (
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-yellow-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="5" />
                                <line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
                                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                                <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
                                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                            </svg>
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                            </svg>
                        )}
                    </button>

                    <h1 className="text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                        Daily Status Tracker CBPET
                    </h1>
                    <p className="mt-2 text-lg md:text-xl text-gray-500 dark:text-gray-400">
                        Log your progress and track your achievements.
                    </p>
                </header>

                {/* ── Two-Column Layout ── */}
                <div className="flex flex-col lg:flex-row gap-8">
                    {/* ═══════════════════════════ */}
                    {/* ── LEFT: Entry Form ── */}
                    {/* ═══════════════════════════ */}
                    <div className="w-full lg:w-5/12">
                        <h2 className="text-2xl font-bold mb-4 flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="mr-2 text-blue-500 w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                                <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
                            </svg>
                            New Status Entry
                        </h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Performer Name */}
                            <div>
                                <label className="block text-sm font-medium mb-1">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="inline mr-1 text-indigo-500 w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                                    </svg>
                                    Performer Name
                                </label>
                                <input id="performer-name" type="text" value={performerName} onChange={(e) => setPerformerName(e.target.value)}
                                    className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
                                    placeholder="e.g., John Doe" required />
                            </div>

                            {/* Date */}
                            <div>
                                <label className="block text-sm font-medium mb-1">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="inline mr-1 text-blue-500 w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                                    </svg>
                                    Date
                                </label>
                                <input id="entry-date" type="date" value={entryDate} onChange={(e) => setEntryDate(e.target.value)}
                                    className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
                                    required />
                            </div>

                            {/* Title Name */}
                            <div>
                                <label className="block text-sm font-medium mb-1">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="inline mr-1 text-purple-500 w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><line x1="9" y1="3" x2="9" y2="21" />
                                    </svg>
                                    Title Name
                                </label>
                                <input id="title-name" type="text" value={titleName} onChange={(e) => setTitleName(e.target.value)}
                                    className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
                                    placeholder="e.g., Project Alpha Book 1" required />
                            </div>

                            {/* Type of Task Performed */}
                            <div>
                                <label className="block text-sm font-medium mb-1">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="inline mr-1 text-purple-500 w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
                                        <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                                        <path d="M10 9h4" /><path d="M10 13h4" /><path d="M10 17h4" />
                                    </svg>
                                    Type of Task Performed
                                </label>
                                <select id="task-type" value={taskType} onChange={(e) => setTaskType(e.target.value)}
                                    className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
                                    required>
                                    <option value="" disabled>Select a task</option>
                                    <option value="Prestyle">Prestyle</option>
                                    <option value="Preedit">Preedit</option>
                                    <option value="Normalisation">Normalisation</option>
                                    <option value="Cast-off XML Conversion">Cast-off XML Conversion</option>
                                    <option value="FL Validation">FL Validation</option>
                                    <option value="Revises Validation">Revises Validation</option>
                                    <option value="Ref Edit">Ref Edit</option>
                                    <option value="Style Editing">Style Editing</option>
                                </select>
                                {taskType && standardTargets[taskType] && (
                                    <p className="mt-2 text-xs text-gray-500 dark:text-gray-400 bg-blue-50 dark:bg-blue-900/20 px-3 py-1.5 rounded-lg">
                                        📋 Standard target (8 hrs): <strong>{standardTargets[taskType]} {standardTargetUnits[taskType]}</strong>
                                    </p>
                                )}
                            </div>

                            {/* Completed Work */}
                            <div>
                                <label className="block text-sm font-medium mb-1">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="inline mr-1 text-green-500 w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M22 11.08V12a10 10 0 1 1-5.93-8.08" /><polyline points="22 4 12 14.01 9 11.01" />
                                    </svg>
                                    Completed Work (Pages/Titles/References)
                                </label>
                                <input id="completed-work" type="number" value={completedPages} onChange={(e) => setCompletedPages(e.target.value)}
                                    className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
                                    placeholder="e.g., 180 pages, 2 titles, 350 references" min="1" step="any" required />
                            </div>

                            {/* Estimated Time */}
                            <div>
                                <label className="block text-sm font-medium mb-1">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="inline mr-1 text-orange-500 w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                                    </svg>
                                    Estimated Time (hours)
                                </label>
                                <input id="estimated-time" type="number" value={estimatedTime} onChange={(e) => setEstimatedTime(e.target.value)}
                                    className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
                                    placeholder="e.g., 8" min="0.1" step="0.1" required />
                            </div>

                            {/* Taken Time */}
                            <div>
                                <label className="block text-sm font-medium mb-1">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="inline mr-1 text-teal-500 w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                                    </svg>
                                    Taken Time (hours)
                                </label>
                                <input id="taken-time" type="number" value={takenTime} onChange={(e) => setTakenTime(e.target.value)}
                                    className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
                                    placeholder="e.g., 7.5" min="0.1" step="0.1" required />
                            </div>

                            <button id="save-status-btn" type="submit"
                                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-3.5 px-6 rounded-xl shadow-lg transform hover:scale-[1.02] transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-blue-300 dark:focus:ring-blue-700">
                                💾 Save Status
                            </button>
                        </form>
                    </div>

                    {/* ═══════════════════════════ */}
                    {/* ── RIGHT: Metrics & History ── */}
                    {/* ═══════════════════════════ */}
                    <div className="w-full lg:w-7/12">
                        {/* ── Live Preview Cards ── */}
                        <h2 className="text-2xl font-bold mb-4 flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="mr-2 text-blue-500 w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="2" y="10" width="4" height="12" rx="1" />
                                <rect x="8" y="6" width="4" height="16" rx="1" />
                                <rect x="14" y="14" width="4" height="8" rx="1" />
                                <rect x="20" y="2" width="2" height="20" rx="1" />
                            </svg>
                            Live Preview
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                            <div className="p-5 rounded-xl shadow-md bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-l-4 border-l-green-500">
                                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Target Achieved (Current Entry)</h3>
                                <div className="flex items-center justify-between mt-1">
                                    <p className="text-3xl font-extrabold text-green-600 dark:text-green-400">{targetAchievedPercentage}%</p>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-green-400 dark:text-green-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M22 11.08V12a10 10 0 1 1-5.93-8.08" /><polyline points="22 4 12 14.01 9 11.01" />
                                    </svg>
                                </div>
                            </div>
                            <div className="p-5 rounded-xl shadow-md bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 border-l-4 border-l-purple-500">
                                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Time Efficiency</h3>
                                <div className="flex items-center justify-between mt-1">
                                    <p className="text-3xl font-extrabold text-purple-600 dark:text-purple-400">{timeAchievedPercentage}%</p>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-purple-400 dark:text-purple-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                                    </svg>
                                </div>
                            </div>
                        </div>

                        {/* ── Submission History ── */}
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-3">
                            <h3 className="text-xl font-bold flex items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="mr-2 text-blue-500 w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                                </svg>
                                Submission History
                                {statusEntries.length > 0 && (
                                    <span className="ml-2 text-sm font-normal text-gray-400">
                                        ({displayedEntries.length} of {statusEntries.length} entries)
                                    </span>
                                )}
                            </h3>
                            {statusEntries.length > 0 && (
                                <div className="flex items-center gap-2">
                                    <label className="text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">Filter by date:</label>
                                    <input id="filter-date" type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)}
                                        className="p-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200" />
                                    {filterDate && (
                                        <button onClick={() => setFilterDate('')} className="text-xs text-red-500 hover:text-red-700 font-semibold underline">
                                            Clear
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>

                        {displayedEntries.length > 0 ? (
                            <>
                                <div className="table-scroll-wrapper overflow-x-auto rounded-xl shadow-md mb-4">
                                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                        <thead className="bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600">
                                            <tr>
                                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Date</th>
                                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Performer</th>
                                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Title</th>
                                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Task Type</th>
                                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Std Target</th>
                                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Done</th>
                                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Target %</th>
                                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Time %</th>
                                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Status</th>
                                                <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                            {displayedEntries.map((entry) => (
                                                <tr key={entry.id} className="hover:bg-blue-50 dark:hover:bg-gray-700/50 transition duration-150">
                                                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">{entry.date}</td>
                                                    <td className="px-4 py-3 whitespace-nowrap text-sm">{entry.performerName || '—'}</td>
                                                    <td className="px-4 py-3 whitespace-nowrap text-sm max-w-[120px] truncate" title={entry.titleName}>{entry.titleName}</td>
                                                    <td className="px-4 py-3 whitespace-nowrap text-sm">{entry.taskType}</td>
                                                    <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-500">
                                                        {standardTargets[entry.taskType] || '—'}{' '}
                                                        {standardTargetUnits[entry.taskType] ? `(${standardTargetUnits[entry.taskType]})` : ''}
                                                    </td>
                                                    <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold">{entry.completedPages}</td>
                                                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                                                        <span className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${entry.targetAchieved >= 100 ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-400' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-400'}`}>
                                                            {entry.targetAchieved}%
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                                                        <span className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${entry.timeAchieved >= 100 ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-400' : 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-400'}`}>
                                                            {entry.timeAchieved}%
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                                                        <span className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${entry.status === 'Achieved' ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-400' : 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-400'}`}>
                                                            {entry.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 whitespace-nowrap text-center">
                                                        <button onClick={() => handleDeleteEntry(entry.id)}
                                                            className="text-red-400 hover:text-red-600 dark:hover:text-red-300 transition-colors duration-150 p-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
                                                            title="Delete this entry">
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                                <polyline points="3 6 5 6 21 6" />
                                                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                                            </svg>
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* ── Action Buttons ── */}
                                <div className="flex flex-col sm:flex-row flex-wrap gap-3 mt-4">
                                    <button id="download-csv-btn" onClick={handleDownloadCSV}
                                        className="flex-1 sm:flex-none bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold py-3 px-6 rounded-xl shadow-lg transform hover:scale-[1.02] transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-green-300 dark:focus:ring-green-700 flex items-center justify-center gap-2">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
                                        </svg>
                                        Download CSV
                                    </button>
                                    <button id="clear-history-btn" onClick={handleClearHistory}
                                        className="flex-1 sm:flex-none bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-bold py-3 px-6 rounded-xl shadow-lg transform hover:scale-[1.02] transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-red-300 dark:focus:ring-red-700 flex items-center justify-center gap-2">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                        </svg>
                                        Clear History
                                    </button>
                                    <button id="complete-daily-btn" onClick={handleCompleteDailySubmission}
                                        className="flex-1 sm:flex-none bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-3 px-6 rounded-xl shadow-lg transform hover:scale-[1.02] transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-blue-300 dark:focus:ring-blue-700 flex items-center justify-center gap-2">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M22 11.08V12a10 10 0 1 1-5.93-8.08" /><polyline points="22 4 12 14.01 9 11.01" />
                                        </svg>
                                        Complete Today
                                    </button>
                                </div>
                            </>
                        ) : (
                            <div className="p-8 text-center text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-700/30 rounded-xl shadow-inner">
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><line x1="3" y1="9" x2="21" y2="9" /><line x1="9" y1="21" x2="9" y2="9" />
                                </svg>
                                <p className="font-medium">No entries submitted yet.</p>
                                <p className="text-sm mt-1">Fill in the form and click &quot;Save Status&quot; to get started.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ── Footer ── */}
            <footer className="text-center mt-8 pb-4 text-sm text-gray-400 dark:text-gray-600">
                Daily Status Tracker CBPET &copy; {new Date().getFullYear()}
            </footer>
        </div>
    );
};

export default App;
