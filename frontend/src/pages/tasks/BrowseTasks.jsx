import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import DashboardLayout from "../../components/dashboard/DashboardLayout";
import { Search, Filter, MapPin, Clock, DollarSign, Users, Briefcase, X, Sparkles } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL;

const FOCUS_AREAS = ["Maternal & Child Health", "Infectious Diseases", "Non-Communicable Diseases", "Mental Health", "Health Systems & Policy", "Environmental Health", "Community Health", "Global Health Security"];
const SKILLS = ["Delivery & Implementation", "Training, Capacity Building & Learning", "Data & Evaluation", "Digital & Technology Solutions", "Program Management & Operations", "Communications & Engagement", "Policy & Strategy"];

export default function BrowseTasks() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFocus, setSelectedFocus] = useState([]);
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const res = await fetch(`${API_URL}/api/tasks`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (res.ok) setTasks(data.filter(t => t.status === "published"));
      } catch (err) {
        console.error("Error fetching tasks:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchTasks();
  }, [token]);

  const calculateMatchScore = (task) => {
    if (!user.expertise?.length) return 0;
    let score = 0;
    const userSkills = user.expertise || [];
    const taskSkills = task.requiredSkills || [];
    const taskFocus = task.focusAreas || [];
    
    taskSkills.forEach(skill => {
      if (userSkills.includes(skill)) score += 20;
    });
    taskFocus.forEach(focus => {
      if (userSkills.some(s => focus.toLowerCase().includes(s.toLowerCase().split(' ')[0]))) score += 10;
    });
    return Math.min(score, 100);
  };

  const filteredTasks = useMemo(() => {
    let result = tasks;
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(t =>
        t.title?.toLowerCase().includes(query) ||
        t.summary?.toLowerCase().includes(query) ||
        t.requiredSkills?.some(s => s.toLowerCase().includes(query))
      );
    }
    
    if (selectedFocus.length > 0) {
      result = result.filter(t =>
        t.focusAreas?.some(f => selectedFocus.includes(f))
      );
    }
    
    if (selectedSkills.length > 0) {
      result = result.filter(t =>
        t.requiredSkills?.some(s => selectedSkills.includes(s))
      );
    }
    
    return result.map(t => ({ ...t, matchScore: calculateMatchScore(t) }))
      .sort((a, b) => b.matchScore - a.matchScore);
  }, [tasks, searchQuery, selectedFocus, selectedSkills, user]);

  const toggleFilter = (arr, setArr, value) => {
    setArr(prev => prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]);
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedFocus([]);
    setSelectedSkills([]);
  };

  const hasActiveFilters = searchQuery || selectedFocus.length > 0 || selectedSkills.length > 0;

  return (
    <DashboardLayout role="Solution Provider" title="Browse Tasks">
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
            <input
              type="text"
              placeholder="Search tasks by title, description, or skills..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-light)]"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`inline-flex items-center gap-2 px-4 py-3 rounded-xl font-medium transition-colors ${
              showFilters || hasActiveFilters
                ? "bg-[var(--color-primary-light)] text-white"
                : "bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text)]"
            }`}
          >
            <Filter size={18} />
            Filters
            {hasActiveFilters && (
              <span className="w-5 h-5 rounded-full bg-white/20 text-xs flex items-center justify-center">
                {selectedFocus.length + selectedSkills.length + (searchQuery ? 1 : 0)}
              </span>
            )}
          </button>
        </div>

        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="card p-6 space-y-6"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-[var(--color-text)]">Filter Tasks</h3>
              {hasActiveFilters && (
                <button onClick={clearFilters} className="text-sm text-[var(--color-primary-light)] hover:underline flex items-center gap-1">
                  <X size={14} /> Clear all
                </button>
              )}
            </div>

            <div>
              <p className="text-sm font-medium text-[var(--color-text)] mb-3">Focus Areas</p>
              <div className="flex flex-wrap gap-2">
                {FOCUS_AREAS.map(area => (
                  <button
                    key={area}
                    onClick={() => toggleFilter(selectedFocus, setSelectedFocus, area)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                      selectedFocus.includes(area)
                        ? "bg-[var(--color-primary-light)] text-white"
                        : "bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)]"
                    }`}
                  >
                    {area}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-[var(--color-text)] mb-3">Required Skills</p>
              <div className="flex flex-wrap gap-2">
                {SKILLS.map(skill => (
                  <button
                    key={skill}
                    onClick={() => toggleFilter(selectedSkills, setSelectedSkills, skill)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                      selectedSkills.includes(skill)
                        ? "bg-[var(--color-accent)] text-white"
                        : "bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)]"
                    }`}
                  >
                    {skill}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-4 border-[var(--color-primary-light)] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="text-center py-16">
            <Briefcase size={48} className="mx-auto text-[var(--color-text-muted)] mb-4" />
            <h3 className="text-xl font-semibold text-[var(--color-text)] mb-2">No tasks found</h3>
            <p className="text-[var(--color-text-secondary)]">
              {hasActiveFilters ? "Try adjusting your filters" : "Check back soon for new opportunities"}
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredTasks.map((task, index) => (
              <motion.div
                key={task._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Link to={`/tasks/${task._id}`} className="card p-6 block hover:border-[var(--color-primary-light)] transition-colors group">
                  <div className="flex flex-col md:flex-row md:items-start gap-4">
                    <div className="flex-1">
                      <div className="flex items-start gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-[var(--color-text)] group-hover:text-[var(--color-primary-light)] transition-colors">
                          {task.title}
                        </h3>
                        {task.matchScore > 0 && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-medium">
                            <Sparkles size={12} />
                            {task.matchScore}% Match
                          </span>
                        )}
                      </div>
                      <p className="text-[var(--color-text-secondary)] line-clamp-2 mb-4">
                        {task.summary}
                      </p>
                      <div className="flex flex-wrap gap-2 mb-4">
                        {task.requiredSkills?.slice(0, 3).map(skill => (
                          <span key={skill} className="px-2 py-1 rounded-lg bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] text-xs">
                            {skill}
                          </span>
                        ))}
                        {task.requiredSkills?.length > 3 && (
                          <span className="px-2 py-1 rounded-lg bg-[var(--color-bg-secondary)] text-[var(--color-text-muted)] text-xs">
                            +{task.requiredSkills.length - 3} more
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-[var(--color-text-muted)]">
                        {task.location && (
                          <span className="inline-flex items-center gap-1">
                            <MapPin size={14} /> {task.location}
                          </span>
                        )}
                        {task.duration && (
                          <span className="inline-flex items-center gap-1">
                            <Clock size={14} /> {task.duration}
                          </span>
                        )}
                        {task.budget && (
                          <span className="inline-flex items-center gap-1">
                            <DollarSign size={14} /> {task.budget}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex md:flex-col items-center gap-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        task.fundingStatus === "funded"
                          ? "bg-green-100 text-green-700"
                          : "bg-[var(--color-accent-light)]/20 text-[var(--color-accent)]"
                      }`}>
                        {task.fundingStatus}
                      </span>
                      <span className="px-3 py-1 rounded-full bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] text-xs">
                        {task.status}
                      </span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
