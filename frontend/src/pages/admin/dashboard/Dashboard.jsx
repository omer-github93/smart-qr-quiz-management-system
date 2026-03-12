import { useEffect, useState } from 'react';
import {
    LayoutDashboard,
    BookOpen,
    Users,
    History,
    ArrowRight,
    TrendingUp,
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, LabelList } from 'recharts';
import { getDashboardDataApi } from '../../../api/dashboard';
import { Link } from 'react-router-dom';
import Button from '../../../components/ui/Button';
import { cn } from '../../../utils/cn';

const Dashboard = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedQuizFilter, setSelectedQuizFilter] = useState('all');

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const res = await getDashboardDataApi();
                setData(res.data);
            } catch (error) {
                console.error('Failed to fetch dashboard data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    const stats = [
        {
            label: 'Total Quizzes',
            value: data?.total_quizzes || 0,
            icon: BookOpen,
            color: 'text-blue-600',
            bg: 'bg-blue-50',
            trend: '+12% from last month'
        },
        {
            label: 'Total Students',
            value: data?.total_participants || 0,
            icon: Users,
            color: 'text-purple-600',
            bg: 'bg-purple-50',
            trend: '+5 new today'
        },
        {
            label: 'Total Attempts',
            value: data?.total_attempts || 0,
            icon: History,
            color: 'text-emerald-600',
            bg: 'bg-emerald-50',
            trend: '+28 this week'
        },
    ];

    // Compute filtered attempts once (used by both charts)
    const filteredAttempts = (() => {
        if (!data?.all_attempts) return [];
        if (selectedQuizFilter === 'all') return data.all_attempts;
        return data.all_attempts.filter(a => a.quiz_id === parseInt(selectedQuizFilter));
    })();

    // Pass/Fail pie chart – driven by filteredAttempts
    const passFailData = [
        { name: 'Passed', value: filteredAttempts.filter(a => a.score >= 50).length },
        { name: 'Failed', value: filteredAttempts.filter(a => a.score < 50).length },
    ];
    const COLORS = ['#10b981', '#ef4444']; // Emerald (pass) and Red (fail)

    // Top Performers Bar Chart – derived from same filteredAttempts
    const processTopPerformers = () => {
        if (!filteredAttempts.length) return [];

        // Get highest score per student
        const bestScores = {};
        filteredAttempts.forEach(attempt => {
            if (!bestScores[attempt.student_name] || attempt.score > bestScores[attempt.student_name].score) {
                bestScores[attempt.student_name] = {
                    name: attempt.student_name,
                    score: attempt.score,
                };
            }
        });

        // Convert to array, sort by score descending, take top 10
        return Object.values(bestScores)
            .sort((a, b) => b.score - a.score)
            .slice(0, 10);
    };

    const topPerformersData = processTopPerformers();

    if (loading) {
        return (
            <div className="flex h-[60vh] items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
                    <p className="text-slate-500 font-medium">Loading Overview...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Dashboard Overview</h1>
                <p className="text-slate-500 mt-1">Welcome back! Here's what's happening with your quizzes.</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {stats.map((stat, i) => (
                    <div key={i} className="group bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md hover:border-blue-100 transition-all duration-300">
                        <div className="flex items-start justify-between">
                            <div className={cn("p-4 rounded-2xl transition-transform group-hover:scale-110", stat.bg)}>
                                <stat.icon className={cn("h-6 w-6", stat.color)} />
                            </div>
                            <div className="flex items-center gap-1 text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                                <TrendingUp size={12} />
                                {stat.trend.split(' ')[0]}
                            </div>
                        </div>
                        <div className="mt-4">
                            <h3 className="text-slate-500 dark:text-slate-400 text-sm font-medium">{stat.label}</h3>
                            <div className="flex items-baseline gap-2">
                                <span className="text-3xl font-bold text-slate-900 dark:text-white">{stat.value}</span>
                                <span className="text-xs text-slate-400 font-normal">{stat.trend.split(' ').slice(1).join(' ')}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Charts Filter Bar */}
            <div className="flex items-center justify-between bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm px-5 py-3">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">📊 Filtering charts by:</span>
                    <span className="text-sm font-bold text-blue-700 dark:text-blue-300">
                        {selectedQuizFilter === 'all'
                            ? 'All Quizzes'
                            : data?.quizzes?.find(q => q.id === parseInt(selectedQuizFilter))?.title || 'Selected Quiz'
                        }
                    </span>
                </div>
                <select
                    className="text-sm bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/50 rounded-full px-4 py-2 outline-none text-blue-700 dark:text-blue-300 font-semibold cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors focus:ring-2 focus:ring-blue-500/30"
                    value={selectedQuizFilter}
                    onChange={(e) => setSelectedQuizFilter(e.target.value)}
                >
                    <option value="all">All Quizzes</option>
                    {data?.quizzes?.map(q => (
                        <option key={q.id} value={q.id}>{q.title}</option>
                    ))}
                </select>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Main Content Area (span-8) - Top Performers Chart */}
                <div className="lg:col-span-8 bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col h-[500px]">
                    <div className="p-6 border-b border-slate-50 dark:border-slate-700 flex items-center justify-between">
                        <div>
                            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Top 10 Performers</h2>
                            <p className="text-xs text-slate-400 mt-0.5">
                                Highest scoring students · Sorted by best attempt
                            </p>
                        </div>
                        <span className="text-xs font-bold bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 px-3 py-1.5 rounded-full border border-emerald-100 dark:border-emerald-900/50">
                            Top {topPerformersData.length}
                        </span>
                    </div>

                    {topPerformersData.length > 0 ? (
                        <div className="flex-1 w-full min-h-0 pt-4 pr-6">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    layout="vertical"
                                    data={topPerformersData}
                                    margin={{ top: 10, right: 30, left: 20, bottom: 5 }}
                                >
                                    <XAxis
                                        type="number"
                                        domain={[0, 100]}
                                        hide
                                    />
                                    <YAxis
                                        dataKey="name"
                                        type="category"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#64748b', fontSize: 13, fontWeight: 500 }}
                                        width={120}
                                    />
                                    <Tooltip
                                        cursor={{ fill: 'rgba(0,0,0,0.02)' }}
                                        contentStyle={{
                                            borderRadius: '16px',
                                            border: 'none',
                                            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
                                            backgroundColor: '#ffffff',
                                            padding: '12px 16px',
                                        }}
                                        itemStyle={{ color: '#0f172a', fontWeight: 'bold' }}
                                    />
                                    <Bar dataKey="score" fill="#3b82f6" radius={[0, 8, 8, 0]} barSize={24}>
                                        {
                                            topPerformersData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={index < 3 ? '#10b981' : '#60a5fa'} />
                                            ))
                                        }
                                        <LabelList dataKey="score" position="right" formatter={(val) => `${val}%`} style={{ fill: '#64748b', fontSize: 13, fontWeight: 600 }} offset={12} />
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-slate-400 italic text-sm gap-2">
                            <History className="h-10 w-10 text-slate-200 dark:text-slate-600 mb-2" />
                            <p>No performance data available for this selection.</p>
                        </div>
                    )}
                    <div className="text-center pb-6 pt-2">
                        <Link to="/admin/leaderboard" className="text-sm font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors inline-flex items-center gap-1 group">
                            View Full Leaderboard <ArrowRight className="h-4 w-4 transform group-hover:translate-x-1 transition-transform" />
                        </Link>
                    </div>
                </div>

                {/* Side Content Area (span-4) - Pass/Fail Chart */}
                <div className="lg:col-span-4 space-y-6">
                    <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 p-6 shadow-sm flex flex-col h-[500px]">
                        <div className="border-b border-slate-50 dark:border-slate-700 pb-4 mb-4 flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Pass / Fail Distribution</h3>
                                <p className="text-xs text-slate-400 mt-0.5">Based on ≥50% pass threshold</p>
                            </div>
                            <span className="text-xs font-bold bg-slate-50 dark:bg-slate-700 text-slate-500 dark:text-slate-400 px-3 py-1.5 rounded-full border border-slate-100 dark:border-slate-700">
                                {passFailData.reduce((a, c) => a + c.value, 0)} total
                            </span>
                        </div>

                        <div className="flex-1 w-full flex items-center justify-center relative">
                            {passFailData.reduce((acc, curr) => acc + curr.value, 0) > 0 ? (
                                <ResponsiveContainer width="100%" height="100%" className="-mt-8">
                                    <PieChart>
                                        <Pie
                                            data={passFailData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={80}
                                            outerRadius={110}
                                            paddingAngle={8}
                                            dataKey="value"
                                            stroke="none"
                                        >
                                            {passFailData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            contentStyle={{
                                                borderRadius: '12px',
                                                border: 'none',
                                                boxShadow: '0 8px 20px rgba(0,0,0,0.1)',
                                                fontWeight: 'bold'
                                            }}
                                            itemStyle={{ color: '#0f172a' }}
                                        />
                                        <Legend
                                            verticalAlign="bottom"
                                            height={36}
                                            iconType="circle"
                                            wrapperStyle={{ paddingTop: '20px' }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="flex flex-col items-center justify-center text-slate-400 italic text-sm w-full h-full pb-10">
                                    <PieChart className="h-10 w-10 text-slate-200 dark:text-slate-600 mb-4" />
                                    <p>No data recorded yet.</p>
                                </div>
                            )}

                            {/* Centered Total Text inside Donut */}
                            {passFailData.reduce((acc, curr) => acc + curr.value, 0) > 0 && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-8 text-center">
                                    <span className="text-3xl font-black text-slate-900 dark:text-white leading-none">
                                        {passFailData.reduce((acc, curr) => acc + curr.value, 0)}
                                    </span>
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
                                        Total
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
