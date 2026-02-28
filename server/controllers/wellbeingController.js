import { WellbeingReport, ActivityLog, MoodLog, ChatMessage, ChatConversation } from '../models/index.js';
import Subscription from '../models/Subscription.js';
import { analyzeWellbeing, generateRecommendations, classifyWellbeingLevel, generateDashboardInsights, chatWithAssistant, generateChatTitle } from '../services/aiService.js';
import { AppError } from '../middlewares/errorHandler.js';
import { logAction } from '../middlewares/auditLog.js';
import { incrementUsage, checkUsageLimit, PLAN_LIMITS } from '../routes/subscriptionRoutes.js';

export const generateReport = async (req, res, next) => {
  try {
    const usageCheck = await checkUsageLimit(req.user._id, 'reportDownloads');
    if (!usageCheck.allowed) {
      return res.status(403).json({ success: false, message: usageCheck.reason });
    }

    const { days = 7 } = req.body;
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const [activityLogs, moodLogs] = await Promise.all([
      ActivityLog.find({
        userId: req.user._id,
        date: { $gte: startDate, $lte: endDate }
      }).sort({ date: -1 }),
      MoodLog.find({
        userId: req.user._id,
        date: { $gte: startDate, $lte: endDate }
      }).sort({ date: -1 })
    ]);

    if (activityLogs.length === 0 && moodLogs.length === 0) {
      throw new AppError('Not enough data to generate a report. Please log some activities and moods first.', 400, 'INSUFFICIENT_DATA');
    }

    const wellbeingAnalysis = await analyzeWellbeing(activityLogs, moodLogs);
    const recommendations = await generateRecommendations(wellbeingAnalysis);

    const avgMoodScore = moodLogs.length > 0 
      ? moodLogs.reduce((sum, m) => sum + m.moodScore, 0) / moodLogs.length 
      : 5;
    
    const overallScore = Math.round(avgMoodScore * 10);
    const wellbeingLevel = classifyWellbeingLevel(overallScore);

    const seekHelpRecommended = overallScore < 40 || 
      (moodLogs.some(m => m.stressLevel >= 8 || m.anxietyLevel >= 8));

    const analysisData = wellbeingAnalysis.analysis || {};

    const report = await WellbeingReport.create({
      userId: req.user._id,
      dateRange: { start: startDate, end: endDate },
      overallScore,
      wellbeingLevel,
      analysis: {
        summary: analysisData.summary || 'No summary available',
        strengths: analysisData.strengths || [],
        areasForImprovement: analysisData.areasForImprovement || [],
        patterns: analysisData.patterns || [],
        trends: analysisData.trends || {}
      },
      recommendations,
      insights: analysisData.insights || [],
      dataPoints: {
        activityLogs: activityLogs.length,
        moodLogs: moodLogs.length,
        averageMoodScore: avgMoodScore,
        averageEnergyLevel: moodLogs.length > 0 
          ? moodLogs.reduce((sum, m) => sum + (m.energyLevel || 5), 0) / moodLogs.length 
          : null,
        averageStressLevel: moodLogs.length > 0 
          ? moodLogs.reduce((sum, m) => sum + (m.stressLevel || 5), 0) / moodLogs.length 
          : null,
        totalActivityMinutes: activityLogs.reduce((sum, a) => sum + (a.duration || 0), 0),
        mostCommonMood: getMostCommon(moodLogs.map(m => m.mood)),
        mostCommonActivity: getMostCommon(activityLogs.map(a => a.category))
      },
      seekHelpRecommended,
      helpRecommendation: seekHelpRecommended ? {
        reason: 'Based on your recent wellbeing data, connecting with a professional might be beneficial.',
        urgency: overallScore < 30 ? 'high' : 'moderate',
        suggestedSpecialties: ['mental_health', 'counseling']
      } : undefined,
      generatedBy: wellbeingAnalysis.generatedBy || 'ai',
      aiModel: wellbeingAnalysis.aiModel || ''
    });

    await logAction(req.user._id, 'GENERATE_REPORT', 'wellbeingReport', report._id, null, req);
    incrementUsage(req.user._id, 'reportDownloads').catch(err => console.error('[USAGE]', err));

    res.status(201).json({
      success: true,
      message: 'Wellbeing report generated successfully',
      data: { report }
    });
  } catch (error) {
    next(error);
  }
};

