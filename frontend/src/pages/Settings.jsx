import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import DashboardLayout from "../components/dashboard/DashboardLayout";
import CountrySelect from "../components/CountrySelect";
import {
  UploadCloud,
  RotateCcw,
  Edit3,
  Lock,
  FileText,
  Trash2,
  Save,
  Camera,
  Shield,
  Bell,
  User,
  Key,
  Mail,
  Eye,
  EyeOff,
  AlertTriangle,
  CheckCircle,
  Smartphone,
  Globe,
  LogOut,
  Info,
  Scale,
  MessageSquare,
  ExternalLink,
  ChevronRight,
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL;

const affiliations = [
  "NGO / Non-profit",
  "Academic / Research Institution",
  "Government Agency",
  "UN / Multilateral Organisation",
  "Private Sector Company",
  "Health Facility / Hospital / Clinic",
  "Independent Consultant",
  "Student / Trainee",
  "Faith-Based Organisation",
  "Other",
];
const orgTypes = [
  "NGO / Non-profit",
  "Academic / Research Institution",
  "Ministry / Department of Health",
  "Private Sector Company",
  "Health Facility / Hospital / Clinic",
  "Faith-Based Organisation",
  "Other",
];
const expertiseOptions = [
  "Delivery & Implementation",
  "Training, Capacity Building & Learning",
  "Data & Evaluation",
  "Digital & Technology Solutions",
  "Program Management & Operations",
  "Communications & Engagement",
  "Policy & Strategy",
];
const genderOptions = ["Male", "Female", "Prefer not to say"];

export default function Settings() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const storedUser = JSON.parse(localStorage.getItem("user") || "{}");

  const [user, setUser] = useState({});
  const [role, setRole] = useState(storedUser.role || "solutionProvider");
  const [imageFile, setImageFile] = useState(null);
  const [cvFile, setCvFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState({
    type: "",
    text: "",
  });

  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    inAppNotifications: true,
    taskUpdates: true,
    proposalUpdates: true,
    messageNotifications: true,
    systemUpdates: true,
  });
  const [notifSaving, setNotifSaving] = useState(false);
  const [notifLoading, setNotifLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch(`${API_URL}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (res.ok) {
          setUser(data);
          setRole(data.role || storedUser.role);
        } else setUser(storedUser);
      } catch (err) {
        setUser(storedUser);
      }
    };

    const fetchNotificationPrefs = async () => {
      try {
        const res = await fetch(`${API_URL}/api/notifications/preferences`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (res.ok) {
          setNotifications((prev) => ({ ...prev, ...data }));
        }
      } catch (err) {
        console.error("Error fetching notification preferences:", err);
      } finally {
        setNotifLoading(false);
      }
    };

    fetchProfile();
    fetchNotificationPrefs();
  }, [token]);

  const handleChange = (e) =>
    setUser((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleMultiSelect = (field, value) => {
    setUser((prev) => {
      const arr = prev[field] || [];
      return {
        ...prev,
        [field]: arr.includes(value)
          ? arr.filter((v) => v !== value)
          : [...arr, value],
      };
    });
  };

  const handleImage = (e) => {
    const file = e.target.files[0];
    setImageFile(file);
    if (file)
      setUser((prev) => ({ ...prev, profileImage: URL.createObjectURL(file) }));
  };

  const handleResetAvatar = async () => {
    try {
      const res = await fetch(`${API_URL}/api/auth/reset-avatar`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setUser((prev) => ({ ...prev, profileImage: data.profileImage }));
        localStorage.setItem(
          "user",
          JSON.stringify({ ...user, profileImage: data.profileImage }),
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUploadCv = async () => {
    if (!cvFile) return;
    try {
      const form = new FormData();
      form.append("cv", cvFile);
      const res = await fetch(`${API_URL}/api/auth/upload-cv`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });
      const data = await res.json();
      if (res.ok) setUser((prev) => ({ ...prev, cvFile: data.url }));
    } catch (err) {
      console.error(err);
    }
  };

  const handleRemoveCv = async () => {
    if (!user.cvFile) return;
    if (!confirm("Are you sure you want to remove your CV?")) return;
    try {
      const res = await fetch(`${API_URL}/api/auth/me`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ cvFile: "" }),
      });
      if (res.ok) setUser((prev) => ({ ...prev, cvFile: "" }));
    } catch (err) {
      console.error(err);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      let avatarUrl = user.profileImage;
      if (imageFile) {
        const form = new FormData();
        form.append("avatar", imageFile);
        const resUpload = await fetch(`${API_URL}/api/auth/upload-avatar`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: form,
        });
        const uploadData = await resUpload.json();
        if (resUpload.ok) avatarUrl = uploadData.url;
      }

      const res = await fetch(`${API_URL}/api/auth/me`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ...user, profileImage: avatarUrl }),
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem("user", JSON.stringify(data));
        alert("Settings saved successfully!");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPasswordMessage({ type: "", text: "" });

    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: "error", text: "New passwords do not match" });
      return;
    }

    if (newPassword.length < 8) {
      setPasswordMessage({
        type: "error",
        text: "Password must be at least 8 characters",
      });
      return;
    }

    setPasswordLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/change-password`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();

      if (res.ok) {
        setPasswordMessage({
          type: "success",
          text: "Password changed successfully!",
        });
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        setPasswordMessage({
          type: "error",
          text: data.msg || "Failed to change password",
        });
      }
    } catch (err) {
      setPasswordMessage({
        type: "error",
        text: "An error occurred. Please try again.",
      });
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleNotificationSave = async () => {
    setNotifSaving(true);
    try {
      const res = await fetch(`${API_URL}/api/notifications/preferences`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(notifications),
      });
      if (res.ok) {
        alert("Notification preferences saved!");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setNotifSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    const confirmed = confirm(
      "Are you sure you want to delete your account? This action cannot be undone.",
    );
    if (!confirmed) return;

    const doubleConfirm = prompt("Type 'DELETE' to confirm account deletion:");
    if (doubleConfirm !== "DELETE") {
      alert("Account deletion cancelled.");
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/auth/delete-account`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        localStorage.clear();
        navigate("/login");
      } else {
        alert("Failed to delete account. Please contact support.");
      }
    } catch (err) {
      alert("An error occurred. Please try again.");
    }
  };

  const getImageUrl = (img) => {
    if (!img) return "";
    if (img.startsWith("blob:")) return img; // Handle local preview blobs
    if (img.startsWith("http")) return img;
    return `${API_URL}${img}`;
  };

  const hasCustomImage = (img) => img && img !== "default.jpg" && !img.endsWith("/default.jpg");

  const isAdmin = role?.toLowerCase().includes("admin");

  const tabs = [
    { id: "profile", label: "Profile", icon: Edit3 },
    { id: "security", label: "Security", icon: Shield },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "account", label: "Account", icon: User },
  ];

  return (
    <DashboardLayout role={role} title="Settings">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-wrap gap-2 mb-6 bg-[var(--color-surface)] p-2 rounded-2xl border border-[var(--color-border)]">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all ${
                activeTab === tab.id
                  ? "bg-[var(--color-primary)] text-white shadow-md"
                  : "text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-secondary)] hover:text-[var(--color-text)]"
              }`}
            >
              <tab.icon size={18} />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        {activeTab === "security" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="card p-6">
              <h2 className="text-xl font-semibold text-[var(--color-text)] mb-6 flex items-center gap-2">
                <Key className="w-5 h-5 text-[var(--color-primary)]" />
                Change Password
              </h2>

              <form onSubmit={handlePasswordChange} className="space-y-4">
                {passwordMessage.text && (
                  <div
                    className={`p-4 rounded-xl flex items-center gap-3 ${
                      passwordMessage.type === "error"
                        ? "bg-red-50 text-red-600 border border-red-200"
                        : "bg-emerald-50 text-emerald-600 border border-emerald-200"
                    }`}
                  >
                    {passwordMessage.type === "error" ? (
                      <AlertTriangle className="w-5 h-5" />
                    ) : (
                      <CheckCircle className="w-5 h-5" />
                    )}
                    {passwordMessage.text}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-[var(--color-text)] mb-1">
                    Current Password
                  </label>
                  <div className="relative">
                    <input
                      type={showCurrentPassword ? "text" : "password"}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="input-field pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowCurrentPassword(!showCurrentPassword)
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                    >
                      {showCurrentPassword ? (
                        <EyeOff size={18} />
                      ) : (
                        <Eye size={18} />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--color-text)] mb-1">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="input-field pr-10"
                      required
                      minLength={8}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                    >
                      {showNewPassword ? (
                        <EyeOff size={18} />
                      ) : (
                        <Eye size={18} />
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-[var(--color-text-muted)] mt-1">
                    Minimum 8 characters
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--color-text)] mb-1">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="input-field"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={passwordLoading}
                  className="btn-primary flex items-center gap-2"
                >
                  <Lock size={18} />
                  {passwordLoading ? "Changing..." : "Change Password"}
                </button>
              </form>
            </div>

            <div className="card p-6">
              <h2 className="text-xl font-semibold text-[var(--color-text)] mb-4 flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-[var(--color-primary)]" />
                Active Sessions
              </h2>
              <div className="p-4 bg-[var(--color-bg-secondary)] rounded-xl border border-[var(--color-border)]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                      <Globe className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="font-medium text-[var(--color-text)]">
                        Current Session
                      </p>
                      <p className="text-xs text-[var(--color-text-muted)]">
                        Browser • Active now
                      </p>
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-emerald-100 text-emerald-600 text-xs font-medium rounded-full">
                    Active
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === "notifications" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card p-6"
          >
            <h2 className="text-xl font-semibold text-[var(--color-text)] mb-6 flex items-center gap-2">
              <Bell className="w-5 h-5 text-[var(--color-primary)]" />
              Notification Preferences
            </h2>

            <div className="space-y-4">
              {[
                {
                  key: "emailNotifications",
                  label: "Email Notifications",
                  desc: "Receive email notifications for important updates",
                },
                {
                  key: "inAppNotifications",
                  label: "In-App Notifications",
                  desc: "Show notifications within the platform",
                },
                {
                  key: "taskUpdates",
                  label: "Task Updates",
                  desc: "Get notified when tasks are updated or completed",
                },
                {
                  key: "proposalUpdates",
                  label: "Proposal Updates",
                  desc: "Receive updates on your proposals and applications",
                },
                {
                  key: "messageNotifications",
                  label: "Message Alerts",
                  desc: "Get notified when you receive new messages",
                },
                {
                  key: "systemUpdates",
                  label: "System Updates",
                  desc: "Receive important system announcements",
                },
              ].map((item) => (
                <div
                  key={item.key}
                  className="flex items-center justify-between p-4 bg-[var(--color-bg-secondary)] rounded-xl border border-[var(--color-border)]"
                >
                  <div>
                    <p className="font-medium text-[var(--color-text)]">
                      {item.label}
                    </p>
                    <p className="text-sm text-[var(--color-text-muted)]">
                      {item.desc}
                    </p>
                  </div>
                  <button
                    onClick={() =>
                      setNotifications((prev) => ({
                        ...prev,
                        [item.key]: !prev[item.key],
                      }))
                    }
                    className={`relative w-12 h-6 rounded-full transition-colors ${
                      notifications[item.key]
                        ? "bg-[var(--color-primary)]"
                        : "bg-gray-300"
                    }`}
                  >
                    <span
                      className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                        notifications[item.key] ? "left-7" : "left-1"
                      }`}
                    />
                  </button>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-6 border-t border-[var(--color-border)] flex justify-end">
              <button
                onClick={handleNotificationSave}
                disabled={notifSaving}
                className="btn-primary flex items-center gap-2"
              >
                <Save size={18} />
                {notifSaving ? "Saving..." : "Save Preferences"}
              </button>
            </div>
          </motion.div>
        )}

        {activeTab === "account" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="card p-6">
              <h2 className="text-xl font-semibold text-[var(--color-text)] mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-[var(--color-primary)]" />
                Account Information
              </h2>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-[var(--color-bg-secondary)] rounded-xl border border-[var(--color-border)]">
                  <div>
                    <p className="text-sm text-[var(--color-text-muted)]">
                      Email Address
                    </p>
                    <p className="font-medium text-[var(--color-text)]">
                      {user.email}
                    </p>
                  </div>
                  <Mail className="w-5 h-5 text-[var(--color-text-muted)]" />
                </div>

                <div className="flex items-center justify-between p-4 bg-[var(--color-bg-secondary)] rounded-xl border border-[var(--color-border)]">
                  <div>
                    <p className="text-sm text-[var(--color-text-muted)]">
                      Account Type
                    </p>
                    <p className="font-medium text-[var(--color-text)] capitalize">
                      {role?.replace(/([A-Z])/g, " $1").trim()}
                    </p>
                  </div>
                  <Shield className="w-5 h-5 text-[var(--color-text-muted)]" />
                </div>

                <div className="flex items-center justify-between p-4 bg-[var(--color-bg-secondary)] rounded-xl border border-[var(--color-border)]">
                  <div>
                    <p className="text-sm text-[var(--color-text-muted)]">
                      Account Status
                    </p>
                    <p className="font-medium text-emerald-600">
                      Active
                    </p>
                  </div>
                  <CheckCircle className="w-5 h-5 text-emerald-500" />
                </div>
              </div>
            </div>

            <div className="card p-6 border-red-200">
              <h2 className="text-xl font-semibold text-red-600 mb-4 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Danger Zone
              </h2>

              <div className="p-4 bg-red-50 rounded-xl border border-red-200">
                <p className="text-sm text-red-600 mb-4">
                  Once you delete your account, there is no going back. Please
                  be certain.
                </p>
                <button
                  onClick={handleDeleteAccount}
                  className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium transition-colors flex items-center gap-2"
                >
                  <Trash2 size={18} />
                  Delete Account
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === "platform" && !isAdmin && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="card p-6">
              <h2 className="text-xl font-semibold text-[var(--color-text)] mb-6 flex items-center gap-2">
                <Info className="w-5 h-5 text-[var(--color-primary)]" />
                Learn About the Platform
              </h2>

              <div className="space-y-3">
                <Link
                  to="/about"
                  className="flex items-center justify-between p-4 bg-[var(--color-bg-secondary)] rounded-xl border border-[var(--color-border)] hover:border-[var(--color-primary)]/50 hover:bg-[var(--color-primary)]/5 transition-all group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-light)] flex items-center justify-center text-white">
                      <Globe size={20} />
                    </div>
                    <div>
                      <p className="font-medium text-[var(--color-text)]">
                        About Us
                      </p>
                      <p className="text-sm text-[var(--color-text-muted)]">
                        Learn about our mission and values
                      </p>
                    </div>
                  </div>
                  <ChevronRight
                    size={20}
                    className="text-[var(--color-text-muted)] group-hover:text-[var(--color-primary)] transition-colors"
                  />
                </Link>

                <Link
                  to="/privacy"
                  className="flex items-center justify-between p-4 bg-[var(--color-bg-secondary)] rounded-xl border border-[var(--color-border)] hover:border-[var(--color-primary)]/50 hover:bg-[var(--color-primary)]/5 transition-all group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-white">
                      <Shield size={20} />
                    </div>
                    <div>
                      <p className="font-medium text-[var(--color-text)]">
                        Privacy Policy
                      </p>
                      <p className="text-sm text-[var(--color-text-muted)]">
                        How we protect your data and privacy
                      </p>
                    </div>
                  </div>
                  <ChevronRight
                    size={20}
                    className="text-[var(--color-text-muted)] group-hover:text-[var(--color-primary)] transition-colors"
                  />
                </Link>

                <Link
                  to="/terms"
                  className="flex items-center justify-between p-4 bg-[var(--color-bg-secondary)] rounded-xl border border-[var(--color-border)] hover:border-[var(--color-primary)]/50 hover:bg-[var(--color-primary)]/5 transition-all group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white">
                      <Scale size={20} />
                    </div>
                    <div>
                      <p className="font-medium text-[var(--color-text)]">
                        Terms of Service
                      </p>
                      <p className="text-sm text-[var(--color-text-muted)]">
                        Our terms and conditions
                      </p>
                    </div>
                  </div>
                  <ChevronRight
                    size={20}
                    className="text-[var(--color-text-muted)] group-hover:text-[var(--color-primary)] transition-colors"
                  />
                </Link>

                <Link
                  to="/contact"
                  className="flex items-center justify-between p-4 bg-[var(--color-bg-secondary)] rounded-xl border border-[var(--color-border)] hover:border-[var(--color-primary)]/50 hover:bg-[var(--color-primary)]/5 transition-all group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--color-accent)] to-orange-500 flex items-center justify-center text-white">
                      <MessageSquare size={20} />
                    </div>
                    <div>
                      <p className="font-medium text-[var(--color-text)]">
                        Contact Us
                      </p>
                      <p className="text-sm text-[var(--color-text-muted)]">
                        Get in touch with our team
                      </p>
                    </div>
                  </div>
                  <ChevronRight
                    size={20}
                    className="text-[var(--color-text-muted)] group-hover:text-[var(--color-primary)] transition-colors"
                  />
                </Link>
              </div>
            </div>

            <div className="card p-6">
              <h2 className="text-xl font-semibold text-[var(--color-text)] mb-4 flex items-center gap-2">
                <ExternalLink className="w-5 h-5 text-[var(--color-primary)]" />
                Quick Links
              </h2>
              <p className="text-[var(--color-text-secondary)] text-sm">
                Access important information about GlobalHealth.Works, our
                policies, and how to reach us. These pages provide details about
                our mission, data protection practices, service terms, and
                support options.
              </p>
            </div>
          </motion.div>
        )}

        {activeTab === "profile" && (
          <motion.form
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            onSubmit={handleSave}
            className="card p-6"
          >
            <h2 className="text-xl font-semibold text-[var(--color-text)] mb-6 flex items-center gap-2">
              <Edit3 className="w-5 h-5 text-[var(--color-primary)]" />
              Edit Profile
            </h2>

            <div className="flex flex-col md:flex-row gap-8">
              <div className="flex flex-col items-center">
                <div className="relative group">
                  <div className="w-32 h-32 rounded-2xl overflow-hidden bg-[var(--color-bg-secondary)] ring-4 ring-[var(--color-border)]">
                    {hasCustomImage(user.profileImage) ? (
                      <img
                        src={getImageUrl(user.profileImage)}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-[var(--color-text-muted)]">
                        {user.firstName?.[0]}
                        {user.lastName?.[0]}
                      </div>
                    )}
                  </div>
                  <label className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-2xl">
                    <Camera className="text-white" size={24} />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImage}
                      className="hidden"
                    />
                  </label>
                </div>
                <button
                  type="button"
                  onClick={handleResetAvatar}
                  className="mt-3 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] flex items-center gap-1"
                >
                  <RotateCcw size={14} /> Reset
                </button>
              </div>

              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text)] mb-1">
                    First Name
                  </label>
                  <input
                    name="firstName"
                    value={user.firstName || ""}
                    onChange={handleChange}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text)] mb-1">
                    Last Name
                  </label>
                  <input
                    name="lastName"
                    value={user.lastName || ""}
                    onChange={handleChange}
                    className="input-field"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-[var(--color-text)] mb-1">
                    Email
                  </label>
                  <input
                    name="email"
                    value={user.email || ""}
                    disabled
                    className="input-field bg-[var(--color-bg-secondary)] cursor-not-allowed opacity-60"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text)] mb-1">
                    Country
                  </label>
                  <CountrySelect
                    value={user.country || ""}
                    onChange={(val) =>
                      setUser((prev) => ({ ...prev, country: val }))
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text)] mb-1">
                    Gender
                  </label>
                  <select
                    name="gender"
                    value={user.gender || ""}
                    onChange={handleChange}
                    className="input-field"
                  >
                    <option value="">Select</option>
                    {genderOptions.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-[var(--color-text)] mb-1">
                    Short Bio
                  </label>
                  <textarea
                    name="bio"
                    value={user.bio || ""}
                    onChange={handleChange}
                    rows={4}
                    className="input-field resize-none"
                    placeholder="Tell us about yourself..."
                  />
                </div>

                {role === "taskOwner" && (
                  <>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-[var(--color-text)] mb-1">
                        Organisation Name
                      </label>
                      <input
                        name="organisationName"
                        value={user.organisationName || ""}
                        onChange={handleChange}
                        className="input-field"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-[var(--color-text)] mb-1">
                        Organisation Type
                      </label>
                      <select
                        name="organisationType"
                        value={user.organisationType || ""}
                        onChange={handleChange}
                        className="input-field"
                      >
                        <option value="">Select</option>
                        {orgTypes.map((o) => (
                          <option key={o} value={o}>
                            {o}
                          </option>
                        ))}
                      </select>
                    </div>
                  </>
                )}

                {role === "solutionProvider" && (
                  <>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-[var(--color-text)] mb-1">
                        Affiliation
                      </label>
                      <select
                        name="affiliation"
                        value={
                          Array.isArray(user.affiliation)
                            ? user.affiliation[0]
                            : user.affiliation || ""
                        }
                        onChange={handleChange}
                        className="input-field"
                      >
                        <option value="">Select</option>
                        {affiliations.map((a) => (
                          <option key={a} value={a}>
                            {a}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-[var(--color-text)] mb-2">
                        Areas of Expertise
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {expertiseOptions.map((e) => (
                          <button
                            key={e}
                            type="button"
                            onClick={() => handleMultiSelect("expertise", e)}
                            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${user.expertise?.includes(e) ? "bg-[var(--color-accent)] text-white" : "bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)]"}`}
                          >
                            {e}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="md:col-span-2 pt-4 border-t border-[var(--color-border)]">
                      <label className="block text-sm font-medium text-[var(--color-text)] mb-2">
                        Resume / CV
                      </label>
                      {user.cvFile ? (
                        <div className="flex items-center justify-between p-3 rounded-xl bg-[var(--color-bg-secondary)]">
                          <a
                            href={`${API_URL}${user.cvFile}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-[var(--color-primary)] hover:underline"
                          >
                            <FileText size={18} /> View CV
                          </a>
                          <button
                            type="button"
                            onClick={handleRemoveCv}
                            className="flex items-center gap-1 text-red-500 hover:text-red-600"
                          >
                            <Trash2 size={16} /> Remove
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3">
                          <input
                            type="file"
                            accept=".pdf,.doc,.docx"
                            onChange={(e) => setCvFile(e.target.files[0])}
                            className="text-sm text-[var(--color-text)]"
                          />
                          {cvFile && (
                            <button
                              type="button"
                              onClick={handleUploadCv}
                              className="btn-primary text-sm py-1.5 px-3"
                            >
                              Upload
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-[var(--color-border)] flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="btn-primary flex items-center gap-2"
              >
                <Save size={18} />
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </motion.form>
        )}
      </div>
    </DashboardLayout>
  );
}
