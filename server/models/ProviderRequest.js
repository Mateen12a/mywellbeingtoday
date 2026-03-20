import mongoose from 'mongoose';

const providerRequestSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  name: { type: String, default: '' },
  email: { type: String, default: '' },
  helpWith: { type: String, required: true, trim: true },
  preferredLocation: {
    type: String,
    enum: ['in_person', 'online', 'no_preference'],
    default: 'no_preference',
  },
  city: { type: String, default: '' },
  status: {
    type: String,
    enum: ['pending', 'matched', 'closed'],
    default: 'pending',
  },
  notes: { type: String, default: '' },
}, { timestamps: true });

export default mongoose.model('ProviderRequest', providerRequestSchema);
