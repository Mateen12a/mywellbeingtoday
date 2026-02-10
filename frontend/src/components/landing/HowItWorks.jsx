import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { UserPlus, FileSearch, Handshake, Trophy, ArrowRight, CheckCircle, Users, Briefcase, Search } from "lucide-react";

const steps = [
  {
    icon: UserPlus,
    title: "Join the Community",
    description: "Choose your role: Post tasks as an Owner or solve tasks as a Provider.",
    details: ["Complete your professional profile", "Add qualifications and experience", "Get verified by our team"],
    color: "from-blue-500 to-blue-600",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/20",
  },
  {
    icon: FileSearch,
    title: "Create / Apply",
    description: "Owners create tasks. Providers apply to work on tasks.",
    details: ["Search by expertise area", "Filter by location and budget", "View detailed task requirements"],
    color: "from-orange-500 to-orange-600",
    bgColor: "bg-orange-500/10",
    borderColor: "border-orange-500/20",
  },
  {
    icon: Handshake,
    title: "Match & Collaborate",
    description: "Smart matching connects the right people to the right tasks.",
    details: ["Send tailored proposals", "Real-time messaging", "Share documents securely"],
    color: "from-green-500 to-green-600",
    bgColor: "bg-green-500/10",
    borderColor: "border-green-500/20",
  },
  {
    icon: Trophy,
    title: "Deliver & Feedback",
    description: "Work is delivered, feedback collected, and impact measured.",
    details: ["Track project milestones", "Receive feedback and ratings", "Build your portfolio"],
    color: "from-purple-500 to-purple-600",
    bgColor: "bg-purple-500/10",
    borderColor: "border-purple-500/20",
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 md:py-32 bg-gradient-to-b from-[var(--color-bg)] to-[var(--color-bg-secondary)] relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-[var(--color-primary-light)]/5 to-transparent rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-br from-[var(--color-accent)]/5 to-transparent rounded-full blur-3xl" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-5"
        >
          {/* <span className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-[var(--color-primary-light)]/10 text-[var(--color-primary-light)] text-sm font-semibold mb-6">
            <span className="w-2 h-2 rounded-full bg-[var(--color-primary-light)] animate-pulse" />
            Simple 4-Step Process
          </span> */}
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-[var(--color-text)] mb-16">
            How It <span className="bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-primary-light)] bg-clip-text text-transparent">Works</span>
          </h2>
          {/* <p className="text-xl text-[var(--color-text-secondary)] max-w-3xl mx-auto leading-relaxed">
            Get started in minutes. Our streamlined process makes it easy to connect, collaborate, and create meaningful impact in global health.
          </p> */}
        </motion.div>

        {/* Steps grid */}
        <div className="grid lg:grid-cols-4 gap-8 mb-5">
          {steps.map((step, index) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.15 }}
              className="relative group"
            >
              {/* Connector line */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-16 left-[calc(100%+1rem)] w-[calc(100%-2rem)] h-0.5 bg-gradient-to-r from-[var(--color-border)] to-transparent z-0">
                  <ArrowRight size={16} className="absolute right-0 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
                </div>
              )}
              
              <div className={`relative bg-[var(--color-surface)] border ${step.borderColor} rounded-3xl p-8 h-full hover:shadow-2xl hover:shadow-[var(--color-primary)]/5 transition-all duration-500 group-hover:-translate-y-2`}>
                {/* Step number badge */}
                <div className="absolute -top-4 -right-4 w-10 h-10 rounded-full bg-gradient-to-br from-[var(--color-surface)] to-[var(--color-bg-secondary)] border-2 border-[var(--color-border)] flex items-center justify-center text-lg font-bold text-[var(--color-text)] shadow-lg">
                  {index + 1}
                </div>
                
                {/* Icon */}
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center text-white mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  <step.icon size={28} />
                </div>
                
                <h3 className="text-xl font-bold text-[var(--color-text)] mb-3">
                  {step.title}
                </h3>
                
                <p className="text-[var(--color-text-secondary)] mb-6 leading-relaxed">
                  {step.description}
                </p>
                
                {/* Detail checklist */}
                {/* <ul className="space-y-2">
                  {step.details.map((detail, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
                      <CheckCircle size={14} className={`text-${step.color.includes('blue') ? 'blue' : step.color.includes('orange') ? 'orange' : step.color.includes('green') ? 'green' : 'purple'}-500 flex-shrink-0`} />
                      <span>{detail}</span>
                    </li>
                  ))}
                </ul> */}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Role-based CTAs */}
        {/* <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mb-16"
        >
          <h3 className="text-2xl font-bold text-[var(--color-text)] text-center mb-8">
            Choose Your Path
          </h3>
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <Link to="/signup?role=TO">
              <motion.div
                whileHover={{ scale: 1.02, y: -4 }}
                whileTap={{ scale: 0.98 }}
                className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6 text-center hover:shadow-xl hover:border-[var(--color-primary-light)] transition-all cursor-pointer group"
              >
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-light)] flex items-center justify-center text-white mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <Briefcase size={24} />
                </div>
                <h4 className="text-lg font-bold text-[var(--color-text)] mb-2">For Task Owners</h4>
                <p className="text-sm text-[var(--color-text-secondary)] mb-4">
                  Post tasks and find qualified health professionals for your projects
                </p>
                <span className="inline-flex items-center gap-1 text-[var(--color-primary-light)] font-medium text-sm group-hover:gap-2 transition-all">
                  Get Started <ArrowRight size={14} />
                </span>
              </motion.div>
            </Link>
            
            <Link to="/signup?role=SP">
              <motion.div
                whileHover={{ scale: 1.02, y: -4 }}
                whileTap={{ scale: 0.98 }}
                className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6 text-center hover:shadow-xl hover:border-[var(--color-accent)] transition-all cursor-pointer group"
              >
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[var(--color-accent)] to-[var(--color-accent-light)] flex items-center justify-center text-white mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <Users size={24} />
                </div>
                <h4 className="text-lg font-bold text-[var(--color-text)] mb-2">For Solution Providers</h4>
                <p className="text-sm text-[var(--color-text-secondary)] mb-4">
                  Apply your expertise to impactful global health opportunities
                </p>
                <span className="inline-flex items-center gap-1 text-[var(--color-accent)] font-medium text-sm group-hover:gap-2 transition-all">
                  Get Started <ArrowRight size={14} />
                </span>
              </motion.div>
            </Link>
            
            <Link to="/browse-tasks">
              <motion.div
                whileHover={{ scale: 1.02, y: -4 }}
                whileTap={{ scale: 0.98 }}
                className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6 text-center hover:shadow-xl hover:border-green-500 transition-all cursor-pointer group"
              >
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center text-white mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <Search size={24} />
                </div>
                <h4 className="text-lg font-bold text-[var(--color-text)] mb-2">Browse Tasks</h4>
                <p className="text-sm text-[var(--color-text-secondary)] mb-4">
                  Explore available opportunities in global health
                </p>
                <span className="inline-flex items-center gap-1 text-green-500 font-medium text-sm group-hover:gap-2 transition-all">
                  View Tasks <ArrowRight size={14} />
                </span>
              </motion.div>
            </Link>
          </div>
        </motion.div> */}

        {/* Bottom CTA */}
        {/* <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="text-center"
        >
          <p className="text-[var(--color-text-secondary)] mb-6">
            Ready to get started? Join thousands of health professionals making a difference.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/signup">
              <motion.span
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="inline-flex items-center gap-2 btn-primary text-lg px-8 py-4"
              >
                Get Started Free
                <ArrowRight size={18} />
              </motion.span>
            </Link>
            <a 
              href="#testimonials"
              className="text-[var(--color-primary-light)] font-semibold hover:underline"
            >
              Read success stories
            </a>
          </div>
        </motion.div> */}
      </div>
    </section>
  );
}
