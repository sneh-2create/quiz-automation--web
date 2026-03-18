import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Zap, Brain, Trophy, LineChart, Sparkles, ArrowRight, Play, GraduationCap } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function LandingPage() {
    const { user } = useAuth();

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.2 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 30 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
    };

    return (
        <div className="min-h-screen overflow-x-hidden">
            {/* Hero Section */}
            <section className="relative pt-32 pb-20 px-6 overflow-hidden">
                {/* Animated Background Gradients */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[1000px] bg-brand-primary/5 blur-[120px] rounded-full -z-10" />
                <div className="absolute top-1/4 right-0 w-[500px] h-[500px] bg-brand-secondary/5 blur-[100px] rounded-full -z-10" />

                <div className="max-w-7xl mx-auto text-center relative">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.8 }}
                        className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-primary/5 border border-brand-primary/20 text-brand-primary font-bold text-[10px] uppercase tracking-widest mb-8"
                    >
                        <GraduationCap className="w-3.5 h-3.5" />
                        Excellence in Academic Automation
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className="text-6xl md:text-7xl font-bold mb-8 leading-[1.1] tracking-tight text-text-primary"
                    >
                        Master Your Potential with <br />
                        <span className="bg-gradient-to-r from-brand-primary to-brand-secondary bg-clip-text text-transparent">
                            Intelligent Assessments
                        </span>
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.4 }}
                        className="text-text-secondary text-xl md:text-2xl max-w-3xl mx-auto mb-12 font-medium"
                    >
                        The smart way to learn. Generate personalized quizzes with AI, track your progress with advanced analytics, and climb the global leaderboard.
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.6 }}
                        className="flex flex-col md:flex-row items-center justify-center gap-6"
                    >
                        {user ? (
                            <Link to="/dashboard" className="btn-primary text-lg px-10 py-4 group">
                                Go to Dashboard
                                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </Link>
                        ) : (
                            <>
                                <Link to="/register" className="btn-primary text-lg px-10 py-4 group">
                                    Get Started Free
                                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </Link>
                                <Link to="/login" className="btn-secondary text-lg px-10 py-4 group">
                                    Learn More
                                    <Play className="w-5 h-5 fill-current" />
                                </Link>
                            </>
                        )}
                    </motion.div>
                </div>

                {/* Mockup Preview */}
                <motion.div
                    initial={{ opacity: 0, y: 100 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1, delay: 0.8 }}
                    className="max-w-5xl mx-auto mt-24 relative px-6"
                >
                    <div className="relative p-1 rounded-lg bg-border-color shadow-soft">
                        <div className="bg-surface-color rounded-md overflow-hidden border border-border-color aspect-video flex flex-col items-center justify-center relative group">
                            <Zap className="w-20 h-20 text-brand-primary opacity-20" />
                            <div className="absolute top-4 left-4 flex gap-2">
                                <div className="w-3 h-3 rounded-full bg-border-color" />
                                <div className="w-3 h-3 rounded-full bg-border-color" />
                                <div className="w-3 h-3 rounded-full bg-border-color" />
                            </div>
                            <div className="text-text-secondary font-semibold text-lg mt-4">Professional Assessment Dashboard</div>
                        </div>
                    </div>
                </motion.div>
            </section>

            {/* Features Grid */}
            <section className="py-24 px-6 relative">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-20">
                        <h2 className="text-4xl md:text-6xl font-black mb-6 text-text-primary">Why Students Choose QuizAI</h2>
                        <p className="text-text-secondary text-lg font-medium">Built for the next generation of high-performers.</p>
                    </div>

                    <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        className="grid md:grid-cols-2 lg:grid-cols-4 gap-8"
                    >
                        <FeatureCard
                            icon={<Brain className="w-8 h-8 text-brand-primary" />}
                            title="AI Generation"
                            desc="Drop a PDF or topic and get instant, high-quality MCQs."
                        />
                        <FeatureCard
                            icon={<Zap className="w-8 h-8 text-brand-secondary" />}
                            title="Gamification"
                            desc="Earn XP, climb streaks, and unlock epic badges."
                        />
                        <FeatureCard
                            icon={<LineChart className="w-8 h-8 text-brand-primary" />}
                            title="Analytics"
                            desc="Deep insights into your topic-wise mastery levels."
                        />
                        <FeatureCard
                            icon={<Trophy className="w-8 h-8 text-brand-secondary" />}
                            title="Leaderboards"
                            desc="Show off your skills and compete with friends."
                        />
                    </motion.div>
                </div>
            </section>
        </div>
    );
}

function FeatureCard({ icon, title, desc }) {
    return (
        <motion.div
            variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0 }
            }}
            className="card group hover:border-brand-primary/30"
        >
            <div className="w-12 h-12 rounded-md bg-surface-color border border-border-color flex items-center justify-center mb-6 transition-colors">
                {icon}
            </div>
            <h3 className="text-xl font-bold mb-3 text-text-primary tracking-tight">{title}</h3>
            <p className="text-text-secondary text-sm font-medium leading-relaxed">{desc}</p>
        </motion.div>
    );
}
