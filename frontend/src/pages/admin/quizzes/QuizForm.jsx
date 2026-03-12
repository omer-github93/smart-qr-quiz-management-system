import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    Plus,
    Trash2,
    ArrowLeft,
    ImageIcon,
    CheckCircle2,
    Circle,
    Save,
    Loader2
} from 'lucide-react';
import { createQuizApi, updateQuizApi } from '../../../api/quizzes';
import api from '../../../api/index';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import { cn } from '../../../utils/cn';

const QUESTION_TYPES = [
    { value: 'multiple_choice', label: 'Multiple Choice (Single Answer)' },
    { value: 'multiple_answers', label: 'Multiple Choice (Multiple Answers)' },
    { value: 'short_answer', label: 'Short Answer' },
    { value: 'fill_blank', label: 'Fill in the Blank' }
];

const QuizForm = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEditMode = Boolean(id);

    const [loading, setLoading] = useState(isEditMode);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState({});

    // Quiz Details State
    const [quizData, setQuizData] = useState({
        title: '',
        description: '',
        time_limit: 30,
        is_active: true
    });

    // Questions State array
    const [questions, setQuestions] = useState([]);

    useEffect(() => {
        if (isEditMode) {
            fetchQuizDetails();
        } else {
            // Add one default question for new quizzes
            addQuestion();
        }
    }, [id]);

    const fetchQuizDetails = async () => {
        try {
            const res = await api.get(`/api/admin/quizzes/${id}`);
            const data = res.data;
            setQuizData({
                title: data.title || '',
                description: data.description || '',
                time_limit: data.time_limit || 30,
                is_active: data.is_active ?? true
            });

            if (data.questions && data.questions.length > 0) {
                const formattedQuestions = data.questions.map(q => ({
                    id: q.id,
                    text: q.text || '',
                    type: q.type || 'multiple_choice',
                    marks: q.marks || 1,
                    image_path: q.image_path || null,
                    imageFile: null, // Temporary file selected by user
                    remove_image: false,
                    options: q.options ? q.options.map(o => ({
                        id: o.id,
                        text: o.text || '',
                        is_correct: o.is_correct ? true : false
                    })) : []
                }));
                setQuestions(formattedQuestions);
            } else {
                addQuestion();
            }
        } catch (error) {
            console.error('Failed to fetch quiz', error);
        } finally {
            setLoading(false);
        }
    };

    const addQuestion = () => {
        setQuestions(prev => [
            ...prev,
            {
                text: '',
                type: 'multiple_choice',
                marks: 1,
                imageFile: null,
                options: [
                    { text: '', is_correct: false },
                    { text: '', is_correct: false }
                ]
            }
        ]);
    };

    const removeQuestion = (index) => {
        setQuestions(prev => prev.filter((_, i) => i !== index));
    };

    const updateQuestion = (index, field, value) => {
        setQuestions(prev => {
            const newQuestions = [...prev];
            newQuestions[index][field] = value;

            // Adjust options if switching types
            if (field === 'type') {
                if (value === 'short_answer' || value === 'fill_blank') {
                    // Usually you still need an option to compare against for auto-grading, 
                    // or you can clear options for manual grading. Let's keep one option for the correct answer.
                    if (newQuestions[index].options.length === 0) {
                        newQuestions[index].options = [{ text: '', is_correct: true }];
                    } else if (newQuestions[index].options.length > 1) {
                        newQuestions[index].options = [newQuestions[index].options[0]];
                        newQuestions[index].options[0].is_correct = true;
                    } else {
                        newQuestions[index].options[0].is_correct = true;
                    }
                } else if (value === 'multiple_choice' || value === 'multiple_answers') {
                    if (newQuestions[index].options.length < 2) {
                        newQuestions[index].options = [
                            ...newQuestions[index].options,
                            { text: '', is_correct: false }
                        ];
                    }
                    if (value === 'multiple_choice') {
                        // Ensure only one is correct
                        let foundCorrect = false;
                        newQuestions[index].options = newQuestions[index].options.map(opt => {
                            if (opt.is_correct && !foundCorrect) {
                                foundCorrect = true;
                                return opt;
                            }
                            return { ...opt, is_correct: false };
                        });
                    }
                }
            }
            return newQuestions;
        });
    };

    const handleImageChange = (qIndex, e) => {
        const file = e.target.files[0];
        if (file) {
            updateQuestion(qIndex, 'imageFile', file);
            updateQuestion(qIndex, 'remove_image', false);
        }
    };

    const removeImage = (qIndex) => {
        updateQuestion(qIndex, 'imageFile', null);
        updateQuestion(qIndex, 'remove_image', true);
    };

    // --- Options Management ---
    const addOption = (qIndex) => {
        setQuestions(prev => {
            const newQuestions = [...prev];
            newQuestions[qIndex].options.push({ text: '', is_correct: false });
            return newQuestions;
        });
    };

    const removeOption = (qIndex, oIndex) => {
        setQuestions(prev => {
            const newQuestions = [...prev];
            newQuestions[qIndex].options = newQuestions[qIndex].options.filter((_, i) => i !== oIndex);
            return newQuestions;
        });
    };

    const updateOption = (qIndex, oIndex, field, value) => {
        setQuestions(prev => {
            const newQuestions = [...prev];

            if (field === 'is_correct' && newQuestions[qIndex].type === 'multiple_choice') {
                // If single choice, reset others
                newQuestions[qIndex].options = newQuestions[qIndex].options.map((opt, i) => ({
                    ...opt,
                    is_correct: i === oIndex ? value : false
                }));
            } else {
                newQuestions[qIndex].options[oIndex][field] = value;
            }

            return newQuestions;
        });
    };

    const validateForm = () => {
        const newErrors = {};
        if (!quizData.title.trim()) newErrors.title = 'Title is required';
        if (quizData.time_limit < 1) newErrors.time_limit = 'Time limit must be valid';

        const qErrors = {};
        questions.forEach((q, qIndex) => {
            if (!q.text.trim()) {
                qErrors[`q-${qIndex}`] = 'Question text is required';
            }
            if (q.options.length === 0) {
                qErrors[`q-${qIndex}-opts`] = 'At least one option/answer is required';
            }
            q.options.forEach((opt, oIndex) => {
                if (!opt.text.trim()) {
                    qErrors[`q-${qIndex}-o-${oIndex}`] = 'Option text is required';
                }
            });
            if (q.type === 'multiple_choice' || q.type === 'multiple_answers') {
                const hasCorrect = q.options.some(o => o.is_correct);
                if (!hasCorrect) {
                    qErrors[`q-${qIndex}-correct`] = 'Select at least one correct option';
                }
            }
        });

        if (Object.keys(qErrors).length > 0) newErrors.questions = qErrors;
        return newErrors;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const formErrors = validateForm();
        if (Object.keys(formErrors).length > 0) {
            setErrors(formErrors);
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
        }

        setIsSubmitting(true);
        setErrors({});

        // Prepare FormData
        const formData = new FormData();
        formData.append('title', quizData.title);
        formData.append('description', quizData.description || '');
        formData.append('time_limit', quizData.time_limit);
        formData.append('is_active', quizData.is_active ? '1' : '0');

        if (isEditMode) {
            formData.append('_method', 'PUT'); // For Laravel PUT with FormData
        }

        questions.forEach((q, qIndex) => {
            if (q.id) formData.append(`questions[${qIndex}][id]`, q.id);
            formData.append(`questions[${qIndex}][text]`, q.text);
            formData.append(`questions[${qIndex}][type]`, q.type);
            formData.append(`questions[${qIndex}][marks]`, q.marks);

            if (q.imageFile) {
                formData.append(`questions[${qIndex}][image]`, q.imageFile);
            }
            if (q.remove_image) {
                formData.append(`questions[${qIndex}][remove_image]`, '1');
            }

            q.options.forEach((opt, oIndex) => {
                if (opt.id) formData.append(`questions[${qIndex}][options][${oIndex}][id]`, opt.id);
                formData.append(`questions[${qIndex}][options][${oIndex}][text]`, opt.text);
                formData.append(`questions[${qIndex}][options][${oIndex}][is_correct]`, opt.is_correct ? '1' : '0');
            });
        });

        try {
            if (isEditMode) {
                // Post to update route if your quiz API route allows it, or use custom api endpoints that handle _method
                // We'll use our standard axios instance to the standard quiz update endpoint 
                // Wait, Laravel resource PUT route might fail to read FormData standardly without _method spoof.
                await api.post(`/api/admin/quizzes/${id}`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            } else {
                await api.post('/api/admin/quizzes', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            }
            navigate('/admin/quizzes');
        } catch (error) {
            console.error('Save failed:', error);
            if (error.response?.data?.errors) {
                setErrors(error.response.data.errors);
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500 max-w-5xl mx-auto pb-12">

            <div className="flex items-center gap-4 mb-2">
                <button
                    onClick={() => navigate('/admin/quizzes')}
                    className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-500 dark:text-slate-400"
                >
                    <ArrowLeft size={20} />
                </button>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                    {isEditMode ? 'Edit Quiz' : 'Create New Quiz'}
                </h1>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
                {/* --- Quiz Basic Details --- */}
                <div className="bg-white dark:bg-slate-800 p-6 md:p-8 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm space-y-6">
                    <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 border-b border-slate-100 dark:border-slate-700 pb-3">Quiz Settings</h2>

                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-1.5 text-left">
                            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1">
                                Quiz Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                placeholder="e.g., Fundamentals of React"
                                value={quizData.title}
                                onChange={(e) => setQuizData({ ...quizData, title: e.target.value })}
                                className={cn(
                                    "w-full h-12 px-4 rounded-2xl border bg-slate-50/50 dark:bg-slate-900/50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all dark:text-white",
                                    errors.title
                                        ? "border-red-400 dark:border-red-500/70 bg-red-50/30 dark:bg-red-900/10"
                                        : "border-slate-200 dark:border-slate-600"
                                )}
                            />
                            {errors.title && (
                                <p className="text-red-500 dark:text-red-400 text-xs mt-1 ml-1 font-medium flex items-center gap-1">
                                    <span>⚠</span> {errors.title}
                                </p>
                            )}
                        </div>
                        <div className="space-y-1.5 text-left">
                            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1">
                                Quiz Period (minutes) <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="number"
                                placeholder="e.g., 30"
                                min="1"
                                value={quizData.time_limit}
                                onChange={(e) => setQuizData({ ...quizData, time_limit: parseInt(e.target.value) || 0 })}
                                className={cn(
                                    "w-full h-12 px-4 rounded-2xl border bg-slate-50/50 dark:bg-slate-900/50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all dark:text-white",
                                    errors.time_limit
                                        ? "border-red-400 dark:border-red-500/70 bg-red-50/30 dark:bg-red-900/10"
                                        : "border-slate-200 dark:border-slate-600"
                                )}
                            />
                            {errors.time_limit && (
                                <p className="text-red-500 dark:text-red-400 text-xs mt-1 ml-1 font-medium flex items-center gap-1">
                                    <span>⚠</span> {errors.time_limit}
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="space-y-1.5 text-left">
                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1">Description</label>
                        <textarea
                            className="w-full p-4 rounded-2xl border border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm min-h-[100px] resize-none dark:text-white"
                            placeholder="Briefly describe what this quiz is about..."
                            value={quizData.description}
                            onChange={(e) => setQuizData({ ...quizData, description: e.target.value })}
                        />
                    </div>

                    <label className="flex items-center gap-3 cursor-pointer group w-max">
                        <div className="relative">
                            <input
                                type="checkbox"
                                className="sr-only"
                                checked={quizData.is_active}
                                onChange={(e) => setQuizData({ ...quizData, is_active: e.target.checked })}
                            />
                            <div className={cn(
                                "w-10 h-6 rounded-full transition-colors duration-200",
                                quizData.is_active ? "bg-blue-600" : "bg-slate-200 dark:bg-slate-600"
                            )}></div>
                            <div className={cn(
                                "absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform duration-200",
                                quizData.is_active ? "translate-x-4" : ""
                            )}></div>
                        </div>
                        <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Publish Quiz (Active)</span>
                    </label>
                </div>

                {/* --- Questions Builder --- */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Questions</h2>
                        <span className="text-sm font-medium bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-3 py-1 rounded-full">
                            Total: {questions.length}
                        </span>
                    </div>

                    {questions.map((q, qIndex) => (
                        <div key={qIndex} className="bg-white dark:bg-slate-800 p-6 md:p-8 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm relative group animate-in slide-in-from-bottom-2 fade-in">
                            <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    type="button"
                                    onClick={() => removeQuestion(qIndex)}
                                    className="p-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
                                    title="Remove Question"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>

                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 flex items-center justify-center font-bold text-sm shrink-0">
                                    {qIndex + 1}
                                </div>
                                <div className="flex-1 max-w-xs">
                                    <select
                                        value={q.type}
                                        onChange={(e) => updateQuestion(qIndex, 'type', e.target.value)}
                                        className="w-full h-10 px-4 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-sm font-medium text-slate-700 dark:text-slate-200 focus:outline-none focus:border-blue-500"
                                    >
                                        {QUESTION_TYPES.map(type => (
                                            <option key={type.value} value={type.value}>{type.label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="w-24 space-y-1">
                                    <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider ml-1">Points</label>
                                    <input
                                        type="number"
                                        placeholder="Pts"
                                        min="1"
                                        value={q.marks}
                                        onChange={(e) => updateQuestion(qIndex, 'marks', parseInt(e.target.value) || 1)}
                                        className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-sm font-medium text-slate-700 dark:text-slate-200 focus:outline-none focus:border-blue-500 text-center"
                                        title="Points awarded for this question"
                                    />
                                </div>
                            </div>

                            <div className="space-y-6">
                                {/* Question Text & Image */}
                                <div className="grid md:grid-cols-[1fr,200px] gap-4 items-start">
                                    <div>
                                        <textarea
                                            className={cn(
                                                "w-full p-4 rounded-2xl border bg-slate-50/50 dark:bg-slate-900/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm min-h-[120px] resize-none dark:text-white",
                                                errors.questions?.[`q-${qIndex}`] ? "border-red-300 dark:border-red-500/50" : "border-slate-100 dark:border-slate-700"
                                            )}
                                            placeholder="Write your question here..."
                                            value={q.text}
                                            onChange={(e) => updateQuestion(qIndex, 'text', e.target.value)}
                                        />
                                        {errors.questions?.[`q-${qIndex}`] && <p className="text-red-500 text-xs mt-1 ml-1">{errors.questions[`q-${qIndex}`]}</p>}
                                    </div>

                                    <div className="flex flex-col gap-2">
                                        <div className="relative border-2 border-dashed border-slate-200 dark:border-slate-600 rounded-2xl h-[120px] flex items-center justify-center bg-slate-50 dark:bg-slate-900/50 overflow-hidden group/img">
                                            {(q.imageFile || (!q.remove_image && q.image_path)) ? (
                                                <>
                                                    <img
                                                        src={q.imageFile ? URL.createObjectURL(q.imageFile) : `http://localhost:8000${q.image_path}`}
                                                        alt="Question Attachment"
                                                        className="w-full h-full object-cover"
                                                    />
                                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity">
                                                        <button
                                                            type="button"
                                                            onClick={() => removeImage(qIndex)}
                                                            className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </>
                                            ) : (
                                                <label className="flex flex-col items-center gap-2 cursor-pointer text-slate-400 hover:text-blue-500 transition-colors">
                                                    <ImageIcon size={24} />
                                                    <span className="text-xs font-medium">Add Image</span>
                                                    <input
                                                        type="file"
                                                        className="hidden"
                                                        accept="image/*"
                                                        onChange={(e) => handleImageChange(qIndex, e)}
                                                    />
                                                </label>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Options Wrapper */}
                                <div className="pl-2 border-l-2 border-slate-100 dark:border-slate-700 space-y-3">
                                    <div className="flex items-center justify-between mb-2">
                                        <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">
                                            {q.type === 'short_answer' || q.type === 'fill_blank' ? 'Accepted Answer(s)' : 'Options'}
                                        </h4>
                                        {errors.questions?.[`q-${qIndex}-correct`] && (
                                            <span className="text-red-500 text-xs font-semibold px-2 py-1 bg-red-50 dark:bg-red-900/20 rounded-md">
                                                {errors.questions[`q-${qIndex}-correct`]}
                                            </span>
                                        )}
                                    </div>

                                    {q.options.map((opt, oIndex) => (
                                        <div key={oIndex} className="flex items-center gap-3">
                                            {(q.type === 'multiple_choice' || q.type === 'multiple_answers') && (
                                                <button
                                                    type="button"
                                                    onClick={() => updateOption(qIndex, oIndex, 'is_correct', !opt.is_correct)}
                                                    className={cn(
                                                        "shrink-0 transition-colors",
                                                        opt.is_correct ? "text-green-500" : "text-slate-300 dark:text-slate-600 hover:text-slate-400"
                                                    )}
                                                    title={opt.is_correct ? "Marked as Correct" : "Mark as Correct"}
                                                >
                                                    {q.type === 'multiple_choice'
                                                        ? (opt.is_correct ? <CheckCircle2 size={24} /> : <Circle size={24} />)
                                                        : (opt.is_correct ? <div className="w-6 h-6 rounded bg-green-500 text-white flex items-center justify-center"><CheckCircle2 size={16} /></div> : <div className="w-6 h-6 rounded border-2 border-slate-300 dark:border-slate-600"></div>)
                                                    }
                                                </button>
                                            )}

                                            <div className="flex-1 relative">
                                                <input
                                                    type="text"
                                                    value={opt.text}
                                                    onChange={(e) => updateOption(qIndex, oIndex, 'text', e.target.value)}
                                                    placeholder={q.type === 'short_answer' || q.type === 'fill_blank' ? 'Enter acceptable answer...' : `Option ${oIndex + 1}`}
                                                    className={cn(
                                                        "w-full h-12 px-4 rounded-xl border bg-white dark:bg-slate-900 text-sm focus:outline-none focus:border-blue-500 dark:text-white transition-colors",
                                                        opt.is_correct && (q.type === 'multiple_choice' || q.type === 'multiple_answers') ? "border-green-200 dark:border-green-900/50 bg-green-50/30 dark:bg-green-900/10" : "border-slate-200 dark:border-slate-600",
                                                        errors.questions?.[`q-${qIndex}-o-${oIndex}`] ? "border-red-300 dark:border-red-500/50" : ""
                                                    )}
                                                />
                                            </div>

                                            {((q.type === 'multiple_choice' || q.type === 'multiple_answers') && q.options.length > 2) || ((q.type === 'short_answer' || q.type === 'fill_blank') && q.options.length > 1) ? (
                                                <button
                                                    type="button"
                                                    onClick={() => removeOption(qIndex, oIndex)}
                                                    className="p-2 text-slate-400 hover:text-red-500 transition-colors shrink-0"
                                                >
                                                    <X size={20} />
                                                </button>
                                            ) : <div className="w-9" />}
                                        </div>
                                    ))}

                                    <Button
                                        type="button"
                                        variant="secondary"
                                        onClick={() => addOption(qIndex)}
                                        className="h-10 px-4 text-xs font-bold rounded-xl gap-1"
                                    >
                                        <Plus size={16} /> Add {q.type === 'short_answer' || q.type === 'fill_blank' ? 'Another variation' : 'Option'}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ))}

                    <div className="flex justify-center py-4">
                        <Button
                            type="button"
                            onClick={addQuestion}
                            className="bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 border-2 border-dashed border-blue-200 dark:border-blue-900/50 hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 h-14 px-8 rounded-2xl shadow-sm gap-2 w-full max-w-sm"
                        >
                            <Plus size={20} /> Add Next Question
                        </Button>
                    </div>
                </div>

                <div className="sticky bottom-6 z-20 flex justify-end gap-3 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-4 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xl">
                    <Button
                        variant="secondary"
                        type="button"
                        onClick={() => navigate('/admin/quizzes')}
                        className="rounded-xl px-6"
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        className="rounded-xl px-8 min-w-[140px] gap-2"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <><Save size={18} /> {isEditMode ? 'Save Changes' : 'Publish Quiz'}</>}
                    </Button>
                </div>
            </form>
        </div>
    );
};

// Simple inline X icon not imported above
function X({ size = 24, ...props }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
        </svg>
    );
}

export default QuizForm;
