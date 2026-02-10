import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Search, ExternalLink, Clock, CheckCircle, Briefcase, AlertCircle, ArrowRight } from "lucide-react";
import DashboardLayout from "../../components/dashboard/DashboardLayout";
import DashboardStats from "../../components/dashboard/DashboardStats";
import WelcomeOnboarding from "../../components/WelcomeOnboarding";

const API_URL = import.meta.env.VITE_API_URL;

export default function SolutionProviderDashboard() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [myStats, setMyStats] = useState({ applied: 0, inProgress: 0, completed: 0 });
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  useEffect(() => {
    // Check if onboarding should be shown
    const shouldShowOnboarding = localStorage.getItem("showOnboarding");
    if (shouldShowOnboarding === "true") {
      setShowOnboarding(true);
      localStorage.removeItem("showOnboarding");
    }

    const fetchTasks = async () => {
      try {
        const res = await fetch(`${API_URL}/api/tasks`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (res.ok) setTasks(data);
      } catch (err) {
        console.error("Error fetching tasks:", err);
      } finally {
        setLoading(false);
      }
    };
    
    const fetchMyStats = async () => {
      try {
        const res = await fetch(`${API_URL}/api/proposals/my-stats`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (res.ok) setMyStats(data);
      } catch (err) {
        console.error("Error fetching stats:", err);
      }
    };
    
    fetchTasks();
    fetchMyStats();
  }, [token]);

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
  };

  const available = tasks.filter((t) => t.status === "published");

  const stats = [
    { label: "Available Tasks", value: available.length, type: "total" },
    { label: "Applied", value: myStats.applied, type: "active" },
    { label: "In Progress", value: myStats.inProgress, type: "inProgress" },
    { label: "Completed", value: myStats.completed, type: "completed" },
  ];

  const getStatusIcon = (status) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-4 h-4 text-emerald-500" />;
      case "in progress":
      case "ongoing":
        return <Clock className="w-4 h-4 text-amber-500" />;
      case "published":
        return <Briefcase className="w-4 h-4 text-[var(--color-primary-light)]" />;
      default:
        return <AlertCircle className="w-4 h-4 text-[var(--color-text-muted)]" />;
    }
  };

  const container = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <DashboardLayout role="Solution Provider" title="Dashboard">
      {showOnboarding && (
        <WelcomeOnboarding user={user} onComplete={handleOnboardingComplete} />
      )}
      <DashboardStats stats={stats} />

      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-[var(--color-text)]">
              Available Tasks
            </h2>
            <p className="text-[var(--color-text-secondary)] text-sm mt-1">
              Browse and apply to tasks that match your expertise
            </p>
          </div>
          <Link to="/browse-tasks">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="btn-primary flex items-center gap-2 px-5 py-2.5"
            >
              <Search className="w-5 h-5" />
              Browse All Tasks
            </motion.button>
          </Link>
        </div>

        {loading ? (
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="card p-5 animate-pulse">
                <div className="h-6 bg-[var(--color-bg-tertiary)] rounded w-3/4 mb-3" />
                <div className="h-4 bg-[var(--color-bg-tertiary)] rounded w-full mb-2" />
                <div className="h-4 bg-[var(--color-bg-tertiary)] rounded w-2/3" />
              </div>
            ))}
          </div>
        ) : available.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card p-12 text-center"
          >
            <div className="w-16 h-16 rounded-2xl bg-[var(--color-bg-tertiary)] flex items-center justify-center mx-auto mb-4">
              <Briefcase className="w-8 h-8 text-[var(--color-text-muted)]" />
            </div>
            <h3 className="text-lg font-semibold text-[var(--color-text)] mb-2">
              No available tasks right now
            </h3>
            <p className="text-[var(--color-text-secondary)] mb-6 max-w-sm mx-auto">
              Check back soon for new opportunities, or browse all tasks to see upcoming projects.
            </p>
            <Link to="/browse-tasks">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="btn-primary px-6 py-2.5"
              >
                Browse All Tasks
              </motion.button>
            </Link>
          </motion.div>
        ) : (
          <motion.div
            variants={container}
            initial="hidden"
            animate="visible"
            className="grid md:grid-cols-2 xl:grid-cols-3 gap-6"
          >
            {available.slice(0, 6).map((task) => (
              <motion.div
                key={task._id}
                variants={item}
                whileHover={{ y: -4 }}
                className="card p-5 group"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-[var(--color-text)] truncate group-hover:text-[var(--color-primary-light)] transition-colors">
                      {task.title}
                    </h3>
                  </div>
                </div>
                <p className="text-sm text-[var(--color-text-secondary)] line-clamp-2 mb-4">
                  {task.summary}
                </p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                      {getStatusIcon(task.status)}
                      {task.status}
                    </span>
                    {task.fundingStatus && (
                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-[var(--color-accent-light)]/20 text-[var(--color-accent)]">
                        {task.fundingStatus}
                      </span>
                    )}
                  </div>
                  <Link
                    to={`/tasks/${task._id}`}
                    className="flex items-center gap-1 text-sm font-medium text-[var(--color-primary-light)] hover:underline"
                  >
                    View
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {available.length > 6 && (
          <div className="text-center">
            <Link to="/browse-tasks">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="inline-flex items-center gap-2 text-[var(--color-primary-light)] font-semibold hover:underline"
              >
                View all {available.length} available tasks
                <ArrowRight className="w-4 h-4" />
              </motion.button>
            </Link>
          </div>
        )}

        {myStats.inProgress > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-10"
          >
            <div className="card p-6 bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                    <Clock className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-[var(--color-text)]">
                      {myStats.inProgress} Active {myStats.inProgress === 1 ? 'Project' : 'Projects'}
                    </h3>
                    <p className="text-sm text-[var(--color-text-secondary)]">
                      You're currently working on {myStats.inProgress === 1 ? 'a task' : 'tasks'}
                    </p>
                  </div>
                </div>
                <Link
                  to="/my-applications"
                  className="btn-primary px-4 py-2 text-sm"
                >
                  View My Work
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </DashboardLayout>
  );
}
