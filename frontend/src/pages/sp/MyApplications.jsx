// src/pages/sp/MyApplications.jsx
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Briefcase, Clock, CheckCircle, XCircle, Loader2, MessageCircle, DollarSign, Calendar, FileText, Ban, Award, AlertTriangle, RefreshCw } from "lucide-react";
import DashboardLayout from "../../components/dashboard/DashboardLayout";
const API_URL = import.meta.env.VITE_API_URL;

export default function MyApplications() {
  const token = localStorage.getItem("token");
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [withdrawingId, setWithdrawingId] = useState(null);
  const [existingConvoNotice, setExistingConvoNotice] = useState(null);
  const [withdrawConfirm, setWithdrawConfirm] = useState(null);

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        const res = await fetch(`${API_URL}/api/tasks/my-applications`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (res.ok) {
          setTasks(data);
        } else {
          console.error("Error:", data.msg);
        }
      } catch (err) {
        console.error("Fetch applications error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchApplications();
  }, [token]);

  const handleMessageOwner = async (ownerId, taskId) => {
    try {
      const res = await fetch(`${API_URL}/api/conversations/start`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ toUserId: ownerId, taskId }),
      });

      const data = await res.json();
      if (res.ok) {
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

  const handleWithdraw = async (proposalId) => {
    setWithdrawingId(proposalId);
    setWithdrawConfirm(null);
    try {
      const res = await fetch(`${API_URL}/api/proposals/${proposalId}/withdraw`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setTasks(prev => prev.map(t => 
          t.proposal._id === proposalId 
            ? { ...t, proposal: { ...t.proposal, status: 'withdrawn' } }
            : t
        ));
      }
    } catch (err) {
      console.error("Withdraw error:", err);
    } finally {
      setWithdrawingId(null);
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="My Applications">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-[var(--color-primary)]" />
          <span className="ml-3 text-[var(--color-text-secondary)]">Loading applications...</span>
        </div>
      </DashboardLayout>
    );
  }

  const getProposalStatusConfig = (status) => {
    switch(status) {
      case "pending": return { bg: "bg-amber-100", text: "text-amber-700", icon: Clock, label: "Pending Review" };
      case "accepted": return { bg: "bg-emerald-100", text: "text-emerald-700", icon: CheckCircle, label: "Accepted" };
      case "rejected": return { bg: "bg-red-100", text: "text-red-700", icon: XCircle, label: "Not Selected" };
      case "not selected": return { bg: "bg-orange-100", text: "text-orange-700", icon: XCircle, label: "Not Selected" };
      case "withdrawn": return { bg: "bg-gray-100", text: "text-gray-500", icon: Ban, label: "Withdrawn" };
      default: return { bg: "bg-gray-100", text: "text-gray-700", icon: Clock, label: status };
    }
  };

  const getTaskStatusConfig = (status) => {
    switch(status) {
      case "published": return { bg: "bg-blue-100", text: "text-blue-700", label: "Open" };
      case "in-progress": return { bg: "bg-purple-100", text: "text-purple-700", label: "In Progress" };
      case "completed": return { bg: "bg-emerald-100", text: "text-emerald-700", label: "Completed" };
      case "withdrawn": return { bg: "bg-red-100", text: "text-red-700", label: "Withdrawn" };
      default: return { bg: "bg-gray-100", text: "text-gray-700", label: status };
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <DashboardLayout title="My Applications">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 px-4 py-2 text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:bg-[var(--color-bg-secondary)] rounded-xl transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="hidden sm:inline">Back</span>
          </button>
          <div>
            <h1 className="text-2xl font-bold text-[var(--color-text)]">My Applications</h1>
            <p className="text-sm text-[var(--color-text-muted)]">{tasks.length} application{tasks.length !== 1 ? 's' : ''}</p>
          </div>
        </div>

        {tasks.length === 0 ? (
          <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] p-12 text-center">
            <div className="w-16 h-16 bg-[var(--color-bg-secondary)] rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Briefcase className="w-8 h-8 text-[var(--color-text-muted)]" />
            </div>
            <h3 className="text-lg font-semibold text-[var(--color-text)] mb-2">No applications yet</h3>
            <p className="text-[var(--color-text-secondary)] mb-6">You haven't applied to any tasks yet. Browse available tasks to get started.</p>
            <Link
              to="/browse-tasks"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#E96435] to-[#FF7A50] text-white rounded-xl font-semibold hover:opacity-90 transition"
            >
              Browse Tasks
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {tasks.map((task) => {
              const proposalStatus = getProposalStatusConfig(task.proposal?.status);
              const taskStatus = getTaskStatusConfig(task.status);
              const ProposalIcon = proposalStatus.icon;
              const isAssigned = task.proposal?.status === 'accepted' && task.status === 'in-progress';
              
              return (
                <div
                  key={task._id}
                  className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl shadow-sm hover:shadow-lg transition-all overflow-hidden"
                >
                  {isAssigned && (
                    <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 px-4 py-2 flex items-center gap-2">
                      <Award className="w-4 h-4 text-white" />
                      <span className="text-white text-sm font-medium">You're assigned to this task!</span>
                    </div>
                  )}
                  
                  <div className="p-6">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <h2 className="text-lg font-semibold text-[var(--color-text)] line-clamp-1 flex-1">
                        {task.title}
                      </h2>
                      <span className={`shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${taskStatus.bg} ${taskStatus.text}`}>
                        {taskStatus.label}
                      </span>
                    </div>
                    
                    <p className="text-[var(--color-text-secondary)] text-sm mb-4 line-clamp-2">{task.summary}</p>

                    <div className="flex items-center gap-2 mb-4">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${proposalStatus.bg} ${proposalStatus.text}`}>
                        <ProposalIcon className="w-3.5 h-3.5" />
                        {proposalStatus.label}
                      </span>
                    </div>

                    <div className="space-y-2 text-sm text-[var(--color-text-secondary)] mb-4">
                      {task.proposal?.proposedBudget && (
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4 text-[var(--color-text-muted)]" />
                          <span>Proposed: ${task.proposal.proposedBudget.toLocaleString()}</span>
                        </div>
                      )}
                      {task.proposal?.proposedDuration && (
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-[var(--color-text-muted)]" />
                          <span>Timeline: {task.proposal.proposedDuration}</span>
                        </div>
                      )}
                      {task.proposal?.message && (
                        <div className="flex items-start gap-2">
                          <FileText className="w-4 h-4 text-[var(--color-text-muted)] mt-0.5" />
                          <span className="line-clamp-2">{task.proposal.message}</span>
                        </div>
                      )}
                      {task.proposal?.createdAt && (
                        <div className="flex items-center gap-2 text-xs text-[var(--color-text-muted)]">
                          <Clock className="w-3.5 h-3.5" />
                          <span>Submitted {formatDate(task.proposal.createdAt)}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 pt-4 border-t border-[var(--color-border)]">
                      <Link
                        to={`/tasks/${task._id}`}
                        className="flex-1 text-center px-4 py-2 bg-[var(--color-bg-secondary)] text-[var(--color-text)] rounded-lg font-medium text-sm hover:bg-[var(--color-border)] transition"
                      >
                        View Task
                      </Link>
                      
                      {task.proposal?.status === 'accepted' && task.owner && (
                        <button
                          onClick={() => handleMessageOwner(task.owner._id, task._id)}
                          className="flex items-center justify-center gap-1.5 px-4 py-2 bg-gradient-to-r from-[#E96435] to-[#FF7A50] text-white rounded-lg font-medium text-sm hover:opacity-90 transition"
                        >
                          <MessageCircle className="w-4 h-4" />
                          Message Owner
                        </button>
                      )}
                      
                      {task.proposal?.status === 'pending' && (
                        <button
                          onClick={() => setWithdrawConfirm({ proposalId: task.proposal._id, taskTitle: task.title })}
                          disabled={withdrawingId === task.proposal._id}
                          className="flex items-center justify-center gap-1.5 px-4 py-2 border border-red-200 text-red-600 rounded-lg font-medium text-sm hover:bg-red-50 transition disabled:opacity-50"
                        >
                          {withdrawingId === task.proposal._id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <XCircle className="w-4 h-4" />
                          )}
                          Withdraw
                        </button>
                      )}

                      {(task.proposal?.status === 'withdrawn' || task.proposal?.status === 'not selected') && task.status === 'published' && (
                        <Link
                          to={`/tasks/${task._id}`}
                          className="flex items-center justify-center gap-1.5 px-4 py-2 bg-gradient-to-r from-[#E96435] to-[#FF7A50] text-white rounded-lg font-medium text-sm hover:opacity-90 transition"
                        >
                          <RefreshCw className="w-4 h-4" />
                          Resubmit Proposal
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Withdraw Confirmation Modal */}
      {withdrawConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-[#1E376E]">Withdraw Proposal?</h3>
              </div>
            </div>
            <p className="text-gray-600 mb-4">
              Are you sure you want to withdraw your proposal for <strong>"{withdrawConfirm.taskTitle}"</strong>?
            </p>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-amber-800">
                  <p className="font-medium mb-1">Please note:</p>
                  <ul className="list-disc list-inside space-y-1 text-amber-700">
                    <li>The task owner will no longer see your proposal</li>
                    <li>You can resubmit a new proposal if the task is still open</li>
                    <li>Your previous proposal details will not be saved</li>
                  </ul>
                </div>
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setWithdrawConfirm(null)}
                className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition"
              >
                Cancel
              </button>
              <button
                onClick={() => handleWithdraw(withdrawConfirm.proposalId)}
                disabled={withdrawingId === withdrawConfirm.proposalId}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition disabled:opacity-50"
              >
                {withdrawingId === withdrawConfirm.proposalId ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <XCircle className="w-4 h-4" />
                )}
                Yes, Withdraw
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
                <MessageCircle className="w-6 h-6 text-blue-600" />
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
                <MessageCircle className="w-4 h-4" /> Continue Chat
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
