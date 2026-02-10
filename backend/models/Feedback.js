// models/Feedback.js
const mongoose = require("mongoose");

const reportSchema = new mongoose.Schema({
  reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  reason: { type: String, required: true },
  details: { type: String },
  status: { type: String, enum: ["pending", "reviewed", "resolved", "dismissed"], default: "pending" },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  reviewNotes: { type: String },
  createdAt: { type: Date, default: Date.now },
  reviewedAt: { type: Date }
});

const feedbackSchema = new mongoose.Schema(
  {
    taskId: { type: mongoose.Schema.Types.ObjectId, ref: "Task", required: true },
    fromUser: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    toUser: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    rating: { type: Number, min: 1, max: 5, required: true },
    strengths: { type: String },
    improvementAreas: { type: String },
    testimonial: { type: String },
    privateNotes: { type: String },
    
    // Reports
    reports: [reportSchema],
    isReported: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Feedback", feedbackSchema);

