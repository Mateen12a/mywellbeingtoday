import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  ChevronRight,
  ChevronLeft,
  Clipboard,
  MessageSquare,
  Bell,
  User,
  Settings,
  Search,
  PlusCircle,
  FolderOpen,
  Users,
  Sparkles,
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL;

export default function WelcomeOnboarding({ user, onComplete }) {
  const [step, setStep] = useState(0);
  const [visible, setVisible] = useState(true);

  const role = user?.role?.toLowerCase() || "";
  const firstName = user?.firstName || user?.name?.split(" ")[0] || "there";

  const getSteps = () => {
    const baseSteps = [
      {
        icon: Sparkles,
        title: `Welcome, ${firstName}!`,
        description: "We're excited to have you on GlobalHealth.Works. Let's take a quick tour to help you get started.",
        highlight: null,
      },
    ];

    if (role.includes("task") || role === "taskowner") {
      return [
        ...baseSteps,
        {
          icon: PlusCircle,
          title: "Create Your First Task",
          description: "Click 'Create Task' in the sidebar to post a new task. Describe your needs and solution providers will apply.",
          highlight: "Create Task",
        },
        {
          icon: FolderOpen,
          title: "Manage Your Tasks",
          description: "View all your tasks from 'My Tasks'. Track applications, communicate with providers, and manage progress.",
          highlight: "My Tasks",
        },
        {
          icon: MessageSquare,
          title: "Stay Connected",
          description: "Use Messages to communicate with solution providers who apply to your tasks.",
          highlight: "Messages",
        },
        {
          icon: Bell,
          title: "Never Miss an Update",
          description: "The notification bell keeps you informed about new applications, messages, and task updates.",
          highlight: "notification",
        },
        {
          icon: Settings,
          title: "Customize Your Experience",
          description: "Visit Settings to manage your notification preferences and account details.",
          highlight: "Settings",
        },
      ];
    }

    if (role.includes("solution") || role === "solutionprovider") {
      return [
        ...baseSteps,
        {
          icon: Search,
          title: "Find Tasks",
          description: "Browse 'Available Tasks' to find opportunities that match your expertise. Our matching system highlights the best fits.",
          highlight: "Available Tasks",
        },
        {
          icon: Clipboard,
          title: "Apply to Tasks",
          description: "When you find a task you're interested in, submit a proposal explaining why you're the best fit.",
          highlight: "Apply",
        },
        {
          icon: Users,
          title: "Track Your Applications",
          description: "Visit 'My Applications' to see all tasks you've applied to and track their status.",
          highlight: "My Applications",
        },
        {
          icon: MessageSquare,
          title: "Communicate with Task Owners",
          description: "Once connected, use Messages to discuss task details and collaborate effectively.",
          highlight: "Messages",
        },
        {
          icon: User,
          title: "Build Your Profile",
          description: "A complete profile helps task owners find you. Add your expertise, experience, and portfolio.",
          highlight: "Profile",
        },
      ];
    }

    if (role === "admin") {
      return [
        ...baseSteps,
        {
          icon: Users,
          title: "Manage Users",
          description: "Review and approve new registrations, manage user roles, and handle account issues.",
          highlight: "Manage Users",
        },
        {
          icon: Clipboard,
          title: "Oversee Tasks",
          description: "Monitor all tasks on the platform, review content, and ensure quality standards.",
          highlight: "Manage Tasks",
        },
        {
          icon: MessageSquare,
          title: "Admin Messaging",
          description: "Communicate with users directly through the admin messaging system.",
          highlight: "Messages",
        },
        {
          icon: Settings,
          title: "System Settings",
          description: "Configure platform settings and manage your admin preferences.",
          highlight: "Settings",
        },
      ];
    }

    return baseSteps;
  };

  const steps = getSteps();
  const totalSteps = steps.length;
  const currentStep = steps[step];
  const Icon = currentStep.icon;

  const handleNext = () => {
    if (step < totalSteps - 1) {
      setStep(step + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (step > 0) setStep(step - 1);
  };

  const handleSkip = async () => {
    try {
      const token = localStorage.getItem("token");
      await fetch(`${API_URL}/api/auth/me`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ onboardingSkipped: true }),
      });
    } catch (err) {
      console.error("Error saving skip status:", err);
    }
    setVisible(false);
    onComplete?.();
  };

  const handleComplete = async () => {
    try {
      const token = localStorage.getItem("token");
      await fetch(`${API_URL}/api/auth/me`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ onboardingCompleted: true }),
      });
    } catch (err) {
      console.error("Error saving completion status:", err);
    }
    setVisible(false);
    onComplete?.();
  };

  if (!visible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden"
        >
          <div className="relative bg-gradient-to-br from-[#1E376E] to-[#2B4A8C] p-8 text-white">
            <button
              onClick={handleSkip}
              className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            
            <motion.div
              key={step}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center"
            >
              <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Icon className="w-10 h-10" />
              </div>
              <h2 className="text-2xl font-bold mb-2">{currentStep.title}</h2>
            </motion.div>
          </div>

          <div className="p-8">
            <motion.p
              key={`desc-${step}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-gray-600 text-center text-lg leading-relaxed mb-8"
            >
              {currentStep.description}
            </motion.p>

            <div className="flex items-center justify-center gap-2 mb-8">
              {steps.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setStep(i)}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    i === step
                      ? "w-8 bg-[#E96435]"
                      : i < step
                      ? "w-2 bg-[#1E376E]"
                      : "w-2 bg-gray-300"
                  }`}
                />
              ))}
            </div>

            <div className="flex items-center justify-between gap-4">
              {step > 0 ? (
                <button
                  onClick={handlePrev}
                  className="flex items-center gap-2 px-6 py-3 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors font-medium"
                >
                  <ChevronLeft className="w-5 h-5" />
                  Back
                </button>
              ) : (
                <button
                  onClick={handleSkip}
                  className="px-6 py-3 text-gray-500 hover:text-gray-700 transition-colors font-medium"
                >
                  Skip Tour
                </button>
              )}

              <button
                onClick={handleNext}
                className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-[#E96435] to-[#FF7A50] text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all hover:scale-[1.02]"
              >
                {step === totalSteps - 1 ? "Get Started" : "Next"}
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
