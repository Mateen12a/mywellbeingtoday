import mongoose from 'mongoose';
import { MOOD_TYPES } from '../config/constants.js';

const moodLogSchema = new mongoose.Schema({
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
  mood: {
    type: String,
    enum: MOOD_TYPES,
    required: true
  },
  moodScore: {
    type: Number,
    min: 1,
    max: 10,
    required: true
  },
  energyLevel: {
    type: Number,
    min: 1,
    max: 10,
    default: 5
  },
  stressLevel: {
    type: Number,
    min: 1,
    max: 10,
    default: 5
  },
  anxietyLevel: {
    type: Number,
    min: 1,
    max: 10,
    default: 5
  },
  sleepQuality: {
    type: Number,
    min: 1,
    max: 10
  },
  factors: [{
    type: String,
    enum: [
      'work', 'relationships', 'health', 'finances', 'sleep',
      'exercise', 'weather', 'social', 'news', 'family', 'other'
    ]
  }],
  notes: {
    type: String,
    default: ''
  },
  triggers: [{
    type: String
  }],
  copingStrategies: [{
    type: String
  }],
  inputMethod: {
    type: String,
    enum: ['manual', 'voice', 'quick'],
    default: 'manual'
  },
  voiceTranscript: {
    type: String,
    default: ''
  },
  timeOfDay: {
    type: String,
    enum: ['morning', 'afternoon', 'evening', 'night'],
    default: 'morning'
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

moodLogSchema.index({ userId: 1, date: -1 });
moodLogSchema.index({ userId: 1, mood: 1 });

moodLogSchema.pre('save', async function() {
  this.updatedAt = new Date();
});

const MoodLog = mongoose.model('MoodLog', moodLogSchema);
export default MoodLog;
