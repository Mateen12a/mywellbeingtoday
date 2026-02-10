// src/components/tasks/EditTaskModal.jsx
import { useState } from "react";
import {
  FileText,
  Layers,
  Target,
  Clock,
  CalendarDays,
  Paperclip,
  X,
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL;

export default function EditTaskModal({ task, onClose, onUpdated }) {
  const token = localStorage.getItem("token");

  // Dropdown options (single-select)
  const skillOptions = [
    "Research & Data Analysis",
    "Monitoring & Evaluation",
    "Health Communication",
    "Community Engagement",
    "Technical Writing",
    "Digital Health Solutions",
    "Program Management",
  ];

  const focusAreaOptions = [
    "Maternal & Child Health",
    "Infectious Diseases",
    "Non-Communicable Diseases",
    "Mental Health",
    "Health Systems & Policy",
    "Environmental Health",
    "Community Health",
    "Global Health Security",
  ];

  const [form, setForm] = useState({
    title: task.title || "",
    summary: task.summary || "",
    description: task.description || "",
    requiredSkills: task.requiredSkills?.[0] || "",
    focusAreas: task.focusAreas?.[0] || "",
    duration: task.duration || "",
    startDate: task.startDate ? task.startDate.split("T")[0] : "",
  });

  const [existingAttachments, setExistingAttachments] = useState(task.attachments || []);
  const [newAttachments, setNewAttachments] = useState([]);
  const [removedAttachments, setRemovedAttachments] = useState([]);
  const [loading, setLoading] = useState(false);

  const Label = ({ text, required }) => (
    <label className="block font-semibold text-gray-800 mb-1">
      {text} {required && <span className="text-red-500">*</span>}
    </label>
  );

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const handleFileChange = (e) => setNewAttachments([...newAttachments, ...Array.from(e.target.files)]);
  const handleRemoveExisting = (file) => {
    setRemovedAttachments([...removedAttachments, file]);
    setExistingAttachments(existingAttachments.filter((f) => f !== file));
  };
  const handleRemoveNew = (index) => setNewAttachments(newAttachments.filter((_, i) => i !== index));

  const isImage = (file) => {
    if (typeof file === "string") return file.match(/\.(jpeg|jpg|png|gif|webp)$/i);
    return file.type.startsWith("image/");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("title", form.title);
      formData.append("summary", form.summary);
      formData.append("description", form.description);
      formData.append("duration", form.duration);
      formData.append("startDate", form.startDate);
      formData.append("requiredSkills", JSON.stringify([form.requiredSkills]));
      formData.append("focusAreas", JSON.stringify([form.focusAreas]));

      newAttachments.forEach((file) => formData.append("attachments", file));
      removedAttachments.forEach((file) => formData.append("removeAttachments", file));

      const res = await fetch(`${API_URL}/api/tasks/${task._id}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const data = await res.json();
      if (res.ok) {
        onUpdated(data);
        onClose();
      } else {
        alert(data.msg || "Error updating task");
      }
    } catch (err) {
      console.error("Update error:", err);
      alert("Something went wrong while updating task");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl p-6 md:p-8 overflow-y-auto max-h-[90vh] animate-fadeIn">
        {/* Header */}
        <div className="flex justify-between items-center border-b pb-3 mb-5">
          <h2 className="text-2xl font-bold text-[#1E376E] flex items-center gap-2">
            <FileText className="w-6 h-6 text-[#357FE9]" /> Edit Task
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-red-500 transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div>
            <Label text="Task Title" required />
            <input
              name="title"
              value={form.title}
              onChange={handleChange}
              className="w-full border p-3 rounded-lg shadow-sm focus:ring-2 focus:ring-[#357FE9] outline-none"
              placeholder="e.g. Strengthening community health systems"
              required
            />
          </div>

          {/* Summary */}
          <div>
            <Label text="Short Summary" required />
            <input
              name="summary"
              value={form.summary}
              onChange={handleChange}
              className="w-full border p-3 rounded-lg shadow-sm focus:ring-2 focus:ring-[#357FE9]"
              placeholder="Brief overview of the task"
              required
            />
          </div>

          {/* Description */}
          <div>
            <Label text="Detailed Description" required />
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows="5"
              className="w-full border p-3 rounded-lg shadow-sm focus:ring-2 focus:ring-[#357FE9]"
              placeholder="Provide details of your task, objectives, and outcomes"
              required
            />
          </div>

          {/* Dropdowns */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label text="Support & Expertise Required" required />
              <div className="relative">
                <Layers className="absolute left-3 top-3.5 text-gray-400 w-4 h-4" />
                <select
                  name="requiredSkills"
                  value={form.requiredSkills}
                  onChange={handleChange}
                  className="w-full border pl-9 p-3 rounded-lg shadow-sm focus:ring-2 focus:ring-[#357FE9] text-sm"
                  required
                >
                  <option value="">Select an option</option>
                  {skillOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <Label text="Area of Interest" required />
              <div className="relative">
                <Target className="absolute left-3 top-3.5 text-gray-400 w-4 h-4" />
                <select
                  name="focusAreas"
                  value={form.focusAreas}
                  onChange={handleChange}
                  className="w-full border pl-9 p-3 rounded-lg shadow-sm focus:ring-2 focus:ring-[#357FE9] text-sm"
                  required
                >
                  <option value="">Select an option</option>
                  {focusAreaOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Duration & Start Date */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label text="How long should this take?" required />
              <div className="relative">
                <Clock className="absolute left-3 top-3.5 text-gray-400 w-4 h-4" />
                <input
                  name="duration"
                  value={form.duration}
                  onChange={handleChange}
                  className="w-full border pl-9 p-3 rounded-lg shadow-sm focus:ring-2 focus:ring-[#357FE9]"
                  placeholder="e.g., 3 months"
                  required
                />
              </div>
            </div>

            <div>
              <Label text="Expected Start Date" />
              <div className="relative">
                <CalendarDays className="absolute left-3 top-3.5 text-gray-400 w-4 h-4" />
                <input
                  type="date"
                  name="startDate"
                  value={form.startDate}
                  onChange={handleChange}
                  className="w-full border pl-9 p-3 rounded-lg shadow-sm focus:ring-2 focus:ring-[#357FE9]"
                />
              </div>
            </div>
          </div>

          {/* Attachments */}
          {existingAttachments.length > 0 && (
            <div>
              <Label text="Existing Attachments" />
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2">
                {existingAttachments.map((file, idx) => {
                  const fileUrl = file.startsWith("http") ? file : `${API_URL}${file}`;
                  return (
                    <div
                      key={idx}
                      className="relative border rounded-lg p-3 bg-gray-50 flex flex-col items-center hover:shadow-md transition"
                    >
                      {isImage(file) ? (
                        <a href={fileUrl} target="_blank" rel="noopener noreferrer">
                          <img
                            src={fileUrl}
                            alt="attachment"
                            className="w-24 h-24 object-cover rounded-lg"
                          />
                        </a>
                      ) : (
                        <a
                          href={fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 underline text-sm text-center break-all"
                        >
                          {file.split("/").pop()}
                        </a>
                      )}
                      <button
                        type="button"
                        onClick={() => handleRemoveExisting(file)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full px-2 text-xs shadow"
                      >
                        ✕
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Add Attachments */}
          <div>
            <Label text="Add Attachments" />
            <div className="relative">
              <Paperclip className="absolute left-3 top-3.5 text-gray-400 w-4 h-4" />
              <input
                type="file"
                multiple
                onChange={handleFileChange}
                className="w-full border pl-9 p-2 rounded-lg shadow-sm cursor-pointer"
              />
            </div>

            {newAttachments.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-3">
                {newAttachments.map((file, idx) => (
                  <div
                    key={idx}
                    className="relative border rounded-lg p-3 bg-gray-50 flex flex-col items-center hover:shadow-md transition"
                  >
                    {isImage(file) ? (
                      <img
                        src={URL.createObjectURL(file)}
                        alt="new-attachment"
                        className="w-24 h-24 object-cover rounded-lg"
                      />
                    ) : (
                      <span className="text-sm text-center break-all">{file.name}</span>
                    )}
                    <button
                      type="button"
                      onClick={() => handleRemoveNew(idx)}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full px-2 text-xs shadow"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-semibold transition w-full sm:w-auto"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 w-full sm:w-auto bg-gradient-to-r from-[#E96435] to-[#FF7A50] text-white font-semibold rounded-lg shadow hover:opacity-90 transition disabled:opacity-50"
            >
              {loading ? "Updating..." : "Update Task"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
