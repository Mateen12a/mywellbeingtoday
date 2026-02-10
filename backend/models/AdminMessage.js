const mongoose = require("mongoose");

const adminMessageSchema = new mongoose.Schema(
  {
    conversationId: { type: mongoose.Schema.Types.ObjectId, ref: "AdminConversation", required: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    content: { type: String },
    attachments: [{ 
      filename: String,
      originalName: String,
      mimetype: String,
      size: Number,
      path: String
    }],
    read: { type: Boolean, default: false }
  },
  { timestamps: true }
);

module.exports = mongoose.model("AdminMessage", adminMessageSchema);
