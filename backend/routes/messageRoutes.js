// routes/messageRoutes.js
// path: routes/messageRoutes.js
const express = require("express");
const { authMiddleware } = require("../controllers/authController");
const messageController = require("../controllers/messageController");

const router = express.Router();

// Send message (multipart/form-data: attachments[])
router.post("/", authMiddleware, messageController.uploadMiddleware, messageController.sendMessage);

// Inbox (conversations list)
router.get("/inbox", authMiddleware, messageController.getInbox);

// Unread count
router.get("/unread/count", authMiddleware, messageController.getUnreadCount);

// Message operations
router.patch("/:messageId", authMiddleware, messageController.uploadMiddleware, messageController.editMessage); // edit (optionally with new attachments)
router.delete("/:messageId", authMiddleware, messageController.deleteMessage); // soft delete for user
router.patch("/:messageId/read", authMiddleware, messageController.markAsRead);

// Reactions
router.post("/:messageId/reactions", authMiddleware, messageController.addReaction);

// Search messages
router.get("/search", authMiddleware, messageController.searchMessages);

module.exports = router;
