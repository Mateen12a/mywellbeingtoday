import { Provider, User, Appointment, WellbeingReport, MoodLog, ActivityLog, MessageConversation, ProviderChatConversation, ProviderChatMessage } from '../models/index.js';
import { AppError } from '../middlewares/errorHandler.js';
import { logAction } from '../middlewares/auditLog.js';
import { USER_ROLES, PROVIDER_SPECIALTIES, MAIN_PROVIDER_SPECIALTIES } from '../config/constants.js';
import { suggestProviders, generateProviderInsights, chatWithProviderAssistant, generateProviderChatTitle } from '../services/aiService.js';
import { incrementUsage, checkUsageLimit } from '../routes/subscriptionRoutes.js';

export const createProviderProfile = async (req, res, next) => {
  try {
    // Email must be verified before creating provider profile
    if (!req.user.verification.emailVerified) {
      throw new AppError(
        'Please verify your email before creating a provider profile',
        403,
        'EMAIL_NOT_VERIFIED'
      );
    }

    const existingProvider = await Provider.findOne({ userId: req.user._id });
    if (existingProvider) {
      throw new AppError('Provider profile already exists', 409, 'PROFILE_EXISTS');
    }

    // Ensure location has proper GeoJSON structure
    const providerData = { ...req.body };
    
    if (providerData.practice) {
      providerData.practice = { ...providerData.practice };
      
      // Always ensure location object exists with proper structure
      if (!providerData.practice.location) {
        providerData.practice.location = {};
      }
      
      // Always set coordinates to array, use existing if valid, otherwise default
      const existingCoords = providerData.practice.location.coordinates;
      const isValidCoords = Array.isArray(existingCoords) && existingCoords.length === 2;
      
      providerData.practice.location = {
        type: 'Point',
        coordinates: isValidCoords ? existingCoords : [0, 0]
      };
    } else {
      providerData.practice = {
        name: '',
        address: { street: '', city: '', postcode: '', country: 'UK' },
        phone: '',
        email: '',
        website: '',
        location: {
          type: 'Point',
          coordinates: [0, 0]
        }
      };
    }

    const provider = await Provider.create({
      userId: req.user._id,
      ...providerData
    });

    await User.findByIdAndUpdate(req.user._id, { role: USER_ROLES.PROVIDER });

    await logAction(req.user._id, 'CREATE_PROVIDER_PROFILE', 'provider', provider._id, null, req);

    res.status(201).json({
      success: true,
      message: 'Provider profile created',
      data: { provider }
    });
  } catch (error) {
    next(error);
  }
};

export const getProviderProfile = async (req, res, next) => {
  try {
    const provider = await Provider.findOne({ userId: req.user._id })
      .populate('userId', 'email profile');

    if (!provider) {
      throw new AppError('Provider profile not found', 404, 'NOT_FOUND');
    }

    res.json({
      success: true,
      data: { provider }
    });
  } catch (error) {
    next(error);
  }
};

export const updateProviderProfile = async (req, res, next) => {
  try {
    // Ensure location has proper GeoJSON structure if being updated
    const updateData = { ...req.body };
    
    if (updateData.practice) {
      updateData.practice = { ...updateData.practice };
      
      // Always ensure location object exists with proper structure
      if (!updateData.practice.location) {
        updateData.practice.location = {};
      }
      
      // Always set coordinates to array, use existing if valid, otherwise default
      const existingCoords = updateData.practice.location.coordinates;
      const isValidCoords = Array.isArray(existingCoords) && existingCoords.length === 2;
      
      updateData.practice.location = {
        type: 'Point',
        coordinates: isValidCoords ? existingCoords : [0, 0]
      };
    }

    const provider = await Provider.findOneAndUpdate(
      { userId: req.user._id },
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!provider) {
      throw new AppError('Provider profile not found', 404, 'NOT_FOUND');
    }

    await logAction(req.user._id, 'UPDATE_PROVIDER_PROFILE', 'provider', provider._id, null, req);

    res.json({
      success: true,
      message: 'Provider profile updated',
      data: { provider }
    });
  } catch (error) {
    next(error);
  }
};

