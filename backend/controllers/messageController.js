// controllers/messageController.js
// path: controllers/messageController.js

const fs = require("fs");
const path = require("path");
const multer = require("multer");
const Message = require("../models/Message");
const Conversation = require("../models/Conversation");
const User = require("../models/User");
const createNotification = require("../utils/createNotification");
const { sendMail, Templates } = require("../utils/mailer");

// ---------- CONFIG ----------
const MAX_FILES = 5;
const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15MB
const ALLOWED_MIMES = [
  "image/jpeg","image/png","image/gif","image/webp",
  "application/pdf","application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "video/mp4","video/quicktime",
  "audio/mpeg","audio/mp3",
  "text/plain"
];

// ---------- UPLOAD (local disk) ----------
const uploadDir = path.join(__dirname, "..", "uploads", "messages");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, name);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_MIMES.includes(file.mimetype)) return cb(new Error("Unsupported file type"), false);
    cb(null, true);
  }
});

// middleware to attach to route
exports.uploadMiddleware = upload.array("attachments", MAX_FILES);

// ---------- SOCKET (set from index.js) ----------
let io;
exports.setSocket = (socketInstance) => {
  io = socketInstance;
  // Note: All socket event handlers are now registered in index.js with auth checks
  // This function just stores the io reference for emitting events
};

// ---------- SOCKET MESSAGE FUNCTIONS (called from index.js) ----------

/**
 * Create a message via socket (with authorization check)
 */
exports.createMessageSocket = async ({ conversationId, senderId, text, attachments, replyTo }) => {
  // Validate inputs
  if (!conversationId || !senderId) {
    throw new Error("conversationId and senderId are required");
  }
  if (!text && (!attachments || attachments.length === 0)) {
    throw new Error("Message must contain text or attachments");
  }
  
  // Authorization: Verify sender is a participant in this conversation
  const convo = await Conversation.findById(conversationId);
  if (!convo) {
    throw new Error("Conversation not found");
  }
  if (!convo.participants.some(p => p.toString() === senderId)) {
    throw new Error("Not authorized: sender is not a participant in this conversation");
  }
  
  // Find the receiver (other participant)
  const receiver = convo.participants.find(p => p.toString() !== senderId);
  
  // Create the message
  const message = new Message({
    conversationId,
    sender: senderId,
    receiver,
    text: text || "",
    attachments: attachments || [],
    replyTo,
    status: "sent",
    read: false
  });
  
  await message.save();
  
  // Update conversation's lastMessage
  convo.lastMessage = {
    text: text || "[Attachment]",
    createdAt: message.createdAt,
    sender: senderId
  };
  await convo.save();
  
  // Return message with populated sender and participants for inbox updates
  const populatedMessage = await Message.findById(message._id)
    .populate("sender", "firstName lastName profileImage")
    .populate("receiver", "firstName lastName profileImage")
    .lean();
  
  populatedMessage.participants = await User.find({ _id: { $in: convo.participants } })
    .select("_id firstName lastName profileImage")
    .lean();
  
  return populatedMessage;
};

/**
 * Mark a message as seen via socket (with authorization check)
 */
exports.markMessageSeen = async (messageId, userId) => {
  if (!messageId || !userId) {
    throw new Error("messageId and userId are required");
  }
  
  // Find the message
  const message = await Message.findById(messageId);
  if (!message) {
    throw new Error("Message not found");
  }
  
  // Authorization: Only the receiver can mark as seen
  if (message.receiver.toString() !== userId) {
    throw new Error("Not authorized: only the receiver can mark messages as seen");
  }
  
  // Mark as seen
  message.read = true;
  message.readAt = new Date();
  message.status = "seen";
  await message.save();
  
  return message;
};

// ---------- HELPERS ----------
const isImage = (mimetype) => mimetype.startsWith("image/");

