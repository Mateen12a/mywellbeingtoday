// src/pages/tasks/TaskDetails.jsx
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  CalendarDays,
  Clock,
  Layers,
  Target,
  FileText,
  Edit3,
  Paperclip,
  Users,
  MessageSquare,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import ProposalModal from "../../components/proposals/ProposalModal";
import FeedbackForm from "../../components/FeedbackForm";
import useAutoMarkRead from "../../hooks/useAutoMarkRead";
import FeedbackList from "../../components/FeedbackList";
import EditTaskModal from "../../components/tasks/EditTaskModal";
import PublicProfileModal from "../../components/profile/PublicProfileModal";
import { Briefcase } from "lucide-react";
import { jwtDecode } from "jwt-decode";

const API_URL = import.meta.env.VITE_API_URL;

export default function TaskDetails() {
  const navigate = useNavigate();
  const { id } = useParams();
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");

  let currentUserId = null;
  if (token) {
    try {
      const decoded = jwtDecode(token);
      currentUserId = decoded.id || decoded._id;
    } catch (err) {
      console.error("Token decode error:", err);
    }
  }

  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [proposals, setProposals] = useState([]);
  const [myProposal, setMyProposal] = useState(null);
  const [showProposalModal, setShowProposalModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [viewingProfileId, setViewingProfileId] = useState(null);
  const [markingComplete, setMarkingComplete] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const [showWithdrawConfirm, setShowWithdrawConfirm] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(null); // { type: 'accept' | 'reject', name: string }
  const [existingConvoNotice, setExistingConvoNotice] = useState(null); // { recipientName, conversationId }

  useAutoMarkRead(id ? `/tasks/${id}` : null);

  // === Fetch Task ===
  useEffect(() => {
    const fetchTask = async () => {
      try {
        const res = await fetch(`${API_URL}/api/tasks/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (res.ok) setTask(data);
      } catch (err) {
        console.error("Error fetching task:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchTask();
  }, [id, token]);

  // === Fetch Proposals ===
  useEffect(() => {
    const fetchProposals = async () => {
      try {
        if (["taskOwner", "admin"].includes(role)) {
          const res = await fetch(`${API_URL}/api/proposals/task/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const data = await res.json();
          if (res.ok && Array.isArray(data)) setProposals(data);
        } else if (role === "solutionProvider") {
          const res = await fetch(`${API_URL}/api/proposals/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const data = await res.json();
          if (res.ok && data && data._id) setMyProposal(data);
        }
      } catch (err) {
        console.error("Error fetching proposals:", err);
      }
    };
    fetchProposals();
  }, [id, token, role]);

  // === Update Task Status ===
  const updateStatus = async (newStatus) => {
    try {
      const res = await fetch(`${API_URL}/api/tasks/${id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (res.ok) {
        setTask(data.task);
      }
    } catch (err) {
      console.error("Status update error:", err);
    }
  };

  // === Handle Proposal Accept/Reject ===
  const handleProposalAction = async (proposalId, action) => {
    try {
      const proposal = proposals.find(p => p._id === proposalId);
      const applicantName = proposal?.fromUser ? `${proposal.fromUser.firstName} ${proposal.fromUser.lastName}` : 'the applicant';
      
      const res = await fetch(`${API_URL}/api/proposals/${proposalId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (res.ok) {
        setProposals((prev) =>
          prev.map((p) =>
            p._id === proposalId ? { ...p, status: data.proposal.status } : p
          )
        );
        setShowSuccessModal({ type: action, name: applicantName });
      } else {
        setShowSuccessModal({ type: 'error', message: data.msg || "Error updating proposal" });
      }
    } catch (err) {
      console.error(`${action} error:`, err);
      setShowSuccessModal({ type: 'error', message: "Something went wrong. Please try again." });
    }
  };

  // === Mark Task Complete ===
  const handleMarkComplete = async () => {
    setMarkingComplete(true);
    try {
      const res = await fetch(`${API_URL}/api/tasks/${id}/mark-complete`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (res.ok) {
        setTask(data.task);
        alert(data.msg || "Marked as complete!");
      } else {
        alert(data.msg || "Error marking complete");
      }
    } catch (err) {
      console.error("Mark complete error:", err);
      alert("Could not mark as complete.");
    } finally {
      setMarkingComplete(false);
    }
  };

  // === Withdraw Task ===
  const handleWithdrawTask = async () => {
    setWithdrawing(true);
    try {
      const res = await fetch(`${API_URL}/api/tasks/${id}/withdraw`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (res.ok) {
        setTask(data.task);
        setShowWithdrawConfirm(false);
        alert("Task withdrawn successfully");
      } else {
        alert(data.msg || "Error withdrawing task");
      }
    } catch (err) {
      console.error("Withdraw error:", err);
      alert("Could not withdraw task.");
    } finally {
      setWithdrawing(false);
    }
  };

  // === Start or continue conversation (SIMPLIFIED) ===
  const startConversation = async (toUserId, taskId = null, proposalId = null) => {
      try {
        const res = await fetch(`${API_URL}/api/conversations/start`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ toUserId, taskId, proposalId }),
        });

        const data = await res.json();
        if (res.ok) {
          // Show notice if using existing conversation from a different context
          if (data.existingConversation && data.isDifferentContext) {
            setExistingConvoNotice({
              recipientName: data.recipientName,
              conversationId: data._id
            });
          } else {
            navigate(`/messages/${data._id}`);
          }
        } else {
          alert(data.msg || "Error starting conversation");
        }
      } catch (err) {
        console.error("Conversation error:", err);
        alert("Could not start conversation.");
      }
    };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-[var(--color-primary)]/30 border-t-[var(--color-primary)] rounded-full animate-spin mx-auto mb-4" />
        <p className="text-[var(--color-text-muted)]">Loading task details...</p>
      </div>
    </div>
  );
  if (!task) return <p className="text-center p-8">Task not found</p>;

  // Check if current user is task owner
  const isOwner = task.owner?._id === currentUserId || task.owner === currentUserId;
  
  // Check if current user is assigned solution provider
  const isAssignedProvider = currentUserId && (
    task?.assignedTo?.some(id => String(id) === String(currentUserId) || String(id?._id) === String(currentUserId)) ||
    String(task?.accepted) === String(currentUserId) ||
    String(task?.accepted?._id) === String(currentUserId)
  );

  // Can mark complete: task is in-progress AND user is owner or assigned provider
  const canMarkComplete = task.status === "in-progress" && (isOwner || isAssignedProvider);

  // Has user already marked complete
  const ownerMarkedComplete = !!task.ownerCompletedAt;
  const providerMarkedComplete = !!task.providerCompletedAt;
  const userAlreadyMarked = (isOwner && ownerMarkedComplete) || (isAssignedProvider && providerMarkedComplete);

  // Can withdraw: owner only, task is published
  const canWithdraw = isOwner && task.status === "published";

  // Helper to format roles
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F8FAFC] to-[#EEF2F7] p-4 md:p-8">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-lg p-6 md:p-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-[#1E376E] flex items-center gap-2">
              {task.title}
              {task.isEdited && (
                <span className="text-xs font-normal text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                  Edited
                </span>
              )}
            </h1>
            <p className="text-gray-600 mt-1">{task.summary}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            {role === "taskOwner" && task.status === "published" && (
              <button
                onClick={() => setShowEditModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#357FE9] to-[#1E376E] text-white rounded-lg text-sm hover:opacity-90"
              >
                <Edit3 className="w-4 h-4" /> Edit Task
              </button>
            )}
          </div>
        </div>

        {role === "admin" && (
          <div className="flex items-center space-x-4">
                  <div className="relative w-16 h-16">
                    <img
                      src={task.owner.profileImage?.startsWith("http") ? task.owner.profileImage : `${API_URL}${task.owner.profileImage}`}
                      alt={`${task.owner.firstName} ${task.owner.lastName}`}
                      className="w-16 h-16 rounded-full object-cover border-2 border-[#1e3a8a] shadow"
                    />
                  </div>

                  <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                      {task.owner.firstName} {task.owner.lastName}
                    </h1>

                    <p className="text-gray-600 flex items-center gap-1">
                      <Briefcase className="w-4 h-4" /> {formatRole(task.owner.role)}
                    </p>
                  </div>
          </div>
        )}
        {/* Description */}
        <div className="border-t border-gray-100 pt-5 mb-6">
          <h2 className="text-xl font-semibold text-[#357FE9] flex items-center gap-2 mb-2">
            <FileText className="w-5 h-5 text-[#357FE9]" /> Description
          </h2>
          <p className="text-gray-700 leading-relaxed">{task.description}</p>
        </div>

        {/* Task Meta */}
        <div className="grid sm:grid-cols-2 gap-4 mb-8">
          {[
            { icon: Layers, label: "Required Expertise", val: task.requiredSkills?.join(", ") },
            { icon: Target, label: "Focus Area", val: task.focusAreas?.join(", ") },
            { icon: Clock, label: "Duration", val: task.duration || "Not specified" },
            { icon: CalendarDays, label: "Expected Start Date", val: task.startDate ? new Date(task.startDate).toLocaleDateString() : "Not specified" },
          ].map((info, i) => (
            <div key={i} className="bg-gray-50 p-4 rounded-lg border border-gray-100 hover:shadow-sm transition">
              <div className="flex items-center gap-2 text-[#1E376E] font-semibold mb-1">
                <info.icon className="w-4 h-4 text-[#E96435]" /> {info.label}
              </div>
              <p className="text-gray-700 text-sm">{info.val}</p>
            </div>
          ))}
        </div>

        {/* Attachments */}
        {task.attachments?.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-[#1E376E] flex items-center gap-2 mb-3">
              <Paperclip className="w-5 h-5 text-[#E96435]" /> Attachments
            </h2>
            <div className="space-y-2">
              {task.attachments.map((a, i) => {
                const fileUrl = a.startsWith("http") ? a : `${API_URL}${a}`;
                const fileName = a.split("/").pop();
                return (
                  <a
                    key={i}
                    href={fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border hover:bg-gray-100 transition"
                  >
                    <span className="truncate text-sm text-gray-700">{fileName}</span>
                    <span className="text-sm text-[#357FE9] font-medium">View →</span>
                  </a>
                );
              })}
            </div>
          </div>
        )}

        {/* Status */}
      <div className="bg-gray-50 border p-4 rounded-lg mb-6">
        <h3 className="font-semibold text-[#1E376E] mb-2">Task Status</h3>
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <span>Current status:</span>
          <span
            className="px-3 py-1 rounded-full text-sm font-semibold capitalize"
            style={{
              backgroundColor:
                task.status === "published"
                  ? "#357FE933"
                  : task.status === "in-progress"
                  ? "#F7B52633"
                  : task.status === "completed"
                  ? "#16a34a33"
                  : task.status === "withdrawn"
                  ? "#6b728033"
                  : "#e5e7eb",
              color:
                task.status === "published"
                  ? "#357FE9"
                  : task.status === "in-progress"
                  ? "#F7B526"
                  : task.status === "completed"
                  ? "#16a34a"
                  : task.status === "withdrawn"
                  ? "#6b7280"
                  : "#374151",
            }}
          >
            {task.status === "withdrawn" ? "Withdrawn" : task.status}
          </span>
        </div>

        {/* Completion Status Indicators */}
        {(task.status === "in-progress" || task.status === "completed") && (
          <div className="mb-4 space-y-2">
            <div className="flex items-center gap-2">
              {ownerMarkedComplete ? (
                <span className="flex items-center gap-1 text-sm text-green-600 font-medium bg-green-50 px-3 py-1.5 rounded-lg">
                  <CheckCircle className="w-4 h-4" /> Task Owner: Marked Complete
                </span>
              ) : (
                <span className="flex items-center gap-1 text-sm text-gray-500 bg-gray-100 px-3 py-1.5 rounded-lg">
                  <Clock className="w-4 h-4" /> Task Owner: Pending
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {providerMarkedComplete ? (
                <span className="flex items-center gap-1 text-sm text-green-600 font-medium bg-green-50 px-3 py-1.5 rounded-lg">
                  <CheckCircle className="w-4 h-4" /> Solution Provider: Marked Complete
                </span>
              ) : (
                <span className="flex items-center gap-1 text-sm text-gray-500 bg-gray-100 px-3 py-1.5 rounded-lg">
                  <Clock className="w-4 h-4" /> Solution Provider: Pending
                </span>
              )}
            </div>
          </div>
        )}

        {/* Mark Complete Button */}
        {canMarkComplete && !userAlreadyMarked && (
          <button
            onClick={handleMarkComplete}
            disabled={markingComplete}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg text-sm font-medium hover:opacity-90 transition disabled:opacity-50 mb-3"
          >
            {markingComplete ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Processing...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4" /> Mark Complete
              </>
            )}
          </button>
        )}

        {/* Waiting indicators after marking */}
        {canMarkComplete && userAlreadyMarked && (
          <div className="mb-3">
            {isOwner && ownerMarkedComplete && !providerMarkedComplete && (
              <span className="flex items-center gap-2 text-sm text-amber-600 font-medium bg-amber-50 px-3 py-2 rounded-lg">
                <Clock className="w-4 h-4" /> Waiting for Provider to mark complete
              </span>
            )}
            {isAssignedProvider && providerMarkedComplete && !ownerMarkedComplete && (
              <span className="flex items-center gap-2 text-sm text-amber-600 font-medium bg-amber-50 px-3 py-2 rounded-lg">
                <Clock className="w-4 h-4" /> Waiting for Owner to mark complete
              </span>
            )}
          </div>
        )}

        {/* Withdraw Task Button */}
        {canWithdraw && (
          <button
            onClick={() => setShowWithdrawConfirm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg text-sm font-medium hover:opacity-90 transition mb-3"
          >
            <AlertTriangle className="w-4 h-4" /> Withdraw Task
          </button>
        )}

        {role === "taskOwner" && (
          (() => {
            const hasAcceptedProposal = proposals.some(p => p.status === "accepted");
            const isLocked = hasAcceptedProposal && task.status === "in-progress";
            return isLocked ? (
              <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded text-sm text-blue-700">
                <Clock className="w-4 h-4" />
                <span>Status locked: In Progress (Solution Provider assigned)</span>
              </div>
            ) : (
              <select
                value={task.status}
                onChange={(e) => updateStatus(e.target.value)}
                className="border p-2 rounded"
              >
                <option value="published">Published</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="withdrawn">Withdrawn</option>
              </select>
            );
          })()
        )}
      </div>

        {/* ✅ Proposals Section */}
        {(role === "taskOwner" || role === "admin") && (
          <div className="border-t pt-6 mb-8">
            <h3 className="text-xl font-semibold text-[#1E376E] mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-[#357FE9]" /> Submitted Proposals
            </h3>
            {proposals.length === 0 ? (
              <p className="text-gray-600 text-sm">No proposals submitted yet.</p>
            ) : (
              (() => {
                const hasAcceptedProposal = proposals.some(prop => prop.status === "accepted");
                return (
                  <ul className="space-y-4">
                    {proposals.map((p) => {
                      const isAccepted = p.status === "accepted";
                      const showActions = !hasAcceptedProposal || isAccepted;
                      return (
                        <li key={p._id} className={`p-4 rounded-lg border hover:shadow transition ${isAccepted ? 'bg-green-50 border-green-200' : 'bg-gray-50'}`}>
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-semibold text-[#1E376E]">
                                {p.fromUser?.firstName} {p.fromUser?.lastName}
                                {isAccepted && <span className="ml-2 text-green-600 text-sm">(Assigned)</span>}
                              </p>
                              <p className="text-sm text-gray-600 mt-1">{p.message}</p>
                              {p.attachments?.length > 0 && (
                                <div className="mt-2">
                                  <span className="text-xs font-medium text-gray-600">Attachments:</span>
                                  <ul className="list-disc ml-5">
                                    {p.attachments.map((a, i) => (
                                      <li key={i}>
                                        <a
                                          href={a.startsWith("http") ? a : `${API_URL}${a}`}
                                          target="_blank"
                                          rel="noreferrer"
                                          className="text-[#357FE9] underline text-sm"
                                        >
                                          View
                                        </a>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                            <div className="flex flex-col gap-2 items-end">
                              <div className="text-xs text-gray-500">
                                {new Date(p.createdAt).toLocaleDateString()}
                              </div>
                              {showActions && (
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => startConversation(p.fromUser?._id, task?._id, p._id)}
                                    className="flex items-center gap-1 px-3 py-1 bg-[#1E376E] text-white rounded text-xs hover:bg-[#142851]"
                                  >
                                    <MessageSquare className="w-3 h-3" /> Message
                                  </button>
                                  <button
                                    onClick={() => setViewingProfileId(p.fromUser?._id)}
                                    className="
                                      text-xs font-medium 
                                      text-white 
                                      bg-gradient-to-r from-[#1f416f] to-[#1ba0a0] 
                                      px-3 py-1.5 
                                      rounded-lg 
                                      shadow-sm 
                                      hover:shadow-md 
                                      hover:scale-105 
                                      transition-all duration-200 ease-in-out
                                    "
                                  >
                                    View Profile
                                  </button>
                                </div>
                              )}
                              {showActions && p.status === "pending" && (
                                <div className="flex gap-2 mt-2">
                                  <button
                                    onClick={() => handleProposalAction(p._id, "accept")}
                                    className="flex items-center gap-1 px-3 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700"
                                  >
                                    <CheckCircle className="w-3 h-3" /> Accept
                                  </button>
                                  <button
                                    onClick={() => handleProposalAction(p._id, "reject")}
                                    className="flex items-center gap-1 px-3 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700"
                                  >
                                    <XCircle className="w-3 h-3" /> Reject
                                  </button>
                                </div>
                              )}
                              {/* Only show status if: it's accepted, rejected, withdrawn, not selected, or no proposal has been accepted yet */}
                              {(isAccepted || p.status !== "pending" || !hasAcceptedProposal) && (
                                <span className={`text-xs font-semibold capitalize mt-1 ${isAccepted ? 'text-green-600' : p.status === 'rejected' ? 'text-red-600' : p.status === 'withdrawn' ? 'text-gray-500' : p.status === 'not selected' ? 'text-orange-600' : 'text-gray-700'}`}>
                                  {p.status === 'not selected' ? 'Not Selected' : p.status}
                                </span>
                              )}
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                );
              })()
            )}
          </div>
        )}

        {/* ✅ SP Actions */}
        {role === "solutionProvider" && (
          <div className="mt-6">
            {myProposal?.status === "accepted" ? (
              <p className="text-green-600 font-semibold text-center">
                ✅ You’ve been accepted for this task!
              </p>
            ) : myProposal?.status === "withdrawn" ? (
              <div className="space-y-3">
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-gray-600">
                    <XCircle className="w-5 h-5" />
                    <span className="font-medium">Proposal Withdrawn</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    You previously withdrew your proposal for this task.
                  </p>
                </div>
                {task.status === "published" && (
                  <button
                    onClick={() => setShowProposalModal(true)}
                    className="w-full bg-gradient-to-r from-[#E96435] to-[#FF7A50] text-white py-3 rounded-lg font-semibold hover:opacity-90 transition"
                  >
                    Submit New Proposal
                  </button>
                )}
              </div>
            ) : myProposal?.status === "rejected" ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-red-600">
                  <XCircle className="w-5 h-5" />
                  <span className="font-medium">Proposal Not Selected</span>
                </div>
                <p className="text-sm text-red-500 mt-1">
                  The task owner has chosen another solution provider.
                </p>
              </div>
            ) : myProposal?.status === "not selected" ? (
              <div className="space-y-3">
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-orange-600">
                    <XCircle className="w-5 h-5" />
                    <span className="font-medium">Proposal Not Selected</span>
                  </div>
                  <p className="text-sm text-orange-500 mt-1">
                    Another solution provider was selected for this task.
                  </p>
                </div>
                {task.status === "published" && (
                  <button
                    onClick={() => setShowProposalModal(true)}
                    className="w-full bg-gradient-to-r from-[#E96435] to-[#FF7A50] text-white py-3 rounded-lg font-semibold hover:opacity-90 transition"
                  >
                    Submit New Proposal
                  </button>
                )}
              </div>
            ) : myProposal?.status === "pending" ? (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-amber-600">
                  <Clock className="w-5 h-5" />
                  <span className="font-medium">Proposal Submitted</span>
                </div>
                <p className="text-sm text-amber-600 mt-1">
                  Your proposal is awaiting review by the task owner.
                </p>
              </div>
            ) : (
              <button
                onClick={() => setShowProposalModal(true)}
                className="w-full bg-gradient-to-r from-[#E96435] to-[#FF7A50] text-white py-3 rounded-lg font-semibold hover:opacity-90 transition"
              >
                Submit Proposal
              </button>
            )}
          </div>
        )}

        {/* ✅ Feedback Section */}
        {task.status === "completed" && (
          <div className="mt-10 border-t pt-6">
            <h2 className="text-xl font-semibold text-[#1E376E] mb-4">
              Feedback
            </h2>
            {(role === "taskOwner" || role === "solutionProvider" || role === "admin") && (
              <FeedbackForm taskId={task._id} />
            )}
            <FeedbackList userId={task.createdBy?._id} />
          </div>
        )}
      </div>

      {/* Modals */}
      {showProposalModal && (
        <ProposalModal
          taskId={id}
          onClose={() => setShowProposalModal(false)}
          onSubmitted={(newProposal) => {
            setProposals((prev) => [...prev, newProposal]);
            setMyProposal(newProposal);
            setShowProposalModal(false);
          }}
        />
      )}
      {showEditModal && (
        <EditTaskModal
          task={task}
          onClose={() => setShowEditModal(false)}
          onUpdated={(updatedTask) => setTask(updatedTask)}
        />
      )}
      {viewingProfileId && (
        <PublicProfileModal
          userId={viewingProfileId}
          onClose={() => setViewingProfileId(null)}
        />
      )}

      {/* Proposal Action Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                showSuccessModal.type === 'accept' ? 'bg-green-100' : 
                showSuccessModal.type === 'reject' ? 'bg-orange-100' : 'bg-red-100'
              }`}>
                {showSuccessModal.type === 'accept' ? (
                  <CheckCircle className="w-6 h-6 text-green-500" />
                ) : showSuccessModal.type === 'reject' ? (
                  <XCircle className="w-6 h-6 text-orange-500" />
                ) : (
                  <AlertTriangle className="w-6 h-6 text-red-500" />
                )}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-[#1E376E]">
                  {showSuccessModal.type === 'accept' ? 'Proposal Accepted' : 
                   showSuccessModal.type === 'reject' ? 'Proposal Rejected' : 'Error'}
                </h3>
              </div>
            </div>
            <p className="text-gray-600 mb-6">
              {showSuccessModal.type === 'accept' ? (
                <>You have accepted <strong>{showSuccessModal.name}</strong>'s proposal. They have been notified and can now start working on your task.</>
              ) : showSuccessModal.type === 'reject' ? (
                <>You have rejected <strong>{showSuccessModal.name}</strong>'s proposal. They have been notified of your decision.</>
              ) : (
                showSuccessModal.message
              )}
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowSuccessModal(null)}
                className={`px-4 py-2 text-white rounded-lg text-sm font-medium transition ${
                  showSuccessModal.type === 'accept' ? 'bg-green-600 hover:bg-green-700' :
                  showSuccessModal.type === 'reject' ? 'bg-orange-500 hover:bg-orange-600' :
                  'bg-red-600 hover:bg-red-700'
                }`}
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Withdraw Confirmation Modal */}
      {showWithdrawConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-orange-500" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-[#1E376E]">Withdraw Task?</h3>
                <p className="text-sm text-gray-500">This action cannot be undone</p>
              </div>
            </div>
            <p className="text-gray-600 mb-6">
              Are you sure you want to withdraw this task? It will no longer be visible to solution providers and any pending proposals will be cancelled.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowWithdrawConfirm(false)}
                disabled={withdrawing}
                className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition"
              >
                Cancel
              </button>
              <button
                onClick={handleWithdrawTask}
                disabled={withdrawing}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg text-sm font-medium hover:opacity-90 transition disabled:opacity-50"
              >
                {withdrawing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Withdrawing...
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-4 h-4" /> Withdraw Task
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Existing Conversation Notice Modal */}
      {existingConvoNotice && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
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
    </div>
  );
}
