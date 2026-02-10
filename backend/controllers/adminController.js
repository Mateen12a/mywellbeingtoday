// controllers/adminController.js
const User = require("../models/User");
const Task = require("../models/Task");
const Feedback = require("../models/Feedback")
const { sendMail, Templates } = require("../utils/mailer");
const createNotification = require("../utils/createNotification");

function buildAdminContext(reqUser, dbAdmin) {
  if (dbAdmin && dbAdmin.firstName) {
    return {
      _id: dbAdmin._id,
      firstName: dbAdmin.firstName,
      lastName: dbAdmin.lastName || '',
      email: dbAdmin.email,
      adminType: dbAdmin.adminType || 'admin',
      name: `${dbAdmin.firstName} ${dbAdmin.lastName || ''}`.trim(),
      role: dbAdmin.role || 'admin'
    };
  }
  const firstName = reqUser.firstName || 'System';
  const lastName = reqUser.lastName || 'Administrator';
  const adminType = reqUser.adminType || 'admin';
  return {
    _id: reqUser.id,
    firstName: firstName,
    lastName: lastName,
    email: reqUser.email || 'admin@globalhealth.works',
    adminType: adminType,
    name: `${firstName} ${lastName}`.trim(),
    role: 'admin'
  };
}

// === USERS ===

// Get all users
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password").populate("approvedBy", "firstName lastName email");
    res.json(users);
  } catch (err) {
    console.error("Get users error:", err);
    res.status(500).json({ msg: "Server error" });
  }
};

// Approve a user
exports.approveUser = async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.user.id;

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ msg: "User not found" });

    if (user.isApproved) return res.status(400).json({ msg: "User already approved" });

    const dbAdmin = await User.findById(adminId);
    const approvingAdmin = buildAdminContext(req.user, dbAdmin);

    user.isApproved = true;
    user.approvedBy = adminId;
    user.status = "active";
    await user.save();

    // 1. Send email to the approved user
    await sendMail(user.email, "Your Account Has Been Approved", Templates.userApprovalNotice(user));
    
    // 2. Send confirmation email to the approving admin
    await sendMail(approvingAdmin.email, "User Account Approved", Templates.approvalConfirmedAdminNotice(approvingAdmin, user));

    // 3. Create in-app notification for the approved user
    await createNotification(
      user._id,
      "system",
      "Your account has been approved! You can now access all features of GlobalHealth.Works.",
      "/dashboard",
      { title: "Account Approved", sendEmail: false }
    );

    // 4. Get all admins for in-app notifications
    const allAdmins = await User.find({ role: "admin", isActive: true, _id: { $ne: adminId } });
    const superAdmins = allAdmins.filter(a => a.adminType === "superAdmin");
    const regularAdmins = allAdmins.filter(a => a.adminType !== "superAdmin");

    // 5. Send email to super admins only (when a non-superAdmin admin approves)
    if (approvingAdmin.adminType !== "superAdmin") {
      for (const superAdmin of superAdmins) {
        await sendMail(
          superAdmin.email,
          "User Approved by Admin",
          Templates.superAdminApprovalNotice(user, approvingAdmin)
        );
      }
    }

    // 6. Create in-app notifications for all other admins
    const roleDisplay = user.role === "solutionProvider" ? "Solution Provider" : "Task Owner";
    for (const admin of allAdmins) {
      await createNotification(
        admin._id,
        "admin",
        `${user.firstName} ${user.lastName} (${roleDisplay}) has been approved by ${approvingAdmin.firstName} ${approvingAdmin.lastName}.`,
        `/admin/users/${user._id}`,
        { title: "User Approved", sendEmail: false }
      );
    }

    console.log(`User ${user.email} approved by admin ${adminId}`);

    res.json({ msg: "User approved successfully", user });
  } catch (err) {
    console.error("Approve user error:", err);
    res.status(500).json({ msg: "Server error" });
  }
};

