import { motion } from "framer-motion";
import { Shield, Lock, Eye, Database, UserCheck, FileText } from "lucide-react";
import Navbar from "../../components/Navbar";
import Footer from "../../components/landing/Footer";

const sections = [
  {
    icon: Database,
    title: "Information We Collect",
    content: [
      "Personal information you provide during registration (name, email, professional details)",
      "Profile information including qualifications, expertise areas, and work history",
      "Communications through our messaging system",
      "Usage data and analytics to improve our platform",
      "Payment information for transactions (processed securely by our payment partners)"
    ]
  },
  {
    icon: Eye,
    title: "How We Use Your Information",
    content: [
      "To create and manage your account on GlobalHealth.Works",
      "To match you with relevant opportunities or professionals",
      "To facilitate communication between task owners and solution providers",
      "To send important updates about your account and the platform",
      "To improve and personalise your experience on our platform"
    ]
  },
  {
    icon: Lock,
    title: "Information Security",
    content: [
      "We use industry-standard encryption to protect your data",
      "Access to personal information is restricted to authorised personnel",
      "Regular security audits and vulnerability assessments",
      "Secure data centres with physical and digital protection",
      "Two-factor authentication options for account security"
    ]
  },
  {
    icon: UserCheck,
    title: "Your Rights",
    content: [
      "Access your personal data at any time through your profile",
      "Request correction of inaccurate information",
      "Request deletion of your account and associated data",
      "Opt out of marketing communications",
      "Export your data in a portable format"
    ]
  },
  {
    icon: FileText,
    title: "Data Retention",
    content: [
      "We retain your data for as long as your account is active",
      "Deleted accounts are purged within 30 days",
      "Some data may be retained for legal compliance",
      "Anonymised data may be used for research and analytics",
      "You can request immediate deletion by contacting support"
    ]
  }
];

export default function Privacy() {
  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <Navbar />
      
      <main className="pt-24 pb-16">
        <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <span className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-[var(--color-primary-light)]/10 text-[var(--color-primary-light)] text-sm font-semibold mb-6">
              <Shield size={16} />
              Privacy Policy
            </span>
            <h1 className="text-4xl md:text-5xl font-bold text-[var(--color-text)] mb-6">
              Your Privacy <span className="bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-primary-light)] bg-clip-text text-transparent">Matters</span>
            </h1>
            <p className="text-xl text-[var(--color-text-secondary)] max-w-2xl mx-auto leading-relaxed">
              We are committed to protecting your personal information and being transparent about how we use it.
            </p>
            <p className="text-sm text-[var(--color-text-muted)] mt-4">
              Last updated: December 2025
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6 mb-8"
          >
            <p className="text-[var(--color-text-secondary)] leading-relaxed">
              GlobalHealth.Works ("we", "our", or "us") operates the globalhealth.works platform. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our platform. Please read this policy carefully. By using GlobalHealth.Works, you consent to the practices described in this policy.
            </p>
          </motion.div>

          <div className="space-y-8">
            {sections.map((section, index) => (
              <motion.div
                key={section.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.2 + index * 0.1 }}
                className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-light)] flex items-center justify-center text-white">
                    <section.icon size={20} />
                  </div>
                  <h2 className="text-xl font-bold text-[var(--color-text)]">{section.title}</h2>
                </div>
                <ul className="space-y-3 ml-14">
                  {section.content.map((item, i) => (
                    <li key={i} className="text-[var(--color-text-secondary)] flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-primary-light)] mt-2 flex-shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="mt-12 bg-gradient-to-br from-[var(--color-bg-secondary)] to-[var(--color-bg)] rounded-2xl p-8 text-center"
          >
            <h3 className="text-xl font-bold text-[var(--color-text)] mb-4">Questions About Privacy?</h3>
            <p className="text-[var(--color-text-secondary)] mb-6">
              If you have any questions about this Privacy Policy or our data practices, please contact us.
            </p>
            <a
              href="mailto:privacy@globalhealth.works"
              className="inline-flex items-center gap-2 btn-primary"
            >
              Contact Privacy Team
            </a>
          </motion.div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
