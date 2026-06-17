import React, { useState, useMemo, useEffect } from 'react';
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
import { 
    TrendingUp, 
    Users, 
    Target, 
    Clock, 
    Filter, 
    Trophy, 
    Calendar, 
    BarChart3, 
    AlertTriangle, 
    Plus, 
    Trash2, 
    ChevronLeft, 
    ChevronRight, 
    Info 
} from 'lucide-react';
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

const STANDARD_TARGETS = {
    Prestyle: 900,
    Preedit: 300,
    'FL Validation': 600,
    'Revises Validation': 1200,
    Normalisation: 300,
    'Cast-off XML Conversion': 4,
    'Ref Edit': 400,
    'Style Editing': 80,
};

const Dashboard = ({ 
    entries, 
    userProfile, 
    clients = [], 
    divisionTargets = [], 
    onRefreshTargets, 
    supabase 
}) => {
    const [selectedPerformer, setSelectedPerformer] = useState('all');
    const [selectedClient, setSelectedClient] = useState('all');
    const [viewMode, setViewMode] = useState('team');
    const [groupBy, setGroupBy] = useState(() => {
        if (['manager', 'general_manager', 'assistant_manager', 'super_admin'].includes(userProfile?.role)) return 'client';
        if (['lead', 'team_lead', 'group_lead'].includes(userProfile?.role)) return 'performer';
        return 'task_type';
    });

    // Sub-tab navigation
    const [analyticsSubTab, setAnalyticsSubTab] = useState('overview');
    const [trendPeriod, setTrendPeriod] = useState('monthly');
    const [milestoneTask, setMilestoneTask] = useState('Preedit');
    const [auditPage, setAuditPage] = useState(0);
    const auditPageSize = 5;

    // Division Target override states
    const [targetClient, setTargetClient] = useState(userProfile?.client_id || 'DEFAULT_CLIENT');
    const [targetSubDivision, setTargetSubDivision] = useState('PreEdit');
    const [targetTaskType, setTargetTaskType] = useState('Preedit');
    const [targetValue, setTargetValue] = useState('');
    const [targetSaving, setTargetSaving] = useState(false);

    // Auto-update task type on division change
    useEffect(() => {
        if (targetSubDivision === 'PreEdit') {
            setTargetTaskType('Preedit');
        } else {
            setTargetTaskType('FL Validation');
        }
    }, [targetSubDivision]);

    // Normalize role for backward compatibility
    const rawRole = userProfile?.role || 'performer';
    const isAdmin = ['admin', 'super_admin', 'general_manager'].includes(rawRole);
    const isManager = ['manager', 'general_manager', 'assistant_manager', 'super_admin'].includes(rawRole);
    const isLead = ['lead', 'team_lead', 'group_lead'].includes(rawRole);
    const isPerformer = rawRole === 'performer';
    const role = rawRole;

    // ── Helper: Dynamic Targets ──
    const getDynamicTarget = (task, clientCode, subDiv) => {
        const custom = (divisionTargets || []).find(t => 
            t.client_id === clientCode && 
            t.sub_division === subDiv && 
            t.task_type === task
        );
        if (custom) return Number(custom.target_value);
        return STANDARD_TARGETS[task] || 0;
    };

    const getDynamicTargetAchieved = (e) => {
        const target = getDynamicTarget(e.taskType, e.client_id, e.sub_division);
        if (target > 0 && Number(e.takenTime) > 0) {
            return Number(((Number(e.completedPages) / ((target / 8) * Number(e.takenTime))) * 100).toFixed(2));
        }
        return 0;
    };

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
    const avgTargetAchieved = totalEntries > 0 
        ? (filteredEntries.reduce((acc, curr) => acc + Number(getDynamicTargetAchieved(curr)), 0) / totalEntries).toFixed(2) 
        : 0;
    const avgTimeEfficiency = totalEntries > 0 
        ? (filteredEntries.reduce((acc, curr) => acc + Number(curr.timeAchieved), 0) / totalEntries).toFixed(2) 
        : 0;

    // Performer Score & Rank (Current Month)
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
    const monthEntries = entries.filter(e => e.date.startsWith(currentMonth));

    const performanceScores = {}; // performerName -> avgTarget
    monthEntries.forEach(e => {
        if (!performanceScores[e.performerName]) performanceScores[e.performerName] = { total: 0, count: 0 };
        performanceScores[e.performerName].total += Number(getDynamicTargetAchieved(e));
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
            dataMap[key].totalTarget += Number(getDynamicTargetAchieved(e) || 0);
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
    }, [filteredEntries, groupField, divisionTargets]);

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

    // ── Trends Analysis & Calculations ──
    const getTrendIntervalKey = (dateStr, period) => {
        if (!dateStr) return 'Unknown';
        if (period === 'yearly') {
            return dateStr.substring(0, 4);
        }
        if (period === 'quarterly') {
            const year = dateStr.substring(0, 4);
            const month = parseInt(dateStr.substring(5, 7), 10);
            if (isNaN(month)) return `${year}-Q1`;
            const q = Math.floor((month - 1) / 3) + 1;
            return `${year}-Q${q}`;
        }
        return dateStr.substring(0, 7); // Default Monthly (YYYY-MM)
    };

    const chronologicalTrendData = useMemo(() => {
        const dataMap = {};
        filteredEntries.forEach(e => {
            const key = getTrendIntervalKey(e.date, trendPeriod);
            if (!dataMap[key]) {
                dataMap[key] = { totalTarget: 0, totalTime: 0, count: 0 };
            }
            dataMap[key].totalTarget += Number(getDynamicTargetAchieved(e) || 0);
            dataMap[key].totalTime += Number(e.timeAchieved || 0);
            dataMap[key].count += 1;
        });

        const sortedKeys = Object.keys(dataMap).sort((a, b) => a.localeCompare(b));

        return {
            labels: sortedKeys,
            targets: sortedKeys.map(k => (dataMap[k].totalTarget / dataMap[k].count).toFixed(2)),
            times: sortedKeys.map(k => (dataMap[k].totalTime / dataMap[k].count).toFixed(2))
        };
    }, [filteredEntries, trendPeriod, divisionTargets]);

    const lineChartData = {
        labels: chronologicalTrendData.labels,
        datasets: [
            {
                label: 'Avg Target Achievement %',
                data: chronologicalTrendData.targets,
                borderColor: 'rgba(59, 130, 246, 1)',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                fill: true,
                tension: 0.3,
            },
            {
                label: 'Avg Time Efficiency %',
                data: chronologicalTrendData.times,
                borderColor: 'rgba(16, 185, 129, 1)',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                fill: true,
                tension: 0.3,
            }
        ]
    };

    // ── Overtime & Delay Calculations ──
    const overtimeData = useMemo(() => {
        const delayedLogs = filteredEntries
            .filter(e => Number(e.estimatedTime) > 0 && Number(e.takenTime) > Number(e.estimatedTime))
            .map(e => {
                const delay = Number(e.takenTime) - Number(e.estimatedTime);
                const delayPct = (delay / Number(e.estimatedTime)) * 100;
                return {
                    ...e,
                    delay,
                    delayPct: delayPct.toFixed(1)
                };
            })
            .sort((a, b) => b.delay - a.delay); // highest delay first
            
        const totalOvertimeLogs = delayedLogs.length;
        const totalDelayHours = delayedLogs.reduce((acc, curr) => acc + curr.delay, 0);
        const avgDelayPercent = totalOvertimeLogs > 0
            ? (delayedLogs.reduce((acc, curr) => acc + Number(curr.delayPct), 0) / totalOvertimeLogs)
            : 0;

        return {
            delayedLogs,
            totalOvertimeLogs,
            totalDelayHours: totalDelayHours.toFixed(1),
            avgDelayPercent: avgDelayPercent.toFixed(2)
        };
    }, [filteredEntries]);

    const bottleneckTasks = useMemo(() => {
        const taskGroup = {};
        overtimeData.delayedLogs.forEach(e => {
            if (!taskGroup[e.taskType]) {
                taskGroup[e.taskType] = { totalDelay: 0, delayPctSum: 0, count: 0 };
            }
            taskGroup[e.taskType].totalDelay += e.delay;
            taskGroup[e.taskType].delayPctSum += Number(e.delayPct);
            taskGroup[e.taskType].count += 1;
        });

        return Object.entries(taskGroup).map(([taskType, data]) => {
            const avgDelayPct = data.delayPctSum / data.count;
            const activeTarget = getDynamicTarget(taskType, userProfile?.client_id || 'DEFAULT_CLIENT', userProfile?.sub_division || 'PreEdit');
            
            // Correction Suggestion if average delay exceeds 20%
            const suggestedTarget = avgDelayPct > 20 && activeTarget > 0
                ? Math.round(activeTarget * (1 - (avgDelayPct / 100)))
                : null;

            return {
                taskType,
                avgDelayHours: (data.totalDelay / data.count).toFixed(1),
                avgDelayPercent: avgDelayPct.toFixed(1),
                count: data.count,
                currentTarget: activeTarget,
                suggestedTarget
            };
        }).sort((a, b) => b.avgDelayPercent - a.avgDelayPercent);
    }, [overtimeData.delayedLogs, divisionTargets, userProfile]);

    // ── Milestone Pages vs Time Chart ──
    const uniqueTasks = useMemo(() => {
        return [...new Set(filteredEntries.map(e => e.taskType))].filter(Boolean);
    }, [filteredEntries]);

    useEffect(() => {
        if (uniqueTasks.length > 0 && !uniqueTasks.includes(milestoneTask)) {
            setMilestoneTask(uniqueTasks[0]);
        }
    }, [uniqueTasks]);

    const milestoneChartData = useMemo(() => {
        const taskLogs = filteredEntries.filter(e => e.taskType === milestoneTask);
        const currentTarget = getDynamicTarget(milestoneTask, userProfile?.client_id || 'DEFAULT_CLIENT', userProfile?.sub_division || 'PreEdit');
        const targetRate = currentTarget / 8; // pages per hour

        const points = taskLogs.map(e => ({
            x: Number(e.takenTime),
            y: Number(e.completedPages),
            performerName: e.performerName,
            date: e.date
        }));

        const maxHours = Math.max(12, ...points.map(p => p.x), 8);
        const targetLine = [
            { x: 0, y: 0 },
            { x: maxHours, y: Number((targetRate * maxHours).toFixed(1)) }
        ];

        return {
            points,
            targetLine,
            currentTarget,
            targetRate
        };
    }, [filteredEntries, milestoneTask, divisionTargets, userProfile]);

    const scatterChartData = {
        datasets: [
            {
                label: `${milestoneTask} Logs`,
                data: milestoneChartData.points,
                backgroundColor: 'rgba(59, 130, 246, 0.85)',
                borderColor: 'rgba(59, 130, 246, 1)',
                pointRadius: 6,
                pointHoverRadius: 8,
                showLine: false,
            },
            {
                label: `Target Milestone Rate (${milestoneChartData.currentTarget} pages/day)`,
                data: milestoneChartData.targetLine,
                borderColor: 'rgba(239, 68, 68, 1)',
                backgroundColor: 'rgba(239, 68, 68, 0)',
                borderWidth: 2,
                borderDash: [6, 4],
                fill: false,
                showLine: true,
                pointRadius: 0,
            }
        ]
    };

    const scatterChartOptions = {
        maintainAspectRatio: false,
        responsive: true,
        plugins: {
            tooltip: {
                callbacks: {
                    label: (context) => {
                        const pt = context.raw;
                        if (pt.performerName) {
                            return `${pt.performerName} (${pt.date}): ${pt.y} pages in ${pt.x}h`;
                        }
                        return `Milestone: ${pt.y} pages in ${context.parsed.x}h`;
                    }
                }
            }
        },
        scales: {
            x: {
                type: 'linear',
                position: 'bottom',
                title: {
                    display: true,
                    text: 'Hours Spent (Time)',
                    font: { weight: 'black', size: 10 }
                },
                grid: { color: 'rgba(0,0,0,0.04)' }
            },
            y: {
                title: {
                    display: true,
                    text: 'Pages Completed',
                    font: { weight: 'black', size: 10 }
                },
                grid: { color: 'rgba(0,0,0,0.04)' },
                beginAtZero: true
            }
        }
    };

    // ── Paginated Audit Logs ──
    const paginatedAuditLogs = useMemo(() => {
        const start = auditPage * auditPageSize;
        return overtimeData.delayedLogs.slice(start, start + auditPageSize);
    }, [overtimeData.delayedLogs, auditPage]);

    const totalAuditPages = Math.ceil(overtimeData.delayedLogs.length / auditPageSize);

    // ── Division Targets Operations ──
    const handleSaveTarget = async (e) => {
        e.preventDefault();
        if (!targetValue || Number(targetValue) <= 0) {
            alert('Please enter a valid target value');
            return;
        }

        setTargetSaving(true);
        const targetObj = {
            client_id: targetClient,
            sub_division: targetSubDivision,
            task_type: targetTaskType,
            target_value: parseInt(targetValue, 10),
            updated_at: new Date().toISOString()
        };

        try {
            if (supabase) {
                const { error } = await supabase
                    .from('division_targets')
                    .upsert(targetObj, { onConflict: 'client_id,sub_division,task_type' });
                if (error) throw error;
            } else {
                throw new Error('Supabase client not initialized');
            }
            alert('✅ Division Target Saved successfully!');
            setTargetValue('');
            if (onRefreshTargets) await onRefreshTargets();
        } catch (err) {
            console.warn('DB Save failed, attempting local storage fallback:', err.message);
            const local = localStorage.getItem('cbpet_division_targets');
            let list = [];
            if (local) {
                try {
                    list = JSON.parse(local);
                } catch (e) {}
            }
            list = list.filter(t => !(t.client_id === targetClient && t.sub_division === targetSubDivision && t.task_type === targetTaskType));
            list.push({
                ...targetObj,
                id: Date.now().toString()
            });
            localStorage.setItem('cbpet_division_targets', JSON.stringify(list));
            alert('✅ Target override saved to offline local storage');
            setTargetValue('');
            if (onRefreshTargets) await onRefreshTargets();
        } finally {
            setTargetSaving(false);
        }
    };

    const handleDeleteTarget = async (id, targetItem) => {
        if (!window.confirm('Are you sure you want to remove this division target override?')) return;
        try {
            if (supabase && id && isNaN(Number(id))) {
                const { error } = await supabase
                    .from('division_targets')
                    .delete()
                    .eq('id', id);
                if (error) throw error;
            } else {
                const local = localStorage.getItem('cbpet_division_targets');
                if (local) {
                    let list = JSON.parse(local);
                    list = list.filter(t => !(t.client_id === targetItem.client_id && t.sub_division === targetItem.sub_division && t.task_type === targetItem.task_type));
                    localStorage.setItem('cbpet_division_targets', JSON.stringify(list));
                }
            }
            alert('🗑️ Target override removed');
            if (onRefreshTargets) await onRefreshTargets();
        } catch (err) {
            alert('❌ Failed to delete target: ' + err.message);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* ── Analytics Sub-Tab Navigation ── */}
            <div className="flex items-center justify-between flex-wrap gap-4 border-b border-gray-150 dark:border-gray-800 pb-4">
                <div className="flex rounded-xl bg-white dark:bg-gray-900 p-1 border border-gray-200 dark:border-gray-700">
                    <button
                        type="button"
                        onClick={() => setAnalyticsSubTab('overview')}
                        className={`px-4 py-2 text-xs font-black uppercase tracking-wider rounded-lg transition-all ${analyticsSubTab === 'overview' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-300'}`}
                    >
                        Overview
                    </button>
                    <button
                        type="button"
                        onClick={() => setAnalyticsSubTab('trends')}
                        className={`px-4 py-2 text-xs font-black uppercase tracking-wider rounded-lg transition-all ${analyticsSubTab === 'trends' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-300'}`}
                    >
                        Trends & Bottlenecks
                    </button>
                    {['super_admin', 'general_manager', 'assistant_manager', 'team_lead', 'group_lead'].includes(userProfile?.role) && (
                        <button
                            type="button"
                            onClick={() => setAnalyticsSubTab('targets')}
                            className={`px-4 py-2 text-xs font-black uppercase tracking-wider rounded-lg transition-all ${analyticsSubTab === 'targets' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-300'}`}
                        >
                            Division Targets
                        </button>
                    )}
                </div>
            </div>

            {/* ── SUB-TAB 1: Overview Dashboard ── */}
            {analyticsSubTab === 'overview' && (
                <React.Fragment>
                    {/* Filters (Admin/Manager/Lead) */}
                    {!isPerformer && (
                        <div className="bg-gray-50 dark:bg-gray-800/50 p-6 rounded-3xl border border-gray-100 dark:border-gray-800 flex flex-wrap items-center gap-6">
                            <div className="flex items-center gap-3">
                                <Filter size={18} className="text-blue-600" />
                                <span className="text-xs font-black uppercase tracking-widest text-gray-500">Filters</span>
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

                    {/* Summary Cards */}
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

                    {/* Charts Grid */}
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

                    {/* Detailed Performance Breakdown Table */}
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
                </React.Fragment>
            )}

            {/* ── SUB-TAB 2: Trends & Bottlenecks ── */}
            {analyticsSubTab === 'trends' && (
                <div className="space-y-8 animate-in fade-in duration-500">
                    
                    {/* Interval Toggle Bar */}
                    <div className="bg-gray-50 dark:bg-gray-800/50 p-6 rounded-3xl border border-gray-100 dark:border-gray-800 flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <Calendar size={18} className="text-blue-600" />
                            <span className="text-xs font-black uppercase tracking-widest text-gray-500">Trend Interval Configuration</span>
                        </div>
                        <div className="flex rounded-xl bg-white dark:bg-gray-900 p-1 border border-gray-200 dark:border-gray-700">
                            {['monthly', 'quarterly', 'yearly'].map((period) => (
                                <button
                                    key={period}
                                    type="button"
                                    onClick={() => setTrendPeriod(period)}
                                    className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all ${trendPeriod === period ? 'bg-blue-600 text-white' : 'text-gray-500'}`}
                                >
                                    {period}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Double-Line Trend Chart */}
                    <div className="bg-white dark:bg-gray-900 p-8 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm">
                        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-gray-400 mb-8">
                            Chronological Performance Trends ({trendPeriod} buckets)
                        </h3>
                        <div className="h-[300px]">
                            {chronologicalTrendData.labels.length === 0 ? (
                                <div className="flex items-center justify-center h-full text-xs font-mono text-gray-400">No trend data points matching active filters</div>
                            ) : (
                                <Line
                                    data={lineChartData}
                                    options={{
                                        maintainAspectRatio: false,
                                        responsive: true,
                                        plugins: { legend: { position: 'top', labels: { boxWidth: 12, usePointStyle: true, font: { weight: 'bold', size: 10 } } } },
                                        scales: {
                                            y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.05)' } },
                                            x: { grid: { display: false } }
                                        }
                                    }}
                                />
                            )}
                        </div>
                    </div>

                    {/* Delay & Overtime Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800">
                            <div className="flex items-center justify-between mb-4">
                                <div className="p-3 bg-red-50 dark:bg-red-900/30 rounded-2xl text-red-600">
                                    <Clock size={22} />
                                </div>
                                <span className="text-[10px] font-bold text-red-500 bg-red-50 dark:bg-red-950/20 px-2 py-0.5 rounded-md">Overtime logs</span>
                            </div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Total Overtime Logs</p>
                            <p className="text-3xl font-black text-red-500">{overtimeData.totalOvertimeLogs}</p>
                        </div>

                        <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800">
                            <div className="flex items-center justify-between mb-4">
                                <div className="p-3 bg-amber-50 dark:bg-amber-900/30 rounded-2xl text-amber-600">
                                    <Clock size={22} />
                                </div>
                                <span className="text-[10px] font-bold text-amber-500 bg-amber-50 dark:bg-amber-950/20 px-2 py-0.5 rounded-md">Accumulated delay</span>
                            </div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Total Delay Hours</p>
                            <p className="text-3xl font-black text-amber-500">{overtimeData.totalDelayHours} h</p>
                        </div>

                        <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800">
                            <div className="flex items-center justify-between mb-4">
                                <div className="p-3 bg-rose-50 dark:bg-rose-900/30 rounded-2xl text-rose-600">
                                    <TrendingUp size={22} />
                                </div>
                                <span className="text-[10px] font-bold text-rose-500 bg-rose-50 dark:bg-rose-950/20 px-2 py-0.5 rounded-md">Avg delay percent</span>
                            </div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Average Delay %</p>
                            <p className="text-3xl font-black text-rose-500">{overtimeData.avgDelayPercent}%</p>
                        </div>
                    </div>

                    {/* Bottlenecks List & Suggestions */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        
                        {/* Delay Bottlenecks */}
                        <div className="bg-white dark:bg-gray-900 p-8 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col">
                            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-gray-400 mb-6 flex items-center justify-between">
                                <span>Process Delay Bottlenecks</span>
                                <AlertTriangle className="text-red-500" size={16} />
                            </h3>
                            <div className="overflow-x-auto rounded-2xl border border-gray-100 dark:border-gray-800/80 flex-1">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-gray-50/50 dark:bg-gray-850/50 border-b border-gray-100 dark:border-gray-800">
                                            <th className="p-4 text-[9px] font-black uppercase tracking-widest text-gray-400">Process Type</th>
                                            <th className="p-4 text-[9px] font-black uppercase tracking-widest text-gray-400 text-center">Delayed Logs</th>
                                            <th className="p-4 text-[9px] font-black uppercase tracking-widest text-gray-400 text-center">Avg Delay</th>
                                            <th className="p-4 text-[9px] font-black uppercase tracking-widest text-gray-400 text-right">Target Correction</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                        {bottleneckTasks.length === 0 ? (
                                            <tr>
                                                <td colSpan={4} className="p-8 text-center text-xs italic text-gray-400">No process bottleneck logs identified</td>
                                            </tr>
                                        ) : (
                                            bottleneckTasks.map((row) => (
                                                <tr key={row.taskType} className="hover:bg-gray-50/50 dark:hover:bg-gray-850/50 transition-colors">
                                                    <td className="p-4 font-bold text-sm text-gray-900 dark:text-white">{row.taskType}</td>
                                                    <td className="p-4 text-sm text-gray-600 dark:text-gray-400 text-center font-semibold font-mono">{row.count}</td>
                                                    <td className="p-4 text-sm text-red-500 text-center font-bold font-mono">+{row.avgDelayPercent}%</td>
                                                    <td className="p-4 text-sm font-semibold text-right font-mono">
                                                        {row.suggestedTarget ? (
                                                            <div className="flex flex-col items-end">
                                                                <span className="text-gray-400 line-through text-xs">{row.currentTarget} /d</span>
                                                                <span className="text-green-600 dark:text-green-400 font-bold">{row.suggestedTarget} /d</span>
                                                            </div>
                                                        ) : (
                                                            <span className="text-gray-400 text-xs">No modification</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Milestone Pages vs Time Chart */}
                        <div className="bg-white dark:bg-gray-900 p-8 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col">
                            <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
                                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-gray-400">
                                    Pages vs Time Milestone Chart
                                </h3>
                                <select
                                    value={milestoneTask}
                                    onChange={e => setMilestoneTask(e.target.value)}
                                    className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-2 rounded-xl text-[10px] font-black uppercase tracking-wider focus:ring-1 focus:ring-blue-500 outline-none"
                                >
                                    {uniqueTasks.map(t => (
                                        <option key={t} value={t}>{t.toUpperCase()}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="h-[280px] flex-1">
                                {milestoneChartData.points.length === 0 ? (
                                    <div className="flex items-center justify-center h-full text-xs font-mono text-gray-400">No logs for {milestoneTask} to plot</div>
                                ) : (
                                    <Line
                                        data={scatterChartData}
                                        options={scatterChartOptions}
                                    />
                                )}
                            </div>
                            <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-850 rounded-xl text-[10px] text-gray-500 font-mono leading-relaxed border border-gray-100 dark:border-gray-800">
                                <span className="text-red-500 font-bold">Dashed Line</span> represents target rate milestone ({milestoneChartData.currentTarget} pages per 8h). Points above the line exceeded target; points below took longer than target rate.
                            </div>
                        </div>
                    </div>

                    {/* Overtime Audit Logs */}
                    <div className="bg-white dark:bg-gray-900 p-8 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm">
                        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-gray-400 mb-6 flex justify-between items-center">
                            <span>Overtime Log Audit Table</span>
                            <span className="text-[10px] text-red-600 dark:text-red-400 font-bold bg-red-50 dark:bg-red-900/30 px-3 py-1 rounded-full uppercase">Delay Audit</span>
                        </h3>
                        <div className="overflow-x-auto rounded-2xl border border-gray-100 dark:border-gray-800/80">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gray-50/50 dark:bg-gray-850/50 border-b border-gray-100 dark:border-gray-800">
                                        <th className="p-4 text-[9px] font-black uppercase tracking-widest text-gray-400">Date</th>
                                        <th className="p-4 text-[9px] font-black uppercase tracking-widest text-gray-400">Performer</th>
                                        <th className="p-4 text-[9px] font-black uppercase tracking-widest text-gray-400">Process Type</th>
                                        <th className="p-4 text-[9px] font-black uppercase tracking-widest text-gray-400 text-center">Estimated</th>
                                        <th className="p-4 text-[9px] font-black uppercase tracking-widest text-gray-400 text-center">Taken Time</th>
                                        <th className="p-4 text-[9px] font-black uppercase tracking-widest text-gray-400 text-center">Delay</th>
                                        <th className="p-4 text-[9px] font-black uppercase tracking-widest text-gray-400 text-right">Delay %</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-150 dark:divide-gray-800">
                                    {paginatedAuditLogs.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="p-8 text-center text-xs italic text-gray-400">No delayed entries located</td>
                                        </tr>
                                    ) : (
                                        paginatedAuditLogs.map((row) => (
                                            <tr key={row.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-850/50 transition-colors">
                                                <td className="p-4 font-semibold text-xs text-gray-500 dark:text-gray-400 font-mono">{row.date}</td>
                                                <td className="p-4 font-bold text-sm text-gray-900 dark:text-white uppercase">{row.performerName}</td>
                                                <td className="p-4 font-semibold text-xs text-gray-700 dark:text-gray-300">{row.taskType}</td>
                                                <td className="p-4 text-sm text-gray-500 dark:text-gray-400 text-center font-mono">{row.estimatedTime}h</td>
                                                <td className="p-4 text-sm text-gray-900 dark:text-white text-center font-bold font-mono">{row.takenTime}h</td>
                                                <td className="p-4 text-sm text-red-500 text-center font-black font-mono">+{row.delay.toFixed(1)}h</td>
                                                <td className="p-4 text-sm font-black text-right text-red-500 font-mono">+{row.delayPct}%</td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination controls */}
                        {totalAuditPages > 1 && (
                            <div className="flex items-center justify-between mt-6">
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                    Page {auditPage + 1} of {totalAuditPages}
                                </span>
                                <div className="flex gap-2">
                                    <button
                                        disabled={auditPage === 0}
                                        onClick={() => setAuditPage(prev => prev - 1)}
                                        className="p-2 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-750 text-gray-500 disabled:opacity-50 rounded-xl transition-all"
                                        aria-label="Previous page"
                                    >
                                        <ChevronLeft size={16} />
                                    </button>
                                    <button
                                        disabled={auditPage >= totalAuditPages - 1}
                                        onClick={() => setAuditPage(prev => prev + 1)}
                                        className="p-2 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-750 text-gray-500 disabled:opacity-50 rounded-xl transition-all"
                                        aria-label="Next page"
                                    >
                                        <ChevronRight size={16} />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ── SUB-TAB 3: Division Target Overrides (Team Leads & above) ── */}
            {analyticsSubTab === 'targets' && ['super_admin', 'general_manager', 'assistant_manager', 'team_lead', 'group_lead'].includes(userProfile?.role) && (
                <div className="space-y-8 animate-in fade-in duration-500">
                    
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* target overrides form */}
                        <div className="bg-white dark:bg-gray-900 p-8 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm h-fit">
                            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-gray-400 mb-6 flex items-center gap-2">
                                <Plus size={16} className="text-blue-600" />
                                Assign Custom Target
                            </h3>

                            <form onSubmit={handleSaveTarget} className="space-y-5">
                                <div>
                                    <label className="block text-[9px] font-black uppercase tracking-widest text-gray-400 mb-2 ml-1">Client Code</label>
                                    <select
                                        value={targetClient}
                                        disabled={!isManager} // Team Leads restricted to their assigned client
                                        onChange={e => setTargetClient(e.target.value)}
                                        className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-3 rounded-xl text-xs font-bold font-mono focus:ring-1 focus:ring-blue-500 outline-none"
                                    >
                                        {!isManager && userProfile?.client_id ? (
                                            <option value={userProfile.client_id}>{userProfile.client_id}</option>
                                        ) : (
                                            clients.map(c => <option key={c.id} value={c.code}>{c.code}</option>)
                                        )}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-[9px] font-black uppercase tracking-widest text-gray-400 mb-2 ml-1">Division</label>
                                    <select
                                        value={targetSubDivision}
                                        onChange={e => setTargetSubDivision(e.target.value)}
                                        className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-3 rounded-xl text-xs font-bold font-mono focus:ring-1 focus:ring-blue-500 outline-none"
                                    >
                                        <option value="PreEdit">PreEdit</option>
                                        <option value="Validation">Validation</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-[9px] font-black uppercase tracking-widest text-gray-400 mb-2 ml-1">Task / Process Type</label>
                                    <select
                                        value={targetTaskType}
                                        onChange={e => setTargetTaskType(e.target.value)}
                                        className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-3 rounded-xl text-xs font-bold font-mono focus:ring-1 focus:ring-blue-500 outline-none"
                                    >
                                        {targetSubDivision === 'PreEdit' ? (
                                            <>
                                                <option value="Preedit">Preedit (Standard: 300)</option>
                                                <option value="Prestyle">Prestyle (Standard: 900)</option>
                                                <option value="Style Editing">Style Editing (Standard: 80)</option>
                                            </>
                                        ) : (
                                            <>
                                                <option value="FL Validation">FL Validation (Standard: 600)</option>
                                                <option value="Revises Validation">Revises Validation (Standard: 1200)</option>
                                            </>
                                        )}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-[9px] font-black uppercase tracking-widest text-gray-400 mb-2 ml-1">Target Value (Pages/8h)</label>
                                    <input
                                        type="number"
                                        placeholder="Enter target pages"
                                        value={targetValue}
                                        onChange={e => setTargetValue(e.target.value)}
                                        className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-3 rounded-xl text-xs font-bold font-mono focus:ring-1 focus:ring-blue-500 outline-none"
                                        required
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={targetSaving}
                                    className="w-full py-3 bg-blue-600 text-white font-black rounded-xl text-xs uppercase tracking-widest hover:bg-blue-700 active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                                >
                                    {targetSaving ? 'Saving Target...' : 'Save Target Override'}
                                </button>
                            </form>
                        </div>

                        {/* target overrides list */}
                        <div className="bg-white dark:bg-gray-900 p-8 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm lg:col-span-2 flex flex-col">
                            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-gray-400 mb-6 flex justify-between items-center">
                                <span>Active Target Overrides</span>
                                <span className="text-[10px] text-blue-600 dark:text-blue-400 font-bold bg-blue-50 dark:bg-blue-900/30 px-3 py-1 rounded-full uppercase">Division Scope</span>
                            </h3>

                            <div className="overflow-x-auto rounded-2xl border border-gray-100 dark:border-gray-800/80 flex-1">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-gray-50/50 dark:bg-gray-850/50 border-b border-gray-100 dark:border-gray-800">
                                            <th className="p-4 text-[9px] font-black uppercase tracking-widest text-gray-400">Client</th>
                                            <th className="p-4 text-[9px] font-black uppercase tracking-widest text-gray-400">Division</th>
                                            <th className="p-4 text-[9px] font-black uppercase tracking-widest text-gray-400">Process Type</th>
                                            <th className="p-4 text-[9px] font-black uppercase tracking-widest text-gray-400 text-center">Custom Target</th>
                                            <th className="p-4 text-[9px] font-black uppercase tracking-widest text-gray-400 text-right">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                        {(divisionTargets || []).length === 0 ? (
                                            <tr>
                                                <td colSpan={5} className="p-8 text-center text-xs italic text-gray-400">
                                                    No division targets defined. System is running standard targets.
                                                </td>
                                            </tr>
                                        ) : (
                                            (divisionTargets || []).map((row) => (
                                                <tr key={row.id || `${row.client_id}-${row.sub_division}-${row.task_type}`} className="hover:bg-gray-50/50 dark:hover:bg-gray-850/50 transition-colors">
                                                    <td className="p-4 font-bold text-sm text-gray-900 dark:text-white uppercase">{row.client_id}</td>
                                                    <td className="p-4 text-xs font-semibold text-gray-500">{row.sub_division}</td>
                                                    <td className="p-4 text-xs font-bold text-gray-900 dark:text-white">{row.task_type}</td>
                                                    <td className="p-4 text-sm font-black text-center text-blue-600 dark:text-blue-400 font-mono">{row.target_value} pages / 8h</td>
                                                    <td className="p-4 text-right">
                                                        <button
                                                            onClick={() => handleDeleteTarget(row.id, row)}
                                                            className="p-1.5 hover:bg-red-50 dark:hover:bg-red-950/20 text-red-500 rounded-lg transition-colors"
                                                            title="Delete override"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            <div className="mt-4 p-4 rounded-2xl bg-blue-50/40 dark:bg-blue-950/15 border border-blue-100/50 dark:border-blue-900/35 text-[10px] font-medium leading-relaxed flex gap-2.5">
                                <Info size={16} className="text-blue-500 shrink-0 mt-0.5" />
                                <div className="text-gray-500 dark:text-gray-400">
                                    Custom division targets override system standard targets globally for that Client & Division. Any performers assigned to the matching Client & Division will be measured against this custom rate.
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            )}
        </div>
    );
};

export default Dashboard;