// Suspend/Activate user
exports.updateUserStatus = async (req, res) => {
  const { id, action } = req.params;
  const { reason } = req.body;
  const adminId = req.user.id;

  try {
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ msg: "User not found" });

    const dbActionAdmin = await User.findById(adminId);
    const actionAdmin = buildAdminContext(req.user, dbActionAdmin);

    if (action === "suspend") {
      const suspendReason = reason || "No reason provided";
      user.status = "suspended";
      user.suspendedBy = adminId;
      user.suspensionReason = suspendReason;
      await user.save();

      // 1. Send email to suspended user
      await sendMail(user.email, "Your Account Has Been Suspended", Templates.userSuspensionNotice(user, suspendReason));

      // 2. Create in-app notification for the user
      await createNotification(
        user._id,
        "system",
        `Your account has been suspended. Reason: ${suspendReason}. Contact support if you believe this is a mistake.`,
        null,
        { title: "Account Suspended", sendEmail: false }
      );

      // 3. Notify super admins via email (if suspended by non-superAdmin)
      if (actionAdmin.adminType !== "superAdmin") {
        const superAdmins = await User.find({ role: "admin", adminType: "superAdmin", isActive: true });
        for (const superAdmin of superAdmins) {
          await sendMail(
            superAdmin.email,
            "User Suspended by Admin",
            Templates.superAdminSuspensionNotice(user, actionAdmin, suspendReason)
          );
        }
      }

      // 4. In-app notifications for all other admins
      const otherAdmins = await User.find({ role: "admin", isActive: true, _id: { $ne: adminId } });
      const roleDisplay = user.role === "solutionProvider" ? "Solution Provider" : user.role === "taskOwner" ? "Task Owner" : "User";
      for (const admin of otherAdmins) {
        await createNotification(
          admin._id,
          "admin",
          `${user.firstName} ${user.lastName} (${roleDisplay}) has been suspended by ${actionAdmin.firstName} ${actionAdmin.lastName}. Reason: ${suspendReason}`,
          `/admin/users/${user._id}`,
          { title: "User Suspended", sendEmail: false }
        );
      }

      console.log(`User ${user.email} suspended by admin ${adminId}`);
      return res.json({ msg: "User suspended", user });
    }

    if (action === "activate") {
      user.status = "active";
      user.suspendedBy = null;
      user.suspensionReason = null;
      await user.save();

      // 1. Send email to reactivated user
      await sendMail(user.email, "Your Account Has Been Reactivated", Templates.userActivationNotice(user));

      // 2. Create in-app notification for the user
      await createNotification(
        user._id,
        "system",
        "Your account has been reactivated! You can now access all features of GlobalHealth.Works.",
        "/dashboard",
        { title: "Account Reactivated", sendEmail: false }
      );

      // 3. In-app notifications for all other admins
      const otherAdmins = await User.find({ role: "admin", isActive: true, _id: { $ne: adminId } });
      const roleDisplay = user.role === "solutionProvider" ? "Solution Provider" : user.role === "taskOwner" ? "Task Owner" : "User";
      for (const admin of otherAdmins) {
        await createNotification(
          admin._id,
          "admin",
          `${user.firstName} ${user.lastName} (${roleDisplay}) has been reactivated by ${actionAdmin.firstName} ${actionAdmin.lastName}.`,
          `/admin/users/${user._id}`,
          { title: "User Reactivated", sendEmail: false }
        );
      }

      console.log(`User ${user.email} activated by admin ${adminId}`);
      return res.json({ msg: "User activated", user });
    }

    return res.status(400).json({ msg: "Invalid action" });
  } catch (err) {
    console.error("Update user error:", err);
    res.status(500).json({ msg: "Server error" });
  }
};

// Delete user
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ msg: "User not found" });

    // Optionally: also remove tasks by this user
    await Task.deleteMany({ owner: req.params.id });

    res.json({ msg: "User and related tasks deleted" });
  } catch (err) {
    console.error("Delete user error:", err);
    res.status(500).json({ msg: "Server error" });
  }
};

exports.rejectUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const adminId = req.user.id;

    if (!reason || reason.trim() === "") {
      return res.status(400).json({ msg: "Rejection reason is required" });
    }

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ msg: "User not found" });

    const dbRejectingAdmin = await User.findById(adminId);
    const rejectingAdmin = buildAdminContext(req.user, dbRejectingAdmin);

    // Save reason to user
    user.rejectionReason = reason;
    user.isApproved = false;
    user.rejectedBy = adminId;
    await user.save();

    // 1. Send email to the rejected user
    await sendMail(
      user.email,
      "Your Account Could Not Be Approved",
      Templates.rejectionNotice(user, reason)
    );

    // 2. Send confirmation to the rejecting admin
    await sendMail(
      rejectingAdmin.email,
      "User Account Rejected",
      Templates.rejectionConfirmedAdminNotice(rejectingAdmin, user, reason)
    );

    // 3. Send email to super admins (if rejected by non-superAdmin)
    if (rejectingAdmin.adminType !== "superAdmin") {
      const superAdmins = await User.find({ role: "admin", adminType: "superAdmin", isActive: true });
      for (const superAdmin of superAdmins) {
        await sendMail(
          superAdmin.email,
          "User Rejected by Admin",
          Templates.superAdminRejectionNotice(user, rejectingAdmin, reason)
        );
      }
    }

    // 4. In-app notifications for all other admins
    const otherAdmins = await User.find({ role: "admin", isActive: true, _id: { $ne: adminId } });
    const roleDisplay = user.role === "solutionProvider" ? "Solution Provider" : "Task Owner";
    for (const admin of otherAdmins) {
      await createNotification(
        admin._id,
        "admin",
        `${user.firstName} ${user.lastName} (${roleDisplay}) has been rejected by ${rejectingAdmin.firstName} ${rejectingAdmin.lastName}. Reason: ${reason}`,
        `/admin/users/${user._id}`,
        { title: "User Rejected", sendEmail: false }
      );
    }

    console.log(`User ${user.email} rejected by admin ${adminId}. Reason: ${reason}`);

    res.json({ msg: "User rejected successfully", reason });
  } catch (err) {
    console.error("Reject user error:", err);
    res.status(500).json({ msg: "Server error" });
  }
};


