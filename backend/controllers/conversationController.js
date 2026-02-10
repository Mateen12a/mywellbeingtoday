// controllers/conversationController.js
const Conversation = require("../models/Conversation");
const User = require("../models/User");

/**
 * POST /api/conversations/start
 * Create or return existing one-to-one conversation between two users.
 * Body: { toUserId, taskId?, proposalId? }
 * 
 * IMPORTANT: One conversation per user pair - taskId/proposalId are just context, 
 * not filters for separate conversations.
 */
exports.startConversation = async (req, res) => {
  try {
    const fromUserId = req.user.id; // logged-in user
    const { toUserId, taskId = null, proposalId = null } = req.body;

    if (!toUserId) {
      return res.status(400).json({ msg: "Recipient user ID is required" });
    }

    if (toUserId === fromUserId) {
      return res.status(400).json({ msg: "Cannot start conversation with yourself" });
    }

    // Check if recipient exists
    const recipient = await User.findById(toUserId, "firstName lastName");
    if (!recipient) {
      return res.status(404).json({ msg: "Recipient user not found" });
    }

    // Check if ANY conversation already exists between these two users (ignore taskId/proposalId)
    const existingConversation = await Conversation.findOne({
      participants: { $all: [fromUserId, toUserId] }
    });

    if (existingConversation) {
      // Check if this conversation was from a different context
      // - If new request has taskId but existing has no taskId (was started from profile)
      // - If new request has taskId and existing has different taskId
      const isDifferentContext = taskId && (
        !existingConversation.taskId || 
        existingConversation.taskId.toString() !== taskId
      );
      
      return res.status(200).json({ 
        _id: existingConversation._id, 
        msg: "Conversation already exists",
        existingConversation: true,
        isDifferentContext,
        recipientName: `${recipient.firstName} ${recipient.lastName}`
      });
    }

    // Create new conversation
    const newConversation = new Conversation({
      participants: [fromUserId, toUserId],
      isTaskConversation: !!taskId,
      taskId: taskId || undefined,
      proposalId: proposalId || undefined,
    });

    await newConversation.save();

    res.status(201).json({ 
      _id: newConversation._id, 
      msg: "Conversation started",
      existingConversation: false
    });
  } catch (err) {
    console.error("StartConversation error:", err);
    res.status(500).json({ msg: "Server error starting conversation" });
  }
};

// GET /api/conversations
exports.getConversations = async (req, res) => {
  try {
    const userId = req.user.id;
    const conversations = await Conversation.find({
      participants: userId,
    })
      .populate("participants", "firstName lastName profileImage")
      .sort({ updatedAt: -1 });

    res.json(conversations);
  } catch (err) {
    console.error("GetConversations error:", err);
    res.status(500).json({ msg: "Server error fetching conversations" });
  }
};

// GET /api/conversations/:conversationId
exports.getConversationById = async (req, res) => {
  try {
    const convo = await Conversation.findById(req.params.conversationId)
      .populate("participants", "firstName lastName profileImage")
      .lean();
    if (!convo) return res.status(404).json({ msg: "Conversation not found" });

    const isParticipant = convo.participants.some(
      (p) => String(p._id) === String(req.user.id)
    );

    if (!isParticipant) return res.status(403).json({ msg: "Not authorized" });

    res.json(convo);
  } catch (err) {
    console.error("getConversationById error:", err);
    res.status(500).json({ msg: "Server error" });
  }
};
