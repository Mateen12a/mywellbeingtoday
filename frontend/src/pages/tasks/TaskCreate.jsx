// src/pages/TaskCreate.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  ArrowLeft, 
  FileText, 
  Target, 
  Clock, 
  Calendar, 
  Paperclip, 
  CheckCircle,
  AlertCircle,
  Upload,
  X,
  Loader2
} from "lucide-react";
import DashboardLayout from "../../components/dashboard/DashboardLayout";

const API_URL = import.meta.env.VITE_API_URL;

const expertiseOptions = [
  "Delivery & Implementation",
  "Training, Capacity Building & Learning",
  "Data & Evaluation",
  "Digital & Technology Solutions",
  "Program Management & Operations",
  "Communications & Engagement",
  "Policy & Strategy",
];

const focusAreas = [
  "Maternal & Child Health",
  "Infectious Diseases",
  "Non-Communicable Diseases",
  "Mental Health",
  "Health Systems & Policy",
  "Environmental Health",
  "Community Health",
  "Global Health Security",
];

const InputField = ({ label, name, type = "text", placeholder, required, multiline, formData, errors, handleChange, ...props }) => (
    <div>
      <label className="block text-sm font-medium text-[var(--color-text)] mb-2">
        {label}
        {required ? (
          <span className="text-red-500 ml-1">*</span>
        ) : (
          <span className="text-[var(--color-text-muted)] ml-2 text-xs font-normal">(optional)</span>
        )}
      </label>
      {multiline ? (
        <textarea
          name={name}
          value={formData[name]}
          onChange={handleChange}
          rows={5}
          className={`w-full px-4 py-3 border rounded-xl bg-[var(--color-bg-secondary)] text-[var(--color-text)] focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-all resize-none ${
            errors[name] ? "border-red-500" : "border-[var(--color-border)]"
          }`}
          placeholder={placeholder}
          {...props}
        />
      ) : (
        <input
          type={type}
          name={name}
          value={formData[name]}
          onChange={handleChange}
          className={`w-full px-4 py-3 border rounded-xl bg-[var(--color-bg-secondary)] text-[var(--color-text)] focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-all ${
            errors[name] ? "border-red-500" : "border-[var(--color-border)]"
          }`}
          placeholder={placeholder}
          {...props}
        />
      )}
      {errors[name] && (
        <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
          <AlertCircle className="w-4 h-4" />
          {errors[name]}
        </p>
      )}
    </div>
);

const SelectField = ({ label, name, options, required, formData, errors, handleChange }) => (
    <div>
      <label className="block text-sm font-medium text-[var(--color-text)] mb-2">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <select
        name={name}
        value={formData[name]}
        onChange={handleChange}
        className={`w-full px-4 py-3 border rounded-xl bg-[var(--color-bg-secondary)] text-[var(--color-text)] focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-all ${
          errors[name] ? "border-red-500" : "border-[var(--color-border)]"
        }`}
      >
        <option value="">Select an option</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      {errors[name] && (
        <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
          <AlertCircle className="w-4 h-4" />
          {errors[name]}
        </p>
      )}
    </div>
);

