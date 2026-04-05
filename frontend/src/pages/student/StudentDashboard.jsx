import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import DashboardLayout from "../../components/DashboardLayout";
import StatCard from "../../components/StatCard";
import { quizzesAPI, usersAPI, attemptsAPI } from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import { usePlatform } from "../../context/PlatformContext";
import { motion } from "framer-motion";
import {
    BookOpen, Trophy, Zap, Star, Clock,
    CheckCircle, ArrowRight, TrendingUp, Calendar, AlertCircle, Flame,
    Radio, IdCard, Hash, Building2, MapPin
} from "lucide-react";

const PERF_COLORS = {
    "Smart": "text-green-600 bg-green-50 border-green-200",
    "Good": "text-brand-secondary bg-brand-surface border-brand-primary/20",
    "Average": "text-yellow-600 bg-yellow-50 border-yellow-200",
    "Weak": "text-orange-600 bg-orange-50 border-orange-200",
    "Poor": "text-red-600 bg-red-50 border-red-200",
};

const DIFF_COLORS = {
    easy: "text-green-600 bg-green-50 border-green-200",
    medium: "text-yellow-600 bg-yellow-50 border-yellow-200",
    hard: "text-red-600 bg-red-50 border-red-200"
};

export default function StudentDashboard() {
    const { user } = useAuth();
    const { studentAnalyticsEnabled } = usePlatform();
    const [quizzes, setQuizzes] = useState([]);
    const [leaderboard, setLeaderboard] = useState([]);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([
            quizzesAPI.list({ published_only: true }).then(r => setQuizzes(r.data)),
            usersAPI.leaderboard(10).then(r => setLeaderboard(r.data)),
            attemptsAPI.history().then(r => setHistory(r.data)),
        ]).finally(() => setLoading(false));
    }, []);

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
                {/* Welcome & XP Progress */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="relative overflow-hidden group rounded-[2.5rem] bg-gradient-to-br from-brand-primary to-brand-secondary p-1 shadow-soft"
                >
                    <div className="bg-surface-color/90 backdrop-blur-3xl rounded-[2.3rem] p-10 flex flex-col lg:flex-row items-center gap-10">
                        <div className="relative group/avatar">
                            <div className="w-24 h-24 rounded-3xl bg-brand-primary flex items-center justify-center text-4xl font-black text-white shadow-sm group-hover/avatar:rotate-6 transition-transform duration-300">
                                {user?.full_name?.[0]?.toUpperCase()}
                            </div>
                            <div className="absolute -bottom-2 -right-2 bg-yellow-400 text-dark-bg p-1.5 rounded-xl shadow-lg">
                                <Trophy className="w-5 h-5 fill-current border-none" />
                            </div>
                        </div>

                        <div className="flex-1 text-center lg:text-left">
                            <h2 className="text-4xl font-black text-text-primary mb-2 tracking-tight">
                                Hey, {user?.full_name?.split(" ")[0]}!
                            </h2>
                            <p className="text-text-secondary font-medium text-lg">
                                You're on a <span className="text-brand-primary font-black">5 day streak</span>. Keep it up! <Flame className="w-5 h-5 inline-block text-brand-primary mb-1" />
                            </p>

                            <div className="mt-8">
                                <div className="flex items-center justify-between mb-3 px-1 text-[11px] font-black uppercase tracking-widest text-text-secondary">
                                    <span>Level {user?.level || 1} Progress</span>
                                    <span className="text-brand-primary">{user?.xp_points % 100}/100 XP</span>
                                </div>
                                <div className="h-4 bg-bg-color rounded-full border border-border-color overflow-hidden p-0.5">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${Math.min(100, (user?.xp_points || 0) % 100)}%` }}
                                        transition={{ duration: 1, ease: "circOut" }}
                                        className="h-full rounded-full bg-gradient-to-r from-brand-primary to-brand-secondary shadow-sm"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="hidden lg:flex flex-col items-center justify-center p-8 bg-brand-primary/5 rounded-[2rem] border border-brand-primary/10">
                            <Star className="w-10 h-10 text-yellow-500 fill-yellow-500 mb-2" />
                            <span className="text-3xl font-black text-brand-primary">{user?.xp_points || 0}</span>
                            <span className="text-[10px] font-black text-text-secondary uppercase tracking-[0.2em] mt-1">Total XP</span>
                        </div>
                    </div>
                </motion.div>

                <div className="rounded-2xl border border-border-color bg-gradient-to-r from-bg-color via-surface-color to-brand-primary/5 p-6 flex flex-col lg:flex-row lg:items-center gap-6">
                    <div className="flex-1 space-y-3">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-secondary">Your event identity</p>
                        <div className="flex flex-wrap gap-4">
                            <div className="flex items-center gap-2 min-w-[200px]">
                                <IdCard className="w-5 h-5 text-brand-primary shrink-0" />
                                <div>
                                    <p className="text-[10px] font-bold text-text-secondary uppercase">Registration ID</p>
                                    <p className="font-mono font-black text-text-primary text-lg">{user?.registration_id || "—"}</p>
                                    <p className="text-[10px] text-text-secondary">Used to log in</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 min-w-[200px]">
                                <Hash className="w-5 h-5 text-amber-500 shrink-0" />
                                <div>
                                    <p className="text-[10px] font-bold text-text-secondary uppercase">Participant code</p>
                                    <p className="font-mono font-black text-amber-600 dark:text-amber-400 text-lg tracking-wider">
                                        {user?.participant_code || "—"}
                                    </p>
                                    <p className="text-[10px] text-text-secondary">Desk check-in &amp; result sheets</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm text-text-secondary border-t lg:border-t-0 lg:border-l border-border-color pt-4 lg:pt-0 lg:pl-8">
                        <div className="flex items-start gap-2 max-w-md">
                            <Building2 className="w-4 h-4 mt-0.5 text-brand-secondary shrink-0" />
                            <div>
                                <p className="font-bold text-text-primary">{user?.institution_name || "Add institution in profile"}</p>
                                <p className="text-xs flex items-center gap-1 mt-0.5">
                                    <MapPin className="w-3 h-3" />
                                    {[user?.state_region, user?.college_area].filter(Boolean).join(" · ") || "State / area — edit profile if missing"}
                                </p>
                                <p className="text-xs mt-1">Stream: <span className="font-semibold text-text-primary">{user?.stream || "—"}</span></p>
                                {user?.competition_category && (
                                    <p className="text-[10px] mt-1 font-semibold text-brand-primary">{user.competition_category}</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard
                        icon={Zap}
                        title="Experience"
                        value={user?.xp_points || 0}
                        trend="+120 this week"
                        color="brand-primary"
                    />
                    <StatCard
                        icon={CheckCircle}
                        title="Completed"
                        value={history.length}
                        trend="+3 today"
                        color="brand-secondary"
                    />
                    <StatCard
                        icon={TrendingUp}
                        title="Avg. Progress"
                        value={history.length > 0 ? `${Math.round(history.reduce((a, h) => a + (h.percentage || 0), 0) / history.length)}%` : "0%"}
                        trend="Top 15%"
                        color="brand-dark"
                    />
                    <StatCard
                        icon={Calendar}
                        title="Day Streak"
                        value="5 Days"
                        trend="Personal Best"
                        color="brand-secondary"
                    />
                </div>

                {/* ── Live Quizzes Section ────────────────────────────── */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="relative flex items-center justify-center">
                                <span className="absolute inline-flex h-4 w-4 rounded-full bg-red-500 opacity-75 animate-ping" />
                                <span className="relative inline-flex h-3 w-3 rounded-full bg-red-500" />
                            </div>
                            <h3 className="text-2xl font-black text-text-primary tracking-tight">Live Quizzes</h3>
                        </div>
                        {quizzes.length > 0 && (
                            <span className="text-xs font-bold text-brand-primary uppercase tracking-widest">
                                {quizzes.length} Active
                            </span>
                        )}
                    </div>

                    {loading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="h-40 rounded-[2rem] bg-surface-color animate-pulse border border-border-color" />
                            ))}
                        </div>
                    ) : quizzes.length === 0 ? (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="card-premium flex flex-col items-center justify-center py-16 text-center"
                        >
                            <div className="w-16 h-16 rounded-2xl bg-brand-primary/10 flex items-center justify-center mb-5">
                                <Radio className="w-8 h-8 text-brand-primary" />
                            </div>
                            <p className="text-text-primary font-black text-lg mb-2">No live quizzes available right now</p>
                            <p className="text-text-secondary text-sm font-medium max-w-sm">
                                Your teachers haven't published any quizzes yet. Check back soon for new challenges!
                            </p>
                        </motion.div>
                    ) : (
                        <motion.div
                            variants={containerVariants}
                            initial="hidden"
                            animate="visible"
                            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                        >
                            {quizzes.map(quiz => (
                                <motion.div
                                    key={quiz.id}
                                    variants={itemVariants}
                                    className="card-premium relative overflow-hidden group cursor-pointer hover:border-brand-primary/50 transition-all duration-300"
                                >
                                    {/* Live badge */}
                                    <div className="absolute top-4 right-4 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/10 border border-red-500/20">
                                        <span className="relative flex h-2 w-2">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
                                        </span>
                                        <span className="text-[10px] font-black text-red-500 uppercase tracking-widest">Live</span>
                                    </div>

                                    <div className="p-3.5 rounded-2xl bg-brand-primary/10 text-brand-primary w-fit mb-5 group-hover:bg-brand-primary group-hover:text-white transition-all duration-300">
                                        <BookOpen className="w-6 h-6" />
                                    </div>

                                    <h4 className="text-lg font-black text-text-primary mb-1.5 line-clamp-1 leading-tight group-hover:text-brand-primary transition-colors pr-16">
                                        {quiz.title}
                                    </h4>
                                    <p className="text-text-secondary text-sm font-medium mb-5">
                                        {quiz.subject || "General Knowledge"}
                                    </p>

                                    <div className="flex items-center justify-between pt-4 border-t border-border-color/50">
                                        <div className="flex items-center gap-4">
                                            <div className="flex items-center gap-1.5 text-text-secondary">
                                                <Clock className="w-4 h-4" />
                                                <span className="text-xs font-black uppercase tracking-widest">{quiz.duration_minutes}m</span>
                                            </div>
                                            <div className={`px-2.5 py-0.5 text-[10px] font-black uppercase tracking-widest rounded-full border ${DIFF_COLORS[quiz.difficulty]}`}>
                                                {quiz.difficulty}
                                            </div>
                                        </div>
                                        <Link to={`/student/quiz/${quiz.id}/attempt`}
                                            className="w-9 h-9 rounded-xl bg-brand-primary text-white flex items-center justify-center hover:bg-brand-secondary transition-all duration-300 shadow-sm">
                                            <ArrowRight className="w-4 h-4" />
                                        </Link>
                                    </div>
                                </motion.div>
                            ))}
                        </motion.div>
                    )}
                </div>

                <div className="grid lg:grid-cols-3 gap-10">
                    {/* Available Quizzes Feed */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-2xl font-black text-text-primary tracking-tight">Discover Challenges</h3>
                            <button className="text-xs font-bold text-brand-primary uppercase tracking-widest hover:underline">View All</button>
                        </div>

                        {loading ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {[1, 2, 3, 4].map(i => (
                                    <div key={i} className="h-48 rounded-[2rem] bg-surface-color animate-pulse border border-border-color" />
                                ))}
                            </div>
                        ) : quizzes.length === 0 ? (
                            <div className="card-premium flex flex-col items-center justify-center py-20 text-center">
                                <AlertCircle className="w-12 h-12 text-text-secondary mb-4" />
                                <p className="text-text-secondary font-black text-lg">No active quizzes found.</p>
                                <p className="text-text-secondary opacity-60 text-sm mt-1">Check back later for new challenges!</p>
                            </div>
                        ) : (
                            <motion.div
                                variants={containerVariants}
                                initial="hidden"
                                animate="visible"
                                className="grid grid-cols-1 md:grid-cols-2 gap-6"
                            >
                                {quizzes.map(quiz => (
                                    <motion.div
                                        key={quiz.id}
                                        variants={itemVariants}
                                        className="card-premium h-full flex flex-col justify-between group cursor-pointer hover:border-brand-primary/50"
                                    >
                                        <div>
                                            <div className="flex justify-between items-start mb-6">
                                                <div className="p-3.5 rounded-2xl bg-brand-primary/10 text-brand-primary group-hover:bg-brand-primary group-hover:text-white transition-all duration-300">
                                                    <BookOpen className="w-6 h-6" />
                                                </div>
                                                <div className={`px-3 py-1 transparent-badge text-[10px] font-black uppercase tracking-widest rounded-full border ${DIFF_COLORS[quiz.difficulty]}`}>
                                                    {quiz.difficulty}
                                                </div>
                                            </div>
                                            <h4 className="text-xl font-black text-text-primary mb-2 line-clamp-1 leading-tight group-hover:text-brand-primary transition-colors">{quiz.title}</h4>
                                            <p className="text-text-secondary text-sm font-medium mb-6">{quiz.subject || "General Knowledge"}</p>
                                        </div>

                                        <div className="flex items-center justify-between mt-auto pt-6 border-t border-border-color/50">
                                            <div className="flex items-center gap-2 text-text-secondary">
                                                <Clock className="w-4 h-4" />
                                                <span className="text-xs font-black uppercase tracking-widest">{quiz.duration_minutes}m</span>
                                            </div>
                                            <Link to={`/student/quiz/${quiz.id}/attempt`}
                                                className="w-10 h-10 rounded-xl bg-bg-color border border-border-color flex items-center justify-center text-text-primary hover:bg-brand-primary hover:text-white hover:border-brand-primary transition-all duration-300">
                                                <ArrowRight className="w-5 h-5" />
                                            </Link>
                                        </div>
                                    </motion.div>
                                ))}
                            </motion.div>
                        )}
                    </div>

                    {/* Secondary Panel: Leaderboard & Activity */}
                    <div className="space-y-10">
                        {/* High-End Leaderboard */}
                        <div className="space-y-6">
                            <h3 className="text-2xl font-black text-text-primary tracking-tight">Top Rankers</h3>
                            <div className="card-premium space-y-4 p-4">
                                {leaderboard.slice(0, 5).map((u, i) => (
                                    <div key={u.id} className={`flex items-center gap-4 p-3 rounded-2xl transition-all ${u.email === user?.email ? "bg-brand-primary/10 border border-brand-primary/20" : "hover:bg-bg-color/50"
                                        }`}>
                                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-black shrink-0 shadow-sm ${i === 0 ? "bg-yellow-400 text-dark-bg" :
                                                i === 1 ? "bg-gray-300 text-dark-bg" :
                                                    i === 2 ? "bg-brand-secondary text-white" :
                                                        "bg-bg-color text-text-secondary"
                                            }`}>
                                            #{i + 1}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-black text-text-primary truncate">{u.full_name}</p>
                                            <p className="text-[10px] font-black text-text-secondary uppercase tracking-widest mt-0.5">Lvl {u.level}</p>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-xs font-black text-brand-primary tracking-tight">{u.xp_points} XP</span>
                                        </div>
                                    </div>
                                ))}
                                <button className="w-full py-3 text-[10px] font-black uppercase tracking-[0.2em] text-text-secondary hover:text-brand-primary transition-colors border-t border-border-color/50 pt-6 mt-2">
                                    Show Global Rankings
                                </button>
                            </div>
                        </div>

                        {/* Recent Activity List */}
                        {history.length > 0 && (
                            <div className="space-y-6">
                                <h3 className="text-2xl font-black text-text-primary tracking-tight">Recent Activity</h3>
                                <div className="space-y-4">
                                    {history.slice(0, 3).map(a => (
                                        <div key={a.attempt_id} className="card-premium flex items-center justify-between p-4 group cursor-pointer hover:border-brand-primary/50">
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-black text-text-primary truncate group-hover:text-brand-primary transition-colors">{a.quiz_title}</p>
                                                <p className="text-[10px] font-black text-text-secondary uppercase tracking-widest mt-1 opacity-60">
                                                    {new Date(a.submitted_at).toLocaleDateString()}
                                                </p>
                                            </div>
                                            <div className={`ml-4 px-3 py-1.5 rounded-xl border font-black text-[10px] uppercase tracking-widest ${PERF_COLORS[a.performance_category] || "border-border-color text-text-secondary"
                                                }`}>
                                                {a.percentage?.toFixed(0)}%
                                            </div>
                                        </div>
                                    ))}
                                    {studentAnalyticsEnabled && (
                                        <Link to="/student/analytics" className="btn-secondary w-full py-3.5 text-xs">
                                            View Full Analytics
                                        </Link>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
