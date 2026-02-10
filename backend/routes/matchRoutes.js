// routes/matchRoutes.js
const express = require("express");
const { authMiddleware } = require("../controllers/authController");
const { getBestSPsForTask, getBestTasksForSP } = require("../controllers/matchController");

const router = express.Router();

router.get("/task/:taskId/sps", authMiddleware, getBestSPsForTask);
router.get("/sp/recommendations", authMiddleware, getBestTasksForSP);

module.exports = router;
