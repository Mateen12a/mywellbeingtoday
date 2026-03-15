import { Message, Conversation } from '../models/Message.js';
import User from '../models/User.js';
import { AppError } from '../middlewares/errorHandler.js';

const STAFF_ROLES = ['admin', 'manager', 'support'];

export const getStaffMembers = async (req, res, next) => {
  try {
    const members = await User.find({
      role: { $in: STAFF_ROLES },
      _id: { $ne: req.user._id },
      isActive: { $ne: false }
    })
      .select('email role profile.firstName profile.lastName profile.displayName profile.avatarUrl')
      .sort({ 'profile.firstName': 1 })
      .lean();

    res.json({ success: true, data: { members } });
  } catch (error) {
    next(error);
  }
};

export const getStaffConversations = async (req, res, next) => {
  try {
    const conversations = await Conversation.find({
      type: 'staff',
      participants: req.user._id
    })
      .populate('participants', 'email role profile.firstName profile.lastName profile.displayName profile.avatarUrl')
      .sort({ updatedAt: -1 })
      .lean();

    const result = conversations.map(conv => {
      const unread = conv.unreadCount?.[req.user._id.toString()] || 0;
      const other = conv.participants.find(p => p._id.toString() !== req.user._id.toString());
      return { ...conv, unreadCount: unread, otherParticipant: other };
    });

    res.json({ success: true, data: { conversations: result } });
  } catch (error) {
    next(error);
  }
};

export const getStaffConversationMessages = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const conversation = await Conversation.findOne({
      _id: id,
      type: 'staff',
      participants: req.user._id
    }).populate('participants', 'email role profile.firstName profile.lastName profile.displayName profile.avatarUrl');

    if (!conversation) throw new AppError('Conversation not found', 404, 'NOT_FOUND');

    const [messages, total] = await Promise.all([
      Message.find({ conversationId: id })
        .populate('senderId', 'email role profile.firstName profile.lastName profile.displayName profile.avatarUrl')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Message.countDocuments({ conversationId: id })
    ]);

    const other = conversation.participants.find(p => p._id.toString() !== req.user._id.toString());
    const myUnread = conversation.unreadCount?.get?.(req.user._id.toString()) || 0;
    if (myUnread > 0) {
      conversation.unreadCount.set(req.user._id.toString(), 0);
      await conversation.save();
    }

    res.json({
      success: true,
      data: {
        conversation,
        otherParticipant: other,
        messages: messages.reverse(),
        pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / parseInt(limit)) }
      }
    });
  } catch (error) {
    next(error);
  }
};

export const createStaffConversation = async (req, res, next) => {
  try {
    const { recipientId, message } = req.body;
    if (!recipientId) throw new AppError('Recipient is required', 400, 'VALIDATION_ERROR');
    if (recipientId === req.user._id.toString()) throw new AppError('Cannot message yourself', 400, 'VALIDATION_ERROR');

    const recipient = await User.findOne({ _id: recipientId, role: { $in: STAFF_ROLES } });
    if (!recipient) throw new AppError('Staff member not found', 404, 'NOT_FOUND');

    let conversation = await Conversation.findOne({
      type: 'staff',
      participants: { $all: [req.user._id, recipientId], $size: 2 }
    });

    if (!conversation) {
      conversation = new Conversation({
        type: 'staff',
        participants: [req.user._id, recipientId],
        unreadCount: new Map()
      });
      await conversation.save();
    }

    if (message?.trim()) {
      const newMsg = await Message.create({
        conversationId: conversation._id,
        senderId: req.user._id,
        recipientId,
        content: message.trim(),
        type: 'text'
      });
      conversation.lastMessage = { content: message.trim(), senderId: req.user._id, createdAt: new Date() };
      const cur = conversation.unreadCount?.get?.(recipientId) || 0;
      conversation.unreadCount.set(recipientId, cur + 1);
      await conversation.save();
    }

    await conversation.populate('participants', 'email role profile.firstName profile.lastName profile.displayName profile.avatarUrl');
    const other = conversation.participants.find(p => p._id.toString() !== req.user._id.toString());

    res.status(201).json({ success: true, data: { conversation, otherParticipant: other } });
  } catch (error) {
    next(error);
  }
};

export const sendStaffMessage = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    if (!content?.trim()) throw new AppError('Message content is required', 400, 'VALIDATION_ERROR');

    const conversation = await Conversation.findOne({
      _id: id,
      type: 'staff',
      participants: req.user._id
    });
    if (!conversation) throw new AppError('Conversation not found', 404, 'NOT_FOUND');

    const recipientId = conversation.participants.find(p => p.toString() !== req.user._id.toString());

    const newMsg = await Message.create({
      conversationId: id,
      senderId: req.user._id,
      recipientId,
      content: content.trim(),
      type: 'text'
    });

    conversation.lastMessage = { content: content.trim(), senderId: req.user._id, createdAt: new Date() };
    const cur = conversation.unreadCount?.get?.(recipientId.toString()) || 0;
    conversation.unreadCount.set(recipientId.toString(), cur + 1);
    await conversation.save();

    await newMsg.populate('senderId', 'email role profile.firstName profile.lastName profile.displayName profile.avatarUrl');

    res.status(201).json({ success: true, data: { message: newMsg } });
  } catch (error) {
    next(error);
  }
};

export const markStaffConversationRead = async (req, res, next) => {
  try {
    const { id } = req.params;
    const conversation = await Conversation.findOne({
      _id: id,
      type: 'staff',
      participants: req.user._id
    });
    if (!conversation) throw new AppError('Conversation not found', 404, 'NOT_FOUND');

    conversation.unreadCount.set(req.user._id.toString(), 0);
    await conversation.save();

    await Message.updateMany(
      { conversationId: id, recipientId: req.user._id, read: false },
      { $set: { read: true, readAt: new Date() } }
    );

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};

export const getStaffUnreadCount = async (req, res, next) => {
  try {
    const conversations = await Conversation.find({
      type: 'staff',
      participants: req.user._id
    }).lean();

    const count = conversations.reduce((sum, conv) => {
      const val = conv.unreadCount?.[req.user._id.toString()] || 0;
      return sum + val;
    }, 0);

    res.json({ success: true, data: { count } });
  } catch (error) {
    next(error);
  }
};