export default function TaskCreate() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [formData, setFormData] = useState({
    title: "",
    summary: "",
    description: "",
    requiredSkills: "",
    focusAreas: "",
    duration: "",
    startDate: "",
  });

  const [attachments, setAttachments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};
    if (!formData.title.trim()) newErrors.title = "Title is required";
    if (!formData.summary.trim()) newErrors.summary = "Summary is required";
    if (!formData.description.trim()) newErrors.description = "Description is required";
    if (!formData.requiredSkills) newErrors.requiredSkills = "Please select an expertise area";
    if (!formData.focusAreas) newErrors.focusAreas = "Please select a focus area";
    if (!formData.duration.trim()) newErrors.duration = "Duration is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setAttachments((prev) => [...prev, ...files]);
  };

  const removeFile = (index) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    setLoading(true);
    try {
      const payload = new FormData();
      for (const key in formData) payload.append(key, formData[key]);
      for (const file of attachments) {
        payload.append("attachments", file);
      }

      const res = await fetch(`${API_URL}/api/tasks`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: payload,
      });

      const data = await res.json();
      if (res.ok) {
        navigate("/dashboard/to");
      } else {
        alert(data.msg || "Task creation failed");
      }
    } catch (err) {
      console.error("Task creation error:", err);
      alert("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <DashboardLayout title="Create New Task">
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-colors mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back</span>
          </button>
          
          <div className="bg-gradient-to-br from-[#1E376E] to-[#2B4A8C] rounded-2xl p-6 md:p-8 text-white">
            <h1 className="text-2xl md:text-3xl font-bold mb-2">Create a New Task</h1>
            <p className="text-blue-100 text-sm md:text-base">
              Describe your task clearly to help solution providers understand your needs and contribute effectively.
            </p>
          </div>
        </motion.div>

        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          onSubmit={handleSubmit}
          className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] shadow-sm"
        >
          <div className="p-6 md:p-8 space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-[var(--color-border)]">
              <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                <FileText className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h2 className="font-semibold text-[var(--color-text)]">Basic Information</h2>
                <p className="text-sm text-[var(--color-text-muted)]">Tell us about your task</p>
              </div>
            </div>

            <InputField
              label="Task Title"
              name="title"
              placeholder="e.g., Strengthening community health systems in rural areas"
              required
              formData={formData}
              errors={errors}
              handleChange={handleChange}
            />

            <InputField
              label="Short Summary"
              name="summary"
              placeholder="Provide a brief overview of the task (2-3 sentences)"
              required
              formData={formData}
              errors={errors}
              handleChange={handleChange}
            />

            <InputField
              label="Detailed Description"
              name="description"
              placeholder="Describe the task in detail including objectives, expected outcomes, context, and any specific requirements..."
              required
              multiline
              formData={formData}
              errors={errors}
              handleChange={handleChange}
            />
          </div>

          <div className="p-6 md:p-8 border-t border-[var(--color-border)] space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-[var(--color-border)]">
              <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                <Target className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h2 className="font-semibold text-[var(--color-text)]">Requirements</h2>
                <p className="text-sm text-[var(--color-text-muted)]">What expertise do you need?</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <SelectField
                label="Support Needed / Expertise"
                name="requiredSkills"
                options={expertiseOptions}
                required
                formData={formData}
                errors={errors}
                handleChange={handleChange}
              />

              <SelectField
                label="Area of Interest"
                name="focusAreas"
                options={focusAreas}
                required
                formData={formData}
                errors={errors}
                handleChange={handleChange}
              />
            </div>
          </div>

          <div className="p-6 md:p-8 border-t border-[var(--color-border)] space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-[var(--color-border)]">
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                <Clock className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h2 className="font-semibold text-[var(--color-text)]">Timeline</h2>
                <p className="text-sm text-[var(--color-text-muted)]">When and how long?</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <InputField
                label="Duration"
                name="duration"
                placeholder="e.g., 3 months, 6 weeks"
                required
                formData={formData}
                errors={errors}
                handleChange={handleChange}
              />

              <InputField
                label="Expected Start Date"
                name="startDate"
                type="date"
                formData={formData}
                errors={errors}
                handleChange={handleChange}
              />
            </div>
          </div>

          <div className="p-6 md:p-8 border-t border-[var(--color-border)] space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-[var(--color-border)]">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                <Paperclip className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <h2 className="font-semibold text-[var(--color-text)]">Attachments</h2>
                <p className="text-sm text-[var(--color-text-muted)]">Supporting documents (optional)</p>
              </div>
            </div>

            <div className="border-2 border-dashed border-[var(--color-border)] rounded-xl p-6 text-center hover:border-[var(--color-primary)] transition-colors">
              <input
                type="file"
                multiple
                onChange={handleFileChange}
                className="hidden"
                id="file-upload"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png"
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                <Upload className="w-10 h-10 text-[var(--color-text-muted)] mx-auto mb-3" />
                <p className="text-[var(--color-text)] font-medium">Click to upload files</p>
                <p className="text-sm text-[var(--color-text-muted)] mt-1">
                  PDF, Word, Excel, PowerPoint, or images (max 10MB each)
                </p>
              </label>
            </div>

            {attachments.length > 0 && (
              <div className="space-y-2">
                {attachments.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-[var(--color-bg-secondary)] rounded-lg border border-[var(--color-border)]"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-[var(--color-text-muted)]" />
                      <span className="text-sm text-[var(--color-text)] truncate max-w-[200px]">
                        {file.name}
                      </span>
                      <span className="text-xs text-[var(--color-text-muted)]">
                        ({(file.size / 1024 / 1024).toFixed(2)} MB)
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      className="p-1 hover:bg-red-100 rounded text-red-500"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="p-6 md:p-8 border-t border-[var(--color-border)] bg-[var(--color-bg-secondary)] rounded-b-2xl">
            <div className="flex flex-col sm:flex-row gap-4 justify-end">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="px-6 py-3 rounded-xl border border-[var(--color-border)] text-[var(--color-text)] hover:bg-[var(--color-bg-tertiary)] transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-8 py-3 bg-gradient-to-r from-[#E96435] to-[#FF7A50] text-white rounded-xl font-semibold shadow-lg hover:shadow-xl hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    Create Task
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.form>
      </div>
    </DashboardLayout>
  );
}
