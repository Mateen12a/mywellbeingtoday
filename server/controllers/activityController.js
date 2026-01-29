import { ActivityLog } from '../models/index.js';
import { AppError } from '../middlewares/errorHandler.js';
import { logAction } from '../middlewares/auditLog.js';
import { generateActivitySuggestions } from '../services/aiService.js';
import { autoGenerateReport } from '../services/reportService.js';

export const createActivity = async (req, res, next) => {
  try {
    const { category, title, description, duration, intensity, metrics, notes, inputMethod, voiceTranscript, tags, location, weather, date } = req.body;

    const activity = await ActivityLog.create({
      userId: req.user._id,
      date: date ? new Date(date) : new Date(),
      category,
      title,
      description,
      duration,
      intensity,
      metrics,
      notes,
      inputMethod,
      voiceTranscript,
      tags,
      location,
      weather
    });

    await logAction(req.user._id, 'CREATE_ACTIVITY', 'activity', activity._id, { category, title }, req);

    // Generate AI suggestions for this activity
    const recentActivities = await ActivityLog.find({ userId: req.user._id })
      .sort({ date: -1 })
      .limit(5)
      .lean();
    
    let aiSuggestions = {};
    try {
      aiSuggestions = await generateActivitySuggestions(activity.toObject(), recentActivities);
    } catch (error) {
      console.error('[ACTIVITY] AI suggestions error:', error.message);
      aiSuggestions = { suggestions: [], source: 'fallback' };
    }

    // Auto-generate wellbeing report
    let report = null;
    try {
      report = await autoGenerateReport(req.user._id);
    } catch (error) {
      console.error('[ACTIVITY] Report generation error:', error.message);
    }

    res.status(201).json({
      success: true,
      message: 'Activity logged successfully',
      data: { 
        activity,
        aiSuggestions,
        report
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getActivities = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, category, startDate, endDate, search } = req.query;

    const query = { userId: req.user._id };

    if (category) {
      query.category = category;
    }

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { notes: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [activities, total] = await Promise.all([
      ActivityLog.find(query)
        .sort({ date: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      ActivityLog.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: {
        activities,
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

export const getActivity = async (req, res, next) => {
  try {
    const activity = await ActivityLog.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!activity) {
      throw new AppError('Activity not found', 404, 'NOT_FOUND');
    }

    res.json({
      success: true,
      data: { activity }
    });
  } catch (error) {
    next(error);
  }
};

export const updateActivity = async (req, res, next) => {
  try {
    const activity = await ActivityLog.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { $set: req.body },
      { new: true, runValidators: true }
    );

    if (!activity) {
      throw new AppError('Activity not found', 404, 'NOT_FOUND');
    }

    await logAction(req.user._id, 'UPDATE_ACTIVITY', 'activity', activity._id, null, req);

    res.json({
      success: true,
      message: 'Activity updated',
      data: { activity }
    });
  } catch (error) {
    next(error);
  }
};

export const deleteActivity = async (req, res, next) => {
  try {
    const activity = await ActivityLog.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!activity) {
      throw new AppError('Activity not found', 404, 'NOT_FOUND');
    }

    await logAction(req.user._id, 'DELETE_ACTIVITY', 'activity', req.params.id, null, req);

    res.json({
      success: true,
      message: 'Activity deleted'
    });
  } catch (error) {
    next(error);
  }
};

export const getTodayActivities = async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const activities = await ActivityLog.find({
      userId: req.user._id,
      date: { $gte: today, $lt: tomorrow }
    }).sort({ date: -1 });

    const summary = {
      totalActivities: activities.length,
      totalDuration: activities.reduce((sum, a) => sum + (a.duration || 0), 0),
      byCategory: {}
    };

    activities.forEach(a => {
      if (!summary.byCategory[a.category]) {
        summary.byCategory[a.category] = { count: 0, duration: 0 };
      }
      summary.byCategory[a.category].count++;
      summary.byCategory[a.category].duration += a.duration || 0;
    });

    res.json({
      success: true,
      data: { activities, summary }
    });
  } catch (error) {
    next(error);
  }
};

export const getActivityStats = async (req, res, next) => {
  try {
    const { days = 30 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const stats = await ActivityLog.aggregate([
      {
        $match: {
          userId: req.user._id,
          date: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          totalDuration: { $sum: '$duration' },
          avgDuration: { $avg: '$duration' }
        }
      }
    ]);

    const dailyStats = await ActivityLog.aggregate([
      {
        $match: {
          userId: req.user._id,
          date: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
          count: { $sum: 1 },
          totalDuration: { $sum: '$duration' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Transform stats to use 'category' instead of '_id' and create categoryBreakdown
    const categoryBreakdown = stats.map(stat => ({
      category: stat._id,
      count: stat.count,
      totalDuration: stat.totalDuration,
      avgDuration: stat.avgDuration
    }));

    // Calculate total activities count
    const totalActivities = stats.reduce((sum, stat) => sum + stat.count, 0);

    res.json({
      success: true,
      data: { 
        categoryBreakdown,
        daily: dailyStats,
        totalActivities,
        period: parseInt(days)
      }
    });
  } catch (error) {
    next(error);
  }
};
