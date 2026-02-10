const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    // Shared fields
    title: { type: String },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String },
    role: {
      type: String,
      enum: ["solutionProvider", "taskOwner", "admin"],
      required: true,
    },
    country: { type: String },
    countryCode: { type: String },
    gender: { type: String },
    genderSelfDescribe: { type: String },
    profileImage: { type: String, default: "/uploads/default.jpg" },
    oauthProvider: { type: String },
    lastLogin: { type: Date },

    // Solution Provider-specific
    affiliation: [{ type: String }],
    expertise: [{ type: String }],
    focusAreas: [{ type: String }],
    availableForWork: { type: Boolean, default: true },
    professionalLink: { type: String },
    bio: { type: String, maxlength: 1000 },
    cvFile: { type: String },

    // Task Owner-specific
    phone: { type: String },
    organisationName: { type: String },
    organisationType: { type: String },
    supportNeeded: [{ type: String }],
    postedTasks: [{ type: mongoose.Schema.Types.ObjectId, ref: "Task" }],
    status: { type: String, default: "active" },

    // Admin / system-specific
    isActive: { type: Boolean, default: true },
    isVerified: { type: Boolean, default: false },
    
    // Admin type: superAdmin has additional privileges like changing user roles
    // Only applicable for users with role === "admin"
    adminType: { 
      type: String, 
      enum: ["superAdmin", "admin", null], 
      default: null 
    },

    // Approval fields
    isApproved: { type: Boolean, default: false },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    
    // Rejection fields
    rejectionReason: { type: String },
    rejectedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },

    // Suspension fields
    suspendedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    suspensionReason: { type: String },

    // Notification preferences
    notificationPreferences: {
      emailNotifications: { type: Boolean, default: true },
      inAppNotifications: { type: Boolean, default: true },
      proposalUpdates: { type: Boolean, default: true },
      taskUpdates: { type: Boolean, default: true },
      messageNotifications: { type: Boolean, default: true },
      systemUpdates: { type: Boolean, default: true },
    },

    // Onboarding status
    onboardingCompleted: { type: Boolean, default: false },
    onboardingSkipped: { type: Boolean, default: false },
    isFirstLogin: { type: Boolean, default: true },

    // Device tracking for login notifications
    knownDevices: [{
      deviceId: String,
      browser: String,
      device: String,
      ip: String,
      lastUsed: Date,
      addedAt: { type: Date, default: Date.now }
    }],

    // Warnings
    warnings: [{
      reason: String,
      issuedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      issuedAt: { type: Date, default: Date.now }
    }],

    // Pending approval login attempt tracking (for retry email notifications)
    pendingApprovalAttempts: {
      count: { type: Number, default: 0 },
      lastAttempt: { type: Date },
      emailsSent: { type: Number, default: 0 }
    },
    
    // Forgot password fields
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
