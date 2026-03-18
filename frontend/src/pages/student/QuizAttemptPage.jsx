import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { attemptsAPI, quizzesAPI } from "../../api/client";
import { motion, AnimatePresence } from "framer-motion";
import {
    AlertTriangle, Clock, ChevronLeft, ChevronRight,
    Send, Flag, Zap, HelpCircle, ShieldAlert
} from "lucide-react";
import toast from "react-hot-toast";

function formatTime(secs) {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

export default function QuizAttemptPage() {
    const { quizId } = useParams();
    const navigate = useNavigate();
    const [quiz, setQuiz] = useState(null);
    const [attempt, setAttempt] = useState(null);
    const [questions, setQuestions] = useState([]);
    const [answers, setAnswers] = useState({});
    const [currentIdx, setCurrentIdx] = useState(0);
    const [timeLeft, setTimeLeft] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [warnings, setWarnings] = useState(0);
    const [direction, setDirection] = useState(0); // -1 for prev, 1 for next
    const [feedback, setFeedback] = useState({}); // store feedback for each question

    const timerRef = useRef(null);
    const startTimeRef = useRef({});

    useEffect(() => {
        const init = async () => {
            const [qr, ar] = await Promise.all([
                quizzesAPI.get(quizId),
                attemptsAPI.start(quizId),
            ]);
            setQuiz(qr.data);
            setAttempt(ar.data);
            setTimeLeft(qr.data.duration_minutes * 60);

            const qs = await attemptsAPI.getQuestions(ar.data.attempt_id);
            setQuestions(qs.data);
            startTimeRef.current[qs.data[0]?.id] = Date.now();
            setLoading(false);
        };
        init().catch(err => {
            toast.error(err.response?.data?.detail || "Could not start quiz");
            navigate("/student");
        });
    }, [quizId]);

    useEffect(() => {
        if (timeLeft === null || timeLeft <= 0 || submitting) return;
        timerRef.current = setTimeout(() => setTimeLeft(t => t - 1), 1000);
        return () => clearTimeout(timerRef.current);
    }, [timeLeft, submitting]);

    const handleSubmit = useCallback(async (auto = false) => {
        if (!attempt || submitting) return;
        if (!auto && !confirm("Ready to submit? Your results will be calculated immediately.")) return;
        setSubmitting(true);
        clearTimeout(timerRef.current);
        try {
            await attemptsAPI.submit(attempt.attempt_id);
            navigate(`/student/result/${attempt.attempt_id}`);
        } catch (e) {
            toast.error("Submission failed. Auto-saved answers are safe.");
            setSubmitting(false);
        }
    }, [attempt, submitting, navigate]);

    useEffect(() => {
        if (timeLeft === 0 && attempt && !submitting) {
            handleSubmit(true);
        }
    }, [timeLeft, attempt, submitting, handleSubmit]);

    useEffect(() => {
        const handleVisibility = () => {
            if (document.hidden && attempt) {
                const newWarnings = warnings + 1;
                setWarnings(newWarnings);
                attemptsAPI.logAntiCheat({ attempt_id: attempt.attempt_id, event_type: "tab_switch", details: `Tab switch #${newWarnings}` });
                toast.error(`⚠️ Warning ${newWarnings}/3: Suspicious activity detected!`, {
                    style: { background: "#EF4444", color: "#FFF", fontWeight: "bold" }
                });
                if (newWarnings >= 3) {
                    handleSubmit(true);
                }
            }
        };
        document.addEventListener("visibilitychange", handleVisibility);
        return () => document.removeEventListener("visibilitychange", handleVisibility);
    }, [attempt, warnings]);

    const handleAnswer = async (questionId, option) => {
        if (answers[questionId]) return; // lock answer once selected
        setAnswers(prev => ({ ...prev, [questionId]: option }));
        if (attempt) {
            const timeTaken = Math.round((new Date().getTime() - (startTimeRef.current[questionId] || new Date().getTime())) / 1000);
            try {
                const res = await attemptsAPI.saveAnswer({ attempt_id: attempt.attempt_id, question_id: questionId, selected_option: option, time_taken_seconds: timeTaken });
                setFeedback(prev => ({ ...prev, [questionId]: res.data }));
            } catch (err) {
                toast.error("Failed to save answer reliably.");
            }
        }
    };

    const goTo = (idx) => {
        if (idx < 0 || idx >= questions.length) return;
        setDirection(idx > currentIdx ? 1 : -1);
        startTimeRef.current[questions[idx]?.id] = Date.now();
        setCurrentIdx(idx);
    };



    if (loading) return (
        <div className="min-h-screen bg-bg-color flex items-center justify-center p-10">
            <div className="text-center">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                    className="w-12 h-12 border-4 border-brand-primary border-t-transparent rounded-full mx-auto mb-8"
                />
                <h2 className="text-2xl font-bold text-text-primary tracking-tight">Syncing Assessment...</h2>
                <p className="text-text-secondary font-medium mt-2">Preparing secure examination environment</p>
            </div>
        </div>
    );

    const currentQ = questions[currentIdx];
    const selectedOption = answers[currentQ?.id];
    const currentFeedback = feedback[currentQ?.id];
    const answeredCount = Object.keys(answers).length;
    const progress = (answeredCount / questions.length) * 100;
    const urgentTime = timeLeft !== null && timeLeft < 60;

    return (
        <div className="min-h-screen bg-bg-color flex flex-col font-sans">
            {/* Immersive Header */}
            <header className="fixed top-0 left-0 w-full h-24 bg-surface-color/80 backdrop-blur-xl border-b border-border-color z-50 flex flex-col">
                {/* Progress Bar Top */}
                <div className="h-1.5 w-full bg-light-bg dark:bg-dark-border overflow-hidden">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        className="h-full bg-brand-primary"
                    />
                </div>

                <div className="flex-1 flex items-center justify-between px-8">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-md bg-brand-primary/10 flex items-center justify-center text-brand-primary transition-all duration-300">
                            <Zap className="w-5 h-5 fill-current" />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-text-primary uppercase tracking-widest leading-none mb-1">{quiz?.title}</h3>
                            <div className="flex items-center gap-2">
                                <p className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">Question {currentIdx + 1} of {questions.length}</p>
                                <span className={`w-1.5 h-1.5 rounded-full ${urgentTime ? 'bg-red-500 animate-ping' : 'bg-brand-primary'}`} />
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-8">
                        {/* Warnings */}
                        {warnings > 0 && (
                            <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-black uppercase tracking-widest">
                                <ShieldAlert className="w-4 h-4" />
                                Warn: {warnings}/3
                            </div>
                        )}

                        {/* Timer */}
                        <div className={`flex items-center gap-3 px-6 py-2.5 rounded-md font-bold text-lg tracking-tight transition-all duration-300 ${urgentTime
                            ? "bg-red-500 text-white animate-pulse"
                            : "bg-surface-color border border-border-color text-text-primary"
                            }`}>
                            <Clock className={`w-4 h-4 ${urgentTime ? "animate-spin-slow" : "text-brand-primary"}`} />
                            {formatTime(timeLeft || 0)}
                        </div>

                        <button
                            onClick={() => handleSubmit(false)}
                            disabled={submitting}
                            className="btn-primary px-8 py-3.5 text-xs h-12"
                        >
                            {submitting ? "Processing..." : "Finish Attempt"}
                        </button>
                    </div>
                </div>
            </header>

            <main className="flex-1 flex flex-col lg:flex-row max-w-[1400px] mx-auto w-full gap-10 p-10 mt-24">
                {/* Question Area */}
                <div className="flex-1 flex flex-col">
                    <AnimatePresence mode="wait">
                        {currentQ && (
                            <motion.div
                                key={currentIdx}
                                initial={{ opacity: 0, x: direction * 50 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -direction * 50 }}
                                transition={{ duration: 0.4, ease: "circOut" }}
                                className="flex-1"
                            >
                                {/* Question Card */}
                                <div className="card p-10 mb-8 relative overflow-hidden group shadow-soft">
                                    <div className="absolute top-0 right-0 p-6">
                                        <div className={`px-4 py-1 rounded-full border text-[9px] font-bold uppercase tracking-widest ${currentQ.difficulty === 'hard' ? 'border-red-500/30 text-red-500' : 'border-brand-primary/30 text-brand-primary'
                                            }`}>
                                            {currentQ.difficulty || 'Medium'} Content
                                        </div>
                                    </div>

                                    <h2 className="text-2xl lg:text-3xl font-bold text-text-primary leading-tight mb-4 tracking-tight">
                                        {currentQ.text}
                                    </h2>
                                    <p className="text-[10px] font-bold text-text-secondary uppercase tracking-widest opacity-60">
                                        Weightage: {currentQ.marks} Points
                                    </p>
                                </div>

                                {/* Options Container */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {["a", "b", "c", "d"].map((opt) => {
                                        const optText = currentQ[`option_${opt}`];
                                        if (!optText) return null;
                                        const isSelected = selectedOption === opt;
                                        const isCorrectOpt = currentFeedback && opt === currentFeedback.correct_option.toLowerCase();
                                        
                                        let btnClass = `flex items-center p-5 rounded-md border text-left transition-all duration-300 relative overflow-hidden group/opt `;
                                        let iconClass = `w-10 h-10 rounded-md flex items-center justify-center font-bold text-sm mr-6 transition-all shrink-0 `;
                                        let textClass = `text-lg font-bold tracking-tight `;

                                        if (currentFeedback) {
                                            if (isCorrectOpt) {
                                                btnClass += "border-brand-primary bg-brand-primary/5";
                                                iconClass += "bg-brand-primary text-white";
                                                textClass += "text-brand-primary";
                                            } else if (isSelected && !currentFeedback.is_correct) {
                                                btnClass += "border-red-500 bg-red-500/5";
                                                iconClass += "bg-red-500 text-white";
                                                textClass += "text-red-500";
                                            } else {
                                                btnClass += "border-border-color bg-surface-color opacity-50";
                                                iconClass += "bg-light-bg dark:bg-dark-border text-text-secondary";
                                                textClass += "text-text-secondary";
                                            }
                                        } else {
                                            if (isSelected) {
                                                btnClass += "border-brand-primary bg-brand-primary/5 shadow-sm";
                                                iconClass += "bg-brand-primary text-white";
                                                textClass += "text-brand-primary";
                                            } else {
                                                btnClass += "border-border-color bg-surface-color hover:border-brand-primary/50 hover:shadow-sm";
                                                iconClass += "bg-light-bg dark:bg-dark-border text-text-secondary group-hover/opt:text-brand-primary";
                                                textClass += "text-text-primary";
                                            }
                                        }

                                        return (
                                            <motion.button
                                                key={opt}
                                                whileHover={!currentFeedback ? { y: -2 } : {}}
                                                onClick={() => handleAnswer(currentQ.id, opt)}
                                                disabled={!!currentFeedback}
                                                className={btnClass}
                                            >
                                                <div className={iconClass}>
                                                    {opt.toUpperCase()}
                                                </div>
                                                <span className={textClass}>
                                                    {optText}
                                                </span>
                                            </motion.button>
                                        );
                                    })}
                                </div>
                                
                                {/* Live Feedback Area */}
                                <AnimatePresence>
                                    {currentFeedback && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className={`mt-6 p-6 rounded-md border ${currentFeedback.is_correct ? 'bg-brand-primary/10 border-brand-primary/20' : 'bg-red-500/10 border-red-500/20'}`}
                                        >
                                            <div className="flex items-start justify-between gap-4">
                                                <div>
                                                    <h4 className={`text-lg font-bold ${currentFeedback.is_correct ? 'text-brand-primary' : 'text-red-500'} mb-2`}>
                                                        {currentFeedback.feedback_message}
                                                    </h4>
                                                    {!currentFeedback.is_correct && currentFeedback.explanation && (
                                                        <p className="text-sm font-medium text-text-secondary mt-2 border-t border-red-500/10 pt-2">
                                                            <strong>Reasoning:</strong> {currentFeedback.explanation}
                                                        </p>
                                                    )}
                                                </div>
                                                {currentIdx < questions.length - 1 && (
                                                    <button
                                                        onClick={() => goTo(currentIdx + 1)}
                                                        className={`px-6 py-3 rounded-md font-bold text-xs uppercase tracking-widest text-white transition-all shadow-md shrink-0 ${currentFeedback.is_correct ? 'bg-brand-primary hover:bg-brand-primary/90' : 'bg-red-500 hover:bg-red-500/90'}`}
                                                    >
                                                        Next Question →
                                                    </button>
                                                )}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Navigation Bar */}
                    <div className="flex items-center justify-between mt-12 bg-surface-color border border-border-color p-3 rounded-md shadow-sm">
                        <button
                            onClick={() => goTo(currentIdx - 1)}
                            disabled={currentIdx === 0}
                            className="bg-light-bg dark:bg-dark-border text-text-secondary px-6 py-3 rounded-md flex items-center gap-3 font-bold text-[10px] uppercase tracking-widest disabled:opacity-20 hover:text-brand-primary transition-colors"
                        >
                            <ChevronLeft className="w-4 h-4" /> Previous
                        </button>
                        <div className="flex items-center gap-2">
                            {questions.map((_, i) => (
                                <div key={i} className={`h-1 rounded-full transition-all duration-300 ${i === currentIdx ? 'w-4 bg-brand-primary' : answers[questions[i].id] ? 'w-2 bg-yellow-400' : 'w-2 bg-border-color'}`} />
                            ))}
                        </div>
                        <button
                            onClick={() => goTo(currentIdx + 1)}
                            disabled={currentIdx === questions.length - 1}
                            className="bg-light-bg dark:bg-dark-border text-text-secondary px-6 py-3 rounded-md flex items-center gap-3 font-bold text-[10px] uppercase tracking-widest disabled:opacity-20 hover:text-brand-primary transition-colors"
                        >
                            Next <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Question Palette Sidebar */}
                <div className="w-full lg:w-80 flex-shrink-0">
                    <div className="card sticky top-32 p-8 shadow-soft">
                        <div className="flex items-center justify-between mb-8">
                            <h4 className="text-[10px] font-bold text-text-secondary uppercase tracking-[0.2em]">Navigation Grid</h4>
                            <HelpCircle className="w-4 h-4 text-text-secondary opacity-40" />
                        </div>

                        <div className="grid grid-cols-5 gap-2.5">
                            {questions.map((q, i) => {
                                const isAnswered = !!answers[q.id];
                                const isCurrent = i === currentIdx;
                                return (
                                    <button
                                        key={q.id}
                                        onClick={() => goTo(i)}
                                        className={`w-10 h-10 rounded-md text-[10px] font-bold transition-all flex items-center justify-center relative ${isCurrent
                                            ? "bg-brand-primary text-white scale-110 shadow-md"
                                            : isAnswered
                                                ? "bg-yellow-50 border border-yellow-200 text-yellow-600"
                                                : "bg-light-bg dark:bg-dark-border border border-border-color text-text-secondary hover:border-brand-primary/50"
                                            }`}
                                    >
                                        {i + 1}
                                    </button>
                                );
                            })}
                        </div>

                        <div className="mt-10 space-y-4">
                            <h5 className="text-[10px] font-bold text-text-secondary uppercase tracking-widest pl-1">Legend</h5>
                            <div className="space-y-2">
                                <div className="flex items-center gap-3 text-[10px] font-bold text-text-primary px-3 py-2 rounded-md bg-light-bg dark:bg-dark-border border border-border-color">
                                    <div className="w-2.5 h-2.5 rounded bg-brand-primary" />
                                    Active Question
                                </div>
                                <div className="flex items-center gap-3 text-[10px] font-bold text-text-primary px-3 py-2 rounded-md bg-light-bg dark:bg-dark-border border border-border-color">
                                    <div className="w-2.5 h-2.5 rounded bg-yellow-400 border border-yellow-500" />
                                    Answered
                                </div>
                                <div className="flex items-center gap-3 text-[10px] font-bold text-text-primary px-3 py-2 rounded-md bg-light-bg dark:bg-dark-border border border-border-color">
                                    <div className="w-2.5 h-2.5 rounded bg-border-color" />
                                    Pending
                                </div>
                            </div>
                        </div>

                        <div className="mt-10 pt-8 border-t border-border-color/50">
                            <div className="flex items-center justify-between mb-4 px-1">
                                <span className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">Progress</span>
                                <span className="text-[10px] font-bold text-brand-primary">{Math.round(progress)}%</span>
                            </div>
                            <div className="h-1.5 bg-light-bg dark:bg-dark-border rounded-full overflow-hidden">
                                <motion.div
                                    animate={{ width: `${progress}%` }}
                                    className="h-full rounded-full bg-brand-primary"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
