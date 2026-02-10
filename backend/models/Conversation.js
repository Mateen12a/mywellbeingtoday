// models/Conversation.js
// path: models/Conversation.js
const mongoose = require("mongoose");

const conversationSchema = new mongoose.Schema(
  {
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }],
    isTaskConversation: { type: Boolean, default: false },
    taskId: { type: mongoose.Schema.Types.ObjectId, ref: "Task" },         // optional
    proposalId: { type: mongoose.Schema.Types.ObjectId, ref: "Proposal" }, // optional
    lastMessage: {
      text: { type: String },
      sender: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      createdAt: { type: Date },
    },
    // you can add conversation-level metadata here (archived, pinned, muted, etc)
    pinnedFor: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    mutedFor: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true }
);

// ensure unique conversation for 2-user one-to-one
conversationSchema.index({ participants: 1 }, { unique: false });
conversationSchema.index({ updatedAt: -1 });

module.exports = mongoose.model("Conversation", conversationSchema);
