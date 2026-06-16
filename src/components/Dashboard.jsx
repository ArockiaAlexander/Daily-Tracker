import React, { useState, useMemo } from 'react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
    PointElement,
    LineElement,
} from 'chart.js';
import { Bar, Pie, Line } from 'react-chartjs-2';
import { TrendingUp, Users, Target, Clock, Filter, Trophy, Calendar } from 'lucide-react';
import DataExport from './DataExport';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    PointElement,
    LineElement,
    ArcElement,
    Title,
    Tooltip,
    Legend
);

const Dashboard = ({ entries, userProfile, clients = [] }) => {
    const [selectedPerformer, setSelectedPerformer] = useState('all');
    const [selectedClient, setSelectedClient] = useState('all');
    const [viewMode, setViewMode] = useState('team');
    const [groupBy, setGroupBy] = useState(() => {
        if (['manager', 'general_manager', 'assistant_manager', 'super_admin'].includes(userProfile?.role)) return 'client';
        if (['lead', 'team_lead', 'group_lead'].includes(userProfile?.role)) return 'performer';
        return 'task_type';
    });

    // Normalize role for backward compatibility (old + new system)
    const rawRole = userProfile?.role || 'performer';
    const isAdmin = ['admin', 'super_admin', 'general_manager'].includes(rawRole);
    const isManager = ['manager', 'general_manager', 'assistant_manager', 'super_admin'].includes(rawRole);
    const isLead = ['lead', 'team_lead', 'group_lead'].includes(rawRole);
    const isPerformer = rawRole === 'performer';
    const role = rawRole;

    // ── Helper: Filters ──
    const filteredEntries = useMemo(() => {
        let result = [...entries];
        
        // Scope leads and performers to their respective client only
        if (!isManager && userProfile?.client_id) {
            result = result.filter(e => e.client_id === userProfile.client_id);
        }
        
        if (isManager && viewMode === 'individual' && selectedPerformer !== 'all') {
            result = result.filter(e => e.performerName === selectedPerformer);
        } else if (!isManager && selectedPerformer !== 'all') {
            result = result.filter(e => e.performerName === selectedPerformer);
        }
        
        // Only managers can filter by any client
        if (isManager && selectedClient !== 'all') {
            result = result.filter(e => e.client_id === selectedClient);
        }
        
        return result;
    }, [entries, selectedPerformer, selectedClient, isManager, viewMode, userProfile]);

    if (!entries || entries.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 bg-gray-50/50 dark:bg-gray-800/30 rounded-3xl border-2 border-dashed border-gray-200 dark:border-gray-800">
                <Calendar className="w-12 h-12 text-gray-300 mb-4" />
                <p className="text-xs font-black uppercase tracking-widest text-gray-400">System Ready • No Analytical Data</p>
            </div>
        );
    }

    // ── Stats Calculation ──
    const totalEntries = filteredEntries.length;
    const avgTargetAchieved = totalEntries > 0 ? (filteredEntries.reduce((acc, curr) => acc + Number(curr.targetAchieved), 0) / totalEntries).toFixed(2) : 0;
    const avgTimeEfficiency = totalEntries > 0 ? (filteredEntries.reduce((acc, curr) => acc + Number(curr.timeAchieved), 0) / totalEntries).toFixed(2) : 0;

    // Performer Score & Rank (Current Month)
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
    const monthEntries = entries.filter(e => e.date.startsWith(currentMonth));

    const performanceScores = {}; // performerName -> avgTarget
    monthEntries.forEach(e => {
        if (!performanceScores[e.performerName]) performanceScores[e.performerName] = { total: 0, count: 0 };
        performanceScores[e.performerName].total += Number(e.targetAchieved);
        performanceScores[e.performerName].count += 1;
    });

    const rankings = Object.keys(performanceScores)
        .map(name => ({ name, score: (performanceScores[name].total / performanceScores[name].count).toFixed(2) }))
        .sort((a, b) => b.score - a.score);

    const userRank = rankings.findIndex(r => r.name === userProfile?.performer_name) + 1;
    const userScore = rankings.find(r => r.name === userProfile?.performer_name)?.score || 0;

    // ── Chart Data Preparations ──
    const groupField = useMemo(() => {
        if (groupBy === 'client') return 'client_id';
        if (groupBy === 'sub_division') return 'sub_division';
        if (groupBy === 'performer') return 'performerName';
        return 'taskType';
    }, [groupBy]);

    const groupedData = useMemo(() => {
        const dataMap = {};
        filteredEntries.forEach(e => {
            const key = e[groupField] || (groupField === 'sub_division' ? 'General' : 'Unknown');
            if (!dataMap[key]) {
                dataMap[key] = { 
                    totalTarget: 0, 
                    totalTime: 0, 
                    count: 0, 
                    completedPages: 0,
                    estimatedTime: 0,
                    takenTime: 0
                };
            }
            dataMap[key].totalTarget += Number(e.targetAchieved || 0);
            dataMap[key].totalTime += Number(e.timeAchieved || 0);
            dataMap[key].count += 1;
            dataMap[key].completedPages += Number(e.completedPages || 0);
            dataMap[key].estimatedTime += Number(e.estimatedTime || 0);
            dataMap[key].takenTime += Number(e.takenTime || 0);
        });

        return Object.entries(dataMap).map(([key, data]) => ({
            name: key,
            count: data.count,
            avgTarget: (data.totalTarget / data.count).toFixed(2),
            avgTime: (data.totalTime / data.count).toFixed(2),
            completedPages: data.completedPages,
            estimatedTime: data.estimatedTime.toFixed(1),
            takenTime: data.takenTime.toFixed(1)
        })).sort((a, b) => b.avgTarget - a.avgTarget);
    }, [filteredEntries, groupField]);

    const barData = {
        labels: groupedData.map(g => g.name),
        datasets: [{
            label: 'Avg Achievement %',
            data: groupedData.map(g => g.avgTarget),
            backgroundColor: 'rgba(59, 130, 246, 0.6)',
            borderRadius: 8,
        }]
    };

    const taskTypes = {};
    filteredEntries.forEach(e => {
        taskTypes[e.taskType] = (taskTypes[e.taskType] || 0) + 1;
    });

    const pieData = {
        labels: Object.keys(taskTypes),
        datasets: [{
            data: Object.values(taskTypes),
            backgroundColor: [
                'rgba(59, 130, 246, 0.7)',
                'rgba(147, 51, 234, 0.7)',
                'rgba(236, 72, 153, 0.7)',
                'rgba(249, 115, 22, 0.7)',
                'rgba(34, 197, 94, 0.7)',
            ],
            borderWidth: 0,
        }]
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* ── Filters (Admin/Manager/Lead) ── */}
            {!isPerformer && (
                <div className="bg-gray-50 dark:bg-gray-800/50 p-6 rounded-3xl border border-gray-100 dark:border-gray-800 flex flex-wrap items-center gap-6">
                    <div className="flex items-center gap-3">
                        <Filter size={18} className="text-blue-600" />
                        <span className="text-xs font-black uppercase tracking-widest text-gray-500">Analytical Filters</span>
                    </div>

                    {(isAdmin || isManager) && (
                        <div className="flex-1 min-w-[200px]">
                            <select
                                value={selectedClient}
                                onChange={e => setSelectedClient(e.target.value)}
                                className="w-full bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-700 p-3 rounded-xl text-xs font-bold font-mono focus:ring-2 focus:ring-blue-500 outline-none"
                            >
                                <option value="all">ALL CLIENTS</option>
                                {clients && clients.length > 0 ? (
                                    clients.map(c => <option key={c.id} value={c.code}>{c.code}</option>)
                                ) : (
                                    [...new Set(entries.map(e => e.client_id))].map(c => <option key={c} value={c}>{c}</option>)
                                )}
                            </select>
                        </div>
                    )}

                    {isManager && (
                        <div className="flex rounded-xl bg-white dark:bg-gray-900 p-1 border border-gray-200 dark:border-gray-700">
                            <button
                                type="button"
                                onClick={() => { setViewMode('team'); setSelectedPerformer('all'); }}
                                className={`px-3 py-2 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all ${viewMode === 'team' ? 'bg-blue-600 text-white' : 'text-gray-500'}`}
                            >
                                Team Performance
                            </button>
                            <button
                                type="button"
                                onClick={() => setViewMode('individual')}
                                className={`px-3 py-2 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all ${viewMode === 'individual' ? 'bg-blue-600 text-white' : 'text-gray-500'}`}
                            >
                                Individual
                            </button>
                        </div>
                    )}

                    {(!isManager || viewMode === 'individual' || isLead) && (
                    <div className="flex-1 min-w-[200px]">
                        <select
                            value={selectedPerformer}
                            onChange={e => setSelectedPerformer(e.target.value)}
                            className="w-full bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-700 p-3 rounded-xl text-xs font-bold font-mono focus:ring-2 focus:ring-blue-500 outline-none"
                        >
                            <option value="all">{isLead ? 'ALL TEAMMATES' : 'ALL PERFORMERS'}</option>
                            {[...new Set(entries.map(e => e.performerName))].map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                    </div>
                    )}

                    {(isManager || isLead) && (
                        <div className="flex-1 min-w-[150px]">
                            <select
                                value={groupBy}
                                onChange={e => setGroupBy(e.target.value)}
                                className="w-full bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-700 p-3 rounded-xl text-xs font-bold font-mono focus:ring-2 focus:ring-blue-500 outline-none"
                            >
                                {isManager && <option value="client">GROUP BY: CLIENT</option>}
                                {(isManager || isLead) && <option value="sub_division">GROUP BY: SUB-DIVISION</option>}
                                {(isManager || isLead) && <option value="performer">GROUP BY: PERFORMER</option>}
                                <option value="task_type">GROUP BY: PROCESS</option>
                            </select>
                        </div>
                    )}

                    <div className="flex-1 min-w-[280px] flex justify-end">
                        <DataExport 
                            entries={entries} 
                            filteredEntries={filteredEntries} 
                            label="Export" 
                        />
                    </div>
                </div>
            )}

            {/* ── Summary Cards ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-2xl text-blue-600">
                            <Target size={24} />
                        </div>
                        {role === 'performer' && userRank > 0 && (
                            <div className="flex items-center gap-1 px-2 py-1 bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-lg text-[10px] font-black underline decoration-2">
                                <Trophy size={14} /> RANK #{userRank}
                            </div>
                        )}
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Target Achievement</p>
                    <p className="text-3xl font-black">{avgTargetAchieved}%</p>
                </div>

                <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-green-50 dark:bg-green-900/30 rounded-2xl text-green-600">
                            <Clock size={24} />
                        </div>
                        <div className="text-[10px] font-black text-green-600 px-2 py-1 bg-green-50 dark:bg-green-900/20 rounded-lg uppercase">System Sync</div>
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Time Efficiency</p>
                    <p className="text-3xl font-black">{avgTimeEfficiency}%</p>
                </div>

                <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-purple-50 dark:bg-purple-900/30 rounded-2xl text-purple-600">
                            <Users size={24} />
                        </div>
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Scale Group</p>
                    <p className="text-3xl font-black">
                        {isPerformer ? 'Personal' : (isLead ? 'Team' : (isAdmin ? 'Organization' : 'Multi-Team'))}
                    </p>
                </div>

                <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-amber-50 dark:bg-amber-900/30 rounded-2xl text-amber-600">
                            <TrendingUp size={24} />
                        </div>
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Total Logs Count</p>
                    <p className="text-3xl font-black">{totalEntries}</p>
                </div>
            </div>

            {/* ── Charts Grid ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white dark:bg-gray-900 p-8 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm">
                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-gray-400 mb-8 flex items-center gap-2">
                        Performance Comparison ({groupBy.replace('_', ' ')} breakdown)
                    </h3>
                    <div className="h-[300px]">
                        <Bar
                            data={barData}
                            options={{
                                maintainAspectRatio: false,
                                plugins: { legend: { display: false } },
                                scales: {
                                    y: { beginAtZero: true, max: 120, grid: { color: 'rgba(0,0,0,0.05)' } },
                                    x: { grid: { display: false } }
                                }
                            }}
                        />
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-900 p-8 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm">
                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-gray-400 mb-8">Process Breakdown</h3>
                    <div className="aspect-square max-h-[300px] mx-auto">
                        <Pie
                            data={pieData}
                            options={{
                                maintainAspectRatio: false,
                                plugins: {
                                    legend: { position: 'bottom', labels: { boxWidth: 10, usePointStyle: true, font: { size: 10, weight: 'bold' } } }
                                }
                            }}
                        />
                    </div>
                </div>
            </div>

            {/* ── Detailed Performance Breakdown Report Table ── */}
            <div className="bg-white dark:bg-gray-900 p-8 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm">
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-gray-400 mb-6 flex justify-between items-center">
                    <span>Performance Breakdown ({groupBy.replace('_', ' ')} report)</span>
                    <span className="text-[10px] text-blue-600 dark:text-blue-400 font-bold bg-blue-50 dark:bg-blue-900/30 px-3 py-1 rounded-full uppercase">Overall Data</span>
                </h3>
                <div className="overflow-x-auto rounded-2xl border border-gray-100 dark:border-gray-800/80">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/50 dark:bg-gray-850/50 border-b border-gray-100 dark:border-gray-800">
                                <th className="p-4 text-[10px] font-black uppercase tracking-widest text-gray-400">{groupBy.replace('_', ' ')} Name</th>
                                <th className="p-4 text-[10px] font-black uppercase tracking-widest text-gray-400 text-center">Total Logs</th>
                                <th className="p-4 text-[10px] font-black uppercase tracking-widest text-gray-400 text-center">Completed Tasks (Pages)</th>
                                <th className="p-4 text-[10px] font-black uppercase tracking-widest text-gray-400 text-center">Total Hours</th>
                                <th className="p-4 text-[10px] font-black uppercase tracking-widest text-gray-400 text-right">Avg Target Achievement</th>
                                <th className="p-4 text-[10px] font-black uppercase tracking-widest text-gray-400 text-right">Avg Time Efficiency</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-150 dark:divide-gray-800">
                            {groupedData.map((row) => (
                                <tr key={row.name} className="hover:bg-gray-50/50 dark:hover:bg-gray-850/50 transition-colors">
                                    <td className="p-4 font-bold text-sm text-gray-900 dark:text-white uppercase">{row.name}</td>
                                    <td className="p-4 text-sm text-gray-600 dark:text-gray-400 text-center font-semibold font-mono">{row.count}</td>
                                    <td className="p-4 text-sm text-gray-600 dark:text-gray-400 text-center font-semibold font-mono">{row.completedPages}</td>
                                    <td className="p-4 text-sm text-gray-600 dark:text-gray-400 text-center font-semibold font-mono">{row.takenTime}h</td>
                                    <td className={`p-4 text-sm font-black text-right font-mono ${Number(row.avgTarget) >= 100 ? 'text-green-600' : 'text-amber-500'}`}>{row.avgTarget}%</td>
                                    <td className="p-4 text-sm font-black text-right text-indigo-500 font-mono">{row.avgTime}%</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
