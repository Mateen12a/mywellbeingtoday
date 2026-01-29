import mongoose from 'mongoose';

const providerChatMessageSchema = new mongoose.Schema({
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
  conversationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProviderChatConversation',
    required: true,
    index: true
  },
  role: {
    type: String,
    enum: ['user', 'assistant'],
    required: true
  },
  content: {
    type: String,
    required: true
  },
  sources: [String],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

providerChatMessageSchema.index({ conversationId: 1, createdAt: 1 });

const ProviderChatMessage = mongoose.model('ProviderChatMessage', providerChatMessageSchema);
export default ProviderChatMessage;
