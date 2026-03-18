import { useState } from "react";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import { motion } from "framer-motion";

export default function DashboardLayout({ children }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="flex min-h-screen bg-bg-color overflow-hidden">
            {/* Clean Background */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10 bg-bg-color" />

            <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

            <div className="flex-1 flex flex-col min-h-screen lg:ml-[280px] transition-all duration-500 ease-in-out">
                <Navbar toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
                <main className="flex-1 p-4 md:p-8 overflow-x-hidden">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        {children}
                    </motion.div>
                </main>
            </div>
        </div>
    );
}
