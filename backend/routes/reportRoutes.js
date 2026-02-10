const express = require("express");
const { authMiddleware, requireRole } = require("../controllers/authController");
const {
  createReport,
  getReports,
  reviewReport,
  warnUser,
  deleteReport
} = require("../controllers/reportController");

const router = express.Router();

router.post("/", authMiddleware, createReport);

router.get("/", authMiddleware, requireRole("admin"), getReports);
router.patch("/:id/review", authMiddleware, requireRole("admin"), reviewReport);
router.post("/warn-user", authMiddleware, requireRole("admin"), warnUser);
router.delete("/:id", authMiddleware, requireRole("admin"), deleteReport);

module.exports = router;
