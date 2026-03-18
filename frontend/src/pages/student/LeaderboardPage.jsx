import { useState, useEffect } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import { usersAPI } from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import { motion } from "framer-motion";
import { Trophy, Medal, Zap, Crown, TrendingUp } from "lucide-react";

const RANK_STYLES = [
    { bg: "bg-brand-gold", text: "text-dark-bg", shadow: "shadow-[0_0_20px_rgba(251,191,36,0.4)]", icon: <Crown className="w-4 h-4" /> },
    { bg: "bg-gray-300",   text: "text-dark-bg", shadow: "shadow-[0_0_12px_rgba(209,213,219,0.3)]", icon: <Medal className="w-4 h-4" /> },
    { bg: "bg-brand-indigo", text: "text-white", shadow: "shadow-[0_0_12px_rgba(99,102,241,0.3)]", icon: <Medal className="w-4 h-4" /> },
];

export default function LeaderboardPage() {
    const { user } = useAuth();
    const [leaderboard, setLeaderboard] = useState([]);
    const [loading, setLoading] = useState(true);
    const [limit, setLimit] = useState(20);

    useEffect(() => {
        setLoading(true);
        usersAPI.leaderboard(limit)
            .then(r => setLeaderboard(r.data))
            .catch(() => setLeaderboard([]))
            .finally(() => setLoading(false));
    }, [limit]);

    const myRank = leaderboard.findIndex(u => u.email === user?.email) + 1;
    const myEntry = leaderboard.find(u => u.email === user?.email);

    return (
        <DashboardLayout>
            <div className="max-w-3xl mx-auto space-y-8 pb-12">

                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center"
                >
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-brand-gold/10 border border-brand-gold/20 mb-4">
                        <Trophy className="w-8 h-8 text-brand-gold fill-brand-gold" />
                    </div>
                    <h1 className="text-4xl font-black text-text-primary tracking-tight">Global Rankings</h1>
                    <p className="text-text-secondary mt-2 font-medium">Top students ranked by XP points earned</p>
                </motion.div>

                {/* My Rank Card (if on leaderboard) */}
                {myEntry && myRank > 0 && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.97 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-brand-violet via-brand-indigo to-brand-cyan p-[1px] shadow-2xl shadow-brand-violet/20"
                    >
                        <div className="bg-surface-color/95 backdrop-blur-2xl rounded-[1.9rem] p-6 flex items-center gap-5">
                            <div className="w-14 h-14 rounded-2xl bg-brand-violet flex items-center justify-center text-2xl font-black text-white shadow-neon">
                                {user?.full_name?.[0]?.toUpperCase()}
                            </div>
                            <div className="flex-1">
                                <p className="text-xs font-black text-text-secondary uppercase tracking-widest mb-0.5">Your Position</p>
                                <p className="text-xl font-black text-text-primary">{user?.full_name}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-3xl font-black text-brand-violet">#{myRank}</p>
                                <p className="text-xs font-black text-text-secondary uppercase tracking-widest mt-0.5">{myEntry.xp_points} XP</p>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Podium — Top 3 */}
                {!loading && leaderboard.length >= 3 && (
                    <div className="flex items-end justify-center gap-4 py-4">
                        {/* 2nd place */}
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.15 }}
                            className="flex flex-col items-center gap-3 w-28"
                        >
                            <div className="w-14 h-14 rounded-2xl bg-gray-300/10 border border-gray-300/20 flex items-center justify-center text-2xl font-black text-text-primary">
                                {leaderboard[1]?.full_name?.[0]?.toUpperCase()}
                            </div>
                            <div className="text-center">
                                <p className="text-sm font-black text-text-primary truncate w-28 text-center">{leaderboard[1]?.full_name}</p>
                                <p className="text-xs text-text-secondary font-bold">{leaderboard[1]?.xp_points} XP</p>
                            </div>
                            <div className="w-full h-20 bg-gray-400/20 rounded-t-2xl border border-gray-300/20 flex items-center justify-center">
                                <span className="text-2xl font-black text-gray-400">#2</span>
                            </div>
                        </motion.div>

                        {/* 1st place */}
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.05 }}
                            className="flex flex-col items-center gap-3 w-32"
                        >
                            <Crown className="w-6 h-6 text-brand-gold fill-brand-gold" />
                            <div className="w-16 h-16 rounded-2xl bg-brand-gold/10 border border-brand-gold/30 flex items-center justify-center text-3xl font-black text-text-primary shadow-[0_0_20px_rgba(251,191,36,0.3)]">
                                {leaderboard[0]?.full_name?.[0]?.toUpperCase()}
                            </div>
                            <div className="text-center">
                                <p className="text-sm font-black text-text-primary truncate w-32 text-center">{leaderboard[0]?.full_name}</p>
                                <p className="text-xs text-brand-gold font-black">{leaderboard[0]?.xp_points} XP</p>
                            </div>
                            <div className="w-full h-28 bg-brand-gold/10 rounded-t-2xl border border-brand-gold/20 flex items-center justify-center">
                                <span className="text-3xl font-black text-brand-gold">#1</span>
                            </div>
                        </motion.div>

                        {/* 3rd place */}
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.25 }}
                            className="flex flex-col items-center gap-3 w-28"
                        >
                            <div className="w-14 h-14 rounded-2xl bg-brand-indigo/10 border border-brand-indigo/20 flex items-center justify-center text-2xl font-black text-text-primary">
                                {leaderboard[2]?.full_name?.[0]?.toUpperCase()}
                            </div>
                            <div className="text-center">
                                <p className="text-sm font-black text-text-primary truncate w-28 text-center">{leaderboard[2]?.full_name}</p>
                                <p className="text-xs text-text-secondary font-bold">{leaderboard[2]?.xp_points} XP</p>
                            </div>
                            <div className="w-full h-14 bg-brand-indigo/10 rounded-t-2xl border border-brand-indigo/20 flex items-center justify-center">
                                <span className="text-2xl font-black text-brand-indigo">#3</span>
                            </div>
                        </motion.div>
                    </div>
                )}

                {/* Full List */}
                <div className="card-premium p-2 space-y-1">
                    {loading ? (
                        <div className="space-y-3 p-4">
                            {[...Array(8)].map((_, i) => (
                                <div key={i} className="h-16 rounded-2xl bg-bg-color animate-pulse border border-border-color" />
                            ))}
                        </div>
                    ) : leaderboard.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center">
                            <TrendingUp className="w-12 h-12 text-text-secondary mb-4" />
                            <p className="text-text-secondary font-black text-lg">No students yet.</p>
                            <p className="text-text-secondary opacity-60 text-sm mt-1">Complete a quiz to appear here!</p>
                        </div>
                    ) : (
                        leaderboard.map((u, i) => {
                            const isMe = u.email === user?.email;
                            const rank = i + 1;
                            const rankStyle = RANK_STYLES[i] || null;

                            return (
                                <motion.div
                                    key={u.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.04 }}
                                    className={`flex items-center gap-4 p-4 rounded-2xl transition-all ${
                                        isMe
                                            ? "bg-brand-violet/10 border border-brand-violet/30"
                                            : "hover:bg-bg-color/60"
                                    }`}
                                >
                                    {/* Rank badge */}
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm shrink-0 ${
                                        rankStyle
                                            ? `${rankStyle.bg} ${rankStyle.text} ${rankStyle.shadow}`
                                            : "bg-bg-color text-text-secondary border border-border-color"
                                    }`}>
                                        {rankStyle ? rankStyle.icon : `#${rank}`}
                                    </div>

                                    {/* Avatar */}
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg font-black shrink-0 ${
                                        isMe ? "bg-brand-violet text-white shadow-neon" : "bg-surface-color border border-border-color text-text-primary"
                                    }`}>
                                        {u.full_name?.[0]?.toUpperCase()}
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <p className={`font-black text-sm truncate ${isMe ? "text-brand-violet" : "text-text-primary"}`}>
                                            {u.full_name} {isMe && <span className="text-[10px] font-black text-brand-violet/60 uppercase tracking-widest ml-1">(You)</span>}
                                        </p>
                                        <p className="text-[10px] font-black text-text-secondary uppercase tracking-widest mt-0.5">
                                            Level {u.level} · {u.streak_days} day streak
                                        </p>
                                    </div>

                                    {/* XP */}
                                    <div className="flex items-center gap-1.5 shrink-0">
                                        <Zap className="w-3.5 h-3.5 text-brand-violet fill-brand-violet" />
                                        <span className={`font-black text-sm tabular-nums ${isMe ? "text-brand-violet" : "text-text-primary"}`}>
                                            {u.xp_points.toLocaleString()}
                                        </span>
                                        <span className="text-[10px] font-black text-text-secondary uppercase tracking-widest">XP</span>
                                    </div>
                                </motion.div>
                            );
                        })
                    )}
                </div>

                {/* Load More */}
                {!loading && leaderboard.length >= limit && (
                    <button
                        onClick={() => setLimit(l => l + 20)}
                        className="btn-secondary w-full py-4 text-xs uppercase tracking-widest font-black"
                    >
                        Load More
                    </button>
                )}
            </div>
        </DashboardLayout>
    );
}
