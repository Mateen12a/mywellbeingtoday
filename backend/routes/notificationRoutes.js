// routes/notificationRoutes.js
const express = require("express");
const router = express.Router();
const { authMiddleware } = require("../controllers/authController");
const {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  markReadByLink,
  deleteNotification,
  deleteMultipleNotifications,
  deleteAllNotifications,
  getPreferences,
  updatePreferences,
  getAllNotifications,
} = require("../controllers/notificationController");

// User notification routes
router.get("/", authMiddleware, getNotifications);
router.get("/unread-count", authMiddleware, getUnreadCount);
router.patch("/mark-read-by-link", authMiddleware, markReadByLink);
router.patch("/:id/read", authMiddleware, markAsRead);
router.patch("/read-all", authMiddleware, markAllAsRead);
router.delete("/:id", authMiddleware, deleteNotification);
router.post("/delete-multiple", authMiddleware, deleteMultipleNotifications);
router.delete("/", authMiddleware, deleteAllNotifications);

// Preferences
router.get("/preferences", authMiddleware, getPreferences);
router.put("/preferences", authMiddleware, updatePreferences);

// Admin routes
router.get("/admin/all", authMiddleware, getAllNotifications);

module.exports = router;
