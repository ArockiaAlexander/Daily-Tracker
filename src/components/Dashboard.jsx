import React from 'react';
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
import { TrendingUp, Users, Target, Clock } from 'lucide-react';

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

const Dashboard = ({ entries }) => {
    if (!entries || entries.length === 0) {
        return (
            <div className="p-8 text-center text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-700/30 rounded-xl">
                <p>No data available for dashboard metrics.</p>
            </div>
        );
    }

    // Calculate Stats
    const totalEntries = entries.length;
    const avgTargetAchieved = (entries.reduce((acc, curr) => acc + Number(curr.targetAchieved), 0) / totalEntries).toFixed(2);
    const avgTimeEfficiency = (entries.reduce((acc, curr) => acc + Number(curr.timeAchieved), 0) / totalEntries).toFixed(2);
    const uniquePerformers = new Set(entries.map(e => e.performerName)).size;

    // Task Type Distribution
    const taskTypes = {};
    entries.forEach(e => {
        taskTypes[e.taskType] = (taskTypes[e.taskType] || 0) + 1;
    });

    const pieData = {
        labels: Object.keys(taskTypes),
        datasets: [
            {
                data: Object.values(taskTypes),
                backgroundColor: [
                    'rgba(54, 162, 235, 0.6)',
                    'rgba(255, 99, 132, 0.6)',
                    'rgba(75, 192, 192, 0.6)',
                    'rgba(255, 206, 86, 0.6)',
                    'rgba(153, 102, 255, 0.6)',
                    'rgba(255, 159, 64, 0.6)',
                ],
                borderWidth: 1,
            },
        ],
    };

    // Performance over time (Daily Trend)
    const dailyData = {};
    entries.sort((a, b) => new Date(a.date) - new Date(b.date)).forEach(e => {
        if (!dailyData[e.date]) {
            dailyData[e.date] = { count: 0, target: 0 };
        }
        dailyData[e.date].count += 1;
        dailyData[e.date].target += Number(e.targetAchieved);
    });

    const lineData = {
        labels: Object.keys(dailyData),
        datasets: [
            {
                label: 'Avg Target Achievement %',
                data: Object.keys(dailyData).map(date => (dailyData[date].target / dailyData[date].count).toFixed(2)),
                borderColor: 'rgb(75, 192, 192)',
                backgroundColor: 'rgba(75, 192, 192, 0.5)',
                tension: 0.3,
            },
        ],
    };

    return (
        <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center space-x-4">
                    <div className="p-3 bg-blue-100 dark:bg-blue-900/40 rounded-xl text-blue-600 dark:text-blue-400">
                        <Target size={24} />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Avg Target</p>
                        <p className="text-2xl font-bold">{avgTargetAchieved}%</p>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center space-x-4">
                    <div className="p-3 bg-green-100 dark:bg-green-900/40 rounded-xl text-green-600 dark:text-green-400">
                        <Clock size={24} />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Avg Efficiency</p>
                        <p className="text-2xl font-bold">{avgTimeEfficiency}%</p>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center space-x-4">
                    <div className="p-3 bg-purple-100 dark:bg-purple-900/40 rounded-xl text-purple-600 dark:text-purple-400">
                        <Users size={24} />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Team Members</p>
                        <p className="text-2xl font-bold">{uniquePerformers}</p>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center space-x-4">
                    <div className="p-3 bg-amber-100 dark:bg-amber-900/40 rounded-xl text-amber-600 dark:text-amber-400">
                        <TrendingUp size={24} />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Logs</p>
                        <p className="text-2xl font-bold">{totalEntries}</p>
                    </div>
                </div>
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <h3 className="text-lg font-bold mb-4">Task Distribution</h3>
                    <div className="aspect-square max-h-[300px] mx-auto">
                        <Pie data={pieData} options={{ maintainAspectRatio: false }} />
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <h3 className="text-lg font-bold mb-4">Performance Trend</h3>
                    <div className="h-[300px]">
                        <Line
                            data={lineData}
                            options={{
                                maintainAspectRatio: false,
                                scales: {
                                    y: {
                                        beginAtZero: true,
                                        max: 150
                                    }
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
