// models/Notification.js
const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    type: { 
      type: String, 
      enum: ["application", "proposal", "message", "system", "task", "admin"], 
      required: true 
    },
    message: { type: String, required: true },
    title: { type: String },
    link: { type: String },
    read: { type: Boolean, default: false },
    deleted: { type: Boolean, default: false },
    emailSent: { type: Boolean, default: false },
  },
  { timestamps: true }
);

notificationSchema.index({ user: 1, deleted: 1, createdAt: -1 });

module.exports = mongoose.model("Notification", notificationSchema);
