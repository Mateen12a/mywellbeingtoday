import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { USER_ROLES } from '../config/constants.js';

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 8
  },
  role: {
    type: String,
    enum: Object.values(USER_ROLES),
    default: USER_ROLES.USER
  },
  profile: {
    firstName: { type: String, default: '' },
    lastName: { type: String, default: '' },
    displayName: { type: String, default: '' },
    dateOfBirth: { type: Date },
    phone: { type: String, default: '' },
    address: {
      street: { type: String, default: '' },
      city: { type: String, default: '' },
      postcode: { type: String, default: '' },
      country: { type: String, default: 'UK' }
    },
    avatarUrl: { type: String, default: '' },
    bio: { type: String, default: '' }
  },
  settings: {
    notifications: {
      email: { type: Boolean, default: true },
      push: { type: Boolean, default: true },
      sms: { type: Boolean, default: false }
    },
    privacy: {
      shareDataWithProviders: { type: Boolean, default: false },
      anonymousAnalytics: { type: Boolean, default: true }
    },
    preferences: {
      language: { type: String, default: 'en' },
      timezone: { type: String, default: 'Europe/London' },
      theme: { type: String, default: 'light' }
    }
  },
  verification: {
    emailVerified: { type: Boolean, default: false },
    emailVerificationToken: { type: String },
    emailVerificationExpires: { type: Date },
    otp: { type: String },
    otpExpires: { type: Date },
    otpAttempts: { type: Number, default: 0 },
    otpContext: { type: String, enum: ['registration', 'login', 'reverify'], default: 'registration' },
    phoneVerified: { type: Boolean, default: false }
  },
  passwordReset: {
    token: { type: String },
    expires: { type: Date }
  },
  consent: {
    termsAccepted: { type: Boolean, default: false },
    termsAcceptedAt: { type: Date },
    privacyAccepted: { type: Boolean, default: false },
    privacyAcceptedAt: { type: Date },
    marketingOptIn: { type: Boolean, default: false }
  },
  subscription: {
    plan: { type: String, default: 'free' },
    status: { type: String, default: 'active' },
    expiresAt: { type: Date }
  },
  lastLogin: { type: Date },
  lastOtpVerifiedAt: { type: Date },
  rememberMe: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

userSchema.pre('save', async function() {
  this.updatedAt = new Date();
  
  if (!this.isModified('password')) return;
  
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.password;
  delete obj.verification?.emailVerificationToken;
  delete obj.passwordReset;
  return obj;
};

const User = mongoose.model('User', userSchema);
export default User;
