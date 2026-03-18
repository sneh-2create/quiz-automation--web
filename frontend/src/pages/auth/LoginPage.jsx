import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { Zap, Mail, Lock, Eye, EyeOff, Github, Chrome, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";

export default function LoginPage() {
    const [form, setForm] = useState({ email: "", password: "" });
    const [showPw, setShowPw] = useState(false);
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const user = await login(form.email, form.password);
            toast.success(`Welcome back, ${user.full_name}! 👋`);
            if (user.role === "teacher") navigate("/teacher");
            else navigate("/student");
        } catch (err) {
            toast.error(err.response?.data?.detail || "Login failed. Check your credentials.");
        } finally {
            setLoading(false);
        }
    };

    const fillDemo = (role) => {
        const creds = {
            teacher: { email: "teacher@quizplatform.com", password: "Teacher@123" },
            student: { email: "student@quizplatform.com", password: "Student@123" },
        };
        setForm(creds[role]);
    };

    return (
        <div className="min-h-screen flex flex-col md:flex-row bg-bg-color overflow-hidden">
            {/* Left Side: Illustration & Text */}
            <motion.div
                initial={{ x: -100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.8, ease: "circOut" }}
                className="hidden md:flex md:w-1/2 bg-brand-primary relative p-12 flex-col justify-between overflow-hidden"
            >
                {/* Decorative Elements */}
                <div className="absolute top-0 left-0 w-full h-full">
                    <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-brand-secondary rounded-full blur-[120px] opacity-10" />
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
                        Master your <br />
                        <span className="text-brand-secondary">Academic goals</span>
                    </motion.h2>
                    <motion.p
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.5, duration: 0.6 }}
                        className="text-white/70 text-lg font-medium max-w-md"
                    >
                        Join thousands of students and teachers using AI to master new topics faster than ever.
                    </motion.p>
                </div>

                <div className="relative z-10 text-white/50 text-sm font-medium">
                    © 2026 QuizAI Platform. All rights reserved.
                </div>
            </motion.div>

            {/* Right Side: Login Form */}
            <div className="flex-1 flex items-center justify-center p-8 bg-surface-color relative">
                <Link to="/" className="absolute top-8 left-8 p-3 rounded-2xl bg-border-color/50 text-text-secondary hover:text-primary-color transition-colors md:hidden">
                    <ArrowLeft className="w-5 h-5" />
                </Link>

                <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="w-full max-w-md"
                >
                    <div className="mb-10">
                        <h1 className="text-4xl font-bold text-text-primary mb-2 tracking-tight">Welcome Back</h1>
                        <p className="text-text-secondary font-medium">Please enter your credentials to access your dashboard.</p>
                    </div>

                    {/* Social Login */}
                    <div className="grid grid-cols-2 gap-4 mb-8">
                        <button className="btn-secondary py-3 flex items-center justify-center gap-2">
                            <Chrome className="w-5 h-5" />
                            <span className="text-sm">Google</span>
                        </button>
                        <button className="btn-secondary py-3 flex items-center justify-center gap-2">
                            <Github className="w-5 h-5" />
                            <span className="text-sm">GitHub</span>
                        </button>
                    </div>

                    <div className="relative flex items-center justify-center mb-8">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-border-color"></div>
                        </div>
                        <span className="relative bg-surface-color px-4 text-xs font-black text-text-secondary uppercase tracking-widest leading-none">
                            Or continue with email
                        </span>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="text-xs font-black text-text-secondary uppercase tracking-widest pl-1 mb-2 block">Email Address</label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary" />
                                <input
                                    type="email"
                                    className="input pl-12"
                                    placeholder="name@company.com"
                                    value={form.email}
                                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <div className="flex justify-between items-center mb-2 px-1">
                                <label className="text-xs font-black text-text-secondary uppercase tracking-widest">Password</label>
                                <a href="#" className="text-xs font-bold text-brand-primary hover:underline">Forgot password?</a>
                            </div>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary" />
                                <input
                                    type={showPw ? "text" : "password"}
                                    className="input pl-12 pr-12"
                                    placeholder="••••••••"
                                    value={form.password}
                                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                                    required
                                />
                                <button type="button" className="absolute right-4 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary" onClick={() => setShowPw(!showPw)}>
                                    {showPw ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="btn-primary w-full py-4 text-lg"
                            disabled={loading}
                        >
                            {loading ? (
                                <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                "Sign In"
                            )}
                        </button>
                    </form>

                    {/* Quick Demo Login */}
                    <div className="mt-10 p-5 rounded-md bg-light-bg border border-border-color">
                        <p className="text-[10px] font-bold text-text-secondary uppercase tracking-widest mb-4">Quick demo access</p>
                        <div className="flex gap-2">
                            {["teacher", "student"].map((role) => (
                                <button key={role} onClick={() => fillDemo(role)}
                                    className="flex-1 text-[10px] font-bold py-2 rounded-md bg-surface-color border border-border-color text-text-secondary hover:border-brand-primary hover:text-brand-primary transition-all uppercase tracking-wider">
                                    {role}
                                </button>
                            ))}
                        </div>
                    </div>

                    <p className="text-center text-sm text-text-secondary mt-8 font-medium">
                        Don't have an account?{" "}
                        <Link to="/register" className="text-brand-primary hover:underline font-bold">
                            Create one for free
                        </Link>
                    </p>
                </motion.div>
            </div>
        </div>
    );
}