export const searchProviders = async (req, res, next) => {
  try {
    if (req.user?._id) {
      const usageCheck = await checkUsageLimit(req.user._id, 'directoryAccess');
      if (!usageCheck.allowed) {
        return res.status(403).json({ success: false, message: usageCheck.reason });
      }
      incrementUsage(req.user._id, 'directoryAccess').catch(err => console.error('[USAGE]', err));
    }

    const { 
      specialty, 
      city, 
      acceptingNew = true,
      consultationType,
      page = 1, 
      limit = 20,
      lat,
      lng,
      maxDistance = 50000
    } = req.query;

    const query = { isActive: true, 'verification.isVerified': true };

    if (specialty) {
      if (specialty === 'other') {
        query['professionalInfo.specialties'] = { 
          $nin: MAIN_PROVIDER_SPECIALTIES,
          $exists: true
        };
      } else {
        query['professionalInfo.specialties'] = specialty;
      }
    }

    if (city) {
      query['practice.city'] = { $regex: city, $options: 'i' };
    }

    if (acceptingNew === 'true' || acceptingNew === true) {
      query['availability.acceptingNewPatients'] = true;
    }

    if (consultationType) {
      query['availability.consultationTypes'] = consultationType;
    }

    let providers;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    if (lat && lng) {
      providers = await Provider.find({
        ...query,
        'practice.location': {
          $near: {
            $geometry: { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] },
            $maxDistance: parseInt(maxDistance)
          }
        }
      })
        .populate('userId', 'profile.firstName profile.lastName profile.avatarUrl')
        .skip(skip)
        .limit(parseInt(limit));
    } else {
      providers = await Provider.find(query)
        .populate('userId', 'profile.firstName profile.lastName profile.avatarUrl')
        .sort({ 'ratings.average': -1 })
        .skip(skip)
        .limit(parseInt(limit));
    }

    const total = await Provider.countDocuments(query);

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

export const getProviderById = async (req, res, next) => {
  try {
    const provider = await Provider.findById(req.params.id)
      .populate('userId', 'profile.firstName profile.lastName profile.avatarUrl email');

    if (!provider) {
      throw new AppError('Provider not found', 404, 'NOT_FOUND');
    }

    // Only show unverified providers to themselves or admins
    if (!provider.verification.isVerified) {
      if (!req.user || (req.user._id.toString() !== provider.userId._id.toString() && 
          !['admin', 'super_admin'].includes(req.user.role))) {
        throw new AppError('This provider is not verified yet', 404, 'NOT_FOUND');
      }
    }

    res.json({
      success: true,
      data: { provider }
    });
  } catch (error) {
    next(error);
  }
};

export const getProviderAppointments = async (req, res, next) => {
  try {
    const provider = await Provider.findOne({ userId: req.user._id });
    if (!provider) {
      throw new AppError('Provider profile not found', 404, 'NOT_FOUND');
    }

    const { status, startDate, endDate, page = 1, limit = 20 } = req.query;
    const query = { providerId: provider._id };

    if (status) {
      query.status = status;
    }

    if (startDate || endDate) {
      query.dateTime = {};
      if (startDate) query.dateTime.$gte = new Date(startDate);
      if (endDate) query.dateTime.$lte = new Date(endDate);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [appointments, total] = await Promise.all([
      Appointment.find(query)
        .populate('userId', 'profile email')
        .populate('wellbeingReportId')
        .sort({ dateTime: 1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Appointment.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: {
        appointments,
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

export const updateAppointmentStatus = async (req, res, next) => {
  try {
    const provider = await Provider.findOne({ userId: req.user._id });
    if (!provider) {
      throw new AppError('Provider profile not found', 404, 'NOT_FOUND');
    }

    const { status, providerNotes } = req.body;

    const appointment = await Appointment.findOneAndUpdate(
      { _id: req.params.appointmentId, providerId: provider._id },
      { 
        status,
        'notes.providerNotes': providerNotes || undefined
      },
      { new: true }
    );

    if (!appointment) {
      throw new AppError('Appointment not found', 404, 'NOT_FOUND');
    }

    await logAction(req.user._id, 'UPDATE_APPOINTMENT_STATUS', 'appointment', appointment._id, { status }, req);

    res.json({
      success: true,
      message: 'Appointment updated',
      data: { appointment }
    });
  } catch (error) {
    next(error);
  }
};

export const getSharedReports = async (req, res, next) => {
  try {
    const provider = await Provider.findOne({ userId: req.user._id });
    if (!provider) {
      throw new AppError('Provider profile not found', 404, 'NOT_FOUND');
    }

    const reports = await WellbeingReport.find({
      'sharedWith.providerId': provider._id
    })
      .populate('userId', 'profile email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: { reports }
    });
  } catch (error) {
    next(error);
  }
};

export const searchUsersForCertificate = async (req, res, next) => {
  try {
    const { search, limit = 10 } = req.query;

    // Get the provider profile
    const provider = await Provider.findOne({ userId: req.user._id });
    if (!provider) {
      throw new AppError('Provider profile not found', 404, 'NOT_FOUND');
    }

    // Get connected user IDs from appointments
    const appointmentUserIds = await Appointment.distinct('userId', {
      providerId: provider._id
    });

    // Get connected user IDs from conversations/messages
    const conversations = await MessageConversation.find({
      participants: req.user._id
    }).lean();

    const conversationUserIds = conversations.flatMap(conv => 
      conv.participants.filter(p => p.toString() !== req.user._id.toString())
    );

    // Combine and deduplicate user IDs
    const connectedUserIds = [...new Set([
      ...appointmentUserIds.map(id => id.toString()),
      ...conversationUserIds.map(id => id.toString())
    ])];

    if (connectedUserIds.length === 0) {
      return res.json({
        success: true,
        data: { users: [], message: 'No connected patients found' }
      });
    }

    // If no search query, return all connected patients
    if (!search || search.length < 2) {
      const users = await User.find({
        _id: { $in: connectedUserIds },
        isActive: true,
        role: 'user'
      })
        .select('_id email profile.firstName profile.lastName profile.avatarUrl')
        .limit(parseInt(limit))
        .lean();

      return res.json({
        success: true,
        data: { users }
      });
    }

    const searchRegex = new RegExp(search, 'i');

    // Search only among connected patients
    const users = await User.find({
      _id: { $in: connectedUserIds },
      isActive: true,
      role: 'user',
      $or: [
        { email: searchRegex },
        { 'profile.firstName': searchRegex },
        { 'profile.lastName': searchRegex },
        { 'profile.displayName': searchRegex }
      ]
    })
      .select('_id email profile.firstName profile.lastName profile.avatarUrl')
      .limit(parseInt(limit))
      .lean();

    res.json({
      success: true,
      data: { users }
    });
  } catch (error) {
    next(error);
  }
};

export const getAISuggestedProviders = async (req, res, next) => {
  try {
    const [latestReport, recentMoods, recentActivities] = await Promise.all([
      WellbeingReport.findOne({ userId: req.user._id }).sort({ createdAt: -1 }),
      MoodLog.find({ userId: req.user._id }).sort({ date: -1 }).limit(7),
      ActivityLog.find({ userId: req.user._id }).sort({ date: -1 }).limit(7)
    ]);

    const avgMoodScore = recentMoods.length > 0 
      ? recentMoods.reduce((sum, m) => sum + (m.moodScore || 5), 0) / recentMoods.length 
      : null;
    const avgStressLevel = recentMoods.length > 0 
      ? recentMoods.reduce((sum, m) => sum + (m.stressLevel || 5), 0) / recentMoods.length 
      : null;
    const avgEnergyLevel = recentMoods.length > 0 
      ? recentMoods.reduce((sum, m) => sum + (m.energyLevel || 5), 0) / recentMoods.length 
      : null;
    const moodCounts = {};
    recentMoods.forEach(m => { moodCounts[m.mood] = (moodCounts[m.mood] || 0) + 1; });
    const mostCommonMood = Object.keys(moodCounts).length > 0 
      ? Object.keys(moodCounts).reduce((a, b) => moodCounts[a] > moodCounts[b] ? a : b) 
      : null;

    const userWellbeingData = {
      overallScore: latestReport?.overallScore || 50,
      wellbeingLevel: latestReport?.wellbeingLevel || 'moderate',
      avgMoodScore: avgMoodScore ? Math.round(avgMoodScore * 10) / 10 : null,
      avgStressLevel: avgStressLevel ? Math.round(avgStressLevel * 10) / 10 : null,
      avgEnergyLevel: avgEnergyLevel ? Math.round(avgEnergyLevel * 10) / 10 : null,
      mostCommonMood,
      seekHelpRecommended: latestReport?.seekHelpRecommended || false,
      recentConcerns: req.query.concerns || null
    };

    const aiSuggestion = await suggestProviders(userWellbeingData, PROVIDER_SPECIALTIES);

    const providers = await Provider.find({
      isActive: true,
      'verification.isVerified': true,
      'professionalInfo.specialties': { $in: aiSuggestion.suggestedSpecialties }
    })
      .populate('userId', 'profile.firstName profile.lastName profile.avatarUrl')
      .sort({ 'ratings.average': -1 })
      .limit(10);

    res.json({
      success: true,
      data: {
        aiSuggestion,
        providers,
        userWellbeingSnapshot: {
          overallScore: userWellbeingData.overallScore,
          wellbeingLevel: userWellbeingData.wellbeingLevel,
          avgMoodScore: userWellbeingData.avgMoodScore
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getProviderAIInsights = async (req, res, next) => {
  try {
    const provider = await Provider.findOne({ userId: req.user._id })
      .populate('userId', 'profile');
    if (!provider) {
      throw new AppError('Provider profile not found', 404, 'NOT_FOUND');
    }

    const [appointments, sharedReports] = await Promise.all([
      Appointment.find({ providerId: provider._id })
        .populate('userId', 'profile email')
        .populate('wellbeingReportId')
        .sort({ dateTime: 1 })
        .limit(50),
      WellbeingReport.find({ 'sharedWith.providerId': provider._id })
        .populate('userId', 'profile email')
        .sort({ createdAt: -1 })
        .limit(20)
    ]);

    const providerName = `${provider.professionalInfo?.title || 'Dr.'} ${provider.userId?.profile?.firstName || ''} ${provider.userId?.profile?.lastName || ''}`.trim();
    const isVerified = provider.verification?.isVerified === true;

    const insights = await generateProviderInsights(appointments, sharedReports, providerName, isVerified);

    res.json({
      success: true,
      data: { insights }
    });
  } catch (error) {
    next(error);
  }
};

export const providerAiChat = async (req, res, next) => {
  try {
    const { message, history } = req.body;
    
    if (!message || typeof message !== 'string' || !message.trim()) {
      throw new AppError('Message is required', 400, 'INVALID_INPUT');
    }

    const provider = await Provider.findOne({ userId: req.user._id })
      .populate('userId', 'profile');
    
    if (!provider) {
      throw new AppError('Provider profile not found', 404, 'NOT_FOUND');
    }

    const providerName = `${provider.professionalInfo?.title || ''} ${provider.userId?.profile?.firstName || ''} ${provider.userId?.profile?.lastName || ''}`.trim() || 'Doctor';
    const specialty = provider.professionalInfo?.specialties?.[0] || 'General Practice';

    const context = {
      providerName,
      specialty,
      history: history || []
    };

    const response = await chatWithProviderAssistant(message.trim(), context);

    res.json({
      success: true,
      data: {
        message: response.answer,
        sources: response.sources
      }
    });
  } catch (error) {
    next(error);
  }
};

// ============ PROVIDER AI CHAT CONVERSATION MANAGEMENT ============

export const getProviderConversations = async (req, res, next) => {
  try {
    const provider = await Provider.findOne({ userId: req.user._id });
    if (!provider) {
      throw new AppError('Provider profile not found', 404, 'NOT_FOUND');
    }

    const conversations = await ProviderChatConversation.find({ providerId: provider._id })
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

export const createProviderConversation = async (req, res, next) => {
  try {
    const provider = await Provider.findOne({ userId: req.user._id });
    if (!provider) {
      throw new AppError('Provider profile not found', 404, 'NOT_FOUND');
    }

    const conversation = await ProviderChatConversation.create({
      providerId: provider._id,
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

export const getProviderConversation = async (req, res, next) => {
  try {
    const provider = await Provider.findOne({ userId: req.user._id });
    if (!provider) {
      throw new AppError('Provider profile not found', 404, 'NOT_FOUND');
    }

    const conversation = await ProviderChatConversation.findOne({
      _id: req.params.conversationId,
      providerId: provider._id
    });
    
    if (!conversation) {
      throw new AppError('Conversation not found', 404, 'NOT_FOUND');
    }
    
    const messages = await ProviderChatMessage.find({ conversationId: conversation._id })
      .sort({ createdAt: 1 });
    
    res.json({
      success: true,
      data: { conversation, messages }
    });
  } catch (error) {
    next(error);
  }
};

export const updateProviderConversationTitle = async (req, res, next) => {
  try {
    const { title } = req.body;
    
    const provider = await Provider.findOne({ userId: req.user._id });
    if (!provider) {
      throw new AppError('Provider profile not found', 404, 'NOT_FOUND');
    }
    
    const conversation = await ProviderChatConversation.findOneAndUpdate(
      { _id: req.params.conversationId, providerId: provider._id },
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

export const deleteProviderConversation = async (req, res, next) => {
  try {
    const provider = await Provider.findOne({ userId: req.user._id });
    if (!provider) {
      throw new AppError('Provider profile not found', 404, 'NOT_FOUND');
    }

    const conversation = await ProviderChatConversation.findOneAndDelete({
      _id: req.params.conversationId,
      providerId: provider._id
    });
    
    if (!conversation) {
      throw new AppError('Conversation not found', 404, 'NOT_FOUND');
    }
    
    await ProviderChatMessage.deleteMany({ conversationId: conversation._id });
    
    res.json({
      success: true,
      message: 'Conversation deleted'
    });
  } catch (error) {
    next(error);
  }
};

export const sendProviderChatMessage = async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    const { message } = req.body;
    
    if (!message || typeof message !== 'string' || !message.trim()) {
      throw new AppError('Message is required', 400, 'INVALID_INPUT');
    }

    const provider = await Provider.findOne({ userId: req.user._id })
      .populate('userId', 'profile');
    
    if (!provider) {
      throw new AppError('Provider profile not found', 404, 'NOT_FOUND');
    }
    
    const conversation = await ProviderChatConversation.findOne({
      _id: conversationId,
      providerId: provider._id
    });
    
    if (!conversation) {
      throw new AppError('Conversation not found', 404, 'NOT_FOUND');
    }
    
    // Save user message
    const userMessage = await ProviderChatMessage.create({
      providerId: provider._id,
      userId: req.user._id,
      conversationId: conversation._id,
      role: 'user',
      content: message.trim()
    });
    
    // Fetch conversation history for context
    const history = await ProviderChatMessage.find({ conversationId: conversation._id })
      .sort({ createdAt: -1 })
      .limit(10);
    
    const reversedHistory = history.reverse();
    
    // Fetch provider platform data for context
    const [pendingAppointments, upcomingAppointments, sharedReports, unreadCount] = await Promise.all([
      Appointment.countDocuments({ providerId: provider._id, status: 'pending' }),
      Appointment.countDocuments({ 
        providerId: provider._id, 
        status: 'confirmed',
        dateTime: { $gte: new Date() }
      }),
      WellbeingReport.countDocuments({ 'sharedWith.providerId': provider._id }),
      MessageConversation.countDocuments({
        participants: req.user._id,
        'lastMessage.senderId': { $ne: req.user._id },
        'lastMessage.read': false
      })
    ]);

    const providerName = `${provider.userId?.profile?.firstName || ''} ${provider.userId?.profile?.lastName || ''}`.trim() || 'Doctor';
    const specialty = provider.professionalInfo?.specialties?.[0] || 'General Practice';

    const context = {
      providerName,
      title: provider.professionalInfo?.title || 'Dr.',
      specialty,
      history: reversedHistory.map(msg => ({ role: msg.role, content: msg.content })),
      pendingAppointments,
      upcomingAppointments,
      sharedReports,
      unreadMessages: unreadCount
    };

    // Get AI response
    const aiResponse = await chatWithProviderAssistant(message.trim(), context);

    // Save assistant message
    const assistantMessage = await ProviderChatMessage.create({
      providerId: provider._id,
      userId: req.user._id,
      conversationId: conversation._id,
      role: 'assistant',
      content: aiResponse.answer,
      sources: aiResponse.sources
    });
    
    // Update conversation title if it's the first message
    const messageCount = await ProviderChatMessage.countDocuments({ conversationId: conversation._id });
    if (messageCount <= 2) {
      try {
        const title = await generateProviderChatTitle(message);
        await ProviderChatConversation.findByIdAndUpdate(conversation._id, { title });
      } catch (error) {
        console.error('[PROVIDER CONTROLLER] Error generating chat title:', error.message);
        const fallbackTitle = message.length > 40 ? message.substring(0, 40) + '...' : message;
        await ProviderChatConversation.findByIdAndUpdate(conversation._id, { title: fallbackTitle });
      }
    }
    
    // Update last message time
    await ProviderChatConversation.findByIdAndUpdate(conversation._id, { lastMessageAt: new Date() });

    res.json({
      success: true,
      data: {
        userMessage,
        assistantMessage: {
          ...assistantMessage.toObject(),
          answer: aiResponse.answer,
          sources: aiResponse.sources
        }
      }
    });
  } catch (error) {
    next(error);
  }
};
