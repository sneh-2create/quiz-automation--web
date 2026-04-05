import { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import DashboardLayout from "../../components/DashboardLayout";
import { analyticsAPI } from "../../api/client";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, LineChart, Line, Legend
} from "recharts";
import { Trophy, Target, Users, TrendingUp } from "lucide-react";

const COLORS = ["#3b82f6", "#8b5cf6", "#10b981", "#f59e0b", "#ef4444"];
const PIE_COLORS = ["#6366f1", "#a855f7", "#22c55e", "#eab308", "#f97316"];

export default function TeacherAnalyticsPage() {
    const { quizId } = useParams();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        analyticsAPI.quizStats(quizId).then(r => setData(r.data)).finally(() => setLoading(false));
    }, [quizId]);

    if (loading) return (
        <DashboardLayout>
            <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" /></div>
        </DashboardLayout>
    );

    if (!data || data.error) return (
        <DashboardLayout><div className="card text-center py-12 text-text-secondary">No analytics data yet</div></DashboardLayout>
    );

    const distData = Object.entries(data.score_distribution || {}).map(([range, count]) => ({ range, count }));
    const distPie = distData.filter((d) => d.count > 0).map((d) => ({ name: d.range, value: d.count }));
    const ao = data.answer_outcomes || { correct: 0, incorrect: 0 };
    const answerPie = [
        { name: "Correct", value: ao.correct },
        { name: "Incorrect", value: ao.incorrect },
    ].filter((d) => d.value > 0);
    const qSuccessData = (data.question_stats || []).slice(0, 10).map(q => ({
        name: q.question_text?.slice(0, 20) + "…",
        rate: q.success_rate,
    }));

    return (
        <DashboardLayout>
            <div className="space-y-6 animate-slide-up">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <h2 className="text-xl font-bold text-text-primary">{data.quiz_title} — Analytics</h2>
                    <Link to="/teacher/analytics" className="text-sm font-bold text-brand-primary hover:underline">
                        ← All analytics (streams & areas)
                    </Link>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                        { icon: Users, label: "Total Attempts", value: data.total_attempts, color: "from-brand-primary to-brand-secondary" },
                        { icon: Target, label: "Avg Score", value: `${data.average_percentage?.toFixed(1)}%`, color: "from-brand-secondary to-green-500" },
                        { icon: Trophy, label: "Highest", value: `${data.highest_score?.toFixed(1)}%`, color: "from-yellow-400 to-yellow-500" },
                        { icon: TrendingUp, label: "Pass Rate", value: `${data.pass_rate?.toFixed(1)}%`, color: "from-red-400 to-red-500" },
                    ].map(({ icon: Icon, label, value, color }) => (
                        <div key={label} className="card flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center flex-shrink-0`}>
                                <Icon className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <p className="text-xl font-bold text-text-primary">{value}</p>
                                <p className="text-xs text-text-secondary">{label}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {(distPie.length > 0 || answerPie.length > 0) && (
                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="card">
                            <h3 className="font-semibold text-text-primary mb-2">Score bands (pie)</h3>
                            <p className="text-xs text-text-secondary mb-3">Share of attempts in each range</p>
                            <ResponsiveContainer width="100%" height={220}>
                                <PieChart>
                                    <Pie
                                        data={distPie}
                                        dataKey="value"
                                        nameKey="name"
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={50}
                                        outerRadius={85}
                                        paddingAngle={2}
                                    >
                                        {distPie.map((_, i) => (
                                            <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} stroke="var(--surface-color)" strokeWidth={2} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{
                                            background: "var(--surface-color)",
                                            border: "1px solid var(--border-color)",
                                            borderRadius: "8px",
                                            color: "var(--text-primary)",
                                        }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="card">
                            <h3 className="font-semibold text-text-primary mb-2">Responses (pie)</h3>
                            <p className="text-xs text-text-secondary mb-3">Correct vs incorrect across all questions</p>
                            <ResponsiveContainer width="100%" height={220}>
                                <PieChart>
                                    <Pie
                                        data={answerPie}
                                        dataKey="value"
                                        nameKey="name"
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={50}
                                        outerRadius={85}
                                        paddingAngle={2}
                                    >
                                        <Cell fill="#22c55e" stroke="var(--surface-color)" strokeWidth={2} />
                                        <Cell fill="#ef4444" stroke="var(--surface-color)" strokeWidth={2} />
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{
                                            background: "var(--surface-color)",
                                            border: "1px solid var(--border-color)",
                                            borderRadius: "8px",
                                            color: "var(--text-primary)",
                                        }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}

                <div className="grid md:grid-cols-2 gap-6">
                    {/* Score Distribution */}
                    <div className="card">
                        <h3 className="font-semibold text-text-primary mb-4">Score Distribution (bars)</h3>
                        <ResponsiveContainer width="100%" height={200}>
                            <BarChart data={distData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                <XAxis dataKey="range" tick={{ fill: "#64748b", fontSize: 11 }} />
                                <YAxis tick={{ fill: "#64748b", fontSize: 11 }} />
                                <Tooltip contentStyle={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "8px", color: "#0f172a" }} />
                                <Bar dataKey="count" fill="url(#blueGrad)" radius={[4, 4, 0, 0]} />
                                <defs>
                                    <linearGradient id="blueGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#10b981" />
                                        <stop offset="100%" stopColor="#34d399" />
                                    </linearGradient>
                                </defs>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Question Success Rates */}
                    <div className="card">
                        <h3 className="font-semibold text-text-primary mb-4">Hardest Questions (by success rate)</h3>
                        <ResponsiveContainer width="100%" height={200}>
                            <BarChart data={qSuccessData} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                <XAxis type="number" domain={[0, 100]} tick={{ fill: "#64748b", fontSize: 11 }} unit="%" />
                                <YAxis dataKey="name" type="category" width={80} tick={{ fill: "#64748b", fontSize: 9 }} />
                                <Tooltip contentStyle={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "8px", color: "#0f172a" }} />
                                <Bar dataKey="rate" fill="#10b981" radius={[0, 4, 4, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Leaderboard */}
                <div className="card">
                    <h3 className="font-semibold text-text-primary mb-4 flex items-center gap-2">
                        <Trophy className="w-5 h-5 text-yellow-400" /> Class Leaderboard
                    </h3>
                    <div className="space-y-3">
                        {(data.leaderboard || []).map(s => (
                            <div key={s.rank} className="flex items-center gap-4 p-3 rounded-md bg-light-bg dark:bg-dark-border border border-border-color transition-all">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${s.rank === 1 ? "bg-yellow-500 text-black" : s.rank === 2 ? "bg-gray-300 text-black" : s.rank === 3 ? "bg-amber-700 text-white" : "bg-bg-color text-text-secondary border border-border-color"}`}>
                                    {s.rank}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-text-primary text-sm">{s.student_name}</p>
                                    <p className="text-xs text-text-secondary truncate">
                                        {[s.stream, s.college_area].filter(Boolean).join(" · ") || "—"}
                                        {s.registration_id ? ` · ID ${s.registration_id}` : ""}
                                    </p>
                                    <p className="text-xs text-text-secondary">Time: {Math.round((s.time_taken_seconds || 0) / 60)}m {(s.time_taken_seconds || 0) % 60}s</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-brand-primary">{s.percentage?.toFixed(1)}%</p>
                                    <p className="text-xs text-text-secondary">Score: {s.score}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
