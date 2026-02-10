// controllers/matchController.js
const User = require("../models/User");
const Task = require("../models/Task");
const { calculateMatchScore } = require("../utils/matcher");

// Get best SPs for a given task
exports.getBestSPsForTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.taskId);
    if (!task) return res.status(404).json({ msg: "Task not found" });

    const sps = await User.find({ role: "solutionProvider" });

    const scored = sps.map(sp => ({
      sp,
      score: calculateMatchScore(sp, task),
    }));

    scored.sort((a, b) => b.score - a.score);

    res.json(scored.slice(0, 10)); // return top 10
  } catch (err) {
    console.error("Match error:", err);
    res.status(500).json({ msg: "Server error" });
  }
};

// Get best tasks for logged-in SP
exports.getBestTasksForSP = async (req, res) => {
  try {
    const sp = await User.findById(req.user.id);
    if (!sp || sp.role !== "solutionProvider") {
      return res.status(403).json({ msg: "Not a solution provider" });
    }

    const tasks = await Task.find();

    const scored = tasks.map(task => ({
      task,
      score: calculateMatchScore(sp, task),
    }));

    scored.sort((a, b) => b.score - a.score);

    res.json(scored.slice(0, 10));
  } catch (err) {
    console.error("Match error:", err);
    res.status(500).json({ msg: "Server error" });
  }
};
