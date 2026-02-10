// routes/conversationRoutes.js
const express = require("express");
const router = express.Router();
const { authMiddleware } = require("../controllers/authController");
const conversationController = require("../controllers/conversationController");
const messageController = require("../controllers/messageController"); // Needed for markConversationRead

// POST /api/conversations/start - Create or get a conversation
router.post("/start", authMiddleware, conversationController.startConversation);

// GET /api/conversations/:conversationId - Fetch conversation metadata
// THIS IS THE ROUTE THAT WAS MISSING AUTH MIDDLEWARE
router.get("/:conversationId", authMiddleware, conversationController.getConversationById);

// GET /api/conversations/:conversationId/messages - Fetch all messages
// This route is handled by the messageController but often nested here.
// The controller is 'messageController.getMessagesByConversation'
router.get("/:conversationId/messages", authMiddleware, messageController.getMessagesByConversation); // 👈 Missing middleware in the previous setup

// PATCH /api/conversations/:conversationId/read - Mark all messages in convo as read
router.patch("/:conversationId/read", authMiddleware, messageController.markConversationRead);

module.exports = router;