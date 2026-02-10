// controllers/proposalController.js
const mongoose = require("mongoose");
const Proposal = require("../models/Proposal");
const Task = require("../models/Task");
const User = require("../models/User");
const path = require("path");
const fs = require("fs");
const { sendMail, Templates } = require("../utils/mailer");
const createNotification = require("../utils/createNotification");
const { validateProposalCreation } = require("../utils/validation");

// Create a proposal (multipart/form-data if attachments)
exports.createProposal = async (req, res) => {
  try {
    const { task: taskId, message, proposedBudget, proposedDuration } = req.body;
    const fromUserId = req.user.id;

    // Backend validation
    const validationResult = validateProposalCreation({ task: taskId, message });
    if (!validationResult.valid) {
      return res.status(400).json({ 
        msg: validationResult.errors[0],
        errors: validationResult.errors 
      });
    }

    const task = await Task.findById(taskId).populate("owner");
    if (!task) return res.status(404).json({ msg: "Task not found" });

    // Do not allow owner to apply to own task
    if (task.owner._id.toString() === fromUserId) {
      return res.status(400).json({ msg: "Task owners cannot apply to their own tasks" });
    }

    // Check for existing proposal
    const existingProposal = await Proposal.findOne({ 
      task: taskId, 
      fromUser: fromUserId
    });
    
    if (existingProposal) {
      // If active proposal exists, reject
      if (existingProposal.status === 'pending' || existingProposal.status === 'accepted') {
        return res.status(400).json({ msg: "You already have an active proposal for this task" });
      }
      
      // If withdrawn, rejected, or not selected, update the existing proposal instead of creating new
      if (existingProposal.status === 'withdrawn' || existingProposal.status === 'rejected' || existingProposal.status === 'not selected') {
        const attachments = [];
        if (req.files && req.files.length > 0) {
          for (const f of req.files) {
            attachments.push(`/uploads/proposals/${f.filename}`);
          }
        }
        
        existingProposal.message = message;
        existingProposal.proposedBudget = proposedBudget ? Number(proposedBudget) : undefined;
        existingProposal.proposedDuration = proposedDuration;
        existingProposal.attachments = attachments.length > 0 ? attachments : existingProposal.attachments;
        existingProposal.status = 'pending';
        existingProposal.updatedAt = new Date();
        
        await existingProposal.save();
        
        // Send resubmission notification email
        try {
          const applicant = await User.findById(fromUserId);
          if (applicant) {
            await sendMail(
              applicant.email,
              `Proposal Resubmitted - ${task.title}`,
              Templates.proposalSubmissionConfirmation(applicant, task, existingProposal)
            );
          }
        } catch (emailErr) {
          console.error("Resubmission email error:", emailErr);
        }
        
        return res.status(200).json(existingProposal);
      }
    }

    // files handling (multer placed files in req.files)
    const attachments = [];
    if (req.files && req.files.length > 0) {
      for (const f of req.files) {
        attachments.push(`/uploads/proposals/${f.filename}`);
      }
    }

    const proposal = new Proposal({
      task: taskId,
      fromUser: fromUserId,
      toUser: task.owner._id,
      message,
      attachments,
      proposedBudget: proposedBudget ? Number(proposedBudget) : undefined,
      proposedDuration,
    });

    await proposal.save();

    // Optional: push applicant to task.applicants array if you want
    // task.applicants.push(fromUserId);
    // await task.save();

    // TODO: trigger notification to task.owner (in-app / email)

    // After saving the proposal
    try {
      const taskOwner = task.owner; // already populated
      const applicant = await User.findById(fromUserId).lean();

      // Email to task owner
      if (taskOwner.email) {
        const htmlOwner = Templates.proposalSubmitted(taskOwner, applicant, task, proposal);
        await sendMail(taskOwner.email, `New proposal for your task "${task.title}"`, htmlOwner);
      }

      // Email to applicant (solution provider)
      if (applicant.email) {
        const htmlApplicant = Templates.proposalSubmissionConfirmation(applicant, task, proposal);
        await sendMail(applicant.email, `Your proposal for "${task.title}" was submitted`, htmlApplicant);
      }

      // In-app notification for task owner
      await createNotification(
        taskOwner._id,
        "proposal",
        `${applicant.firstName} ${applicant.lastName} submitted a proposal for your task "${task.title}"`,
        `/tasks/${task._id}`,
        { title: "New Proposal Received", sendEmail: false }
      );

      // In-app notification for applicant
      await createNotification(
        fromUserId,
        "proposal",
        `Your proposal for "${task.title}" has been submitted successfully.`,
        `/my-proposals`,
        { title: "Proposal Submitted", sendEmail: false }
      );
    } catch (emailErr) {
      console.warn("Proposal email failed:", emailErr);
    }
    res.status(201).json({ msg: "Success", proposal });
  } catch (err) {
    console.error("createProposal error:", err);
    res.status(500).json({ msg: "Server error" });
  }
};

