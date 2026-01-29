import mongoose from 'mongoose';
import { APPOINTMENT_STATUS } from '../config/constants.js';

const appointmentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  providerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Provider',
    required: true
  },
  dateTime: {
    type: Date,
    required: true
  },
  endTime: {
    type: Date,
    required: true
  },
  duration: {
    type: Number,
    required: true,
    default: 30
  },
  type: {
    type: String,
    enum: ['in_person', 'video', 'phone'],
    required: true
  },
  status: {
    type: String,
    enum: Object.values(APPOINTMENT_STATUS),
    default: APPOINTMENT_STATUS.PENDING
  },
  reason: {
    type: String,
    default: ''
  },
  wellbeingReportId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'WellbeingReport'
  },
  autoFilledFromReport: {
    type: Boolean,
    default: false
  },
  notes: {
    userNotes: { type: String, default: '' },
    providerNotes: { type: String, default: '' }
  },
  reminders: {
    emailSent: { type: Boolean, default: false },
    smsSent: { type: Boolean, default: false },
    reminderTime: { type: Date }
  },
  payment: {
    required: { type: Boolean, default: false },
    amount: { type: Number, default: 0 },
    status: { type: String, enum: ['pending', 'paid', 'refunded', 'waived'], default: 'pending' },
    paidAt: { type: Date }
  },
  cancellation: {
    cancelledBy: { type: String, enum: ['user', 'provider', 'system'] },
    cancelledAt: { type: Date },
    reason: { type: String }
  },
  followUp: {
    recommended: { type: Boolean, default: false },
    scheduledAppointmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment' }
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

appointmentSchema.index({ userId: 1, dateTime: -1 });
appointmentSchema.index({ providerId: 1, dateTime: 1 });
appointmentSchema.index({ status: 1 });

appointmentSchema.pre('save', async function() {
  this.updatedAt = new Date();
});

const Appointment = mongoose.model('Appointment', appointmentSchema);
export default Appointment;
