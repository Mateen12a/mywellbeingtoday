import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";
import {
  ArrowRight,
  ShieldCheck,
  Heart,
  Users,
  Activity,
  Star,
  Calendar,
  MapPin,
  FileText,
  Monitor,
  HelpCircle,
  Puzzle,
  Brain,
  TrendingUp,
  Clock,
  Zap,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

import heroBg from "@assets/generated_images/subtle_abstract_wellness_gradient_background.png";
import user1 from "@assets/stock_images/professional_headsho_3bdf1044.jpg"; // Sarah
import user2 from "@assets/stock_images/professional_headsho_65477c19.jpg"; // User generic
import user3 from "@assets/stock_images/professional_headsho_6dbd1c82.jpg";
import brainVisual from "@assets/generated_images/serene_abstract_ai_wellbeing_assistant_visualization.png";
import { useAuth } from "@/contexts/AuthContext";

const HeroCarousel = () => {
  const [index, setIndex] = useState(0);

  const slides = [
    {
      title: "Today's Mood",
      value: "Calm & Focused",
      icon: Heart,
      avatar: user2,
      sublabel: "Daily Goal",
      subvalue: "100%",
      progress: 100,
      color: "text-primary",
      quote: "You are doing great. Keep going.",
      bg: "bg-primary",
    },
    {
      title: "Next Activity",
      value: "Morning Yoga",
      icon: Activity,
      sublabel: "Duration",
      subvalue: "30 mins",
      progress: 75,
      color: "text-blue-600",
      quote: "Movement is medicine.",
      bg: "bg-blue-600",
    },
    {
      title: "Find Help",
      value: "Dr. Sarah Johnson",
      icon: MapPin,
      avatar: user1,
      sublabel: "Distance",
      subvalue: "0.8 km",
      progress: 100,
      color: "text-green-600",
      quote: "Support is just a click away.",
      bg: "bg-green-600",
    },
    {
      title: "Achievement",
      value: "Consistent Star",
      icon: Star,
      sublabel: "Streak",
      subvalue: "7 Days",
      progress: 100,
      color: "text-amber-500",
      quote: "Consistency creates change.",
      bg: "bg-amber-500",
    },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % slides.length);
    }, 4000); // Change slide every 4 seconds
    return () => clearInterval(timer);
  }, []);

  const slide = slides[index];
  const Icon = slide.icon;

  return (
    <div className="relative h-[320px] w-full max-w-md mx-auto">
      <AnimatePresence mode="wait">
        <motion.div
          key={index}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
          className="absolute inset-0"
        >
          <Card className="border-0 shadow-2xl bg-white/60 backdrop-blur-md p-6 h-full flex flex-col justify-between">
            <CardContent className="p-0 space-y-6">
              <div className="flex items-center justify-between border-b pb-4">
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground font-medium uppercase tracking-wide">
                    {slide.title}
                  </div>
                  <div
                    className={`text-2xl font-serif font-bold ${slide.color}`}
                  >
                    {slide.value}
                  </div>
                </div>
                {slide.avatar ? (
                  <Avatar className="h-14 w-14 border-2 border-white shadow-md">
                    <AvatarImage src={slide.avatar} className="object-cover" />
                    <AvatarFallback>{slide.value[0]}</AvatarFallback>
                  </Avatar>
                ) : (
                  <div
                    className={`h-12 w-12 rounded-full ${slide.bg}/10 flex items-center justify-center ${slide.color}`}
                  >
                    <Icon className="w-6 h-6 fill-current" />
                  </div>
                )}
              </div>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    {slide.sublabel}
                  </span>
                  <span className="font-medium text-foreground">
                    {slide.subvalue}
                  </span>
                </div>
                <div className="h-2 w-full bg-secondary/50 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${slide.progress}%` }}
                    transition={{ duration: 1, delay: 0.2 }}
                    className={`h-full ${slide.bg} w-full rounded-full`}
                  />
                </div>
                <p className="text-xs text-muted-foreground text-center pt-4 italic">
                  "{slide.quote}"
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>

      {/* Decorative blurred backgrounds that shift color based on slide */}
      <motion.div
        animate={{
          backgroundColor:
            index === 0
              ? "rgba(var(--primary), 0.1)"
              : index === 1
                ? "rgba(37, 99, 235, 0.1)"
                : "rgba(22, 163, 74, 0.1)",
        }}
        className="absolute top-0 right-0 -z-10 w-96 h-96 rounded-full blur-3xl opacity-50 transition-colors duration-1000"
      />
    </div>
  );
};

