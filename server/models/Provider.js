import mongoose from 'mongoose';
import { PROVIDER_SPECIALTIES } from '../config/constants.js';

const providerSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  professionalInfo: {
    title: { type: String, default: '' },
    qualifications: [{ type: String }],
    certificationType: { type: String, default: '' },
    registrationNumber: { type: String },
    yearsOfExperience: { type: Number, default: 0 },
    specialties: [{
      type: String,
      enum: PROVIDER_SPECIALTIES
    }],
    bio: { type: String, default: '' },
    languages: [{ type: String }]
  },
  practice: {
    name: { type: String, default: '' },
    address: {
      street: { type: String, default: '' },
      city: { type: String, default: '' },
      postcode: { type: String, default: '' },
      country: { type: String, default: 'UK' }
    },
    phone: { type: String, default: '' },
    email: { type: String, default: '' },
    website: { type: String, default: '' },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: {
        type: [Number],
        default: [0, 0]
      }
    }
  },
  availability: {
    acceptingNewPatients: { type: Boolean, default: true },
    consultationTypes: [{
      type: String,
      enum: ['in_person', 'video', 'phone']
    }],
    workingHours: [{
      day: { type: Number, min: 0, max: 6 },
      start: { type: String },
      end: { type: String },
      isAvailable: { type: Boolean, default: true }
    }],
    appointmentDuration: { type: Number, default: 30 }
  },
  verification: {
    isVerified: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    },
    verifiedAt: { type: Date },
    verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    rejectionReason: { type: String },
    documents: [{
      type: { type: String },
      name: { type: String },
      url: { type: String },
      uploadedAt: { type: Date }
    }]
  },
  ratings: {
    average: { type: Number, default: 0 },
    count: { type: Number, default: 0 }
  },
  services: [{
    name: { type: String },
    description: { type: String },
    duration: { type: Number },
    price: { type: Number }
  }],
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

providerSchema.index({ 'practice.location': '2dsphere' });
providerSchema.index({ 'professionalInfo.specialties': 1 });
providerSchema.index({ 'practice.city': 1 });

providerSchema.pre('save', async function() {
  this.updatedAt = new Date();
  
  // Ensure location has proper GeoJSON structure for 2dsphere index
  if (!this.practice) {
    this.practice = {};
  }
  
  if (!this.practice.location) {
    this.practice.location = {
      type: 'Point',
      coordinates: [0, 0]
    };
  } else {
    // Ensure coordinates exists and is an array
    if (!Array.isArray(this.practice.location.coordinates)) {
      this.practice.location.coordinates = [0, 0];
    }
    // Ensure type is set
    if (!this.practice.location.type) {
      this.practice.location.type = 'Point';
    }
  }
});

const Provider = mongoose.model('Provider', providerSchema);
export default Provider;
