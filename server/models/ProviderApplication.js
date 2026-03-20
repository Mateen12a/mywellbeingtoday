import mongoose from 'mongoose';

const providerApplicationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  fullName: { type: String, required: true, trim: true },
  providerEmail: { type: String, required: true, trim: true, lowercase: true },
  phone: { type: String, default: '' },
  specialty: { type: String, required: true },
  qualifications: { type: String, default: '' },
  practiceType: {
    type: String,
    enum: ['in_person', 'online', 'both'],
    default: 'both',
  },
  city: { type: String, default: '' },
  additionalInfo: { type: String, default: '' },
  submitterEmail: { type: String, default: '' },
  status: {
    type: String,
    enum: ['pending', 'under_review', 'approved', 'rejected'],
    default: 'pending',
  },
  adminNotes: { type: String, default: '' },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  reviewedAt: { type: Date, default: null },
}, { timestamps: true });

export default mongoose.model('ProviderApplication', providerApplicationSchema);
