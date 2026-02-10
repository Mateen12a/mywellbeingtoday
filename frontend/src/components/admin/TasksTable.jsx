// src/components/admin/TasksTable.jsx
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Filter, ExternalLink, Trash2, CheckCircle, Clock, AlertCircle, XCircle } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL;

const statusConfig = {
  published: { label: "Published", icon: CheckCircle, bg: "bg-emerald-100", text: "text-emerald-700" },
  "in-progress": { label: "In Progress", icon: Clock, bg: "bg-blue-100", text: "text-blue-700" },
  completed: { label: "Completed", icon: CheckCircle, bg: "bg-purple-100", text: "text-purple-700" },
  withdrawn: { label: "Withdrawn", icon: XCircle, bg: "bg-red-100", text: "text-red-700" },
};

export default function TasksTable() {
  const token = localStorage.getItem("token");
  const [tasks, setTasks] = useState([]);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    fetch(`${API_URL}/api/admin/tasks`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        setTasks(Array.isArray(data) ? data : []);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error("Fetch tasks error:", err);
        setIsLoading(false);
      });
  }, [token]);

  const updateStatus = async (id, status) => {
    const res = await fetch(`${API_URL}/api/admin/tasks/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      setTasks(tasks.map((t) => (t._id === id ? { ...t, status } : t)));
    }
  };

  const filteredTasks = tasks
    .filter((t) => filter === "all" || t.status === filter)
    .filter((t) => 
      search === "" || 
      t.title?.toLowerCase().includes(search.toLowerCase()) ||
      t.owner?.name?.toLowerCase().includes(search.toLowerCase())
    );

  const StatusBadge = ({ status }) => {
    const config = statusConfig[status] || statusConfig.published;
    const Icon = config.icon;
    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        <Icon className="w-3 h-3" />
        {config.label}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" />
          <input
            type="text"
            placeholder="Search tasks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text)] placeholder-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] transition-all"
          />
        </div>
        
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-[var(--color-text-muted)]" />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-4 py-2.5 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] transition-all cursor-pointer"
          >
            <option value="all">All Tasks</option>
            <option value="published">Published</option>
            <option value="in-progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="withdrawn">Withdrawn</option>
          </select>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-[var(--color-border)]">
        <table className="w-full text-sm">
          <thead className="bg-[var(--color-surface)]">
            <tr>
              <th className="p-4 text-left font-semibold text-[var(--color-text)]">Title</th>
              <th className="p-4 text-left font-semibold text-[var(--color-text)]">Owner</th>
              <th className="p-4 text-left font-semibold text-[var(--color-text)]">Status</th>
              <th className="p-4 text-right font-semibold text-[var(--color-text)]">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-border)]">
            <AnimatePresence mode="popLayout">
              {filteredTasks.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-[var(--color-text-muted)]">
                    No tasks found
                  </td>
                </tr>
              ) : (
                filteredTasks.map((t) => (
                  <motion.tr
                    key={t._id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="bg-[var(--color-bg)] hover:bg-[var(--color-surface)] transition-colors"
                  >
                    <td className="p-4">
                      <a 
                        href={`/tasks/${t._id}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 font-medium text-[var(--color-text)] hover:text-[var(--color-primary)] transition-colors"
                      >
                        {t.title}
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </td>
                    <td className="p-4 text-[var(--color-text-secondary)]">
                      {t.owner?.name || "Unknown"}
                    </td>
                    <td className="p-4">
                      <StatusBadge status={t.status} />
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-end gap-2">
                        {t.status !== "withdrawn" && (
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => updateStatus(t._id, "withdrawn")}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 transition-colors text-xs font-medium"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Remove
                          </motion.button>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </AnimatePresence>
          </tbody>
        </table>
      </div>
      
      <p className="text-xs text-[var(--color-text-muted)] text-right">
        Showing {filteredTasks.length} of {tasks.length} tasks
      </p>
    </div>
  );
}
