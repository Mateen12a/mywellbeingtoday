// src/pages/MyProposal.jsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { FileText, Clock, CheckCircle, XCircle, AlertCircle, ExternalLink, Loader2, DollarSign, Calendar, ArrowUpRight } from "lucide-react";
import DashboardLayout from "../components/dashboard/DashboardLayout";

const API_URL = import.meta.env.VITE_API_URL;

export default function MyProposals() {
  const token = localStorage.getItem("token");
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [withdrawingId, setWithdrawingId] = useState(null);

  useEffect(() => {
    const fetchMy = async () => {
      try {
        const res = await fetch(`${API_URL}/api/proposals/mine`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (res.ok) setProposals(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchMy();
  }, [token]);

  const handleWithdraw = async (proposalId) => {
    if (!confirm("Are you sure you want to withdraw this proposal?")) return;
    setWithdrawingId(proposalId);
    try {
      const res = await fetch(`${API_URL}/api/proposals/${proposalId}/withdraw`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setProposals(prev => prev.map(x => x._id === proposalId ? { ...x, status: 'withdrawn' } : x));
      } else {
        const d = await res.json();
        alert(d.msg || "Error withdrawing proposal");
      }
    } catch (err) {
      alert("Error withdrawing proposal");
    } finally {
      setWithdrawingId(null);
    }
  };

  const getStatusConfig = (status) => {
    switch (status) {
      case 'accepted':
        return { icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-100', label: 'Accepted' };
      case 'rejected':
        return { icon: XCircle, color: 'text-red-600', bg: 'bg-red-100', label: 'Rejected' };
      case 'withdrawn':
        return { icon: AlertCircle, color: 'text-gray-600', bg: 'bg-gray-100', label: 'Withdrawn' };
      default:
        return { icon: Clock, color: 'text-amber-600', bg: 'bg-amber-100', label: 'Pending' };
    }
  };

  const container = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <DashboardLayout role="Solution Provider" title="My Applications">
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-[var(--color-primary)]/30 border-t-[var(--color-primary)] rounded-full animate-spin mx-auto mb-4" />
            <p className="text-[var(--color-text-muted)]">Loading proposals...</p>
          </div>
        </div>
      ) : proposals.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-16"
        >
          <div className="w-20 h-20 rounded-2xl bg-[var(--color-bg-tertiary)] flex items-center justify-center mx-auto mb-4">
            <FileText className="w-10 h-10 text-[var(--color-text-muted)]" />
          </div>
          <h3 className="text-xl font-bold text-[var(--color-text)] mb-2">No Proposals Yet</h3>
          <p className="text-[var(--color-text-secondary)] mb-6 max-w-md mx-auto">
            You haven't submitted any proposals yet. Browse available tasks and apply to get started!
          </p>
          <Link to="/browse-tasks" className="btn-primary inline-flex items-center gap-2">
            Browse Tasks
            <ExternalLink className="w-4 h-4" />
          </Link>
        </motion.div>
      ) : (
        <motion.div
          variants={container}
          initial="hidden"
          animate="visible"
          className="grid gap-4"
        >
          {proposals.map(p => {
            const statusConfig = getStatusConfig(p.status);
            const StatusIcon = statusConfig.icon;
            
            return (
              <motion.div
                key={p._id}
                variants={item}
                className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-lg transition-all overflow-hidden group"
              >
                <div className={`h-1.5 w-full ${
                  p.status === 'accepted' ? 'bg-gradient-to-r from-emerald-400 to-emerald-600' :
                  p.status === 'rejected' ? 'bg-gradient-to-r from-red-400 to-red-600' :
                  p.status === 'withdrawn' ? 'bg-gradient-to-r from-gray-300 to-gray-400' :
                  'bg-gradient-to-r from-amber-400 to-orange-500'
                }`} />
                
                <div className="p-5">
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-4">
                        <div className={`w-12 h-12 rounded-xl ${statusConfig.bg} flex items-center justify-center flex-shrink-0 shadow-sm`}>
                          <StatusIcon className={`w-6 h-6 ${statusConfig.color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Link 
                              to={`/tasks/${p.task?._id}`} 
                              className="text-lg font-bold text-gray-900 hover:text-[var(--color-primary)] transition-colors line-clamp-1 group-hover:text-[var(--color-primary)]"
                            >
                              {p.task?.title || 'Task'}
                            </Link>
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusConfig.bg} ${statusConfig.color}`}>
                              {statusConfig.label}
                            </span>
                          </div>
                          
                          <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                            {p.message?.slice(0, 180)}{p.message?.length > 180 ? '...' : ''}
                          </p>
                          
                          <div className="flex flex-wrap items-center gap-4 mt-3">
                            {p.proposedBudget && (
                              <div className="flex items-center gap-1.5 text-sm text-gray-600">
                                <DollarSign className="w-4 h-4 text-emerald-500" />
                                <span className="font-medium">${p.proposedBudget.toLocaleString()}</span>
                              </div>
                            )}
                            {p.proposedTimeline && (
                              <div className="flex items-center gap-1.5 text-sm text-gray-600">
                                <Calendar className="w-4 h-4 text-blue-500" />
                                <span>{p.proposedTimeline}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-1.5 text-sm text-gray-500">
                              <Clock className="w-4 h-4" />
                              <span>{new Date(p.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 lg:flex-col lg:items-end">
                      <Link
                        to={`/tasks/${p.task?._id}`}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-light)] hover:opacity-90 text-white rounded-lg text-sm font-medium transition-all shadow-sm"
                      >
                        View Task
                        <ArrowUpRight className="w-4 h-4" />
                      </Link>
                      {p.status === "pending" && (
                        <button
                          onClick={() => handleWithdraw(p._id)}
                          disabled={withdrawingId === p._id}
                          className="px-4 py-2 border border-red-200 hover:bg-red-50 hover:border-red-300 text-red-600 rounded-lg text-sm font-medium transition-all disabled:opacity-50 flex items-center gap-2"
                        >
                          {withdrawingId === p._id && <Loader2 className="w-4 h-4 animate-spin" />}
                          Withdraw
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </DashboardLayout>
  );
}
