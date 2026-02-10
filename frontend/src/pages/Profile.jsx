import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import DashboardLayout from "../components/dashboard/DashboardLayout";
import { User, MapPin, Briefcase, Mail, Globe, FileText, Star, Calendar, Edit2 } from "lucide-react";
import FeedbackList from "../components/FeedbackList";

const API_URL = import.meta.env.VITE_API_URL;

export default function Profile() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
  const [user, setUser] = useState(storedUser);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch(`${API_URL}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (res.ok) setUser(data);
      } catch (err) {
        console.error("Profile fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [token]);

  const getImageUrl = (img) => (img?.startsWith("http") ? img : img ? `${API_URL}${img}` : null);
  const role = user.role || storedUser.role;

  if (loading) {
    return (
      <DashboardLayout role={role} title="Profile">
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-[var(--color-primary-light)] border-t-transparent rounded-full animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role={role} title="My Profile">
      <div className="max-w-4xl mx-auto space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card p-6 md:p-8"
        >
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-shrink-0">
              {getImageUrl(user.profileImage) ? (
                <img
                  src={getImageUrl(user.profileImage)}
                  alt={user.firstName}
                  className="w-28 h-28 rounded-2xl object-cover ring-4 ring-[var(--color-border)]"
                />
              ) : (
                <div className="w-28 h-28 rounded-2xl bg-gradient-to-br from-[var(--color-primary-light)] to-[var(--color-primary)] flex items-center justify-center text-white text-3xl font-bold">
                  {user.firstName?.[0]}{user.lastName?.[0]}
                </div>
              )}
            </div>

            <div className="flex-1">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-[var(--color-text)]">
                    {user.title} {user.firstName} {user.lastName}
                  </h1>
                  <p className="text-[var(--color-text-secondary)] capitalize mt-1">
                    {role?.replace(/([A-Z])/g, ' $1').trim()}
                  </p>
                </div>
                <Link
                  to="/settings"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--color-bg-secondary)] hover:bg-[var(--color-bg-tertiary)] text-[var(--color-text)] font-medium transition-colors"
                >
                  <Edit2 size={16} />
                  Edit Profile
                </Link>
              </div>

              <div className="mt-4 flex flex-wrap gap-4 text-sm">
                {user.country && (
                  <span className="inline-flex items-center gap-1.5 text-[var(--color-text-secondary)]">
                    <MapPin size={16} /> {user.country}
                  </span>
                )}
                {user.email && (
                  <span className="inline-flex items-center gap-1.5 text-[var(--color-text-secondary)]">
                    <Mail size={16} /> {user.email}
                  </span>
                )}
                {user.organisationName && (
                  <span className="inline-flex items-center gap-1.5 text-[var(--color-text-secondary)]">
                    <Briefcase size={16} /> {user.organisationName}
                  </span>
                )}
              </div>
            </div>
          </div>

          {user.bio && (
            <div className="mt-6 pt-6 border-t border-[var(--color-border)]">
              <h3 className="font-semibold text-[var(--color-text)] mb-2">About</h3>
              <p className="text-[var(--color-text-secondary)] leading-relaxed">{user.bio}</p>
            </div>
          )}
        </motion.div>

        {role === "solutionProvider" && (
          <>
            {user.expertise?.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="card p-6"
              >
                <h3 className="font-semibold text-[var(--color-text)] mb-4">Areas of Expertise</h3>
                <div className="flex flex-wrap gap-2">
                  {user.expertise.map((exp) => (
                    <span
                      key={exp}
                      className="px-3 py-1.5 rounded-full bg-[var(--color-primary-light)]/10 text-[var(--color-primary-light)] text-sm font-medium"
                    >
                      {exp}
                    </span>
                  ))}
                </div>
              </motion.div>
            )}

            {user.cvFile && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="card p-6"
              >
                <h3 className="font-semibold text-[var(--color-text)] mb-4">Resume / CV</h3>
                <a
                  href={`${API_URL}${user.cvFile}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-[var(--color-primary-light)] hover:underline"
                >
                  <FileText size={18} />
                  View CV
                </a>
              </motion.div>
            )}

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="card p-6"
            >
              <h3 className="font-semibold text-[var(--color-text)] mb-4">Feedback & Reviews</h3>
              <FeedbackList userId={user._id} />
            </motion.div>
          </>
        )}

        {role === "taskOwner" && user.organisationType && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="card p-6"
          >
            <h3 className="font-semibold text-[var(--color-text)] mb-4">Organization Details</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-[var(--color-text-muted)]">Organization Name</p>
                <p className="text-[var(--color-text)] font-medium">{user.organisationName}</p>
              </div>
              <div>
                <p className="text-sm text-[var(--color-text-muted)]">Organization Type</p>
                <p className="text-[var(--color-text)] font-medium">{user.organisationType}</p>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </DashboardLayout>
  );
}
