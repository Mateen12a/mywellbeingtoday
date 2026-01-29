import mongoose from 'mongoose';
import { WELLBEING_LEVELS } from '../config/constants.js';

const wellbeingReportSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  dateRange: {
    start: { type: Date, required: true },
    end: { type: Date, required: true }
  },
  overallScore: {
    type: Number,
    min: 0,
    max: 100,
    required: true
  },
  wellbeingLevel: {
    type: String,
    enum: Object.values(WELLBEING_LEVELS),
    required: true
  },
  analysis: {
    summary: { type: String, required: true },
    strengths: [{ type: String }],
    areasForImprovement: [{ type: String }],
    patterns: [{
      type: { type: String },
      description: { type: String },
      impact: { type: String, enum: ['positive', 'negative', 'neutral'] }
    }],
    trends: {
      mood: { type: String, enum: ['improving', 'stable', 'declining'] },
      activity: { type: String, enum: ['increasing', 'stable', 'decreasing'] },
      sleep: { type: String, enum: ['improving', 'stable', 'declining'] },
      stress: { type: String, enum: ['decreasing', 'stable', 'increasing'] }
    }
  },
  recommendations: [{
    category: { type: String },
    title: { type: String },
    description: { type: String },
    priority: { type: String, enum: ['low', 'medium', 'high'] },
    actionable: { type: Boolean, default: true }
  }],
  insights: [{
    title: { type: String },
    content: { type: String },
    type: { type: String, enum: ['observation', 'suggestion', 'alert'] }
  }],
  dataPoints: {
    activityLogs: { type: Number, default: 0 },
    moodLogs: { type: Number, default: 0 },
    averageMoodScore: { type: Number },
    averageEnergyLevel: { type: Number },
    averageStressLevel: { type: Number },
    totalActivityMinutes: { type: Number },
    mostCommonMood: { type: String },
    mostCommonActivity: { type: String }
  },
  seekHelpRecommended: {
    type: Boolean,
    default: false
  },
  helpRecommendation: {
    reason: { type: String },
    urgency: { type: String, enum: ['low', 'moderate', 'high'] },
    suggestedSpecialties: [{ type: String }]
  },
  generatedBy: {
    type: String,
    enum: ['ai', 'system', 'fallback'],
    default: 'ai'
  },
  aiModel: {
    type: String,
    default: ''
  },
  isShared: { type: Boolean, default: false },
  sharedWith: [{
    providerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Provider' },
    sharedAt: { type: Date }
  }],
  createdAt: { type: Date, default: Date.now }
});

wellbeingReportSchema.index({ userId: 1, createdAt: -1 });

const WellbeingReport = mongoose.model('WellbeingReport', wellbeingReportSchema);
export default WellbeingReport;