export const getReports = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [reports, total] = await Promise.all([
      WellbeingReport.find({ userId: req.user._id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      WellbeingReport.countDocuments({ userId: req.user._id })
    ]);

    res.json({
      success: true,
      data: {
        reports,
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

export const getReport = async (req, res, next) => {
  try {
    const report = await WellbeingReport.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!report) {
      throw new AppError('Report not found', 404, 'NOT_FOUND');
    }

    res.json({
      success: true,
      data: { report }
    });
  } catch (error) {
    next(error);
  }
};

export const getLatestReport = async (req, res, next) => {
  try {
    const report = await WellbeingReport.findOne({ userId: req.user._id })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: { report }
    });
  } catch (error) {
    next(error);
  }
};

export const shareReport = async (req, res, next) => {
  try {
    const { providerId } = req.body;

    const report = await WellbeingReport.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!report) {
      throw new AppError('Report not found', 404, 'NOT_FOUND');
    }

    report.isShared = true;
    report.sharedWith.push({ providerId, sharedAt: new Date() });
    await report.save();

    await logAction(req.user._id, 'SHARE_REPORT', 'wellbeingReport', report._id, { providerId }, req);

    res.json({
      success: true,
      message: 'Report shared with provider',
      data: { report }
    });
  } catch (error) {
    next(error);
  }
};

export const getDashboardSummary = async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const [todayActivitiesCount, todayMoods, weekActivities, weekMoods, latestReport, lastActivity, lastMood] = await Promise.all([
      ActivityLog.countDocuments({ userId: req.user._id, date: { $gte: today } }),
      MoodLog.find({ userId: req.user._id, date: { $gte: today } }).sort({ date: -1 }).limit(1),
      ActivityLog.find({ userId: req.user._id, date: { $gte: weekAgo } }),
      MoodLog.find({ userId: req.user._id, date: { $gte: weekAgo } }),
      WellbeingReport.findOne({ userId: req.user._id }).sort({ createdAt: -1 }),
      ActivityLog.findOne({ userId: req.user._id }).sort({ date: -1 }),
      MoodLog.findOne({ userId: req.user._id }).sort({ date: -1 })
    ]);

    const avgMoodScore = weekMoods.length > 0 
      ? weekMoods.reduce((sum, m) => sum + m.moodScore, 0) / weekMoods.length 
      : null;

    const aiInsights = await generateDashboardInsights({
      recentActivities: weekActivities,
      recentMoods: weekMoods,
      avgMoodScore: avgMoodScore ? Math.round(avgMoodScore * 10) / 10 : null,
      lastActivity: lastActivity?.toObject(),
      lastMood: lastMood?.toObject(),
      loggedToday: todayActivitiesCount > 0 || todayMoods.length > 0
    });

    const summary = {
      today: {
        activitiesLogged: todayActivitiesCount,
        latestMood: todayMoods[0] || null,
        hasMoodLog: todayMoods.length > 0
      },
      week: {
        totalActivities: weekActivities.length,
        totalMoodLogs: weekMoods.length,
        avgMoodScore,
        totalActivityMinutes: weekActivities.reduce((sum, a) => sum + (a.duration || 0), 0)
      },
      latestReport: latestReport ? {
        id: latestReport._id,
        score: latestReport.overallScore,
        level: latestReport.wellbeingLevel,
        createdAt: latestReport.createdAt,
        seekHelpRecommended: latestReport.seekHelpRecommended
      } : null,
      aiInsights
    };

    res.json({
      success: true,
      data: { summary }
    });
  } catch (error) {
    next(error);
  }
};

// ============ CONVERSATION MANAGEMENT ============

