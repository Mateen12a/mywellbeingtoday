import validator from 'validator';
import { AppError } from './errorHandler.js';

export const validateEmail = (email) => {
  return validator.isEmail(email);
};

export const validatePassword = (password) => {
  return password && password.length >= 8;
};

export const sanitizeInput = (input) => {
  if (typeof input === 'string') {
    return validator.escape(validator.trim(input));
  }
  return input;
};

export const validateRegistration = (req, res, next) => {
  const { email, password, confirmPassword } = req.body;

  if (!email || !validateEmail(email)) {
    return next(new AppError('Valid email is required', 400, 'INVALID_EMAIL'));
  }

  if (!password || !validatePassword(password)) {
    return next(new AppError('Password must be at least 8 characters', 400, 'INVALID_PASSWORD'));
  }

  if (confirmPassword && password !== confirmPassword) {
    return next(new AppError('Passwords do not match', 400, 'PASSWORD_MISMATCH'));
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
    req.body.profile.firstName = sanitizeInput(firstName);
  }

  if (lastName) {
    req.body.profile.lastName = sanitizeInput(lastName);
  }

  if (phone && !validator.isMobilePhone(phone, 'any')) {
    return next(new AppError('Invalid phone number', 400, 'INVALID_PHONE'));
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
