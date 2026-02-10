import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Search, ExternalLink, CheckCircle, XCircle, Trash2, Loader2, Eye, Clock } from "lucide-react";
import { Link } from "react-router-dom";
import DashboardLayout from "../../components/dashboard/DashboardLayout";

const API_URL = import.meta.env.VITE_API_URL;

function Spinner({ size = 16 }) {
  return (
    <Loader2
      className="animate-spin text-[var(--color-primary-light)]"
      style={{ width: size, height: size }}
    />
  );
}

export default function AdminTasks() {
  const token = localStorage.getItem("token");
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [actionLoading, setActionLoading] = useState({});

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const res = await fetch(`${API_URL}/api/admin/tasks`, {
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

  const handleAction = async (id, action) => {
    setActionLoading((prev) => ({ ...prev, [id]: action }));
    try {
      const res = await fetch(`${API_URL}/api/admin/tasks/${id}/${action}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        if (action === "delete") {
          setTasks((prev) => prev.filter((t) => t._id !== id));
        } else {
          setTasks((prev) =>
            prev.map((t) =>
              t._id === id ? { ...t, status: action === "publish" ? "published" : "withdrawn" } : t
            )
          );
        }
      }
    } catch (err) {
      console.error("Task moderation error:", err);
    } finally {
      setActionLoading((prev) => ({ ...prev, [id]: null }));
    }
  };

  const filteredTasks = tasks.filter((t) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      t.title?.toLowerCase().includes(query) ||
      t.owner?.name?.toLowerCase().includes(query)
    );
  });

  const StatusBadge = ({ status }) => {
    const config = {
      published: { color: "bg-emerald-100 text-emerald-700", icon: CheckCircle },
      withdrawn: { color: "bg-red-100 text-red-700", icon: XCircle },
      completed: { color: "bg-blue-100 text-blue-700", icon: CheckCircle },
      "in-progress": { color: "bg-yellow-100 text-yellow-700", icon: Clock },
    };
    const { color, icon: Icon } = config[status] || config.published;
    
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-full capitalize ${color}`}>
        {Icon && <Icon className="w-3.5 h-3.5" />}
        {status}
      </span>
    );
  };

  if (loading)
    return (
      <DashboardLayout role="Admin" title="Manage Tasks">
        <div className="flex items-center justify-center py-12 gap-3 text-[var(--color-text-secondary)]">
          <Spinner size={24} /> Loading tasks...
        </div>
      </DashboardLayout>
    );

  return (
    <DashboardLayout role="Admin" title="Manage Tasks">
      <div>
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-text-muted)]" />
          <input
            type="text"
            placeholder="Search tasks by title or owner..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-[var(--color-border)] bg-[var(--color-bg-secondary)] text-[var(--color-text)] rounded-xl focus:ring-2 focus:ring-[var(--color-primary-light)] focus:border-transparent"
          />
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-[var(--color-border)]">
        <table className="w-full">
          <thead className="bg-[var(--color-bg-secondary)]">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">Task</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">Owner</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">Status</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-[var(--color-border)]">
            {filteredTasks.map((t) => (
              <motion.tr
                key={t._id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="hover:bg-[var(--color-bg-secondary)] transition-colors"
              >
                <td className="px-4 py-3">
                  <Link
                    to={`/tasks/${t._id}`}
                    className="flex items-center gap-2 text-[var(--color-text)] hover:text-[var(--color-primary-light)] font-medium transition-colors group"
                  >
                    {t.title}
                    <ExternalLink className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                </td>
                <td className="px-4 py-3 text-[var(--color-text-secondary)] text-sm">
                  {t.owner?.name || "Unknown"}
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={t.status} />
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-center gap-2 flex-wrap">
                    <Link
                      to={`/tasks/${t._id}`}
                      className="p-2 rounded-lg hover:bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] hover:text-[var(--color-primary-light)] transition-colors"
                      title="View Task"
                    >
                      <Eye className="w-4 h-4" />
                    </Link>

                    {t.status !== "published" && (
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleAction(t._id, "publish")}
                        className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 hover:bg-emerald-700 transition-colors"
                        disabled={actionLoading[t._id] === "publish"}
                      >
                        {actionLoading[t._id] === "publish" ? (
                          <Spinner size={12} />
                        ) : (
                          <CheckCircle className="w-3.5 h-3.5" />
                        )}
                        {actionLoading[t._id] === "publish" ? "..." : "Publish"}
                      </motion.button>
                    )}

                    {t.status === "published" && (
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleAction(t._id, "withdraw")}
                        className="px-3 py-1.5 bg-amber-600 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 hover:bg-amber-700 transition-colors"
                        disabled={actionLoading[t._id] === "withdraw"}
                      >
                        {actionLoading[t._id] === "withdraw" ? (
                          <Spinner size={12} />
                        ) : (
                          <XCircle className="w-3.5 h-3.5" />
                        )}
                        {actionLoading[t._id] === "withdraw" ? "..." : "Withdraw"}
                      </motion.button>
                    )}

                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        if (window.confirm("Are you sure you want to delete this task?")) {
                          handleAction(t._id, "delete");
                        }
                      }}
                      className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 hover:bg-red-700 transition-colors"
                      disabled={actionLoading[t._id] === "delete"}
                    >
                      {actionLoading[t._id] === "delete" ? (
                        <Spinner size={12} />
                      ) : (
                        <Trash2 className="w-3.5 h-3.5" />
                      )}
                      {actionLoading[t._id] === "delete" ? "..." : "Delete"}
                    </motion.button>
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredTasks.length === 0 && (
        <div className="text-center py-12 text-[var(--color-text-secondary)]">
          No tasks found matching your criteria.
        </div>
      )}
      </div>
    </DashboardLayout>
  );
}
