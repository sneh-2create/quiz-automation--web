import { useAuth } from "../context/AuthContext";
import { Bell, Search, Zap, Sparkles, Menu } from "lucide-react";
import ThemeToggle from "./ThemeToggle";

export default function Navbar({ toggleSidebar }) {
    const { user } = useAuth();

    const ROLE_LABELS = { admin: "Administrator", teacher: "Teacher", student: "Student" };

    return (
        <header className="h-20 bg-surface-color/50 backdrop-blur-xl border-b border-border-color px-4 md:px-8 flex items-center justify-between sticky top-0 z-30 transition-all duration-300">
            <div className="flex items-center gap-4">
                <button
                    onClick={toggleSidebar}
                    className="p-2.5 rounded-md bg-light-bg dark:bg-dark-border border border-border-color text-text-secondary hover:text-brand-primary hover:border-brand-primary transition-all duration-300 lg:hidden"
                >
                    <Menu className="w-5 h-5" />
                </button>
                <div className="flex flex-col">
                    <h1 className="font-bold text-text-primary text-base md:text-lg tracking-tight leading-none flex items-center gap-2">
                        Welcome back, {user?.full_name?.split(" ")[0]}!
                    </h1>
                    <p className="text-[10px] font-bold text-text-secondary uppercase tracking-widest mt-1.5 opacity-70">
                        {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
                    </p>
                </div>
            </div>

            <div className="flex items-center gap-6">
                {user?.role === "student" && (
                    <div className="hidden lg:flex items-center gap-4 bg-surface-color border border-border-color rounded-md px-4 py-2 group cursor-pointer transition-all duration-300">
                        <div className="flex items-center gap-2">
                            <Zap className="w-4 h-4 text-brand-secondary fill-brand-secondary" />
                            <span className="text-sm font-bold text-text-primary tracking-widest">{user?.xp_points || 0} XP</span>
                        </div>
                        <div className="w-[1px] h-4 bg-border-color" />
                        <div className="flex items-center gap-2 text-brand-primary">
                            <Sparkles className="w-4 h-4" />
                            <span className="text-sm font-bold tracking-widest uppercase">Level {user?.level || 1}</span>
                        </div>
                    </div>
                )}

                <div className="flex items-center gap-2">
                    <button className="p-2.5 rounded-md bg-surface-color border border-border-color text-text-secondary hover:text-brand-primary hover:border-brand-primary transition-all duration-300 relative">
                        <Bell className="w-5 h-5" />
                        <span className="absolute top-2 right-2 w-2 h-2 bg-brand-crimson rounded-full border-2 border-surface-color" />
                    </button>
                    <button className="p-2.5 rounded-md bg-surface-color border border-border-color text-text-secondary hover:text-brand-primary hover:border-brand-primary transition-all duration-300">
                        <Search className="w-5 h-5" />
                    </button>
                </div>

                <ThemeToggle />

                <div className="h-10 w-[1px] bg-border-color hidden sm:block" />

                <div className="flex items-center gap-3 group cursor-pointer">
                    <div className="flex flex-col items-end hidden sm:flex">
                        <span className="text-sm font-bold text-text-primary leading-none group-hover:text-brand-primary transition-colors">{user?.full_name}</span>
                        <span className="text-[10px] font-bold text-text-secondary uppercase tracking-widest mt-1 opacity-70">{ROLE_LABELS[user?.role]}</span>
                    </div>
                    <div className="w-10 h-10 rounded-md bg-brand-primary flex items-center justify-center text-white font-bold text-lg shadow-sm transition-transform duration-300 group-hover:scale-105">
                        {user?.full_name?.[0]?.toUpperCase()}
                    </div>
                </div>
            </div>
        </header>
    );
}
