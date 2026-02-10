// controllers/notificationController.js
const Notification = require("../models/Notification");
const User = require("../models/User");

// Get all notifications for logged-in user (excluding deleted)
exports.getNotifications = async (req, res) => {
  try {
    const { page = 1, limit = 50, type, unreadOnly } = req.query;
    
    const query = { user: req.user.id, deleted: { $ne: true } };
    
    if (type && type !== 'all') {
      query.type = type;
    }
    
    if (unreadOnly === 'true') {
      query.read = false;
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Notification.countDocuments(query),
      Notification.countDocuments({ user: req.user.id, deleted: { $ne: true }, read: false })
    ]);
    
    res.json({
      notifications,
      total,
      unreadCount,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit))
    });
  } catch (err) {
    console.error("Fetch notifications error:", err);
    res.status(500).json({ msg: "Error fetching notifications" });
  }
};

// Get unread count
exports.getUnreadCount = async (req, res) => {
  try {
    const count = await Notification.countDocuments({ 
      user: req.user.id, 
      deleted: { $ne: true }, 
      read: false 
    });
    res.json({ count });
  } catch (err) {
    res.status(500).json({ msg: "Error fetching unread count" });
  }
};

// Mark one as read
exports.markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { read: true },
      { new: true }
    );
    if (!notification) {
      return res.status(404).json({ msg: "Notification not found" });
    }
    res.json({ success: true, notification });
  } catch (err) {
    res.status(500).json({ msg: "Error updating notification" });
  }
};

// Mark all as read
exports.markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { user: req.user.id, read: false, deleted: { $ne: true } },
      { read: true }
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ msg: "Error updating notifications" });
  }
};

// Delete single notification (soft delete)
exports.deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { deleted: true },
      { new: true }
    );
    if (!notification) {
      return res.status(404).json({ msg: "Notification not found" });
    }
    res.json({ success: true, msg: "Notification deleted" });
  } catch (err) {
    res.status(500).json({ msg: "Error deleting notification" });
  }
};

// Delete multiple notifications (soft delete)
exports.deleteMultipleNotifications = async (req, res) => {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids)) {
      return res.status(400).json({ msg: "Invalid notification IDs" });
    }
    
    await Notification.updateMany(
      { _id: { $in: ids }, user: req.user.id },
      { deleted: true }
    );
    res.json({ success: true, msg: `${ids.length} notifications deleted` });
  } catch (err) {
    res.status(500).json({ msg: "Error deleting notifications" });
  }
};

// Delete all notifications (soft delete)
exports.deleteAllNotifications = async (req, res) => {
  try {
    await Notification.updateMany(
      { user: req.user.id, deleted: { $ne: true } },
      { deleted: true }
    );
    res.json({ success: true, msg: "All notifications deleted" });
  } catch (err) {
    res.status(500).json({ msg: "Error deleting notifications" });
  }
};

// Get notification preferences
exports.getPreferences = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("notificationPreferences");
    res.json(user.notificationPreferences || {
      emailNotifications: true,
      inAppNotifications: true,
      proposalUpdates: true,
      taskUpdates: true,
      messageNotifications: true,
      systemUpdates: true,
    });
  } catch (err) {
    res.status(500).json({ msg: "Error fetching preferences" });
  }
};

// Update notification preferences
exports.updatePreferences = async (req, res) => {
  try {
    const allowedFields = [
      'emailNotifications',
      'inAppNotifications', 
      'proposalUpdates',
      'taskUpdates',
      'messageNotifications',
      'systemUpdates'
    ];
    
    const updates = {};
    for (const field of allowedFields) {
      if (typeof req.body[field] === 'boolean') {
        updates[`notificationPreferences.${field}`] = req.body[field];
      }
    }
    
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: updates },
      { new: true }
    ).select("notificationPreferences");
    
    res.json({ success: true, preferences: user.notificationPreferences });
  } catch (err) {
    res.status(500).json({ msg: "Error updating preferences" });
  }
};

// Mark notifications as read by link pattern (secure whitelist approach)
exports.markReadByLink = async (req, res) => {
  try {
    const { linkPattern } = req.body;
    if (!linkPattern || typeof linkPattern !== 'string') {
      return res.status(400).json({ msg: "Link pattern required" });
    }
    
    // Whitelist: Only allow specific route patterns
    // Valid patterns: /tasks/{id}, /messages/{id}
    const taskMatch = linkPattern.match(/^\/tasks\/([a-f0-9]{24})$/i);
    const messageMatch = linkPattern.match(/^\/messages\/([a-f0-9]{24})$/i);
    
    if (!taskMatch && !messageMatch) {
      return res.status(400).json({ msg: "Invalid link pattern" });
    }
    
    // Use exact string matching instead of regex for security
    const result = await Notification.updateMany(
      { 
        user: req.user.id, 
        read: false,
        deleted: { $ne: true },
        link: linkPattern
      },
      { read: true }
    );
    
    res.json({ success: true, updated: result.modifiedCount });
  } catch (err) {
    console.error("markReadByLink error:", err);
    res.status(500).json({ msg: "Error updating notifications" });
  }
};

// Admin: Get all notifications (for admin dashboard)
exports.getAllNotifications = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ msg: "Admin access required" });
    }
    
    const { page = 1, limit = 100 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [notifications, total] = await Promise.all([
      Notification.find({ deleted: { $ne: true } })
        .populate("user", "firstName lastName email role")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Notification.countDocuments({ deleted: { $ne: true } })
    ]);
    
    res.json({ notifications, total, page: parseInt(page) });
  } catch (err) {
    res.status(500).json({ msg: "Error fetching notifications" });
  }
};
