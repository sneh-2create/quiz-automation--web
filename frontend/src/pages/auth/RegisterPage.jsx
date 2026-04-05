import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/useAuth";
import { Zap, User, Mail, Lock, GraduationCap, BookOpen, ArrowLeft, UserRound, Phone, MapPin, BookMarked, IdCard, Building2, Flag, Tag } from "lucide-react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";

export default function RegisterPage() {
    const [form, setForm] = useState({
        full_name: "",
        email: "",
        registration_id: "",
        password: "",
        role: "student",
        father_name: "",
        college_area: "",
        state_region: "",
        institution_name: "",
        competition_category: "",
        stream: "",
        mobile_no: "",
    });
    const [loading, setLoading] = useState(false);
    const { register } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (form.password.length < 6) { toast.error("Password must be at least 6 characters"); return; }
        setLoading(true);
        try {
            const payload =
                form.role === "student"
                    ? {
                          full_name: form.full_name,
                          email: form.email,
                          password: form.password,
                          role: "student",
                          registration_id: form.registration_id,
                          father_name: form.father_name,
                          college_area: form.college_area,
                          state_region: form.state_region || undefined,
                          institution_name: form.institution_name || undefined,
                          competition_category: form.competition_category || undefined,
                          stream: form.stream,
                          mobile_no: form.mobile_no,
                      }
                    : {
                          full_name: form.full_name,
                          email: form.email,
                          password: form.password,
                          role: "teacher",
                      };
            await register(payload);
            toast.success(
                form.role === "teacher"
                    ? "Welcome, Teacher! Your account is ready. 🎓"
                    : "Account created! Please sign in. 🎉"
            );
            navigate("/login");
        } catch (err) {
            if (!err.response) {
                toast.error(
                    err.message?.includes("fetch") || err.message?.includes("Network")
                        ? "Cannot reach the API. Start the backend on port 8000 (see login page) or run `npm run dev` from the project root."
                        : err.message || "Registration failed — check your connection."
                );
            } else {
                const d = err.response?.data?.detail;
                const msg = Array.isArray(d)
                    ? d.map((x) => x.msg || JSON.stringify(x)).join(" · ")
                    : typeof d === "string"
                      ? d
                      : "Registration failed.";
                toast.error(msg);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col md:flex-row bg-bg-color overflow-hidden">
            {/* Left Side: Brand & Motivation */}
            <motion.div
                initial={{ x: -100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.8, ease: "circOut" }}
                className="hidden md:flex md:w-1/2 bg-brand-primary relative p-12 flex-col justify-between overflow-hidden"
            >
                {/* Decorative Elements */}
                <div className="absolute top-0 left-0 w-full h-full">
                    <div className="absolute top-[10%] left-[-10%] w-[70%] h-[70%] bg-brand-secondary rounded-full blur-[140px] opacity-10" />
                </div>
                <div className="relative z-10 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-md bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
                        <Zap className="w-6 h-6 text-brand-secondary fill-brand-secondary" />
                    </div>
                    <span className="text-2xl font-bold text-white tracking-tight">QuizAI</span>
                </div>

                <div className="relative z-10">
                    <motion.h2
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.4, duration: 0.6 }}
                        className="text-6xl font-bold text-white leading-none mb-6"
                    >
                        Start your <br />
                        <span className="text-brand-secondary">Academic path</span>
                    </motion.h2>
                    <motion.p
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.5, duration: 0.6 }}
                        className="text-white/70 text-lg font-medium max-w-md"
                    >
                        Join the community of over 50,000+ creators and learners building the future of education together.
                    </motion.p>
                </div>

                <div className="relative z-10 text-white/50 text-sm font-medium">
                    © 2026 QuizAI Platform. All rights reserved.
                </div>
            </motion.div>

            {/* Right Side: Registration Form */}
            <div className="flex-1 flex items-center justify-center p-8 bg-surface-color relative overflow-y-auto">
                <Link to="/" className="absolute top-8 left-8 p-3 rounded-2xl bg-border-color/50 text-text-secondary hover:text-primary-color transition-colors md:hidden">
                    <ArrowLeft className="w-5 h-5" />
                </Link>

                <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="w-full max-w-md py-12"
                >
                    <div className="mb-8">
                        <h1 className="text-4xl font-bold text-text-primary mb-2 tracking-tight">Create Account</h1>
                        <p className="text-text-secondary font-medium">Join our community of educators and learners.</p>
                    </div>

                    {/* Role Selector */}
                    <div className="grid grid-cols-2 gap-4 mb-8">
                        {[
                            { value: "student", label: "Student", icon: GraduationCap, desc: "Learn & Collaborate" },
                            { value: "teacher", label: "Teacher", icon: BookOpen, desc: "Create & Assess" },
                        ].map(({ value, label, icon: Icon, desc }) => (
                            <button
                                key={value}
                                onClick={() => setForm({ ...form, role: value })}
                                className={`flex flex-col p-4 rounded-md border text-left transition-all duration-300 relative overflow-hidden group ${form.role === value
                                    ? "border-brand-primary bg-brand-primary/5 shadow-sm"
                                    : "border-border-color bg-surface-color hover:border-brand-primary/50"
                                    }`}
                            >
                                <div className={`w-8 h-8 rounded flex items-center justify-center mb-3 transition-colors ${form.role === value ? "bg-brand-primary text-white" : "bg-border-color/50 text-text-secondary group-hover:text-brand-primary"
                                    }`}>
                                    <Icon className="w-4 h-4" />
                                </div>
                                <span className={`font-bold text-sm ${form.role === value ? "text-brand-primary" : "text-text-primary"}`}>{label}</span>
                                <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider mt-1">{desc}</span>
                                {form.role === value && (
                                    <motion.div
                                        layoutId="role-indicator"
                                        className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-brand-primary"
                                    />
                                )}
                            </button>
                        ))}
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-1">
                            <label className="text-xs font-black text-text-secondary uppercase tracking-widest pl-1">Full Name</label>
                            <div className="relative">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary" />
                                <input
                                    type="text"
                                    className="input pl-12"
                                    placeholder="John Doe"
                                    value={form.full_name}
                                    onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                                    required
                                />
                            </div>
                        </div>

                        {form.role === "teacher" && (
                            <div className="space-y-1">
                                <label className="text-xs font-black text-text-secondary uppercase tracking-widest pl-1">Email Address</label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary" />
                                    <input
                                        type="email"
                                        className="input pl-12"
                                        placeholder="john@example.com"
                                        value={form.email}
                                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>
                        )}

                        {form.role === "student" && (
                            <>
                                <div className="space-y-1">
                                    <label className="text-xs font-black text-text-secondary uppercase tracking-widest pl-1">Email address</label>
                                    <div className="relative">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary" />
                                        <input
                                            type="email"
                                            className="input pl-12"
                                            placeholder="Your real email (stored for the event)"
                                            value={form.email}
                                            onChange={(e) => setForm({ ...form, email: e.target.value })}
                                            required={form.role === "student"}
                                        />
                                    </div>
                                    <p className="text-[10px] text-text-secondary pl-1">
                                        Used for your account and optional sign-in. We do not show internal placeholder emails on your profile.
                                    </p>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-black text-text-secondary uppercase tracking-widest pl-1">College registration ID</label>
                                    <div className="relative">
                                        <IdCard className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary" />
                                        <input
                                            type="text"
                                            className="input pl-12"
                                            placeholder="As issued by your college (used to sign in)"
                                            value={form.registration_id}
                                            onChange={(e) => setForm({ ...form, registration_id: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <p className="text-[10px] text-text-secondary pl-1">
                                        Sign in with this ID + password. After signup you also get a short{" "}
                                        <span className="font-bold text-brand-primary">participant code</span> for
                                        check-in at events (shown on your dashboard).
                                    </p>
                                </div>
                                <p className="text-[10px] font-bold text-text-secondary uppercase tracking-widest pl-1">Student profile (required)</p>
                                <div className="space-y-1">
                                    <label className="text-xs font-black text-text-secondary uppercase tracking-widest pl-1">Father&apos;s name</label>
                                    <div className="relative">
                                        <UserRound className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary" />
                                        <input
                                            type="text"
                                            className="input pl-12"
                                            placeholder="Parent / guardian name"
                                            value={form.father_name}
                                            onChange={(e) => setForm({ ...form, father_name: e.target.value })}
                                            required={form.role === "student"}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-black text-text-secondary uppercase tracking-widest pl-1">College area</label>
                                    <div className="relative">
                                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary" />
                                        <input
                                            type="text"
                                            className="input pl-12"
                                            placeholder="City or campus area"
                                            value={form.college_area}
                                            onChange={(e) => setForm({ ...form, college_area: e.target.value })}
                                            required={form.role === "student"}
                                        />
                                    </div>
                                </div>
                                <p className="text-[10px] font-bold text-text-secondary uppercase tracking-widest pl-1">
                                    Event analytics (strongly recommended for PIET / multi-college quizzes)
                                </p>
                                <div className="space-y-1">
                                    <label className="text-xs font-black text-text-secondary uppercase tracking-widest pl-1">State / UT</label>
                                    <div className="relative">
                                        <Flag className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary" />
                                        <input
                                            type="text"
                                            className="input pl-12"
                                            placeholder="e.g. Haryana, Karnataka"
                                            value={form.state_region}
                                            onChange={(e) => setForm({ ...form, state_region: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-black text-text-secondary uppercase tracking-widest pl-1">College / school name</label>
                                    <div className="relative">
                                        <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary" />
                                        <input
                                            type="text"
                                            className="input pl-12"
                                            placeholder="Full institution name as on ID card"
                                            value={form.institution_name}
                                            onChange={(e) => setForm({ ...form, institution_name: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-black text-text-secondary uppercase tracking-widest pl-1">Competition category</label>
                                    <div className="relative">
                                        <Tag className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary" />
                                        <input
                                            type="text"
                                            className="input pl-12"
                                            placeholder="e.g. UG — CSE, Diploma, School senior"
                                            value={form.competition_category}
                                            onChange={(e) => setForm({ ...form, competition_category: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-black text-text-secondary uppercase tracking-widest pl-1">Stream</label>
                                    <div className="relative">
                                        <BookMarked className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary" />
                                        <input
                                            type="text"
                                            className="input pl-12"
                                            placeholder="e.g. MCA, B.Tech CSE"
                                            value={form.stream}
                                            onChange={(e) => setForm({ ...form, stream: e.target.value })}
                                            required={form.role === "student"}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-black text-text-secondary uppercase tracking-widest pl-1">Mobile number</label>
                                    <div className="relative">
                                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary" />
                                        <input
                                            type="tel"
                                            className="input pl-12"
                                            placeholder="10-digit mobile"
                                            value={form.mobile_no}
                                            onChange={(e) => setForm({ ...form, mobile_no: e.target.value })}
                                            required={form.role === "student"}
                                        />
                                    </div>
                                </div>
                            </>
                        )}

                        <div className="space-y-1">
                            <label className="text-xs font-black text-text-secondary uppercase tracking-widest pl-1">Password</label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary" />
                                <input
                                    type="password"
                                    className="input pl-12"
                                    placeholder="••••••••"
                                    value={form.password}
                                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                                    required
                                />
                            </div>
                            <p className="text-[10px] text-text-secondary font-bold pl-1 italic">Must be at least 6 characters long.</p>
                        </div>


                        <button
                            type="submit"
                            className="btn-primary w-full py-4 text-lg mt-4"
                            disabled={loading}
                        >
                            {loading ? (
                                <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                "Create Account"
                            )}
                        </button>
                    </form>

                    <p className="text-center text-sm text-text-secondary mt-8 font-medium">
                        Already have an account?{" "}
                        <Link to="/login" className="text-brand-primary hover:underline font-bold">
                            Sign in instead
                        </Link>
                    </p>
                </motion.div>
            </div>
        </div>
    );
}