const buildAttachmentsFromFiles = (files) => {
  if (!files || files.length === 0) return [];
  return files.map((f) => {
    const relative = path.relative(path.join(__dirname, ".."), f.path).replace(/\\/g, "/");
    return {
      type: isImage(f.mimetype)
        ? "image"
        : f.mimetype.startsWith("video")
        ? "video"
        : f.mimetype.startsWith("audio")
        ? "audio"
        : "file",
      url: `/${relative}`,
      fileName: f.originalname,
      fileSize: f.size,
      mimeType: f.mimetype,
      storage: "local"
    };
  });
};

// ---------- CONTROLLERS (UPDATED) ----------

/**
 * Send a message.
 * POST /api/messages
 */
exports.sendMessage = async (req, res) => {
  try {
    const { conversationId, receiverId, text, replyTo, taskId, proposalId } = req.body;
    const sender = req.user.id;

    if (!conversationId && !receiverId) return res.status(400).json({ msg: "conversationId or receiverId required" });
    const hasFiles = req.files && req.files.length > 0;
    if (!text && !hasFiles) return res.status(400).json({ msg: "Message must contain text or attachments" });

    // ensure conversation exists or create it
    let convoId = conversationId;
    let finalReceiver = receiverId;
    
    if (!convoId) {
      // 1. Find ANY existing conversation between these users (one conversation per user pair)
      let convo = await Conversation.findOne({
        participants: { $all: [sender, receiverId] }
      });

      if (!convo) {
        convo = new Conversation({
          participants: [sender, receiverId],
          isTaskConversation: !!taskId,
          taskId: taskId || undefined,
          proposalId: proposalId || undefined,
          lastMessage: {},
        });
        await convo.save();

        // notify other user of new conversation
        if (io) {
          io.to(receiverId).emit("conversation:new", { conversationId: convo.id, from: sender.toString(), isTaskConversation: !!taskId, taskId, proposalId });
        }
      }
      convoId = convo.id;
    } else {
      // 2. Conversation ID provided, verify sender is a participant and get receiver
      const convo = await Conversation.findById(convoId);
      if (!convo) return res.status(404).json({ msg: "Conversation not found" });
      if (!convo.participants.some((p) => String(p) === String(sender))) return res.status(403).json({ msg: "Not authorized" });
      
      // Determine receiver from conversation participants if not explicitly provided
      finalReceiver = convo.participants.find((p) => String(p) !== String(sender));
    }

    // 3. Construct attachments
    const attachments = buildAttachmentsFromFiles(req.files);

    // 4. Create message
    const message = new Message({
      conversationId: convoId,
      sender,
      receiver: finalReceiver,
      text: text || "",
      attachments,
      replyTo: replyTo || undefined,
      status: "sent",
    });

    await message.save();

    // 5. update conversation lastMessage
    await Conversation.findByIdAndUpdate(convoId, {
      lastMessage: { text: message.text || (attachments[0] && "[attachment]") || "", sender, createdAt: message.createdAt }
    }, { new: true });

    // 6. Realtime emits - ONLY to receiver (sender uses optimistic update)
    // Use volatile emission to prevent buffering during reconnection (prevents duplicate messages)
    if (io) {
      const messageData = {
        ...message.toObject(),
        sender: message.sender.toString(),
        receiver: message.receiver.toString(),
      };
      
      // message to receiver ONLY (sender already has optimistic update)
      // volatile = don't buffer if client is disconnected (prevents duplicate on reconnect)
      io.volatile.to(finalReceiver.toString()).emit("message:new", messageData);

      // conversation update (for inbox) - also volatile to prevent duplicates
      io.volatile.to(finalReceiver.toString()).emit("conversationUpdate", {
        conversationId: convoId.toString(),
        withUser: sender.toString(),
        lastMessage: { text: message.text, createdAt: message.createdAt, attachments: message.attachments }
      });
      io.volatile.to(sender.toString()).emit("conversationUpdate", {
        conversationId: convoId.toString(),
        withUser: finalReceiver.toString(),
        lastMessage: { text: message.text, createdAt: message.createdAt, attachments: message.attachments }
      });
    }

    // 7. create in-app notification
    try {
      const senderName = req.user.firstName && req.user.lastName 
        ? `${req.user.firstName} ${req.user.lastName}` 
        : "Someone"; 
      await createNotification(finalReceiver, "message", `${senderName} sent you a message`, `/messages/${convoId}`);
    } catch (nerr) {
      console.warn("createNotification failed", nerr);
    }
    try {
      const lastEmailKey = `last_email_${finalReceiver}_${sender}`;
      const lastEmailTime = global[lastEmailKey] || 0;
      const now = Date.now();
      
      if (now - lastEmailTime > 15 * 60 * 1000) { // 15 minute cooldown
        const receiverUser = await User.findById(finalReceiver).lean();
        const senderUser = await User.findById(sender).lean();

        if (receiverUser?.email) {
          const html = Templates.newMessageNotification(
            receiverUser,
            senderUser,
            message.text,
            convoId
          );

          await sendMail(
            receiverUser.email,
            `New message from ${senderUser.firstName} ${senderUser.lastName}`,
            html
          );
          global[lastEmailKey] = now;
        }
      }
    } catch (emailErr) {
      console.warn("Email send failed:", emailErr);
    }


    res.status(201).json(message);
  } catch (err) {
    console.error("sendMessage error:", err);
    if (err instanceof multer.MulterError || err.message === "Unsupported file type") {
      // Ensure file cleanup if necessary, but multer handles file deletion on error sometimes
      return res.status(400).json({ msg: err.message });
    }
    res.status(500).json({ msg: "Server error" });
  }
};