// === TASKS ===

// Get all tasks
exports.getAllTasks = async (req, res) => {
  try {
    const tasks = await Task.find()
      .populate("owner", "firstName lastName email role")
      .sort({ createdAt: -1 });
    
    const tasksWithOwnerName = tasks.map(task => {
      const taskObj = task.toObject();
      if (taskObj.owner) {
        taskObj.owner.name = `${taskObj.owner.firstName || ''} ${taskObj.owner.lastName || ''}`.trim() || 'Unknown';
      }
      return taskObj;
    });
    
    res.json(tasksWithOwnerName);
  } catch (err) {
    console.error("Get tasks error:", err);
    res.status(500).json({ msg: "Server error" });
  }
};

// Update task status (publish/withdraw)
exports.updateTaskStatus = async (req, res) => {
  const { id, action } = req.params;
  try {
    const task = await Task.findById(id);
    if (!task) return res.status(404).json({ msg: "Task not found" });

    if (action === "publish") task.status = "published";
    else if (action === "withdraw") task.status = "withdrawn";
    else return res.status(400).json({ msg: "Invalid action" });

    await task.save();
    res.json({ msg: `Task ${action}ed`, task });
  } catch (err) {
    console.error("Update task error:", err);
    res.status(500).json({ msg: "Server error" });
  }
};

// Delete task
exports.deleteTask = async (req, res) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);
    if (!task) return res.status(404).json({ msg: "Task not found" });

    res.json({ msg: "Task deleted" });
  } catch (err) {
    console.error("Delete task error:", err);
    res.status(500).json({ msg: "Server error" });
  }
};

exports.getStats = async (req, res) => {
  try {
    const users = await User.countDocuments();
    const tasks = await Task.countDocuments();
    const feedback = await Feedback.countDocuments();

    res.json({ users, tasks, feedback });
  } catch (err) {
    console.error("Stats error:", err);
    res.status(500).json({ msg: "Server error" });
  }
};

// === ADMIN MANAGEMENT ===
const bcrypt = require("bcryptjs");
const AdminConversation = require("../models/AdminConversation");
const AdminMessage = require("../models/AdminMessage");

exports.getAllAdmins = async (req, res) => {
  try {
    const admins = await User.find({ role: "admin" }).select("-password");
    res.json(admins);
  } catch (err) {
    console.error("Get admins error:", err);
    res.status(500).json({ msg: "Server error" });
  }
};

exports.createAdmin = async (req, res) => {
  try {
    const { firstName, lastName, email, password } = req.body;

    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ msg: "All fields are required" });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ msg: "User with this email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const admin = new User({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      role: "admin",
      isApproved: true,
      isActive: true,
      profileImage: "/uploads/default.jpg"
    });

    await admin.save();

    await sendMail(
      email,
      "Welcome to GlobalHealth.Works Admin Team",
      Templates.userApprovalNotice({ firstName, lastName, email, role: "admin" })
    );

    res.status(201).json({ msg: "Admin created successfully", admin: { ...admin.toObject(), password: undefined } });
  } catch (err) {
    console.error("Create admin error:", err);
    res.status(500).json({ msg: "Server error" });
  }
};

exports.deleteAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (id === req.user.id) {
      return res.status(400).json({ msg: "You cannot delete yourself" });
    }

    const admin = await User.findById(id);
    if (!admin) return res.status(404).json({ msg: "Admin not found" });
    if (admin.role !== "admin") return res.status(400).json({ msg: "User is not an admin" });

    await User.findByIdAndDelete(id);
    res.json({ msg: "Admin deleted successfully" });
  } catch (err) {
    console.error("Delete admin error:", err);
    res.status(500).json({ msg: "Server error" });
  }
};

