// controllers/feedbackController.js
const mongoose = require("mongoose");
const Feedback = require("../models/Feedback");
const Task = require("../models/Task");
const User = require("../models/User");
const createNotification = require("../utils/createNotification");

// Leave feedback
exports.leaveFeedback = async (req, res) => {
  try {
    const {
      taskId,
      toUser,
      rating,
      strengths,
      improvementAreas,
      testimonial,
      privateNotes,
    } = req.body;

    if (!taskId || !toUser || !rating) {
      return res.status(400).json({ msg: "Task, recipient, and rating are required" });
    }

    // ✅ Ensure feedback is only left after task completion
    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ msg: "Task not found" });
    }
    if (task.status !== "completed") {
      return res.status(400).json({ msg: "Feedback can only be left after task completion" });
    }

    const feedback = new Feedback({
      taskId,
      fromUser: req.user.id,
      toUser,
      rating,
      strengths,
      improvementAreas,
      testimonial,
      privateNotes,
    });

    await feedback.save();
    res.status(201).json(feedback);
  } catch (err) {
    console.error("Leave feedback error:", err);
    res.status(500).json({ msg: "Server error" });
  }
};

// Get feedback for a user (e.g., show on profile)
exports.getFeedbackForUser = async (req, res) => {
  try {
    const feedback = await Feedback.find({ toUser: req.params.userId })
      .populate("fromUser", "name role profileImage")
      .populate("taskId", "title status");

    res.json(feedback);
  } catch (err) {
    console.error("Get feedback error:", err);
    res.status(500).json({ msg: "Server error" });
  }
};

// Get feedback left BY a user (optional, useful for TO/SP dashboards)
exports.getFeedbackByUser = async (req, res) => {
  try {
    const feedback = await Feedback.find({ fromUser: req.params.userId })
      .populate("toUser", "name role profileImage")
      .populate("taskId", "title status");

    res.json(feedback);
  } catch (err) {
    console.error("Get feedback by user error:", err);
    res.status(500).json({ msg: "Server error" });
  }
};

// Report feedback
exports.reportFeedback = async (req, res) => {
  try {
    const { reason, details } = req.body;
    
    if (!reason) {
      return res.status(400).json({ msg: "Report reason is required" });
    }
    
    const feedback = await Feedback.findById(req.params.id).populate("taskId", "title");
    if (!feedback) return res.status(404).json({ msg: "Feedback not found" });
    
    // Check if user already reported
    const alreadyReported = feedback.reports.some(
      r => r.reportedBy.toString() === req.user.id
    );
    if (alreadyReported) {
      return res.status(400).json({ msg: "You have already reported this feedback" });
    }
    
    feedback.reports.push({
      reportedBy: req.user.id,
      reason,
      details: details || ""
    });
    feedback.isReported = true;
    await feedback.save();
    
    // Notify admins
    const admins = await User.find({ role: "admin" });
    for (const admin of admins) {
      await createNotification(
        admin._id,
        "system",
        `Feedback on task "${feedback.taskId?.title || 'Unknown'}" has been reported for: ${reason}`,
        `/dashboard/admin`,
        { title: "Feedback Reported", sendEmail: true }
      );
    }
    
    res.json({ msg: "Feedback reported successfully" });
  } catch (err) {
    console.error("Report feedback error:", err);
    res.status(500).json({ msg: "Server error" });
  }
};

// Admin: Get all reported feedback
exports.getReportedFeedback = async (req, res) => {
  try {
    const feedback = await Feedback.find({ isReported: true })
      .populate("fromUser", "firstName lastName email")
      .populate("toUser", "firstName lastName email")
      .populate("taskId", "title")
      .populate("reports.reportedBy", "firstName lastName email")
      .sort({ createdAt: -1 });
    
    res.json(feedback);
  } catch (err) {
    console.error("Get reported feedback error:", err);
    res.status(500).json({ msg: "Server error" });
  }
};

// Admin: Review feedback report
exports.reviewFeedbackReport = async (req, res) => {
  try {
    // Verify admin role
    const reviewer = await User.findById(req.user.id);
    if (!reviewer || reviewer.role !== "admin") {
      return res.status(403).json({ msg: "Only admins can review reports" });
    }
    
    const { reportId, status, reviewNotes } = req.body;
    
    if (!reportId || !status) {
      return res.status(400).json({ msg: "Report ID and status are required" });
    }
    
    const feedback = await Feedback.findById(req.params.id);
    if (!feedback) return res.status(404).json({ msg: "Feedback not found" });
    
    const report = feedback.reports.id(reportId);
    if (!report) return res.status(404).json({ msg: "Report not found" });
    
    report.status = status;
    report.reviewedBy = req.user.id;
    report.reviewNotes = reviewNotes || "";
    report.reviewedAt = new Date();
    
    // Update isReported flag if all reports are resolved
    const pendingReports = feedback.reports.filter(r => r.status === "pending");
    if (pendingReports.length === 0) {
      feedback.isReported = false;
    }
    
    await feedback.save();
    
    res.json({ msg: "Report reviewed successfully", feedback });
  } catch (err) {
    console.error("Review feedback report error:", err);
    res.status(500).json({ msg: "Server error" });
  }
};

// Admin: Delete feedback
exports.deleteFeedback = async (req, res) => {
  try {
    const feedback = await Feedback.findByIdAndDelete(req.params.id);
    if (!feedback) return res.status(404).json({ msg: "Feedback not found" });
    
    res.json({ msg: "Feedback deleted successfully" });
  } catch (err) {
    console.error("Delete feedback error:", err);
    res.status(500).json({ msg: "Server error" });
  }
};

// Admin: Get all feedback
exports.getAllFeedback = async (req, res) => {
  try {
    const feedback = await Feedback.find()
      .populate("fromUser", "firstName lastName email profileImage")
      .populate("toUser", "firstName lastName email profileImage")
      .populate("taskId", "title status")
      .sort({ createdAt: -1 });
    
    res.json(feedback);
  } catch (err) {
    console.error("Get all feedback error:", err);
    res.status(500).json({ msg: "Server error" });
  }
};
