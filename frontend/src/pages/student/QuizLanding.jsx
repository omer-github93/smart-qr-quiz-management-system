import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Play, User, Clock, FileText, Loader2, AlertCircle, BrainCircuit } from 'lucide-react';
import { getStudentQuizDetailsApi, startStudentQuizSessionApi } from '../../api/student';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

const QuizLanding = () => {
    const { slug } = useParams();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [quizDetails, setQuizDetails] = useState(null);
    const [error, setError] = useState('');

    const [studentData, setStudentData] = useState({
        student_name: '',
        student_id: ''
    });
    const [isStarting, setIsStarting] = useState(false);

    useEffect(() => {
        fetchDetails();
    }, [slug]);

    const fetchDetails = async () => {
        try {
            const res = await getStudentQuizDetailsApi(slug);
            setQuizDetails(res.data);
        } catch (err) {
            console.error('Failed to fetch quiz details:', err);
            setError(err.response?.data?.message || 'Quiz not found or is currently inactive.');
        } finally {
            setLoading(false);
        }
    };

    const handleStart = async (e) => {
        e.preventDefault();
        if (!studentData.student_name.trim()) return;

        setIsStarting(true);
        setError('');

        try {
            const res = await startStudentQuizSessionApi(slug, studentData);
            // Save attempt and quiz data to localStorage or pass via state to the Session component
            // We'll pass it via router state to keep it secure-ish and avoid complex state management
            navigate(`/quiz/${slug}/session`, {
                state: {
                    attemptId: res.data.attempt_id,
                    quizData: res.data.quiz
                },
                replace: true // Prevent going back to the landing page easily
            });
        } catch (err) {
            console.error('Failed to start quiz:', err);
            setError(err.response?.data?.message || 'Failed to start the quiz. Please try again.');
            setIsStarting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
            </div>
        );
    }

    if (error || !quizDetails) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 max-w-md w-full text-center space-y-4">
                    <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-2">
                        <AlertCircle size={32} />
                    </div>
                    <h1 className="text-xl font-bold text-slate-800">Quiz Unavailable</h1>
                    <p className="text-slate-500 text-sm">{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full animate-in fade-in zoom-in-95 duration-500">
                {/* Header Logo */}
                <div className="flex justify-center mb-8">
                    <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30 text-white font-bold text-2xl">
                        <BrainCircuit size={32} />
                    </div>
                </div>

                <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
                    {/* Quiz Hero Info */}
                    <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-8 text-white relative overflow-hidden">
                        <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl pointer-events-none"></div>

                        <h1 className="text-2xl font-bold mb-2 relative z-10 leading-tight">
                            {quizDetails.title}
                        </h1>

                        {quizDetails.description && (
                            <p className="text-blue-100 text-sm mb-6 relative z-10 line-clamp-3">
                                {quizDetails.description}
                            </p>
                        )}

                        <div className="flex flex-wrap items-center gap-4 relative z-10 mt-4">
                            <div className="flex items-center gap-1.5 text-sm font-medium bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-xl">
                                <Clock size={16} />
                                {quizDetails.time_limit} Minutes
                            </div>
                            <div className="flex items-center gap-1.5 text-sm font-medium bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-xl">
                                <FileText size={16} />
                                {quizDetails.questions_count} Questions
                            </div>
                        </div>
                    </div>

                    {/* Registration Form */}
                    <div className="p-8">
                        <div className="mb-6 text-center">
                            <h2 className="text-lg font-bold text-slate-800">Ready to start?</h2>
                            <p className="text-sm text-slate-500 mt-1">Please enter your details below.</p>
                        </div>

                        <form onSubmit={handleStart} className="space-y-5">
                            <div className="space-y-4">
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <User className="h-5 w-5 text-slate-400" />
                                    </div>
                                    <input
                                        type="text"
                                        required
                                        className="appearance-none rounded-2xl relative block w-full pl-11 pr-3 py-4 border border-slate-200 placeholder-slate-400 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm transition-all shadow-sm"
                                        placeholder="Full Name"
                                        value={studentData.student_name}
                                        onChange={(e) => setStudentData({ ...studentData, student_name: e.target.value })}
                                    />
                                </div>

                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <User className="h-5 w-5 text-slate-400" />
                                    </div>
                                    <input
                                        type="text"
                                        className="appearance-none rounded-2xl relative block w-full pl-11 pr-3 py-4 border border-slate-200 placeholder-slate-400 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm transition-all shadow-sm"
                                        placeholder="Student ID (Optional)"
                                        value={studentData.student_id}
                                        onChange={(e) => setStudentData({ ...studentData, student_id: e.target.value })}
                                    />
                                </div>
                            </div>

                            <Button
                                type="submit"
                                className="w-full h-14 rounded-2xl text-base font-bold shadow-lg shadow-blue-500/30 gap-2 mt-2"
                                disabled={isStarting || !studentData.student_name.trim()}
                            >
                                {isStarting ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <>Start Quiz <Play size={18} fill="currentColor" /></>
                                )}
                            </Button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default QuizLanding;
