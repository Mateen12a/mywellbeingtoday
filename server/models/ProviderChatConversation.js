import mongoose from 'mongoose';

const providerChatConversationSchema = new mongoose.Schema({
  providerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Provider',
    required: true,
    index: true
  },
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

providerChatConversationSchema.index({ providerId: 1, lastMessageAt: -1 });

const ProviderChatConversation = mongoose.model('ProviderChatConversation', providerChatConversationSchema);
export default ProviderChatConversation;
