import { useState, useEffect } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import { questionsAPI, quizzesAPI } from "../../api/client";
import { Search, Filter, Check, X, Trash2, Upload } from "lucide-react";
import toast from "react-hot-toast";

export default function QuestionBankPage() {
    const [questions, setQuestions] = useState([]);
    const [quizzes, setQuizzes] = useState([]);
    const [filters, setFilters] = useState({ topic: "", difficulty: "", is_approved: "" });
    const [loading, setLoading] = useState(true);

    const load = (f = filters) => {
        const params = {};
        if (f.topic) params.topic = f.topic;
        if (f.difficulty) params.difficulty = f.difficulty;
        if (f.is_approved !== "") params.is_approved = f.is_approved === "true";
        setLoading(true);
        questionsAPI.list(params).then(r => setQuestions(r.data)).finally(() => setLoading(false));
    };

    useEffect(() => {
        load();
        quizzesAPI.list().then(r => setQuizzes(r.data));
    }, []);

    const approve = async (id) => {
        await questionsAPI.update(id, { is_approved: true });
        setQuestions(prev => prev.map(q => q.id === id ? { ...q, is_approved: true } : q));
        toast.success("Question approved ✓");
    };

    const reject = async (id) => {
        await questionsAPI.delete(id);
        setQuestions(prev => prev.filter(q => q.id !== id));
        toast.success("Question removed");
    };

    const handleBulkImport = async (e, quizId) => {
        if (!quizId) { toast.error("Select a quiz first"); return; }
        const file = e.target.files[0];
        if (!file) return;
        try {
            const r = await questionsAPI.bulkImport(quizId, file);
            toast.success(`Imported ${r.data.imported} questions!`);
            load();
        } catch (err) {
            toast.error("Import failed");
        }
    };

    const [selectedQuizForImport, setSelectedQuizForImport] = useState("");

    return (
        <DashboardLayout>
            <div className="space-y-5 animate-slide-up">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <h2 className="text-xl font-bold text-text-primary">Question Bank ({questions.length})</h2>
                    <div className="flex items-center gap-3">
                        <select className="input text-sm py-2" value={selectedQuizForImport} onChange={e => setSelectedQuizForImport(e.target.value)}>
                            <option value="">Select quiz for import…</option>
                            {quizzes.map(q => <option key={q.id} value={q.id}>{q.title}</option>)}
                        </select>
                        <label className="btn-secondary cursor-pointer flex items-center gap-2 text-sm py-2">
                            <Upload className="w-4 h-4" /> Import CSV/Excel
                            <input type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={e => handleBulkImport(e, selectedQuizForImport)} />
                        </label>
                    </div>
                </div>

                {/* Filters */}
                <div className="card flex flex-wrap gap-3 items-center py-4">
                    <Filter className="w-4 h-4 text-gray-500 flex-shrink-0" />
                    <input className="input text-sm py-2 w-48" placeholder="Filter by topic..." value={filters.topic}
                        onChange={e => setFilters({ ...filters, topic: e.target.value })} />
                    <select className="input text-sm py-2 w-36" value={filters.difficulty} onChange={e => setFilters({ ...filters, difficulty: e.target.value })}>
                        <option value="">All difficulty</option>
                        <option value="easy">Easy</option>
                        <option value="medium">Medium</option>
                        <option value="hard">Hard</option>
                    </select>
                    <select className="input text-sm py-2 w-36" value={filters.is_approved} onChange={e => setFilters({ ...filters, is_approved: e.target.value })}>
                        <option value="">All status</option>
                        <option value="true">Approved</option>
                        <option value="false">Pending</option>
                    </select>
                    <button onClick={() => load(filters)} className="btn-primary text-sm py-2 px-4 flex items-center gap-2">
                        <Search className="w-4 h-4" />Search
                    </button>
                </div>

                {/* Questions */}
                {loading ? (
                    <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" /></div>
                ) : (
                    <div className="space-y-3">
                        {questions.length === 0 ? (
                            <div className="card text-center py-12 text-text-secondary">No questions found</div>
                        ) : questions.map((q, i) => (
                            <div key={q.id} className={`card border-l-4 ${q.is_approved ? "border-l-green-500" : "border-l-yellow-500"}`}>
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-text-primary">Q{i + 1}. {q.text}</p>
                                        <div className="grid grid-cols-2 gap-x-4 mt-2">
                                            {["a", "b", "c", "d"].map(opt => (
                                                <p key={opt} className={`text-xs py-0.5 ${q.correct_option === opt ? "text-green-400 font-semibold" : "text-gray-500"}`}>
                                                    ({opt.toUpperCase()}) {q[`option_${opt}`]}
                                                    {q.correct_option === opt && " ✓"}
                                                </p>
                                            ))}
                                        </div>
                                        <div className="flex gap-2 mt-2 flex-wrap">
                                            <span className={`badge ${q.difficulty === "easy" ? "badge-green" : q.difficulty === "hard" ? "badge-red" : "badge-yellow"}`}>{q.difficulty}</span>
                                            {q.topic && <span className="badge badge-blue">{q.topic}</span>}
                                            {q.is_ai_generated && <span className="badge badge-purple">AI Generated</span>}
                                            <span className={`badge ${q.is_approved ? "badge-green" : "badge-yellow"}`}>{q.is_approved ? "Approved" : "Pending"}</span>
                                        </div>
                                    </div>
                                    <div className="flex gap-2 flex-shrink-0">
                                        {!q.is_approved && (
                                            <button onClick={() => approve(q.id)} className="w-8 h-8 rounded-lg bg-green-500/10 border border-green-500/30 text-green-400 hover:bg-green-500/20 transition-all flex items-center justify-center">
                                                <Check className="w-4 h-4" />
                                            </button>
                                        )}
                                        <button onClick={() => reject(q.id)} className="w-8 h-8 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 transition-all flex items-center justify-center">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
