import mongoose from 'mongoose';
import { ACTIVITY_CATEGORIES } from '../config/constants.js';

const activityLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  category: {
    type: String,
    enum: ACTIVITY_CATEGORIES,
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  duration: {
    type: Number,
    default: 0
  },
  intensity: {
    type: String,
    enum: ['low', 'moderate', 'high'],
    default: 'moderate'
  },
  metrics: {
    steps: { type: Number },
    calories: { type: Number },
    heartRate: { type: Number },
    sleepHours: { type: Number },
    sleepQuality: { type: String, enum: ['poor', 'fair', 'good', 'excellent'] },
    waterIntake: { type: Number },
    custom: { type: mongoose.Schema.Types.Mixed }
  },
  notes: {
    type: String,
    default: ''
  },
  inputMethod: {
    type: String,
    enum: ['manual', 'voice', 'import'],
    default: 'manual'
  },
  voiceTranscript: {
    type: String,
    default: ''
  },
  tags: [{ type: String }],
  location: {
    type: String,
    default: ''
  },
  weather: {
    type: String,
    default: ''
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

activityLogSchema.index({ userId: 1, date: -1 });
activityLogSchema.index({ userId: 1, category: 1 });

activityLogSchema.pre('save', async function() {
  this.updatedAt = new Date();
});

const ActivityLog = mongoose.model('ActivityLog', activityLogSchema);
export default ActivityLog;
