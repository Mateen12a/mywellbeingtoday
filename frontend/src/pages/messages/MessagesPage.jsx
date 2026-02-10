// src/pages/messages/MessagesPage.jsx
import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import {
  ChevronLeft, MessageCircle, Search, Send, Paperclip,
  CheckCheck, X, File, Image as ImageIcon, MessageSquare
} from "lucide-react";
import { socket as sharedSocket, connectSocket } from "../../utils/socket";
import PublicProfileModal from "../../components/profile/PublicProfileModal";
import { getImageUrl } from "../../utils/api";

dayjs.extend(relativeTime);

const API_URL = import.meta.env.VITE_API_URL;
const SUPPORTED_FILES = "JPEG, PNG, GIF, WEBP, PDF, DOC, DOCX, XLS, XLSX, TXT";

const getCurrentUserId = () => {
  const token = localStorage.getItem("token");
  if (!token) return null;
  try {
    const decoded = jwtDecode(token);
    return decoded.id || decoded._id;
  } catch (err) {
    return null;
  }
};

export default function MessagesPage() {
  const navigate = useNavigate();
  const { conversationId } = useParams();
  const token = localStorage.getItem("token");
  const currentUserId = getCurrentUserId();

  const [currentUser, setCurrentUser] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState("");
  const [attachments, setAttachments] = useState([]);
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [search, setSearch] = useState("");
  const [typing, setTyping] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [viewingProfileId, setViewingProfileId] = useState(null);

  const scrollRef = useRef();
  const inputRef = useRef();

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (user?.role?.toLowerCase().includes("admin")) {
      navigate("/admin/messaging");
      return;
    }
  }, [navigate]);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (!currentUserId || !token) return;
    axios.get(`${API_URL}/api/auth/users/${currentUserId}/public`, {
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => setCurrentUser(res.data)).catch(console.error);
  }, [currentUserId, token]);

  const fetchConversations = useCallback(async () => {
    if (!currentUserId || !token) return setIsLoading(false);
    try {
      const { data } = await axios.get(`${API_URL}/api/messages/inbox`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setConversations(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Inbox fetch failed", err);
    } finally {
      setIsLoading(false);
    }
  }, [currentUserId, token]);

  const fetchMessages = useCallback(async (convId) => {
    if (!convId || !token) return;
    setIsLoadingMessages(true);
    try {
      const [convRes, msgRes] = await Promise.all([
        axios.get(`${API_URL}/api/conversations/${convId}`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API_URL}/api/conversations/${convId}/messages`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);
      setSelectedConversation(convRes.data);
      setMessages(Array.isArray(msgRes.data) ? msgRes.data : msgRes.data.messages || []);
      axios.patch(`${API_URL}/api/conversations/${convId}/read`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      }).catch(console.error);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingMessages(false);
      setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: "auto" }), 100);
    }
  }, [token]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  useEffect(() => {
    if (conversationId) {
      fetchMessages(conversationId);
    } else {
      setSelectedConversation(null);
      setMessages([]);
    }
  }, [conversationId, fetchMessages]);

  useEffect(() => {
    if (!currentUserId || !token) return;
    connectSocket(token);
    sharedSocket.emit("join", currentUserId);

    const handleNewMessage = (msg) => {
      if (msg.conversationId === conversationId) {
        setMessages(prev => {
          if (prev.some(m => m._id === msg._id)) return prev;
          return [...prev, msg];
        });
        setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
        if (String(msg.receiver) === String(currentUserId)) {
          axios.patch(`${API_URL}/api/messages/${msg._id}/read`, {}, {
            headers: { Authorization: `Bearer ${token}` }
          }).catch(console.error);
        }
      }
      fetchConversations();
    };

    const handleTyping = ({ conversationId: cId, userId }) => {
      if (cId === conversationId && userId !== currentUserId) setTyping(true);
    };
    const handleStopTyping = ({ conversationId: cId, userId }) => {
      if (cId === conversationId && userId !== currentUserId) setTyping(false);
    };

    sharedSocket.on("message:new", handleNewMessage);
    sharedSocket.on("typing", handleTyping);
    sharedSocket.on("stopTyping", handleStopTyping);
    sharedSocket.on("conversationUpdate", fetchConversations);
    sharedSocket.on("conversation:new", fetchConversations);

    return () => {
      sharedSocket.off("message:new", handleNewMessage);
      sharedSocket.off("typing", handleTyping);
      sharedSocket.off("stopTyping", handleStopTyping);
      sharedSocket.off("conversationUpdate", fetchConversations);
      sharedSocket.off("conversation:new", fetchConversations);
    };
  }, [currentUserId, conversationId, token, fetchConversations]);

  const sendMessage = async () => {
    if ((!messageText.trim() && attachments.length === 0) || isSending || !selectedConversation) return;
    const otherUser = selectedConversation?.participants?.find(p => String(p._id) !== String(currentUserId));
    setIsSending(true);

    const tempId = `temp-${Date.now()}`;
    const optimisticMessage = {
      _id: tempId,
      text: messageText,
      sender: { _id: currentUserId },
      receiver: otherUser?._id,
      conversationId,
      createdAt: new Date().toISOString(),
      status: 'sending',
      attachments: attachments.map(f => ({ fileName: f.name, type: f.type.startsWith('image/') ? 'image' : 'file' }))
    };

    setMessages(prev => [...prev, optimisticMessage]);
    const sentText = messageText;
    const sentAttachments = [...attachments];
    setMessageText("");
    setAttachments([]);
    setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: "smooth" }), 50);

    try {
      const formData = new FormData();
      formData.append("conversationId", conversationId);
      formData.append("text", sentText);
      formData.append("receiverId", otherUser?._id);
      sentAttachments.forEach(file => formData.append("attachments", file));

      const { data: savedMessage } = await axios.post(`${API_URL}/api/messages`, formData, {
        headers: { "Content-Type": "multipart/form-data", Authorization: `Bearer ${token}` }
      });
      setMessages(prev => prev.map(m => m._id === tempId ? savedMessage : m));
      fetchConversations();
    } catch (err) {
      console.error(err);
      setMessages(prev => prev.filter(m => m._id !== tempId));
      setMessageText(sentText);
      setAttachments(sentAttachments);
    } finally {
      setIsSending(false);
    }
  };

  const handleAttach = (e) => {
    const files = Array.from(e.target.files);
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf', 'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain'
    ];
    const validFiles = files.filter(file => allowedTypes.includes(file.type));
    if (validFiles.length < files.length) {
      alert("Some files were not added. Only supported types: " + SUPPORTED_FILES);
    }
    setAttachments(prev => [...prev, ...validFiles]);
    e.target.value = null;
  };

  const selectConversation = (conv) => {
    navigate(`/messages/${conv.conversationId}`);
  };

  const goBackToList = () => {
    navigate("/messages");
  };

  const filteredConversations = conversations.filter((conv) => {
    if (!search) return true;
    const other = conv.otherUser || {};
    const displayName = other.name || `${other.firstName || ""} ${other.lastName || ""}`.trim();
    return displayName.toLowerCase().includes(search.toLowerCase());
  });

  // Use currentUserId from JWT (reliable) instead of currentUser._id (may be null)
  const otherUser = selectedConversation?.participants?.find(p => String(p._id) !== String(currentUserId));
  const chatTitle = otherUser ? `${otherUser.firstName || ""} ${otherUser.lastName || ""}`.trim() || otherUser.name || "Chat" : "";
  const chatProfileImage = otherUser?.profileImage && !otherUser.profileImage.includes("default.jpg") ? getImageUrl(otherUser.profileImage) : null;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="w-10 h-10 border-4 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const conversationListContent = (
    <div className={`flex flex-col bg-white ${isMobile ? "w-full h-full" : "w-80 lg:w-96 border-r border-gray-200"}`}>
      <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-light)]">
        <div className="flex items-center gap-3 mb-3">
          <button onClick={() => navigate("/dashboard")} className="p-2 rounded-full hover:bg-white/20 text-white">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold text-white">Messages</h1>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-full bg-white/90 text-gray-800 placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-white/50"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <MessageSquare className="w-16 h-16 text-gray-300 mb-4" />
            <p className="text-gray-500 text-center">
              {search ? "No conversations match your search" : "No conversations yet"}
            </p>
          </div>
        ) : (
          filteredConversations.map((conv) => {
            const other = conv.otherUser || {};
            const lastMsg = conv.lastMessage || {};
            const isUnread = conv.unreadCount > 0;
            const isSelected = conv.conversationId === conversationId;
            const displayName = other.name || `${other.firstName || ""} ${other.lastName || ""}`.trim() || "User";
            const profileImg = other.profileImage && !other.profileImage.includes("default.jpg") ? getImageUrl(other.profileImage) : null;

            return (
              <div
                key={conv.conversationId}
                onClick={() => selectConversation(conv)}
                className={`flex items-center gap-3 p-4 cursor-pointer border-b border-gray-100 hover:bg-gray-50 transition-colors ${isSelected ? "bg-blue-50" : ""}`}
              >
                <div className="relative flex-shrink-0">
                  {profileImg ? (
                    <img src={profileImg} alt="" className="w-12 h-12 rounded-full object-cover" />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-light)] flex items-center justify-center text-white font-semibold">
                      {(other.firstName?.[0] || "U").toUpperCase()}
                    </div>
                  )}
                  {isUnread && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-[var(--color-primary)] text-white text-xs font-bold rounded-full flex items-center justify-center">
                      {conv.unreadCount}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className={`font-semibold text-gray-900 truncate ${isUnread ? "font-bold" : ""}`}>
                      {displayName}
                    </p>
                    {lastMsg.createdAt && (
                      <span className="text-xs text-gray-500 flex-shrink-0">
                        {dayjs(lastMsg.createdAt).fromNow()}
                      </span>
                    )}
                  </div>
                  <p className={`text-sm truncate mt-0.5 ${isUnread ? "text-gray-800 font-medium" : "text-gray-500"}`}>
                    {lastMsg.text || (lastMsg.attachments?.length > 0 ? "Sent an attachment" : "Start a conversation")}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );

  const chatViewContent = (
    <div className={`flex flex-col bg-gray-50 ${isMobile ? "w-full h-full fixed inset-0 z-50" : "flex-1"}`} key="chat-view">
      <div className="flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-200 shadow-sm">
        {isMobile && (
          <button onClick={goBackToList} className="p-2 -ml-2 rounded-full hover:bg-gray-100">
            <ChevronLeft className="w-6 h-6 text-gray-700" />
          </button>
        )}
        {isLoadingMessages ? (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gray-200 animate-pulse" />
            <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
          </div>
        ) : (
          <div 
            className="flex items-center gap-3 flex-1 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => otherUser?._id && setViewingProfileId(otherUser._id)}
          >
            {chatProfileImage ? (
              <img src={chatProfileImage} alt="" className="w-10 h-10 rounded-full object-cover" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-light)] flex items-center justify-center text-white font-semibold">
                {(otherUser?.firstName?.[0] || "U").toUpperCase()}
              </div>
            )}
            <div className="flex-1">
              <h2 className="font-semibold text-gray-900">{chatTitle || "Chat"}</h2>
              {typing && (
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <span>typing</span>
                  <div className="flex gap-0.5">
                    <span className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {isLoadingMessages ? (
          <div className="flex items-center justify-center h-full">
            <div className="w-8 h-8 border-3 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <MessageCircle className="w-16 h-16 mb-3" />
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {messages.map((msg, index) => {
              const senderId = msg.sender?._id || msg.sender;
              // Use currentUserId from JWT token for reliable comparison
              const isMe = String(senderId) === String(currentUserId);
              const isLastMessage = index === messages.length - 1;
              const isSeen = isMe && (msg.status === 'seen' || msg.read);

              return (
                <motion.div
                  key={msg._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                  ref={isLastMessage ? scrollRef : null}
                >
                  <div
                    className={`max-w-[80%] sm:max-w-[70%] px-4 py-2.5 rounded-2xl shadow-sm ${
                      isMe
                        ? "bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-light)] text-white rounded-br-md"
                        : "bg-white text-gray-800 border border-gray-100 rounded-bl-md"
                    }`}
                  >
                    {msg.text && <p className="text-sm break-words whitespace-pre-wrap">{msg.text}</p>}

                    {msg.attachments?.map((att, idx) => (
                      <div key={idx} className="mt-2">
                        {att.type === "image" ? (
                          <img
                            src={`${API_URL}${att.url}`}
                            alt={att.fileName}
                            className="max-w-[200px] rounded-lg cursor-pointer"
                            onClick={() => setPreviewImage(`${API_URL}${att.url}`)}
                          />
                        ) : (
                          <a
                            href={`${API_URL}${att.url}`}
                            target="_blank"
                            rel="noreferrer"
                            className={`flex items-center gap-2 text-sm underline ${isMe ? "text-white/90" : "text-[var(--color-primary)]"}`}
                          >
                            <File className="w-4 h-4" />
                            {att.fileName}
                          </a>
                        )}
                      </div>
                    ))}

                    <div className={`flex items-center justify-end gap-1 text-xs mt-1 ${isMe ? "text-white/70" : "text-gray-400"}`}>
                      <span>{dayjs(msg.createdAt).format("HH:mm")}</span>
                      {isMe && (
                        <CheckCheck className={`w-3.5 h-3.5 ${isSeen ? "text-blue-300" : "text-white/50"}`} />
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
        <div ref={scrollRef} />
      </div>

      {attachments.length > 0 && (
        <div className="px-4 py-2 bg-white border-t border-gray-100 flex flex-wrap gap-2">
          {attachments.map((file, index) => (
            <div key={index} className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg text-sm">
              {file.type.startsWith('image/') ? <ImageIcon className="w-4 h-4 text-[var(--color-primary)]" /> : <File className="w-4 h-4 text-[var(--color-primary)]" />}
              <span className="text-gray-700 max-w-[120px] truncate">{file.name}</span>
              <button className="text-red-500" onClick={() => setAttachments(attachments.filter((_, i) => i !== index))}>
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="p-3 bg-white border-t border-gray-200 safe-area-bottom">
        <div className="flex items-center gap-2 max-w-full">
          <label className="flex-shrink-0 p-2 rounded-full cursor-pointer text-gray-500 hover:text-[var(--color-primary)] hover:bg-gray-100 transition-colors">
            <Paperclip className="w-5 h-5" />
            <input
              type="file"
              multiple
              className="hidden"
              onChange={handleAttach}
              accept="image/*, application/pdf, .doc, .docx, .xls, .xlsx, .txt"
            />
          </label>
          <div className="flex-1 min-w-0">
            <input
              ref={inputRef}
              type="text"
              placeholder="Type a message..."
              className="w-full px-4 py-2.5 rounded-full bg-gray-100 text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30 text-sm"
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
            />
          </div>
          <button
            onClick={sendMessage}
            disabled={(!messageText.trim() && attachments.length === 0) || isSending}
            className="flex-shrink-0 p-2.5 rounded-full bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-light)] text-white disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg transition-shadow"
          >
            {isSending ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );

  const emptyChatContent = (
    <div className="flex-1 flex flex-col items-center justify-center bg-gray-50 text-gray-400">
      <MessageSquare className="w-24 h-24 mb-4" />
      <h3 className="text-xl font-semibold text-gray-600 mb-2">Select a conversation</h3>
      <p className="text-sm">Choose a chat from the list to start messaging</p>
    </div>
  );

  if (previewImage) {
    return (
      <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4" onClick={() => setPreviewImage(null)}>
        <button className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white" onClick={() => setPreviewImage(null)}>
          <X size={24} />
        </button>
        <img src={previewImage} alt="Preview" className="max-h-[90vh] max-w-[90vw] object-contain rounded-lg" onClick={(e) => e.stopPropagation()} />
      </div>
    );
  }

  if (isMobile) {
    return (
      <>
        {conversationId ? chatViewContent : conversationListContent}
        {viewingProfileId && (
          <PublicProfileModal userId={viewingProfileId} onClose={() => setViewingProfileId(null)} />
        )}
      </>
    );
  }

  return (
    <>
      <div className="flex h-screen bg-gray-100">
        {conversationListContent}
        {conversationId ? chatViewContent : emptyChatContent}
      </div>
      {viewingProfileId && (
        <PublicProfileModal userId={viewingProfileId} onClose={() => setViewingProfileId(null)} />
      )}
    </>
  );
}
