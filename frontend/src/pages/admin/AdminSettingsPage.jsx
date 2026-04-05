import { useState, useEffect } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import { adminAPI } from "../../api/client";
import { usePlatform } from "../../context/PlatformContext";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";
import { Shield, BarChart2, RotateCcw } from "lucide-react";

export default function AdminSettingsPage() {
    const { refreshPlatform } = usePlatform();
    const [enabled, setEnabled] = useState(true);
    const [retakes, setRetakes] = useState(false);
    const [tier1, setTier1] = useState(3);
    const [tier2, setTier2] = useState(10);
    const [tier3, setTier3] = useState(20);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        adminAPI
            .getSettings()
            .then((r) => {
                setEnabled(!!r.data.student_analytics_enabled);
                setRetakes(!!r.data.allow_quiz_retakes);
                setTier1(Number(r.data.analytics_rank_tier_1) || 3);
                setTier2(Number(r.data.analytics_rank_tier_2) || 10);
                setTier3(Number(r.data.analytics_rank_tier_3) || 20);
            })
            .catch(() => toast.error("Could not load settings"))
            .finally(() => setLoading(false));
    }, []);

    const save = async () => {
        setSaving(true);
        try {
            await adminAPI.patchSettings({
                student_analytics_enabled: enabled,
                allow_quiz_retakes: retakes,
                analytics_rank_tier_1: tier1,
                analytics_rank_tier_2: tier2,
                analytics_rank_tier_3: tier3,
            });
            await refreshPlatform();
            toast.success("Settings saved");
        } catch {
            toast.error("Save failed");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex justify-center py-20">
                    <div className="w-8 h-8 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" />
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="max-w-2xl space-y-6 animate-slide-up">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-3 rounded-xl bg-brand-primary/10 text-brand-primary">
                            <Shield className="w-8 h-8" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-text-primary">Admin settings</h1>
                            <p className="text-text-secondary text-sm">Control what students can see in the app.</p>
                        </div>
                    </div>
                    <Link
                        to="/admin/analytics"
                        className="inline-flex items-center gap-2 text-sm font-bold text-brand-primary hover:underline"
                    >
                        <BarChart2 className="w-4 h-4" />
                        Platform analytics
                    </Link>
                </div>

                <div className="card p-6 shadow-soft border-border-color">
                    <div className="flex items-start gap-4">
                        <BarChart2 className="w-6 h-6 text-brand-secondary shrink-0 mt-1" />
                        <div className="flex-1">
                            <h2 className="font-bold text-text-primary">Student analytics</h2>
                            <p className="text-sm text-text-secondary mt-1">
                                When off, students cannot open the My Stats page or see per-question correct/incorrect
                                feedback <strong>during</strong> a quiz (answers are still saved). After submit they
                                still see their score and result summary on the results screen.
                            </p>
                            <label className="mt-4 flex items-center gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="w-5 h-5 rounded border-border-color text-brand-primary focus:ring-brand-primary"
                                    checked={enabled}
                                    onChange={(e) => setEnabled(e.target.checked)}
                                />
                                <span className="font-semibold text-text-primary">Allow students to view analytics</span>
                            </label>
                        </div>
                    </div>
                    <div className="flex items-start gap-4 mt-8 pt-8 border-t border-border-color">
                        <BarChart2 className="w-6 h-6 text-brand-secondary shrink-0 mt-1" />
                        <div className="flex-1">
                            <h2 className="font-bold text-text-primary">Teacher rank shortlists (PIET / multi-round)</h2>
                            <p className="text-sm text-text-secondary mt-1">
                                Three cutoffs (e.g. 3, 10, 20) drive the &quot;Top N&quot; buttons and cohort tables on the
                                teacher analytics page — round 1 shortlist vs longer pool for round 2.
                            </p>
                            <div className="grid grid-cols-3 gap-3 mt-4">
                                <div>
                                    <label className="text-[10px] font-bold text-text-secondary uppercase">Tier 1</label>
                                    <input
                                        type="number"
                                        min={1}
                                        max={500}
                                        className="input mt-1"
                                        value={tier1}
                                        onChange={(e) => setTier1(+e.target.value || 1)}
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-text-secondary uppercase">Tier 2</label>
                                    <input
                                        type="number"
                                        min={1}
                                        max={500}
                                        className="input mt-1"
                                        value={tier2}
                                        onChange={(e) => setTier2(+e.target.value || 1)}
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-text-secondary uppercase">Tier 3</label>
                                    <input
                                        type="number"
                                        min={1}
                                        max={500}
                                        className="input mt-1"
                                        value={tier3}
                                        onChange={(e) => setTier3(+e.target.value || 1)}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-start gap-4 mt-8 pt-8 border-t border-border-color">
                        <RotateCcw className="w-6 h-6 text-brand-secondary shrink-0 mt-1" />
                        <div className="flex-1">
                            <h2 className="font-bold text-text-primary">Quiz retakes</h2>
                            <p className="text-sm text-text-secondary mt-1">
                                When on, students can start a new attempt even after using all tries set on the quiz
                                (max attempts is ignored for new starts). Use for practice or when the teacher wants
                                repeats.
                            </p>
                            <label className="mt-4 flex items-center gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="w-5 h-5 rounded border-border-color text-brand-primary focus:ring-brand-primary"
                                    checked={retakes}
                                    onChange={(e) => setRetakes(e.target.checked)}
                                />
                                <span className="font-semibold text-text-primary">Allow unlimited retakes (platform-wide)</span>
                            </label>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={save}
                        disabled={saving}
                        className="btn-primary mt-6 w-full sm:w-auto px-8"
                    >
                        {saving ? "Saving…" : "Save changes"}
                    </button>
                </div>
            </div>
        </DashboardLayout>
    );
}
