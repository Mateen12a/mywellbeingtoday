const mongoose = require("mongoose");

const adminConversationSchema = new mongoose.Schema(
  {
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }],
    lastMessage: {
      content: String,
      sender: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      createdAt: Date
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("AdminConversation", adminConversationSchema);