/**
 * Get conversation messages by conversationId (paginated).
 * GET /api/conversations/:conversationId/messages?page=1&limit=20
 */
exports.getMessagesByConversation = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const myId = req.user.id;

    const convo = await Conversation.findById(conversationId);
    if (!convo) return res.status(404).json({ msg: "Conversation not found" });
    if (!convo.participants.some((p) => String(p) === String(myId))) return res.status(403).json({ msg: "Not authorized" });

    const messages = await Message.find({ conversationId, deletedBy: { $ne: myId } })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .lean();

    // mark incoming messages as read (only those addressed to me)
    const update = await Message.updateMany(
      { conversationId, receiver: myId, read: false },
      { $set: { read: true, readAt: new Date(), status: "seen" } }
    );

    if (update.modifiedCount > 0 && io) {
      // notify other participants (only the other user in one-to-one)
      const other = convo.participants.find((p) => String(p) !== String(myId));
      if (other) {
        io.to(other.toString()).emit("messagesSeen", { conversationId: conversationId.toString(), seenBy: myId.toString(), seenAt: new Date() });
      }
    }

    res.json(messages.reverse()); // return ascending order (oldest first)
  } catch (err) {
    console.error("getMessagesByConversation error:", err);
    res.status(500).json({ msg: "Server error" });
  }
};

/**
 * Edit message (only sender can edit)
 * PATCH /api/messages/:messageId
 */
exports.editMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { text, attachmentsToRemove } = req.body;

    const msg = await Message.findById(messageId);
    if (!msg) return res.status(404).json({ msg: "Message not found" });
    if (String(msg.sender) !== String(req.user.id)) return res.status(403).json({ msg: "Not authorized to edit" });

    // remove attachments if provided (local files left on disk for now; implement cleanup later)
    if (Array.isArray(attachmentsToRemove) && attachmentsToRemove.length > 0) {
      msg.attachments = msg.attachments.filter((a) => !attachmentsToRemove.includes(a.url));
    }

    if (typeof text === "string") {
      msg.text = text;
      msg.isEdited = true;
      msg.editedAt = new Date();
    }

    // If new attachments uploaded, add them (req.files)
    if (req.files && req.files.length > 0) {
      const newAttachments = buildAttachmentsFromFiles(req.files);
      msg.attachments = msg.attachments.concat(newAttachments);
    }

    await msg.save();

    // emit edited message
    if (io) {
      io.to(msg.receiver.toString()).emit("message:edited", msg);
      io.to(msg.sender.toString()).emit("message:edited", msg);
    }

    res.json(msg);
  } catch (err) {
    console.error("editMessage error:", err);
    res.status(500).json({ msg: "Server error" });
  }
};

