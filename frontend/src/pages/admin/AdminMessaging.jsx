import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, Send, Users, Search, Check, CheckCheck, Paperclip, X, FileText, Image, Download } from "lucide-react";
import DashboardLayout from "../../components/dashboard/DashboardLayout";
import { socket, connectSocket, disconnectSocket } from "../../utils/socket";
import { InlineLoader } from "../../components/LoadingSpinner";

const API_URL = import.meta.env.VITE_API_URL;

export default function AdminMessaging() {
  const [admins, setAdmins] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showNewChat, setShowNewChat] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const token = localStorage.getItem("token");
  const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
  const currentUser = { ...storedUser, _id: storedUser._id || storedUser.id };

  useEffect(() => {
    fetchAdmins();
    fetchConversations();

    connectSocket(token);
    socket.emit("join", currentUser._id);

    socket.on("message:new", (message) => {
      if (selectedConversation && message.conversationId === selectedConversation._id) {
        setMessages((prev) => [...prev, message]);
        scrollToBottom();
      }
      fetchConversations();
    });

    return () => {
      socket.off("message:new");
      disconnectSocket();
    };
  }, []);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation._id);
      socket.emit("joinConversation", selectedConversation._id);
    }
  }, [selectedConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchAdmins = async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/admins`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setAdmins(data.filter(a => a._id !== currentUser._id));
      }
    } catch (err) {
      console.error("Error fetching admins:", err);
    }
  };

  const fetchConversations = async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/conversations`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setConversations(data);
      }
    } catch (err) {
      console.error("Error fetching conversations:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (conversationId) => {
    try {
      const res = await fetch(`${API_URL}/api/admin/conversations/${conversationId}/messages`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setMessages(data);
      }
    } catch (err) {
      console.error("Error fetching messages:", err);
    }
  };

  const startNewConversation = async (adminId) => {
    try {
      const res = await fetch(`${API_URL}/api/admin/conversations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ participantId: adminId }),
      });
      const data = await res.json();
      if (res.ok) {
        setSelectedConversation(data);
        fetchConversations();
        setShowNewChat(false);
      }
    } catch (err) {
      console.error("Error starting conversation:", err);
    }
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    setSelectedFiles(prev => [...prev, ...files].slice(0, 5));
  };

  const removeFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if ((!newMessage.trim() && selectedFiles.length === 0) || !selectedConversation) return;

    const sentText = newMessage;
    const sentFiles = [...selectedFiles];
    const tempId = `temp-${Date.now()}`;
    
    const optimisticMessage = {
      _id: tempId,
      content: sentText,
      sender: { _id: currentUser._id, firstName: currentUser.firstName, lastName: currentUser.lastName },
      conversationId: selectedConversation._id,
      createdAt: new Date().toISOString(),
      read: false,
      attachments: sentFiles.map(f => ({ originalName: f.name, mimetype: f.type }))
    };
    
    setMessages(prev => [...prev, optimisticMessage]);
    setNewMessage("");
    setSelectedFiles([]);
    scrollToBottom();
    
    setSendingMessage(true);
    try {
      const formData = new FormData();
      if (sentText.trim()) {
        formData.append("content", sentText);
      }
      sentFiles.forEach(file => {
        formData.append("attachments", file);
      });

      const res = await fetch(`${API_URL}/api/admin/conversations/${selectedConversation._id}/messages`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        setMessages(prev => prev.map(m => m._id === tempId ? data : m));
        fetchConversations();
      } else {
        setMessages(prev => prev.filter(m => m._id !== tempId));
        setNewMessage(sentText);
        setSelectedFiles(sentFiles);
      }
    } catch (err) {
      console.error("Error sending message:", err);
      setMessages(prev => prev.filter(m => m._id !== tempId));
      setNewMessage(sentText);
      setSelectedFiles(sentFiles);
    } finally {
      setSendingMessage(false);
    }
  };

  const isImageFile = (mimetype) => mimetype?.startsWith("image/");

  const getFileIcon = (mimetype) => {
    if (isImageFile(mimetype)) return Image;
    return FileText;
  };

  const getOtherParticipant = (conversation) => {
    return conversation.participants?.find(p => p._id !== currentUser._id);
  };

  const filteredAdmins = admins.filter(admin =>
    `${admin.firstName} ${admin.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <DashboardLayout role="admin" title="Admin Messaging">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card overflow-hidden h-[calc(100vh-200px)] min-h-[600px]"
      >
        <div className="flex h-full">
          <div className="w-80 border-r border-[var(--color-border)] flex flex-col">
            <div className="p-4 border-b border-[var(--color-border)]">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-[var(--color-text)]">Messages</h3>
                <button
                  onClick={() => setShowNewChat(true)}
                  className="p-2 rounded-lg bg-[var(--color-primary-light)] text-white hover:opacity-90 transition-opacity"
                  title="New message"
                >
                  <MessageSquare size={18} />
                </button>
              </div>
              <div className="relative">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search conversations..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-light)]"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="p-4 text-center">
                  <div className="w-6 h-6 border-2 border-[var(--color-primary-light)] border-t-transparent rounded-full animate-spin mx-auto" />
                </div>
              ) : conversations.length === 0 ? (
                <div className="p-4 text-center text-[var(--color-text-secondary)]">
                  <Users size={32} className="mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No conversations yet</p>
                  <p className="text-xs mt-1">Start a chat with another admin</p>
                </div>
              ) : (
                conversations.map((conv) => {
                  const other = getOtherParticipant(conv);
                  return (
                    <button
                      key={conv._id}
                      onClick={() => setSelectedConversation(conv)}
                      className={`w-full p-4 flex items-center gap-3 hover:bg-[var(--color-bg-secondary)] transition-colors border-b border-[var(--color-border)] ${
                        selectedConversation?._id === conv._id ? "bg-[var(--color-bg-secondary)]" : ""
                      }`}
                    >
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-light)] flex items-center justify-center text-white font-semibold flex-shrink-0">
                        {other?.firstName?.[0]}{other?.lastName?.[0]}
                      </div>
                      <div className="flex-1 text-left overflow-hidden">
                        <p className="font-medium text-[var(--color-text)] truncate">
                          {other?.firstName} {other?.lastName}
                        </p>
                        <p className="text-xs text-[var(--color-text-secondary)] truncate">
                          {conv.lastMessage?.content || "No messages yet"}
                        </p>
                      </div>
                      {conv.unreadCount > 0 && (
                        <span className="w-5 h-5 rounded-full bg-[var(--color-accent)] text-white text-xs flex items-center justify-center">
                          {conv.unreadCount}
                        </span>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>

          <div className="flex-1 flex flex-col">
            {selectedConversation ? (
              <>
                <div className="p-4 border-b border-[var(--color-border)] flex items-center gap-3">
                  {(() => {
                    const other = getOtherParticipant(selectedConversation);
                    return (
                      <>
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-light)] flex items-center justify-center text-white font-semibold">
                          {other?.firstName?.[0]}{other?.lastName?.[0]}
                        </div>
                        <div>
                          <p className="font-bold text-[var(--color-text)]">
                            {other?.firstName} {other?.lastName}
                          </p>
                          <p className="text-xs text-[var(--color-text-secondary)]">Administrator</p>
                        </div>
                      </>
                    );
                  })()}
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.map((msg) => {
                    const senderId = msg.sender?._id || msg.sender;
                    const isMe = String(senderId) === String(currentUser._id);
                    return (
                    <div
                      key={msg._id}
                      className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[70%] rounded-2xl px-4 py-3 ${
                          isMe
                            ? "bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-light)] text-white rounded-br-sm"
                            : "bg-[var(--color-bg-secondary)] text-[var(--color-text)] rounded-bl-sm"
                        }`}
                      >
                        {msg.content && <p className="text-sm">{msg.content}</p>}
                        {msg.attachments && msg.attachments.length > 0 && (
                          <div className={`${msg.content ? "mt-2" : ""} space-y-2`}>
                            {msg.attachments.map((att, idx) => (
                              <div key={idx}>
                                {isImageFile(att.mimetype) ? (
                                  <a href={att.path} target="_blank" rel="noopener noreferrer">
                                    <img
                                      src={att.path}
                                      alt={att.originalName}
                                      className="max-w-full rounded-lg max-h-48 object-cover"
                                    />
                                  </a>
                                ) : (
                                  <a
                                    href={att.path}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={`flex items-center gap-2 p-2 rounded-lg ${
                                      isMe
                                        ? "bg-white/20 hover:bg-white/30"
                                        : "bg-[var(--color-bg-tertiary)] hover:bg-[var(--color-border)]"
                                    } transition-colors`}
                                  >
                                    <FileText size={16} />
                                    <span className="text-sm truncate flex-1">{att.originalName}</span>
                                    <Download size={14} />
                                  </a>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                        <p className={`text-xs mt-1 flex items-center gap-1 ${
                          isMe ? "text-white/70" : "text-[var(--color-text-muted)]"
                        }`}>
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          {isMe && (
                            msg.read ? <CheckCheck size={14} /> : <Check size={14} />
                          )}
                        </p>
                      </div>
                    </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                <form onSubmit={sendMessage} className="p-4 border-t border-[var(--color-border)]">
                  {selectedFiles.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {selectedFiles.map((file, idx) => (
                        <div key={idx} className="flex items-center gap-2 px-3 py-1.5 bg-[var(--color-bg-secondary)] rounded-lg text-sm">
                          <FileText size={14} className="text-[var(--color-text-secondary)]" />
                          <span className="truncate max-w-[120px] text-[var(--color-text)]">{file.name}</span>
                          <button
                            type="button"
                            onClick={() => removeFile(idx)}
                            className="text-red-500 hover:text-red-600"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="flex gap-3">
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      className="hidden"
                      onChange={handleFileSelect}
                      accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="p-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-secondary)] transition-colors"
                      title="Attach files"
                    >
                      <Paperclip size={20} />
                    </button>
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type your message..."
                      className="flex-1 px-4 py-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-light)]"
                    />
                    <button
                      type="submit"
                      disabled={(!newMessage.trim() && selectedFiles.length === 0) || sendingMessage}
                      className="px-6 py-3 rounded-xl bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-light)] text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-opacity flex items-center gap-2"
                    >
                      {sendingMessage ? (
                        <InlineLoader size={18} />
                      ) : (
                        <Send size={18} />
                      )}
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <MessageSquare size={64} className="mx-auto text-[var(--color-text-muted)] mb-4 opacity-50" />
                  <h3 className="text-xl font-bold text-[var(--color-text)] mb-2">Select a Conversation</h3>
                  <p className="text-[var(--color-text-secondary)]">Choose a conversation or start a new chat</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      <AnimatePresence>
        {showNewChat && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowNewChat(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] w-full max-w-md shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-6 border-b border-[var(--color-border)]">
                <h3 className="text-lg font-bold text-[var(--color-text)]">Start New Chat</h3>
                <button
                  onClick={() => setShowNewChat(false)}
                  className="p-2 rounded-lg hover:bg-[var(--color-bg-secondary)] transition-colors"
                >
                  <X size={20} className="text-[var(--color-text-secondary)]" />
                </button>
              </div>

              <div className="p-4 max-h-96 overflow-y-auto">
                {filteredAdmins.length === 0 ? (
                  <p className="text-center text-[var(--color-text-secondary)] py-4">No other admins found</p>
                ) : (
                  filteredAdmins.map((admin) => (
                    <button
                      key={admin._id}
                      onClick={() => startNewConversation(admin._id)}
                      className="w-full p-4 flex items-center gap-3 hover:bg-[var(--color-bg-secondary)] rounded-xl transition-colors"
                    >
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-light)] flex items-center justify-center text-white font-semibold">
                        {admin.firstName?.[0]}{admin.lastName?.[0]}
                      </div>
                      <div className="text-left">
                        <p className="font-medium text-[var(--color-text)]">{admin.firstName} {admin.lastName}</p>
                        <p className="text-sm text-[var(--color-text-secondary)]">{admin.email}</p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}
