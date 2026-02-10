import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FileText,
  Search,
  Filter,
  Trash2,
  Eye,
  User,
  Calendar,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Loader2,
  ExternalLink,
} from "lucide-react";
import DashboardLayout from "../../components/dashboard/DashboardLayout";

const API_URL = import.meta.env.VITE_API_URL;

export default function AdminProposals() {
  const token = localStorage.getItem("token");
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [counts, setCounts] = useState({ pending: 0, accepted: 0, rejected: 0, withdrawn: 0, total: 0 });
  const [selectedProposal, setSelectedProposal] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const fetchProposals = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 20 });
      if (filter !== "all") params.append("status", filter);

      const res = await fetch(`${API_URL}/api/admin/proposals?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setProposals(data.proposals || []);
        setTotalPages(data.totalPages || 1);
        setCounts(data.counts || { pending: 0, accepted: 0, rejected: 0, withdrawn: 0, total: 0 });
      }
    } catch (err) {
      console.error("Error fetching proposals:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProposals();
  }, [page, filter]);

  const deleteProposal = async (id) => {
    if (!confirm("Are you sure you want to delete this proposal?")) return;
    try {
      const res = await fetch(`${API_URL}/api/admin/proposals/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setProposals((prev) => prev.filter((p) => p._id !== id));
        setCounts((prev) => ({ ...prev, total: prev.total - 1 }));
      }
    } catch (err) {
      console.error("Error deleting proposal:", err);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getStatusBadge = (status) => {
    const styles = {
      pending: "bg-amber-100 text-amber-700",
      accepted: "bg-emerald-100 text-emerald-700",
      rejected: "bg-red-100 text-red-700",
      withdrawn: "bg-gray-100 text-gray-700",
    };
    const icons = {
      pending: <Clock className="w-3 h-3" />,
      accepted: <CheckCircle className="w-3 h-3" />,
      rejected: <XCircle className="w-3 h-3" />,
      withdrawn: <AlertCircle className="w-3 h-3" />,
    };
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${styles[status] || styles.pending}`}>
        {icons[status]}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const filteredProposals = proposals.filter((p) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      p.fromUser?.firstName?.toLowerCase().includes(search) ||
      p.fromUser?.lastName?.toLowerCase().includes(search) ||
      p.fromUser?.email?.toLowerCase().includes(search) ||
      p.task?.title?.toLowerCase().includes(search) ||
      p.message?.toLowerCase().includes(search)
    );
  });

  const filterOptions = [
    { value: "all", label: "All", count: counts.total },
    { value: "pending", label: "Pending", count: counts.pending },
    { value: "accepted", label: "Accepted", count: counts.accepted },
    { value: "rejected", label: "Rejected", count: counts.rejected },
    { value: "withdrawn", label: "Withdrawn", count: counts.withdrawn },
  ];

  return (
    <DashboardLayout role="admin" title="Proposals Management">
      <div className="flex flex-col gap-4 sm:gap-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-[var(--color-text)]">Proposals</h1>
            <p className="text-sm text-[var(--color-text-secondary)] mt-1">
              {counts.total} total proposals
            </p>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" />
            <input
              type="text"
              placeholder="Search proposals..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          <Filter className="w-4 h-4 text-[var(--color-text-muted)] flex-shrink-0" />
          {filterOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => { setFilter(opt.value); setPage(1); }}
              className={`px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg whitespace-nowrap transition-colors ${
                filter === opt.value
                  ? "bg-[var(--color-primary)] text-white"
                  : "bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)]"
              }`}
            >
              {opt.label} ({opt.count})
            </button>
          ))}
        </div>

        <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-[var(--color-primary)]" />
              <span className="ml-2 text-[var(--color-text-secondary)]">Loading...</span>
            </div>
          ) : filteredProposals.length === 0 ? (
            <div className="py-16 text-center">
              <div className="w-16 h-16 bg-[var(--color-bg-secondary)] rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-[var(--color-text-muted)]" />
              </div>
              <h3 className="text-lg font-semibold text-[var(--color-text)] mb-1">No proposals found</h3>
              <p className="text-[var(--color-text-secondary)] text-sm">
                {filter !== "all" ? `No ${filter} proposals` : "No proposals to display"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px]">
                <thead className="bg-[var(--color-bg-secondary)]">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">Applicant</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">Task</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">Budget</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">Date</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border)]">
                  {filteredProposals.map((proposal) => (
                    <motion.tr
                      key={proposal._id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="hover:bg-[var(--color-bg-secondary)] transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-light)] flex items-center justify-center text-white text-xs font-medium flex-shrink-0">
                            {proposal.fromUser?.firstName?.charAt(0) || "U"}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-[var(--color-text)] truncate">
                              {proposal.fromUser?.firstName} {proposal.fromUser?.lastName}
                            </p>
                            <p className="text-xs text-[var(--color-text-muted)] truncate">
                              {proposal.fromUser?.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          to={`/tasks/${proposal.task?._id}`}
                          className="text-sm font-medium text-[var(--color-text)] hover:text-[var(--color-primary)] transition-colors line-clamp-2"
                        >
                          {proposal.task?.title || "Task Deleted"}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        {getStatusBadge(proposal.status)}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-[var(--color-text)]">
                          {proposal.proposedBudget ? `$${proposal.proposedBudget.toLocaleString()}` : "-"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-[var(--color-text-secondary)]">
                          {formatDate(proposal.createdAt)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => { setSelectedProposal(proposal); setShowModal(true); }}
                            className="p-2 rounded-lg hover:bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] transition-colors"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deleteProposal(proposal._id)}
                            className="p-2 rounded-lg hover:bg-red-100 text-[var(--color-text-secondary)] hover:text-red-500 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-4">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 rounded-lg bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="px-4 py-2 text-sm text-[var(--color-text-secondary)]">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-2 rounded-lg bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>

      {showModal && selectedProposal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[var(--color-surface)] rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden"
          >
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-[var(--color-border)]">
              <h2 className="text-lg font-semibold text-[var(--color-text)]">Proposal Details</h2>
              <button
                onClick={() => { setShowModal(false); setSelectedProposal(null); }}
                className="p-2 rounded-lg hover:bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)]"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 sm:p-6 overflow-y-auto max-h-[60vh]">
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-light)] flex items-center justify-center text-white font-medium">
                    {selectedProposal.fromUser?.firstName?.charAt(0) || "U"}
                  </div>
                  <div>
                    <p className="font-semibold text-[var(--color-text)]">
                      {selectedProposal.fromUser?.firstName} {selectedProposal.fromUser?.lastName}
                    </p>
                    <p className="text-sm text-[var(--color-text-secondary)]">
                      {selectedProposal.fromUser?.email}
                    </p>
                  </div>
                  {getStatusBadge(selectedProposal.status)}
                </div>

                <div className="bg-[var(--color-bg-secondary)] rounded-xl p-4">
                  <p className="text-xs text-[var(--color-text-muted)] uppercase mb-1">Task</p>
                  <Link
                    to={`/tasks/${selectedProposal.task?._id}`}
                    className="text-[var(--color-text)] font-medium hover:text-[var(--color-primary)] flex items-center gap-1"
                  >
                    {selectedProposal.task?.title || "Task Deleted"}
                    <ExternalLink className="w-4 h-4" />
                  </Link>
                </div>

                <div>
                  <p className="text-xs text-[var(--color-text-muted)] uppercase mb-2">Message</p>
                  <p className="text-sm text-[var(--color-text)] bg-[var(--color-bg-secondary)] rounded-xl p-4">
                    {selectedProposal.message}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {selectedProposal.proposedBudget && (
                    <div className="bg-[var(--color-bg-secondary)] rounded-xl p-3">
                      <div className="flex items-center gap-2 text-[var(--color-text-secondary)] mb-1">
                        <DollarSign className="w-4 h-4" />
                        <span className="text-xs uppercase">Budget</span>
                      </div>
                      <p className="text-lg font-semibold text-[var(--color-text)]">
                        ${selectedProposal.proposedBudget.toLocaleString()}
                      </p>
                    </div>
                  )}
                  {selectedProposal.proposedDuration && (
                    <div className="bg-[var(--color-bg-secondary)] rounded-xl p-3">
                      <div className="flex items-center gap-2 text-[var(--color-text-secondary)] mb-1">
                        <Clock className="w-4 h-4" />
                        <span className="text-xs uppercase">Duration</span>
                      </div>
                      <p className="text-lg font-semibold text-[var(--color-text)]">
                        {selectedProposal.proposedDuration}
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
                  <Calendar className="w-4 h-4" />
                  Submitted on {formatDate(selectedProposal.createdAt)}
                </div>

                {selectedProposal.attachments?.length > 0 && (
                  <div>
                    <p className="text-xs text-[var(--color-text-muted)] uppercase mb-2">Attachments</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedProposal.attachments.map((att, idx) => (
                        <a
                          key={idx}
                          href={att}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-[var(--color-bg-secondary)] rounded-lg text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-primary)]"
                        >
                          <FileText className="w-4 h-4" />
                          Attachment {idx + 1}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 p-4 sm:p-6 border-t border-[var(--color-border)]">
              <button
                onClick={() => { setShowModal(false); setSelectedProposal(null); }}
                className="px-4 py-2 rounded-xl bg-[var(--color-bg-secondary)] text-[var(--color-text)] font-medium hover:bg-[var(--color-bg-tertiary)] transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => { deleteProposal(selectedProposal._id); setShowModal(false); setSelectedProposal(null); }}
                className="px-4 py-2 rounded-xl bg-red-500 text-white font-medium hover:bg-red-600 transition-colors"
              >
                Delete Proposal
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </DashboardLayout>
  );
}
