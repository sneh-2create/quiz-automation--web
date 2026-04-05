import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/useAuth";
import { getApiBaseUrl } from "../../api/client";
import { Zap, UserRound, Lock, Eye, EyeOff, Github, Chrome, ArrowLeft, AlertCircle, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";

const HIDE_DEMO = import.meta.env.VITE_HIDE_DEMO_LOGIN === "true";

export default function LoginPage() {
    const [loginMode, setLoginMode] = useState("student"); // student | staff
    const [form, setForm] = useState({ username: "", password: "" });
    const [showPw, setShowPw] = useState(false);
    const [loading, setLoading] = useState(false);
    const [apiReachable, setApiReachable] = useState(null);
    const { login } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        localStorage.removeItem("access_token");
        localStorage.removeItem("user");
    }, []);

    useEffect(() => {
        let cancelled = false;
        const base = getApiBaseUrl().replace(/\/$/, "");
        const tryPing = async (b) => {
            const u = `${b.replace(/\/$/, "")}/health`;
            const r = await fetch(u, { method: "GET", cache: "no-store", mode: "cors", credentials: "omit" });
            return r.ok;
        };
        (async () => {
            try {
                let ok = await tryPing(base);
                if (!ok && (base === "/api" || base.startsWith("/"))) {
                    ok =
                        (await tryPing("http://localhost:8000/api").catch(() => false)) ||
                        (await tryPing("http://127.0.0.1:8000/api").catch(() => false));
                }
                if (!cancelled) setApiReachable(ok);
            } catch {
                if (!cancelled) setApiReachable(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const portal = loginMode === "student" ? "student" : "staff";
            const user = await login(form.username, form.password, portal);
            const role = typeof user.role === "string" ? user.role : user.role?.value ?? user.role;
            toast.success(`Welcome back, ${user.full_name}! 👋`);
            if (role === "admin") navigate("/admin");
            else if (role === "teacher") navigate("/teacher");
            else navigate("/student");
        } catch (err) {
            const data = err.response?.data;
            const d = data?.detail ?? (typeof data === "string" ? data : null);
            const msg =
                typeof d === "string"
                    ? d
                    : Array.isArray(d)
                      ? d.map((x) => x.msg || JSON.stringify(x)).join(" · ")
                      : typeof err.message === "string" && err.message.length > 0
                        ? err.message
                        : "Login failed. Run the API from the backend folder: uvicorn main:app --host 0.0.0.0 --port 8000";
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    const fillDemo = (role) => {
        const creds = {
            admin: { username: "admin@quizplatform.com", password: "Admin@123" },
            teacher: { username: "teacher@quizplatform.com", password: "Teacher@123" },
            student: { username: "REG2026DEMO", password: "Student@123" },
        };
        setForm(creds[role]);
        if (role === "student") setLoginMode("student");
        else setLoginMode("staff");
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
                        <p className="text-text-secondary font-medium">
                            Use the <strong>Student</strong> or <strong>Teacher / Admin</strong> tab so accounts only open in the correct area
                            (staff cannot use the student screen, and students cannot use the staff screen).
                        </p>
                        {apiReachable === false && (
                            <div className="mt-4 p-4 rounded-xl border border-red-500/40 bg-red-500/10 text-sm text-text-primary flex gap-3 items-start">
                                <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                                <div className="space-y-2">
                                    <p className="font-bold text-red-600 dark:text-red-400">Cannot reach the API</p>
                                    <p className="text-text-secondary text-xs leading-relaxed">
                                        This is <strong>not</strong> a wrong password — the browser cannot talk to the server on port{" "}
                                        <strong>8000</strong>. Quick check: open{" "}
                                        <a
                                            href="http://localhost:8000/docs"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-brand-primary font-semibold underline"
                                        >
                                            localhost:8000/docs
                                        </a>{" "}
                                        — if that page does not load, the API is not running.
                                    </p>
                                    <p className="text-text-secondary text-xs font-semibold text-text-primary pt-1">
                                        Easiest fix (project root folder{" "}
                                        <code className="text-[10px] bg-border-color/50 px-1 rounded">quiz-automation-platform</code>
                                        , not inside <code className="text-[10px] bg-border-color/50 px-1 rounded">frontend</code>):
                                    </p>
                                    <pre className="text-[11px] bg-bg-color p-3 rounded-lg border border-border-color overflow-x-auto whitespace-pre-wrap">
                                        npm install{"\n"}
                                        npm run dev
                                    </pre>
                                    <p className="text-[11px] text-text-secondary">
                                        That starts <strong>both</strong> the API and the website. Or run the API alone from{" "}
                                        <code className="text-[10px] bg-border-color/50 px-1 rounded">backend</code>:{" "}
                                        <code className="text-[10px] bg-border-color/50 px-1 rounded">uvicorn main:app --reload --host 0.0.0.0 --port 8000</code>
                                    </p>
                                    <p className="text-[11px] text-text-secondary">
                                        Use the exact URL Vite prints (often <strong>5174</strong> if 5173 is busy).                                         Student demo: <strong>REG2026DEMO</strong> / Student@123 on the Student tab.
                                    </p>
                                </div>
                            </div>
                        )}
                        {apiReachable === true && (
                            <div className="mt-4 p-3 rounded-xl border border-green-500/30 bg-green-500/10 text-xs text-text-secondary flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                                API is reachable — you can sign in (demo shortcuts appear below when enabled).
                            </div>
                        )}
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

                    <div className="grid grid-cols-2 gap-2 mb-8 p-1 rounded-xl bg-border-color/30 border border-border-color">
                        <button
                            type="button"
                            onClick={() => setLoginMode("student")}
                            className={`py-3 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${
                                loginMode === "student"
                                    ? "bg-surface-color text-brand-primary shadow-sm border border-border-color"
                                    : "text-text-secondary hover:text-text-primary"
                            }`}
                        >
                            Student
                        </button>
                        <button
                            type="button"
                            onClick={() => setLoginMode("staff")}
                            className={`py-3 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${
                                loginMode === "staff"
                                    ? "bg-surface-color text-brand-primary shadow-sm border border-border-color"
                                    : "text-text-secondary hover:text-text-primary"
                            }`}
                        >
                            Teacher / Admin
                        </button>
                    </div>

                    <div className="relative flex items-center justify-center mb-8">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-border-color"></div>
                        </div>
                        <span className="relative bg-surface-color px-4 text-xs font-black text-text-secondary uppercase tracking-widest leading-none">
                            Or continue with account
                        </span>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="text-xs font-black text-text-secondary uppercase tracking-widest pl-1 mb-2 block">
                                {loginMode === "staff"
                                    ? "Work email"
                                    : "Registration ID, email, or mobile"}
                            </label>
                            <div className="relative">
                                <UserRound className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary" />
                                <input
                                    type="text"
                                    className="input pl-12"
                                    placeholder={
                                        loginMode === "staff"
                                            ? "you@school.edu"
                                            : "College ID, your registered email, or phone"
                                    }
                                    autoComplete="username"
                                    value={form.username}
                                    onChange={(e) => setForm({ ...form, username: e.target.value })}
                                    required
                                />
                            </div>
                            <p className="text-[10px] text-text-secondary mt-2 pl-1 leading-relaxed">
                                {loginMode === "staff"
                                    ? "Teachers and platform admins sign in here only."
                                    : "We store your email and phone at registration for the event. You can sign in with registration ID, that email, or the same mobile number. Your participant code is for check-in on the dashboard — not for this field."}
                            </p>
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

                    {/* Quick Demo Login — hidden for production live events (VITE_HIDE_DEMO_LOGIN=true) */}
                    {!HIDE_DEMO && (
                        <div className="mt-10 p-5 rounded-md bg-light-bg border border-border-color space-y-4">
                            <p className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">Quick demo (local only)</p>
                            <div className="flex flex-wrap gap-2">
                                {loginMode === "student" ? (
                                    <button
                                        type="button"
                                        onClick={() => fillDemo("student")}
                                        className="flex-1 min-w-[4.5rem] text-[10px] font-bold py-2 rounded-md bg-surface-color border border-border-color text-text-secondary hover:border-brand-primary hover:text-brand-primary transition-all uppercase tracking-wider"
                                    >
                                        student
                                    </button>
                                ) : (
                                    ["admin", "teacher"].map((role) => (
                                        <button
                                            key={role}
                                            type="button"
                                            onClick={() => fillDemo(role)}
                                            className="flex-1 min-w-[4.5rem] text-[10px] font-bold py-2 rounded-md bg-surface-color border border-border-color text-text-secondary hover:border-brand-primary hover:text-brand-primary transition-all uppercase tracking-wider"
                                        >
                                            {role}
                                        </button>
                                    ))
                                )}
                            </div>
                            <div className="text-[11px] text-text-secondary space-y-1.5 border-t border-border-color pt-3 font-mono leading-relaxed">
                                <p className="font-sans font-bold text-text-primary text-xs mb-1">Exact demo sign-in</p>
                                {loginMode === "student" ? (
                                    <p>
                                        <span className="text-text-primary font-sans font-semibold">Student</span> — Student tab — REG2026DEMO / Student@123
                                    </p>
                                ) : (
                                    <>
                                        <p>
                                            <span className="text-text-primary font-sans font-semibold">Admin</span> — Teacher/Admin tab — admin@quizplatform.com / Admin@123
                                        </p>
                                        <p>
                                            <span className="text-text-primary font-sans font-semibold">Teacher</span> — Teacher/Admin tab — teacher@quizplatform.com / Teacher@123
                                        </p>
                                    </>
                                )}
                                <p className="font-sans text-[10px] text-text-secondary pt-1">
                                    Set <code className="text-[10px] bg-border-color/50 px-1 rounded">VITE_HIDE_DEMO_LOGIN=true</code> to hide this block for real events.
                                </p>
                            </div>
                        </div>
                    )}

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
