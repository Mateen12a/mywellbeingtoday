import { motion } from "framer-motion";
import { Users, Globe, Target, Rocket } from "lucide-react";

const stats = [
  {
    icon: Rocket,
    value: "Just Launched",
    label: "New Platform",
    description: "Be among the first to join",
  },
  {
    icon: Users,
    value: "Growing",
    label: "Community",
    description: "Health professionals joining daily",
  },
  {
    icon: Globe,
    value: "Global",
    label: "Reach",
    description: "Connecting experts worldwide",
  },
  {
    icon: Target,
    value: "100%",
    label: "Commitment",
    description: "To quality and impact",
  },
];

export default function Stats() {
  return (
    <section className="py-20 bg-gradient-to-r from-[var(--color-primary)] via-[#2a4a8f] to-[var(--color-primary)] relative overflow-hidden">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-[var(--color-accent)] rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Join Our Growing Global Health Community
          </h2>
          <p className="text-white/70 text-lg max-w-2xl mx-auto">
            Be part of a new movement connecting health professionals and organisations to make a real difference in global health.
          </p>
        </motion.div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="text-center group"
            >
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-sm mb-4 group-hover:scale-110 transition-transform duration-300">
                <stat.icon size={28} className="text-white" />
              </div>
              <div className="text-2xl md:text-3xl font-bold text-white mb-2">
                {stat.value}
              </div>
              <div className="text-white font-semibold mb-1">
                {stat.label}
              </div>
              <div className="text-white/60 text-sm">
                {stat.description}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