// === ADMIN MESSAGING ===

exports.getAdminConversations = async (req, res) => {
  try {
    const conversations = await AdminConversation.find({
      participants: req.user.id
    })
      .populate("participants", "firstName lastName email profileImage")
      .sort({ updatedAt: -1 });

    res.json(conversations);
  } catch (err) {
    console.error("Get admin conversations error:", err);
    res.status(500).json({ msg: "Server error" });
  }
};

exports.createAdminConversation = async (req, res) => {
  try {
    const { participantId } = req.body;
    
    if (!participantId) {
      return res.status(400).json({ msg: "Participant ID is required" });
    }

    const existing = await AdminConversation.findOne({
      participants: { $all: [req.user.id, participantId] }
    }).populate("participants", "firstName lastName email profileImage");

    if (existing) {
      return res.json(existing);
    }

    const conversation = new AdminConversation({
      participants: [req.user.id, participantId]
    });

    await conversation.save();
    await conversation.populate("participants", "firstName lastName email profileImage");

    res.status(201).json(conversation);
  } catch (err) {
    console.error("Create admin conversation error:", err);
    res.status(500).json({ msg: "Server error" });
  }
};

exports.getAdminMessages = async (req, res) => {
  try {
    const { id } = req.params;
    
    const messages = await AdminMessage.find({ conversationId: id })
      .populate("sender", "firstName lastName email profileImage")
      .sort({ createdAt: 1 });

    await AdminMessage.updateMany(
      { conversationId: id, sender: { $ne: req.user.id }, read: false },
      { read: true }
    );

    res.json(messages);
  } catch (err) {
    console.error("Get admin messages error:", err);
    res.status(500).json({ msg: "Server error" });
  }
};

exports.sendAdminMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;

    const attachments = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        attachments.push({
          filename: file.filename,
          originalName: file.originalname,
          mimetype: file.mimetype,
          size: file.size,
          path: `/uploads/admin-messages/${file.filename}`
        });
      }
    }

    if (!content && attachments.length === 0) {
      return res.status(400).json({ msg: "Message content or attachments required" });
    }

    const message = new AdminMessage({
      conversationId: id,
      sender: req.user.id,
      content: content || "",
      attachments
    });

    await message.save();
    await message.populate("sender", "firstName lastName email profileImage");

    const lastMessageContent = content || (attachments.length > 0 ? `Sent ${attachments.length} file(s)` : "");
    const conversation = await AdminConversation.findByIdAndUpdate(id, {
      lastMessage: {
        content: lastMessageContent,
        sender: req.user.id,
        createdAt: new Date()
      }
    }, { new: true }).populate("participants", "firstName lastName email");

    // Send notifications to the other participant(s)
    const sender = await User.findById(req.user.id).select("firstName lastName email");
    for (const participant of conversation.participants) {
      if (String(participant._id) !== String(req.user.id)) {
        // In-app notification
        await createNotification(
          participant._id,
          "admin",
          `${sender.firstName} ${sender.lastName} sent you a message in admin chat.`,
          `/admin/messaging`,
          { title: "New Admin Message", sendEmail: false }
        );

        // Email notification
        await sendMail(
          participant.email,
          `New message from ${sender.firstName} ${sender.lastName}`,
          Templates.adminMessageNotification(participant, sender, content)
        );
      }
    }

    res.status(201).json(message);
  } catch (err) {
    console.error("Send admin message error:", err);
    res.status(500).json({ msg: "Server error" });
  }
};

// === SUPER ADMIN ONLY: Change User Role ===
exports.changeUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { newRole } = req.body;
    const adminId = req.user.id;

    // Get current admin
    const currentAdmin = await User.findById(adminId);
    if (!currentAdmin || currentAdmin.role !== "admin" || currentAdmin.adminType !== "superAdmin") {
      return res.status(403).json({ msg: "Only Super Admins can change user roles" });
    }

    // Validate new role
    const validRoles = ["solutionProvider", "taskOwner", "admin"];
    if (!validRoles.includes(newRole)) {
      return res.status(400).json({ msg: "Invalid role specified" });
    }

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ msg: "User not found" });

    // Prevent changing own role
    if (id === adminId) {
      return res.status(400).json({ msg: "You cannot change your own role" });
    }

    const oldRole = user.role;
    user.role = newRole;
    
    // If changing to admin, set default adminType
    if (newRole === "admin" && !user.adminType) {
      user.adminType = "admin";
    }
    
    await user.save();

    console.log(`User ${user.email} role changed from ${oldRole} to ${newRole} by super admin ${currentAdmin.email}`);

    res.json({ 
      msg: "User role changed successfully", 
      user: { 
        _id: user._id, 
        email: user.email, 
        role: user.role,
        adminType: user.adminType 
      } 
    });
  } catch (err) {
    console.error("Change user role error:", err);
    res.status(500).json({ msg: "Server error" });
  }
};

