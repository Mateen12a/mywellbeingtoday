import Notification from '../models/Notification.js';

export async function createNotification(userId, { type, title, message, link = null, metadata = {} }) {
  try {
    const notification = await Notification.create({
      userId,
      type,
      title,
      message,
      link,
      metadata
    });
    return notification;
  } catch (error) {
    console.error('[NOTIFICATION] Error creating notification:', error.message);
    return null;
  }
}

export async function createLoginNotification(userId, userName) {
  return createNotification(userId, {
    type: 'login',
    title: 'New Login',
    message: `Welcome back, ${userName}! You logged in successfully.`,
    link: '/dashboard'
  });
}

export async function createRegistrationNotification(userId, userName) {
  return createNotification(userId, {
    type: 'register',
    title: 'Welcome!',
    message: `Welcome to mywellbeingtoday, ${userName}! Start tracking your wellbeing journey.`,
    link: '/dashboard'
  });
}

export async function createMoodNotification(userId, mood, moodScore) {
  return createNotification(userId, {
    type: 'mood_logged',
    title: 'Mood Tracked',
    message: `Your mood "${mood}" (score: ${moodScore}/10) has been recorded. Keep tracking for better insights!`,
    link: '/history'
  });
}

export async function createActivityNotification(userId, category, title) {
  return createNotification(userId, {
    type: 'activity_logged',
    title: 'Activity Logged',
    message: `Your ${category} activity "${title}" has been recorded. Great job staying active!`,
    link: '/history'
  });
}

export async function createAppointmentBookedNotification(userId, providerName, dateTime) {
  const date = new Date(dateTime);
  const dateStr = date.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const timeStr = date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  return createNotification(userId, {
    type: 'appointment_booked',
    title: 'Appointment Booked',
    message: `Your appointment with ${providerName} on ${dateStr} at ${timeStr} has been booked.`,
    link: '/appointments'
  });
}

export async function createAppointmentConfirmedNotification(userId, providerName, dateTime) {
  const date = new Date(dateTime);
  const dateStr = date.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  return createNotification(userId, {
    type: 'appointment_confirmed',
    title: 'Appointment Confirmed',
    message: `Your appointment with ${providerName} on ${dateStr} has been confirmed.`,
    link: '/appointments'
  });
}

export async function createAppointmentCancelledNotification(userId, providerName, dateTime) {
  const date = new Date(dateTime);
  const dateStr = date.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  return createNotification(userId, {
    type: 'appointment_cancelled',
    title: 'Appointment Cancelled',
    message: `Your appointment with ${providerName} on ${dateStr} has been cancelled.`,
    link: '/appointments'
  });
}

export async function createEmergencyNotification(userId) {
  return createNotification(userId, {
    type: 'emergency',
    title: 'Emergency Services Accessed',
    message: 'You accessed emergency services. If you need immediate help, please call your local emergency number.',
    link: '/directory?tab=emergency'
  });
}

export async function createProviderVerifiedNotification(userId) {
  return createNotification(userId, {
    type: 'provider_verified',
    title: 'Profile Verified',
    message: 'Congratulations! Your provider profile has been verified. You can now receive patient appointments.',
    link: '/provider-dashboard'
  });
}

export default {
  createNotification,
  createLoginNotification,
  createRegistrationNotification,
  createMoodNotification,
  createActivityNotification,
  createAppointmentBookedNotification,
  createAppointmentConfirmedNotification,
  createAppointmentCancelledNotification,
  createEmergencyNotification,
  createProviderVerifiedNotification
};
