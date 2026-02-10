// models/Message.js
// path: models/Message.js
const mongoose = require("mongoose");

const attachmentSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ["image", "video", "audio", "file"], required: true },
    url: { type: String, required: true },        // served via /uploads/...
    fileName: { type: String },
    fileSize: { type: Number },
    mimeType: { type: String },
    storage: { type: String, enum: ["local"], default: "local" },
  },
  { _id: false }
);

const reactionSchema = new mongoose.Schema(
  {
    emoji: { type: String, required: true },
    by: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const messageSchema = new mongoose.Schema(
  {
    conversationId: { type: mongoose.Schema.Types.ObjectId, ref: "Conversation", required: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    receiver: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    text: { type: String, trim: true, default: "" },
    attachments: [attachmentSchema],
    status: { type: String, enum: ["sent", "delivered", "seen"], default: "sent" },
    read: { type: Boolean, default: false },
    readAt: { type: Date },
    isEdited: { type: Boolean, default: false },
    editedAt: { type: Date },
    replyTo: { type: mongoose.Schema.Types.ObjectId, ref: "Message" },
    reactions: [reactionSchema],
    deletedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], // soft delete per user
  },
  { timestamps: true }
);

// text index for search
messageSchema.index({ text: "text" });
messageSchema.index({ conversationId: 1, createdAt: -1 });
messageSchema.index({ sender: 1 });
messageSchema.index({ receiver: 1 });

module.exports = mongoose.model("Message", messageSchema);
