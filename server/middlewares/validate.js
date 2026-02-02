import validator from 'validator';
import { AppError } from './errorHandler.js';

// Password Policy Constants
export const PASSWORD_REQUIREMENTS = {
  minLength: 8,
  maxLength: 128,
  requireUppercase: true,
  requireLowercase: true,
  requireNumber: true,
  requireSpecialChar: true
};

// Email regex - RFC 5322 compliant (simplified for practical use)
export const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/;

// Phone regex - International format
export const PHONE_REGEX = /^(\+?\d{1,4}[\s.-]?)?(\(?\d{1,4}\)?[\s.-]?)?[\d\s.-]{6,14}$/;

export const validateEmail = (email) => {
  if (!email || typeof email !== 'string') return false;
  const trimmed = email.trim().toLowerCase();
  if (trimmed.length > 254) return false;
  return EMAIL_REGEX.test(trimmed);
};

export const validatePassword = (password) => {
  if (!password || typeof password !== 'string') {
    return { isValid: false, errors: ['Password is required'] };
  }
  
  const errors = [];
  
  if (password.length < PASSWORD_REQUIREMENTS.minLength) {
    errors.push(`Password must be at least ${PASSWORD_REQUIREMENTS.minLength} characters`);
  }
  
  if (password.length > PASSWORD_REQUIREMENTS.maxLength) {
    errors.push(`Password must be less than ${PASSWORD_REQUIREMENTS.maxLength} characters`);
  }
  
  if (PASSWORD_REQUIREMENTS.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter (A-Z)');
  }
  
  if (PASSWORD_REQUIREMENTS.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter (a-z)');
  }
  
  if (PASSWORD_REQUIREMENTS.requireNumber && !/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number (0-9)');
  }
  
  if (PASSWORD_REQUIREMENTS.requireSpecialChar && !/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password)) {
    errors.push('Password must contain at least one special character (!@#$%^&*...)');
  }
  
  return { isValid: errors.length === 0, errors };
};

export const validatePhoneNumber = (phone) => {
  if (!phone || typeof phone !== 'string') return false;
  const sanitized = phone.trim().replace(/[\s.-]/g, '');
  const digitsOnly = sanitized.replace(/\D/g, '');
  if (digitsOnly.length < 7 || digitsOnly.length > 15) return false;
  return PHONE_REGEX.test(phone.trim());
};

export const sanitizeInput = (input) => {
  if (typeof input === 'string') {
    return validator.escape(validator.trim(input));
  }
  return input;
};

export const validateRegistration = (req, res, next) => {
  const { email, password, confirmPassword, firstName, lastName } = req.body;

  // Validate email
  if (!email) {
    return next(new AppError('Email is required', 400, 'EMAIL_REQUIRED'));
  }
  
  if (!validateEmail(email)) {
    return next(new AppError('Please enter a valid email address', 400, 'INVALID_EMAIL'));
  }

  // Validate password with full policy
  const passwordValidation = validatePassword(password);
  if (!passwordValidation.isValid) {
    return next(new AppError(passwordValidation.errors.join('. '), 400, 'INVALID_PASSWORD'));
  }

  // Validate password confirmation
  if (confirmPassword && password !== confirmPassword) {
    return next(new AppError('Passwords do not match', 400, 'PASSWORD_MISMATCH'));
  }

  // Validate names if provided
  if (firstName !== undefined) {
    if (!firstName || firstName.trim().length < 2) {
      return next(new AppError('First name must be at least 2 characters', 400, 'INVALID_FIRST_NAME'));
    }
    if (firstName.trim().length > 50) {
      return next(new AppError('First name is too long (max 50 characters)', 400, 'INVALID_FIRST_NAME'));
    }
  }
  
  if (lastName !== undefined) {
    if (!lastName || lastName.trim().length < 2) {
      return next(new AppError('Last name must be at least 2 characters', 400, 'INVALID_LAST_NAME'));
    }
    if (lastName.trim().length > 50) {
      return next(new AppError('Last name is too long (max 50 characters)', 400, 'INVALID_LAST_NAME'));
    }
  }

  req.body.email = validator.normalizeEmail(email);
  next();
};

export const validateLogin = (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !validateEmail(email)) {
    return next(new AppError('Valid email is required', 400, 'INVALID_EMAIL'));
  }

  if (!password) {
    return next(new AppError('Password is required', 400, 'PASSWORD_REQUIRED'));
  }

  req.body.email = validator.normalizeEmail(email);
  next();
};

export const validateProfileUpdate = (req, res, next) => {
  const { firstName, lastName, phone } = req.body.profile || {};

  if (firstName) {
    if (firstName.trim().length < 2) {
      return next(new AppError('First name must be at least 2 characters', 400, 'INVALID_FIRST_NAME'));
    }
    if (firstName.trim().length > 50) {
      return next(new AppError('First name is too long (max 50 characters)', 400, 'INVALID_FIRST_NAME'));
    }
    req.body.profile.firstName = sanitizeInput(firstName);
  }

  if (lastName) {
    if (lastName.trim().length < 2) {
      return next(new AppError('Last name must be at least 2 characters', 400, 'INVALID_LAST_NAME'));
    }
    if (lastName.trim().length > 50) {
      return next(new AppError('Last name is too long (max 50 characters)', 400, 'INVALID_LAST_NAME'));
    }
    req.body.profile.lastName = sanitizeInput(lastName);
  }

  if (phone) {
    if (!validatePhoneNumber(phone)) {
      return next(new AppError('Please enter a valid phone number', 400, 'INVALID_PHONE'));
    }
  }

  next();
};

export const validateActivityLog = (req, res, next) => {
  const { category, title } = req.body;

  if (!category) {
    return next(new AppError('Activity category is required', 400, 'CATEGORY_REQUIRED'));
  }

  if (!title || title.trim().length === 0) {
    return next(new AppError('Activity title is required', 400, 'TITLE_REQUIRED'));
  }

  req.body.title = sanitizeInput(title);
  next();
};

export const validateMoodLog = (req, res, next) => {
  const { mood, moodScore } = req.body;

  if (!mood) {
    return next(new AppError('Mood is required', 400, 'MOOD_REQUIRED'));
  }

  if (!moodScore || moodScore < 1 || moodScore > 10) {
    return next(new AppError('Mood score must be between 1 and 10', 400, 'INVALID_MOOD_SCORE'));
  }

  next();
};

export const validateAppointment = (req, res, next) => {
  const { providerId, dateTime, type } = req.body;

  if (!providerId) {
    return next(new AppError('Provider is required', 400, 'PROVIDER_REQUIRED'));
  }

  if (!dateTime) {
    return next(new AppError('Appointment date and time is required', 400, 'DATETIME_REQUIRED'));
  }

  const appointmentDate = new Date(dateTime);
  if (appointmentDate < new Date()) {
    return next(new AppError('Appointment cannot be in the past', 400, 'INVALID_DATETIME'));
  }

  if (!type || !['in_person', 'video', 'phone'].includes(type)) {
    return next(new AppError('Valid appointment type is required', 400, 'INVALID_TYPE'));
  }

  next();
};
