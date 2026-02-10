import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Globe, Users, Heart, Target, Award, ArrowRight } from "lucide-react";
import Navbar from "../../components/Navbar";
import Footer from "../../components/landing/Footer";

const values = [
  {
    icon: Globe,
    title: "Global Impact",
    description: "We connect health professionals across borders to solve the world's most pressing health challenges."
  },
  {
    icon: Users,
    title: "Collaboration",
    description: "We believe in the power of partnerships between organisations and skilled professionals."
  },
  {
    icon: Heart,
    title: "Commitment to Health",
    description: "Every project on our platform contributes to improving health outcomes for communities worldwide."
  },
  {
    icon: Target,
    title: "Quality & Excellence",
    description: "We maintain high standards by vetting all professionals and ensuring project success."
  }
];

const stats = [
  { value: "30+", label: "Countries Targeted" },
  { value: "Growing", label: "Professional Network" },
  { value: "Launching", label: "Platform Status" },
  { value: "Unlimited", label: "Impact Potential" }
];

export default function About() {
  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <Navbar />
      
      <main className="pt-24 pb-16">
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <span className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-[var(--color-primary-light)]/10 text-[var(--color-primary-light)] text-sm font-semibold mb-6">
              <Globe size={16} />
              About Us
            </span>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-[var(--color-text)] mb-6">
              Transforming Global Health Through <span className="bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-primary-light)] bg-clip-text text-transparent">Collaboration</span>
            </h1>
            <p className="text-xl text-[var(--color-text-secondary)] max-w-3xl mx-auto leading-relaxed">
              GlobalHealth.Works is the premier marketplace connecting global health organisations with skilled professionals to tackle the world's most pressing health challenges.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-3xl p-8 md:p-12 mb-16"
          >
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl font-bold text-[var(--color-text)] mb-6">Our Mission</h2>
                <p className="text-[var(--color-text-secondary)] mb-6 leading-relaxed">
                  We believe that the world's health challenges require the best minds working together. Our platform breaks down barriers between organisations needing expertise and professionals ready to make a difference.
                </p>
                <p className="text-[var(--color-text-secondary)] leading-relaxed">
                  Whether it's disease surveillance, health system strengthening, or community health initiatives, we connect the right people with the right opportunities to create lasting impact.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {stats.map((stat, index) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4, delay: 0.3 + index * 0.1 }}
                    className="bg-gradient-to-br from-[var(--color-bg-secondary)] to-[var(--color-bg)] rounded-2xl p-6 text-center"
                  >
                    <p className="text-3xl font-bold bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-light)] bg-clip-text text-transparent mb-1">
                      {stat.value}
                    </p>
                    <p className="text-sm text-[var(--color-text-secondary)]">{stat.label}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mb-16"
          >
            <h2 className="text-3xl font-bold text-[var(--color-text)] text-center mb-12">Our Values</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {values.map((value, index) => (
                <motion.div
                  key={value.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.4 + index * 0.1 }}
                  className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6 hover:shadow-lg transition-shadow"
                >
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-light)] flex items-center justify-center text-white mb-4">
                    <value.icon size={24} />
                  </div>
                  <h3 className="text-lg font-bold text-[var(--color-text)] mb-2">{value.title}</h3>
                  <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">{value.description}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-light)] rounded-3xl p-8 md:p-12 text-center text-white"
          >
            <Award size={48} className="mx-auto mb-6 opacity-80" />
            <h2 className="text-3xl font-bold mb-4">Join Our Growing Community</h2>
            <p className="text-white/80 max-w-2xl mx-auto mb-8 leading-relaxed">
              Whether you're an organisation looking for expertise or a professional ready to make an impact, there's a place for you at GlobalHealth.Works.
            </p>
            <Link
              to="/signup"
              className="inline-flex items-center gap-2 bg-white text-[var(--color-primary)] px-8 py-4 rounded-xl font-semibold hover:bg-white/90 transition-colors"
            >
              Get Started Today
              <ArrowRight size={18} />
            </Link>
          </motion.div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
