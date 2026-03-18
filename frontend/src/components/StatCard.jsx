import { motion } from "framer-motion";

export default function StatCard({
    icon: Icon,
    title,
    value,
    trend,
    color = "brand-primary"
}) {
    return (
        <motion.div
            whileHover={{ y: -2, transition: { duration: 0.2 } }}
            className="card relative overflow-hidden flex flex-col justify-between"
        >
            <div className="flex items-start justify-between">
                <div className={`w-10 h-10 rounded-md bg-${color}/10 flex items-center justify-center text-${color} border border-${color}/20`}>
                    <Icon className="w-5 h-5" />
                </div>
                {trend && (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${trend.startsWith('+') ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50'}`}>
                        {trend}
                    </span>
                )}
            </div>

            <div className="mt-4">
                <h3 className="text-[10px] font-bold text-text-secondary uppercase tracking-widest leading-none mb-1">{title}</h3>
                <p className="text-2xl font-bold text-text-primary tracking-tight">{value}</p>
            </div>

            {/* Minimal decorator */}
            <div className={`absolute top-0 right-0 w-1 h-full bg-${color}/20`} />
        </motion.div>
    );
}
