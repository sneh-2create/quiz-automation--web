import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/DashboardLayout";
import StatCard from "../../components/StatCard";
import { quizzesAPI, analyticsAPI } from "../../api/client";
import { motion } from "framer-motion";
import {
    Plus, BookOpen, Users, BarChart2, Eye,
    Trash2, Globe, Lock, Edit, MoreHorizontal,
    TrendingUp, ShieldCheck, Share2, Layers, Clock
} from "lucide-react";
import toast from "react-hot-toast";

const DIFF_COLORS = {
    easy: "text-green-500 bg-green-500/10 border-green-500/20",
    medium: "text-yellow-500 bg-yellow-500/10 border-yellow-500/20",
    hard: "text-red-500 bg-red-500/10 border-red-500/20"
};

export default function TeacherDashboard() {
    const [quizzes, setQuizzes] = useState([]);
    const [overview, setOverview] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        Promise.all([
            quizzesAPI.list().then(r => setQuizzes(r.data)),
            analyticsAPI.teacherOverview().then(r => setOverview(r.data)),
        ]).finally(() => setLoading(false));
    }, []);

    const publishToggle = async (quiz) => {
        await quizzesAPI.publish(quiz.id);
        toast.success(quiz.is_published ? "Quiz unpublished" : "Quiz published! 🚀");
        quizzesAPI.list().then(r => setQuizzes(r.data));
    };

    const deleteQuiz = async (id) => {
        if (!confirm("Delete this quiz?")) return;
        await quizzesAPI.delete(id);
        toast.success("Quiz deleted");
        setQuizzes(prev => prev.filter(q => q.id !== id));
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
    };

    return (
        <DashboardLayout>
            <div className="space-y-10 pb-12">
                {/* Header & Quick Action */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h2 className="text-4xl font-black text-text-primary tracking-tight leading-none mb-2">Quiz Lab</h2>
                        <p className="text-text-secondary font-medium">Manage your assessments and track student progress.</p>
                    </div>
                    <Link to="/teacher/quiz/create" className="btn-primary flex items-center gap-3 px-6 py-4 rounded-md shadow-sm transition-transform hover:scale-105 active:scale-95">
                        <Plus className="w-5 h-5 flex-shrink-0" />
                        <span className="font-bold text-sm uppercase tracking-widest leading-none">Create New Quiz</span>
                    </Link>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard
                        icon={Layers}
                        title="Total Quizzes"
                        value={overview?.total_quizzes ?? 0}
                        trend="+2 this month"
                        color="brand-primary"
                    />
                    <StatCard
                        icon={ShieldCheck}
                        title="Published"
                        value={overview?.published_quizzes ?? 0}
                        trend="80% Live"
                        color="brand-secondary"
                    />
                    <StatCard
                        icon={Users}
                        title="Student Attempts"
                        value={overview?.total_attempts ?? 0}
                        trend="+42% growth"
                        color="green-500"
                    />
                    <StatCard
                        icon={TrendingUp}
                        title="Avg Pass Rate"
                        value="74%"
                        trend="Improving"
                        color="yellow-400"
                    />
                </div>

                {/* Content Section */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between border-b border-border-color pb-6">
                        <h3 className="text-2xl font-black text-text-primary tracking-tight">Your Assessments</h3>
                        <div className="flex items-center gap-4">
                            <button className="text-[10px] font-bold uppercase tracking-[0.2em] text-text-secondary hover:text-brand-primary px-3 py-1.5 rounded-md hover:bg-brand-primary/5 transition-all">All</button>
                            <button className="text-[10px] font-bold uppercase tracking-[0.2em] text-text-secondary hover:text-brand-primary px-3 py-1.5 rounded-md hover:bg-brand-primary/5 transition-all">Live</button>
                            <button className="text-[10px] font-bold uppercase tracking-[0.2em] text-text-secondary hover:text-brand-primary px-3 py-1.5 rounded-md hover:bg-brand-primary/5 transition-all">Drafts</button>
                        </div>
                    </div>

                    {loading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="h-64 rounded-md bg-surface-color animate-pulse border border-border-color" />
                            ))}
                        </div>
                    ) : quizzes.length === 0 ? (
                        <div className="card-premium flex flex-col items-center justify-center py-24 text-center">
                            <BookOpen className="w-16 h-16 text-text-secondary opacity-40 mb-4" />
                            <h4 className="text-xl font-black text-text-primary">No quizzes yet</h4>
                            <p className="text-text-secondary font-medium mt-2 mb-8">Ready to create your first assessment challenge?</p>
                            <Link to="/teacher/quiz/create" className="btn-secondary px-8 py-4 text-xs">
                                Jump to Designer
                            </Link>
                        </div>
                    ) : (
                        <motion.div
                            variants={containerVariants}
                            initial="hidden"
                            animate="visible"
                            className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
                        >
                            {quizzes.map(quiz => (
                                <motion.div
                                    key={quiz.id}
                                    variants={itemVariants}
                                    className="card p-0 flex flex-col group overflow-hidden border-t-4 border-t-brand-primary shadow-md hover:shadow-lg transition-shadow"
                                >
                                    {/* Header Section */}
                                    <div className="p-8 pb-0">
                                        <div className="flex justify-between items-start mb-6">
                                            <div className="flex items-center gap-2">
                                                <div className={`w-2.5 h-2.5 rounded-full ${quiz.is_published ? "bg-green-600" : "bg-yellow-500"}`} />
                                                <span className={`text-[10px] font-bold uppercase tracking-widest ${quiz.is_published ? "text-green-600" : "text-yellow-500"}`}>
                                                    {quiz.is_published ? "Live" : "Draft"}
                                                </span>
                                            </div>
                                            <button className="text-text-secondary hover:text-brand-primary transition-colors">
                                                <MoreHorizontal className="w-5 h-5" />
                                            </button>
                                        </div>

                                        <h4 className="text-2xl font-black text-text-primary mb-2 line-clamp-1 leading-tight group-hover:text-brand-primary transition-colors">{quiz.title}</h4>
                                        <p className="text-text-secondary text-sm font-medium h-5 mb-6">{quiz.subject || "No Subject"}</p>

                                        <div className="flex flex-wrap gap-2 mb-8">
                                            <span className={`px-2.5 py-0.5 rounded border text-[10px] font-bold uppercase tracking-widest ${DIFF_COLORS[quiz.difficulty] || "border-border-color text-text-secondary"}`}>
                                                {quiz.difficulty}
                                            </span>
                                            <span className="px-2.5 py-0.5 rounded border border-border-color text-text-secondary text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5">
                                                <Clock className="w-3 h-3" />
                                                {quiz.duration_minutes}m
                                            </span>
                                        </div>
                                    </div>

                                    {/* Management Actions */}
                                    <div className="grid grid-cols-4 gap-[1px] bg-border-color/50 mt-auto border-t border-border-color/50">
                                        <button
                                            onClick={() => publishToggle(quiz)}
                                            title={quiz.is_published ? "Unpublish Quiz" : "Publish Quiz"}
                                            className="bg-surface-color py-5 flex items-center justify-center text-text-secondary hover:text-brand-primary hover:bg-brand-primary/5 transition-all duration-300"
                                        >
                                            {quiz.is_published ? <Lock className="w-5 h-5" /> : <Globe className="w-5 h-5" />}
                                        </button>
                                        <Link
                                            to={`/teacher/analytics/${quiz.id}`}
                                            title="View Analytics"
                                            className="bg-surface-color py-5 flex items-center justify-center text-text-secondary hover:text-brand-secondary hover:bg-brand-secondary/5 transition-all duration-300"
                                        >
                                            <BarChart2 className="w-5 h-5" />
                                        </Link>
                                        <Link
                                            to={`/teacher/quiz/${quiz.id}/edit`}
                                            title="Edit Quiz"
                                            className="bg-surface-color py-5 flex items-center justify-center text-text-secondary hover:text-brand-primary hover:bg-brand-primary/5 transition-all duration-300"
                                        >
                                            <Edit className="w-5 h-5" />
                                        </Link>
                                        <button
                                            onClick={() => deleteQuiz(quiz.id)}
                                            title="Delete Quiz"
                                            className="bg-surface-color py-5 flex items-center justify-center text-text-secondary hover:text-red-500 hover:bg-red-500/5 transition-all duration-300"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                </motion.div>
                            ))}
                        </motion.div>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
}
