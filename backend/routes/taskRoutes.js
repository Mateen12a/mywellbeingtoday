// routes/taskRoutes.js
const express = require("express");
const router = express.Router();
const multer = require("multer");
const { authMiddleware } = require("../controllers/authController");
const {
  createTask,
  getTasks,
  getTask,
  applyToTask,
  updateTask,
  updateStatus,
  getMyApplications,
  uploadTaskAttachments,
  reportTask,
  markComplete,
  withdrawTask,
  getAvailableTasksCount
} = require("../controllers/taskController");

// Multer error handling middleware
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ msg: "File too large. Maximum size is 10MB per file." });
    }
    return res.status(400).json({ msg: `Upload error: ${err.message}` });
  } else if (err && err.message) {
    return res.status(400).json({ msg: err.message });
  }
  next(err);
};

// Task Owner: create
router.post("/", authMiddleware, uploadTaskAttachments, handleMulterError, createTask);

// All users: list tasks
router.get("/", authMiddleware, getTasks);

// Solution Provider: view their applications
router.get("/my-applications", authMiddleware, getMyApplications);

// Solution Provider: get available tasks count (for badge)
router.get("/available-count", authMiddleware, getAvailableTasksCount);

// Single task
router.get("/:id", authMiddleware, getTask);

// Solution Provider: apply
router.post("/:id/apply", authMiddleware, applyToTask);

// Report a task
router.post("/:id/report", authMiddleware, reportTask);

// Task Owner: update task
router.put("/:id", authMiddleware, uploadTaskAttachments, handleMulterError, updateTask);

// Task Owner: update status
router.patch("/:id/status", authMiddleware, updateStatus);

// Mark task as complete (both owner and provider)
router.patch("/:id/mark-complete", authMiddleware, markComplete);

// Withdraw task (owner only)
router.patch("/:id/withdraw", authMiddleware, withdrawTask);

module.exports = router;
