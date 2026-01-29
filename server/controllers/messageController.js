import { Message, Conversation } from '../models/Message.js';
import ChatReport from '../models/ChatReport.js';
import { AppError } from '../middlewares/errorHandler.js';
import { logAction } from '../middlewares/auditLog.js';

export const getConversations = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [conversations, total] = await Promise.all([
      Conversation.find({ participants: req.user._id })
        .populate('participants', 'email profile.firstName profile.lastName profile.avatarUrl')
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Conversation.countDocuments({ participants: req.user._id })
    ]);

    const conversationsWithUnread = conversations.map(conv => {
      const unread = conv.unreadCount?.get(req.user._id.toString()) || 0;
      return {
        ...conv.toObject(),
        unreadCount: unread
      };
    });

    res.json({
      success: true,
      data: {
        conversations: conversationsWithUnread,
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

export const getConversationMessages = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const conversation = await Conversation.findOne({
      _id: id,
      participants: req.user._id
    }).populate('participants', 'email profile.firstName profile.lastName profile.avatarUrl');

    if (!conversation) {
      throw new AppError('Conversation not found', 404, 'NOT_FOUND');
    }

    const [messages, total] = await Promise.all([
      Message.find({ conversationId: id })
        .populate('senderId', 'email profile.firstName profile.lastName profile.avatarUrl')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Message.countDocuments({ conversationId: id })
    ]);

    res.json({
      success: true,
      data: {
        conversation,
        messages: messages.reverse(),
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

export const createConversation = async (req, res, next) => {
  try {
    const { participantId, message } = req.body;

    if (!participantId) {
      throw new AppError('Participant ID is required', 400, 'VALIDATION_ERROR');
    }

    if (participantId === req.user._id.toString()) {
      throw new AppError('Cannot start conversation with yourself', 400, 'VALIDATION_ERROR');
    }

    let conversation = await Conversation.findOne({
      participants: { $all: [req.user._id, participantId], $size: 2 }
    });

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [req.user._id, participantId],
        unreadCount: new Map()
      });
    }

    if (message) {
      const newMessage = await Message.create({
        conversationId: conversation._id,
        senderId: req.user._id,
        recipientId: participantId,
        content: message,
        type: 'text'
      });

      conversation.lastMessage = {
        content: message,
        senderId: req.user._id,
        createdAt: new Date()
      };
      
      const currentUnread = conversation.unreadCount?.get(participantId) || 0;
      conversation.unreadCount.set(participantId, currentUnread + 1);
      await conversation.save();
    }

    await conversation.populate('participants', 'email profile.firstName profile.lastName profile.avatarUrl');

    res.status(201).json({
      success: true,
      message: 'Conversation created',
      data: { conversation }
    });
  } catch (error) {
    next(error);
  }
};

export const sendMessage = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { content, type = 'text', attachments } = req.body;

    if (!content) {
      throw new AppError('Message content is required', 400, 'VALIDATION_ERROR');
    }

    const conversation = await Conversation.findOne({
      _id: id,
      participants: req.user._id
    });

    if (!conversation) {
      throw new AppError('Conversation not found', 404, 'NOT_FOUND');
    }

    const recipientId = conversation.participants.find(
      p => p.toString() !== req.user._id.toString()
    );

    const message = await Message.create({
      conversationId: id,
      senderId: req.user._id,
      recipientId,
      content,
      type,
      attachments
    });

    conversation.lastMessage = {
      content,
      senderId: req.user._id,
      createdAt: new Date()
    };

    const currentUnread = conversation.unreadCount?.get(recipientId.toString()) || 0;
    conversation.unreadCount.set(recipientId.toString(), currentUnread + 1);
    await conversation.save();

    await message.populate('senderId', 'email profile.firstName profile.lastName profile.avatarUrl');

    res.status(201).json({
      success: true,
      message: 'Message sent',
      data: { message }
    });
  } catch (error) {
    next(error);
  }
};

export const markAsRead = async (req, res, next) => {
  try {
    const { id } = req.params;

    const message = await Message.findOne({
      _id: id,
      recipientId: req.user._id
    });

    if (!message) {
      throw new AppError('Message not found', 404, 'NOT_FOUND');
    }

    if (!message.read) {
      message.read = true;
      message.readAt = new Date();
      await message.save();

      const conversation = await Conversation.findById(message.conversationId);
      if (conversation) {
        const currentUnread = conversation.unreadCount?.get(req.user._id.toString()) || 0;
        if (currentUnread > 0) {
          conversation.unreadCount.set(req.user._id.toString(), currentUnread - 1);
          await conversation.save();
        }
      }
    }

    res.json({
      success: true,
      message: 'Message marked as read',
      data: { message }
    });
  } catch (error) {
    next(error);
  }
};

export const getUnreadCount = async (req, res, next) => {
  try {
    const count = await Message.countDocuments({
      recipientId: req.user._id,
      read: false
    });

    res.json({
      success: true,
      data: { unreadCount: count }
    });
  } catch (error) {
    next(error);
  }
};

export const reportConversation = async (req, res, next) => {
  try {
    const { conversationId, reason, description } = req.body;

    if (!conversationId || !reason) {
      throw new AppError('Conversation ID and reason are required', 400, 'VALIDATION_ERROR');
    }

    const validReasons = ['harassment', 'spam', 'inappropriate', 'scam', 'other'];
    if (!validReasons.includes(reason)) {
      throw new AppError('Invalid reason', 400, 'VALIDATION_ERROR');
    }

    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: req.user._id
    }).populate('participants', 'firstName lastName email');

    if (!conversation) {
      throw new AppError('Conversation not found', 404, 'NOT_FOUND');
    }

    const reportedUser = conversation.participants.find(
      p => p._id.toString() !== req.user._id.toString()
    );

    if (!reportedUser) {
      throw new AppError('Could not identify reported user', 400, 'VALIDATION_ERROR');
    }

    const existingReport = await ChatReport.findOne({
      reporterId: req.user._id,
      conversationId,
      status: 'pending'
    });

    if (existingReport) {
      throw new AppError('You have already reported this conversation', 409, 'DUPLICATE_REPORT');
    }

    const recentMessages = await Message.find({ conversationId })
      .populate('senderId', 'firstName lastName')
      .sort({ createdAt: -1 })
      .limit(30);

    const messagesForReport = recentMessages.reverse().map(msg => ({
      messageId: msg._id,
      senderId: msg.senderId._id,
      senderName: `${msg.senderId.firstName || ''} ${msg.senderId.lastName || ''}`.trim() || 'Unknown',
      content: msg.content,
      createdAt: msg.createdAt
    }));

    const report = await ChatReport.create({
      reporterId: req.user._id,
      reportedUserId: reportedUser._id,
      conversationId,
      reason,
      description,
      messages: messagesForReport,
      status: 'pending'
    });

    await logAction(req.user._id, 'CHAT_REPORT_CREATED', 'chatReport', report._id, {
      reportedUserId: reportedUser._id,
      reason
    }, req);

    res.status(201).json({
      success: true,
      message: 'Report submitted successfully. Our team will review it shortly.',
      data: { reportId: report._id }
    });
  } catch (error) {
    next(error);
  }
};
