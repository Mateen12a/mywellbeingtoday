// src/pages/messages/ChatPage.jsx
import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { Paperclip, Send, CheckCheck, ChevronLeft, X, File, Image as ImageIcon } from "lucide-react"; 
import dayjs from "dayjs";
import { socket as sharedSocket, connectSocket, safeOn } from "../../utils/socket";
import { jwtDecode } from "jwt-decode";
import useAutoMarkRead from "../../hooks/useAutoMarkRead";

const API_URL = import.meta.env.VITE_API_URL;

const SUPPORTED_FILES = "JPEG, PNG, GIF, WEBP, PDF, DOC, DOCX, XLS, XLSX, TXT";

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

export default function ChatPage({ currentUser: propUser }) {
  const { conversationId } = useParams();
  const navigate = useNavigate();

  const [currentUser, setCurrentUser] = useState(propUser);
  const [messages, setMessages] = useState([]);
  const [conversation, setConversation] = useState(null);
  const [messageText, setMessageText] = useState("");
  const [attachments, setAttachments] = useState([]);
  const [typing, setTyping] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const [isSending, setIsSending] = useState(false);

  const scrollRef = useRef();
  const socketRef = useRef();
  const token = localStorage.getItem("token");

  useAutoMarkRead(conversationId ? `/messages/${conversationId}` : null);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }), 50);
  }, []);

  useEffect(() => {
    if (propUser) return setCurrentUser(propUser);
    const userId = getCurrentUserId();
    if (userId) {
      axios.get(`${API_URL}/api/auth/users/${userId}/public`, {
        headers: { Authorization: `Bearer ${token}` }
      }).then(res => setCurrentUser(res.data))
        .catch(err => console.error(err));
    }
  }, [propUser, token]);

  const fetchConversation = useCallback(async () => {
    try {
      const { data } = await axios.get(`${API_URL}/api/conversations/${conversationId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setConversation(data);
    } catch (err) { console.error(err); }
  }, [conversationId, token]);

  const fetchMessages = useCallback(async () => {
    try {
      const { data } = await axios.get(`${API_URL}/api/conversations/${conversationId}/messages`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessages(Array.isArray(data) ? data : data.messages || []);
      scrollToBottom();
    } catch (err) { console.error(err); }
  }, [conversationId, scrollToBottom, token]);

  useEffect(() => {
    if (currentUser) { fetchConversation(); fetchMessages(); }
  }, [currentUser, fetchConversation, fetchMessages]);

  // Track seen message IDs to prevent duplicates from socket reconnection
  const seenMessageIds = useRef(new Set());
  
  useEffect(() => {
    if (!currentUser?._id || !conversationId || !token) return;

    connectSocket(token);
    socketRef.current = sharedSocket;
    sharedSocket.emit("join", currentUser._id);
    
    // Clear seen messages when conversation changes
    seenMessageIds.current.clear();

    const handleNewMessage = (msg) => {
      // Skip if not for this conversation or if it's our own message
      if (msg.conversationId !== conversationId) return;
      if (String(msg.sender?._id || msg.sender) === String(currentUser._id)) return;
      
      // Skip if we've already seen this message ID (prevents duplicates from reconnection)
      if (seenMessageIds.current.has(msg._id)) {
        console.log("Duplicate message detected, skipping:", msg._id);
        return;
      }
      seenMessageIds.current.add(msg._id);
      
      setMessages(prev => {
        // Double-check in state as well
        const exists = prev.some(m => m._id === msg._id);
        if (exists) return prev;
        return [...prev, msg];
      });
      scrollToBottom();
      
      if (String(msg.receiver) === String(currentUser._id)) {
        axios.patch(`${API_URL}/api/messages/${msg._id}/read`, {}, { headers: { Authorization: `Bearer ${token}` } })
             .catch(console.error);
      }
    };

    const handleTyping = ({ conversationId: cId, userId }) => {
      if (cId === conversationId && userId !== currentUser._id) setTyping(true);
    };
    const handleStopTyping = ({ conversationId: cId, userId }) => {
      if (cId === conversationId && userId !== currentUser._id) setTyping(false);
    };
    const handleMessagesSeen = ({ conversationId: cId, seenAt }) => {
      if (cId === conversationId) {
        setMessages(prev => prev.map(msg => {
          const senderId = msg.sender?._id || msg.sender;
          return (String(senderId) === String(currentUser._id) && msg.status !== 'seen') 
            ? { ...msg, status: 'seen', read: true, readAt: seenAt } : msg;
        }));
      }
    };
    const handleMessageEdited = (editedMsg) => {
      if (editedMsg.conversationId === conversationId) {
        setMessages(prev => prev.map(msg => msg._id === editedMsg._id ? { ...msg, text: editedMsg.text, isEdited: true } : msg));
      }
    };

    // Use safe listener registration with unique keys to prevent duplicates
    const cleanupNew = safeOn("message:new", handleNewMessage, `message:new-${conversationId}`);
    const cleanupTyping = safeOn("typing", handleTyping, `typing-${conversationId}`);
    const cleanupStopTyping = safeOn("stopTyping", handleStopTyping, `stopTyping-${conversationId}`);
    const cleanupSeen = safeOn("messagesSeen", handleMessagesSeen, `messagesSeen-${conversationId}`);
    const cleanupEdited = safeOn("message:edited", handleMessageEdited, `message:edited-${conversationId}`);

    axios.patch(`${API_URL}/api/conversations/${conversationId}/read`, {}, { headers: { Authorization: `Bearer ${token}` } }).catch(console.error);

    return () => {
      sharedSocket.emit("leave", currentUser._id);
      cleanupNew();
      cleanupTyping();
      cleanupStopTyping();
      cleanupSeen();
      cleanupEdited();
    };
  }, [conversationId, currentUser?._id, scrollToBottom, token]);

  const sendMessage = async () => {
    if ((!messageText && attachments.length === 0) || isSending) return;
    const otherUser = conversation?.participants?.find(p => String(p._id) !== String(currentUser._id));
    setIsSending(true);
    const sentText = messageText;
    const sentAttachments = [...attachments];
    
    const tempId = `temp-${Date.now()}`;
    const optimisticMessage = {
      _id: tempId,
      text: sentText,
      sender: { _id: currentUser._id },
      receiver: otherUser?._id,
      conversationId,
      createdAt: new Date().toISOString(),
      status: 'sending',
      attachments: sentAttachments.map(f => ({ fileName: f.name, type: f.type.startsWith('image/') ? 'image' : 'file' }))
    };
    
    setMessages(prev => [...prev, optimisticMessage]);
    setMessageText(""); 
    setAttachments([]);
    scrollToBottom();
    
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
    } catch (err) { 
      console.error(err);
      setMessages(prev => prev.filter(m => m._id !== tempId));
      setMessageText(sentText);
      setAttachments(sentAttachments);
    }
    finally { setIsSending(false); }
  };

  const handleAttach = (e) => {
    const files = Array.from(e.target.files);
    const allowedTypes = [
      'image/jpeg','image/png','image/gif','image/webp',
      'application/pdf','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','text/plain',
    ];
    const validFiles = files.filter(file => allowedTypes.includes(file.type));
    if (validFiles.length < files.length) alert("Some files were not added. Only supported types: " + SUPPORTED_FILES);
    setAttachments(prev => [...prev, ...validFiles]);
    e.target.value = null;
  };

  if (!currentUser) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-screen bg-[var(--color-bg)]">
        <div className="w-10 h-10 border-4 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
        <p className="mt-4 text-[var(--color-text-muted)]">Loading chat...</p>
      </div>
    );
  }

  const otherUser = conversation?.participants?.find(p => String(p._id) !== String(currentUser._id));
  const chatTitle = otherUser ? otherUser.firstName || otherUser.name || "Conversation" : "Conversation";
  const chatProfile = otherUser?.profileImage || "/default.jpg";

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col h-full min-h-screen bg-[var(--color-bg)]"
    >
      <div className="flex items-center gap-3 p-4 border-b border-[var(--color-border)] sticky top-0 bg-[var(--color-surface)] z-10 shadow-sm">
        <button 
          onClick={() => navigate(-1)} 
          className="p-2 rounded-full hover:bg-[var(--color-bg)] text-[var(--color-text)] transition-colors"
        >
          <ChevronLeft className="w-6 h-6"/>
        </button>
        <img 
          src={chatProfile} 
          alt="Profile" 
          className="w-11 h-11 rounded-full object-cover ring-2 ring-[var(--color-border)]"
        />
        <div className="flex flex-col flex-1">
          <h2 className="font-semibold text-lg text-[var(--color-text)]">{chatTitle}</h2>
          <AnimatePresence>
            {typing && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="flex items-center gap-1"
              >
                <span className="text-xs text-[var(--color-text-muted)]">typing</span>
                <div className="flex gap-0.5">
                  <span className="w-1.5 h-1.5 bg-[var(--color-primary)] rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-1.5 h-1.5 bg-[var(--color-primary)] rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-1.5 h-1.5 bg-[var(--color-primary)] rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        <AnimatePresence>
          {messages.map((msg, index) => {
            const senderId = msg.sender?._id || msg.sender;
            const isMe = String(senderId) === String(currentUser._id);
            const isLastMessage = index === messages.length - 1;
            const isSeen = isMe && (msg.status === 'seen' || msg.read);
            
            return (
              <motion.div 
                key={msg._id || index}
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                ref={isLastMessage ? scrollRef : null}
                className={`flex ${isMe ? "justify-end" : "justify-start"}`}
              >
                <div 
                  className={`max-w-[75%] p-3.5 rounded-2xl shadow-sm ${
                    isMe 
                      ? "bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-light)] text-white rounded-br-md" 
                      : "bg-[var(--color-surface)] text-[var(--color-text)] border border-[var(--color-border)] rounded-bl-md"
                  }`}
                >
                  {msg.text && <p className="text-sm break-words leading-relaxed">{msg.text}</p>}
                  
                  {msg.attachments?.map((att, idx) => (
                    <div key={idx} className="mt-2">
                      {att.type === "image" ? (
                        <motion.img 
                          whileHover={{ scale: 1.02 }}
                          src={`${API_URL}${att.url}`} 
                          alt={att.fileName} 
                          className="max-w-[200px] rounded-lg cursor-pointer shadow-sm"
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
                  
                  <div className={`flex items-center justify-end gap-1.5 text-xs mt-2 ${isMe ? "text-white/70" : "text-[var(--color-text-muted)]"}`}>
                    <span>{dayjs(msg.createdAt).format("HH:mm")}</span>
                    {isMe && (
                      <CheckCheck className={`w-4 h-4 ${isSeen ? "text-blue-300" : isMe ? "text-white/50" : "text-[var(--color-text-muted)]"}`} />
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
        <div ref={scrollRef} style={{ height: '1px' }} />
      </div>

      <AnimatePresence>
        {previewImage && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setPreviewImage(null)}
          >
            <button 
              className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
              onClick={() => setPreviewImage(null)}
            >
              <X size={24}/>
            </button>
            <motion.img 
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              src={previewImage} 
              alt="Preview" 
              className="max-h-[90vh] max-w-[90vw] object-contain rounded-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {attachments.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="px-4 py-2 bg-[var(--color-surface)] border-t border-[var(--color-border)] flex flex-wrap gap-2"
          >
            {attachments.map((file, index) => (
              <motion.div 
                key={index}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex items-center gap-2 px-3 py-1.5 bg-[var(--color-bg)] rounded-lg border border-[var(--color-border)] text-sm"
              >
                {file.type.startsWith('image/') ? (
                  <ImageIcon className="w-4 h-4 text-[var(--color-primary)]" />
                ) : (
                  <File className="w-4 h-4 text-[var(--color-primary)]" />
                )}
                <span className="text-[var(--color-text)] max-w-[150px] truncate">{file.name}</span>
                <button 
                  className="text-red-500 hover:text-red-600 transition-colors"
                  onClick={() => setAttachments(attachments.filter((_, i) => i !== index))}
                >
                  <X className="w-4 h-4" />
                </button>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center gap-2 p-4 border-t border-[var(--color-border)] bg-[var(--color-surface)]">
        <label className="p-2.5 rounded-full cursor-pointer text-[var(--color-text-muted)] hover:text-[var(--color-primary)] hover:bg-[var(--color-bg)] transition-all relative group">
          <Paperclip className="w-5 h-5"/>
          <span className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-[var(--color-text)] text-[var(--color-bg)] text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            {SUPPORTED_FILES}
          </span>
          <input 
            type="file" 
            multiple 
            className="hidden" 
            onChange={handleAttach}
            accept="image/*, application/pdf, application/msword, application/vnd.openxmlformats-officedocument.wordprocessingml.document, application/vnd.ms-excel, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, text/plain"
          />
        </label>
        
        <input 
          type="text" 
          placeholder="Type a message..."
          className="flex-1 px-4 py-2.5 rounded-full bg-[var(--color-bg)] border border-[var(--color-border)] text-[var(--color-text)] placeholder-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] transition-all"
          value={messageText} 
          onChange={(e) => setMessageText(e.target.value)} 
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
        />
        
        <motion.button 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={sendMessage} 
          disabled={(!messageText && attachments.length === 0) || isSending}
          className="p-3 rounded-full bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-light)] text-white shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {isSending ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Send size={20}/>
          )}
        </motion.button>
      </div>
    </motion.div>
  );
}
