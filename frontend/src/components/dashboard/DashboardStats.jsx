import { motion } from "framer-motion";
import { ClipboardCheck, Clock, Target, Briefcase, TrendingUp } from "lucide-react";

export default function DashboardStats({ stats }) {
  const statConfig = {
    total: { icon: ClipboardCheck, gradient: "from-[var(--color-primary)] to-[var(--color-primary-light)]" },
    inProgress: { icon: Clock, gradient: "from-amber-500 to-yellow-400" },
    completed: { icon: Target, gradient: "from-emerald-500 to-green-400" },
    active: { icon: Briefcase, gradient: "from-[var(--color-accent)] to-orange-400" },
  };

  const container = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.1 },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    visible: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: { type: "spring", stiffness: 100, damping: 15 } 
    },
  };

  return (
    <motion.div
      className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8"
      variants={container}
      initial="hidden"
      animate="visible"
    >
      {stats.map(({ label, value, type }, index) => {
        const config = statConfig[type] || statConfig.total;
        const Icon = config.icon;
        return (
          <motion.div
            key={label}
            variants={item}
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
            className="card p-5 relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 w-24 h-24 opacity-10 group-hover:opacity-20 transition-opacity">
              <div className={`w-full h-full bg-gradient-to-br ${config.gradient} rounded-full transform translate-x-8 -translate-y-8`} />
            </div>
            
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-medium text-[var(--color-text-secondary)]">{label}</h4>
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${config.gradient} flex items-center justify-center shadow-lg`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
              </div>
              <div className="flex items-end gap-2">
                <p className="text-3xl font-bold text-[var(--color-text)]">{value}</p>
                {value > 0 && (
                  <span className="flex items-center gap-1 text-xs text-emerald-500 font-medium mb-1">
                    <TrendingUp className="w-3 h-3" />
                    Active
                  </span>
                )}
              </div>
            </div>
          </motion.div>
        );
      })}
    </motion.div>
  );
}
