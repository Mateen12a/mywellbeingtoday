// src/components/admin/FeedbackTable.jsx
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Trash2, Star, MessageSquare, User } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL;

export default function FeedbackTable() {
  const token = localStorage.getItem("token");
  const [feedback, setFeedback] = useState([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    fetch(`${API_URL}/api/admin/feedback`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        setFeedback(Array.isArray(data) ? data : []);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error("Fetch feedback error:", err);
        setIsLoading(false);
      });
  }, [token]);

  const deleteFeedback = async (id) => {
    const res = await fetch(`${API_URL}/api/admin/feedback/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      setFeedback(feedback.filter((f) => f._id !== id));
    }
  };

  const filteredFeedback = feedback.filter((f) =>
    search === "" ||
    f.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
    f.comment?.toLowerCase().includes(search.toLowerCase())
  );

  const RatingStars = ({ rating }) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating
                ? "text-yellow-500 fill-yellow-500"
                : "text-gray-300"
            }`}
          />
        ))}
        <span className="ml-2 text-sm font-medium text-[var(--color-text-secondary)]">
          {rating}/5
        </span>
      </div>
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
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" />
        <input
          type="text"
          placeholder="Search feedback..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text)] placeholder-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] transition-all"
        />
      </div>

      {filteredFeedback.length === 0 ? (
        <div className="text-center py-12">
          <MessageSquare className="w-12 h-12 mx-auto text-[var(--color-text-muted)] mb-3" />
          <p className="text-[var(--color-text-muted)]">No feedback found</p>
        </div>
      ) : (
        <div className="grid gap-4">
          <AnimatePresence mode="popLayout">
            {filteredFeedback.map((f) => (
              <motion.div
                key={f._id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="card p-5 hover:shadow-lg transition-all"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-light)] flex items-center justify-center flex-shrink-0">
                      <User className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-semibold text-[var(--color-text)]">
                          {f.user?.name || "Anonymous"}
                        </h4>
                        <RatingStars rating={f.rating} />
                      </div>
                      <p className="text-[var(--color-text-secondary)] leading-relaxed">
                        {f.comment || "No comment provided"}
                      </p>
                    </div>
                  </div>
                  
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => deleteFeedback(f._id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 transition-colors text-xs font-medium flex-shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
      
      <p className="text-xs text-[var(--color-text-muted)] text-right">
        Showing {filteredFeedback.length} of {feedback.length} feedback entries
      </p>
    </div>
  );
}
