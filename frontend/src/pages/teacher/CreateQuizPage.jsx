import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import DashboardLayout from "../../components/DashboardLayout";
import { quizzesAPI, questionsAPI, aiAPI } from "../../api/client";
import { Plus, Sparkles, Save, Trash2, Check, X, Upload, FileText, ChevronDown, ChevronUp } from "lucide-react";
import toast from "react-hot-toast";

const STEPS = ["Quiz Info", "Add Questions", "Review & Publish"];

function StepIndicator({ step }) {
    return (
        <div className="flex items-center gap-2 mb-8">
            {STEPS.map((s, i) => (
                <div key={i} className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${i < step ? "bg-green-500" : i === step ? "bg-gradient-to-br from-brand-primary to-brand-secondary" : "bg-gray-800 text-gray-600"}`}>
                        {i < step ? <Check className="w-4 h-4 text-white" /> : <span className={i === step ? "text-white" : ""}>{i + 1}</span>}
                    </div>
                    <span className={`text-sm font-medium hidden sm:block ${i === step ? "text-brand-primary" : i < step ? "text-green-400" : "text-gray-600"}`}>{s}</span>
                    {i < STEPS.length - 1 && <div className={`h-px w-8 ${i < step ? "bg-green-500" : "bg-gray-800"}`} />}
                </div>
            ))}
        </div>
    );
}

export default function CreateQuizPage() {
    const { quizId } = useParams();
    const navigate = useNavigate();
    const [step, setStep] = useState(0);
    const [quiz, setQuiz] = useState(null);
    const [quizForm, setQuizForm] = useState({
        title: "", description: "", subject: "", topic: "", duration_minutes: 30,
        difficulty: "medium", negative_marking: false, negative_marks_value: 0.25, pass_percentage: 40,
    });
    const [questions, setQuestions] = useState([]);
    const [aiForm, setAiForm] = useState({ topic: "", difficulty: "medium", num_questions: 5 });
    const [aiLoading, setAiLoading] = useState(false);
    const [aiGenerated, setAiGenerated] = useState([]);
    const [manualQ, setManualQ] = useState({ text: "", option_a: "", option_b: "", option_c: "", option_d: "", correct_option: "a", explanation: "", difficulty: "medium", marks: 1 });
    const [showManual, setShowManual] = useState(false);
    const [activeTab, setActiveTab] = useState("manual"); // manual | ai | pdf

    // Load existing quiz if editing
    useEffect(() => {
        if (quizId) {
            quizzesAPI.get(quizId).then(r => { setQuiz(r.data); setQuizForm(r.data); });
            questionsAPI.list({ quiz_id: quizId }).then(r => setQuestions(r.data));
            setStep(1);
        }
    }, [quizId]);

    const handleCreateQuiz = async () => {
        if (!quizForm.title.trim()) { toast.error("Quiz title is required"); return; }
        try {
            if (quizId) {
                const r = await quizzesAPI.update(quizId, quizForm);
                setQuiz(r.data);
            } else {
                const r = await quizzesAPI.create(quizForm);
                setQuiz(r.data);
            }
            toast.success("Quiz saved!");
            setStep(1);
        } catch (e) {
            toast.error(e.response?.data?.detail || "Failed to save quiz");
        }
    };

    const handleAddManualQ = async () => {
        if (!manualQ.text.trim()) { toast.error("Question text is required"); return; }
        try {
            const r = await questionsAPI.create({ ...manualQ, quiz_id: quiz.id });
            setQuestions(prev => [...prev, r.data]);
            setManualQ({ text: "", option_a: "", option_b: "", option_c: "", option_d: "", correct_option: "a", explanation: "", difficulty: "medium", marks: 1 });
            setShowManual(false);
            toast.success("Question added!");
        } catch (e) {
            toast.error("Failed to add question");
        }
    };

    const handleAIGenerate = async () => {
        if (!aiForm.topic.trim()) { toast.error("Enter a topic"); return; }
        setAiLoading(true);
        try {
            const r = await aiAPI.generateQuestions({ ...aiForm, quiz_id: quiz?.id });
            setAiGenerated(r.data.questions || []);
            toast.success(`${r.data.generated} questions generated! Review & approve them.`);
            questionsAPI.list({ quiz_id: quiz?.id }).then(r2 => setQuestions(r2.data));
        } catch (e) {
            toast.error("AI generation failed");
        } finally {
            setAiLoading(false);
        }
    };

    const approveQuestion = async (qId) => {
        await questionsAPI.update(qId, { is_approved: true });
        setQuestions(prev => prev.map(q => q.id === qId ? { ...q, is_approved: true } : q));
        toast.success("Question approved ✓");
    };

    const rejectQuestion = async (qId) => {
        await questionsAPI.delete(qId);
        setQuestions(prev => prev.filter(q => q.id !== qId));
        toast.success("Question removed");
    };

    const handlePublish = async () => {
        if (questions.filter(q => q.is_approved).length === 0) {
            toast.error("Add at least one approved question first");
            return;
        }
        await quizzesAPI.publish(quiz.id);
        toast.success("Quiz published! 🚀");
        navigate("/teacher");
    };

    const handlePdfUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setAiLoading(true);
        try {
            const r = await aiAPI.generateFromPdf(quiz?.id, aiForm.difficulty, aiForm.num_questions, file);
            toast.success(`${r.data.generated} questions from PDF!`);
            questionsAPI.list({ quiz_id: quiz?.id }).then(r2 => setQuestions(r2.data));
        } catch (e) {
            toast.error("PDF processing failed");
        } finally {
            setAiLoading(false);
        }
    };

    return (
        <DashboardLayout>
            <div className="max-w-3xl mx-auto animate-slide-up">
                <StepIndicator step={step} />

                {/* Step 0: Quiz Info */}
                {step === 0 && (
                    <div className="card space-y-5">
                        <h2 className="text-xl font-bold text-text-primary mb-2">Quiz Details</h2>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-2">
                                <label className="label">Quiz Title *</label>
                                <input className="input" placeholder="e.g. Data Structures Mid-Term" value={quizForm.title} onChange={e => setQuizForm({ ...quizForm, title: e.target.value })} />
                            </div>
                            <div>
                                <label className="label">Subject</label>
                                <input className="input" placeholder="e.g. Computer Science" value={quizForm.subject} onChange={e => setQuizForm({ ...quizForm, subject: e.target.value })} />
                            </div>
                            <div>
                                <label className="label">Topic</label>
                                <input className="input" placeholder="e.g. Linked Lists" value={quizForm.topic} onChange={e => setQuizForm({ ...quizForm, topic: e.target.value })} />
                            </div>
                            <div>
                                <label className="label">Duration (minutes)</label>
                                <input type="number" className="input" min="5" max="180" value={quizForm.duration_minutes} onChange={e => setQuizForm({ ...quizForm, duration_minutes: +e.target.value })} />
                            </div>
                            <div>
                                <label className="label">Difficulty</label>
                                <select className="input" value={quizForm.difficulty} onChange={e => setQuizForm({ ...quizForm, difficulty: e.target.value })}>
                                    <option value="easy">Easy</option>
                                    <option value="medium">Medium</option>
                                    <option value="hard">Hard</option>
                                </select>
                            </div>
                            <div>
                                <label className="label">Pass Percentage (%)</label>
                                <input type="number" className="input" min="0" max="100" value={quizForm.pass_percentage} onChange={e => setQuizForm({ ...quizForm, pass_percentage: +e.target.value })} />
                            </div>
                            <div className="flex items-center gap-3 col-span-2">
                                <input type="checkbox" id="neg" className="w-4 h-4 accent-brand-primary" checked={quizForm.negative_marking} onChange={e => setQuizForm({ ...quizForm, negative_marking: e.target.checked })} />
                                <label htmlFor="neg" className="text-sm text-text-secondary cursor-pointer">Enable Negative Marking (-{quizForm.negative_marks_value} per wrong)</label>
                            </div>
                            <div className="col-span-2">
                                <label className="label">Description</label>
                                <textarea className="input" rows={3} placeholder="Brief quiz description..." value={quizForm.description} onChange={e => setQuizForm({ ...quizForm, description: e.target.value })} />
                            </div>
                        </div>
                        <button onClick={handleCreateQuiz} className="btn-primary w-full flex items-center justify-center gap-2">
                            <Save className="w-4 h-4" /> Save & Continue →
                        </button>
                    </div>
                )}

                {/* Step 1: Add Questions */}
                {step === 1 && quiz && (
                    <div className="space-y-5">
                        <div className="card">
                            <div className="flex gap-1 mb-4 p-1 bg-gray-800/50 rounded-xl">
                                {[{ id: "manual", label: "Manual", icon: Plus }, { id: "ai", label: "AI Generate", icon: Sparkles }, { id: "pdf", label: "From PDF", icon: FileText }].map(tab => (
                                    <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                                        className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-semibold transition-all ${activeTab === tab.id ? "bg-gradient-to-r from-brand-primary to-brand-secondary text-white" : "text-gray-500 hover:text-gray-300"}`}>
                                        <tab.icon className="w-3.5 h-3.5" />{tab.label}
                                    </button>
                                ))}
                            </div>

                            {/* Manual */}
                            {activeTab === "manual" && (
                                <div>
                                    <button onClick={() => setShowManual(!showManual)} className="btn-secondary w-full flex items-center justify-center gap-2 mb-4">
                                        <Plus className="w-4 h-4" />{showManual ? "Cancel" : "Add Question Manually"}
                                        {showManual ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                    </button>
                                    {showManual && (
                                        <div className="space-y-3 pt-2 border-t border-gray-800">
                                            <textarea className="input" rows={3} placeholder="Question text..." value={manualQ.text} onChange={e => setManualQ({ ...manualQ, text: e.target.value })} />
                                            {["a", "b", "c", "d"].map(opt => (
                                                <div key={opt} className="flex gap-2 items-center">
                                                    <button type="button" onClick={() => setManualQ({ ...manualQ, correct_option: opt })}
                                                        className={`w-8 h-8 rounded-lg border-2 text-sm font-bold flex-shrink-0 transition-all ${manualQ.correct_option === opt ? "border-green-500 bg-green-500/20 text-green-300" : "border-gray-700 text-gray-500"}`}>
                                                        {opt.toUpperCase()}
                                                    </button>
                                                    <input className="input" placeholder={`Option ${opt.toUpperCase()}`} value={manualQ[`option_${opt}`]} onChange={e => setManualQ({ ...manualQ, [`option_${opt}`]: e.target.value })} />
                                                </div>
                                            ))}
                                            <input className="input" placeholder="Explanation (optional)" value={manualQ.explanation} onChange={e => setManualQ({ ...manualQ, explanation: e.target.value })} />
                                            <div className="flex gap-3">
                                                <select className="input" value={manualQ.difficulty} onChange={e => setManualQ({ ...manualQ, difficulty: e.target.value })}>
                                                    <option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option>
                                                </select>
                                                <input type="number" className="input" placeholder="Marks" step="0.5" min="0.5" value={manualQ.marks} onChange={e => setManualQ({ ...manualQ, marks: +e.target.value })} />
                                            </div>
                                            <button onClick={handleAddManualQ} className="btn-success w-full"><Plus className="w-4 h-4 inline mr-1" />Add Question</button>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* AI */}
                            {activeTab === "ai" && (
                                <div className="space-y-4">
                                    <div className="bg-brand-primary/10 border border-brand-primary/20 rounded-xl p-4 text-sm text-brand-primary">
                                        <Sparkles className="w-4 h-4 inline mr-2" />Gemini AI will generate questions. Review and approve them before publishing.
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="col-span-2">
                                            <label className="label">Topic</label>
                                            <input className="input" placeholder="e.g. Binary Trees" value={aiForm.topic} onChange={e => setAiForm({ ...aiForm, topic: e.target.value })} />
                                        </div>
                                        <div>
                                            <label className="label">Difficulty</label>
                                            <select className="input" value={aiForm.difficulty} onChange={e => setAiForm({ ...aiForm, difficulty: e.target.value })}>
                                                <option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="label">Count</label>
                                            <input type="number" className="input" min="1" max="20" value={aiForm.num_questions} onChange={e => setAiForm({ ...aiForm, num_questions: +e.target.value })} />
                                        </div>
                                    </div>
                                    <button onClick={handleAIGenerate} disabled={aiLoading} className="btn-primary w-full flex items-center justify-center gap-2">
                                        <Sparkles className="w-4 h-4" />{aiLoading ? "Generating..." : "Generate with AI ✨"}
                                    </button>
                                </div>
                            )}

                            {/* PDF */}
                            {activeTab === "pdf" && (
                                <div className="space-y-4">
                                    <div className="bg-brand-secondary/10 border border-brand-secondary/20 rounded-xl p-4 text-sm text-brand-secondary">
                                        <FileText className="w-4 h-4 inline mr-2" />Upload a PDF textbook or study material. AI will extract content and generate questions.
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="label">Difficulty</label>
                                            <select className="input" value={aiForm.difficulty} onChange={e => setAiForm({ ...aiForm, difficulty: e.target.value })}>
                                                <option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="label">Count</label>
                                            <input type="number" className="input" min="1" max="20" value={aiForm.num_questions} onChange={e => setAiForm({ ...aiForm, num_questions: +e.target.value })} />
                                        </div>
                                    </div>
                                    <label className={`flex flex-col items-center justify-center gap-3 p-8 rounded-xl border-2 border-dashed border-gray-700/50 cursor-pointer hover:border-brand-primary/50 hover:bg-brand-primary/5 transition-all ${aiLoading ? "opacity-50 pointer-events-none" : ""}`}>
                                        <Upload className="w-8 h-8 text-gray-500" />
                                        <span className="text-sm text-text-secondary">{aiLoading ? "Processing PDF..." : "Click to upload PDF"}</span>
                                        <input type="file" accept=".pdf" className="hidden" onChange={handlePdfUpload} disabled={aiLoading} />
                                    </label>
                                </div>
                            )}
                        </div>

                        {/* Questions list */}
                        <div className="space-y-3">
                            <h3 className="font-semibold text-text-primary flex items-center gap-2">
                                Questions ({questions.filter(q => q.is_approved).length} approved / {questions.length} total)
                            </h3>
                            {questions.length === 0 ? (
                                <div className="card text-center py-8 text-text-secondary">No questions added yet</div>
                            ) : (
                                questions.map((q, idx) => (
                                    <div key={q.id} className={`card border-l-4 ${q.is_approved ? "border-l-green-500" : "border-l-yellow-500"}`}>
                                        <div className="flex justify-between items-start gap-3">
                                            <p className="text-sm text-text-primary font-medium flex-1">Q{idx + 1}. {q.text}</p>
                                            <div className="flex gap-2 flex-shrink-0">
                                                {!q.is_approved && (
                                                    <button onClick={() => approveQuestion(q.id)} className="text-xs px-2 py-1 rounded-lg bg-green-500/10 border border-green-500/30 text-green-400 hover:bg-green-500/20 transition-all">
                                                        <Check className="w-3.5 h-3.5" />
                                                    </button>
                                                )}
                                                <button onClick={() => rejectQuestion(q.id)} className="text-xs px-2 py-1 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 transition-all">
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-1 mt-2">
                                            {["a", "b", "c", "d"].map(opt => (
                                                <p key={opt} className={`text-xs px-2 py-1 rounded ${q.correct_option === opt ? "text-green-300 bg-green-500/10" : "text-gray-500"}`}>
                                                    ({opt.toUpperCase()}) {q[`option_${opt}`]}
                                                </p>
                                            ))}
                                        </div>
                                        <div className="flex gap-2 mt-2">
                                            <span className="badge badge-blue">{q.difficulty}</span>
                                            {q.is_ai_generated && <span className="badge badge-purple">AI</span>}
                                            {q.is_approved ? <span className="badge badge-green">Approved</span> : <span className="badge badge-yellow">Pending</span>}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="flex gap-3">
                            <button onClick={() => setStep(0)} className="btn-secondary flex-1">← Back</button>
                            <button onClick={() => setStep(2)} className="btn-primary flex-1" disabled={questions.filter(q => q.is_approved).length === 0}>
                                Review & Publish →
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 2: Review */}
                {step === 2 && quiz && (
                    <div className="space-y-4 animate-slide-up">
                        <div className="card">
                            <h2 className="text-xl font-bold text-text-primary mb-4">Review Your Quiz</h2>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div><span className="text-text-secondary">Title: </span><span className="text-text-primary font-semibold">{quiz.title}</span></div>
                                <div><span className="text-text-secondary">Duration: </span><span className="text-text-primary font-semibold">{quiz.duration_minutes} min</span></div>
                                <div><span className="text-text-secondary">Difficulty: </span><span className="text-text-primary font-semibold capitalize">{quiz.difficulty}</span></div>
                                <div><span className="text-text-secondary">Pass %: </span><span className="text-text-primary font-semibold">{quiz.pass_percentage}%</span></div>
                                <div><span className="text-text-secondary">Questions: </span><span className="text-green-400 font-semibold">{questions.filter(q => q.is_approved).length} approved</span></div>
                                <div><span className="text-text-secondary">Negative: </span><span className="text-text-primary font-semibold">{quiz.negative_marking ? "Yes" : "No"}</span></div>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <button onClick={() => setStep(1)} className="btn-secondary flex-1">← Back</button>
                            <button onClick={handlePublish} className="btn-primary flex-1 flex items-center justify-center gap-2">
                                <Globe className="w-4 h-4" /> Publish Quiz 🚀
                            </button>
                            <button onClick={() => navigate("/teacher")} className="btn-secondary flex-1">Save as Draft</button>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}

// Need this import in the file too
import { Globe } from "lucide-react";
