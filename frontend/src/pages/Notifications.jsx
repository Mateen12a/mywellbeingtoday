import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  Trash2,
  CheckCheck,
  Filter,
  MessageSquare,
  FileText,
  AlertCircle,
  Briefcase,
  X,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import DashboardLayout from "../components/dashboard/DashboardLayout";

const API_URL = import.meta.env.VITE_API_URL;

export default function Notifications() {
  const token = localStorage.getItem("token");
  const navigate = useNavigate();
  
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [selectedIds, setSelectedIds] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 20 });
      if (filter !== "all") params.append("type", filter);
      
      const res = await fetch(`${API_URL}/api/notifications?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setNotifications(data.notifications || []);
        setTotalPages(data.totalPages || 1);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (err) {
      console.error("Error fetching notifications:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [page, filter]);

  const markAsRead = async (id) => {
    try {
      await fetch(`${API_URL}/api/notifications/${id}/read`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error("Error marking as read:", err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await fetch(`${API_URL}/api/notifications/read-all`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error("Error marking all as read:", err);
    }
  };

  const deleteNotification = async (id) => {
    try {
      await fetch(`${API_URL}/api/notifications/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications((prev) => prev.filter((n) => n._id !== id));
      setSelectedIds((prev) => prev.filter((i) => i !== id));
    } catch (err) {
      console.error("Error deleting notification:", err);
    }
  };

  const deleteSelected = async () => {
    if (selectedIds.length === 0) return;
    try {
      await fetch(`${API_URL}/api/notifications/delete-multiple`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ids: selectedIds }),
      });
      setNotifications((prev) => prev.filter((n) => !selectedIds.includes(n._id)));
      setSelectedIds([]);
    } catch (err) {
      console.error("Error deleting notifications:", err);
    }
  };

  const toggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    if (selectedIds.length === notifications.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(notifications.map((n) => n._id));
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case "message":
        return <MessageSquare className="w-5 h-5 text-blue-500" />;
      case "proposal":
      case "application":
        return <FileText className="w-5 h-5 text-green-500" />;
      case "task":
        return <Briefcase className="w-5 h-5 text-purple-500" />;
      case "system":
        return <AlertCircle className="w-5 h-5 text-orange-500" />;
      case "admin":
        return <AlertCircle className="w-5 h-5 text-purple-500" />;
      default:
        return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  const filterOptions = [
    { value: "all", label: "All" },
    { value: "message", label: "Messages" },
    { value: "proposal", label: "Proposals" },
    { value: "application", label: "Applications" },
    { value: "task", label: "Tasks" },
    { value: "system", label: "System" },
    { value: "admin", label: "Admin" },
  ];

  return (
    <DashboardLayout title="Notifications">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-[var(--color-text)]">Notifications</h1>
            {unreadCount > 0 && (
              <p className="text-sm text-[var(--color-text-secondary)] mt-1">
                {unreadCount} unread notification{unreadCount !== 1 ? "s" : ""}
              </p>
            )}
          </div>
          
          <div className="flex flex-wrap gap-2">
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors"
              >
                <CheckCheck className="w-4 h-4" />
                Mark all read
              </button>
            )}
            
            {selectedIds.length > 0 && (
              <button
                onClick={deleteSelected}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-xl hover:bg-red-100 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Delete ({selectedIds.length})
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-2">
          <Filter className="w-4 h-4 text-[var(--color-text-muted)] flex-shrink-0" />
          {filterOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => { setFilter(opt.value); setPage(1); }}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg whitespace-nowrap transition-colors ${
                filter === opt.value
                  ? "bg-[var(--color-primary)] text-white"
                  : "bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)]"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {notifications.length > 0 && (
          <div className="flex items-center gap-3 mb-4 px-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedIds.length === notifications.length && notifications.length > 0}
                onChange={selectAll}
                className="w-4 h-4 rounded border-[var(--color-border)] text-[var(--color-primary)] focus:ring-[var(--color-primary)]"
              />
              <span className="text-sm text-[var(--color-text-secondary)]">Select all</span>
            </label>
          </div>
        )}

        <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-[var(--color-primary)]" />
              <span className="ml-2 text-[var(--color-text-secondary)]">Loading...</span>
            </div>
          ) : notifications.length === 0 ? (
            <div className="py-16 text-center">
              <div className="w-16 h-16 bg-[var(--color-bg-secondary)] rounded-full flex items-center justify-center mx-auto mb-4">
                <Bell className="w-8 h-8 text-[var(--color-text-muted)]" />
              </div>
              <h3 className="text-lg font-semibold text-[var(--color-text)] mb-1">No notifications</h3>
              <p className="text-[var(--color-text-secondary)] text-sm">
                {filter !== "all" ? `No ${filter} notifications found` : "You're all caught up!"}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[var(--color-border)]">
              <AnimatePresence>
                {notifications.map((n) => (
                  <motion.div
                    key={n._id}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    className={`flex items-start gap-4 p-4 hover:bg-[var(--color-bg-secondary)] transition-colors ${
                      !n.read ? "bg-blue-50/50" : ""
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(n._id)}
                      onChange={() => toggleSelect(n._id)}
                      className="mt-1 w-4 h-4 rounded border-[var(--color-border)] text-[var(--color-primary)] focus:ring-[var(--color-primary)]"
                    />
                    
                    <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${
                      !n.read ? "bg-blue-100" : "bg-[var(--color-bg-secondary)]"
                    }`}>
                      {getNotificationIcon(n.type)}
                    </div>
                    
                    <div
                      className="flex-1 min-w-0 cursor-pointer"
                      onClick={async () => {
                        if (!n.read) {
                          await markAsRead(n._id);
                        }
                        if (n.link) {
                          const currentPath = window.location.pathname;
                          if (currentPath === n.link) {
                            window.location.reload();
                          } else {
                            navigate(n.link, { replace: false });
                          }
                        }
                      }}
                    >
                      {n.title && (
                        <p className="text-sm font-semibold text-[var(--color-text)] mb-0.5">{n.title}</p>
                      )}
                      <p className={`text-sm ${!n.read ? "font-medium text-[var(--color-text)]" : "text-[var(--color-text-secondary)]"}`}>
                        {n.message}
                      </p>
                      <p className="text-xs text-[var(--color-text-muted)] mt-1">
                        {formatTime(n.createdAt)}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {!n.read && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full" />
                      )}
                      <button
                        onClick={() => deleteNotification(n._id)}
                        className="p-2 rounded-lg hover:bg-red-100 text-[var(--color-text-muted)] hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-6">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 rounded-lg bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="px-4 py-2 text-sm text-[var(--color-text-secondary)]">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-2 rounded-lg bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
