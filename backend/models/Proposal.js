// models/Proposal.js
const mongoose = require("mongoose");

const proposalSchema = new mongoose.Schema(
  {
    task: { type: mongoose.Schema.Types.ObjectId, ref: "Task", required: true },
    fromUser: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // SP
    toUser: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // Task Owner
    message: { type: String, required: true },
    attachments: [{ type: String }], // file URLs
    proposedBudget: { type: Number }, // optional
    proposedDuration: { type: String }, // e.g., "4 weeks"
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected", "withdrawn", "not selected"],
      default: "pending",
    },
    readByOwner: { type: Boolean, default: false },
    readByApplicant: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Proposal", proposalSchema);
