import { useState, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';

export default function ThemeToggle() {
    const [dark, setDark] = useState(true); // Default to dark mode

    useEffect(() => {
        const isDark = localStorage.getItem('theme') !== 'light';
        setDark(isDark);
        if (isDark) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, []);

    const toggle = () => {
        const newDark = !dark;
        setDark(newDark);
        if (newDark) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    };

    return (
        <button
            onClick={toggle}
            className="p-3 rounded-2xl bg-brand-violet/10 border border-brand-violet/20 
                 hover:bg-brand-violet/20 hover:scale-110 active:scale-95 transition-all 
                 duration-300 group shadow-neon"
            aria-label="Toggle Theme"
        >
            {dark ? (
                <Sun className="w-5 h-5 text-brand-cyan group-hover:rotate-45 transition-transform duration-500" />
            ) : (
                <Moon className="w-5 h-5 text-brand-indigo group-hover:-rotate-12 transition-transform duration-500" />
            )}
        </button>
    );
}
