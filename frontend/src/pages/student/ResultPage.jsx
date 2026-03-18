import { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { attemptsAPI, aiAPI } from "../../api/client";
import { motion, AnimatePresence } from "framer-motion";
import {
    Trophy, CheckCircle, XCircle, Minus, Zap,
    ArrowRight, Lightbulb, ChevronDown, ChevronUp,
    Share2, RotateCcw, Home, BarChart3
} from "lucide-react";
import toast from "react-hot-toast";

const CATEGORY_CONFIG = {
    "Smart": { color: "from-brand-primary to-brand-secondary", bg: "bg-brand-primary/5 border-brand-primary/20", text: "text-brand-primary" },
    "Good": { color: "from-brand-secondary to-green-500/70", bg: "bg-green-500/5 border-green-500/20", text: "text-green-500" },
    "Average": { color: "from-yellow-400 to-yellow-500/70", bg: "bg-yellow-400/5 border-yellow-400/20", text: "text-yellow-500" },
    "Weak": { color: "from-orange-400 to-orange-500/70", bg: "bg-orange-400/5 border-orange-400/20", text: "text-orange-500" },
    "Poor": { color: "from-red-500 to-red-600/70", bg: "bg-red-500/5 border-red-500/20", text: "text-red-500" },
};

function ConfettiEffect({ active }) {
    useEffect(() => {
        if (!active) return;
        import("canvas-confetti").then(m => {
            const confetti = m.default;
            const duration = 3 * 1000;
            const animationEnd = Date.now() + duration;
            const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

            const randomInRange = (min, max) => Math.random() * (max - min) + min;

            const interval = setInterval(function () {
                const timeLeft = animationEnd - Date.now();
                if (timeLeft <= 0) return clearInterval(interval);
                const particleCount = 50 * (timeLeft / duration);
                confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
                confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
            }, 250);
        });
    }, [active]);
    return null;
}

export default function ResultPage() {
    const { attemptId } = useParams();
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(true);
    const [expandedQ, setExpandedQ] = useState(null);
    const [explanations, setExplanations] = useState({});
    const [explainLoading, setExplainLoading] = useState({});

    useEffect(() => {
        attemptsAPI.result(attemptId).then(r => setResult(r.data)).finally(() => setLoading(false));
    }, [attemptId]);

    const getExplanation = async (answer) => {
        if (explanations[answer.question_id]) return;
        setExplainLoading(prev => ({ ...prev, [answer.question_id]: true }));
        try {
            const r = await aiAPI.explainMistake({
                question_text: answer.question_text,
                correct_option: answer.correct_option,
                correct_answer_text: answer[`option_${answer.correct_option}`],
                student_selected: answer.selected_option,
                student_answer_text: answer[`option_${answer.selected_option}`] || "Not answered",
            });
            setExplanations(prev => ({ ...prev, [answer.question_id]: r.data.explanation }));
        } catch {
            toast.error("AI is recharging. Try again in a moment.");
        } finally {
            setExplainLoading(prev => ({ ...prev, [answer.question_id]: false }));
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-bg-color flex items-center justify-center">
            <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
                className="w-16 h-16 bg-brand-primary/10 rounded-md border border-brand-primary flex items-center justify-center"
            >
                <Trophy className="w-8 h-8 text-brand-primary" />
            </motion.div>
        </div>
    );

    if (!result) return (
        <div className="min-h-screen bg-bg-color flex items-center justify-center text-text-secondary font-black uppercase tracking-widest">
            Identity Not Found
        </div>
    );

    const catConfig = CATEGORY_CONFIG[result.performance_category] || CATEGORY_CONFIG["Average"];

    return (
        <div className="min-h-screen bg-bg-color py-12 px-6">
            <ConfettiEffect active={result.percentage >= 75} />

            <div className="max-w-4xl mx-auto space-y-12 pb-20">
                {/* Score Showcase */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`card relative overflow-hidden text-center py-16 ${catConfig.bg}`}
                >
                    <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-current to-transparent opacity-10" />

                    <motion.div
                        initial={{ scale: 0.8 }}
                        animate={{ scale: 1 }}
                        className={`text-[10rem] font-bold leading-none bg-gradient-to-b ${catConfig.color} bg-clip-text text-transparent tracking-tighter mb-4`}
                    >
                        {Math.round(result.percentage)}%
                    </motion.div>

                    <div className={`inline-flex items-center gap-3 px-6 py-2 rounded-md bg-white dark:bg-slate-900 border border-current ${catConfig.text} font-bold text-lg tracking-tight uppercase mb-8 shadow-sm`}>
                        {result.performance_category}
                    </div>

                    <h2 className="text-2xl font-bold text-text-primary mb-2 tracking-tight">{result.quiz_title}</h2>
                    <p className="text-text-secondary font-medium">
                        {result.passed
                            ? "Performance threshold achieved. Excellent work."
                            : "Scope for improvement identified. Review the curriculum."
                        }
                    </p>
                </motion.div>

                {/* Reward & Progress Terminal */}
                <div className="grid md:grid-cols-2 gap-8">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="card flex items-center gap-8 p-10 bg-brand-primary/5 border-brand-primary/10"
                    >
                        <div className="w-16 h-16 rounded-md bg-brand-primary flex items-center justify-center shrink-0">
                            <Zap className="w-8 h-8 text-white fill-current" />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-brand-primary uppercase tracking-widest mb-1">XP EARNED</p>
                            <h3 className="text-4xl font-bold text-text-primary tracking-tighter">+{result.xp_earned}</h3>
                            <div className="mt-4 flex items-center gap-2">
                                <div className="h-1.5 flex-1 bg-light-bg dark:bg-dark-border rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: "65%" }}
                                        className="h-full bg-brand-primary"
                                    />
                                </div>
                                <span className="text-[10px] font-bold text-text-secondary uppercase">Level 12</span>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="grid grid-cols-2 gap-4"
                    >
                        {[
                            { label: "Correct Answers", value: result.correct_count, icon: CheckCircle, color: "text-brand-primary", bg: "bg-brand-primary/5 border-brand-primary/10" },
                            { label: "Points Scored", value: `${Math.round(result.score)}`, icon: BarChart3, color: "text-brand-secondary", bg: "bg-brand-secondary/5 border-brand-secondary/10" },
                        ].map((stat, i) => (
                            <div key={i} className={`card flex flex-col items-center justify-center p-6 border ${stat.bg}`}>
                                <stat.icon className={`w-8 h-8 ${stat.color} mb-3`} />
                                <span className="text-3xl font-bold text-text-primary tracking-tight">{stat.value}</span>
                                <span className="text-[10px] font-bold text-text-secondary uppercase tracking-widest mt-1">{stat.label}</span>
                            </div>
                        ))}
                    </motion.div>
                </div>

                {/* Question Review */}
                <div className="space-y-8">
                    <div className="flex items-center justify-between border-b border-border-color pb-6">
                        <h3 className="text-2xl font-bold text-text-primary tracking-tight leading-none uppercase tracking-wider">Performance Audit</h3>
                        <div className="flex gap-4">
                            <div className="flex items-center gap-2 text-[10px] font-bold text-text-secondary uppercase tracking-widest">
                                <div className="w-2 rounded-full h-2 bg-brand-primary" /> Optimal
                            </div>
                            <div className="flex items-center gap-2 text-[10px] font-bold text-text-secondary uppercase tracking-widest">
                                <div className="w-2 rounded-full h-2 bg-red-500" /> Critical
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {(result.answers || []).map((a, i) => {
                            const isCorrect = a.is_correct;
                            const isUnattempted = !a.selected_option;
                            const isExpanded = expandedQ === a.question_id;

                            return (
                                <motion.div
                                    key={a.question_id}
                                    layout
                                    className={`card p-0 overflow-hidden border transition-all duration-300 ${isExpanded ? "border-brand-primary/30 shadow-md" : "border-border-color hover:border-brand-primary/20"
                                        }`}
                                >
                                    <button
                                        onClick={() => setExpandedQ(isExpanded ? null : a.question_id)}
                                        className="w-full text-left p-8 flex items-start gap-6 relative"
                                    >
                                        <div className={`w-10 h-10 rounded-md flex items-center justify-center shrink-0 ${isCorrect ? "bg-brand-primary text-white" : "bg-red-500 text-white"
                                            }`}>
                                            {isCorrect ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                                        </div>
                                        <div className="flex-1 min-w-0 pr-8">
                                            <p className="text-lg font-bold text-text-primary leading-tight mb-2 pr-4">{a.question_text}</p>
                                            <div className="flex gap-3 items-center">
                                                <div className="px-3 py-0.5 bg-light-bg dark:bg-dark-border rounded-md border border-border-color text-[9px] font-bold uppercase text-brand-primary tracking-wider">
                                                    Correct: {a.correct_option?.toUpperCase()}
                                                </div>
                                                {!isCorrect && (
                                                    <div className="px-3 py-0.5 bg-light-bg dark:bg-dark-border rounded-md border border-border-color text-[9px] font-bold uppercase text-red-500 tracking-wider">
                                                        Selected: {a.selected_option?.toUpperCase() || 'NA'}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="absolute top-8 right-8 text-text-secondary opacity-30">
                                            {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                                        </div>
                                    </button>

                                    <AnimatePresence>
                                        {isExpanded && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: "auto", opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                className="bg-bg-color/50 border-t border-border-color px-8 py-10 space-y-8"
                                            >
                                                {/* Options Visualization */}
                                                <div className="grid md:grid-cols-2 gap-4">
                                                    {["a", "b", "c", "d"].map(opt => {
                                                        const isOptCorrect = a.correct_option === opt;
                                                        const isOptSelected = a.selected_option === opt;
                                                        return (
                                                            <div key={opt} className={`p-4 rounded-md border flex items-center gap-4 ${isOptCorrect
                                                                ? "bg-brand-primary/10 border-brand-primary/30 text-brand-primary"
                                                                : isOptSelected
                                                                    ? "bg-red-500/10 border-red-500/30 text-red-500"
                                                                    : "bg-surface-color/50 border-border-color/50 text-text-secondary"
                                                                }`}>
                                                                <span className="w-7 h-7 rounded bg-white dark:bg-slate-800 flex items-center justify-center font-bold text-xs shrink-0 border border-border-color">{opt.toUpperCase()}</span>
                                                                <span className="text-sm font-bold tracking-tight">{a[`option_${opt}`]}</span>
                                                            </div>
                                                        );
                                                    })}
                                                </div>

                                                {/* AI Insight section */}
                                                <div className="space-y-6">
                                                    {(a.explanation || explanations[a.question_id]) && (
                                                        <div className="card bg-brand-primary/5 border-brand-primary/10 p-8">
                                                            <div className="flex items-center gap-3 mb-4">
                                                                <Lightbulb className="w-5 h-5 text-yellow-500" />
                                                                <h4 className="text-[10px] font-bold text-brand-primary uppercase tracking-widest">Pedagogical Insight</h4>
                                                            </div>
                                                            <p className="text-text-primary text-sm font-medium leading-relaxed">
                                                                {a.explanation || explanations[a.question_id]}
                                                            </p>
                                                        </div>
                                                    )}

                                                    {!isCorrect && !explanations[a.question_id] && (
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); getExplanation(a); }}
                                                            disabled={explainLoading[a.question_id]}
                                                            className="btn-secondary w-full flex items-center justify-center gap-3 py-4 text-xs group"
                                                        >
                                                            <Lightbulb className="w-4 h-4 text-yellow-500 group-hover:scale-110 transition-transform" />
                                                            {explainLoading[a.question_id] ? "De-coding performance..." : "Generate AI Deep-Dive"}
                                                        </button>
                                                    )}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>

                {/* Action Hub */}
                <div className="grid md:grid-cols-3 gap-6">
                    <Link to="/student" className="btn-secondary flex items-center justify-center gap-3 py-5 text-xs">
                        <Home className="w-4 h-4" /> Lab Center
                    </Link>
                    <Link to={`/student/quiz/${result.quiz_id}/attempt`} className="btn-secondary flex items-center justify-center gap-3 py-5 text-xs text-brand-secondary border-brand-secondary/30 hover:bg-brand-secondary/5">
                        <RotateCcw className="w-4 h-4" /> Reset Challenge
                    </Link>
                    <Link to="/student/analytics" className="btn-primary flex items-center justify-center gap-3 py-5 text-xs shadow-soft">
                        <BarChart3 className="w-4 h-4" /> Strategy Analytics
                    </Link>
                </div>
            </div>
        </div>
    );
}
