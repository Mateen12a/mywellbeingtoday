import { useState } from "react";
import { motion } from "framer-motion";
import { Star, Send, MessageSquare, ThumbsUp, AlertCircle, CheckCircle } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL;

export default function FeedbackForm({ taskId, toUser, onFeedbackSubmitted }) {
  const token = localStorage.getItem("token");
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [strengths, setStrengths] = useState("");
  const [improvementAreas, setImprovementAreas] = useState("");
  const [testimonial, setTestimonial] = useState("");
  const [privateNotes, setPrivateNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    
    if (rating === 0) {
      setError("Please select a rating");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/feedback`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          taskId,
          toUser,
          rating,
          strengths,
          improvementAreas,
          testimonial,
          privateNotes,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess(true);
        onFeedbackSubmitted && onFeedbackSubmitted(data);
        setTimeout(() => {
          setRating(0);
          setStrengths("");
          setImprovementAreas("");
          setTestimonial("");
          setPrivateNotes("");
          setSuccess(false);
        }, 2000);
      } else {
        setError(data.msg || "Failed to submit feedback");
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const ratingLabels = ["", "Poor", "Fair", "Good", "Very Good", "Excellent"];

  if (success) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="card p-8 text-center"
      >
        <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-emerald-600" />
        </div>
        <h3 className="text-xl font-semibold text-[var(--color-text)] mb-2">Thank You!</h3>
        <p className="text-[var(--color-text-secondary)]">Your feedback has been submitted successfully.</p>
      </motion.div>
    );
  }

  return (
    <motion.form
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      onSubmit={handleSubmit}
      className="card p-6 space-y-6"
    >
      <div className="flex items-center gap-3 pb-4 border-b border-[var(--color-border)]">
        <div className="w-10 h-10 rounded-xl bg-[var(--color-primary)]/10 flex items-center justify-center">
          <MessageSquare className="w-5 h-5 text-[var(--color-primary)]" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-[var(--color-text)]">Leave Feedback</h2>
          <p className="text-sm text-[var(--color-text-muted)]">Share your experience working together</p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-600">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-[var(--color-text)] mb-3">
          Overall Rating <span className="text-red-500">*</span>
        </label>
        <div className="flex items-center gap-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <motion.button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="p-1 focus:outline-none"
            >
              <Star
                size={32}
                className={`transition-colors ${
                  star <= (hoverRating || rating)
                    ? "fill-amber-400 text-amber-400"
                    : "text-gray-300"
                }`}
              />
            </motion.button>
          ))}
          {(hoverRating || rating) > 0 && (
            <span className="ml-3 text-sm font-medium text-[var(--color-text-secondary)]">
              {ratingLabels[hoverRating || rating]}
            </span>
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-[var(--color-text)] mb-2">
          <ThumbsUp className="w-4 h-4 inline mr-2" />
          Strengths
        </label>
        <textarea
          value={strengths}
          onChange={(e) => setStrengths(e.target.value)}
          placeholder="What went really well? What did you appreciate?"
          className="w-full border border-[var(--color-border)] bg-[var(--color-bg-secondary)] text-[var(--color-text)] rounded-xl p-3 text-sm focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent outline-none resize-none transition-all"
          rows={3}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-[var(--color-text)] mb-2">
          Areas for Improvement
        </label>
        <textarea
          value={improvementAreas}
          onChange={(e) => setImprovementAreas(e.target.value)}
          placeholder="Where could things have been better?"
          className="w-full border border-[var(--color-border)] bg-[var(--color-bg-secondary)] text-[var(--color-text)] rounded-xl p-3 text-sm focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent outline-none resize-none transition-all"
          rows={3}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-[var(--color-text)] mb-2">
          Public Testimonial
        </label>
        <textarea
          value={testimonial}
          onChange={(e) => setTestimonial(e.target.value)}
          placeholder="Write a testimonial that others can see on their profile"
          className="w-full border border-[var(--color-border)] bg-[var(--color-bg-secondary)] text-[var(--color-text)] rounded-xl p-3 text-sm focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent outline-none resize-none transition-all"
          rows={3}
        />
        <p className="text-xs text-[var(--color-text-muted)] mt-1">
          This will be visible on the user's public profile
        </p>
      </div>

      <div className="p-4 bg-[var(--color-bg-secondary)] rounded-xl border border-[var(--color-border)]">
        <label className="block text-sm font-medium text-[var(--color-text)] mb-2">
          Private Notes (Only visible to admins)
        </label>
        <textarea
          value={privateNotes}
          onChange={(e) => setPrivateNotes(e.target.value)}
          placeholder="Any additional notes for platform administrators..."
          className="w-full border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] rounded-xl p-3 text-sm focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent outline-none resize-none transition-all"
          rows={2}
        />
      </div>

      <motion.button
        type="submit"
        disabled={loading}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="w-full bg-[var(--color-primary)] hover:bg-[var(--color-primary-light)] text-white py-3 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <>
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Submitting...
          </>
        ) : (
          <>
            <Send className="w-4 h-4" />
            Submit Feedback
          </>
        )}
      </motion.button>
    </motion.form>
  );
}