// === REPORTED CONTENT MANAGEMENT ===

// Get all reported tasks
exports.getReportedTasks = async (req, res) => {
  try {
    const tasks = await Task.find({ isReported: true })
      .populate("owner", "firstName lastName email")
      .populate("reports.reportedBy", "firstName lastName email")
      .sort({ createdAt: -1 });
    
    res.json(tasks);
  } catch (err) {
    console.error("Get reported tasks error:", err);
    res.status(500).json({ msg: "Server error" });
  }
};

// Review task report
exports.reviewTaskReport = async (req, res) => {
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
    
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ msg: "Task not found" });
    
    const report = task.reports.id(reportId);
    if (!report) return res.status(404).json({ msg: "Report not found" });
    
    report.status = status;
    report.reviewedBy = req.user.id;
    report.reviewNotes = reviewNotes || "";
    report.reviewedAt = new Date();
    
    // Update isReported flag if all reports are resolved
    const pendingReports = task.reports.filter(r => r.status === "pending");
    if (pendingReports.length === 0) {
      task.isReported = false;
    }
    
    await task.save();
    
    res.json({ msg: "Report reviewed successfully", task });
  } catch (err) {
    console.error("Review task report error:", err);
    res.status(500).json({ msg: "Server error" });
  }
};

// === ENHANCED STATS ===
exports.getEnhancedStats = async (req, res) => {
  try {
    const Proposal = require("../models/Proposal");
    const Message = require("../models/Message");
    
    // Basic counts
    const totalUsers = await User.countDocuments();
    const totalTasks = await Task.countDocuments();
    const totalFeedback = await Feedback.countDocuments();
    
    // User breakdown by role
    const taskOwners = await User.countDocuments({ role: "taskOwner" });
    const solutionProviders = await User.countDocuments({ role: "solutionProvider" });
    const admins = await User.countDocuments({ role: "admin" });
    
    // User approval status
    const pendingApproval = await User.countDocuments({ isApproved: false, rejectionReason: { $exists: false } });
    const approvedUsers = await User.countDocuments({ isApproved: true });
    const rejectedUsers = await User.countDocuments({ rejectionReason: { $exists: true, $ne: null } });
    
    // Task status breakdown
    const draftTasks = await Task.countDocuments({ status: "draft" });
    const publishedTasks = await Task.countDocuments({ status: "published" });
    const inProgressTasks = await Task.countDocuments({ status: "in-progress" });
    const completedTasks = await Task.countDocuments({ status: "completed" });
    const withdrawnTasks = await Task.countDocuments({ status: "withdrawn" });
    
    // Proposals count (if model exists)
    let totalProposals = 0;
    let pendingProposals = 0;
    let acceptedProposals = 0;
    try {
      totalProposals = await Proposal.countDocuments();
      pendingProposals = await Proposal.countDocuments({ status: "pending" });
      acceptedProposals = await Proposal.countDocuments({ status: "accepted" });
    } catch (e) {
      // Proposal model may not exist
    }
    
    // Recent activity - users registered in last 7 days
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const newUsersThisWeek = await User.countDocuments({ createdAt: { $gte: sevenDaysAgo } });
    const newTasksThisWeek = await Task.countDocuments({ createdAt: { $gte: sevenDaysAgo } });
    
    // Active users (logged in within last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const activeUsers = await User.countDocuments({ lastLogin: { $gte: thirtyDaysAgo } });

    res.json({
      users: {
        total: totalUsers,
        taskOwners,
        solutionProviders,
        admins,
        pendingApproval,
        approved: approvedUsers,
        rejected: rejectedUsers,
        newThisWeek: newUsersThisWeek,
        active: activeUsers
      },
      tasks: {
        total: totalTasks,
        draft: draftTasks,
        published: publishedTasks,
        inProgress: inProgressTasks,
        completed: completedTasks,
        withdrawn: withdrawnTasks,
        newThisWeek: newTasksThisWeek
      },
      proposals: {
        total: totalProposals,
        pending: pendingProposals,
        accepted: acceptedProposals
      },
      feedback: {
        total: totalFeedback
      }
    });
  } catch (err) {
    console.error("Enhanced stats error:", err);
    res.status(500).json({ msg: "Server error" });
  }
};