export const getConversations = async (req, res, next) => {
  try {
    const conversations = await ChatConversation.find({ userId: req.user._id })
      .sort({ lastMessageAt: -1 })
      .limit(50);
    
    res.json({
      success: true,
      data: { conversations }
    });
  } catch (error) {
    next(error);
  }
};

export const createConversation = async (req, res, next) => {
  try {
    const conversation = await ChatConversation.create({
      userId: req.user._id,
      title: 'New Chat'
    });
    
    res.status(201).json({
      success: true,
      data: { conversation }
    });
  } catch (error) {
    next(error);
  }
};

export const getConversation = async (req, res, next) => {
  try {
    const conversation = await ChatConversation.findOne({
      _id: req.params.conversationId,
      userId: req.user._id
    });
    
    if (!conversation) {
      throw new AppError('Conversation not found', 404, 'NOT_FOUND');
    }
    
    const messages = await ChatMessage.find({ conversationId: conversation._id })
      .sort({ createdAt: 1 });
    
    res.json({
      success: true,
      data: { conversation, messages }
    });
  } catch (error) {
    next(error);
  }
};

export const updateConversationTitle = async (req, res, next) => {
  try {
    const { title } = req.body;
    
    const conversation = await ChatConversation.findOneAndUpdate(
      { _id: req.params.conversationId, userId: req.user._id },
      { title },
      { new: true }
    );
    
    if (!conversation) {
      throw new AppError('Conversation not found', 404, 'NOT_FOUND');
    }
    
    res.json({
      success: true,
      data: { conversation }
    });
  } catch (error) {
    next(error);
  }
};

export const deleteConversation = async (req, res, next) => {
  try {
    const conversation = await ChatConversation.findOneAndDelete({
      _id: req.params.conversationId,
      userId: req.user._id
    });
    
    if (!conversation) {
      throw new AppError('Conversation not found', 404, 'NOT_FOUND');
    }
    
    await ChatMessage.deleteMany({ conversationId: conversation._id });
    
    res.json({
      success: true,
      message: 'Conversation deleted'
    });
  } catch (error) {
    next(error);
  }
};

// ============ CHAT MESSAGING ============

