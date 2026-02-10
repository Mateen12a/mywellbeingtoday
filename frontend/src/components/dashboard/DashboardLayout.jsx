import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Menu,
  LogOut,
  User,
  Grid,
  Clipboard,
  Users,
  Settings,
  X,
  MessageSquare,
  PlusCircle,
  FolderOpen,
} from "lucide-react";
import NotificationBell from "../NotificationBell";
import logo from "../../assets/logo.png";

const API_URL = import.meta.env.VITE_API_URL;

export default function DashboardLayout({ children, role: propRole, title }) {
  const navigate = useNavigate();
  const location = useLocation();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [applicationsCount, setApplicationsCount] = useState(0);
  const [availableTasksCount, setAvailableTasksCount] = useState(0);
  const [user, setUser] = useState(null);

  const token = localStorage.getItem("token");
  const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
  const localRole = propRole || localStorage.getItem("role") || storedUser.role || "user";

  const normalizeRole = (r) => {
    if (!r) return "User";
    const lower = r.toLowerCase();
    if (lower.includes("task")) return "Task Owner";
    if (lower.includes("solution")) return "Solution Provider";
    if (lower.includes("admin")) return "Admin";
    return "User";
  };

  const role = normalizeRole(localRole);

  const getFirstName = (u) =>
    u?.firstName || u?.first_name || u?.name?.split(" ")[0] || "User";

  useEffect(() => {
    if (!token) {
      navigate("/login", { replace: true });
      return;
    }

    const pathname = location.pathname.toLowerCase();
    
    if (role === "Task Owner") {
      if (pathname.includes("/dashboard/sp") || pathname.includes("/dashboard/admin") || pathname.includes("/admin/")) {
        navigate("/dashboard/to", { replace: true });
        return;
      }
    } else if (role === "Solution Provider") {
      if (pathname.includes("/dashboard/to") || pathname.includes("/dashboard/admin") || pathname.includes("/admin/")) {
        navigate("/dashboard/sp", { replace: true });
        return;
      }
    } else if (role === "Admin") {
      if (pathname.includes("/dashboard/to") || pathname.includes("/dashboard/sp")) {
        navigate("/dashboard/admin", { replace: true });
        return;
      }
    }

    // Fetch unread messages count
    fetch(`${API_URL}/api/messages/unread/count`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => setUnreadCount(data.unreadCount || data.count || 0))
      .catch(() => setUnreadCount(0));

    // Fetch application stats for Solution Providers (pending proposals count)
    if (role === "Solution Provider") {
      fetch(`${API_URL}/api/proposals/my-stats`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((data) => {
          // Show pending applications count as badge
          setApplicationsCount(data.applied || 0);
        })
        .catch(() => setApplicationsCount(0));

      // Fetch available tasks count
      fetch(`${API_URL}/api/tasks/available-count`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((data) => setAvailableTasksCount(data.count || 0))
        .catch(() => setAvailableTasksCount(0));
    }

    const stored = localStorage.getItem("user");
    if (stored) setUser(JSON.parse(stored));
  }, [token, location.pathname, role, navigate]);

  const logout = () => {
    ["token", "role", "user"].forEach((k) => localStorage.removeItem(k));
    navigate("/login", { replace: true });
  };

  const roleLinks =
    role === "Admin"
      ? [
          { to: "/dashboard/admin", label: "Overview", icon: Grid },
          { to: "/admin/users", label: "Manage Users", icon: Users },
          { to: "/admin/tasks", label: "Manage Tasks", icon: Clipboard },
          { to: "/admin/proposals", label: "Proposals", icon: FolderOpen },
          { to: "/messages", label: "Messages", icon: MessageSquare },
          { to: "/settings", label: "Settings", icon: Settings },
        ]
      : role === "Task Owner"
      ? [
          { to: "/dashboard/to", label: "My Tasks", icon: FolderOpen },
          { to: "/tasks/create", label: "Create Task", icon: PlusCircle },
          { to: "/messages", label: "Messages", icon: MessageSquare },
          { to: "/profile", label: "Profile", icon: User },
          { to: "/settings", label: "Settings", icon: Settings },
        ]
      : [
          { to: "/dashboard/sp", label: "Available Tasks", icon: Clipboard },
          { to: "/browse-tasks", label: "Browse All Tasks", icon: FolderOpen },
          { to: "/my-applications", label: "My Applications", icon: Users },
          { to: "/messages", label: "Messages", icon: MessageSquare },
          { to: "/profile", label: "Profile", icon: User },
          { to: "/settings", label: "Settings", icon: Settings },
        ];

  const SidebarContent = () => (
    <div className="flex flex-col bg-[var(--color-surface)] h-full border-r border-[var(--color-border)] w-64 p-6">
      <div className="flex items-center justify-between mb-8">
        <Link to="/" className="block">
          <div className="bg-white rounded-xl p-3">
            <img src={logo} alt="Logo" className="h-14 w-auto object-contain" />
          </div>
        </Link>
        <button
          onClick={() => setSidebarOpen(false)}
          className="md:hidden p-1.5 rounded-lg hover:bg-[var(--color-bg-secondary)] transition-colors"
        >
          <X className="w-5 h-5 text-[var(--color-text-secondary)]" />
        </button>
      </div>

      <div className="mb-6 px-3 py-3 rounded-xl bg-[var(--color-bg-secondary)]">
        <p className="text-xs text-[var(--color-text-muted)] uppercase tracking-wider font-medium">
          {role}
        </p>
        <p className="text-sm font-semibold text-[var(--color-text)] mt-1 truncate">
          {user?.title ? `${user.title} ${getFirstName(user)}` : getFirstName(user)}
        </p>
      </div>

      <nav className="space-y-1 flex-1">
        {roleLinks.map((l) => {
          const Icon = l.icon;
          const active = location.pathname === l.to;
          return (
            <Link
              key={l.to}
              to={l.to}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                active
                  ? "bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-light)] text-white shadow-md"
                  : "text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-secondary)] hover:text-[var(--color-text)]"
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-5 h-5 ${active ? "text-white" : ""}`} />
                <span>{l.label}</span>
              </div>
              {l.to === "/messages" && unreadCount > 0 && (
                <span className={`text-white text-xs font-bold px-2 py-0.5 rounded-full ${active ? "bg-white/30" : "bg-[var(--color-accent)]"}`}>
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
              {l.to === "/my-applications" && applicationsCount > 0 && (
                <span className={`text-white text-xs font-bold px-2 py-0.5 rounded-full ${active ? "bg-white/30" : "bg-[var(--color-primary)]"}`}>
                  {applicationsCount > 99 ? "99+" : applicationsCount}
                </span>
              )}
              {l.to === "/dashboard/sp" && availableTasksCount > 0 && (
                <span className={`text-white text-xs font-bold px-2 py-0.5 rounded-full ${active ? "bg-white/30" : "bg-green-500"}`}>
                  {availableTasksCount > 99 ? "99+" : availableTasksCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-[var(--color-border)] pt-4 mt-4">
        <button
          onClick={logout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium hover:bg-red-50 text-red-600 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span>Log out</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-[var(--color-bg)]">
      <aside className="hidden md:flex">
        <SidebarContent />
      </aside>

      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 left-0 h-full z-50"
            >
              <SidebarContent />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <div className="flex-1 flex flex-col">
        <header className="flex items-center justify-between p-4 border-b border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden p-2 rounded-xl hover:bg-[var(--color-bg-secondary)] transition-colors"
            >
              <Menu className="w-5 h-5 text-[var(--color-text-secondary)]" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-[var(--color-text)]">{title}</h1>
              <p className="text-xs text-[var(--color-text-muted)] hidden sm:block">
                {new Date().toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <NotificationBell />
            <div className="hidden sm:flex items-center gap-3 pl-4 border-l border-[var(--color-border)]">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-light)] flex items-center justify-center text-white font-semibold">
                {getFirstName(user)?.[0]?.toUpperCase() || "U"}
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-[var(--color-text)]">
                  {user?.title ? `${user.title} ${getFirstName(user)}` : getFirstName(user)}
                </p>
                <p className="text-xs text-[var(--color-text-muted)]">{role}</p>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
