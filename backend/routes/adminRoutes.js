// routes/adminRoutes.js
const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { authMiddleware, requireRole } = require("../controllers/authController");
const {
  getAllUsers,
  updateUserStatus,
  deleteUser,
  getAllTasks,
  updateTaskStatus,
  deleteTask,
  getStats,
  approveUser,
  rejectUser,
  getAllAdmins,
  createAdmin,
  deleteAdmin,
  getAdminConversations,
  createAdminConversation,
  getAdminMessages,
  sendAdminMessage,
  changeUserRole,
  getEnhancedStats,
  getReportedTasks,
  reviewTaskReport
} = require("../controllers/adminController");

const {
  getReportedFeedback,
  reviewFeedbackReport,
  deleteFeedback,
  getAllFeedback
} = require("../controllers/feedbackController");

const {
  getAllProposals,
  deleteProposal
} = require("../controllers/proposalController");

const router = express.Router();

const adminMsgUploadDir = path.join(__dirname, "..", "uploads", "admin-messages");
if (!fs.existsSync(adminMsgUploadDir)) fs.mkdirSync(adminMsgUploadDir, { recursive: true });

const adminMsgStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, adminMsgUploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, name);
  }
});

const adminMsgUpload = multer({
  storage: adminMsgStorage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      "image/jpeg", "image/png", "image/gif", "image/webp",
      "application/pdf", "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "text/plain"
    ];
    if (!allowedMimes.includes(file.mimetype)) return cb(new Error("Unsupported file type"), false);
    cb(null, true);
  }
});

// Users
router.get("/users", authMiddleware, requireRole("admin"), getAllUsers);
router.put("/approve/:id", authMiddleware, requireRole("admin"), approveUser);
router.put("/reject/:id", authMiddleware, requireRole("admin"), rejectUser);
router.put("/user/:id/suspend", authMiddleware, requireRole("admin"), updateUserStatus);
router.put("/user/:id/activate", authMiddleware, requireRole("admin"), updateUserStatus);

// Super Admin only: change user role
router.put("/user/:id/change-role", authMiddleware, requireRole("admin"), changeUserRole);

// Admin management
router.get("/admins", authMiddleware, requireRole("admin"), getAllAdmins);
router.post("/create-admin", authMiddleware, requireRole("admin"), createAdmin);
router.delete("/admins/:id", authMiddleware, requireRole("admin"), deleteAdmin);

// Admin messaging
router.get("/conversations", authMiddleware, requireRole("admin"), getAdminConversations);
router.post("/conversations", authMiddleware, requireRole("admin"), createAdminConversation);
router.get("/conversations/:id/messages", authMiddleware, requireRole("admin"), getAdminMessages);
router.post("/conversations/:id/messages", authMiddleware, requireRole("admin"), adminMsgUpload.array("attachments", 5), sendAdminMessage);

// Tasks
router.get("/tasks", authMiddleware, requireRole("admin"), getAllTasks);
router.patch("/tasks/:id/:action", authMiddleware, requireRole("admin"), updateTaskStatus);
router.delete("/tasks/:id", authMiddleware, requireRole("admin"), deleteTask);

// Reported content management
router.get("/reported-tasks", authMiddleware, requireRole("admin"), getReportedTasks);
router.patch("/tasks/:id/review-report", authMiddleware, requireRole("admin"), reviewTaskReport);
router.get("/reported-feedback", authMiddleware, requireRole("admin"), getReportedFeedback);
router.patch("/feedback/:id/review-report", authMiddleware, requireRole("admin"), reviewFeedbackReport);

// Feedback management
router.get("/feedback", authMiddleware, requireRole("admin"), getAllFeedback);
router.delete("/feedback/:id", authMiddleware, requireRole("admin"), deleteFeedback);

// Proposal management
router.get("/proposals", authMiddleware, requireRole("admin"), getAllProposals);
router.delete("/proposals/:id", authMiddleware, requireRole("admin"), deleteProposal);

// Stats
router.get("/stats", authMiddleware, getStats);
router.get("/enhanced-stats", authMiddleware, requireRole("admin"), getEnhancedStats);

module.exports = router;