export const sendMessage = async (req, res, next) => {
  try {
    const aiUsageCheck = await checkUsageLimit(req.user._id, 'aiInteractions');
    if (!aiUsageCheck.allowed) {
      return res.status(403).json({ success: false, message: aiUsageCheck.reason });
    }

    const { conversationId } = req.params;
    const { message } = req.body;
    
    let conversation = await ChatConversation.findOne({
      _id: conversationId,
      userId: req.user._id
    });
    
    if (!conversation) {
      throw new AppError('Conversation not found', 404, 'NOT_FOUND');
    }
    
    // Save user message
    const userMessage = await ChatMessage.create({
      userId: req.user._id,
      conversationId: conversation._id,
      role: 'user',
      content: message
    });
    
    // Fetch conversation history for context
    const history = await ChatMessage.find({ conversationId: conversation._id })
      .sort({ createdAt: -1 })
      .limit(10);
    
    const reversedHistory = history.reverse();
    
    // Fetch user wellbeing data and subscription for context
    const [activityLogs, moodLogs, latestReport, subscription] = await Promise.all([
      ActivityLog.find({ userId: req.user._id }).sort({ date: -1 }).limit(10),
      MoodLog.find({ userId: req.user._id }).sort({ date: -1 }).limit(10),
      WellbeingReport.findOne({ userId: req.user._id }).sort({ createdAt: -1 }),
      Subscription.findOne({ userId: req.user._id })
    ]);

    const userPlan = subscription?.plan || 'free';
    const userLimits = PLAN_LIMITS[userPlan] || PLAN_LIMITS.free;
    const userUsage = subscription?.usage || {};
    const aiRemaining = userLimits.aiInteractions === -1 ? 'unlimited' : Math.max(0, userLimits.aiInteractions - (userUsage.aiInteractions || 0));

    const context = {
      userName: req.user.profile?.firstName || 'there',
      userRole: req.user.role,
      activities: activityLogs.map(a => `${new Date(a.date).toLocaleDateString()}: ${a.category} - ${a.title} (${a.duration}min, ${a.intensity})`),
      moods: moodLogs.map(m => `${new Date(m.date).toLocaleDateString()}: ${m.mood} (Score: ${m.moodScore}/10, Stress: ${m.stressLevel}/10, Energy: ${m.energyLevel}/10)`),
      history: reversedHistory.map(msg => ({ role: msg.role, content: msg.content })),
      latestReport: latestReport ? {
        overallScore: latestReport.overallScore,
        wellbeingLevel: latestReport.wellbeingLevel,
        createdAt: latestReport.createdAt,
        summary: latestReport.analysis?.summary
      } : null,
      subscription: {
        plan: userPlan,
        aiInteractionsRemaining: aiRemaining,
        limits: userLimits,
        usage: userUsage
      }
    };

    // Get AI response
    const aiResponse = await chatWithAssistant(message, context);

    incrementUsage(req.user._id, 'aiInteractions').catch(err => console.error('[USAGE]', err));

    const assistantMessage = await ChatMessage.create({
      userId: req.user._id,
      conversationId: conversation._id,
      role: 'assistant',
      content: aiResponse.answer,
      sources: aiResponse.sources
    });
    
    // Update conversation title if it's the first message
    const messageCount = await ChatMessage.countDocuments({ conversationId: conversation._id });
    if (messageCount <= 2) {
      try {
        const title = await generateChatTitle(message);
        await ChatConversation.findByIdAndUpdate(conversation._id, { title });
      } catch (error) {
        console.error('[WELLBEING CONTROLLER] Error generating chat title:', error.message);
        const fallbackTitle = message.length > 40 ? message.substring(0, 40) + '...' : message;
        await ChatConversation.findByIdAndUpdate(conversation._id, { title: fallbackTitle });
      }
    }
    
    // Update last message time
    await ChatConversation.findByIdAndUpdate(conversation._id, { lastMessageAt: new Date() });

    res.json({
      success: true,
      data: {
        userMessage,
        assistantMessage: {
          ...assistantMessage.toObject(),
          answer: aiResponse.answer,
          sources: aiResponse.sources,
          actions: aiResponse.actions || []
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// Legacy endpoints for backward compatibility
export const searchKnowledgeBase = async (req, res, next) => {
  try {
    const { query, conversationId } = req.body;
    
    let conversation;
    if (conversationId) {
      conversation = await ChatConversation.findOne({
        _id: conversationId,
        userId: req.user._id
      });
    }
    
    if (!conversation) {
      conversation = await ChatConversation.create({
        userId: req.user._id,
        title: query.length > 40 ? query.substring(0, 40) + '...' : query
      });
    }
    
    // Forward to sendMessage logic
    req.params.conversationId = conversation._id;
    req.body.message = query;
    
    return sendMessage(req, res, next);
  } catch (error) {
    next(error);
  }
};

export const getChatHistory = async (req, res, next) => {
  try {
    const conversations = await ChatConversation.find({ userId: req.user._id })
      .sort({ lastMessageAt: -1 })
      .limit(50);
    
    res.json({
      success: true,
      data: { conversations }
    });
  } catch (error) {
    next(error);
  }
};

export const clearChatHistory = async (req, res, next) => {
  try {
    const conversations = await ChatConversation.find({ userId: req.user._id });
    const conversationIds = conversations.map(c => c._id);
    
    await ChatMessage.deleteMany({ conversationId: { $in: conversationIds } });
    await ChatConversation.deleteMany({ userId: req.user._id });
    
    res.json({
      success: true,
      message: 'All chat history cleared'
    });
  } catch (error) {
    next(error);
  }
};

function getMostCommon(arr) {
  if (!arr.length) return null;
  const counts = {};
  arr.forEach(item => {
    counts[item] = (counts[item] || 0) + 1;
  });
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
}
