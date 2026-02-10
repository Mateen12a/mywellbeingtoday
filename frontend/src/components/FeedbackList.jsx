import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Star, MessageCircle, ThumbsUp, AlertTriangle, User, Calendar } from "lucide-react";
import FeedbackSummaryCard from "./FeedbackSummaryCard";

const API_URL = import.meta.env.VITE_API_URL;

export default function FeedbackList({ userId }) {
  const token = localStorage.getItem("token");
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [avgRating, setAvgRating] = useState(0);

  useEffect(() => {
    if (!userId) return;

    fetch(`${API_URL}/api/feedback/received/${userId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        const feedbackArray = Array.isArray(data) ? data : [];
        setFeedbacks(feedbackArray);

        if (feedbackArray.length > 0) {
          const avg =
            feedbackArray.reduce((sum, f) => sum + (f.rating || 0), 0) /
            feedbackArray.length;
          setAvgRating(avg.toFixed(1));
        } else {
          setAvgRating(0);
        }

        setLoading(false);
      })
      .catch((err) => {
        console.error("Feedback fetch error:", err);
        setLoading(false);
      });
  }, [userId, token]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="w-8 h-8 border-3 border-[var(--color-primary)]/30 border-t-[var(--color-primary)] rounded-full animate-spin" />
      </div>
    );
  }

  if (feedbacks.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 rounded-full bg-[var(--color-bg-secondary)] flex items-center justify-center mx-auto mb-4">
          <MessageCircle className="w-8 h-8 text-[var(--color-text-muted)]" />
        </div>
        <p className="text-[var(--color-text-secondary)]">No feedback received yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {feedbacks.length > 0 && (
        <FeedbackSummaryCard avgRating={avgRating} totalReviews={feedbacks.length} />
      )}

      <div className="space-y-4">
        {feedbacks.map((f, index) => (
          <motion.div
            key={f._id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="card p-5"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-light)] flex items-center justify-center text-white font-semibold text-sm">
                  {f.fromUser?.name?.[0] || f.fromUser?.firstName?.[0] || "U"}
                </div>
                <div>
                  <p className="font-semibold text-[var(--color-text)]">
                    {f.fromUser?.name || f.fromUser?.firstName || "Anonymous"}
                  </p>
                  <p className="text-xs text-[var(--color-text-muted)] flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(f.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    size={18}
                    className={`${
                      star <= f.rating
                        ? "fill-amber-400 text-amber-400"
                        : "text-gray-300"
                    }`}
                  />
                ))}
              </div>
            </div>

            {f.taskId?.title && (
              <p className="text-xs text-[var(--color-text-muted)] mt-2 px-3 py-1 bg-[var(--color-bg-secondary)] rounded-lg inline-block">
                Task: {f.taskId.title}
              </p>
            )}

            {f.testimonial && (
              <blockquote className="mt-4 pl-4 border-l-3 border-[var(--color-primary)] italic text-[var(--color-text)]">
                "{f.testimonial}"
              </blockquote>
            )}

            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
              {f.strengths && (
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                  <p className="text-xs font-medium text-emerald-600 flex items-center gap-1 mb-1">
                    <ThumbsUp className="w-3 h-3" /> Strengths
                  </p>
                  <p className="text-sm text-emerald-700">{f.strengths}</p>
                </div>
              )}

              {f.improvementAreas && (
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200">
                  <p className="text-xs font-medium text-amber-600 flex items-center gap-1 mb-1">
                    <AlertTriangle className="w-3 h-3" /> Areas for Improvement
                  </p>
                  <p className="text-sm text-amber-700">{f.improvementAreas}</p>
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
