// src/pages/messages/InboxPage.jsx
import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { socket } from "../../utils/socket";
import { jwtDecode } from "jwt-decode";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { ChevronLeft, MessageCircle, Inbox, Search } from "lucide-react";

dayjs.extend(relativeTime);

const API_URL = import.meta.env.VITE_API_URL;

const getCurrentUserId = () => {
  const token = localStorage.getItem("token");
  if (!token) return null;
  try {
    const decoded = jwtDecode(token);
    return decoded.id || decoded._id;
  } catch (err) {
    console.error("Token decode error:", err);
    return null;
  }
};

export default function InboxPage() {
  const [conversations, setConversations] = useState([]);
  const [totalUnreadCount, setTotalUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const navigate = useNavigate();
  
  const currentUserId = getCurrentUserId();
  
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (user?.role?.toLowerCase().includes("admin")) {
      navigate("/admin/messaging");
    }
  }, [navigate]);

  const fetchInbox = useCallback(async () => {
    if (!currentUserId) return setIsLoading(false);

    const token = localStorage.getItem("token");
    setIsLoading(true);

    try {
      const [inboxRes, unreadRes] = await Promise.all([
        axios.get(`${API_URL}/api/messages/inbox`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_URL}/api/messages/unread/count`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      setConversations(Array.isArray(inboxRes.data) ? inboxRes.data : []);
      setTotalUnreadCount(unreadRes.data.unreadCount || 0);

    } catch (err) {
      console.error("Inbox fetch failed", err.response?.data || err.message);
    } finally {
      setIsLoading(false);
    }
  }, [currentUserId]);

  useEffect(() => {
    fetchInbox();
    if (!socket || !currentUserId) return;

    socket.emit("join", currentUserId);
    const updateHandler = () => fetchInbox();

    socket.on("message:new", updateHandler);
    socket.on("conversationUpdate", updateHandler);
    socket.on("conversation:new", updateHandler);

    return () => {
      socket.off("message:new", updateHandler);
      socket.off("conversationUpdate", updateHandler);
      socket.off("conversation:new", updateHandler);
      socket.emit("leave", currentUserId);
    };
  }, [fetchInbox, currentUserId]);

  const filteredConversations = conversations.filter((conv) => {
    if (!search) return true;
    const other = conv.otherUser || {};
    const displayName = other.name || `${other.firstName || ""} ${other.lastName || ""}`.trim();
    return displayName.toLowerCase().includes(search.toLowerCase());
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-screen bg-[var(--color-bg)]">
        <div className="w-10 h-10 border-4 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
        <p className="mt-4 text-[var(--color-text-muted)]">Loading conversations...</p>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col h-full min-h-screen bg-[var(--color-bg)]"
    >
      <div className="flex items-center justify-between p-4 bg-[var(--color-surface)] shadow-sm sticky top-0 z-20 border-b border-[var(--color-border)]">
        <button 
          onClick={() => navigate(-1)} 
          className="p-2 rounded-full hover:bg-[var(--color-bg)] transition-colors"
        >
          <ChevronLeft className="w-6 h-6 text-[var(--color-text)]"/>
        </button>
        <h2 className="text-xl font-semibold text-[var(--color-text)]">Messages</h2>
        {totalUnreadCount > 0 ? (
          <span className="text-xs bg-[var(--color-primary)] text-white px-3 py-1 rounded-full font-medium">
            {totalUnreadCount} unread
          </span>
        ) : (
          <div className="w-16" />
        )}
      </div>

      <div className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-text-muted)]" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-3 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text)] placeholder-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] transition-all"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-3">
        {filteredConversations.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-16"
          >
            <div className="w-20 h-20 rounded-full bg-[var(--color-surface)] flex items-center justify-center mb-4">
              <Inbox className="w-10 h-10 text-[var(--color-text-muted)]" />
            </div>
            <p className="text-[var(--color-text-muted)] text-center">
              {search ? "No conversations match your search" : "No conversations yet"}
            </p>
            {!search && (
              <p className="text-[var(--color-text-muted)] text-sm mt-1">
                Start a new chat to connect with others!
              </p>
            )}
          </motion.div>
        ) : (
          <AnimatePresence mode="popLayout">
            {filteredConversations.map((conv, index) => {
              const other = conv.otherUser || {};
              const lastMsg = conv.lastMessage || {};
              const isUnread = conv.unreadCount > 0;
              const displayName = other.name || `${other.firstName || ""} ${other.lastName || ""}`.trim() || "Unknown User";

              return (
                <motion.div
                  key={conv.conversationId}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: index * 0.03 }}
                  onClick={() => navigate(`/chat/${conv.conversationId}`)}
                  className={`card p-4 cursor-pointer hover:shadow-lg transition-all group ${
                    isUnread ? "ring-2 ring-[var(--color-primary)] ring-opacity-50" : ""
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <img
                        src={other.profileImage || "/default.jpg"}
                        alt={displayName}
                        className="w-14 h-14 rounded-full object-cover bg-[var(--color-surface)] ring-2 ring-[var(--color-border)] group-hover:ring-[var(--color-primary)] transition-all"
                      />
                      {isUnread && (
                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-[var(--color-primary)] text-white text-xs font-bold rounded-full flex items-center justify-center">
                          {conv.unreadCount}
                        </span>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className={`font-semibold text-[var(--color-text)] truncate ${isUnread ? "font-bold" : ""}`}>
                          {displayName}
                        </p>
                        {lastMsg.createdAt && (
                          <span className="text-xs text-[var(--color-text-muted)] flex-shrink-0 ml-2">
                            {dayjs(lastMsg.createdAt).fromNow()}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <MessageCircle className="w-4 h-4 text-[var(--color-text-muted)] flex-shrink-0" />
                        <p className={`text-sm truncate ${isUnread ? "text-[var(--color-text)] font-medium" : "text-[var(--color-text-muted)]"}`}>
                          {lastMsg.text || (lastMsg.attachments?.length > 0 ? "Sent an attachment" : "No messages yet")}
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>
    </motion.div>
  );
}