// Get proposals for a task (task owner only)
exports.getProposalsForTask = async (req, res) => {
  try {
    const taskId = req.params.taskId;
    const userId = req.user.id;

    const task = await Task.findById(taskId);
    if (!task) return res.status(404).json({ msg: "Task not found" });

    if (task.owner.toString() !== userId) {
      return res.status(403).json({ msg: "Not authorized" });
    }

    const proposals = await Proposal.find({ task: taskId })
      .populate("fromUser", "firstName lastName email profileImage expertise")
      .sort({ createdAt: -1 });

    res.json(proposals);
  } catch (err) {
    console.error("getProposalsForTask error:", err);
    res.status(500).json({ msg: "Server error" });
  }
};

// Get proposals submitted by current user (SP)
exports.getMyProposals = async (req, res) => {
  try {
    const userId = req.user.id;
    const proposals = await Proposal.find({ fromUser: userId })
      .populate("task", "title summary status")
      .populate("toUser", "name email profileImage")
      .sort({ createdAt: -1 });

    res.json(proposals);
  } catch (err) {
    console.error("getMyProposals error:", err);
    res.status(500).json({ msg: "Server error" });
  }
};

// Get SP dashboard stats (real data)
exports.getMyProposalStats = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get all proposals by this user with task data
    const proposals = await Proposal.find({ fromUser: userId })
      .populate("task", "status")
      .lean();
    
    let applied = 0;
    let inProgress = 0;
    let completed = 0;
    
    for (const p of proposals) {
      if (!p.task) continue;
      
      const taskStatus = (p.task.status || '').toLowerCase();
      
      // Applied = pending proposals
      if (p.status === 'pending') {
        applied++;
      }
      // In Progress = accepted proposals where task is in-progress/ongoing/published (active work)
      else if (p.status === 'accepted' && ['in-progress', 'in progress', 'ongoing', 'published'].includes(taskStatus)) {
        inProgress++;
      }
      // Completed = accepted proposals where task is completed
      else if (p.status === 'accepted' && taskStatus === 'completed') {
        completed++;
      }
    }
    
    res.json({ applied, inProgress, completed });
  } catch (err) {
    console.error("getMyProposalStats error:", err);
    res.status(500).json({ msg: "Server error" });
  }
};

// Owner accepts or rejects a proposal
exports.updateProposalStatus = async (req, res) => {
  const { proposalId } = req.params;
  const { action } = req.body; // "accept" or "reject"
  const userId = req.user.id;
  
  // Validate inputs before starting any transaction
  const proposal = await Proposal.findById(proposalId).populate("task");
  if (!proposal) return res.status(404).json({ msg: "Proposal not found" });
  
  if (proposal.toUser.toString() !== userId && proposal.task.owner.toString() !== userId) {
    return res.status(403).json({ msg: "Not authorized" });
  }
  
  if (!["accept", "reject"].includes(action)) return res.status(400).json({ msg: "Invalid action" });
  
  let session = null;
  let updatedStatus = null;
  let taskData = null;
  
  try {
    if (action === "accept") {
      // Use transaction for atomic proposal acceptance
      session = await mongoose.startSession();
      session.startTransaction();
      
      try {
        // Re-fetch within transaction for consistency
        const existingAccepted = await Proposal.findOne({
          task: proposal.task._id,
          status: "accepted"
        }).session(session);
        
        if (existingAccepted) {
          await session.abortTransaction();
          return res.status(400).json({ 
            msg: "Another proposal has already been accepted for this task",
            alreadyAccepted: true
          });
        }
        
        const currentProposal = await Proposal.findById(proposalId).session(session);
        if (!currentProposal || currentProposal.status !== "pending") {
          await session.abortTransaction();
          return res.status(400).json({ 
            msg: "Proposal cannot be accepted (status is not pending)",
            alreadyProcessed: true
          });
        }
        
        // Accept this proposal
        currentProposal.status = "accepted";
        await currentProposal.save({ session });
        
        // Update task
        taskData = await Task.findById(proposal.task._id).session(session);
        taskData.assignedTo = taskData.assignedTo || [];
        if (!taskData.assignedTo.includes(proposal.fromUser)) {
          taskData.assignedTo.push(proposal.fromUser);
        }
        taskData.status = "in-progress";
        await taskData.save({ session });
        
        // Set all other pending proposals to "not selected"
        await Proposal.updateMany(
          { 
            task: proposal.task._id, 
            _id: { $ne: proposalId }, 
            status: "pending" 
          },
          { status: "not selected" },
          { session }
        );
        
        await session.commitTransaction();
        updatedStatus = "accepted";
      } catch (txError) {
        if (session.inTransaction()) {
          await session.abortTransaction();
        }
        throw txError;
      }
    } else {
      proposal.status = "rejected";
      await proposal.save();
      updatedStatus = "rejected";
      taskData = await Task.findById(proposal.task._id);
    }
    
    // Fetch task data if not already fetched (for accept case, it's fetched in transaction)
    if (!taskData) {
      taskData = await Task.findById(proposal.task._id);
    }
    if (!taskData) return res.status(404).json({ msg: "Task not found" });
    
    // Get the applicant user for notifications
    const applicant = await User.findById(proposal.fromUser);
    
    // Send email and in-app notifications
    if (updatedStatus === "accepted") {
      if (applicant) {
        await sendMail(
          applicant.email,
          `Your proposal for "${taskData.title}" has been accepted!`,
          Templates.proposalAccepted(applicant, taskData)
        );

        await createNotification(
          applicant._id,
          "proposal",
          `Congratulations! Your proposal for "${taskData.title}" has been accepted.`,
          `/tasks/${taskData._id}`,
          { title: "Proposal Accepted", sendEmail: false }
        );
      }
    } else {
      if (applicant) {
        await sendMail(
          applicant.email,
          `Update on your proposal for "${taskData.title}"`,
          Templates.proposalRejected(applicant, taskData)
        );

        await createNotification(
          applicant._id,
          "proposal",
          `Your proposal for "${taskData.title}" was not selected. Keep applying to other tasks!`,
          `/browse-tasks`,
          { title: "Proposal Update", sendEmail: false }
        );
      }
    }

    proposal.status = updatedStatus;
    res.json({ msg: `Proposal ${updatedStatus}`, proposal });
  } catch (err) {
    console.error("updateProposalStatus error:", err);
    res.status(500).json({ msg: "Server error" });
  } finally {
    if (session) {
      session.endSession();
    }
  }
};

