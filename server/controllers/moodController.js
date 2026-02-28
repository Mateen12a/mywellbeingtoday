import { MoodLog } from '../models/index.js';
import { AppError } from '../middlewares/errorHandler.js';
import { logAction } from '../middlewares/auditLog.js';
import { generateMoodFeedback } from '../services/aiService.js';
import { autoGenerateReport } from '../services/reportService.js';
import { createMoodNotification } from '../services/notificationService.js';
import { sendNotification } from '../services/emailService.js';
import { sendPushToUser } from '../services/pushService.js';
import { incrementUsage, checkUsageLimit } from '../routes/subscriptionRoutes.js';

export const createMoodLog = async (req, res, next) => {
  try {
    const usageCheck = await checkUsageLimit(req.user._id, 'moodLogs');
    if (!usageCheck.allowed) {
      return res.status(403).json({ success: false, message: usageCheck.reason });
    }

    const { mood, moodScore, energyLevel, stressLevel, anxietyLevel, sleepQuality, factors, notes, triggers, copingStrategies, inputMethod, voiceTranscript, timeOfDay, date } = req.body;

    const moodLog = await MoodLog.create({
      userId: req.user._id,
      date: date ? new Date(date) : new Date(),
      mood,
      moodScore,
      energyLevel,
      stressLevel,
      anxietyLevel,
      sleepQuality,
      factors,
      notes,
      triggers,
      copingStrategies,
      inputMethod,
      voiceTranscript,
      timeOfDay
    });

    await logAction(req.user._id, 'CREATE_MOOD', 'mood', moodLog._id, { mood, moodScore }, req);
    incrementUsage(req.user._id, 'moodLogs').catch(err => console.error('[USAGE]', err));

    createMoodNotification(req.user._id, mood, moodScore).catch(err => console.error('[NOTIFICATION]', err));
    sendPushToUser(req.user._id, 'mood_logged').catch(err => console.error('[PUSH]', err));

    if (req.user.settings?.notifications?.email !== false) {
      sendNotification(
        req.user.email,
        req.user.profile?.firstName || 'there',
        'Mood Tracked Successfully',
        `<p>Your mood "${mood}" (score: ${moodScore}/10) has been recorded.</p><p>Keep tracking regularly for better wellbeing insights!</p>`,
        null,
        null
      ).catch(err => console.error('[EMAIL]', err));
    }

    // Generate AI feedback for this mood
    const recentMoods = await MoodLog.find({ userId: req.user._id })
      .sort({ date: -1 })
      .limit(5)
      .lean();
    
    let aiFeedback = {};
    try {
      aiFeedback = await generateMoodFeedback(moodLog.toObject(), recentMoods);
    } catch (error) {
      console.error('[MOOD] AI feedback error:', error.message);
      aiFeedback = { feedback: 'Mood logged successfully.', tips: [], source: 'fallback' };
    }

    // Auto-generate wellbeing report
    let report = null;
    try {
      report = await autoGenerateReport(req.user._id);
    } catch (error) {
      console.error('[MOOD] Report generation error:', error.message);
    }

    res.status(201).json({
      success: true,
      message: 'Mood logged successfully',
      data: { 
        moodLog,
        aiFeedback,
        report
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getMoodLogs = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, mood, startDate, endDate } = req.query;

    const query = { userId: req.user._id };

    if (mood) {
      query.mood = mood;
    }

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [moodLogs, total] = await Promise.all([
      MoodLog.find(query)
        .sort({ date: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      MoodLog.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: {
        moodLogs,
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

export const getMoodLog = async (req, res, next) => {
  try {
    const moodLog = await MoodLog.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!moodLog) {
      throw new AppError('Mood log not found', 404, 'NOT_FOUND');
    }

    res.json({
      success: true,
      data: { moodLog }
    });
  } catch (error) {
    next(error);
  }
};

export const updateMoodLog = async (req, res, next) => {
  try {
    const moodLog = await MoodLog.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { $set: req.body },
      { new: true, runValidators: true }
    );

    if (!moodLog) {
      throw new AppError('Mood log not found', 404, 'NOT_FOUND');
    }

    await logAction(req.user._id, 'UPDATE_MOOD', 'mood', moodLog._id, null, req);

    res.json({
      success: true,
      message: 'Mood log updated',
      data: { moodLog }
    });
  } catch (error) {
    next(error);
  }
};

export const deleteMoodLog = async (req, res, next) => {
  try {
    const moodLog = await MoodLog.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!moodLog) {
      throw new AppError('Mood log not found', 404, 'NOT_FOUND');
    }

    await logAction(req.user._id, 'DELETE_MOOD', 'mood', req.params.id, null, req);

    res.json({
      success: true,
      message: 'Mood log deleted'
    });
  } catch (error) {
    next(error);
  }
};

export const getTodayMood = async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const moodLogs = await MoodLog.find({
      userId: req.user._id,
      date: { $gte: today, $lt: tomorrow }
    }).sort({ date: -1 });

    const summary = moodLogs.length > 0 ? {
      latestMood: moodLogs[0].mood,
      latestScore: moodLogs[0].moodScore,
      avgScore: moodLogs.reduce((sum, m) => sum + m.moodScore, 0) / moodLogs.length,
      avgEnergy: moodLogs.reduce((sum, m) => sum + (m.energyLevel || 0), 0) / moodLogs.length,
      avgStress: moodLogs.reduce((sum, m) => sum + (m.stressLevel || 0), 0) / moodLogs.length,
      logsCount: moodLogs.length
    } : null;

    res.json({
      success: true,
      data: { moodLogs, summary }
    });
  } catch (error) {
    next(error);
  }
};

export const getMoodStats = async (req, res, next) => {
  try {
    const { days = 30 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const moodDistribution = await MoodLog.aggregate([
      {
        $match: {
          userId: req.user._id,
          date: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$mood',
          count: { $sum: 1 },
          avgScore: { $avg: '$moodScore' }
        }
      }
    ]);

    const dailyAvg = await MoodLog.aggregate([
      {
        $match: {
          userId: req.user._id,
          date: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
          avgMoodScore: { $avg: '$moodScore' },
          avgEnergy: { $avg: '$energyLevel' },
          avgStress: { $avg: '$stressLevel' },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } },
      {
        $project: {
          _id: 0,
          date: '$_id',
          averageMood: '$avgMoodScore',
          avgEnergy: 1,
          avgStress: 1,
          count: 1
        }
      }
    ]);

    const overallStats = await MoodLog.aggregate([
      {
        $match: {
          userId: req.user._id,
          date: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: null,
          avgMoodScore: { $avg: '$moodScore' },
          avgEnergy: { $avg: '$energyLevel' },
          avgStress: { $avg: '$stressLevel' },
          avgAnxiety: { $avg: '$anxietyLevel' },
          totalLogs: { $sum: 1 }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        moodDistribution,
        daily: dailyAvg,
        overall: overallStats[0] || null,
        period: parseInt(days)
      }
    });
  } catch (error) {
    next(error);
  }
};

export const quickMoodLog = async (req, res, next) => {
  try {
    const { moodScore, mood } = req.body;

    const moodLog = await MoodLog.create({
      userId: req.user._id,
      date: new Date(),
      mood: mood || getMoodFromScore(moodScore),
      moodScore,
      inputMethod: 'quick'
    });

    res.status(201).json({
      success: true,
      message: 'Quick mood logged',
      data: { moodLog }
    });
  } catch (error) {
    next(error);
  }
};

function getMoodFromScore(score) {
  if (score >= 8) return 'happy';
  if (score >= 6) return 'calm';
  if (score >= 4) return 'tired';
  if (score >= 2) return 'stressed';
  return 'sad';
}
