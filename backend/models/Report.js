const mongoose = require("mongoose");

const reportSchema = new mongoose.Schema(
  {
    reporter: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    itemType: { 
      type: String, 
      enum: ["task", "proposal", "feedback", "user"], 
      required: true 
    },
    itemId: { type: mongoose.Schema.Types.ObjectId, required: true },
    reason: { type: String, required: true },
    details: { type: String },
    status: { 
      type: String, 
      enum: ["pending", "reviewed", "resolved", "dismissed"], 
      default: "pending" 
    },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    reviewNotes: { type: String },
    actionTaken: { type: String },
    reviewedAt: { type: Date },
  },
  { timestamps: true }
);

reportSchema.index({ itemType: 1, status: 1 });
reportSchema.index({ reporter: 1 });

module.exports = mongoose.model("Report", reportSchema);
