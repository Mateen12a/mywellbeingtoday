import mongoose from 'mongoose';

const subscriptionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  plan: {
    type: String,
    enum: ['free', 'starter', 'pro', 'premium', 'team', 'franchise'],
    default: 'free'
  },
  status: {
    type: String,
    enum: ['active', 'cancelled', 'expired', 'trial'],
    default: 'active'
  },
  stripeSubscriptionId: {
    type: String,
    default: null
  },
  stripeCustomerId: {
    type: String,
    default: null
  },
  trialEndsAt: {
    type: Date,
    default: null
  },
  currentPeriodEnd: {
    type: Date,
    default: null
  },
  cancelledAt: {
    type: Date,
    default: null
  },
  usage: {
    activityLogs: { type: Number, default: 0 },
    moodLogs: { type: Number, default: 0 },
    reportDownloads: { type: Number, default: 0 },
    directoryAccess: { type: Number, default: 0 },
    aiInteractions: { type: Number, default: 0 }
  },
  usagePeriodStart: {
    type: Date,
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

subscriptionSchema.pre('save', function() {
  this.updatedAt = new Date();
});

subscriptionSchema.methods.isActive = function() {
  if (this.status === 'cancelled' || this.status === 'expired') {
    return false;
  }
  if (this.status === 'trial' && this.trialEndsAt) {
    return new Date() < this.trialEndsAt;
  }
  if (this.currentPeriodEnd) {
    return new Date() < this.currentPeriodEnd;
  }
  return this.status === 'active';
};

subscriptionSchema.methods.getTrialDaysRemaining = function() {
  if (this.status !== 'trial' || !this.trialEndsAt) {
    return 0;
  }
  const now = new Date();
  const diff = this.trialEndsAt.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
};

subscriptionSchema.methods.resetUsage = function() {
  this.usage = {
    activityLogs: 0,
    moodLogs: 0,
    reportDownloads: 0,
    directoryAccess: 0,
    aiInteractions: 0
  };
  this.usagePeriodStart = new Date();
};

subscriptionSchema.methods.shouldResetUsage = function() {
  if (!this.usagePeriodStart) return true;
  const now = new Date();
  const periodStart = new Date(this.usagePeriodStart);
  return now.getUTCDate() !== periodStart.getUTCDate() ||
    now.getUTCMonth() !== periodStart.getUTCMonth() ||
    now.getUTCFullYear() !== periodStart.getUTCFullYear();
};

subscriptionSchema.methods.toJSON = function() {
  const obj = this.toObject();
  obj.isActive = this.isActive();
  obj.trialDaysRemaining = this.getTrialDaysRemaining();
  return obj;
};

const Subscription = mongoose.model('Subscription', subscriptionSchema);
export default Subscription;
