import { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import DashboardLayout from "../../components/DashboardLayout";
import { usePlatform } from "../../context/PlatformContext";
import { analyticsAPI } from "../../api/client";
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, BarChart, Bar, Cell
} from "recharts";
import { TrendingUp, Target, Zap, BookOpen, Star, Trophy } from "lucide-react";

const PERF_COLORS = {
    "Strong": "text-green-600 bg-green-50 px-2 py-0.5 rounded",
    "Weak": "text-red-600 bg-red-50 px-2 py-0.5 rounded",
};

export default function StudentAnalyticsPage() {
    const { studentAnalyticsEnabled } = usePlatform();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!studentAnalyticsEnabled) return;
        analyticsAPI.studentMe().then(r => setData(r.data)).finally(() => setLoading(false));
    }, [studentAnalyticsEnabled]);

    if (!studentAnalyticsEnabled) {
        return <Navigate to="/student" replace />;
    }

    if (loading) return (
        <DashboardLayout>
            <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" /></div>
        </DashboardLayout>
    );

    const CATEGORY_MAP = [
        { range: "90-100%", label: "Smart", color: "#10b981" },
        { range: "75-89%", label: "Good", color: "#34d399" },
        { range: "60-74%", label: "Average", color: "#f59e0b" },
        { range: "40-59%", label: "Weak", color: "#f97316" },
        { range: "<40%", label: "Poor", color: "#ef4444" },
    ];

    const currentPct = data?.average_percentage || 0;
    const category = CATEGORY_MAP.find(c =>
        (c.label.startsWith("Smart") && currentPct >= 90) ||
        (c.label.startsWith("Good") && currentPct >= 75 && currentPct < 90) ||
        (c.label.startsWith("Average") && currentPct >= 60 && currentPct < 75) ||
        (c.label.startsWith("Weak") && currentPct >= 40 && currentPct < 60) ||
        (c.label.startsWith("Poor") && currentPct < 40)
    ) || CATEGORY_MAP[4];

    const trendData = (data?.performance_trend || []).map(t => ({
        date: t.date,
        score: t.percentage,
    }));

    const topicRadar = (data?.topic_analysis || []).slice(0, 6).map(t => ({
        topic: t.topic,
        accuracy: t.accuracy,
    }));

    const topicBar = (data?.topic_analysis || []).map(t => ({
        topic: t.topic,
        accuracy: t.accuracy,
        fill: t.accuracy >= 70 ? "#10b981" : t.accuracy >= 50 ? "#f59e0b" : "#ef4444",
    }));

    return (
        <DashboardLayout>
            <div className="space-y-6 animate-slide-up">
                {/* Performance category banner */}
                <div className="card py-6 text-center shadow-soft border-border-color" style={{ background: `linear-gradient(135deg, ${category.color}05, transparent)` }}>
                    <div className="text-4xl font-black mb-2" style={{ color: category.color }}>
                        {data?.average_percentage?.toFixed(1) || 0}%
                    </div>
                    <p className="text-xl font-bold text-text-primary">{category.label}</p>
                    <p className="text-text-secondary text-sm mt-1">Average across all {data?.total_attempts || 0} quizzes</p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                        { icon: Trophy, label: "Best Score", value: `${data?.best_percentage?.toFixed(1) || 0}%`, color: "text-brand-primary" },
                        { icon: Target, label: "Accuracy", value: `${data?.accuracy?.toFixed(1) || 0}%`, color: "text-brand-secondary" },
                        { icon: Zap, label: "Total XP", value: data?.total_xp || 0, color: "text-yellow-500" },
                        { icon: Star, label: "Level", value: data?.level || 1, color: "text-brand-dark" },
                    ].map(({ icon: Icon, label, value, color }) => (
                        <div key={label} className="card text-center py-5 shadow-sm">
                            <Icon className={`w-7 h-7 ${color} mx-auto mb-2`} />
                            <p className="text-2xl font-bold text-text-primary">{value}</p>
                            <p className="text-xs text-text-secondary">{label}</p>
                        </div>
                    ))}
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                    {/* Score Trend */}
                    <div className="card shadow-soft">
                        <h3 className="font-semibold text-text-primary mb-4 flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-brand-primary" /> Performance Trend
                        </h3>
                        {trendData.length === 0 ? (
                            <div className="h-48 flex items-center justify-center text-text-secondary text-sm">No attempt data yet</div>
                        ) : (
                            <ResponsiveContainer width="100%" height={200}>
                                <LineChart data={trendData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                    <XAxis dataKey="date" tick={{ fill: "#64748b", fontSize: 10 }} />
                                    <YAxis domain={[0, 100]} tick={{ fill: "#64748b", fontSize: 10 }} unit="%" />
                                    <Tooltip contentStyle={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "8px", color: "#0f172a" }} />
                                    <Line type="monotone" dataKey="score" stroke="#10b981" strokeWidth={2.5} dot={{ fill: "#10b981", r: 4 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        )}
                    </div>

                    {/* Topic Radar */}
                    <div className="card shadow-soft">
                        <h3 className="font-semibold text-text-primary mb-4 flex items-center gap-2">
                            <Target className="w-5 h-5 text-brand-secondary" /> Topic Mastery
                        </h3>
                        {topicRadar.length === 0 ? (
                            <div className="h-48 flex items-center justify-center text-text-secondary text-sm">Attempt tagged quizzes to see topic analysis</div>
                        ) : (
                            <ResponsiveContainer width="100%" height={200}>
                                <RadarChart data={topicRadar}>
                                    <PolarGrid stroke="#e2e8f0" />
                                    <PolarAngleAxis dataKey="topic" tick={{ fill: "#64748b", fontSize: 10 }} />
                                    <PolarRadiusAxis domain={[0, 100]} tick={{ fill: "#64748b", fontSize: 9 }} />
                                    <Radar dataKey="accuracy" stroke="#34d399" fill="#34d399" fillOpacity={0.3} strokeWidth={2} />
                                    <Tooltip contentStyle={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "8px", color: "#0f172a" }} />
                                </RadarChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>

                {/* Topic Bar Chart */}
                {topicBar.length > 0 && (
                    <div className="card shadow-soft">
                        <h3 className="font-semibold text-text-primary mb-4 flex items-center gap-2">
                            <BookOpen className="w-5 h-5 text-brand-primary" /> Topic-wise Accuracy
                        </h3>
                        <ResponsiveContainer width="100%" height={220}>
                            <BarChart data={topicBar}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                <XAxis dataKey="topic" tick={{ fill: "#64748b", fontSize: 10 }} />
                                <YAxis domain={[0, 100]} tick={{ fill: "#64748b", fontSize: 10 }} unit="%" />
                                <Tooltip contentStyle={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "8px", color: "#0f172a" }} />
                                <Bar dataKey="accuracy" radius={[4, 4, 0, 0]}>
                                    {topicBar.map((t, i) => <Cell key={i} fill={t.fill} />)}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                )}

                {/* Weak / Strong topics */}
                {(data?.weak_topics?.length > 0 || data?.strong_topics?.length > 0) && (
                    <div className="grid md:grid-cols-2 gap-4">
                        {data?.weak_topics?.length > 0 && (
                            <div className="card border-l-4 border-l-red-500 shadow-sm">
                                <h4 className="font-semibold text-red-600 mb-3 flex items-center gap-2"><BookOpen className="w-4 h-4" /> Topics to Improve</h4>
                                <div className="space-y-2">
                                    {data.weak_topics.map(t => (
                                        <div key={t.topic} className="flex justify-between items-center">
                                            <span className="text-sm text-text-secondary">{t.topic}</span>
                                            <span className={PERF_COLORS.Weak}>{t.accuracy?.toFixed(1)}%</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        {data?.strong_topics?.length > 0 && (
                            <div className="card border-l-4 border-l-brand-primary shadow-sm">
                                <h4 className="font-semibold text-brand-primary mb-3 flex items-center gap-2"><Zap className="w-4 h-4" /> Strong Topics</h4>
                                <div className="space-y-2">
                                    {data.strong_topics.map(t => (
                                        <div key={t.topic} className="flex justify-between items-center">
                                            <span className="text-sm text-text-secondary">{t.topic}</span>
                                            <span className={PERF_COLORS.Strong}>{t.accuracy?.toFixed(1)}%</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
