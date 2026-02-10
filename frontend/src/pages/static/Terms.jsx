import { motion } from "framer-motion";
import { FileText, Scale, AlertTriangle, Shield, Users, Briefcase } from "lucide-react";
import Navbar from "../../components/Navbar";
import Footer from "../../components/landing/Footer";

const sections = [
  {
    icon: Users,
    title: "User Accounts",
    content: [
      "You must be at least 18 years old to create an account",
      "You are responsible for maintaining the security of your account credentials",
      "All registration information must be accurate and up-to-date",
      "Accounts may be suspended for violation of these terms",
      "You may not share your account with others or create multiple accounts"
    ]
  },
  {
    icon: Briefcase,
    title: "Platform Usage",
    content: [
      "Task owners may post legitimate global health related opportunities",
      "Solution providers may apply to tasks matching their qualifications",
      "All communications must be professional and respectful",
      "Users may not post misleading or fraudulent content",
      "Platform is for legitimate global health work only"
    ]
  },
  {
    icon: Scale,
    title: "Agreements & Payments",
    content: [
      "Agreements between task owners and solution providers are binding",
      "Payment terms are established between parties before work begins",
      "GlobalHealth.Works may facilitate payments but is not a party to agreements",
      "Disputes should first be resolved directly between parties",
      "Platform fees and commission structures are disclosed before transactions"
    ]
  },
  {
    icon: Shield,
    title: "Intellectual Property",
    content: [
      "Users retain ownership of their original content",
      "By posting, you grant us license to display content on the platform",
      "Work product ownership is determined by individual agreements",
      "Do not post content that infringes on others' intellectual property",
      "GlobalHealth.Works branding and platform design are our property"
    ]
  },
  {
    icon: AlertTriangle,
    title: "Prohibited Activities",
    content: [
      "Harassment, discrimination, or abusive behavior toward other users",
      "Posting false, misleading, or fraudulent information",
      "Attempting to circumvent platform fees or security measures",
      "Using the platform for activities unrelated to global health",
      "Spamming, phishing, or distributing malware"
    ]
  },
  {
    icon: FileText,
    title: "Limitation of Liability",
    content: [
      "GlobalHealth.Works provides the platform 'as is' without warranties",
      "We are not liable for disputes between users",
      "We do not guarantee the quality of work or payment",
      "Users are responsible for their own tax obligations",
      "Maximum liability is limited to fees paid to the platform"
    ]
  }
];

export default function Terms() {
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
              <Scale size={16} />
              Terms of Service
            </span>
            <h1 className="text-4xl md:text-5xl font-bold text-[var(--color-text)] mb-6">
              Terms of <span className="bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-primary-light)] bg-clip-text text-transparent">Service</span>
            </h1>
            <p className="text-xl text-[var(--color-text-secondary)] max-w-2xl mx-auto leading-relaxed">
              Please read these terms carefully before using GlobalHealth.Works.
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
              Welcome to GlobalHealth.Works. These Terms of Service ("Terms") govern your access to and use of our platform, including our website, services, and applications. By creating an account or using our platform, you agree to be bound by these Terms. If you do not agree, please do not use our services.
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
            transition={{ duration: 0.6, delay: 0.7 }}
            className="mt-12 bg-gradient-to-br from-[var(--color-bg-secondary)] to-[var(--color-bg)] rounded-2xl p-8"
          >
            <h3 className="text-xl font-bold text-[var(--color-text)] mb-4">Changes to These Terms</h3>
            <p className="text-[var(--color-text-secondary)] mb-6 leading-relaxed">
              We may update these Terms from time to time. We will notify you of any material changes by posting the new Terms on this page and updating the "Last updated" date. Your continued use of the platform after any changes constitutes acceptance of the new Terms.
            </p>
            <p className="text-[var(--color-text-secondary)] leading-relaxed">
              If you have any questions about these Terms, please contact us at <a href="mailto:legal@globalhealth.works" className="text-[var(--color-primary-light)] hover:underline">legal@globalhealth.works</a>.
            </p>
          </motion.div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
