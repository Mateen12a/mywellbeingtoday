export const USER_ROLES = {
  USER: 'user',
  PROVIDER: 'provider',
  ADMIN: 'admin',
  SUPER_ADMIN: 'super_admin'
};

export const APPOINTMENT_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  CANCELLED: 'cancelled',
  COMPLETED: 'completed'
};

export const WELLBEING_LEVELS = {
  EXCELLENT: 'excellent',
  GOOD: 'good',
  MODERATE: 'moderate',
  LOW: 'low',
  CRITICAL: 'critical'
};

export const MOOD_TYPES = [
  'happy', 'calm', 'focused', 'anxious', 'stressed', 
  'sad', 'tired', 'energetic', 'irritated', 'hopeful'
];

export const ACTIVITY_CATEGORIES = [
  'exercise', 'work', 'sleep', 'social', 'relaxation',
  'nutrition', 'meditation', 'hobby', 'healthcare', 'other'
];

export const PROVIDER_SPECIALTIES = [
  'general_practitioner', 'mental_health', 'nutrition',
  'physical_therapy', 'counseling', 'social_work',
  'occupational_therapy', 'psychiatry', 'emergency_services', 'other'
];

export const MAIN_PROVIDER_SPECIALTIES = [
  'general_practitioner', 'mental_health', 'nutrition',
  'physical_therapy', 'counseling', 'social_work',
  'occupational_therapy', 'psychiatry', 'emergency_services'
];

export const JWT_CONFIG = {
  ACCESS_TOKEN_EXPIRY: '1h',
  REFRESH_TOKEN_EXPIRY: '7d',
  VERIFICATION_TOKEN_EXPIRY: '24h',
  RESET_TOKEN_EXPIRY: '1h'
};
