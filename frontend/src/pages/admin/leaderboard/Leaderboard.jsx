import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import {
    Trophy,
    Search,
    Medal,
    Clock,
    Download,
    User,
    Calendar,
    Filter,
    Loader2
} from 'lucide-react';
import { getLeaderboardApi } from '../../../api/leaderboard';
import { getQuizzesApi } from '../../../api/quizzes';
import Button from '../../../components/ui/Button';
import Badge from '../../../components/ui/Badge';
import { cn } from '../../../utils/cn';

const Leaderboard = () => {
    const [loading, setLoading] = useState(true);
    const [attempts, setAttempts] = useState([]);
    const [quizzes, setQuizzes] = useState([]);
    const [selectedQuizId, setSelectedQuizId] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    useEffect(() => {
        fetchQuizzes();
    }, []);

    useEffect(() => {
        fetchLeaderboard();
    }, [currentPage, selectedQuizId]);

    const fetchQuizzes = async () => {
        try {
            const res = await getQuizzesApi();
            setQuizzes(res.data);
        } catch (error) {
            console.error('Failed to fetch quizzes:', error);
        }
    };

    const fetchLeaderboard = async () => {
        setLoading(true);
        try {
            const res = await getLeaderboardApi(currentPage, selectedQuizId);
            setAttempts(res.data.data || []);
            setTotalPages(res.data.last_page || 1);
        } catch (error) {
            console.error('Failed to fetch leaderboard:', error);
        } finally {
            setLoading(false);
        }
    };

    const exportToExcel = () => {
        const rows = filteredAttempts.map((attempt, index) => {
            const rank = (currentPage - 1) * 20 + index + 1;
            const duration = formatDuration(attempt.started_at, attempt.completed_at);
            const date = new Date(attempt.completed_at || attempt.started_at).toLocaleDateString();
            return {
                Rank: rank,
                'Student Name': attempt.student_name || '',
                'Student ID': attempt.student_id || '',
                Quiz: attempt.quiz?.title || 'Unknown Quiz',
                Score: attempt.score !== null ? `${attempt.score}%` : 'N/A',
                'Time Taken': duration,
                Date: date,
            };
        });

        const worksheet = XLSX.utils.json_to_sheet(rows);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Leaderboard');

        // Auto column widths
        const colWidths = Object.keys(rows[0] || {}).map(key => ({ wch: Math.max(key.length, 16) }));
        worksheet['!cols'] = colWidths;

        const quizName = selectedQuizId
            ? quizzes.find(q => String(q.id) === String(selectedQuizId))?.title || 'filtered'
            : 'all-quizzes';

        XLSX.writeFile(workbook, `leaderboard-${quizName}.xlsx`);
    };

    const filteredAttempts = attempts.filter(a =>
        (a.student_name && a.student_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (a.student_id && a.student_id.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const formatDuration = (start, end) => {
        if (!start || !end) return '-';
        const startDate = new Date(start);
        const endDate = new Date(end);
        const diffInSeconds = Math.floor((endDate - startDate) / 1000);

        const minutes = Math.floor(diffInSeconds / 60);
        const seconds = diffInSeconds % 60;

        if (minutes > 0) return `${minutes}m ${seconds}s`;
        return `${seconds}s`;
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-12">

            {/* Header section */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-blue-600 to-indigo-600 p-8 rounded-3xl shadow-lg relative overflow-hidden">
                <div className="absolute right-0 top-0 opacity-10 pointer-events-none transform translate-x-12 -translate-y-12">
                    <Trophy size={180} />
                </div>
                <div className="z-10 text-white">
                    <h1 className="text-3xl font-bold mb-2">Quiz Leaderboard</h1>
                    <p className="text-blue-100 text-sm max-w-md">Track student performance, scores, and completion times across all your quizzes.</p>
                </div>
                <div className="z-10">
                    <Button
                        variant="secondary"
                        className="gap-2 bg-white/10 hover:bg-white/20 text-white border-none backdrop-blur-sm"
                        onClick={exportToExcel}
                    >
                        <Download size={18} /> Export Excel
                    </Button>
                </div>
            </div>

            {/* Filters */}
            <div className="grid md:grid-cols-[1fr,300px] gap-4">
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search by student name or ID..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-4 h-12 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm shadow-sm dark:text-white"
                    />
                </div>
                <div className="relative">
                    <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <select
                        value={selectedQuizId}
                        onChange={(e) => {
                            setSelectedQuizId(e.target.value);
                            setCurrentPage(1);
                        }}
                        className="w-full pl-12 pr-4 h-12 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm shadow-sm font-medium text-slate-700 dark:text-slate-200 appearance-none"
                    >
                        <option value="">All Quizzes</option>
                        {quizzes.map(q => (
                            <option key={q.id} value={q.id}>{q.title}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Leaderboard Table */}
            <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden min-h-[400px]">
                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse min-w-[800px]">
                                <thead>
                                    <tr className="bg-slate-50/50 dark:bg-slate-700/50">
                                        <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider w-20 text-center">Rank</th>
                                        <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Student</th>
                                        <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Quiz</th>
                                        <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center">Score</th>
                                        <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center">Time Taken</th>
                                        <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">Date</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50 dark:divide-slate-700/50">
                                    {filteredAttempts.length > 0 ? filteredAttempts.map((attempt, index) => {
                                        // Rank logic: simply the index on the current sorted page + offset
                                        const rank = (currentPage - 1) * 20 + index + 1;

                                        return (
                                            <tr key={attempt.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition-colors">
                                                <td className="px-6 py-4 text-center">
                                                    {rank === 1 && <Medal className="inline text-yellow-500" size={24} />}
                                                    {rank === 2 && <Medal className="inline text-slate-400" size={24} />}
                                                    {rank === 3 && <Medal className="inline text-amber-700" size={24} />}
                                                    {rank > 3 && <span className="text-sm font-bold text-slate-500 dark:text-slate-400">#{rank}</span>}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                                                            <User size={18} />
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{attempt.student_name}</span>
                                                            {attempt.student_id && (
                                                                <span className="text-xs text-slate-400">ID: {attempt.student_id}</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-sm font-medium text-slate-600 dark:text-slate-300">{attempt.quiz?.title || 'Unknown Quiz'}</span>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <Badge variant={attempt.score >= 50 ? 'success' : 'danger'} className="text-base px-3 py-1">
                                                        {attempt.score !== null ? `${attempt.score}%` : 'N/A'}
                                                    </Badge>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <div className="flex items-center justify-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 font-medium">
                                                        <Clock size={14} className="text-slate-400" />
                                                        {formatDuration(attempt.started_at, attempt.completed_at)}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex items-center justify-end gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                                                        <Calendar size={14} />
                                                        {new Date(attempt.completed_at || attempt.started_at).toLocaleDateString()}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    }) : (
                                        <tr>
                                            <td colSpan="6" className="px-6 py-16 text-center text-slate-400 italic">
                                                {quizzes.length === 0 ? "You haven't created any quizzes yet!" : "No attempts found. Share your quiz QR codes with students!"}
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
                                <span className="text-sm text-slate-500 dark:text-slate-400">
                                    Page {currentPage} of {totalPages}
                                </span>
                                <div className="flex gap-2">
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                        disabled={currentPage === 1}
                                    >
                                        Previous
                                    </Button>
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                        disabled={currentPage === totalPages}
                                    >
                                        Next
                                    </Button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default Leaderboard;
