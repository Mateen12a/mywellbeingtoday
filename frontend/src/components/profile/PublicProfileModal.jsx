import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  X, User, Briefcase, Star, Mail, Phone, Globe, Building, 
  MapPin, Calendar, CheckCircle, XCircle, AlertTriangle, FileText,
  ExternalLink, Award, Clock, Shield, MessageSquare
} from "lucide-react";
import { getImageUrl } from "../../utils/api";

const API_URL = import.meta.env.VITE_API_URL;

const formatRole = (role) => {
  if (!role) return "";
  switch (role) {
    case "taskOwner":
      return "Task Owner";
    case "solutionProvider":
      return "Solution Provider";
    case "admin":
      return "Admin";
    default:
      return role;
  }
};

function RejectModal({ open, onClose, onSubmit, loading }) {
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (!open) setReason("");
  }, [open]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="relative bg-[var(--color-surface)] rounded-2xl shadow-2xl max-w-lg w-full p-6 z-50 border border-[var(--color-border)]"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
            <XCircle className="w-5 h-5 text-red-600" />
          </div>
          <h3 className="text-lg font-semibold text-[var(--color-text)]">Reject User</h3>
        </div>
        <p className="text-sm text-[var(--color-text-secondary)] mb-3">
          Provide a short reason that will be emailed to the user.
        </p>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={5}
          placeholder="Reason for rejection (required)"
          className="w-full border border-[var(--color-border)] bg-[var(--color-bg-secondary)] text-[var(--color-text)] rounded-xl p-3 text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
        />
        <div className="mt-4 flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-[var(--color-border)] text-[var(--color-text)] hover:bg-[var(--color-bg-secondary)] transition-colors font-medium"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            onClick={() => onSubmit(reason)}
            className="px-4 py-2.5 rounded-xl bg-red-600 text-white hover:bg-red-700 transition-colors font-medium disabled:opacity-50"
            disabled={loading || !reason.trim()}
          >
            {loading ? "Rejecting..." : "Reject User"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default function PublicProfileModal({ userId, onClose, currentUser }) {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [adminActionLoading, setAdminActionLoading] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectLoading, setRejectLoading] = useState(false);
  const [forbiddenMsg, setForbiddenMsg] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [startingConversation, setStartingConversation] = useState(false);
  const [existingConvoNotice, setExistingConvoNotice] = useState(null);

  const isAdmin = currentUser?.role === "admin";
  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!userId) return;

    const fetchProfile = async () => {
      try {
        setLoading(true);
        setForbiddenMsg(null);
        const headers = {};
        if (token) headers.Authorization = `Bearer ${token}`;

        const res = await fetch(`${API_URL}/api/auth/users/${userId}/public`, { headers });

        if (res.status === 403) {
          const err = await res.json().catch(() => ({}));
          setForbiddenMsg(err.msg || "Profile not available");
          setProfile(null);
          return;
        }

        if (!res.ok) throw new Error("Failed to fetch profile");

        const data = await res.json();
        setProfile(data);
      } catch (err) {
        console.error("Error fetching profile:", err);
        setProfile(null);
        setForbiddenMsg("Could not load profile");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [userId, token]);

  const refreshProfile = async () => {
    const headers = {};
    if (token) headers.Authorization = `Bearer ${token}`;
    try {
      const res = await fetch(`${API_URL}/api/auth/users/${userId}/public`, { headers });
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
      }
    } catch (err) {
      console.error("refresh error", err);
    }
  };

  const approveUser = async () => {
    if (!confirm("Approve this user?")) return;
    try {
      setAdminActionLoading(true);
      const res = await fetch(`${API_URL}/api/admin/approve/${userId}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Approve failed");
      await refreshProfile();
      alert("User approved");
    } catch (err) {
      console.error(err);
      alert("Could not approve user");
    } finally {
      setAdminActionLoading(false);
    }
  };

  const submitRejection = async (reason) => {
    try {
      setRejectLoading(true);
      const res = await fetch(`${API_URL}/api/admin/reject/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ reason }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.msg || "Reject failed");
      }
      await refreshProfile();
      setShowRejectModal(false);
      alert("User rejected and notified");
    } catch (err) {
      console.error("Reject error", err);
      alert(err.message || "Could not reject user");
    } finally {
      setRejectLoading(false);
    }
  };

  const updateStatus = async (action) => {
    try {
      setAdminActionLoading(true);
      const route = action === "suspend" ? "suspend" : "activate";
      const res = await fetch(`${API_URL}/api/admin/user/${userId}/${route}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Status update failed");
      await refreshProfile();
      alert(`User ${route}d`);
    } catch (err) {
      console.error(err);
      alert("Could not update status");
    } finally {
      setAdminActionLoading(false);
    }
  };

  const startConversation = async () => {
    if (!userId || startingConversation) return;
    try {
      setStartingConversation(true);
      
      if (isAdmin) {
        const res = await fetch(`${API_URL}/api/admin/conversations`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ participantId: userId }),
        });
        const data = await res.json();
        if (res.ok) {
          onClose();
          navigate("/admin/messaging");
        } else {
          alert(data.msg || "Could not start conversation");
        }
      } else {
        const res = await fetch(`${API_URL}/api/conversations/start`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ toUserId: userId }),
        });
        const data = await res.json();
        if (res.ok) {
          if (data.existingConversation && data.isDifferentContext) {
            setExistingConvoNotice({
              recipientName: data.recipientName,
              conversationId: data._id
            });
          } else {
            onClose();
            navigate(`/messages/${data._id}`);
          }
        } else {
          alert(data.msg || "Could not start conversation");
        }
      }
    } catch (err) {
      console.error("Start conversation error:", err);
      alert("Could not start conversation");
    } finally {
      setStartingConversation(false);
    }
  };

  const StatusBadge = () => {
    if (!profile) return null;
    if (profile.status === "suspended")
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium bg-red-100 text-red-700 rounded-full">
          <XCircle className="w-3.5 h-3.5" /> Suspended
        </span>
      );
    if (profile.rejectionReason)
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium bg-red-100 text-red-700 rounded-full">
          <XCircle className="w-3.5 h-3.5" /> Rejected
        </span>
      );
    if (profile.isApproved)
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium bg-emerald-100 text-emerald-700 rounded-full">
          <CheckCircle className="w-3.5 h-3.5" /> Approved
        </span>
      );
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium bg-amber-100 text-amber-700 rounded-full">
        <AlertTriangle className="w-3.5 h-3.5" /> Pending
      </span>
    );
  };

  const RoleBadge = ({ role }) => {
    const config = {
      admin: { bg: "bg-purple-100", text: "text-purple-700", icon: Shield },
      taskOwner: { bg: "bg-blue-100", text: "text-blue-700", icon: Briefcase },
      solutionProvider: { bg: "bg-[var(--color-accent)]/10", text: "text-[var(--color-accent)]", icon: Award },
    };
    const { bg, text, icon: Icon } = config[role] || { bg: "bg-gray-100", text: "text-gray-600", icon: User };
    
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-full ${bg} ${text}`}>
        <Icon className="w-3.5 h-3.5" />
        {formatRole(role)}
      </span>
    );
  };

  if (!userId) return null;

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "details", label: "Details" },
    ...(isAdmin ? [{ id: "admin", label: "Admin Actions" }] : []),
  ];

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: 20, opacity: 0, scale: 0.95 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 20, opacity: 0, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="bg-[var(--color-surface)] rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden relative border border-[var(--color-border)]"
          onClick={(e) => e.stopPropagation()}
        >
          <button 
            onClick={onClose} 
            className="absolute top-4 right-4 z-10 p-2 rounded-xl bg-[var(--color-bg-secondary)] hover:bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {loading ? (
            <div className="flex flex-col items-center justify-center h-80 gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-light)] animate-pulse" />
              <p className="text-[var(--color-text-secondary)]">Loading profile...</p>
            </div>
          ) : forbiddenMsg ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                <XCircle className="w-8 h-8 text-red-600" />
              </div>
              <p className="text-red-600 font-semibold mb-2">{forbiddenMsg}</p>
              <p className="text-sm text-[var(--color-text-secondary)]">If you believe this is an error, contact an administrator.</p>
            </div>
          ) : !profile ? (
            <div className="p-12 text-center">
              <p className="text-red-500">Could not load profile.</p>
            </div>
          ) : (
            <div className="overflow-y-auto max-h-[90vh]">
              <div className="relative bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-light)] px-6 py-6 pb-20">
                <h1 className="text-2xl font-bold text-white mt-6">
                  {profile.title && `${profile.title} `}{profile.firstName} {profile.lastName}
                </h1>
                <p className="text-white/80 text-sm mt-1">{formatRole(profile.role)}</p>
              </div>
              
              <div className="px-6 pb-6">
                <div className="flex flex-col md:flex-row gap-6 -mt-16 relative z-10">
                  <div className="flex-shrink-0">
                    <div className="w-28 h-28 rounded-2xl border-4 border-[var(--color-surface)] overflow-hidden shadow-lg bg-[var(--color-bg-secondary)]">
                      {profile.profileImage && !profile.profileImage.includes("default.jpg") ? (
                        <img
                          src={getImageUrl(profile.profileImage)}
                          alt={`${profile.firstName} ${profile.lastName}`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-[var(--color-text-muted)]">
                          {profile.firstName?.[0]}{profile.lastName?.[0]}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex-1 pt-2 md:pt-8">
                    <div className="flex flex-wrap items-start gap-3 mb-2">
                      <StatusBadge />
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-3 mb-4">
                      <RoleBadge role={profile.role} />
                      {profile.country && (
                        <span className="inline-flex items-center gap-1.5 text-sm text-[var(--color-text-secondary)]">
                          <MapPin className="w-4 h-4" /> {profile.country}
                        </span>
                      )}
                      {profile.createdAt && (
                        <span className="inline-flex items-center gap-1.5 text-sm text-[var(--color-text-secondary)]">
                          <Calendar className="w-4 h-4" /> Joined {new Date(profile.createdAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {isAdmin && userId !== currentUser?._id && userId !== currentUser?.id && (
                        <motion.button 
                          onClick={startConversation}
                          disabled={startingConversation}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium text-sm transition-colors disabled:opacity-50"
                        >
                          <MessageSquare className="w-4 h-4" /> {startingConversation ? "Starting..." : "Message User"}
                        </motion.button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 mt-6 border-b border-[var(--color-border)] overflow-x-auto">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                        activeTab === tab.id
                          ? "border-[var(--color-primary)] text-[var(--color-primary)]"
                          : "border-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text)]"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {activeTab === "overview" && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-6 space-y-6"
                  >
                    {profile.bio && (
                      <div>
                        <h3 className="text-sm font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-2">About</h3>
                        <p className="text-[var(--color-text)] leading-relaxed">{profile.bio}</p>
                      </div>
                    )}

                    {profile.expertise?.length > 0 && (
                      <div>
                        <h3 className="text-sm font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-3">Skills & Expertise</h3>
                        <div className="flex flex-wrap gap-2">
                          {profile.expertise.map((item, idx) => (
                            <span key={idx} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[var(--color-bg-secondary)] text-[var(--color-text)] rounded-lg text-sm border border-[var(--color-border)]">
                              <Star className="w-3.5 h-3.5 text-amber-500" /> {item}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {profile.focusAreas?.length > 0 && (
                      <div>
                        <h3 className="text-sm font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-3">Focus Areas</h3>
                        <div className="flex flex-wrap gap-2">
                          {profile.focusAreas.map((item, idx) => (
                            <span key={idx} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[var(--color-primary)]/10 text-[var(--color-primary)] rounded-lg text-sm">
                              {item}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}

                {activeTab === "details" && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-6"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {profile.email && (
                        <div className="flex items-center gap-3 p-4 bg-[var(--color-bg-secondary)] rounded-xl border border-[var(--color-border)]">
                          <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                            <Mail className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="text-xs text-[var(--color-text-muted)]">Email</p>
                            <p className="text-sm font-medium text-[var(--color-text)]">{profile.email}</p>
                          </div>
                        </div>
                      )}
                      
                      {profile.phone && (
                        <div className="flex items-center gap-3 p-4 bg-[var(--color-bg-secondary)] rounded-xl border border-[var(--color-border)]">
                          <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                            <Phone className="w-5 h-5 text-green-600" />
                          </div>
                          <div>
                            <p className="text-xs text-[var(--color-text-muted)]">Phone</p>
                            <p className="text-sm font-medium text-[var(--color-text)]">{profile.countryCode} {profile.phone}</p>
                          </div>
                        </div>
                      )}
                      
                      {profile.country && (
                        <div className="flex items-center gap-3 p-4 bg-[var(--color-bg-secondary)] rounded-xl border border-[var(--color-border)]">
                          <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                            <Globe className="w-5 h-5 text-purple-600" />
                          </div>
                          <div>
                            <p className="text-xs text-[var(--color-text-muted)]">Location</p>
                            <p className="text-sm font-medium text-[var(--color-text)]">{profile.country}</p>
                          </div>
                        </div>
                      )}
                      
                      {profile.organisationName && (
                        <div className="flex items-center gap-3 p-4 bg-[var(--color-bg-secondary)] rounded-xl border border-[var(--color-border)]">
                          <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                            <Building className="w-5 h-5 text-amber-600" />
                          </div>
                          <div>
                            <p className="text-xs text-[var(--color-text-muted)]">Organisation</p>
                            <p className="text-sm font-medium text-[var(--color-text)]">{profile.organisationName}</p>
                            {profile.organisationType && (
                              <p className="text-xs text-[var(--color-text-secondary)]">{profile.organisationType}</p>
                            )}
                          </div>
                        </div>
                      )}

                      {profile.gender && (
                        <div className="flex items-center gap-3 p-4 bg-[var(--color-bg-secondary)] rounded-xl border border-[var(--color-border)]">
                          <div className="w-10 h-10 rounded-lg bg-pink-100 flex items-center justify-center">
                            <User className="w-5 h-5 text-pink-600" />
                          </div>
                          <div>
                            <p className="text-xs text-[var(--color-text-muted)]">Gender</p>
                            <p className="text-sm font-medium text-[var(--color-text)]">{profile.gender}</p>
                          </div>
                        </div>
                      )}

                      {profile.affiliation?.length > 0 && (
                        <div className="flex items-center gap-3 p-4 bg-[var(--color-bg-secondary)] rounded-xl border border-[var(--color-border)]">
                          <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
                            <Award className="w-5 h-5 text-indigo-600" />
                          </div>
                          <div>
                            <p className="text-xs text-[var(--color-text-muted)]">Affiliation</p>
                            <p className="text-sm font-medium text-[var(--color-text)]">
                              {Array.isArray(profile.affiliation) ? profile.affiliation.join(", ") : profile.affiliation}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    {profile.professionalLink && (
                      <div className="mt-4">
                        <h3 className="text-sm font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-3">Professional Links</h3>
                        <a 
                          href={profile.professionalLink} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="inline-flex items-center gap-2 text-[var(--color-primary)] hover:text-[var(--color-primary-light)] transition-colors"
                        >
                          <ExternalLink className="w-4 h-4" /> {profile.professionalLink}
                        </a>
                      </div>
                    )}

                    {profile.cvFile && (
                      <div className="mt-4">
                        <h3 className="text-sm font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-3">Resume/CV</h3>
                        <a 
                          href={`${API_URL}${profile.cvFile}`} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--color-bg-secondary)] hover:bg-[var(--color-bg-tertiary)] text-[var(--color-text)] rounded-xl border border-[var(--color-border)] transition-colors"
                        >
                          <FileText className="w-4 h-4" /> View CV
                        </a>
                      </div>
                    )}

                    {isAdmin && profile.approvedBy && (
                      <div className="mt-4 p-4 bg-emerald-50 rounded-xl border border-emerald-200">
                        <p className="text-sm text-emerald-700">
                          Approved by <strong>{profile.approvedBy.firstName} {profile.approvedBy.lastName}</strong>
                        </p>
                      </div>
                    )}

                    {profile.rejectionReason && (
                      <div className="mt-4 p-4 bg-red-50 rounded-xl border border-red-200">
                        <p className="text-sm text-red-700">
                          <strong>Rejection Reason:</strong> {profile.rejectionReason}
                        </p>
                      </div>
                    )}
                  </motion.div>
                )}

                {activeTab === "admin" && isAdmin && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-6 space-y-4"
                  >
                    <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 mb-4">
                      <p className="text-sm text-amber-700 flex items-center gap-2">
                        <Shield className="w-4 h-4" />
                        Admin actions are logged and may send notifications to the user.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {!profile.isApproved && !profile.rejectionReason && (
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={approveUser}
                          className="flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50"
                          disabled={adminActionLoading}
                        >
                          <CheckCircle className="w-5 h-5" />
                          {adminActionLoading ? "Processing..." : "Approve User"}
                        </motion.button>
                      )}

                      {!profile.rejectionReason && (
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => setShowRejectModal(true)}
                          className="flex items-center justify-center gap-2 px-4 py-3 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
                          disabled={rejectLoading}
                        >
                          <XCircle className="w-5 h-5" />
                          Reject User
                        </motion.button>
                      )}

                      {profile.status !== "suspended" ? (
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => updateStatus("suspend")}
                          className="flex items-center justify-center gap-2 px-4 py-3 bg-amber-600 text-white rounded-xl font-medium hover:bg-amber-700 transition-colors disabled:opacity-50"
                          disabled={adminActionLoading}
                        >
                          <Clock className="w-5 h-5" />
                          Suspend User
                        </motion.button>
                      ) : (
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => updateStatus("activate")}
                          className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
                          disabled={adminActionLoading}
                        >
                          <CheckCircle className="w-5 h-5" />
                          Activate User
                        </motion.button>
                      )}
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>

      <RejectModal
        open={showRejectModal}
        onClose={() => setShowRejectModal(false)}
        onSubmit={submitRejection}
        loading={rejectLoading}
      />

      {/* Existing Conversation Notice Modal */}
      {existingConvoNotice && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-60 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                <MessageSquare className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-[#1E376E]">Existing Conversation</h3>
              </div>
            </div>
            <p className="text-gray-600 mb-6">
              You already have a conversation with <strong>{existingConvoNotice.recipientName}</strong> from a previous task. We'll continue that conversation instead of starting a new one.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setExistingConvoNotice(null)}
                className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const convoId = existingConvoNotice.conversationId;
                  setExistingConvoNotice(null);
                  onClose();
                  navigate(`/messages/${convoId}`);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#1E376E] to-[#3B5998] text-white rounded-lg text-sm font-medium hover:opacity-90 transition"
              >
                <MessageSquare className="w-4 h-4" /> Continue Chat
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
