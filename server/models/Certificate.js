import mongoose from 'mongoose';

const certificateSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  providerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Provider'
  },
  type: {
    type: String,
    enum: ['sick_note', 'fitness_certificate', 'medical_clearance', 'vaccination', 'other'],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  issueDate: {
    type: Date,
    required: true
  },
  expiryDate: {
    type: Date
  },
  validFrom: {
    type: Date
  },
  validUntil: {
    type: Date
  },
  status: {
    type: String,
    enum: ['active', 'expired', 'revoked'],
    default: 'active'
  },
  documentUrl: {
    type: String
  },
  issuedBy: {
    name: { type: String },
    title: { type: String },
    organization: { type: String },
    registrationNumber: { type: String }
  },
  notes: {
    type: String,
    default: ''
  },
  verificationCode: {
    type: String
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

certificateSchema.index({ userId: 1, createdAt: -1 });
certificateSchema.index({ type: 1 });
certificateSchema.index({ status: 1 });

certificateSchema.pre('save', async function() {
  this.updatedAt = new Date();
});

const Certificate = mongoose.model('Certificate', certificateSchema);
export default Certificate;
