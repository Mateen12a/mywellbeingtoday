import { User, Provider, ActivityLog, MoodLog, WellbeingReport, Appointment, AuditLog, Certificate, ChatReport, Subscription } from '../models/index.js';
import { AppError } from '../middlewares/errorHandler.js';
import { logAction } from '../middlewares/auditLog.js';
import { USER_ROLES } from '../config/constants.js';
import { generateAdminInsights } from '../services/aiService.js';

export const getUsers = async (req, res, next) => {
  try {
    const { role, search, isActive, page = 1, limit = 20 } = req.query;
    const query = {};

    if (role) query.role = role;
    if (isActive !== undefined) query.isActive = isActive === 'true';
    
    if (search) {
      query.$or = [
        { email: { $regex: search, $options: 'i' } },
        { 'profile.firstName': { $regex: search, $options: 'i' } },
        { 'profile.lastName': { $regex: search, $options: 'i' } }
      ];
    }

    if (req.user.role === USER_ROLES.MANAGER) {
      query.role = { $nin: [USER_ROLES.MANAGER, USER_ROLES.ADMIN] };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [users, total] = await Promise.all([
      User.find(query)
        .select('-password')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      User.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password');

    if (!user) {
      throw new AppError('User not found', 404, 'NOT_FOUND');
    }

    if (req.user.role === USER_ROLES.MANAGER && 
        [USER_ROLES.MANAGER, USER_ROLES.ADMIN].includes(user.role)) {
      throw new AppError('Access denied', 403, 'FORBIDDEN');
    }

    res.json({
      success: true,
      data: { user }
    });
  } catch (error) {
    next(error);
  }
};

export const updateUser = async (req, res, next) => {
  try {
    const { isActive, role, profile, settings } = req.body;
    const targetUser = await User.findById(req.params.id);

    if (!targetUser) {
      throw new AppError('User not found', 404, 'NOT_FOUND');
    }

    if (req.user.role === USER_ROLES.MANAGER) {
      if ([USER_ROLES.MANAGER, USER_ROLES.ADMIN].includes(targetUser.role)) {
        throw new AppError('Cannot modify admin users', 403, 'FORBIDDEN');
      }
      if (role && [USER_ROLES.MANAGER, USER_ROLES.ADMIN].includes(role)) {
        throw new AppError('Cannot assign admin roles', 403, 'FORBIDDEN');
      }
    }

    if (isActive !== undefined) targetUser.isActive = isActive;
    if (role) targetUser.role = role;
    if (profile) targetUser.profile = { ...targetUser.profile.toObject(), ...profile };
    if (settings) targetUser.settings = { ...targetUser.settings.toObject(), ...settings };

    await targetUser.save();
    await logAction(req.user._id, 'ADMIN_UPDATE_USER', 'user', targetUser._id, { isActive, role }, req);

    res.json({
      success: true,
      message: 'User updated',
      data: { user: targetUser.toJSON() }
    });
  } catch (error) {
    next(error);
  }
};

export const deleteUser = async (req, res, next) => {
  try {
    const targetUser = await User.findById(req.params.id);

    if (!targetUser) {
      throw new AppError('User not found', 404, 'NOT_FOUND');
    }

    if ([USER_ROLES.MANAGER, USER_ROLES.ADMIN].includes(targetUser.role)) {
      throw new AppError('Cannot delete admin users', 403, 'FORBIDDEN');
    }

    targetUser.isActive = false;
    await targetUser.save();

    await logAction(req.user._id, 'ADMIN_DEACTIVATE_USER', 'user', targetUser._id, null, req);

    res.json({
      success: true,
      message: 'User deactivated'
    });
  } catch (error) {
    next(error);
  }
};

export const permanentlyDeleteUser = async (req, res, next) => {
  try {
    if (req.user.role !== USER_ROLES.ADMIN) {
      throw new AppError('Only admins can permanently delete users', 403, 'FORBIDDEN');
    }

    const targetUser = await User.findById(req.params.id);

    if (!targetUser) {
      throw new AppError('User not found', 404, 'NOT_FOUND');
    }

    if (targetUser._id.toString() === req.user._id.toString()) {
      throw new AppError('Cannot delete yourself', 403, 'FORBIDDEN');
    }

    if (targetUser.role === USER_ROLES.ADMIN) {
      throw new AppError('Cannot delete admin users', 403, 'FORBIDDEN');
    }

    const userId = targetUser._id;
    const userEmail = targetUser.email;

    await Promise.all([
      ActivityLog.deleteMany({ userId }),
      MoodLog.deleteMany({ userId }),
      WellbeingReport.deleteMany({ userId }),
      Appointment.deleteMany({ $or: [{ userId }, { providerId: userId }] }),
      Certificate.deleteMany({ $or: [{ userId }, { issuedTo: userId }] })
    ]);

    if (targetUser.role === USER_ROLES.PROVIDER) {
      await Provider.deleteOne({ userId });
    }

    await User.findByIdAndDelete(userId);

    await logAction(req.user._id, 'ADMIN_DELETE_USER_PERMANENT', 'user', userId, { 
      deletedEmail: userEmail,
      deletedRole: targetUser.role 
    }, req);

    res.json({
      success: true,
      message: 'User permanently deleted'
    });
  } catch (error) {
    next(error);
  }
};

export const getProviders = async (req, res, next) => {
  try {
    const { verified, search, page = 1, limit = 20 } = req.query;
    const query = {};

    if (verified !== undefined) {
      query['verification.isVerified'] = verified === 'true';
    }

    if (search) {
      query.$or = [
        { 'professionalInfo.title': { $regex: search, $options: 'i' } },
        { 'practice.name': { $regex: search, $options: 'i' } },
        { 'practice.city': { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [providers, total] = await Promise.all([
      Provider.find(query)
        .populate('userId', 'email profile isActive')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Provider.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: {
        providers,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

export const verifyProvider = async (req, res, next) => {
  try {
    const provider = await Provider.findById(req.params.id).populate('userId', 'email profile');
    
    if (!provider) {
      throw new AppError('Provider not found', 404, 'NOT_FOUND');
    }

    const verifiedAt = new Date();
    provider.verification = {
      ...provider.verification,
      isVerified: true,
      verifiedAt,
      verifiedBy: req.user._id
    };
    await provider.save();

    const approverName = req.user.profile?.firstName && req.user.profile?.lastName
      ? `${req.user.profile.firstName} ${req.user.profile.lastName}`
      : req.user.email;

    await logAction(req.user._id, 'ADMIN_VERIFY_PROVIDER', 'provider', provider._id, {
      providerEmail: provider.userId?.email,
      providerName: provider.practice?.name || provider.professionalInfo?.title,
      approverName,
      approverEmail: req.user.email,
      approvedAt: verifiedAt.toISOString()
    }, req);

    res.json({
      success: true,
      message: 'Provider verified',
      data: { provider }
    });
  } catch (error) {
    next(error);
  }
};

export const rejectProvider = async (req, res, next) => {
  try {
    const { reason } = req.body;
    const provider = await Provider.findById(req.params.id).populate('userId', 'email profile');
    
    if (!provider) {
      throw new AppError('Provider not found', 404, 'NOT_FOUND');
    }

    provider.verification = {
      ...provider.verification,
      isVerified: false,
      rejectedAt: new Date(),
      rejectedBy: req.user._id,
      rejectionReason: reason
    };
    await provider.save();

    const rejecterName = req.user.profile?.firstName && req.user.profile?.lastName
      ? `${req.user.profile.firstName} ${req.user.profile.lastName}`
      : req.user.email;

    await logAction(req.user._id, 'ADMIN_REJECT_PROVIDER', 'provider', provider._id, {
      providerEmail: provider.userId?.email,
      providerName: provider.practice?.name || provider.professionalInfo?.title,
      rejecterName,
      rejecterEmail: req.user.email,
      reason
    }, req);

    res.json({
      success: true,
      message: 'Provider rejected',
      data: { provider }
    });
  } catch (error) {
    next(error);
  }
};

export const updateProvider = async (req, res, next) => {
  try {
    const { isActive, verification } = req.body;

    const provider = await Provider.findById(req.params.id);
    if (!provider) {
      throw new AppError('Provider not found', 404, 'NOT_FOUND');
    }

    if (isActive !== undefined) provider.isActive = isActive;
    if (verification) {
      provider.verification = { ...provider.verification.toObject(), ...verification };
    }

    await provider.save();
    await logAction(req.user._id, 'ADMIN_UPDATE_PROVIDER', 'provider', provider._id, { isActive }, req);

    res.json({
      success: true,
      message: 'Provider updated',
      data: { provider }
    });
  } catch (error) {
    next(error);
  }
};

export const suspendProvider = async (req, res, next) => {
  try {
    const { reason } = req.body;
    const provider = await Provider.findById(req.params.id).populate('userId', 'email profile');
    
    if (!provider) {
      throw new AppError('Provider not found', 404, 'NOT_FOUND');
    }

    provider.isActive = false;
    provider.verification = {
      ...provider.verification,
      suspendedAt: new Date(),
      suspendedBy: req.user._id,
      suspensionReason: reason
    };
    await provider.save();

    const adminName = req.user.profile?.firstName && req.user.profile?.lastName
      ? `${req.user.profile.firstName} ${req.user.profile.lastName}`
      : req.user.email;

    await logAction(req.user._id, 'ADMIN_SUSPEND_PROVIDER', 'provider', provider._id, {
      providerEmail: provider.userId?.email,
      providerName: provider.practice?.name || provider.professionalInfo?.title,
      adminName,
      adminEmail: req.user.email,
      reason
    }, req);

    res.json({
      success: true,
      message: 'Provider suspended successfully',
      data: { provider }
    });
  } catch (error) {
    next(error);
  }
};

export const unverifyProvider = async (req, res, next) => {
  try {
    const { reason } = req.body;
    const provider = await Provider.findById(req.params.id).populate('userId', 'email profile');
    
    if (!provider) {
      throw new AppError('Provider not found', 404, 'NOT_FOUND');
    }

    if (!provider.verification?.isVerified) {
      throw new AppError('Provider is not verified', 400, 'INVALID_STATE');
    }

    provider.verification = {
      ...provider.verification,
      isVerified: false,
      status: 'pending',
      unverifiedAt: new Date(),
      unverifiedBy: req.user._id,
      unverificationReason: reason
    };
    await provider.save();

    const adminName = req.user.profile?.firstName && req.user.profile?.lastName
      ? `${req.user.profile.firstName} ${req.user.profile.lastName}`
      : req.user.email;

    await logAction(req.user._id, 'ADMIN_UNVERIFY_PROVIDER', 'provider', provider._id, {
      providerEmail: provider.userId?.email,
      providerName: provider.practice?.name || provider.professionalInfo?.title,
      adminName,
      adminEmail: req.user.email,
      reason
    }, req);

    res.json({
      success: true,
      message: 'Provider verification revoked',
      data: { provider }
    });
  } catch (error) {
    next(error);
  }
};

export const unsuspendProvider = async (req, res, next) => {
  try {
    const provider = await Provider.findById(req.params.id).populate('userId', 'email profile');
    
    if (!provider) {
      throw new AppError('Provider not found', 404, 'NOT_FOUND');
    }

    provider.isActive = true;
    await provider.save();

    const adminName = req.user.profile?.firstName && req.user.profile?.lastName
      ? `${req.user.profile.firstName} ${req.user.profile.lastName}`
      : req.user.email;

    await logAction(req.user._id, 'ADMIN_UNSUSPEND_PROVIDER', 'provider', provider._id, {
      providerEmail: provider.userId?.email,
      providerName: provider.practice?.name || provider.professionalInfo?.title,
      adminName,
      adminEmail: req.user.email
    }, req);

    res.json({
      success: true,
      message: 'Provider unsuspended successfully',
      data: { provider }
    });
  } catch (error) {
    next(error);
  }
};

export const getAuditLogs = async (req, res, next) => {
  try {
    const { userId, action, resource, startDate, endDate, page = 1, limit = 50 } = req.query;
    const query = {};

    if (userId) query.userId = userId;
    if (action) query.action = action;
    if (resource) query.resource = resource;

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [logs, total] = await Promise.all([
      AuditLog.find(query)
        .populate('userId', 'email profile.firstName profile.lastName')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      AuditLog.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: {
        logs,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getDashboardStats = async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const monthAgo = new Date();
    monthAgo.setMonth(monthAgo.getMonth() - 1);

    const [
      totalUsers,
      activeUsers,
      newUsersWeek,
      totalProviders,
      verifiedProviders,
      totalAppointments,
      pendingAppointments,
      totalReports,
      totalCertificates,
      totalActivities,
      totalMoodLogs,
      totalAuditLogs
    ] = await Promise.all([
      User.countDocuments({ role: USER_ROLES.USER }),
      User.countDocuments({ role: USER_ROLES.USER, isActive: true, lastLogin: { $gte: weekAgo } }),
      User.countDocuments({ role: USER_ROLES.USER, createdAt: { $gte: weekAgo } }),
      Provider.countDocuments(),
      Provider.countDocuments({ 'verification.isVerified': true }),
      Appointment.countDocuments(),
      Appointment.countDocuments({ status: 'pending' }),
      WellbeingReport.countDocuments(),
      Certificate.countDocuments(),
      ActivityLog.countDocuments(),
      MoodLog.countDocuments(),
      AuditLog.countDocuments()
    ]);

    const userGrowth = await User.aggregate([
      { $match: { createdAt: { $gte: monthAgo } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      success: true,
      data: {
        users: { total: totalUsers, active: activeUsers, newThisWeek: newUsersWeek },
        providers: { total: totalProviders, verified: verifiedProviders },
        appointments: { total: totalAppointments, pending: pendingAppointments },
        reports: { total: totalReports },
        certificates: { total: totalCertificates },
        activities: { total: totalActivities },
        moodLogs: { total: totalMoodLogs },
        auditLogs: { total: totalAuditLogs },
        userGrowth
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getSuperAdminStats = async (req, res, next) => {
  try {
    if (req.user.role !== USER_ROLES.ADMIN) {
      throw new AppError('Access denied', 403, 'FORBIDDEN');
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const monthAgo = new Date();
    monthAgo.setMonth(monthAgo.getMonth() - 1);

    const [
      totalUsers,
      totalProviders,
      totalAdmins,
      verifiedProviders,
      totalCertificates,
      totalActivities,
      totalMoodLogs,
      totalAuditLogs,
      activitiesThisWeek,
      moodLogsThisWeek,
      certificatesThisWeek,
      certificatesByType,
      activityTrends,
      moodTrends,
      recentAuditLogs,
      loginAttempts,
      providerApprovals
    ] = await Promise.all([
      User.countDocuments({ role: USER_ROLES.USER }),
      Provider.countDocuments(),
      User.countDocuments({ role: { $in: [USER_ROLES.MANAGER, USER_ROLES.ADMIN] } }),
      Provider.countDocuments({ 'verification.isVerified': true }),
      Certificate.countDocuments(),
      ActivityLog.countDocuments(),
      MoodLog.countDocuments(),
      AuditLog.countDocuments(),
      ActivityLog.countDocuments({ createdAt: { $gte: weekAgo } }),
      MoodLog.countDocuments({ createdAt: { $gte: weekAgo } }),
      Certificate.countDocuments({ createdAt: { $gte: weekAgo } }),
      Certificate.aggregate([
        { $group: { _id: '$type', count: { $sum: 1 } } }
      ]),
      ActivityLog.aggregate([
        { $match: { createdAt: { $gte: monthAgo } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } }
      ]),
      MoodLog.aggregate([
        { $match: { createdAt: { $gte: monthAgo } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 }, avgScore: { $avg: '$moodScore' } } },
        { $sort: { _id: 1 } }
      ]),
      AuditLog.find()
        .populate('userId', 'email profile.firstName profile.lastName')
        .sort({ createdAt: -1 })
        .limit(20),
      AuditLog.countDocuments({ action: 'LOGIN', createdAt: { $gte: weekAgo } }),
      AuditLog.find({ action: 'ADMIN_VERIFY_PROVIDER' })
        .populate('userId', 'email profile.firstName profile.lastName')
        .sort({ createdAt: -1 })
        .limit(10)
    ]);

    const auditActionCounts = await AuditLog.aggregate([
      { $match: { createdAt: { $gte: monthAgo } } },
      { $group: { _id: '$action', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    const dailyAuditTrends = await AuditLog.aggregate([
      { $match: { createdAt: { $gte: weekAgo } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      success: true,
      data: {
        overview: {
          totalUsers,
          totalProviders,
          verifiedProviders,
          totalAdmins,
          totalCertificates,
          totalActivities,
          totalMoodLogs,
          totalAuditLogs
        },
        thisWeek: {
          activities: activitiesThisWeek,
          moodLogs: moodLogsThisWeek,
          certificates: certificatesThisWeek,
          loginAttempts
        },
        certificatesByType,
        trends: {
          activities: activityTrends,
          moods: moodTrends,
          auditLogs: dailyAuditTrends
        },
        auditActionCounts,
        recentAuditLogs,
        providerApprovals
      }
    });
  } catch (error) {
    next(error);
  }
};

export const createAdmin = async (req, res, next) => {
  try {
    if (req.user.role !== USER_ROLES.ADMIN) {
      throw new AppError('Only admins can create managers', 403, 'FORBIDDEN');
    }

    const { email, password, firstName, lastName, role } = req.body;

    if (!email || !password || !firstName || !lastName) {
      throw new AppError('Email, password, first name, and last name are required', 400, 'VALIDATION_ERROR');
    }

    if (password.length < 8) {
      throw new AppError('Password must be at least 8 characters', 400, 'VALIDATION_ERROR');
    }

    const adminRole = role === 'admin' ? USER_ROLES.ADMIN : USER_ROLES.MANAGER;

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      throw new AppError('Email already exists', 409, 'EMAIL_EXISTS');
    }

    const admin = await User.create({
      email: email.toLowerCase(),
      password,
      role: adminRole,
      profile: { firstName, lastName, displayName: `${firstName} ${lastName}` },
      verification: { emailVerified: true }
    });

    await logAction(req.user._id, 'CREATE_ADMIN', 'user', admin._id, { email, role: adminRole }, req);

    res.status(201).json({
      success: true,
      message: 'Admin created',
      data: { user: admin.toJSON() }
    });
  } catch (error) {
    next(error);
  }
};

export const getAdmins = async (req, res, next) => {
  try {
    if (req.user.role !== USER_ROLES.ADMIN) {
      throw new AppError('Access denied', 403, 'FORBIDDEN');
    }

    const admins = await User.find({ 
      role: { $in: [USER_ROLES.MANAGER, USER_ROLES.ADMIN] } 
    }).select('-password');

    res.json({
      success: true,
      data: { admins }
    });
  } catch (error) {
    next(error);
  }
};

export const getSystemSettings = async (req, res, next) => {
  try {
    if (req.user.role !== USER_ROLES.ADMIN) {
      throw new AppError('Access denied', 403, 'FORBIDDEN');
    }

    const settings = {
      emailEnabled: !!process.env.RESEND_API_KEY,
      aiEnabled: !!process.env.GEMINI_API_KEY,
      environment: process.env.NODE_ENV || 'development',
      version: '1.0.0'
    };

    res.json({
      success: true,
      data: { settings }
    });
  } catch (error) {
    next(error);
  }
};

export const getAnonymizedAnalytics = async (req, res, next) => {
  try {
    if (req.user.role !== USER_ROLES.ADMIN) {
      throw new AppError('Access denied', 403, 'FORBIDDEN');
    }

    const [
      avgMoodScore,
      moodDistribution,
      activityDistribution,
      wellbeingLevelDistribution
    ] = await Promise.all([
      MoodLog.aggregate([
        { $group: { _id: null, avgScore: { $avg: '$moodScore' } } }
      ]),
      MoodLog.aggregate([
        { $group: { _id: '$mood', count: { $sum: 1 } } }
      ]),
      ActivityLog.aggregate([
        { $group: { _id: '$category', count: { $sum: 1 } } }
      ]),
      WellbeingReport.aggregate([
        { $group: { _id: '$wellbeingLevel', count: { $sum: 1 } } }
      ])
    ]);

    res.json({
      success: true,
      data: {
        avgMoodScore: avgMoodScore[0]?.avgScore || 0,
        moodDistribution,
        activityDistribution,
        wellbeingLevelDistribution
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getAIInsights = async (req, res, next) => {
  try {
    const today = new Date();
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const [
      totalUsers,
      activeUsers,
      newUsersThisWeek,
      totalProviders,
      verifiedProviders,
      totalMoodLogs,
      avgMoodResult,
      lowWellbeingCount,
      totalAppointments,
      pendingAppointments
    ] = await Promise.all([
      User.countDocuments({ role: USER_ROLES.USER }),
      User.countDocuments({ role: USER_ROLES.USER, isActive: true, lastLogin: { $gte: weekAgo } }),
      User.countDocuments({ role: USER_ROLES.USER, createdAt: { $gte: weekAgo } }),
      Provider.countDocuments(),
      Provider.countDocuments({ 'verification.isVerified': true }),
      MoodLog.countDocuments(),
      MoodLog.aggregate([{ $group: { _id: null, avgScore: { $avg: '$moodScore' } } }]),
      WellbeingReport.countDocuments({ overallScore: { $lt: 40 } }),
      Appointment.countDocuments(),
      Appointment.countDocuments({ status: 'pending' })
    ]);

    const pendingVerifications = totalProviders - verifiedProviders;
    const userGrowthRate = totalUsers > 0 ? Math.round((newUsersThisWeek / totalUsers) * 100) : 0;
    const engagementRate = totalUsers > 0 ? Math.round((activeUsers / totalUsers) * 100) : 0;
    const avgMoodScore = avgMoodResult[0]?.avgScore || null;

    const platformData = {
      totalUsers,
      activeUsers,
      newUsersThisWeek,
      totalProviders,
      verifiedProviders,
      pendingVerifications,
      totalMoodLogs,
      avgMoodScore,
      lowWellbeingUsers: lowWellbeingCount,
      totalAppointments,
      pendingAppointments,
      userGrowthRate,
      engagementRate
    };

    const insights = await generateAdminInsights(platformData);

    res.json({
      success: true,
      data: { insights, platformData }
    });
  } catch (error) {
    next(error);
  }
};

export const getPlatformActivity = async (req, res, next) => {
  try {
    const { type, userId, startDate, endDate, page = 1, limit = 50 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const dateFilter = {};
    if (startDate) dateFilter.$gte = new Date(startDate);
    if (endDate) dateFilter.$lte = new Date(endDate);

    const activities = [];
    const activityCounts = {};

    const auditQuery = {};
    if (userId) auditQuery.userId = userId;
    if (startDate || endDate) auditQuery.createdAt = dateFilter;

    if (!type || type === 'all' || type === 'login') {
      const logins = await AuditLog.find({ ...auditQuery, action: { $in: ['LOGIN', 'LOGOUT', 'REGISTER'] } })
        .populate('userId', 'email profile.firstName profile.lastName')
        .sort({ createdAt: -1 })
        .limit(100);
      
      logins.forEach(log => {
        activities.push({
          _id: log._id,
          type: 'login',
          action: log.action,
          userId: log.userId?._id,
          userName: log.userId ? `${log.userId.profile?.firstName || ''} ${log.userId.profile?.lastName || ''}`.trim() || log.userId.email : 'Unknown',
          email: log.userId?.email,
          details: log.metadata,
          createdAt: log.createdAt
        });
      });
      activityCounts.logins = logins.length;
    }

    if (!type || type === 'all' || type === 'activity') {
      const activityQuery = {};
      if (userId) activityQuery.userId = userId;
      if (startDate || endDate) activityQuery.createdAt = dateFilter;

      const activityLogs = await ActivityLog.find(activityQuery)
        .populate('userId', 'email profile.firstName profile.lastName')
        .sort({ createdAt: -1 })
        .limit(100);

      activityLogs.forEach(log => {
        activities.push({
          _id: log._id,
          type: 'activity',
          action: 'ACTIVITY_LOGGED',
          userId: log.userId?._id,
          userName: log.userId ? `${log.userId.profile?.firstName || ''} ${log.userId.profile?.lastName || ''}`.trim() || log.userId.email : 'Unknown',
          email: log.userId?.email,
          details: { category: log.category, name: log.name },
          createdAt: log.createdAt
        });
      });
      activityCounts.activities = activityLogs.length;
    }

    if (!type || type === 'all' || type === 'mood') {
      const moodQuery = {};
      if (userId) moodQuery.userId = userId;
      if (startDate || endDate) moodQuery.createdAt = dateFilter;

      const moodLogs = await MoodLog.find(moodQuery)
        .populate('userId', 'email profile.firstName profile.lastName')
        .sort({ createdAt: -1 })
        .limit(100);

      moodLogs.forEach(log => {
        activities.push({
          _id: log._id,
          type: 'mood',
          action: 'MOOD_LOGGED',
          userId: log.userId?._id,
          userName: log.userId ? `${log.userId.profile?.firstName || ''} ${log.userId.profile?.lastName || ''}`.trim() || log.userId.email : 'Unknown',
          email: log.userId?.email,
          details: { mood: log.mood, moodScore: log.moodScore },
          createdAt: log.createdAt
        });
      });
      activityCounts.moods = moodLogs.length;
    }

    if (!type || type === 'all' || type === 'report') {
      const reportQuery = {};
      if (userId) reportQuery.userId = userId;
      if (startDate || endDate) reportQuery.createdAt = dateFilter;

      const reports = await WellbeingReport.find(reportQuery)
        .populate('userId', 'email profile.firstName profile.lastName')
        .sort({ createdAt: -1 })
        .limit(100);

      reports.forEach(report => {
        activities.push({
          _id: report._id,
          type: 'report',
          action: 'REPORT_GENERATED',
          userId: report.userId?._id,
          userName: report.userId ? `${report.userId.profile?.firstName || ''} ${report.userId.profile?.lastName || ''}`.trim() || report.userId.email : 'Unknown',
          email: report.userId?.email,
          details: { wellbeingLevel: report.wellbeingLevel, overallScore: report.overallScore },
          createdAt: report.createdAt
        });
      });
      activityCounts.reports = reports.length;
    }

    if (!type || type === 'all' || type === 'appointment') {
      const appointmentQuery = {};
      if (userId) appointmentQuery.userId = userId;
      if (startDate || endDate) appointmentQuery.createdAt = dateFilter;

      const appointments = await Appointment.find(appointmentQuery)
        .populate('userId', 'email profile.firstName profile.lastName')
        .sort({ createdAt: -1 })
        .limit(100);

      appointments.forEach(apt => {
        activities.push({
          _id: apt._id,
          type: 'appointment',
          action: 'APPOINTMENT_CREATED',
          userId: apt.userId?._id,
          userName: apt.userId ? `${apt.userId.profile?.firstName || ''} ${apt.userId.profile?.lastName || ''}`.trim() || apt.userId.email : 'Unknown',
          email: apt.userId?.email,
          details: { status: apt.status, type: apt.type },
          createdAt: apt.createdAt
        });
      });
      activityCounts.appointments = appointments.length;
    }

    activities.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const total = activities.length;
    const paginatedActivities = activities.slice(skip, skip + parseInt(limit));

    res.json({
      success: true,
      data: {
        activities: paginatedActivities,
        counts: activityCounts,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getReportedChats = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const query = {};
    if (status) query.status = status;

    const [reports, total] = await Promise.all([
      ChatReport.find(query)
        .populate('reporterId', 'email profile.firstName profile.lastName')
        .populate('reportedUserId', 'email profile.firstName profile.lastName')
        .select('-messages')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      ChatReport.countDocuments(query)
    ]);

    const pendingCount = await ChatReport.countDocuments({ status: 'pending' });

    res.json({
      success: true,
      data: {
        reports: reports.map(r => ({
          ...r.toObject(),
          reporterName: r.reporterId ? `${r.reporterId.profile?.firstName || ''} ${r.reporterId.profile?.lastName || ''}`.trim() || r.reporterId.email : 'Unknown',
          reportedUserName: r.reportedUserId ? `${r.reportedUserId.profile?.firstName || ''} ${r.reportedUserId.profile?.lastName || ''}`.trim() || r.reportedUserId.email : 'Unknown'
        })),
        pendingCount,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getReportedChatDetails = async (req, res, next) => {
  try {
    const report = await ChatReport.findById(req.params.id)
      .populate('reporterId', 'email profile.firstName profile.lastName')
      .populate('reportedUserId', 'email profile.firstName profile.lastName')
      .populate('reviewedBy', 'email profile.firstName profile.lastName');

    if (!report) {
      throw new AppError('Report not found', 404, 'NOT_FOUND');
    }

    res.json({
      success: true,
      data: {
        report: {
          ...report.toObject(),
          reporterName: report.reporterId ? `${report.reporterId.profile?.firstName || ''} ${report.reporterId.profile?.lastName || ''}`.trim() || report.reporterId.email : 'Unknown',
          reportedUserName: report.reportedUserId ? `${report.reportedUserId.profile?.firstName || ''} ${report.reportedUserId.profile?.lastName || ''}`.trim() || report.reportedUserId.email : 'Unknown'
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

export const resolveReportedChat = async (req, res, next) => {
  try {
    const { status, resolution } = req.body;

    const validStatuses = ['reviewed', 'resolved', 'dismissed'];
    if (!validStatuses.includes(status)) {
      throw new AppError('Invalid status', 400, 'VALIDATION_ERROR');
    }

    const report = await ChatReport.findById(req.params.id);

    if (!report) {
      throw new AppError('Report not found', 404, 'NOT_FOUND');
    }

    report.status = status;
    report.resolution = resolution;
    report.reviewedBy = req.user._id;
    report.reviewedAt = new Date();
    await report.save();

    await logAction(req.user._id, 'CHAT_REPORT_RESOLVED', 'chatReport', report._id, {
      status,
      resolution
    }, req);

    res.json({
      success: true,
      message: 'Report resolved successfully',
      data: { report }
    });
  } catch (error) {
    next(error);
  }
};

export const getSubscriptionAnalytics = async (req, res, next) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [
      planDistribution,
      statusDistribution,
      totalSubscriptions,
      trialUsers,
      paidUsers,
      recentUpgrades,
      recentCancellations,
      monthlyTrend
    ] = await Promise.all([
      Subscription.aggregate([
        { $group: { _id: '$plan', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      Subscription.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      Subscription.countDocuments(),
      Subscription.countDocuments({ status: 'trial' }),
      Subscription.countDocuments({
        plan: { $ne: 'free' },
        status: 'active',
        stripeSubscriptionId: { $ne: null }
      }),
      Subscription.find({
        plan: { $ne: 'free' },
        updatedAt: { $gte: thirtyDaysAgo }
      })
        .populate('userId', 'email profile.firstName profile.lastName')
        .sort({ updatedAt: -1 })
        .limit(20)
        .lean(),
      Subscription.find({
        status: 'cancelled',
        cancelledAt: { $gte: thirtyDaysAgo }
      })
        .populate('userId', 'email profile.firstName profile.lastName')
        .sort({ cancelledAt: -1 })
        .limit(10)
        .lean(),
      Subscription.aggregate([
        { $match: { plan: { $ne: 'free' }, updatedAt: { $gte: thirtyDaysAgo } } },
        { $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$updatedAt' } },
          count: { $sum: 1 }
        }},
        { $sort: { _id: 1 } }
      ])
    ]);

    const avgUsage = await Subscription.aggregate([
      { $group: {
        _id: null,
        avgActivityLogs: { $avg: '$usage.activityLogs' },
        avgMoodLogs: { $avg: '$usage.moodLogs' },
        avgReportDownloads: { $avg: '$usage.reportDownloads' },
        avgDirectoryAccess: { $avg: '$usage.directoryAccess' },
        avgAiInteractions: { $avg: '$usage.aiInteractions' }
      }}
    ]);

    const topUsers = await Subscription.find({ plan: { $ne: 'free' } })
      .populate('userId', 'email profile.firstName profile.lastName')
      .sort({ 'usage.activityLogs': -1 })
      .limit(10)
      .lean();

    res.json({
      success: true,
      data: {
        overview: {
          total: totalSubscriptions,
          trial: trialUsers,
          paid: paidUsers,
          free: totalSubscriptions - trialUsers - paidUsers
        },
        planDistribution,
        statusDistribution,
        avgUsage: avgUsage[0] || {},
        recentUpgrades: recentUpgrades.map(s => ({
          email: s.userId?.email,
          name: s.userId ? `${s.userId.profile?.firstName || ''} ${s.userId.profile?.lastName || ''}`.trim() : 'Unknown',
          plan: s.plan,
          status: s.status,
          date: s.updatedAt
        })),
        recentCancellations: recentCancellations.map(s => ({
          email: s.userId?.email,
          name: s.userId ? `${s.userId.profile?.firstName || ''} ${s.userId.profile?.lastName || ''}`.trim() : 'Unknown',
          plan: s.plan,
          cancelledAt: s.cancelledAt
        })),
        monthlyTrend,
        topUsers: topUsers.map(s => ({
          email: s.userId?.email,
          name: s.userId ? `${s.userId.profile?.firstName || ''} ${s.userId.profile?.lastName || ''}`.trim() : 'Unknown',
          plan: s.plan,
          usage: s.usage
        }))
      }
    });
  } catch (error) {
    next(error);
  }
};
