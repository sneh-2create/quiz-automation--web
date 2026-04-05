import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import DashboardLayout from "../../components/DashboardLayout";
import { adminAPI } from "../../api/client";
import { BarChart2, Shield, Users, BookOpen, ClipboardCheck, PieChart as PieIcon } from "lucide-react";
import {
    PieChart,
    Pie,
    Cell,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Legend,
} from "recharts";

const PIE_COLORS = ["#6366f1", "#8b5cf6", "#22c55e", "#f59e0b", "#ef4444"];

export default function AdminAnalyticsPage() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        adminAPI
            .getAnalyticsOverview()
            .then((r) => setData(r.data))
            .catch(() => setData(null))
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex justify-center py-20">
                    <div className="w-8 h-8 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" />
                </div>
            </DashboardLayout>
        );
    }

    if (!data) {
        return (
            <DashboardLayout>
                <div className="card text-center py-12 text-text-secondary">Could not load platform analytics.</div>
            </DashboardLayout>
        );
    }

    const bandData = Object.entries(data.score_band_distribution || {}).map(([range, count]) => ({
        range,
        count,
    }));
    const bandPie = bandData.filter((d) => d.count > 0);

    return (
        <DashboardLayout>
            <div className="space-y-8 animate-slide-up pb-12 max-w-6xl">
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                    <div>
                        <p className="text-xs font-bold text-brand-secondary uppercase tracking-widest mb-1">
                            Admin only
                        </p>
                        <h1 className="text-3xl font-black text-text-primary tracking-tight">Platform analytics</h1>
                        <p className="text-text-secondary mt-1 text-sm max-w-xl">
                            Whole-institution view: users, quizzes, attempts, and score bands. Teacher dashboards stay
                            separate — they only see their own classes.
                        </p>
                    </div>
                    <Link
                        to="/admin"
                        className="inline-flex items-center gap-2 text-sm font-bold text-brand-primary hover:underline"
                    >
                        <Shield className="w-4 h-4" />
                        Platform settings
                    </Link>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                        { icon: Users, label: "Total users", value: data.users?.total ?? 0, sub: `${data.users?.students ?? 0} students` },
                        { icon: BookOpen, label: "Quizzes", value: data.quizzes?.total ?? 0, sub: `${data.quizzes?.published ?? 0} published` },
                        { icon: ClipboardCheck, label: "Submitted attempts", value: data.attempts?.submitted_total ?? 0, sub: "All teachers" },
                        { icon: BarChart2, label: "Teachers", value: data.users?.teachers ?? 0, sub: `${data.users?.admins ?? 0} admins` },
                    ].map(({ icon: Icon, label, value, sub }) => (
                        <div key={label} className="card flex gap-3 items-start">
                            <div className="p-2.5 rounded-xl bg-brand-primary/10 text-brand-primary">
                                <Icon className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-2xl font-black text-text-primary">{value}</p>
                                <p className="text-xs font-bold text-text-secondary uppercase tracking-wider">{label}</p>
                                <p className="text-[10px] text-text-secondary mt-0.5">{sub}</p>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="grid lg:grid-cols-2 gap-6">
                    <div className="card">
                        <div className="flex items-center gap-2 mb-4">
                            <PieIcon className="w-5 h-5 text-brand-secondary" />
                            <div>
                                <h3 className="font-bold text-text-primary">Attempts by score band</h3>
                                <p className="text-xs text-text-secondary">Platform-wide submitted attempts</p>
                            </div>
                        </div>
                        {bandPie.length === 0 ? (
                            <p className="text-sm text-text-secondary py-8 text-center">No attempts yet.</p>
                        ) : (
                            <ResponsiveContainer width="100%" height={280}>
                                <PieChart>
                                    <Pie
                                        data={bandPie}
                                        dataKey="count"
                                        nameKey="range"
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={56}
                                        outerRadius={100}
                                        paddingAngle={2}
                                        label={({ range, percent }) => `${range} (${(percent * 100).toFixed(0)}%)`}
                                    >
                                        {bandPie.map((_, i) => (
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
                        )}
                    </div>

                    <div className="card">
                        <h3 className="font-bold text-text-primary mb-1">Same data (bar)</h3>
                        <p className="text-xs text-text-secondary mb-4">Quick comparison across bands</p>
                        <ResponsiveContainer width="100%" height={280}>
                            <BarChart data={bandData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                                <XAxis dataKey="range" tick={{ fill: "var(--text-secondary)", fontSize: 11 }} />
                                <YAxis tick={{ fill: "var(--text-secondary)", fontSize: 11 }} allowDecimals={false} />
                                <Tooltip
                                    contentStyle={{
                                        background: "var(--surface-color)",
                                        border: "1px solid var(--border-color)",
                                        borderRadius: "8px",
                                        color: "var(--text-primary)",
                                    }}
                                />
                                <Legend />
                                <Bar dataKey="count" name="Attempts" fill="url(#adminBarGrad)" radius={[6, 6, 0, 0]} />
                                <defs>
                                    <linearGradient id="adminBarGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="var(--brand-primary)" />
                                        <stop offset="100%" stopColor="var(--brand-secondary)" />
                                    </linearGradient>
                                </defs>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="card">
                    <h3 className="font-bold text-text-primary mb-1">Top quizzes by attempt volume</h3>
                    <p className="text-xs text-text-secondary mb-4">Which assessments are getting used most</p>
                    <ul className="divide-y divide-border-color">
                        {(data.top_quizzes_by_attempts || []).length === 0 ? (
                            <li className="py-6 text-center text-text-secondary text-sm">No attempts yet.</li>
                        ) : (
                            (data.top_quizzes_by_attempts || []).map((row) => (
                                <li key={row.quiz_id} className="py-3 flex flex-wrap items-center justify-between gap-2">
                                    <div>
                                        <p className="font-semibold text-text-primary">{row.title}</p>
                                        <p className="text-xs text-text-secondary">
                                            {row.teacher_name} · {row.is_published ? "Published" : "Draft"}
                                        </p>
                                    </div>
                                    <span className="text-sm font-black text-brand-primary">{row.attempts} attempts</span>
                                </li>
                            ))
                        )}
                    </ul>
                </div>
            </div>
        </DashboardLayout>
    );
}