/**
 * Delete message for user (soft delete). If both users delete, you may choose to permanently remove later.
 * DELETE /api/messages/:messageId
 */
exports.deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const myId = req.user.id;

    const msg = await Message.findById(messageId);
    if (!msg) return res.status(404).json({ msg: "Message not found" });

    if (!msg.deletedBy.map(String).includes(String(myId))) {
      msg.deletedBy.push(myId);
      await msg.save();
    }

    // Emit deletion to both participants for UI update
    if (io) {
      io.to(msg.receiver.toString()).emit("message:deleted", { messageId, by: myId.toString() });
      io.to(msg.sender.toString()).emit("message:deleted", { messageId, by: myId.toString() });
    }

    res.json({ msg: "Message hidden for user" });
  } catch (err) {
    console.error("deleteMessage error:", err);
    res.status(500).json({ msg: "Server error" });
  }
};

/**
 * Mark single message as read (manual)
 * PATCH /api/messages/:messageId/read
 */
exports.markAsRead = async (req, res) => {
  try {
    const { messageId } = req.params;
    const myId = req.user.id;

    const msg = await Message.findOneAndUpdate(
      { id: messageId, receiver: myId },
      { $set: { read: true, readAt: new Date(), status: "seen" } },
      { new: true }
    );

    if (!msg) return res.status(404).json({ msg: "Message not found or unauthorized" });

    if (io) {
      io.to(msg.sender.toString()).emit("message:seen", { messageId: msg.id.toString(), seenBy: myId.toString(), readAt: msg.readAt });
      // conversation update too
      io.to(msg.sender.toString()).emit("conversationUpdate", { conversationId: msg.conversationId.toString(), lastMessage: { text: msg.text, createdAt: msg.createdAt, read: true, readAt: msg.readAt } });
    }

    res.json(msg);
  } catch (err) {
    console.error("markAsRead error:", err);
    res.status(500).json({ msg: "Server error" });
  }
};

/**
 * Mark entire conversation as read
 * PATCH /api/conversations/:conversationId/read
 */
exports.markConversationRead = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const myId = req.user.id;

    const convo = await Conversation.findById(conversationId);
    if (!convo) return res.status(404).json({ msg: "Conversation not found" });
    if (!convo.participants.some((p) => String(p) === String(myId))) return res.status(403).json({ msg: "Not authorized" });

    const updated = await Message.updateMany({ conversationId, receiver: myId, read: false }, { $set: { read: true, readAt: new Date(), status: "seen" } });

    // notify other participant
    const other = convo.participants.find((p) => String(p) !== String(myId));
    if (other && io) {
      io.to(other.toString()).emit("messagesSeen", { conversationId: conversationId.toString(), seenBy: myId.toString(), seenAt: new Date() });
    }

    res.json({ modifiedCount: updated.modifiedCount });
  } catch (err) {
    console.error("markConversationRead error:", err);
    res.status(500).json({ msg: "Server error" });
  }
};

/**
 * Inbox (conversations list) with pagination and unread count:
 * GET /api/messages/inbox?page=1&limit=20
 */
// controllers/messageController.js (Focus on getInbox)

/**
 * Inbox (conversations list) with pagination and unread count:
 * GET /api/messages/inbox?page=1&limit=20
 */
