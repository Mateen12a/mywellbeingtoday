import { motion } from "framer-motion";
import { 
  Shield, 
  MessageSquare, 
  FileCheck, 
  Bell, 
  BarChart3,
  Lock,
  Globe,
  Users,
  Zap
} from "lucide-react";

const features = [
  {
    icon: Shield,
    title: "Verified Professionals",
    description: "All solution providers undergo a thorough verification process to ensure quality and expertise.",
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
  },
  {
    icon: MessageSquare,
    title: "Real-time Messaging",
    description: "Communicate directly with task owners or solution providers through our secure messaging system.",
    color: "text-green-500",
    bgColor: "bg-green-500/10",
  },
  {
    icon: FileCheck,
    title: "Proposal Management",
    description: "Submit detailed proposals and track their status with our intuitive management tools.",
    color: "text-purple-500",
    bgColor: "bg-purple-500/10",
  },
  {
    icon: Bell,
    title: "Smart Notifications",
    description: "Stay updated with real-time notifications about proposals, messages, and task updates.",
    color: "text-pink-500",
    bgColor: "bg-pink-500/10",
  },
  {
    icon: BarChart3,
    title: "Performance Analytics",
    description: "Track your progress, ratings, and impact with comprehensive analytics dashboards.",
    color: "text-cyan-500",
    bgColor: "bg-cyan-500/10",
  },
  {
    icon: Globe,
    title: "Global Reach",
    description: "Connect with health professionals and organizations across 50+ countries worldwide.",
    color: "text-orange-500",
    bgColor: "bg-orange-500/10",
  },
];

const highlights = [
  { icon: Lock, text: "End-to-end encryption" },
  { icon: Globe, text: "Global accessibility" },
  { icon: Users, text: "Collaborative workspace" },
  { icon: Zap, text: "Lightning-fast matching" },
];

export default function Features() {
  return (
    <section className="py-24 md:py-32 bg-[var(--color-bg-secondary)] relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-1/2 left-0 w-72 h-72 bg-gradient-to-r from-[var(--color-primary-light)]/10 to-transparent rounded-full blur-3xl -translate-y-1/2" />
      <div className="absolute top-1/2 right-0 w-72 h-72 bg-gradient-to-l from-[var(--color-accent)]/10 to-transparent rounded-full blur-3xl -translate-y-1/2" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-[var(--color-accent)]/10 text-[var(--color-accent)] text-sm font-semibold mb-4">
            Platform Features
          </span>
          <h2 className="text-4xl md:text-5xl font-bold text-[var(--color-text)] mb-6">
            Everything You Need to <span className="bg-gradient-to-r from-[var(--color-primary-light)] to-[var(--color-accent)] bg-clip-text text-transparent">Succeed</span>
          </h2>
          <p className="text-xl text-[var(--color-text-secondary)] max-w-3xl mx-auto">
            Powerful tools and features designed specifically for global health collaboration, from secure messaging to comprehensive project management.
          </p>
        </motion.div>

        {/* Features grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="group"
            >
              <div className="bg-[var(--color-surface)] rounded-2xl p-8 h-full border border-[var(--color-border)] hover:border-[var(--color-primary-light)]/30 hover:shadow-xl hover:shadow-[var(--color-primary)]/5 transition-all duration-300 group-hover:-translate-y-1">
                <div className={`w-14 h-14 rounded-xl ${feature.bgColor} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon size={26} className={feature.color} />
                </div>
                <h3 className="text-xl font-bold text-[var(--color-text)] mb-3">
                  {feature.title}
                </h3>
                <p className="text-[var(--color-text-secondary)] leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Highlights bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-light)] rounded-2xl p-8 md:p-10"
        >
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-16">
            {highlights.map((highlight, index) => (
              <div key={index} className="flex items-center gap-3 text-white">
                <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
                  <highlight.icon size={20} />
                </div>
                <span className="font-medium">{highlight.text}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
