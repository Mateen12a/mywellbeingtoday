import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import {
  ArrowLeft,
  ArrowRight,
  Activity,
  Heart,
  Users,
  Brain,
  Shield,
  Accessibility,
  BookOpen,
  Target,
  Eye,
} from "lucide-react";
import { motion } from "framer-motion";

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
};

export default function About() {
  const { isAuthenticated } = useAuth();
  return (
    <div className="flex flex-col gap-8 max-[300px]:gap-6 sm:gap-16 md:gap-24 pb-10 max-[300px]:pb-6 sm:pb-20">
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-blue-50 to-white" />
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-br from-primary/15 to-blue-100 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
          <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-gradient-to-tr from-green-100 to-primary/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4" />
        </div>

        <div className="max-w-4xl mx-auto text-center py-8 max-[300px]:py-4 md:py-20 px-2 max-[300px]:px-1 sm:px-4 space-y-4 max-[300px]:space-y-3 sm:space-y-6">
          <Link href="/">
            <Button variant="ghost" className="gap-2 mb-4">
              <ArrowLeft className="h-4 w-4" /> Back to Home
            </Button>
          </Link>

          <motion.h1
            {...fadeInUp}
            transition={{ duration: 0.5 }}
            className="text-xl max-[300px]:text-lg sm:text-4xl md:text-5xl font-serif font-bold text-slate-900 leading-tight"
          >
            About{/* Empowering your{" "}
            <span className="text-primary">wellbeing</span> */}
          </motion.h1>

          <motion.p
            {...fadeInUp}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-lg md:text-xl text-slate-600 max-w-xl mx-auto leading-relaxed"
          >
           Losing loved ones to sickness can cause intense emotions of guilt. To encourage regular self-care practices, the author founded wellbeing@fingertip in 2017 following personal losses. By tracking their activities and health, users of the mywellbeingtoday online app may manage and spot health problems early. The software makes it easier to locate local medical assistance, acting as a companion on one's health journey and is not a replacement place for medical counsel. {/* mywellbeingtoday is a self-care platform that helps you log activities,
            understand your mood, access wellbeing reports, and connect with health
            and social care providers — all in one place. */}
          </motion.p>
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-2 max-[300px]:px-1 sm:px-4 space-y-4 max-[300px]:space-y-3 sm:space-y-6">
        <motion.div {...fadeInUp} transition={{ duration: 0.5 }}>
          <div className="flex items-center gap-2 max-[300px]:gap-1.5 sm:gap-3 mb-3 max-[300px]:mb-2 sm:mb-4">
            <div className="h-10 w-10 max-[300px]:h-8 max-[300px]:w-8 sm:h-12 sm:w-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <Target className="h-6 w-6 text-primary" />
            </div>
            <h2 className="text-2xl md:text-3xl font-serif font-bold text-slate-900">
              Our Mission
            </h2>
          </div>
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-6 md:p-8">
              <p className="text-foreground/90 leading-relaxed text-lg">
                To promote holistic wellbeing, self-care, and personal growth.
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </section>

      <section className="max-w-5xl mx-auto px-2 max-[300px]:px-1 sm:px-4 space-y-6 max-[300px]:space-y-4 sm:space-y-8">
        <motion.div {...fadeInUp} transition={{ duration: 0.5 }} className="text-center space-y-2 max-[300px]:space-y-1.5 sm:space-y-3">
          <h2 className="text-xl max-[300px]:text-lg sm:text-2xl md:text-3xl font-serif font-bold text-slate-900">
            What We Offer
          </h2>
          <p className="text-slate-600 max-w-2xl mx-auto">
            A comprehensive set of tools designed to support every aspect of your
            wellbeing journey.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 max-[300px]:grid-cols-1 sm:grid-cols-2 gap-4 max-[300px]:gap-3 sm:gap-6">
          {[
            {
              icon: Activity,
              title: "Activity Logging",
              description:
                "Log daily activities including exercise, meals, sleep, and social interactions. Build healthy habits by monitoring your routines and spotting patterns over time.",
              color: "text-blue-600",
              bg: "bg-blue-100",
            },
            {
              icon: Heart,
              title: "Mood Analysis",
              description:
                "Record and understand your emotional wellbeing with AI-powered insights. Discover what influences your mood and receive personalised suggestions to feel your best.",
              color: "text-rose-600",
              bg: "bg-rose-100",
            },
            {
              icon: Users,
              title: "Provider Directory",
              description:
                "Find certified health and social care providers near you. Book appointments, send messages, and connect with professionals who can support your wellbeing journey.",
              color: "text-green-600",
              bg: "bg-green-100",
            },
            {
              icon: Brain,
              title: "AI-Powered Insights",
              description:
                "Our intelligent assistant analyses your data to surface meaningful patterns, offer evidence-based recommendations, and help you make informed decisions about your health.",
              color: "text-purple-600",
              bg: "bg-purple-100",
            },
          ].map((feature, i) => (
            <motion.div
              key={i}
              {...fadeInUp}
              transition={{ duration: 0.5, delay: i * 0.1 }}
            >
              <Card className="h-full border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
                <CardContent className="p-4 max-[300px]:p-3 sm:p-6 md:p-8 space-y-3 max-[300px]:space-y-2 sm:space-y-4">
                  <div
                    className={`h-10 w-10 max-[300px]:h-8 max-[300px]:w-8 sm:h-12 sm:w-12 rounded-2xl ${feature.bg} ${feature.color} flex items-center justify-center`}
                  >
                    <feature.icon className="w-5 h-5 max-[300px]:w-4 max-[300px]:h-4 sm:w-6 sm:h-6" />
                  </div>
                  <h3 className="text-base max-[300px]:text-sm sm:text-xl font-bold font-serif text-slate-900">
                    {feature.title}
                  </h3>
                  <p className="text-slate-600 leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-2 max-[300px]:px-1 sm:px-4 space-y-6 max-[300px]:space-y-4 sm:space-y-8">
        <motion.div {...fadeInUp} transition={{ duration: 0.5 }} className="text-center space-y-2 max-[300px]:space-y-1.5 sm:space-y-3">
          <h2 className="text-xl max-[300px]:text-lg sm:text-2xl md:text-3xl font-serif font-bold text-slate-900">
            Our Values
          </h2>
          <p className="text-slate-600 max-w-2xl mx-auto">
            Supporting People to live a Healthier, Fitter and Happier Lives.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 max-[300px]:grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-[300px]:gap-3 sm:gap-6">
          {[
            {
              icon: Shield,
              title: "Privacy First",
              description:
                "Your data belongs to you. We use industry-leading encryption and never sell your personal information.",
            },
            {
              icon: Accessibility,
              title: "Accessibility",
              description:
                "Wellbeing tools should be available to everyone, regardless of ability, location, or background.",
            },
            {
              icon: BookOpen,
              title: "Evidence-Based",
              description:
                "Our insights and recommendations are grounded in research and validated health frameworks.",
            },
            {
              icon: Eye,
              title: "Human-Centred",
              description:
                "Technology should serve people. We design with empathy, clarity, and real human needs in mind.",
            },
          ].map((value, i) => (
            <motion.div
              key={i}
              {...fadeInUp}
              transition={{ duration: 0.5, delay: i * 0.1 }}
            >
              <Card className="h-full text-center border-0 shadow-md hover:shadow-lg transition-shadow duration-300">
                <CardContent className="p-4 max-[300px]:p-3 sm:p-6 space-y-2 max-[300px]:space-y-1.5 sm:space-y-3">
                  <div className="h-10 w-10 max-[300px]:h-8 max-[300px]:w-8 sm:h-12 sm:w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
                    <value.icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold font-serif text-slate-900">
                    {value.title}
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {value.description}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="max-w-3xl mx-auto px-2 max-[300px]:px-1 sm:px-4">
        <motion.div {...fadeInUp} transition={{ duration: 0.5 }}>
          <Card className="bg-gradient-to-br from-primary/5 to-blue-50 border border-primary/10 shadow-md">
            <CardContent className="p-4 max-[300px]:p-3 sm:p-6 md:p-8 text-center space-y-2 max-[300px]:space-y-1.5 sm:space-y-3">
              <div className="flex items-center justify-center gap-2 text-primary">
                <Heart className="w-4 h-4 sm:w-5 sm:h-5" />
                <h3 className="text-base max-[300px]:text-sm sm:text-lg font-serif font-bold">
                  iOS & Android Apps Coming Soon
                </h3>
              </div>
              <p className="text-muted-foreground text-sm max-w-md mx-auto">
                Your wellbeing companion, soon available on mobile.
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </section>

      <section className="max-w-3xl mx-auto px-2 max-[300px]:px-1 sm:px-4">
        <motion.div {...fadeInUp} transition={{ duration: 0.5 }}>
          <Card className="bg-gradient-to-br from-primary/10 to-blue-50 border-0 shadow-xl">
            <CardContent className="p-4 max-[300px]:p-3 sm:p-8 md:p-12 text-center space-y-4 max-[300px]:space-y-3 sm:space-y-6">
              <h2 className="text-xl max-[300px]:text-lg sm:text-2xl md:text-3xl font-serif font-bold text-slate-900">
                Start your wellbeing journey today
              </h2>
              <p className="text-slate-600 text-lg max-w-xl mx-auto leading-relaxed">
                Join thousands of users who are taking control of their health and
                wellbeing with mywellbeingtoday. It only takes a minute to get started.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-2">
                {isAuthenticated ? (
                  <Link href="/dashboard">
                    <Button size="lg" className="shadow-lg shadow-primary/25 text-base font-semibold">
                      Go to Dashboard
                      <ArrowRight className="ml-2 w-5 h-5" />
                    </Button>
                  </Link>
                ) : (
                  <>
                    <Link href="/auth/register">
                      <Button size="lg" className="shadow-lg shadow-primary/25 text-base font-semibold">
                        Get Started Free
                        <ArrowRight className="ml-2 w-5 h-5" />
                      </Button>
                    </Link>
                    <Link href="/auth/login">
                      <Button size="lg" variant="outline" className="text-base font-semibold bg-white/80 border-2 border-slate-200">
                        Sign In
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </section>
    </div>
  );
}
