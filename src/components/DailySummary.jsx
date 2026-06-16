import { useMemo, useState } from 'react';
import { Calendar, RefreshCw, Users, User } from 'lucide-react';
import { aggregateDayMetrics } from '../lib/targetUtils';

const DailySummary = ({
    entries,
    profile,
    accessibleProfiles = [],
    onDeleteEntry,
    onRefresh,
    isSyncing,
    canDeleteEntry,
}) => {
    const getTodayISO = () => new Date().toISOString().slice(0, 10);
    const [summaryDate, setSummaryDate] = useState(getTodayISO);
    const [viewMode, setViewMode] = useState('team');
    const [selectedPerformer, setSelectedPerformer] = useState('all');

    const role = profile?.role || 'performer';
    const isManager = ['super_admin', 'general_manager', 'assistant_manager'].includes(role);
    const isTeamLead = role === 'team_lead';
    const isPerformer = role === 'performer';

    const performerOptions = useMemo(() => {
        const names = [...new Set(accessibleProfiles.map((p) => p.performer_name).filter(Boolean))];
        if (isPerformer && profile?.performer_name && !names.includes(profile.performer_name)) {
            names.unshift(profile.performer_name);
        }
        return names.sort();
    }, [accessibleProfiles, isPerformer, profile?.performer_name]);

    const dayEntries = useMemo(() => {
        let result = entries.filter((e) => e.date === summaryDate);

        if (isPerformer) {
            return result.filter((e) => e.performerName === profile?.performer_name);
        }

        if (isTeamLead) {
            if (selectedPerformer !== 'all') {
                result = result.filter((e) => e.performerName === selectedPerformer);
            }
            return result;
        }

        if (isManager) {
            if (viewMode === 'individual' && selectedPerformer !== 'all') {
                result = result.filter((e) => e.performerName === selectedPerformer);
            }
            return result;
        }

        return result;
    }, [entries, summaryDate, isPerformer, isTeamLead, isManager, viewMode, selectedPerformer, profile?.performer_name]);

    const { avgTarget, avgTime, count } = aggregateDayMetrics(dayEntries);

    const groupedByTask = useMemo(() => {
        const groups = {};
        dayEntries.forEach((e) => {
            const key = e.taskType || 'Unknown';
            if (!groups[key]) groups[key] = [];
            groups[key].push(e);
        });
        return groups;
    }, [dayEntries]);

    return (
        <div className="flex-1 min-w-0 bg-gray-50 dark:bg-gray-800/50 rounded-3xl p-6 border border-gray-100 dark:border-gray-800 flex flex-col max-h-[calc(100vh-12rem)]">
            <div className="flex flex-col gap-4 mb-6 shrink-0">
                <div className="flex items-center justify-between gap-3">
                    <h2 className="text-lg font-black text-gray-900 dark:text-white tracking-tight">Daily Summary</h2>
                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                            <input
                                type="date"
                                value={summaryDate}
                                onChange={(e) => setSummaryDate(e.target.value)}
                                className="pl-9 pr-3 py-2 text-xs border border-gray-200 dark:border-gray-700 dark:bg-gray-900 rounded-lg outline-none font-bold focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <button
                            type="button"
                            onClick={onRefresh}
                            disabled={isSyncing}
                            className={`p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg ${isSyncing ? 'animate-spin' : ''}`}
                            aria-label="Refresh entries"
                        >
                            <RefreshCw size={14} />
                        </button>
                    </div>
                </div>

                {isManager && (
                    <div className="flex flex-col sm:flex-row gap-3">
                        <div className="flex rounded-xl bg-white dark:bg-gray-900 p-1 border border-gray-200 dark:border-gray-700">
                            <button
                                type="button"
                                onClick={() => { setViewMode('team'); setSelectedPerformer('all'); }}
                                className={`flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all ${viewMode === 'team' ? 'bg-blue-600 text-white' : 'text-gray-500'}`}
                            >
                                <Users size={14} /> Team
                            </button>
                            <button
                                type="button"
                                onClick={() => setViewMode('individual')}
                                className={`flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all ${viewMode === 'individual' ? 'bg-blue-600 text-white' : 'text-gray-500'}`}
                            >
                                <User size={14} /> Individual
                            </button>
                        </div>
                        {viewMode === 'individual' && (
                            <select
                                value={selectedPerformer}
                                onChange={(e) => setSelectedPerformer(e.target.value)}
                                className="flex-1 text-xs font-bold p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-900 outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="all">Select performer…</option>
                                {performerOptions.map((name) => (
                                    <option key={name} value={name}>{name}</option>
                                ))}
                            </select>
                        )}
                    </div>
                )}

                {isTeamLead && (
                    <select
                        value={selectedPerformer}
                        onChange={(e) => setSelectedPerformer(e.target.value)}
                        className="w-full text-xs font-bold p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-900 outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="all">All teammates</option>
                        {performerOptions.map((name) => (
                            <option key={name} value={name}>{name}</option>
                        ))}
                    </select>
                )}
            </div>

            <div className="grid grid-cols-2 gap-3 mb-6 shrink-0">
                <div className="p-4 rounded-2xl bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-900">
                    <p className="text-[10px] font-black text-green-600 uppercase tracking-widest mb-1">Target Achievement</p>
                    <span className={`text-3xl font-extrabold ${Number(avgTarget) >= 100 ? 'text-green-700 dark:text-green-400' : 'text-amber-600'}`}>
                        {count ? `${avgTarget}%` : '—'}
                    </span>
                    <p className="text-[9px] text-gray-500 mt-1">{count} task{count !== 1 ? 's' : ''} logged</p>
                </div>
                <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-900">
                    <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-1">Time Efficiency</p>
                    <span className="text-3xl font-extrabold text-indigo-700 dark:text-indigo-400">
                        {count ? `${avgTime}%` : '—'}
                    </span>
                    <p className="text-[9px] text-gray-500 mt-1">Based on day entries</p>
                </div>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto pr-1 custom-scrollbar space-y-4">
                {count === 0 ? (
                    <div className="text-center py-16 bg-white/50 dark:bg-gray-900/30 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700">
                        <p className="text-xs font-black uppercase text-gray-400">No activity for this date</p>
                    </div>
                ) : (
                    Object.entries(groupedByTask).map(([taskType, taskEntries]) => (
                        <div key={taskType} className="space-y-2">
                            <h3 className="text-[10px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400 px-1">
                                {taskType}
                            </h3>
                            {taskEntries.map((e) => (
                                <div
                                    key={e.id}
                                    className="p-3 bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm flex items-start justify-between gap-3 group hover:border-blue-200 transition-colors"
                                >
                                    <div className="flex-1 min-w-0">
                                        {(isTeamLead || isManager) && (
                                            <p className="text-[10px] font-black uppercase text-purple-600 dark:text-purple-400 mb-0.5">
                                                {e.performerName}
                                            </p>
                                        )}
                                        <p className="font-bold text-sm truncate" title={e.titleName}>{e.titleName}</p>
                                        <p className="text-[10px] text-gray-500 mt-1">
                                            Completed: {e.completedPages} · {e.takenTime}h taken
                                        </p>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <p className={`font-black text-sm ${Number(e.targetAchieved) >= 100 ? 'text-green-600' : 'text-amber-500'}`}>
                                            {e.targetAchieved}%
                                        </p>
                                        <p className="text-[10px] text-indigo-500 font-bold">{e.timeAchieved}% time</p>
                                        {canDeleteEntry?.(e) && (
                                            <button
                                                type="button"
                                                onClick={() => onDeleteEntry(e.id)}
                                                className="text-[10px] font-black uppercase text-red-500 opacity-0 group-hover:opacity-100 transition-opacity mt-1"
                                            >
                                                Delete
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default DailySummary;
