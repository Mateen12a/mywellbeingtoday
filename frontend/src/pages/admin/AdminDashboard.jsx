import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Users, 
  ClipboardList, 
  MessageSquare, 
  TrendingUp, 
  UserPlus, 
  Mail, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  FileText,
  Activity,
  Briefcase,
  UserCheck
} from "lucide-react";
import DashboardLayout from "../../components/dashboard/DashboardLayout";
import AdminUsers from "./AdminUsers";
import TasksTable from "../../components/admin/TasksTable";
import FeedbackTable from "../../components/admin/FeedbackTable";

const API_URL = import.meta.env.VITE_API_URL;

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("users");
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem("token");
  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
  const isSuperAdmin = currentUser.adminType === "superAdmin";

  useEffect(() => {
    setLoading(true);
    fetch(`${API_URL}/api/admin/enhanced-stats`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        setStats(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Stats fetch error:", err);
        fetch(`${API_URL}/api/admin/stats`, {
          headers: { Authorization: `Bearer ${token}` },
        })
          .then((res) => res.json())
          .then((data) => {
            setStats({ 
              users: { total: data.users }, 
              tasks: { total: data.tasks }, 
              feedback: { total: data.feedback } 
            });
            setLoading(false);
          })
          .catch(() => setLoading(false));
      });
  }, [token]);

  const tabs = [
    { id: "users", label: "Users", icon: Users },
    { id: "tasks", label: "Tasks", icon: ClipboardList },
    { id: "feedback", label: "Feedback", icon: MessageSquare },
  ];

  const container = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.08 },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <DashboardLayout role="admin" title="Admin Dashboard">
      <div className="flex flex-col gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-wrap gap-3 items-center"
        >
          <Link
            to="/admin/onboarding"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--color-primary-light)] text-white font-medium hover:opacity-90 transition-opacity"
          >
            <UserPlus size={18} />
            Manage Admins
          </Link>
          <Link
            to="/admin/messaging"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text)] font-medium hover:bg-[var(--color-bg-secondary)] transition-colors"
          >
            <Mail size={18} />
            Admin Messaging
          </Link>
          {isSuperAdmin && (
            <span className="ml-auto inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-100 text-purple-700 text-sm font-medium">
              <UserCheck size={14} />
              Super Admin
            </span>
          )}
        </motion.div>

        <motion.div
          variants={container}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4"
        >
          <Link to="/admin/users" className="block">
            <motion.div variants={item} className="card p-4 sm:p-5 relative overflow-hidden group hover:shadow-lg transition-shadow cursor-pointer">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-[var(--color-text-secondary)] text-xs font-medium uppercase tracking-wider truncate">Total Users</p>
                  <h2 className="text-xl sm:text-2xl font-bold text-[var(--color-text)] mt-1">
                    {loading ? "..." : stats?.users?.total || 0}
                  </h2>
                </div>
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-light)] flex items-center justify-center flex-shrink-0 ml-2">
                  <Users className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
              </div>
              {!loading && stats?.users && (
                <div className="mt-2 sm:mt-3 flex flex-wrap gap-1 sm:gap-2 text-xs">
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">
                    {stats.users.taskOwners || 0} TO
                  </span>
                  <span className="px-2 py-0.5 bg-[var(--color-accent)]/10 text-[var(--color-accent)] rounded-full">
                    {stats.users.solutionProviders || 0} SP
                  </span>
                </div>
              )}
            </motion.div>
          </Link>

          <Link to="/admin/tasks" className="block">
            <motion.div variants={item} className="card p-4 sm:p-5 relative overflow-hidden group hover:shadow-lg transition-shadow cursor-pointer">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-[var(--color-text-secondary)] text-xs font-medium uppercase tracking-wider truncate">Total Tasks</p>
                  <h2 className="text-xl sm:text-2xl font-bold text-[var(--color-text)] mt-1">
                    {loading ? "..." : stats?.tasks?.total || 0}
                  </h2>
                </div>
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-400 flex items-center justify-center flex-shrink-0 ml-2">
                  <ClipboardList className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
              </div>
              {!loading && stats?.tasks && (
                <div className="mt-2 sm:mt-3 flex flex-wrap gap-1 sm:gap-2 text-xs">
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full">
                    {stats.tasks.published || 0} Active
                  </span>
                  <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full">
                    {stats.tasks.inProgress || 0} In Progress
                  </span>
                </div>
              )}
            </motion.div>
          </Link>

          <Link to="/admin/users?filter=pending" className="block">
            <motion.div variants={item} className="card p-4 sm:p-5 relative overflow-hidden group hover:shadow-lg transition-shadow cursor-pointer">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-[var(--color-text-secondary)] text-xs font-medium uppercase tracking-wider truncate">Pending Approval</p>
                  <h2 className="text-xl sm:text-2xl font-bold text-[var(--color-text)] mt-1">
                    {loading ? "..." : stats?.users?.pendingApproval || 0}
                  </h2>
                </div>
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-amber-500 to-yellow-400 flex items-center justify-center flex-shrink-0 ml-2">
                  <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
              </div>
              {!loading && stats?.users?.pendingApproval > 0 && (
                <p className="mt-2 sm:mt-3 text-xs text-amber-600 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  Requires attention
                </p>
              )}
            </motion.div>
          </Link>

          <Link to="/admin/proposals" className="block">
            <motion.div variants={item} className="card p-4 sm:p-5 relative overflow-hidden group hover:shadow-lg transition-shadow cursor-pointer">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-[var(--color-text-secondary)] text-xs font-medium uppercase tracking-wider truncate">Proposals</p>
                  <h2 className="text-xl sm:text-2xl font-bold text-[var(--color-text)] mt-1">
                    {loading ? "..." : stats?.proposals?.total || 0}
                  </h2>
                </div>
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-purple-500 to-purple-400 flex items-center justify-center flex-shrink-0 ml-2">
                  <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
              </div>
              {!loading && stats?.proposals && (
                <div className="mt-2 sm:mt-3 flex flex-wrap gap-1 sm:gap-2 text-xs">
                  <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full">
                    {stats.proposals.pending || 0} Pending
                  </span>
                </div>
              )}
            </motion.div>
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid md:grid-cols-3 gap-4"
        >
          <div className="card p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
              </div>
              <h3 className="font-semibold text-[var(--color-text)]">Weekly Activity</h3>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-[var(--color-text-secondary)]">New Users</span>
                <span className="font-medium text-[var(--color-text)]">{stats?.users?.newThisWeek || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--color-text-secondary)]">New Tasks</span>
                <span className="font-medium text-[var(--color-text)]">{stats?.tasks?.newThisWeek || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--color-text-secondary)]">Active Users (30d)</span>
                <span className="font-medium text-[var(--color-text)]">{stats?.users?.active || 0}</span>
              </div>
            </div>
          </div>

          <div className="card p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                <Activity className="w-4 h-4 text-blue-600" />
              </div>
              <h3 className="font-semibold text-[var(--color-text)]">User Breakdown</h3>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-[var(--color-text-secondary)]">Task Owners</span>
                <span className="font-medium text-[var(--color-text)]">{stats?.users?.taskOwners || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--color-text-secondary)]">Solution Providers</span>
                <span className="font-medium text-[var(--color-text)]">{stats?.users?.solutionProviders || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--color-text-secondary)]">Admins</span>
                <span className="font-medium text-[var(--color-text)]">{stats?.users?.admins || 0}</span>
              </div>
            </div>
          </div>

          <div className="card p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-lg bg-[var(--color-accent)]/10 flex items-center justify-center">
                <Briefcase className="w-4 h-4 text-[var(--color-accent)]" />
              </div>
              <h3 className="font-semibold text-[var(--color-text)]">Task Status</h3>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-[var(--color-text-secondary)]">Published</span>
                <span className="font-medium text-[var(--color-text)]">{stats?.tasks?.published || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--color-text-secondary)]">Completed</span>
                <span className="font-medium text-emerald-600">{stats?.tasks?.completed || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--color-text-secondary)]">Withdrawn</span>
                <span className="font-medium text-[var(--color-text)]">{stats?.tasks?.withdrawn || 0}</span>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card overflow-hidden"
        >
          <div className="flex gap-1 p-2 border-b border-[var(--color-border)] bg-[var(--color-bg-secondary)]">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  activeTab === id
                    ? "bg-[var(--color-surface)] text-[var(--color-text)] shadow-sm"
                    : "text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface)]/50"
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>

          <div className="p-6">
            {activeTab === "users" && <AdminUsers embedded={true} />}
            {activeTab === "tasks" && <TasksTable />}
            {activeTab === "feedback" && <FeedbackTable />}
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
