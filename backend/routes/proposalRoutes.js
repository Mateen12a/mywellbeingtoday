// routes/proposalRoutes.js
const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const {
  createProposal,
  getProposalsForTask,
  getMyProposals,
  getMyProposalStats,
  updateProposalStatus,
  withdrawProposal,
  getProposal,
} = require("../controllers/proposalController");
const { authMiddleware } = require("../controllers/authController");

// === File upload security config ===
const MAX_FILES = 5;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB per file
const ALLOWED_MIMES = [
  "image/jpeg", "image/png", "image/gif", "image/webp",
  "application/pdf", "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/plain", "text/csv"
];

// ensure uploads/proposals exists
const uploadsDir = path.join(__dirname, "..", "uploads", "proposals");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  },
});

const upload = multer({ 
  storage, 
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_MIMES.includes(file.mimetype)) {
      return cb(new Error("Unsupported file type. Allowed: images, PDF, Word, Excel, text files."), false);
    }
    cb(null, true);
  }
});

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

// Create proposal (SP). Accept up to 5 attachments named 'attachments'
router.post("/", authMiddleware, upload.array("attachments", 5), handleMulterError, createProposal);

// Get proposals for a task (owner)
router.get("/task/:taskId", authMiddleware, getProposalsForTask);
// Get my proposals (SP) - must come before /:id route
router.get("/mine", authMiddleware, getMyProposals);

// Get my proposal stats (SP dashboard)
router.get("/my-stats", authMiddleware, getMyProposalStats);

router.get("/:id", authMiddleware, getProposal);

// Owner accept/reject a proposal
router.patch("/:proposalId/status", authMiddleware, updateProposalStatus);

// Applicant withdraw
router.patch("/:proposalId/withdraw", authMiddleware, withdrawProposal);

module.exports = router;
