import { useState } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import { usersAPI } from "../../api/client";
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle2 } from "lucide-react";
import toast from "react-hot-toast";

export default function TeacherStudentImportPage() {
    const [busy, setBusy] = useState(false);
    const [lastResult, setLastResult] = useState(null);

    const onFile = async (e) => {
        const file = e.target.files?.[0];
        e.target.value = "";
        if (!file) return;
        setBusy(true);
        setLastResult(null);
        try {
            const r = await usersAPI.bulkImportStudents(file);
            const { imported, errors } = r.data;
            setLastResult(r.data);
            if (imported > 0) {
                toast.success(`Imported ${imported} student${imported === 1 ? "" : "s"}.`);
            }
            if (errors?.length) {
                toast.error(`${errors.length} row(s) skipped — see details below.`);
            } else if (imported === 0) {
                toast.error("No rows imported.");
            }
        } catch (err) {
            const d = err.response?.data?.detail;
            const msg =
                typeof d === "string"
                    ? d
                    : Array.isArray(d)
                      ? d.map((x) => x.msg || JSON.stringify(x)).join(" · ")
                      : "Import failed.";
            toast.error(msg);
        } finally {
            setBusy(false);
        }
    };

    return (
        <DashboardLayout>
            <div className="space-y-8 max-w-3xl animate-slide-up">
                <div>
                    <h2 className="text-2xl font-black text-text-primary tracking-tight">Import students (Excel / CSV)</h2>
                    <p className="text-text-secondary font-medium mt-2">
                        For large live events: upload a spreadsheet so learners are pre-registered with email and phone stored
                        in the database. Students still sign in on the <strong>Student</strong> login page only.
                    </p>
                </div>

                <div className="card p-6 space-y-4 border border-border-color">
                    <div className="flex items-start gap-3 text-sm text-text-secondary">
                        <FileSpreadsheet className="w-5 h-5 text-brand-primary shrink-0 mt-0.5" />
                        <div className="space-y-2">
                            <p className="font-bold text-text-primary">Required columns</p>
                            <p className="font-mono text-xs leading-relaxed">
                                registration_id, email, full_name, mobile_no, password, father_name, college_area, stream
                            </p>
                            <p className="font-bold text-text-primary pt-2">Optional columns</p>
                            <p className="font-mono text-xs leading-relaxed">
                                state_region, institution_name, competition_category
                            </p>
                        </div>
                    </div>

                    <label
                        className={`btn-primary cursor-pointer inline-flex items-center gap-2 ${busy ? "opacity-60 pointer-events-none" : ""}`}
                    >
                        <Upload className="w-4 h-4" />
                        {busy ? "Importing…" : "Choose .xlsx or .csv"}
                        <input
                            type="file"
                            accept=".csv,.xlsx,.xls"
                            className="hidden"
                            disabled={busy}
                            onChange={onFile}
                        />
                    </label>
                </div>

                {lastResult && (
                    <div className="rounded-xl border border-border-color bg-surface-color p-5 space-y-3">
                        <div className="flex items-center gap-2 text-text-primary font-bold">
                            <CheckCircle2 className="w-5 h-5 text-green-500" />
                            Imported: {lastResult.imported}
                        </div>
                        {lastResult.errors?.length > 0 && (
                            <div className="space-y-2">
                                <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold text-sm">
                                    <AlertCircle className="w-4 h-4 shrink-0" />
                                    Row errors ({lastResult.errors.length})
                                </div>
                                <ul className="text-xs font-mono text-text-secondary max-h-48 overflow-y-auto space-y-1 pl-1">
                                    {lastResult.errors.slice(0, 40).map((line, i) => (
                                        <li key={i}>{line}</li>
                                    ))}
                                    {lastResult.errors.length > 40 && (
                                        <li className="text-text-primary font-sans font-semibold">
                                            … and {lastResult.errors.length - 40} more
                                        </li>
                                    )}
                                </ul>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