// Applicant withdraws their proposal
exports.withdrawProposal = async (req, res) => {
  try {
    const { proposalId } = req.params;
    const userId = req.user.id;
    const proposal = await Proposal.findById(proposalId).populate('task');
    if (!proposal) return res.status(404).json({ msg: "Proposal not found" });

    if (proposal.fromUser.toString() !== userId) return res.status(403).json({ msg: "Not authorized" });

    proposal.status = "withdrawn";
    await proposal.save();

    // Send withdrawal confirmation email
    const applicant = await User.findById(userId);
    if (applicant && proposal.task) {
      try {
        await sendMail(
          applicant.email,
          `Proposal Withdrawn - ${proposal.task.title}`,
          Templates.proposalWithdrawn(applicant, proposal.task)
        );
      } catch (emailErr) {
        console.error("Withdrawal email error:", emailErr);
      }
    }

    res.json({ msg: "Proposal withdrawn", proposal });
  } catch (err) {
    console.error("withdrawProposal error:", err);
    res.status(500).json({ msg: "Server error" });
  }
};

exports.getProposal = async (req, res) => {
  try {

    const taskId = req.params.id;
    const userId = req.user.id;
    const proposal = await Proposal.findOne({ task: taskId, fromUser: userId }).lean();
    if (!proposal) return res.status(404).json({ msg: "Proposal not found" });
    res.json(proposal);
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
};

// Admin: Get all proposals
exports.getAllProposals = async (req, res) => {
  try {
    const { status, page = 1, limit = 50 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const query = {};
    if (status && status !== 'all') {
      query.status = status;
    }
    
    const [proposals, total] = await Promise.all([
      Proposal.find(query)
        .populate("fromUser", "firstName lastName email profileImage role")
        .populate("toUser", "firstName lastName email profileImage")
        .populate("task", "title summary status")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Proposal.countDocuments(query)
    ]);
    
    const statusCounts = await Proposal.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } }
    ]);
    
    const counts = {
      pending: 0,
      accepted: 0,
      rejected: 0,
      withdrawn: 0,
      total: 0
    };
    
    statusCounts.forEach(s => {
      counts[s._id] = s.count;
      counts.total += s.count;
    });
    
    res.json({
      proposals,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
      counts
    });
  } catch (err) {
    console.error("getAllProposals error:", err);
    res.status(500).json({ msg: "Server error" });
  }
};

// Admin: Delete proposal
exports.deleteProposal = async (req, res) => {
  try {
    const { id } = req.params;
    const proposal = await Proposal.findByIdAndDelete(id);
    if (!proposal) return res.status(404).json({ msg: "Proposal not found" });
    res.json({ msg: "Proposal deleted" });
  } catch (err) {
    console.error("deleteProposal error:", err);
    res.status(500).json({ msg: "Server error" });
  }
};