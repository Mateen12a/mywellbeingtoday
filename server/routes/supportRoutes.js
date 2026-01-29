import { Router } from 'express';
import { authenticate, isAdmin } from '../middlewares/auth.js';
import { SupportTicket, User } from '../models/index.js';
import { USER_ROLES } from '../config/constants.js';

const router = Router();

router.post('/tickets', authenticate, async (req, res) => {
  try {
    const { subject, message, category, priority, userRole } = req.body;

    if (!subject || !message) {
      return res.status(400).json({
        success: false,
        message: 'Subject and message are required'
      });
    }

    if (subject.length > 200) {
      return res.status(400).json({
        success: false,
        message: 'Subject must be 200 characters or less'
      });
    }

    if (message.length > 5000) {
      return res.status(400).json({
        success: false,
        message: 'Message must be 5000 characters or less'
      });
    }

    const ticket = new SupportTicket({
      userId: req.userId,
      userRole: userRole || 'user',
      subject,
      message,
      category: category || 'general',
      priority: priority || 'medium',
      status: 'open'
    });

    await ticket.save();

    res.status(201).json({
      success: true,
      message: 'Support ticket created successfully',
      data: { ticket }
    });
  } catch (error) {
    console.error('Create support ticket error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create support ticket'
    });
  }
});

router.get('/tickets', authenticate, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 10, 50);
    const skip = (page - 1) * limit;

    const tickets = await SupportTicket.find({ userId: req.userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('assignedAdmin', 'email profile.firstName profile.lastName')
      .populate('responses.userId', 'email profile.firstName profile.lastName role');

    const total = await SupportTicket.countDocuments({ userId: req.userId });

    res.json({
      success: true,
      data: {
        tickets,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get user tickets error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch support tickets'
    });
  }
});

router.get('/admin/tickets', authenticate, isAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const skip = (page - 1) * limit;
    const status = req.query.status;

    const query = {};
    if (status && ['open', 'in_progress', 'resolved'].includes(status)) {
      query.status = status;
    }

    const tickets = await SupportTicket.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('userId', 'email profile.firstName profile.lastName')
      .populate('assignedAdmin', 'email profile.firstName profile.lastName')
      .populate('responses.userId', 'email profile.firstName profile.lastName role');

    const total = await SupportTicket.countDocuments(query);

    const openCount = await SupportTicket.countDocuments({ status: 'open' });
    const inProgressCount = await SupportTicket.countDocuments({ status: 'in_progress' });
    const resolvedCount = await SupportTicket.countDocuments({ status: 'resolved' });

    res.json({
      success: true,
      data: {
        tickets,
        stats: {
          open: openCount,
          in_progress: inProgressCount,
          resolved: resolvedCount,
          total: openCount + inProgressCount + resolvedCount
        },
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get admin tickets error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch support tickets'
    });
  }
});

router.put('/admin/tickets/:id', authenticate, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, assignToSelf } = req.body;

    const ticket = await SupportTicket.findById(id);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Support ticket not found'
      });
    }

    if (status && ['open', 'in_progress', 'resolved'].includes(status)) {
      ticket.status = status;
    }

    if (assignToSelf) {
      ticket.assignedAdmin = req.userId;
      if (ticket.status === 'open') {
        ticket.status = 'in_progress';
      }
    }

    await ticket.save();

    const updatedTicket = await SupportTicket.findById(id)
      .populate('userId', 'email profile.firstName profile.lastName')
      .populate('assignedAdmin', 'email profile.firstName profile.lastName')
      .populate('responses.userId', 'email profile.firstName profile.lastName role');

    res.json({
      success: true,
      message: 'Ticket updated successfully',
      data: { ticket: updatedTicket }
    });
  } catch (error) {
    console.error('Update ticket error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update support ticket'
    });
  }
});

router.post('/admin/tickets/:id/respond', authenticate, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { message } = req.body;

    if (!message || message.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Response message is required'
      });
    }

    const ticket = await SupportTicket.findById(id);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Support ticket not found'
      });
    }

    ticket.responses.push({
      userId: req.userId,
      message: message.trim(),
      timestamp: new Date()
    });

    if (!ticket.assignedAdmin) {
      ticket.assignedAdmin = req.userId;
    }

    if (ticket.status === 'open') {
      ticket.status = 'in_progress';
    }

    await ticket.save();

    const updatedTicket = await SupportTicket.findById(id)
      .populate('userId', 'email profile.firstName profile.lastName')
      .populate('assignedAdmin', 'email profile.firstName profile.lastName')
      .populate('responses.userId', 'email profile.firstName profile.lastName role');

    res.json({
      success: true,
      message: 'Response added successfully',
      data: { ticket: updatedTicket }
    });
  } catch (error) {
    console.error('Add response error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add response'
    });
  }
});

export default router;
