import mongoose from 'mongoose';

const chatConversationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  title: {
    type: String,
    default: 'New Chat'
  },
  lastMessageAt: {
    type: Date,
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

chatConversationSchema.index({ userId: 1, lastMessageAt: -1 });

const ChatConversation = mongoose.model('ChatConversation', chatConversationSchema);
export default ChatConversation;