export default function Landing() {
  const { isAuthenticated, user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      if (user.role === "admin" || user.role === "super_admin") {
        setLocation("/admin");
      } else if (user.role === "provider") {
        setLocation("/provider-dashboard");
      } else {
        setLocation("/dashboard");
      }
    }
  }, [isAuthenticated, user, isLoading, setLocation]);

  if (isLoading) {
    return null;
  }

  return (
    <div className="flex flex-col gap-8 md:gap-24">
      {/* Hero Section - Improved Design */}
      <section className="relative overflow-hidden">
        {/* Dynamic Background */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-blue-50 to-white" />
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-br from-primary/20 to-blue-100 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gradient-to-tr from-green-100 to-primary/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4" />
        </div>

        <div className="flex flex-col lg:flex-row items-center gap-8 sm:gap-10 lg:gap-16 py-8 sm:py-10 md:py-12 animate-in slide-in-from-bottom-4 duration-700 px-2 sm:px-4">
          {/* Left Content */}
          <div className="flex-1 z-10 space-y-5 sm:space-y-6 md:space-y-8 text-center lg:text-left">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2.5 px-4 sm:px-5 py-2 sm:py-2.5 bg-primary/10 rounded-full text-primary text-sm sm:text-base font-semibold"
            >
              <Heart className="w-4 h-4 sm:w-5 sm:h-5 fill-primary stroke-primary animate-heart-pulse" />
              Your personal wellness companion
            </motion.div>

            {/* Main Headline */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="space-y-4 sm:space-y-5"
            >
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-serif font-bold text-slate-900 leading-tight">
                Take Control of{" "}
                <span className="text-primary relative">
                  Your Health
                  <svg
                    className="absolute -bottom-2 left-0 w-full h-3 text-primary/30"
                    viewBox="0 0 200 12"
                  >
                    <path
                      d="M2 10 Q 50 2, 100 10 T 198 10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                      strokeLinecap="round"
                    />
                  </svg>
                </span>
              </h1>
              <p className="text-lg sm:text-xl md:text-2xl text-slate-600 max-w-lg leading-relaxed mx-auto lg:mx-0">
                Log your activities, track your mood, and connect with
                healthcare providers.
              </p>
            </motion.div>

            {/* Key Points */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="flex flex-wrap gap-3 sm:gap-4 justify-center lg:justify-start"
            >
              {[
                { icon: Activity, text: "Activity Tracking" },
                { icon: Heart, text: "Mood Analysis" },
                { icon: Users, text: "Provider Directory" },
              ].map((item, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 sm:gap-2.5 bg-white/80 backdrop-blur-sm px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl shadow-sm border border-slate-100"
                >
                  <item.icon className="w-5 h-5 sm:w-5 sm:h-5 text-primary" />
                  <span className="text-sm sm:text-base font-medium text-slate-700">
                    {item.text}
                  </span>
                </div>
              ))}
            </motion.div>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-col sm:flex-row gap-4 pt-4 sm:pt-5 justify-center lg:justify-start"
            >
              <Link href="/auth/register">
                <Button
                  size="lg"
                  className="w-full sm:w-auto shadow-lg shadow-primary/25 text-base sm:text-lg font-semibold"
                  data-testid="button-get-started-hero"
                >
                  Get Started Free
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Link href="/auth/login">
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto text-base sm:text-lg font-semibold bg-white/80 border-2 border-slate-200"
                  data-testid="button-signin-hero"
                >
                  Sign In
                </Button>
              </Link>
            </motion.div>

            {/* Trust Indicators */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="flex items-center gap-4 sm:gap-6 pt-6 sm:pt-8 border-t border-slate-200 justify-center lg:justify-start"
            >
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-6 h-6 sm:w-7 sm:h-7 text-primary shrink-0" />
                <div className="text-sm sm:text-base">
                  <p className="font-semibold text-slate-800">
                    Trusted by healthcare professionals
                  </p>
                  <p className="text-slate-500 hidden sm:block">
                    Secure, private, and verified
                  </p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Right Visual - Interactive Carousel */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="flex-1 relative w-full max-w-lg"
          >
            <div className="relative">
              {/* Decorative Elements */}
              <div className="absolute -top-8 -right-8 w-24 h-24 bg-primary/20 rounded-full blur-2xl" />
              <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-blue-200/50 rounded-full blur-2xl" />

              {/* Main Carousel */}
              <HeroCarousel />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Why Wellbeing Matters Section */}
      <section className="py-16 md:py-24 bg-gradient-to-b from-slate-50 to-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center space-y-6 mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <h2 
                className="text-3xl md:text-4xl lg:text-5xl font-serif font-bold text-slate-900"
                data-testid="text-wellbeing-section-title"
              >
                Why Monitor Your Wellbeing?
              </h2>
              <p 
                className="text-lg md:text-xl text-slate-600 max-w-3xl mx-auto mt-4 leading-relaxed"
                data-testid="text-wellbeing-section-subtitle"
              >
                AI-powered insights to help you understand your health patterns and connect with care when you need it.
              </p>
            </motion.div>
          </div>

          {/* The Big Question */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="bg-white rounded-3xl shadow-xl border border-slate-100 p-8 md:p-12 mb-12"
            data-testid="card-wellbeing-question"
          >
            <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-12">
              {/* Faceless Avatar with Question Mark */}
              <div className="flex-shrink-0" data-testid="img-avatar-question">
                <div className="relative">
                  <div className="w-32 h-32 md:w-40 md:h-40 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
                    <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center">
                      <HelpCircle className="w-12 h-12 md:w-16 md:h-16 text-slate-400" />
                    </div>
                  </div>
                  <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center border-4 border-white">
                    <HelpCircle className="w-5 h-5 text-amber-600" />
                  </div>
                </div>
              </div>

              <div className="flex-1 text-center lg:text-left space-y-4">
                <h3 
                  className="text-2xl md:text-3xl font-serif font-bold text-slate-800"
                  data-testid="text-question-title"
                >
                  "I feel mostly fine. Why should I worry about my wellbeing?"
                </h3>
                <p 
                  className="text-lg text-slate-600 leading-relaxed"
                  data-testid="text-question-description"
                >
                  Your body sends quiet signals long before you feel unwell.
                </p>
              </div>
            </div>
          </motion.div>

          {/* The Answer */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-gradient-to-br from-primary/5 to-blue-50 rounded-3xl p-8 md:p-12 mb-16"
            data-testid="card-wellbeing-answer"
          >
            <div className="flex flex-col lg:flex-row-reverse items-center gap-8 lg:gap-12">
              {/* Faceless Avatar with Puzzle (Thinking) */}
              <div className="flex-shrink-0" data-testid="img-avatar-thinking">
                <div className="relative">
                  <div className="w-32 h-32 md:w-40 md:h-40 rounded-full bg-gradient-to-br from-primary/10 to-primary/20 flex items-center justify-center">
                    <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-gradient-to-br from-primary/20 to-primary/30 flex items-center justify-center">
                      <Brain className="w-12 h-12 md:w-16 md:h-16 text-primary/60" />
                    </div>
                  </div>
                  <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center border-4 border-white">
                    <Puzzle className="w-5 h-5 text-primary" />
                  </div>
                </div>
              </div>

              <div className="flex-1 text-center lg:text-left space-y-4">
                <h3 
                  className="text-2xl md:text-3xl font-serif font-bold text-primary"
                  data-testid="text-answer-title"
                >
                  Catch problems early
                </h3>
                <p 
                  className="text-lg text-slate-700 leading-relaxed"
                  data-testid="text-answer-description"
                >
                  Spot early warning signs like poor sleep and rising stress before they become serious health issues.
                </p>
              </div>
            </div>
          </motion.div>

          {/* How It Works - Simple Steps */}
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Monitor,
                iconBg: "bg-blue-100",
                iconColor: "text-blue-600",
                title: "Easy Setup",
                description: "Log your activities and mood in seconds from any device.",
              },
              {
                icon: Brain,
                iconBg: "bg-primary/10",
                iconColor: "text-primary",
                title: "AI Insights",
                description: "Get personalised tips based on your unique patterns.",
              },
              {
                icon: Users,
                iconBg: "bg-green-100",
                iconColor: "text-green-600",
                title: "Connect with Care",
                description: "Find healthcare providers near you when you need support.",
              },
            ].map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
              >
                <Card 
                  className="h-full border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white"
                  data-testid={`card-step-${i + 1}`}
                >
                  <CardContent className="p-8 space-y-4 text-center">
                    <div className={`w-16 h-16 mx-auto rounded-2xl ${step.iconBg} flex items-center justify-center`}>
                      <step.icon className={`w-8 h-8 ${step.iconColor}`} />
                    </div>
                    <h3 
                      className="text-xl font-bold font-serif text-slate-900"
                      data-testid={`text-step-title-${i + 1}`}
                    >
                      {step.title}
                    </h3>
                    <p 
                      className="text-slate-600 leading-relaxed"
                      data-testid={`text-step-description-${i + 1}`}
                    >
                      {step.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Prevention Message */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-16 text-center"
          >
            <div 
              className="inline-flex items-center gap-3 bg-gradient-to-r from-primary/10 to-blue-100 px-6 py-4 rounded-2xl"
              data-testid="text-prevention-message"
            >
              <Clock className="w-6 h-6 text-primary" />
              <p className="text-lg font-medium text-slate-700">
                <span className="text-primary font-bold">Prevention is better than cure.</span>
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Core Benefits */}
      <section className="space-y-12">
        <div className="text-center max-w-2xl mx-auto space-y-4">
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-black">
            Holistic support at your fingertips
          </h2>
          <p className="text-gray-800 font-medium text-lg">
            Tools to maintain balance, track progress, and find help when you need it.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              icon: Activity,
              title: "Daily Tracking",
              desc: "Log activities and mood to identify patterns.",
            },
            {
              icon: ShieldCheck,
              title: "Private & Secure",
              desc: "Your data stays private and protected.",
            },
            {
              icon: Users,
              title: "Provider Directory",
              desc: "Find certified healthcare providers when you need support.",
            },
          ].map((feature, i) => (
            <Card
              key={i}
              className="group hover:shadow-lg transition-all duration-300 border-secondary/50 bg-card/50"
            >
              <CardContent className="p-8 space-y-4">
                <div className="h-12 w-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <feature.icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold font-serif text-black">
                  {feature.title}
                </h3>
                <p className="text-gray-800 font-medium leading-relaxed">
                  {feature.desc}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Trust & CTA */}
      <section 
        className="bg-secondary/30 rounded-3xl p-8 md:p-16 text-center space-y-8 my-12"
        data-testid="section-cta-footer"
      >
        <h2 
          className="text-3xl font-serif font-bold text-black"
          data-testid="text-cta-title"
        >
          Ready to prioritise your wellbeing?
        </h2>
        <p 
          className="text-gray-800 max-w-2xl mx-auto text-lg font-medium"
          data-testid="text-cta-description"
        >
          Start your personal health journey today.
        </p>
        <div className="flex justify-center gap-4">
          <Link href="/auth/register">
            <Button 
              size="lg" 
              className="px-8 shadow-xl"
              data-testid="button-create-account-footer"
            >
              Create Free Account
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
