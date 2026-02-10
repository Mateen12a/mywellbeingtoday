// src/pages/dashboard/SolutionProviderTasks.jsx
import { useEffect, useState, useMemo } from "react";
import DashboardLayout from "../../components/dashboard/DashboardLayout";
import DashboardStats from "../../components/dashboard/DashboardStats";
import { Link } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL;

export default function SolutionProviderTasks() {
  const [tasks, setTasks] = useState([]);
  const [userProfile, setUserProfile] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const token = localStorage.getItem("token");

  /** 🔹 Fetch tasks and user profile */
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [tasksRes, profileRes] = await Promise.all([
          fetch(`${API_URL}/api/tasks`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${API_URL}/api/users/me`, { headers: { Authorization: `Bearer ${token}` } }),
        ]);

        if (tasksRes.ok) setTasks(await tasksRes.json());
        if (profileRes.ok) setUserProfile(await profileRes.json());
      } catch (err) {
        console.error("Error fetching data:", err);
      }
    };
    fetchData();
  }, [token]);

  /** 🔹 Filter tasks by status */
  const availableTasks = tasks.filter((t) => t.status === "published");
  const inProgressTasks = tasks.filter((t) => ["in progress", "ongoing"].includes(t.status));
  const completedTasks = tasks.filter((t) => t.status === "completed");

  /** 🔹 Match tasks to solution provider based on skills/interests */
  const matchedTasks = useMemo(() => {
    if (!userProfile) return [];
    return availableTasks.filter((task) => {
      const userSkills = userProfile.skills || [];
      const userInterests = userProfile.interests || [];
      const taskSkills = task.requiredSkills || [];
      const taskCategory = task.category || "";

      const skillMatch = taskSkills.some((s) => userSkills.includes(s));
      const interestMatch = userInterests.includes(taskCategory);

      return skillMatch || interestMatch;
    });
  }, [availableTasks, userProfile]);

  /** 🔹 Stats for dashboard */
  const stats = [
    { label: "Available Tasks", value: availableTasks.length, color: "text-[#357FE9]" },
    { label: "Matched Tasks", value: matchedTasks.length, color: "text-[#6A5ACD]" },
    { label: "In Progress", value: inProgressTasks.length, color: "text-[#F7B526]" },
    { label: "Completed", value: completedTasks.length, color: "text-[#34A853]" },
  ];

  /** 🔹 Filtered tasks for search */
  const filteredTasks = useMemo(() => {
    if (!searchQuery) return availableTasks;
    return availableTasks.filter(
      (t) =>
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.summary.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery, availableTasks]);

  return (
    <DashboardLayout role="Solution Provider" title="Dashboard">
      {/* Stats */}
      <DashboardStats stats={stats} />

      {/* Search */}
      <div className="mt-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h2 className="text-2xl font-bold text-[var(--color-text)]">Find Tasks</h2>
        <div className="relative w-full md:w-1/3">
          <input
            type="text"
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] rounded-xl px-4 py-2.5 pl-10 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] transition-all"
          />
          <svg className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {/* Matched tasks highlight */}
      {matchedTasks.length > 0 && (
        <div className="mt-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
              <span className="text-lg">✨</span>
            </div>
            <div>
              <h3 className="text-xl font-bold text-purple-700">Recommended for You</h3>
              <p className="text-sm text-[var(--color-text-muted)]">Based on your skills and interests</p>
            </div>
          </div>
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
            {matchedTasks.map((task) => (
              <TaskCard key={task._id} task={task} highlight />
            ))}
          </div>
        </div>
      )}

      {/* Available Tasks */}
      <div className="mt-10">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
            <span className="text-lg">📋</span>
          </div>
          <h3 className="text-xl font-bold text-[var(--color-primary)]">All Available Tasks</h3>
        </div>
        {filteredTasks.length === 0 ? (
          <div className="text-center py-12 bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)]">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--color-bg-tertiary)] flex items-center justify-center">
              <span className="text-2xl">🔍</span>
            </div>
            <p className="text-[var(--color-text-secondary)]">No tasks match your search criteria.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredTasks.map((task) => (
              <TaskCard key={task._id} task={task} />
            ))}
          </div>
        )}
      </div>

      {/* Recently Completed */}
      {completedTasks.length > 0 && (
        <div className="mt-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
              <span className="text-lg">✅</span>
            </div>
            <h3 className="text-xl font-bold text-emerald-600">Recently Completed</h3>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {completedTasks.slice(0, 3).map((t) => (
              <div
                key={t._id}
                className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-5 shadow-sm hover:shadow-md transition-all group"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-emerald-600">✓</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-emerald-700 truncate group-hover:text-emerald-600 transition-colors">{t.title}</h4>
                    <p className="text-sm text-[var(--color-text-secondary)] line-clamp-2 mt-1">{t.summary}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

/** 🔹 Task Card Component */
function TaskCard({ task, highlight }) {
  return (
    <div
      className={`bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 p-6 group relative overflow-hidden ${
        highlight ? "ring-2 ring-purple-400 bg-purple-50/50" : ""
      }`}
    >
      {highlight && (
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-purple-600" />
      )}
      
      <div className="flex justify-between items-start gap-4">
        <div className="flex-1 min-w-0">
          <h3 className={`text-lg font-bold truncate ${highlight ? "text-purple-700" : "text-[var(--color-primary)]"} group-hover:text-[var(--color-primary-light)] transition-colors`}>
            {task.title}
          </h3>
          <p className="text-sm text-[var(--color-text-secondary)] line-clamp-2 mt-2 leading-relaxed">{task.summary}</p>
        </div>
        <Link
          to={`/tasks/${task._id}`}
          className="flex-shrink-0 px-4 py-2 bg-[var(--color-primary)] hover:bg-[var(--color-primary-light)] text-white text-sm font-semibold rounded-lg transition-all shadow-sm hover:shadow-md"
        >
          View & Apply
        </Link>
      </div>
      
      <div className="mt-4 pt-4 border-t border-[var(--color-border)] flex flex-wrap gap-2">
        <span className="px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 capitalize">
          {task.status}
        </span>
        {task.location && (
          <span className="px-3 py-1.5 rounded-full text-xs font-medium bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)]">
            📍 {task.location}
          </span>
        )}
        {task.requiredSkills?.slice(0, 2).map((s) => (
          <span
            key={s}
            className="px-3 py-1.5 rounded-full text-xs font-medium bg-blue-50 text-blue-600"
          >
            {s}
          </span>
        ))}
        {task.requiredSkills?.length > 2 && (
          <span className="px-3 py-1.5 rounded-full text-xs font-medium bg-[var(--color-bg-tertiary)] text-[var(--color-text-muted)]">
            +{task.requiredSkills.length - 2} more
          </span>
        )}
      </div>
    </div>
  );
}
