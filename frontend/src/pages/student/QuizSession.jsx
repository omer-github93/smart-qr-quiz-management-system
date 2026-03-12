import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams, Navigate } from 'react-router-dom';
import {
    Clock,
    AlertCircle,
    CheckCircle2,
    ChevronRight,
    ChevronLeft,
    Send,
    Loader2,
    Trophy
} from 'lucide-react';
import { submitStudentQuizSessionApi } from '../../api/student';
import Button from '../../components/ui/Button';
import { cn } from '../../utils/cn';

const QuizSession = () => {
    const { slug } = useParams();
    const location = useLocation();
    const navigate = useNavigate();

    // Fallback if accessed directly without going through landing page
    if (!location.state?.attemptId || !location.state?.quizData) {
        return <Navigate to={`/quiz/${slug}`} replace />;
    }

    const { attemptId, quizData } = location.state;
    const questions = quizData.questions || [];

    const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
    const [answers, setAnswers] = useState({});

    const [timeLeft, setTimeLeft] = useState(quizData.time_limit * 60);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [resultData, setResultData] = useState(null);
    const [error, setError] = useState('');
    const [showConfirmModal, setShowConfirmModal] = useState(false);

    useEffect(() => {
        // Prevent leaving page accidentally
        const handleBeforeUnload = (e) => {
            if (!resultData) {
                e.preventDefault();
                e.returnValue = '';
            }
        };
        window.addEventListener('beforeunload', handleBeforeUnload);

        // Timer logic
        if (timeLeft <= 0 && !resultData && !isSubmitting) {
            handleComplete(true); // Auto-submit when time's up
        }

        const timer = setInterval(() => {
            if (!resultData && !isSubmitting && timeLeft > 0) {
                setTimeLeft(prev => prev - 1);
            }
        }, 1000);

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
            clearInterval(timer);
        };
    }, [timeLeft, resultData, isSubmitting]);

    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
    };

    const handleAnswerChange = (questionId, optionId, answerText, type) => {
        setAnswers(prev => {
            const currentObj = prev[questionId] || {};

            if (type === 'multiple_answers') {
                // Toggle option array
                let currentOptions = currentObj.option_ids || [];
                if (currentOptions.includes(optionId)) {
                    currentOptions = currentOptions.filter(id => id !== optionId);
                } else {
                    currentOptions = [...currentOptions, optionId];
                }
                return {
                    ...prev,
                    [questionId]: { question_id: questionId, option_ids: currentOptions, type }
                };
            } else if (type === 'multiple_choice') {
                return {
                    ...prev,
                    [questionId]: { question_id: questionId, option_id: optionId, type }
                };
            } else {
                // Short answer / fill blank
                return {
                    ...prev,
                    [questionId]: { question_id: questionId, answer_text: answerText, type }
                };
            }
        });
    };

    const formatPayload = () => {
        const payloadAnswers = [];

        Object.values(answers).forEach(ans => {
            if (ans.type === 'multiple_answers') {
                // Our backend currently accepts one `option_id` per answer row.
                // To support multiple answers properly, we should submit each checked option as a separate answer record for that question.
                ans.option_ids.forEach(optId => {
                    payloadAnswers.push({
                        question_id: ans.question_id,
                        option_id: optId
                    });
                });
            } else if (ans.type === 'multiple_choice') {
                payloadAnswers.push({
                    question_id: ans.question_id,
                    option_id: ans.option_id
                });
            } else {
                payloadAnswers.push({
                    question_id: ans.question_id,
                    answer_text: ans.answer_text
                });
            }
        });

        return payloadAnswers;
    };

    const confirmSubmission = () => {
        setShowConfirmModal(true);
    };

    const handleComplete = async (isAutoSubmit = false) => {
        if (showConfirmModal) setShowConfirmModal(false);

        setIsSubmitting(true);
        setError('');

        try {
            const payload = {
                attempt_id: attemptId,
                answers: formatPayload()
            };

            const res = await submitStudentQuizSessionApi(slug, payload);
            setResultData({
                score: res.data.score,               // percentage 0-100
                earned_marks: res.data.earned_marks,
                total_marks: res.data.total_marks,
                show_results: res.data.show_results_immediately,
                message: res.data.message
            });
        } catch (err) {
            console.error('Submit failed:', err);
            setError(err.response?.data?.message || 'Failed to submit quiz. Please try again.');
            setIsSubmitting(false);
        }
    };

    const renderQuestionInput = (question) => {
        const currentAns = answers[question.id] || {};

        if (question.type === 'multiple_choice' || question.type === 'multiple_answers') {
            return (
                <div className="space-y-3 mt-6">
                    {question.options.map(opt => {
                        const isChecked = question.type === 'multiple_answers'
                            ? (currentAns.option_ids || []).includes(opt.id)
                            : currentAns.option_id === opt.id;

                        return (
                            <label
                                key={opt.id}
                                className={cn(
                                    "flex items-center p-4 rounded-2xl border-2 transition-all cursor-pointer group",
                                    isChecked
                                        ? "border-blue-500 bg-blue-50/50"
                                        : "border-slate-100 hover:border-blue-200 bg-white"
                                )}
                            >
                                <div className="relative flex items-center justify-center w-6 h-6 mr-4 shrink-0">
                                    <input
                                        type={question.type === 'multiple_answers' ? "checkbox" : "radio"}
                                        name={`question_${question.id}`}
                                        className="sr-only"
                                        checked={isChecked}
                                        onChange={() => handleAnswerChange(question.id, opt.id, null, question.type)}
                                    />
                                    <div className={cn(
                                        "w-full h-full bg-slate-100 border-2 transition-colors",
                                        question.type === 'multiple_answers' ? "rounded-md" : "rounded-full",
                                        isChecked ? "border-blue-600 bg-blue-600" : "border-slate-300 group-hover:border-blue-400"
                                    )}>
                                        {isChecked && <CheckCircle2 size={16} className="text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />}
                                    </div>
                                </div>
                                <span className="text-slate-700 font-medium select-none">{opt.text}</span>
                            </label>
                        );
                    })}
                </div>
            );
        }

        // Short Answer & Fill Blank
        return (
            <div className="mt-6">
                <textarea
                    className="w-full p-6 rounded-2xl border-2 border-slate-200 bg-white focus:outline-none focus:border-blue-500 transition-colors text-slate-800 resize-none min-h-[160px] text-lg shadow-inner"
                    placeholder="Type your answer here..."
                    value={currentAns.answer_text || ''}
                    onChange={(e) => handleAnswerChange(question.id, null, e.target.value, question.type)}
                />
            </div>
        );
    };

    if (resultData) {
        const percentage = resultData.score; // already 0-100
        const isPassed = percentage >= 50;
        const showScore = resultData.show_results !== false;

        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                <div className="bg-white p-10 rounded-[2.5rem] shadow-xl border border-slate-100 max-w-lg w-full text-center space-y-6 animate-in slide-in-from-bottom-4 fade-in duration-700">
                    <div className={cn(
                        "mx-auto w-24 h-24 rounded-full flex items-center justify-center shadow-lg text-white mb-2 rotate-12 scale-110",
                        isPassed || !showScore
                            ? "bg-gradient-to-br from-green-400 to-emerald-600 shadow-green-500/30"
                            : "bg-gradient-to-br from-red-400 to-rose-600 shadow-red-500/30"
                    )}>
                        <Trophy size={48} />
                    </div>

                    <div>
                        <h1 className="text-3xl font-black text-slate-800 mb-2">Quiz Completed!</h1>
                        <p className="text-slate-500 font-medium">Your answers have been submitted successfully.</p>
                    </div>

                    {showScore ? (
                        <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100 space-y-3 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 rounded-full blur-2xl -mt-10 -mr-10" />
                            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Final Score</p>

                            {/* Percentage ring */}
                            <div className="flex items-baseline justify-center gap-1">
                                <span className={cn(
                                    "text-6xl font-black",
                                    isPassed ? "text-emerald-600" : "text-red-500"
                                )}>{percentage}</span>
                                <span className="text-2xl font-bold text-slate-400">%</span>
                            </div>

                            <div className="text-slate-500 text-sm font-medium">
                                {resultData.earned_marks} / {resultData.total_marks} marks
                            </div>

                            <div className={cn(
                                "inline-block px-5 py-1.5 mt-1 rounded-full font-bold text-sm",
                                isPassed ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-600"
                            )}>
                                {isPassed ? '🎉 Passed' : '😔 Failed'}
                            </div>
                        </div>
                    ) : (
                        <div className="bg-blue-50 rounded-3xl p-6 border border-blue-100 space-y-2">
                            <p className="text-sm font-bold text-blue-400 uppercase tracking-widest">Status</p>
                            <p className="text-xl font-black text-blue-700">Submitted ✓</p>
                            <p className="text-sm text-blue-500">Your teacher will review and share results shortly.</p>
                        </div>
                    )}

                    <p className="text-sm text-slate-400 max-w-sm mx-auto">
                        You can now safely close this window. Your teacher has received your results.
                    </p>
                </div>
            </div>
        );
    }

    const currentQuestion = questions[currentQuestionIdx];
    const isLastQuestion = currentQuestionIdx === questions.length - 1;
    const progressPercent = ((currentQuestionIdx + 1) / questions.length) * 100;

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            {/* Top Navigation & Status Bar */}
            <div className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-md text-white font-bold shrink-0">
                            Q
                        </div>
                        <h1 className="font-bold text-slate-800 text-lg hidden sm:block truncate w-48 md:w-auto">
                            {quizData.title}
                        </h1>
                    </div>

                    <div className={cn(
                        "flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm shrink-0 transition-colors shadow-sm border",
                        timeLeft < 60 ? "bg-red-50 border-red-200 text-red-600 animate-pulse" : "bg-white border-slate-200 text-slate-700"
                    )}>
                        <Clock size={18} />
                        <span className="w-12 text-center inline-block tabular-nums">{formatTime(timeLeft)}</span>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-1.5 bg-slate-100">
                    <div
                        className="h-full bg-gradient-to-r from-blue-400 to-blue-600 transition-all duration-500 ease-out"
                        style={{ width: `${progressPercent}%` }}
                    />
                </div>
            </div>

            {/* Main Question Container */}
            <main className="flex-1 overflow-y-auto px-4 py-8">
                <div className="max-w-3xl mx-auto">

                    {error && (
                        <div className="mb-6 bg-red-50 text-red-600 p-4 rounded-xl flex items-center gap-3 border border-red-100">
                            <AlertCircle size={20} />
                            <span className="font-medium text-sm">{error}</span>
                        </div>
                    )}

                    {currentQuestion && (
                        <div className="bg-white rounded-[2.5rem] p-6 sm:p-10 shadow-lg shadow-slate-200/50 border border-slate-100 animate-in slide-in-from-right-8 fade-in duration-500">
                            <div className="flex items-center gap-3 mb-6">
                                <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold tracking-wider uppercase">
                                    Question {currentQuestionIdx + 1} of {questions.length}
                                </span>
                                <span className="px-3 py-1 bg-slate-50 border border-slate-200 text-slate-500 rounded-lg text-xs font-bold uppercase">
                                    {currentQuestion.marks} Point{currentQuestion.marks !== 1 ? 's' : ''}
                                </span>
                            </div>

                            <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 leading-snug mb-8">
                                {currentQuestion.text}
                            </h2>

                            {currentQuestion.image_path && (
                                <div className="mb-8 rounded-2xl overflow-hidden shadow-inner border border-slate-100 bg-slate-50 flex items-center justify-center p-2">
                                    <img
                                        src={`http://localhost:8000${currentQuestion.image_path}`}
                                        alt="Question reference"
                                        className="max-h-[300px] w-auto object-contain rounded-xl"
                                    />
                                </div>
                            )}

                            {renderQuestionInput(currentQuestion)}

                        </div>
                    )}

                </div>
            </main>

            {/* Bottom Actions Bar */}
            <div className="bg-white border-t border-slate-200 py-4 px-4 sm:px-6 sticky bottom-0 z-30">
                <div className="max-w-3xl mx-auto flex items-center justify-between gap-4">
                    <Button
                        variant="secondary"
                        className="h-14 rounded-2xl px-6 gap-2 font-bold text-slate-500 w-full sm:w-auto"
                        onClick={() => setCurrentQuestionIdx(prev => Math.max(0, prev - 1))}
                        disabled={currentQuestionIdx === 0 || isSubmitting}
                    >
                        <ChevronLeft size={20} /> <span className="hidden sm:inline">Previous</span>
                    </Button>

                    {!isLastQuestion ? (
                        <Button
                            className="h-14 rounded-2xl px-8 gap-2 font-bold shadow-lg shadow-blue-500/20 w-full sm:w-auto"
                            onClick={() => setCurrentQuestionIdx(prev => Math.min(questions.length - 1, prev + 1))}
                        >
                            Next Question <ChevronRight size={20} />
                        </Button>
                    ) : (
                        <Button
                            className="h-14 rounded-2xl px-10 gap-2 font-bold bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 shadow-lg shadow-green-500/20 w-full sm:w-auto border-none"
                            onClick={confirmSubmission}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <>Submit Quiz <Send size={18} /></>
                            )}
                        </Button>
                    )}
                </div>
            </div>

            {/* Custom Confirm Modal */}
            {showConfirmModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mb-6 mx-auto">
                            <AlertCircle size={32} />
                        </div>
                        <h3 className="text-xl font-bold text-center text-slate-800 mb-2">Submit Quiz?</h3>
                        <p className="text-center text-slate-500 mb-8">
                            Are you sure you're ready to submit your answers? You won't be able to change them afterwards.
                        </p>
                        <div className="flex gap-3">
                            <Button
                                variant="secondary"
                                className="flex-1 rounded-xl"
                                onClick={() => setShowConfirmModal(false)}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={() => handleComplete(false)}
                                className="flex-1 rounded-xl gap-2 bg-gradient-to-r from-emerald-500 to-green-600 border-none"
                            >
                                Confirm
                            </Button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default QuizSession;
