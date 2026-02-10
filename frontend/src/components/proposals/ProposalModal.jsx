import { useState } from "react";
import { motion } from "framer-motion";
import {
  FileText,
  DollarSign,
  Clock,
  Paperclip,
  X,
  Send,
  Upload,
  Trash2,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL;

export default function ProposalModal({ taskId, onClose, onSubmitted }) {
  const token = localStorage.getItem("token");
  const [message, setMessage] = useState("");
  const [budget, setBudget] = useState("");
  const [duration, setDuration] = useState("");
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [dragActive, setDragActive] = useState(false);

  const handleFiles = (e) => {
    const newFiles = Array.from(e.target.files);
    setFiles(prev => [...prev, ...newFiles]);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const newFiles = Array.from(e.dataTransfer.files);
      setFiles(prev => [...prev, ...newFiles]);
    }
  };

  const removeFile = (index) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    
    if (!message.trim()) {
      setError("Please add a cover message");
      return;
    }

    setLoading(true);
    try {
      const form = new FormData();
      form.append("task", taskId);
      form.append("message", message);
      if (budget) form.append("proposedBudget", budget);
      if (duration) form.append("proposedDuration", duration);
      files.forEach((f) => form.append("attachments", f));

      const res = await fetch(`${API_URL}/api/proposals`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });

      const data = await res.json();
      if (res.ok) {
        onSubmitted?.(data.proposal);
        onClose?.();
      } else {
        setError(data.msg || "Could not submit proposal");
      }
    } catch (err) {
      console.error("Proposal submit error:", err);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 px-4"
      onClick={onClose}
    >
      <motion.form
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        onSubmit={submit}
        className="bg-[var(--color-surface)] w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden border border-[var(--color-border)]"
      >
        <div className="flex justify-between items-center p-6 border-b border-[var(--color-border)] bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-light)]">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <FileText className="w-6 h-6" /> Submit Proposal
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-white/20 hover:bg-white/30 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 max-h-[70vh] overflow-y-auto">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-600">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              {error}
            </div>
          )}

          <div className="space-y-5">
            <div>
              <label className="block font-semibold text-[var(--color-text)] mb-2">
                Cover Message <span className="text-red-500">*</span>
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Explain your understanding of the task, your approach, and what you'll deliver..."
                className="w-full border border-[var(--color-border)] bg-[var(--color-bg-secondary)] text-[var(--color-text)] p-4 rounded-xl focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent outline-none resize-none transition-all"
                rows={6}
                required
              />
              <p className="text-xs text-[var(--color-text-muted)] mt-1">
                {message.length}/2000 characters
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-[var(--color-text)] mb-2">
                  Proposed Duration
                </label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] w-5 h-5" />
                  <input
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    placeholder="e.g., 4 weeks, 2 months"
                    className="w-full border border-[var(--color-border)] bg-[var(--color-bg-secondary)] text-[var(--color-text)] pl-11 p-3 rounded-xl focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[var(--color-text)] mb-2">
                  Proposed Budget (USD)
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] w-5 h-5" />
                  <input
                    type="number"
                    min="0"
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                    placeholder="Enter amount"
                    className="w-full border border-[var(--color-border)] bg-[var(--color-bg-secondary)] text-[var(--color-text)] pl-11 p-3 rounded-xl focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent outline-none transition-all"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-[var(--color-text)] mb-2">
                Attachments (optional)
              </label>
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                className={`relative border-2 border-dashed rounded-xl p-6 text-center transition-all ${
                  dragActive
                    ? "border-[var(--color-primary)] bg-[var(--color-primary)]/5"
                    : "border-[var(--color-border)] hover:border-[var(--color-primary)]/50"
                }`}
              >
                <Upload className="w-8 h-8 text-[var(--color-primary)] mx-auto mb-3" />
                <p className="text-[var(--color-text)] font-medium mb-1">
                  Drag & drop files here
                </p>
                <p className="text-sm text-[var(--color-text-muted)] mb-3">
                  or click to browse
                </p>
                <input
                  type="file"
                  multiple
                  onChange={handleFiles}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
              </div>

              {files.length > 0 && (
                <div className="mt-3 space-y-2">
                  {files.map((file, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center justify-between p-3 bg-[var(--color-bg-secondary)] rounded-xl border border-[var(--color-border)]"
                    >
                      <div className="flex items-center gap-3">
                        <Paperclip className="w-4 h-4 text-[var(--color-text-muted)]" />
                        <div>
                          <p className="text-sm font-medium text-[var(--color-text)] truncate max-w-[200px]">
                            {file.name}
                          </p>
                          <p className="text-xs text-[var(--color-text-muted)]">
                            {formatFileSize(file.size)}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFile(idx)}
                        className="p-1.5 rounded-lg hover:bg-red-100 text-red-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-end gap-3 p-6 border-t border-[var(--color-border)] bg-[var(--color-bg-secondary)]">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-[var(--color-border)] text-[var(--color-text)] hover:bg-[var(--color-bg-tertiary)] font-medium transition-colors"
          >
            Cancel
          </button>
          <motion.button
            type="submit"
            disabled={loading}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="px-5 py-2.5 bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-accent-light)] text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Submit Proposal
              </>
            )}
          </motion.button>
        </div>
      </motion.form>
    </motion.div>
  );
}