exports.getInbox = async (req, res) => {
    try {
        const userId = req.user.id;
        const { page = 1, limit = 20 } = req.query;

        const convos = await Conversation.find({ participants: userId })
            .sort({ "lastMessage.createdAt": -1, updatedAt: -1 })
            .skip((page - 1) * limit)
            .limit(Number(limit))
            // 🔑 IMPORTANT: Mongoose Populated fields use `_id` and the fields you requested: firstName, lastName
            .populate("participants", "firstName lastName profileImage") 
            .lean();

        // compute unread counts per conversation
        const results = await Promise.all(convos.map(async (c) => {
            // Find the other participant using their _id from the populated object
            const other = c.participants.find((p) => String(p._id) !== String(userId));
            
            // Unread count check: use c._id for the conversation ID
            const unreadCount = await Message.countDocuments({ conversationId: c._id, receiver: userId, read: false });

            return {
                // Use c._id or c.id consistently. Sticking with c._id to be safe after .lean()
                conversationId: c._id.toString(), 
                otherUser: other 
                    ? { 
                        // Use the correct populated field accessors
                        _id: other._id.toString(), 
                        name: `${other.firstName} ${other.lastName}`.trim(), // 🔑 FIX: Combine firstName and lastName
                        profileImage: other.profileImage 
                    } 
                    : null,
                isTaskConversation: c.isTaskConversation,
                taskId: c.taskId,
                proposalId: c.proposalId,
                lastMessage: c.lastMessage,
                unreadCount,
                updatedAt: c.updatedAt
            };
        }));

        res.json(results);
    } catch (err) {
        console.error("getInbox error:", err);
        res.status(500).json({ msg: "Server error" });
    }
};

/**
 * Reactions: POST /api/messages/:messageId/reactions
 */
exports.addReaction = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { emoji } = req.body;
    const userId = req.user.id;

    if (!emoji) return res.status(400).json({ msg: "emoji required" });

    const msg = await Message.findById(messageId);
    if (!msg) return res.status(404).json({ msg: "Message not found" });

    // prevent duplicate reaction by same user+emoji
    const exists = msg.reactions.some((r) => r.emoji === emoji && String(r.by) === String(userId));
    if (exists) {
      // remove (toggle)
      msg.reactions = msg.reactions.filter((r) => !(r.emoji === emoji && String(r.by) === String(userId)));
    } else {
      msg.reactions.push({ emoji, by: userId });
    }

    await msg.save();

    // notify participants
    if (io) {
      io.to(msg.receiver.toString()).emit("message:reaction", { messageId, reactions: msg.reactions });
      io.to(msg.sender.toString()).emit("message:reaction", { messageId, reactions: msg.reactions });
    }

    res.json({ messageId, reactions: msg.reactions });
  } catch (err) {
    console.error("addReaction error:", err);
    res.status(500).json({ msg: "Server error" });
  }
};

/**
 * Search messages (your own messages)
 * GET /api/messages/search?q=term&page=1&limit=20
 */
exports.searchMessages = async (req, res) => {
  try {
    const userId = req.user.id;
    const { q, page = 1, limit = 20 } = req.query;
    if (!q) return res.status(400).json({ msg: "query (q) required" });

    // text search within messages where user is participant (sender or receiver)
    const filter = {
      $text: { $search: q },
      $or: [{ sender: userId }, { receiver: userId }],
      deletedBy: { $ne: userId }
    };

    const messages = await Message.find(filter, { score: { $meta: "textScore" } })
      .sort({ score: { $meta: "textScore" }, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .lean();

    res.json(messages);
  } catch (err) {
    console.error("searchMessages error:", err);
    res.status(500).json({ msg: "Server error" });
  }
};


/**
 * EXTRA: Get unread count for all conversations (Needed by InboxPage.jsx)
 * GET /api/messages/unread/count
 */
exports.getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.id;
    // Count documents where the current user is the receiver and the message is not read
    const count = await Message.countDocuments({ receiver: userId, read: false });
    res.json({ unreadCount: count });
  } catch (err) {
    console.error("getUnreadCount error:", err);
    res.status(500).json({ msg: "Server error" });
  }
};