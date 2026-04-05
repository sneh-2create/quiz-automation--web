import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { usePlatform } from "../context/PlatformContext";
import { motion, AnimatePresence } from "framer-motion";
import {
    Zap, LayoutDashboard, BookOpen, Database, BarChart2,
    LogOut, ChevronLeft, ChevronRight, Trophy, Shield,
    ClipboardList, UserPlus,
} from "lucide-react";

const NAV_BY_ROLE = {
    admin: [
        { label: "Platform analytics", icon: BarChart2, path: "/admin/analytics" },
        { label: "Platform settings", icon: Shield, path: "/admin" },
    ],
    teacher: [
        { label: "Analytics", icon: BarChart2, path: "/teacher/analytics" },
        { label: "Overview", icon: LayoutDashboard, path: "/teacher" },
        { label: "Quiz Lab", icon: BookOpen, path: "/teacher/quiz/create" },
        { label: "Questions", icon: Database, path: "/teacher/questions" },
        { label: "Import students", icon: UserPlus, path: "/teacher/students/import" },
    ],
};

const STUDENT_NAV_BASE = [
    { label: "Overview", icon: LayoutDashboard, path: "/student" },
    { label: "Live Quizzes", icon: ClipboardList, path: "/student/quizzes" },
    { label: "Leaderboard", icon: Trophy, path: "/student/leaderboard" },
];
const STUDENT_ANALYTICS_ITEM = { label: "My Stats", icon: BarChart2, path: "/student/analytics" };

export default function Sidebar({ isOpen, setIsOpen }) {
    const { user, logout } = useAuth();
    const { studentAnalyticsEnabled } = usePlatform();
    const location = useLocation();
    const navigate = useNavigate();
    const [collapsed, setCollapsed] = useState(false);

    let navItems = NAV_BY_ROLE[user?.role] || [];
    if (user?.role === "student") {
        navItems = [
            ...STUDENT_NAV_BASE,
            ...(studentAnalyticsEnabled ? [STUDENT_ANALYTICS_ITEM] : []),
        ];
    }

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    const ROLE_THEME = {
        admin: "text-brand-primary bg-brand-surface border-brand-primary/20",
        teacher: "text-brand-primary bg-brand-surface border-brand-primary/20",
        student: "text-brand-primary bg-brand-surface border-brand-primary/20",
    };

    return (
        <>
            {/* Mobile Overlay */}
            {isOpen && (
                <div 
                    className="fixed inset-0 bg-black/50 z-30 lg:hidden backdrop-blur-sm transition-opacity"
                    onClick={() => setIsOpen(false)}
                />
            )}

            <motion.aside
                initial={false}
                animate={{ width: collapsed ? 80 : 280 }}
                className={`fixed top-0 left-0 h-full bg-surface-color/80 backdrop-blur-xl border-r border-border-color flex flex-col z-40 transition-transform duration-300 ease-in-out lg:translate-x-0 ${
                    isOpen ? "translate-x-0" : "-translate-x-full"
                }`}
            >
            {/* Logo */}
            <div className={`flex items-center gap-4 px-6 h-20 border-b border-border-color/50 ${collapsed ? "justify-center px-0" : ""}`}>
                <div className="w-10 h-10 rounded-md bg-brand-primary flex items-center justify-center flex-shrink-0 cursor-pointer transition-transform duration-300">
                    <Zap className="w-5 h-5 text-white fill-current" />
                </div>
                {!collapsed && (
                    <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex flex-col"
                    >
                        <span className="font-bold text-text-primary text-xl leading-none tracking-tight">QuizAI</span>
                        <span className="text-[10px] font-bold text-brand-secondary uppercase tracking-widest mt-0.5">Academic Edition</span>
                    </motion.div>
                )}
            </div>

            {/* Nav */}
            <nav className="flex-1 px-4 py-8 space-y-2 overflow-y-auto">
                <AnimatePresence>
                    {navItems.map(({ label, icon: Icon, path }) => {
                        const isActive =
                            user?.role === "admin"
                                ? location.pathname === path
                                : location.pathname === path ||
                                  (path !== "/" + user?.role && location.pathname.startsWith(path));
                        return (
                            <Link
                                key={path}
                                to={path}
                                onClick={() => { if (setIsOpen) setIsOpen(false); }}
                                className={`flex items-center gap-3 px-4 py-3 rounded-md transition-all duration-300 group relative ${isActive
                                    ? "bg-brand-surface text-brand-primary"
                                    : "text-text-secondary hover:bg-bg-color hover:text-text-primary"
                                    } ${collapsed ? "justify-center px-0" : ""}`}
                            >
                                <Icon className={`w-[20px] h-[20px] flex-shrink-0 transition-all duration-300 ${isActive ? "text-brand-primary" : "group-hover:scale-110"
                                    }`} />
                                {!collapsed && (
                                    <motion.span
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="text-sm font-black tracking-tight"
                                    >
                                        {label}
                                    </motion.span>
                                )}
                                {isActive && !collapsed && (
                                    <motion.div
                                        layoutId="active-pill"
                                        className="ml-auto w-1 h-4 rounded-full bg-brand-primary"
                                    />
                                )}
                            </Link>
                        );
                    })}
                </AnimatePresence>
            </nav>

            {/* User section */}
            <div className={`px-4 py-6 border-t border-border-color/50 ${collapsed ? "flex flex-col items-center" : ""}`}>

                <button
                    onClick={handleLogout}
                    className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl w-full text-text-secondary hover:text-red-500 hover:bg-red-500/10 transition-all duration-300 ${collapsed ? "justify-center px-0" : ""}`}
                >
                    <LogOut className="w-5 h-5 flex-shrink-0" />
                    {!collapsed && <span className="text-sm font-black">Sign Out</span>}
                </button>
            </div>

            {/* Collapse toggle */}
            <button
                onClick={() => setCollapsed(!collapsed)}
                className="absolute top-24 -right-4 w-8 h-8 rounded-md bg-surface-color border border-border-color text-text-secondary hover:text-brand-primary flex items-center justify-center transition-all shadow-soft z-50 hover:scale-110"
            >
                {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
        </motion.aside>
        </>
    );
}
