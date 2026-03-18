import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { Zap, User, Mail, Lock, GraduationCap, BookOpen, ArrowLeft, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";

export default function RegisterPage() {
    const [form, setForm] = useState({ full_name: "", email: "", password: "", role: "student" });
    const [loading, setLoading] = useState(false);
    const { register } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (form.password.length < 6) { toast.error("Password must be at least 6 characters"); return; }
        setLoading(true);
        try {
            await register(form);
            toast.success(
                form.role === "teacher"
                    ? "Welcome, Teacher! Your account is ready. 🎓"
                    : "Account created! Please sign in. 🎉"
            );
            navigate("/login");
        } catch (err) {
            toast.error(err.response?.data?.detail || "Registration failed.");
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
