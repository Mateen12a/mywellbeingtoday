import Certificate from '../models/Certificate.js';
import User from '../models/User.js';
import MoodLog from '../models/MoodLog.js';
import ActivityLog from '../models/ActivityLog.js';
import WellbeingReport from '../models/WellbeingReport.js';
import { AppError } from '../middlewares/errorHandler.js';
import { logAction } from '../middlewares/auditLog.js';
import { generateCertificateSuggestion } from '../services/aiService.js';
import crypto from 'crypto';
import { uploadCertificate, isCloudinaryConfigured } from '../services/cloudinaryService.js';

export const getCertificates = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, type, status } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const query = { userId: req.user._id };

    if (type) {
      query.type = type;
    }

    if (status) {
      query.status = status;
    }

    const [certificates, total] = await Promise.all([
      Certificate.find(query)
        .populate('providerId', 'businessName')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Certificate.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: {
        certificates,
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

export const getCertificate = async (req, res, next) => {
  try {
    const certificate = await Certificate.findOne({
      _id: req.params.id,
      userId: req.user._id
    }).populate('providerId', 'businessName contactEmail contactPhone');

    if (!certificate) {
      throw new AppError('Certificate not found', 404, 'NOT_FOUND');
    }

    res.json({
      success: true,
      data: { certificate }
    });
  } catch (error) {
    next(error);
  }
};

export const createCertificate = async (req, res, next) => {
  try {
    const {
      userId,
      type,
      title,
      description,
      issueDate,
      expiryDate,
      validFrom,
      validUntil,
      documentUrl,
      issuedBy,
      notes
    } = req.body;

    if (!userId || !type || !title || !issueDate) {
      throw new AppError('User ID, type, title, and issue date are required', 400, 'VALIDATION_ERROR');
    }

    let finalDocumentUrl = documentUrl;
    if (documentUrl && documentUrl.startsWith('data:') && isCloudinaryConfigured()) {
      try {
        const cloudResult = await uploadCertificate(documentUrl, userId);
        finalDocumentUrl = cloudResult.url;
      } catch (err) {
        console.error('[CERTIFICATE] Cloudinary upload failed:', err.message);
      }
    }

    const verificationCode = crypto.randomBytes(8).toString('hex').toUpperCase();

    const certificate = await Certificate.create({
      userId,
      providerId: req.user.providerId,
      type,
      title,
      description,
      issueDate: new Date(issueDate),
      expiryDate: expiryDate ? new Date(expiryDate) : undefined,
      validFrom: validFrom ? new Date(validFrom) : undefined,
      validUntil: validUntil ? new Date(validUntil) : undefined,
      documentUrl: finalDocumentUrl,
      issuedBy,
      notes,
      verificationCode,
      status: 'active'
    });

    await logAction(req.user._id, 'CREATE_CERTIFICATE', 'certificate', certificate._id, { type, title, userId }, req);

    res.status(201).json({
      success: true,
      message: 'Certificate created successfully',
      data: { certificate }
    });
  } catch (error) {
    next(error);
  }
};

export const updateCertificate = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    delete updates.userId;
    delete updates.verificationCode;
    delete updates.createdAt;

    if (updates.issueDate) {
      updates.issueDate = new Date(updates.issueDate);
    }
    if (updates.expiryDate) {
      updates.expiryDate = new Date(updates.expiryDate);
    }
    if (updates.validFrom) {
      updates.validFrom = new Date(updates.validFrom);
    }
    if (updates.validUntil) {
      updates.validUntil = new Date(updates.validUntil);
    }

    let query = { _id: id };
    
    if (req.user.role === 'provider') {
      query.providerId = req.user.providerId;
    } else {
      query.userId = req.user._id;
    }

    const certificate = await Certificate.findOneAndUpdate(
      query,
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!certificate) {
      throw new AppError('Certificate not found or access denied', 404, 'NOT_FOUND');
    }

    await logAction(req.user._id, 'UPDATE_CERTIFICATE', 'certificate', certificate._id, null, req);

    res.json({
      success: true,
      message: 'Certificate updated',
      data: { certificate }
    });
  } catch (error) {
    next(error);
  }
};

export const deleteCertificate = async (req, res, next) => {
  try {
    const { id } = req.params;

    let query = { _id: id };
    
    if (req.user.role === 'provider') {
      query.providerId = req.user.providerId;
    } else {
      query.userId = req.user._id;
    }

    const certificate = await Certificate.findOneAndDelete(query);

    if (!certificate) {
      throw new AppError('Certificate not found or access denied', 404, 'NOT_FOUND');
    }

    await logAction(req.user._id, 'DELETE_CERTIFICATE', 'certificate', id, null, req);

    res.json({
      success: true,
      message: 'Certificate deleted'
    });
  } catch (error) {
    next(error);
  }
};

export const getCertificateSuggestion = async (req, res, next) => {
  try {
    const { userId, certificateType } = req.body;

    if (!userId) {
      throw new AppError('User ID is required', 400, 'VALIDATION_ERROR');
    }

    const user = await User.findById(userId).select('firstName lastName profile');
    if (!user) {
      throw new AppError('User not found', 404, 'NOT_FOUND');
    }

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [recentMoods, recentActivities, latestReport] = await Promise.all([
      MoodLog.find({ userId, date: { $gte: thirtyDaysAgo } })
        .sort({ date: -1 })
        .limit(10)
        .lean(),
      ActivityLog.find({ userId, date: { $gte: thirtyDaysAgo } })
        .sort({ date: -1 })
        .limit(10)
        .lean(),
      WellbeingReport.findOne({ userId })
        .sort({ createdAt: -1 })
        .lean()
    ]);

    const userData = {
      patientName: `${user.firstName} ${user.lastName}`,
      wellbeingData: latestReport ? {
        overallScore: latestReport.overallScore,
        wellbeingLevel: latestReport.wellbeingLevel
      } : null,
      recentMoods: recentMoods.map(m => ({
        mood: m.mood,
        moodScore: m.moodScore,
        date: m.date
      })),
      recentActivities: recentActivities.map(a => ({
        title: a.title,
        category: a.category,
        duration: a.duration
      }))
    };

    const suggestion = await generateCertificateSuggestion(
      certificateType || 'other',
      userData
    );

    res.json({
      success: true,
      data: { suggestion }
    });
  } catch (error) {
    next(error);
  }
};
