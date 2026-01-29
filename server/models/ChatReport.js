import mongoose from 'mongoose';

const chatReportSchema = new mongoose.Schema({
  reporterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  reportedUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  conversationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conversation',
    required: true
  },
  reason: {
    type: String,
    required: true,
    enum: ['harassment', 'spam', 'inappropriate', 'scam', 'other']
  },
  description: {
    type: String,
    maxlength: 1000
  },
  messages: [{
    messageId: { type: mongoose.Schema.Types.ObjectId },
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    senderName: { type: String },
    content: { type: String },
    createdAt: { type: Date }
  }],
  status: {
    type: String,
    enum: ['pending', 'reviewed', 'resolved', 'dismissed'],
    default: 'pending'
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewedAt: {
    type: Date
  },
  resolution: {
    type: String
  },
  createdAt: { type: Date, default: Date.now }
});

chatReportSchema.index({ status: 1, createdAt: -1 });
chatReportSchema.index({ reporterId: 1 });
chatReportSchema.index({ reportedUserId: 1 });

export default mongoose.model('ChatReport', chatReportSchema);
