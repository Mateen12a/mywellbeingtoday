import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Plus, ExternalLink, Clock, CheckCircle, Briefcase, AlertCircle } from "lucide-react";
import DashboardLayout from "../../components/dashboard/DashboardLayout";
import DashboardStats from "../../components/dashboard/DashboardStats";
import WelcomeOnboarding from "../../components/WelcomeOnboarding";

const API_URL = import.meta.env.VITE_API_URL;

export default function TaskOwnerDashboard() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
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
        const res = await fetch(`${API_URL}/api/tasks?owner=true`, {
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
    fetchTasks();
  }, [token]);

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
  };

  const total = tasks.length;
  const completed = tasks.filter((t) => t.status === "completed").length;
  const inProgress = tasks.filter(
    (t) => t.status === "in progress" || t.status === "ongoing"
  ).length;
  const active = tasks.filter((t) => t.status === "published").length;

  const stats = [
    { label: "Total Tasks", value: total, type: "total" },
    { label: "In Progress", value: inProgress, type: "inProgress" },
    { label: "Completed", value: completed, type: "completed" },
    { label: "Active", value: active, type: "active" },
  ];

  const completedTasks = tasks.filter((t) => t.status === "completed").slice(0, 3);

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

  const getStatusColor = (status) => {
    switch (status) {
      case "completed":
        return "bg-emerald-100 text-emerald-700";
      case "in progress":
      case "ongoing":
        return "bg-amber-100 text-amber-700";
      case "published":
        return "bg-blue-100 text-blue-700";
      default:
        return "bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)]";
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
    <DashboardLayout role="Task Owner" title="Dashboard">
      {showOnboarding && (
        <WelcomeOnboarding user={user} onComplete={handleOnboardingComplete} />
      )}
      <DashboardStats stats={stats} />

      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-[var(--color-text)]">
              My Tasks
            </h2>
            <p className="text-[var(--color-text-secondary)] text-sm mt-1">
              Manage and track all your posted tasks
            </p>
          </div>
          <Link to="/tasks/create">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="btn-accent flex items-center gap-2 px-5 py-2.5"
            >
              <Plus className="w-5 h-5" />
              Create New Task
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
        ) : tasks.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card p-12 text-center"
          >
            <div className="w-16 h-16 rounded-2xl bg-[var(--color-bg-tertiary)] flex items-center justify-center mx-auto mb-4">
              <Briefcase className="w-8 h-8 text-[var(--color-text-muted)]" />
            </div>
            <h3 className="text-lg font-semibold text-[var(--color-text)] mb-2">
              No tasks yet
            </h3>
            <p className="text-[var(--color-text-secondary)] mb-6 max-w-sm mx-auto">
              Get started by creating your first task and connect with global health experts.
            </p>
            <Link to="/tasks/create">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="btn-primary px-6 py-2.5"
              >
                Create Your First Task
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
            {tasks.map((task) => (
              <motion.div
                key={task._id}
                variants={item}
                whileHover={{ y: -4, boxShadow: "0 12px 24px -8px rgba(0,0,0,0.15)" }}
                className="card p-6 group cursor-pointer relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-light)] opacity-0 group-hover:opacity-100 transition-opacity" />
                
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold text-[var(--color-text)] truncate group-hover:text-[var(--color-primary-light)] transition-colors">
                      {task.title}
                    </h3>
                    <p className="text-xs text-[var(--color-text-muted)] mt-1">
                      Created {new Date(task.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <Link
                    to={`/tasks/${task._id}`}
                    className="ml-3 p-2.5 rounded-xl bg-[var(--color-bg-secondary)] hover:bg-[var(--color-primary)] text-[var(--color-text-secondary)] hover:text-white transition-all shadow-sm"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Link>
                </div>
                
                <p className="text-sm text-[var(--color-text-secondary)] line-clamp-2 mb-4 leading-relaxed">
                  {task.summary}
                </p>
                
                <div className="flex items-center gap-2 flex-wrap pt-3 border-t border-[var(--color-border)]">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${getStatusColor(task.status)}`}>
                    {getStatusIcon(task.status)}
                    <span className="capitalize">{task.status}</span>
                  </span>
                  {task.applicants?.length > 0 && (
                    <span className="px-3 py-1.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                      {task.applicants.length} applicant{task.applicants.length !== 1 ? 's' : ''}
                    </span>
                  )}
                  {task.fundingStatus && (
                    <span className="px-3 py-1.5 rounded-full text-xs font-medium bg-[var(--color-accent-light)]/20 text-[var(--color-accent)]">
                      {task.fundingStatus}
                    </span>
                  )}
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {completedTasks.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-10"
          >
            <h3 className="text-xl font-bold text-[var(--color-text)] mb-4 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-emerald-500" />
              Recently Completed
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              {completedTasks.map((t) => (
                <Link
                  key={t._id}
                  to={`/tasks/${t._id}`}
                  className="card p-4 hover:border-emerald-300 transition-colors group"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="w-5 h-5 text-emerald-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-[var(--color-text)] truncate group-hover:text-emerald-600 transition-colors">
                        {t.title}
                      </h4>
                      <p className="text-sm text-[var(--color-text-secondary)] line-clamp-1">
                        {t.summary}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </DashboardLayout>
  );
}
