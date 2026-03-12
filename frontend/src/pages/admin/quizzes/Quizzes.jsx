import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Plus,
    Search,
    MoreVertical,
    Edit2,
    Trash2,
    QrCode as QrIcon,
    Download,
    ExternalLink,
    Clock,
    FileText,
    AlertCircle,
    Loader2
} from 'lucide-react';
import {
    getQuizzesApi,
    createQuizApi,
    updateQuizApi,
    deleteQuizApi,
    generateQuizQrApi
} from '../../../api/quizzes';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Modal from '../../../components/ui/Modal';
import Badge from '../../../components/ui/Badge';
import { cn } from '../../../utils/cn';

const Quizzes = () => {
    const navigate = useNavigate();
    const [quizzes, setQuizzes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Modal states
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isQrModalOpen, setIsQrModalOpen] = useState(false);

    // Selection states
    const [selectedQuiz, setSelectedQuiz] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        fetchQuizzes();
    }, []);

    const fetchQuizzes = async () => {
        setLoading(true);
        try {
            const res = await getQuizzesApi();
            setQuizzes(res.data);
        } catch (error) {
            console.error('Failed to fetch quizzes:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenCreate = () => {
        navigate('/admin/quizzes/create');
    };

    const handleOpenEdit = (quiz) => {
        navigate(`/admin/quizzes/${quiz.id}/edit`);
    };

    const handleOpenDelete = (quiz) => {
        setSelectedQuiz(quiz);
        setIsDeleteModalOpen(true);
    };

    const handleOpenQr = (quiz) => {
        setSelectedQuiz(quiz);
        setIsQrModalOpen(true);
    };



    const handleDelete = async () => {
        if (!selectedQuiz) return;
        setIsSubmitting(true);
        try {
            await deleteQuizApi(selectedQuiz.id);
            setIsDeleteModalOpen(false);
            fetchQuizzes();
        } catch (error) {
            console.error('Failed to delete quiz:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDownloadQr = () => {
        if (!selectedQuiz?.qr_code_path) return;
        const link = document.createElement('a');
        link.href = `http://localhost:8000${selectedQuiz.qr_code_path}`;
        link.download = `quiz-qr-${selectedQuiz.slug}.svg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const filteredQuizzes = quizzes.filter(q =>
        q.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (q.description && q.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    if (loading && quizzes.length === 0) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header section */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Quiz Management</h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Total {quizzes.length} quizzes created</p>
                </div>
                <Button onClick={handleOpenCreate} className="rounded-2xl gap-2 h-12 px-6">
                    <Plus size={20} /> Create New Quiz
                </Button>
            </div>

            {/* Actions & Filters */}
            <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search quizzes by title or description..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-4 h-12 rounded-2xl border border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm shadow-sm dark:text-white"
                    />
                </div>
            </div>

            {/* Quiz Table */}
            <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 dark:bg-slate-700/50">
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Quiz Title</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center">Questions</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center">Time Limit</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center">Status</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 dark:divide-slate-700/50">
                            {filteredQuizzes.length > 0 ? filteredQuizzes.map((quiz) => (
                                <tr key={quiz.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{quiz.title}</span>
                                            {quiz.description && (
                                                <span className="text-xs text-slate-400 mt-0.5 line-clamp-1 max-w-xs">{quiz.description}</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <Badge variant="info">{quiz.questions_count || 0} Items</Badge>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <div className="flex items-center justify-center gap-1.5 text-xs text-slate-600 font-medium">
                                            <Clock size={14} className="text-slate-400" />
                                            {quiz.time_limit} Min
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <Badge variant={quiz.is_active ? 'success' : 'secondary'}>
                                            {quiz.is_active ? 'Active' : 'Inactive'}
                                        </Badge>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => handleOpenQr(quiz)}
                                                className="p-2 rounded-xl text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all border border-transparent hover:border-blue-100"
                                                title="View QR Code"
                                            >
                                                <QrIcon size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleOpenEdit(quiz)}
                                                className="p-2 rounded-xl text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all border border-transparent hover:border-blue-100"
                                                title="Edit Quiz"
                                            >
                                                <Edit2 size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleOpenDelete(quiz)}
                                                className="p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all border border-transparent hover:border-red-100"
                                                title="Delete Quiz"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="5" className="px-6 py-12 text-center text-slate-400 italic">
                                        {searchTerm ? 'No quizzes match your search.' : 'No quizzes found. Start by creating one!'}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>



            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                title="Delete Quiz"
                maxWidth="sm"
            >
                <div className="text-center space-y-4">
                    <div className="mx-auto w-16 h-16 bg-red-50 rounded-full flex items-center justify-center text-red-500">
                        <AlertCircle size={32} />
                    </div>
                    <div>
                        <h4 className="text-lg font-bold text-slate-900">Are you sure?</h4>
                        <p className="text-sm text-slate-500 px-4 mt-2">
                            This will permanently delete <span className="font-bold text-slate-700">"{selectedQuiz?.title}"</span> and all its associated questions and student attempts. This action cannot be undone.
                        </p>
                    </div>
                    <div className="flex flex-col gap-2 pt-4">
                        <Button
                            variant="danger"
                            onClick={handleDelete}
                            disabled={isSubmitting}
                            className="h-12 rounded-2xl"
                        >
                            {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : 'Yes, Delete Everything'}
                        </Button>
                        <Button
                            variant="secondary"
                            onClick={() => setIsDeleteModalOpen(false)}
                            className="h-12 rounded-2xl border-none shadow-none"
                        >
                            Cancel
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* QR Code Modal */}
            <Modal
                isOpen={isQrModalOpen}
                onClose={() => setIsQrModalOpen(false)}
                title="Quiz QR Code"
                maxWidth="sm"
            >
                <div className="text-center space-y-6">
                    <div className="bg-slate-50 p-6 rounded-3xl border border-dashed border-slate-200 flex items-center justify-center">
                        {selectedQuiz?.qr_code_path ? (
                            <img
                                src={`http://localhost:8000${selectedQuiz.qr_code_path}`}
                                alt="Quiz QR Code"
                                className="w-56 h-56 shadow-sm rounded-xl bg-white p-2"
                            />
                        ) : (
                            <div className="flex flex-col items-center gap-3 py-12 text-slate-400">
                                <QrIcon size={48} />
                                <p className="text-sm font-medium">QR Code not generated yet.</p>
                            </div>
                        )}
                    </div>
                    <div className="space-y-2">
                        <h4 className="text-lg font-bold text-slate-900">{selectedQuiz?.title}</h4>
                        <p className="text-sm text-slate-500">Students can scan this code to join the quiz directly.</p>
                    </div>
                    <div className="flex gap-3">
                        <Button
                            className="flex-1 rounded-2xl gap-2 h-12"
                            onClick={handleDownloadQr}
                            disabled={!selectedQuiz?.qr_code_path}
                        >
                            <Download size={18} /> Download SVG
                        </Button>
                        <Button
                            variant="secondary"
                            className="rounded-2xl h-12"
                            onClick={() => window.open(`http://localhost:5173/quiz/${selectedQuiz?.slug}`, '_blank')}
                        >
                            <ExternalLink size={18} />
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default Quizzes;
