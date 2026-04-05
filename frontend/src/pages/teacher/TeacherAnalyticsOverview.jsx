import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import DashboardLayout from "../../components/DashboardLayout";
import { analyticsAPI, quizzesAPI } from "../../api/client";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
    PieChart,
    Pie,
    Cell,
} from "recharts";
import {
    Trophy,
    Users,
    Layers,
    GraduationCap,
    MapPin,
    BarChart2,
    ChevronRight,
    Target,
    Building2,
    Tag,
} from "lucide-react";

const PIE_PALETTE = ["#6366f1", "#a855f7", "#22c55e", "#eab308", "#f97316", "#ec4899"];

const COHORT_COLUMN_LABEL = {
    stream: "Stream",
    college_area: "Area / city",
    state_region: "State / UT",
    institution_name: "College / school",
    competition_category: "Category",
};

function TopThreePodium({ entries, title }) {
    if (!entries?.length) {
        return (
            <p className="text-sm text-text-secondary py-6 text-center border border-dashed border-border-color rounded-xl">
                No ranked data yet — students need submitted attempts on your quizzes.
            </p>
        );
    }
    const medals = ["🥇", "🥈", "🥉"];
    return (
        <div className="space-y-4">
            <h3 className="text-sm font-bold text-text-secondary uppercase tracking-widest">{title}</h3>
            <div className="grid gap-3 sm:grid-cols-3">
                {entries.slice(0, 3).map((s, i) => (
                    <div
                        key={`${s.full_name}-${i}`}
                        className={`card p-5 border flex flex-col gap-2 relative overflow-hidden ${
                            i === 0
                                ? "border-amber-500/40 bg-gradient-to-br from-amber-500/10 via-surface-color to-surface-color ring-1 ring-amber-500/20"
                                : i === 1
                                  ? "border-slate-400/30 bg-surface-color/90"
                                  : "border-amber-800/30 bg-surface-color/90"
                        }`}
                    >
                        <div className="flex items-center justify-between">
                            <span className="text-2xl">{medals[i] || `#${i + 1}`}</span>
                            <span className="text-lg font-black text-brand-primary">{s.avg_percentage}%</span>
                        </div>
                        <p className="font-bold text-text-primary leading-tight">{s.full_name}</p>
                        <div className="text-[11px] text-text-secondary space-y-0.5 font-medium">
                            {s.registration_id && <p>Reg: {s.registration_id}</p>}
                            {s.participant_code && <p>Code: {s.participant_code}</p>}
                            <p>Stream: {s.stream || "—"}</p>
                            <p>State: {s.state_region || "—"} · Area: {s.college_area || "—"}</p>
                            {s.institution_name && <p className="truncate">{s.institution_name}</p>}
                            <p>{s.attempts} attempt{s.attempts !== 1 ? "s" : ""} (your quizzes)</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function CohortTable({ title, icon: Icon, rows, nameKey, subtitle, selectedCutoff }) {
    const col = COHORT_COLUMN_LABEL[nameKey] || nameKey;
    const tops = (row) => (row.top_by_cutoff && row.top_by_cutoff[selectedCutoff]) || [];
    return (
        <div className="card overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-4 border-b border-border-color">
                <Icon className="w-5 h-5 text-brand-secondary" />
                <div>
                    <h3 className="font-bold text-text-primary">{title}</h3>
                    <p className="text-xs text-text-secondary">{subtitle}</p>
                </div>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="text-left text-[10px] uppercase tracking-widest text-text-secondary border-b border-border-color bg-light-bg/50">
                            <th className="px-4 py-3 font-bold">{col}</th>
                            <th className="px-4 py-3 font-bold">Students</th>
                            <th className="px-4 py-3 font-bold">Attempts</th>
                            <th className="px-4 py-3 font-bold">Avg %</th>
                            <th className="px-4 py-3 font-bold min-w-[220px]">Top {selectedCutoff} (shortlist)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-4 py-8 text-center text-text-secondary">
                                    No cohort data yet — add state / college / category on student profiles.
                                </td>
                            </tr>
                        ) : (
                            rows.map((row) => (
                                <tr key={row[nameKey]} className="border-b border-border-color/60 hover:bg-bg-color/40">
                                    <td className="px-4 py-3 font-semibold text-text-primary">{row[nameKey]}</td>
                                    <td className="px-4 py-3 text-text-secondary">{row.unique_students}</td>
                                    <td className="px-4 py-3 text-text-secondary">{row.attempts}</td>
                                    <td className="px-4 py-3 font-bold text-brand-primary">{row.avg_percentage}%</td>
                                    <td className="px-4 py-3 text-xs text-text-secondary">
                                        {tops(row).map((t, idx) => (
                                            <span key={idx} className="block">
                                                {idx + 1}. {t.full_name} — {t.avg_percentage}%
                                                {t.participant_code ? ` · ${t.participant_code}` : ""}
                                                {t.registration_id ? ` · ${t.registration_id}` : ""}
                                            </span>
                                        ))}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default function TeacherAnalyticsOverview() {
    const [insights, setInsights] = useState(null);
    const [quizzes, setQuizzes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [rankTier, setRankTier] = useState("20");

    useEffect(() => {
        Promise.all([
            analyticsAPI.teacherInsights().then((r) => setInsights(r.data)),
            quizzesAPI.list().then((r) => setQuizzes(r.data || [])),
        ]).finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        const c = insights?.rank_cutoffs;
        if (c?.length) setRankTier(String(c[c.length - 1]));
    }, [insights?.rank_cutoffs]);

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex justify-center py-20">
                    <div className="w-8 h-8 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" />
                </div>
            </DashboardLayout>
        );
    }

    const diffData = insights?.by_question_difficulty || [];
    const hasData = insights?.has_data && (insights?.total_attempts || 0) > 0;
    const bandPieData = Object.entries(insights?.score_band_distribution || {})
        .map(([name, value]) => ({ name, value }))
        .filter((d) => d.value > 0);
    const ao = insights?.answer_outcomes || { correct: 0, incorrect: 0 };
    const answerPieData = [
        { name: "Correct", value: ao.correct },
        { name: "Incorrect", value: ao.incorrect },
    ].filter((d) => d.value > 0);
    const diffPieData = (diffData || [])
        .map((d) => ({ name: d.difficulty, value: d.answers_count || 0 }))
        .filter((d) => d.value > 0);

    const cutoffs = insights?.rank_cutoffs?.length ? insights.rank_cutoffs : [3, 10, 20];
    const tierBoard = insights?.leaderboard_by_cutoff?.[rankTier] || [];
    const podiumEntries = tierBoard.slice(0, 3);

    return (
        <DashboardLayout>
            <div className="space-y-8 animate-slide-up pb-12">
                <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-black text-text-primary tracking-tight">Analytics</h1>
                        <p className="text-text-secondary mt-1 font-medium max-w-2xl">
                            Built for multi-college events (e.g. PIET Quest–style): state, college, category, stream, area
                            cohorts, and admin-configurable shortlists (top 3 / 10 / 20) for each round.
                        </p>
                    </div>
                    <Link
                        to="/teacher"
                        className="text-sm font-bold text-brand-primary hover:underline inline-flex items-center gap-1"
                    >
                        Back to Quiz Lab <ChevronRight className="w-4 h-4" />
                    </Link>
                </div>

                {/* Summary */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                        {
                            icon: Layers,
                            label: "Your quizzes",
                            value: insights?.total_quizzes ?? 0,
                            sub: "All drafts + live",
                        },
                        {
                            icon: Users,
                            label: "Unique students",
                            value: insights?.unique_students ?? 0,
                            sub: "Attempted your quizzes",
                        },
                        {
                            icon: Target,
                            label: "Total attempts",
                            value: insights?.total_attempts ?? 0,
                            sub: "Submitted",
                        },
                        {
                            icon: BarChart2,
                            label: "Cohort slices",
                            value:
                                (insights?.by_stream?.length || 0) +
                                (insights?.by_college_area?.length || 0) +
                                (insights?.by_state_region?.length || 0) +
                                (insights?.by_institution?.length || 0) +
                                (insights?.by_competition_category?.length || 0),
                            sub: "Stream · area · state · college · category",
                        },
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

                {!hasData && (
                    <div className="card border-dashed border-2 border-border-color text-center py-16">
                        <GraduationCap className="w-12 h-12 mx-auto text-text-secondary opacity-40 mb-3" />
                        <p className="font-bold text-text-primary">No submitted attempts yet</p>
                        <p className="text-sm text-text-secondary mt-2 max-w-md mx-auto">
                            Publish a quiz and have students complete it. This page will fill with stream, area, top 3,
                            and difficulty analytics automatically.
                        </p>
                    </div>
                )}

                {hasData && (
                    <>
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <p className="text-sm text-text-secondary">
                                <span className="font-bold text-text-primary">Shortlist depth</span> (set by admin in
                                Platform settings): pick how many ranks to show in tables and the full list below.
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {cutoffs.map((n) => (
                                    <button
                                        key={n}
                                        type="button"
                                        onClick={() => setRankTier(String(n))}
                                        className={`px-4 py-2 rounded-xl text-sm font-black transition-all ${
                                            rankTier === String(n)
                                                ? "bg-gradient-to-r from-brand-primary to-brand-secondary text-white shadow-lg"
                                                : "bg-bg-color border border-border-color text-text-secondary hover:border-brand-primary/40"
                                        }`}
                                    >
                                        Top {n}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="rounded-2xl border border-border-color bg-gradient-to-br from-brand-primary/15 via-bg-color to-brand-secondary/10 p-6 sm:p-8">
                            <p className="text-xs font-black uppercase tracking-[0.2em] text-brand-secondary mb-2">
                                Podium — first three in current shortlist (Top {rankTier})
                            </p>
                            <TopThreePodium
                                entries={podiumEntries}
                                title={`Leading candidates (avg % on your quizzes — showing tier Top ${rankTier})`}
                            />
                        </div>

                        <div className="grid lg:grid-cols-3 gap-6">
                            <div className="card">
                                <h3 className="font-bold text-text-primary mb-1 text-sm">Attempts by score band</h3>
                                <p className="text-[11px] text-text-secondary mb-3">Where marks cluster (pie)</p>
                                {bandPieData.length === 0 ? (
                                    <p className="text-xs text-text-secondary py-8 text-center">No band data</p>
                                ) : (
                                    <ResponsiveContainer width="100%" height={220}>
                                        <PieChart>
                                            <Pie
                                                data={bandPieData}
                                                dataKey="value"
                                                nameKey="name"
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={48}
                                                outerRadius={80}
                                                paddingAngle={2}
                                            >
                                                {bandPieData.map((_, i) => (
                                                    <Cell key={i} fill={PIE_PALETTE[i % PIE_PALETTE.length]} stroke="var(--surface-color)" strokeWidth={2} />
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
                                <h3 className="font-bold text-text-primary mb-1 text-sm">Answers: correct vs wrong</h3>
                                <p className="text-[11px] text-text-secondary mb-3">All graded responses on your quizzes</p>
                                {answerPieData.length === 0 ? (
                                    <p className="text-xs text-text-secondary py-8 text-center">No answer data</p>
                                ) : (
                                    <ResponsiveContainer width="100%" height={220}>
                                        <PieChart>
                                            <Pie
                                                data={answerPieData}
                                                dataKey="value"
                                                nameKey="name"
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={48}
                                                outerRadius={80}
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
                                )}
                            </div>
                            <div className="card">
                                <h3 className="font-bold text-text-primary mb-1 text-sm">Volume by difficulty</h3>
                                <p className="text-[11px] text-text-secondary mb-3">How many answers per level</p>
                                {diffPieData.length === 0 ? (
                                    <p className="text-xs text-text-secondary py-8 text-center">No difficulty data</p>
                                ) : (
                                    <ResponsiveContainer width="100%" height={220}>
                                        <PieChart>
                                            <Pie
                                                data={diffPieData}
                                                dataKey="value"
                                                nameKey="name"
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={48}
                                                outerRadius={80}
                                                paddingAngle={2}
                                            >
                                                {diffPieData.map((_, i) => (
                                                    <Cell key={i} fill={PIE_PALETTE[(i + 2) % PIE_PALETTE.length]} stroke="var(--surface-color)" strokeWidth={2} />
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
                        </div>

                        <div className="grid lg:grid-cols-2 gap-6">
                            <CohortTable
                                title="By stream"
                                subtitle="Academic stream (e.g. MCA, B.Tech)"
                                icon={GraduationCap}
                                rows={insights.by_stream || []}
                                nameKey="stream"
                                selectedCutoff={rankTier}
                            />
                            <CohortTable
                                title="By college area"
                                subtitle="City / local cluster"
                                icon={MapPin}
                                rows={insights.by_college_area || []}
                                nameKey="college_area"
                                selectedCutoff={rankTier}
                            />
                            <CohortTable
                                title="By state / UT"
                                subtitle="Inter-state PIET-style cohorts"
                                icon={MapPin}
                                rows={insights.by_state_region || []}
                                nameKey="state_region"
                                selectedCutoff={rankTier}
                            />
                            <CohortTable
                                title="By college / school name"
                                subtitle="Institution leaderboard slices"
                                icon={Building2}
                                rows={insights.by_institution || []}
                                nameKey="institution_name"
                                selectedCutoff={rankTier}
                            />
                            <CohortTable
                                title="By competition category"
                                subtitle="UG / PG / Diploma / track — from student profile"
                                icon={Tag}
                                rows={insights.by_competition_category || []}
                                nameKey="competition_category"
                                selectedCutoff={rankTier}
                            />
                        </div>

                        <div className="card">
                            <div className="flex items-center gap-2 mb-4">
                                <Target className="w-5 h-5 text-brand-secondary" />
                                <div>
                                    <h3 className="font-bold text-text-primary">Question difficulty</h3>
                                    <p className="text-xs text-text-secondary">
                                        Success rate across all answers, grouped easy / medium / hard
                                    </p>
                                </div>
                            </div>
                            <ResponsiveContainer width="100%" height={260}>
                                <BarChart data={diffData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                                    <XAxis dataKey="difficulty" tick={{ fill: "var(--text-secondary)", fontSize: 12 }} />
                                    <YAxis domain={[0, 100]} tick={{ fill: "var(--text-secondary)", fontSize: 11 }} unit="%" />
                                    <Tooltip
                                        contentStyle={{
                                            background: "var(--surface-color)",
                                            border: "1px solid var(--border-color)",
                                            borderRadius: "8px",
                                            color: "var(--text-primary)",
                                        }}
                                    />
                                    <Legend />
                                    <Bar
                                        name="Success %"
                                        dataKey="success_rate"
                                        fill="url(#diffGrad)"
                                        radius={[6, 6, 0, 0]}
                                    />
                                    <defs>
                                        <linearGradient id="diffGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="var(--brand-primary)" />
                                            <stop offset="100%" stopColor="var(--brand-secondary)" />
                                        </linearGradient>
                                    </defs>
                                </BarChart>
                            </ResponsiveContainer>
                            <p className="text-[11px] text-text-secondary mt-2">
                                Answers counted:{" "}
                                {diffData.map((d) => `${d.difficulty}: ${d.answers_count}`).join(" · ")}
                            </p>
                        </div>

                        <div className="card">
                            <h3 className="font-bold text-text-primary mb-1 flex items-center gap-2">
                                <Trophy className="w-5 h-5 text-yellow-500" />
                                Full shortlist (Top {rankTier})
                            </h3>
                            <p className="text-xs text-text-secondary mb-4">
                                Export-friendly list: reg ID + participant code for desk check-in
                            </p>
                            <div className="space-y-2">
                                {tierBoard.map((s, idx) => (
                                    <div
                                        key={`${s.full_name}-${idx}`}
                                        className="flex flex-wrap items-center gap-3 py-2 px-3 rounded-lg bg-light-bg border border-border-color text-sm"
                                    >
                                        <span className="font-black text-text-secondary w-8">#{idx + 1}</span>
                                        <span className="font-semibold text-text-primary flex-1 min-w-[140px]">
                                            {s.full_name}
                                        </span>
                                        <span className="text-[10px] text-text-secondary font-mono">
                                            {s.participant_code || "—"}
                                        </span>
                                        <span className="text-xs text-text-secondary max-w-[100px] truncate">
                                            {s.state_region || "—"}
                                        </span>
                                        <span className="text-xs text-text-secondary max-w-[80px] truncate">
                                            {s.stream || "—"}
                                        </span>
                                        <span className="font-bold text-brand-primary ml-auto">{s.avg_percentage}%</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </>
                )}

                <div className="card">
                    <h3 className="font-bold text-text-primary mb-4">Per-quiz analytics</h3>
                    <p className="text-sm text-text-secondary mb-4">
                        Score distribution, hardest questions, and quiz-level class leaderboard.
                    </p>
                    {quizzes.length === 0 ? (
                        <p className="text-text-secondary text-sm">Create a quiz first.</p>
                    ) : (
                        <ul className="divide-y divide-border-color">
                            {quizzes.map((q) => (
                                <li key={q.id} className="py-3 flex items-center justify-between gap-3">
                                    <div>
                                        <p className="font-semibold text-text-primary">{q.title}</p>
                                        <p className="text-xs text-text-secondary">{q.subject || "No subject"}</p>
                                    </div>
                                    <Link
                                        to={`/teacher/analytics/quiz/${q.id}`}
                                        className="btn-secondary text-xs py-2 px-4 shrink-0"
                                    >
                                        Open analytics
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
}
