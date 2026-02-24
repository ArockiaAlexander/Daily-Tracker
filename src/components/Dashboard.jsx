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

const Dashboard = ({ entries, userProfile }) => {
    const [selectedPerformer, setSelectedPerformer] = useState('all');
    const [selectedClient, setSelectedClient] = useState('all');

    const role = userProfile?.role || 'performer';

    // ── Helper: Filters ──
    const filteredEntries = useMemo(() => {
        let result = [...entries];
        if (selectedPerformer !== 'all') {
            result = result.filter(e => e.performerName === selectedPerformer);
        }
        if (selectedClient !== 'all') {
            result = result.filter(e => e.client_id === selectedClient);
        }
        return result;
    }, [entries, selectedPerformer, selectedClient]);

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

    // Performer-wise or Client-wise grouping
    const groupData = {};
    const groupField = role === 'lead' ? 'performerName' : (role === 'manager' || role === 'admin' ? 'client_id' : 'taskType');

    filteredEntries.forEach(e => {
        const key = e[groupField] || 'Unknown';
        if (!groupData[key]) groupData[key] = { total: 0, count: 0 };
        groupData[key].total += Number(e.targetAchieved);
        groupData[key].count += 1;
    });

    const barData = {
        labels: Object.keys(groupData),
        datasets: [{
            label: 'Avg Achievement %',
            data: Object.values(groupData).map(g => (g.total / g.count).toFixed(2)),
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
            {(role !== 'performer') && (
                <div className="bg-gray-50 dark:bg-gray-800/50 p-6 rounded-3xl border border-gray-100 dark:border-gray-800 flex flex-wrap items-center gap-6">
                    <div className="flex items-center gap-3">
                        <Filter size={18} className="text-blue-600" />
                        <span className="text-xs font-black uppercase tracking-widest text-gray-500">Analytical Filters</span>
                    </div>

                    {(role === 'admin' || role === 'manager') && (
                        <div className="flex-1 min-w-[200px]">
                            <select
                                value={selectedClient}
                                onChange={e => setSelectedClient(e.target.value)}
                                className="w-full bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-700 p-3 rounded-xl text-xs font-bold font-mono focus:ring-2 focus:ring-blue-500 outline-none"
                            >
                                <option value="all">ALL CLIENTS</option>
                                {[...new Set(entries.map(e => e.client_id))].map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                    )}

                    <div className="flex-1 min-w-[200px]">
                        <select
                            value={selectedPerformer}
                            onChange={e => setSelectedPerformer(e.target.value)}
                            className="w-full bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-700 p-3 rounded-xl text-xs font-bold font-mono focus:ring-2 focus:ring-blue-500 outline-none"
                        >
                            <option value="all">ALL PERFORMERS</option>
                            {[...new Set(entries.map(e => e.performerName))].map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
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
                    <p className="text-3xl font-black">{role === 'performer' ? 'Personal' : (role === 'lead' ? 'Client Unit' : 'Global')}</p>
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
                        {role === 'performer' ? 'Activity Distribution' : (role === 'lead' ? 'Performer Comparison' : 'Client Analysis')}
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
        </div>
    );
};

export default Dashboard;
