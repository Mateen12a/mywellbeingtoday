const Report = require("../models/Report");
const User = require("../models/User");
const Task = require("../models/Task");
const Proposal = require("../models/Proposal");
const Feedback = require("../models/Feedback");
const { sendMail, Templates } = require("../utils/mailer");
const createNotification = require("../utils/createNotification");

exports.createReport = async (req, res) => {
  try {
    const { itemType, itemId, reason, details } = req.body;
    const reporterId = req.user.id;

    if (!itemType || !itemId || !reason) {
      return res.status(400).json({ msg: "itemType, itemId, and reason are required" });
    }

    const validTypes = ["task", "proposal", "feedback", "user"];
    if (!validTypes.includes(itemType)) {
      return res.status(400).json({ msg: "Invalid item type" });
    }

    const existingReport = await Report.findOne({
      reporter: reporterId,
      itemType,
      itemId,
      status: "pending"
    });

    if (existingReport) {
      return res.status(400).json({ msg: "You have already reported this item" });
    }

    const report = new Report({
      reporter: reporterId,
      itemType,
      itemId,
      reason,
      details,
    });

    await report.save();

    const reporter = await User.findById(reporterId).select("firstName lastName email");
    const admins = await User.find({ role: "admin", isActive: true }).select("email _id firstName lastName");

    for (const admin of admins) {
      await sendMail(
        admin.email,
        `New ${itemType} Report`,
        Templates.reportSubmitted(admin, reporter, { _id: itemId }, reason, itemType)
      );

      await createNotification(
        admin._id,
        "admin",
        `${reporter.firstName} ${reporter.lastName} reported a ${itemType}. Reason: ${reason}`,
        `/dashboard/admin`,
        { title: `New ${itemType} Report`, sendEmail: false }
      );
    }

    res.status(201).json({ msg: "Report submitted successfully", report });
  } catch (err) {
    console.error("createReport error:", err);
    res.status(500).json({ msg: "Server error" });
  }
};

exports.getReports = async (req, res) => {
  try {
    const { status, itemType, page = 1, limit = 50 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const query = {};
    if (status && status !== "all") query.status = status;
    if (itemType && itemType !== "all") query.itemType = itemType;

    const [reports, total] = await Promise.all([
      Report.find(query)
        .populate("reporter", "firstName lastName email profileImage")
        .populate("reviewedBy", "firstName lastName email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Report.countDocuments(query)
    ]);

    const statusCounts = await Report.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } }
    ]);

    const typeCounts = await Report.aggregate([
      { $group: { _id: "$itemType", count: { $sum: 1 } } }
    ]);

    const counts = {
      pending: 0,
      reviewed: 0,
      resolved: 0,
      dismissed: 0,
      total: 0
    };

    statusCounts.forEach(s => {
      counts[s._id] = s.count;
      counts.total += s.count;
    });

    const typeBreakdown = {};
    typeCounts.forEach(t => {
      typeBreakdown[t._id] = t.count;
    });

    res.json({
      reports,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
      counts,
      typeBreakdown
    });
  } catch (err) {
    console.error("getReports error:", err);
    res.status(500).json({ msg: "Server error" });
  }
};

exports.reviewReport = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reviewNotes, actionTaken, respondToReporter } = req.body;
    const adminId = req.user.id;

    const report = await Report.findById(id).populate("reporter", "firstName lastName email");
    if (!report) return res.status(404).json({ msg: "Report not found" });

    const validStatuses = ["reviewed", "resolved", "dismissed"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ msg: "Invalid status" });
    }

    report.status = status;
    report.reviewedBy = adminId;
    report.reviewNotes = reviewNotes || "";
    report.actionTaken = actionTaken || "";
    report.reviewedAt = new Date();

    await report.save();

    if (respondToReporter && report.reporter) {
      await sendMail(
        report.reporter.email,
        `Update on Your Report`,
        Templates.reportActionTaken(report.reporter, status, report.itemType, reviewNotes)
      );

      await createNotification(
        report.reporter._id,
        "system",
        `Your report has been ${status}. ${reviewNotes ? `Admin response: ${reviewNotes}` : ''}`,
        null,
        { title: "Report Update", sendEmail: false }
      );
    }

    res.json({ msg: "Report reviewed successfully", report });
  } catch (err) {
    console.error("reviewReport error:", err);
    res.status(500).json({ msg: "Server error" });
  }
};

exports.warnUser = async (req, res) => {
  try {
    const { userId, reason } = req.body;
    const adminId = req.user.id;

    if (!userId || !reason) {
      return res.status(400).json({ msg: "userId and reason are required" });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ msg: "User not found" });

    const admin = await User.findById(adminId).select("firstName lastName");

    if (!user.warnings) user.warnings = [];
    user.warnings.push({
      reason,
      issuedBy: adminId,
      issuedAt: new Date()
    });
    await user.save();

    await sendMail(
      user.email,
      "Account Warning",
      Templates.userWarning(user, reason, `${admin.firstName} ${admin.lastName}`)
    );

    await createNotification(
      user._id,
      "system",
      `You have received a warning from an administrator. Reason: ${reason}`,
      null,
      { title: "Account Warning", sendEmail: false }
    );

    res.json({ msg: "User warned successfully" });
  } catch (err) {
    console.error("warnUser error:", err);
    res.status(500).json({ msg: "Server error" });
  }
};

exports.deleteReport = async (req, res) => {
  try {
    const { id } = req.params;
    const report = await Report.findByIdAndDelete(id);
    if (!report) return res.status(404).json({ msg: "Report not found" });
    res.json({ msg: "Report deleted" });
  } catch (err) {
    console.error("deleteReport error:", err);
    res.status(500).json({ msg: "Server error" });
  }
};
