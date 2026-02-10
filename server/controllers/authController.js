import crypto from 'crypto';
import { User, Provider } from '../models/index.js';
import { generateToken, generateRefreshToken, verifyToken } from '../middlewares/auth.js';
import { sendVerificationEmail, sendPasswordResetEmail, sendWelcomeEmail, sendOTPEmail, sendNotification } from '../services/emailService.js';
import { createLoginNotification, createRegistrationNotification } from '../services/notificationService.js';
import { logAction } from '../middlewares/auditLog.js';
import { AppError } from '../middlewares/errorHandler.js';
import { USER_ROLES } from '../config/constants.js';
import { sendPushToUser } from '../services/pushService.js';

export const register = async (req, res, next) => {
  try {
    const { email, password, firstName, lastName, role } = req.body;

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      throw new AppError('Email already registered', 409, 'EMAIL_EXISTS');
    }

    const userRole = [USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN].includes(role) 
      ? USER_ROLES.USER 
      : (role || USER_ROLES.USER);

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedOtp = crypto.createHash('sha256').update(otpCode).digest('hex');

    const user = await User.create({
      email: email.toLowerCase(),
      password,
      role: userRole,
      profile: {
        firstName: firstName || '',
        lastName: lastName || '',
        displayName: `${firstName || ''} ${lastName || ''}`.trim()
      },
      verification: {
        otp: hashedOtp,
        otpExpires: new Date(Date.now() + 10 * 60 * 1000)
      },
      consent: {
        termsAccepted: true,
        termsAcceptedAt: new Date(),
        privacyAccepted: true,
        privacyAcceptedAt: new Date()
      }
    });

    await sendOTPEmail(user.email, user.profile.firstName || 'there', otpCode);

    await logAction(user._id, 'REGISTER', 'user', user._id, { email: user.email }, req);

    res.status(201).json({
      success: true,
      message: 'Registration successful. Please check your email for your verification code.',
      data: {
        email: user.email,
        requiresVerification: true
      }
    });
  } catch (error) {
    next(error);
  }
};

export const registerProvider = async (req, res, next) => {
  try {
    const { email, password, firstName, lastName, providerData } = req.body;

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      throw new AppError('Email already registered', 409, 'EMAIL_EXISTS');
    }

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedOtp = crypto.createHash('sha256').update(otpCode).digest('hex');

    const user = await User.create({
      email: email.toLowerCase(),
      password,
      role: USER_ROLES.PROVIDER,
      profile: {
        firstName: firstName || '',
        lastName: lastName || '',
        displayName: `${firstName || ''} ${lastName || ''}`.trim()
      },
      verification: {
        otp: hashedOtp,
        otpExpires: new Date(Date.now() + 10 * 60 * 1000)
      },
      consent: {
        termsAccepted: true,
        termsAcceptedAt: new Date(),
        privacyAccepted: true,
        privacyAcceptedAt: new Date()
      }
    });

    let provider = null;
    if (providerData) {
      // Validate required professional information
      if (!providerData.professionalInfo?.title || 
          !providerData.professionalInfo?.registrationNumber ||
          !providerData.professionalInfo?.specialties ||
          providerData.professionalInfo.specialties.length === 0) {
        throw new AppError(
          'Professional information is incomplete. Title, registration number, and at least one specialty are required.',
          400,
          'INCOMPLETE_PROVIDER_DATA'
        );
      }

      // Ensure location has proper GeoJSON structure
      const practice = providerData.practice ? { ...providerData.practice } : {};
      
      // Always ensure location object exists with proper structure
      if (!practice.location) {
        practice.location = {};
      }
      
      // Always set coordinates to array, use existing if valid, otherwise default
      const existingCoords = practice.location.coordinates;
      const isValidCoords = Array.isArray(existingCoords) && existingCoords.length === 2;
      
      practice.location = {
        type: 'Point',
        coordinates: isValidCoords ? existingCoords : [0, 0]
      };

      provider = await Provider.create({
        userId: user._id,
        professionalInfo: providerData.professionalInfo || {},
        practice,
        availability: providerData.availability || { acceptingNewPatients: true, consultationTypes: ['in_person'] },
        verification: {
          isVerified: false,
          status: 'pending',
          documents: providerData.verification?.documents || []
        }
      });
    }

    await sendOTPEmail(user.email, user.profile.firstName || 'there', otpCode);

    await logAction(user._id, 'REGISTER_PROVIDER', 'user', user._id, { email: user.email }, req);

    res.status(201).json({
      success: true,
      message: 'Registration successful. Please check your email for your verification code.',
      data: {
        email: user.email,
        requiresVerification: true
      }
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password, rememberMe } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
    }

    if (!user.isActive) {
      throw new AppError('Account is deactivated', 403, 'ACCOUNT_DEACTIVATED');
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
    }

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedOtp = crypto.createHash('sha256').update(otpCode).digest('hex');

    const isLoginVerification = user.verification.emailVerified;
    user.verification.otp = hashedOtp;
    user.verification.otpExpires = new Date(Date.now() + 10 * 60 * 1000);
    user.verification.otpAttempts = 0;
    user.verification.otpContext = isLoginVerification ? 'login' : 'registration';
    user.rememberMe = !!rememberMe;
    await user.save();

    await sendOTPEmail(user.email, user.profile.firstName || 'there', otpCode);

    return res.json({
      success: true,
      message: 'Please verify your identity.',
      data: {
        email: user.email,
        requiresVerification: true,
        isLoginVerification
      }
    });
  } catch (error) {
    next(error);
  }
};

export const logout = async (req, res, next) => {
  try {
    await logAction(req.user._id, 'LOGOUT', 'user', req.user._id, null, req);

    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    next(error);
  }
};

export const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken: token } = req.body;

    if (!token) {
      throw new AppError('Refresh token required', 400, 'TOKEN_REQUIRED');
    }

    const decoded = verifyToken(token);
    if (!decoded || decoded.type !== 'refresh') {
      throw new AppError('Invalid refresh token', 401, 'INVALID_TOKEN');
    }

    const user = await User.findById(decoded.userId);
    if (!user || !user.isActive) {
      throw new AppError('User not found or inactive', 401, 'USER_NOT_FOUND');
    }

    if (!user.rememberMe) {
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
      if (!user.lastOtpVerifiedAt || user.lastOtpVerifiedAt < twoHoursAgo) {
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
        const hashedOtp = crypto.createHash('sha256').update(otpCode).digest('hex');
        user.verification.otp = hashedOtp;
        user.verification.otpExpires = new Date(Date.now() + 10 * 60 * 1000);
        user.verification.otpAttempts = 0;
        await user.save();
        await sendOTPEmail(user.email, user.profile.firstName || 'there', otpCode);

        return res.json({
          success: true,
          message: 'Security verification required.',
          data: {
            requiresOtpReverification: true,
            email: user.email
          }
        });
      }
    }

    const accessToken = generateToken(user._id, user.role, user.rememberMe ? '7d' : '2h');
    const newRefreshToken = generateRefreshToken(user._id, user.rememberMe);

    res.json({
      success: true,
      data: {
        accessToken,
        refreshToken: newRefreshToken
      }
    });
  } catch (error) {
    next(error);
  }
};

export const verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.query;

    if (!token) {
      throw new AppError('Verification token required', 400, 'TOKEN_REQUIRED');
    }

    const user = await User.findOne({
      'verification.emailVerificationToken': token,
      'verification.emailVerificationExpires': { $gt: new Date() }
    });

    if (!user) {
      throw new AppError('Invalid or expired verification token', 400, 'INVALID_TOKEN');
    }

    user.verification.emailVerified = true;
    user.verification.emailVerificationToken = undefined;
    user.verification.emailVerificationExpires = undefined;
    await user.save();

    await sendWelcomeEmail(user.email, user.profile.firstName || 'there');
    await logAction(user._id, 'VERIFY_EMAIL', 'user', user._id, null, req);

    res.json({
      success: true,
      message: 'Email verified successfully'
    });
  } catch (error) {
    next(error);
  }
};

export const resendVerification = async (req, res, next) => {
  try {
    const user = req.user;

    if (user.verification?.emailVerified) {
      throw new AppError('Email already verified', 400, 'ALREADY_VERIFIED');
    }

    const verificationToken = crypto.randomBytes(32).toString('hex');
    user.verification.emailVerificationToken = verificationToken;
    user.verification.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await user.save();

    const baseUrl = process.env.APP_URL || `https://${process.env.REPLIT_DEV_DOMAIN}`;
    await sendVerificationEmail(user.email, user.profile.firstName, `${baseUrl}/verify-email?token=${verificationToken}`);

    res.json({
      success: true,
      message: 'Verification email sent'
    });
  } catch (error) {
    next(error);
  }
};

export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() });
    
    if (!user) {
      return res.json({
        success: true,
        message: 'If an account exists, a password reset link will be sent'
      });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    user.passwordReset = {
      token: resetToken,
      expires: new Date(Date.now() + 60 * 60 * 1000)
    };
    await user.save();

    const baseUrl = process.env.APP_URL || `https://${process.env.REPLIT_DEV_DOMAIN}`;
    await sendPasswordResetEmail(user.email, user.profile.firstName, `${baseUrl}/reset-password?token=${resetToken}`);

    await logAction(user._id, 'FORGOT_PASSWORD', 'user', user._id, null, req);

    res.json({
      success: true,
      message: 'If an account exists, a password reset link will be sent'
    });
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      throw new AppError('Token and password are required', 400, 'MISSING_FIELDS');
    }

    const user = await User.findOne({
      'passwordReset.token': token,
      'passwordReset.expires': { $gt: new Date() }
    });

    if (!user) {
      throw new AppError('Invalid or expired reset token', 400, 'INVALID_TOKEN');
    }

    user.password = password;
    user.passwordReset = undefined;
    await user.save();

    await logAction(user._id, 'RESET_PASSWORD', 'user', user._id, null, req);

    res.json({
      success: true,
      message: 'Password reset successful'
    });
  } catch (error) {
    next(error);
  }
};

export const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    let provider = null;

    // If user is a provider, get their provider profile
    if (user.role === USER_ROLES.PROVIDER) {
      provider = await Provider.findOne({ userId: req.user._id });
    }

    res.json({
      success: true,
      data: { user, provider }
    });
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    const { profile, settings } = req.body;

    const user = await User.findById(req.user._id);

    if (profile) {
      user.profile = { ...user.profile.toObject(), ...profile };
      if (profile.firstName || profile.lastName) {
        user.profile.displayName = `${profile.firstName || user.profile.firstName || ''} ${profile.lastName || user.profile.lastName || ''}`.trim();
      }
    }

    if (settings) {
      user.settings = { ...user.settings.toObject(), ...settings };
    }

    await user.save();
    await logAction(user._id, 'UPDATE_PROFILE', 'user', user._id, null, req);

    res.json({
      success: true,
      message: 'Profile updated',
      data: { user: user.toJSON() }
    });
  } catch (error) {
    next(error);
  }
};

export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id);
    
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      throw new AppError('Current password is incorrect', 400, 'INVALID_PASSWORD');
    }

    user.password = newPassword;
    await user.save();

    await logAction(user._id, 'CHANGE_PASSWORD', 'user', user._id, null, req);

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    next(error);
  }
};

export const verifyPassword = async (req, res, next) => {
  try {
    const { password } = req.body;

    if (!password) {
      throw new AppError('Password is required', 400, 'PASSWORD_REQUIRED');
    }

    const user = await User.findById(req.user._id);
    
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw new AppError('Incorrect password', 401, 'INVALID_PASSWORD');
    }

    await logAction(user._id, 'VERIFY_PASSWORD', 'user', user._id, { purpose: 'unlock_profile_edit' }, req);

    res.json({
      success: true,
      message: 'Password verified successfully'
    });
  } catch (error) {
    next(error);
  }
};

export const verifyOTP = async (req, res, next) => {
  try {
    const { email, otp } = req.body;
    
    if (!email || !otp) {
      throw new AppError('Email and verification code are required', 400, 'MISSING_FIELDS');
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      throw new AppError('Invalid verification code', 400, 'INVALID_OTP');
    }

    if (user.verification.otpAttempts >= 5) {
      throw new AppError('Too many attempts. Please request a new code.', 429, 'TOO_MANY_ATTEMPTS');
    }

    if (!user.verification.otpExpires || user.verification.otpExpires < new Date()) {
      throw new AppError('Verification code has expired. Please request a new one.', 400, 'OTP_EXPIRED');
    }

    const hashedOtp = crypto.createHash('sha256').update(otp).digest('hex');
    if (hashedOtp !== user.verification.otp) {
      user.verification.otpAttempts = (user.verification.otpAttempts || 0) + 1;
      await user.save();
      throw new AppError('Invalid verification code', 400, 'INVALID_OTP');
    }

    const isLoginContext = user.verification.otpContext === 'login';

    user.verification.emailVerified = true;
    user.verification.otp = undefined;
    user.verification.otpExpires = undefined;
    user.verification.otpAttempts = 0;
    user.verification.otpContext = undefined;
    user.lastLogin = new Date();
    user.lastOtpVerifiedAt = new Date();
    await user.save();

    const accessToken = generateToken(user._id, user.role, user.rememberMe ? '7d' : '2h');
    const refreshToken = generateRefreshToken(user._id, user.rememberMe);

    if (isLoginContext) {
      await logAction(user._id, 'LOGIN', 'user', user._id, { email: user.email }, req);
      createLoginNotification(user._id, user.profile.firstName || 'there').catch(err => console.error('[NOTIFICATION]', err));
      sendPushToUser(user._id, 'login').catch(err => console.error('[PUSH]', err));

      if (user.settings?.notifications?.email !== false) {
        sendNotification(
          user.email,
          user.profile.firstName || 'there',
          'New Login to Your Account',
          `<p>A new login was detected on your account at ${new Date().toLocaleString('en-GB', { dateStyle: 'long', timeStyle: 'short' })}.</p><p>If this wasn't you, please change your password immediately.</p>`,
          null,
          null
        ).catch(err => console.error('[EMAIL]', err));
      }
    } else {
      await sendWelcomeEmail(user.email, user.profile.firstName || 'there');
      await logAction(user._id, 'VERIFY_OTP', 'user', user._id, null, req);
      createRegistrationNotification(user._id, user.profile.firstName || 'there').catch(err => console.error('[NOTIFICATION]', err));
      sendPushToUser(user._id, 'register').catch(err => console.error('[PUSH]', err));
    }

    res.json({
      success: true,
      message: isLoginContext ? 'Login verified successfully' : 'Email verified successfully',
      data: {
        user: user.toJSON(),
        accessToken,
        refreshToken,
        rememberMe: user.rememberMe
      }
    });
  } catch (error) {
    next(error);
  }
};

export const resendOTP = async (req, res, next) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      throw new AppError('Email is required', 400, 'MISSING_FIELDS');
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.json({ success: true, message: 'If an account exists, a new code has been sent.' });
    }

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedOtp = crypto.createHash('sha256').update(otpCode).digest('hex');
    
    user.verification.otp = hashedOtp;
    user.verification.otpExpires = new Date(Date.now() + 10 * 60 * 1000);
    user.verification.otpAttempts = 0;
    await user.save();

    await sendOTPEmail(user.email, user.profile.firstName || 'there', otpCode);

    res.json({
      success: true,
      message: 'A new verification code has been sent to your email.'
    });
  } catch (error) {
    next(error);
  }
};

export const reverifyOTP = async (req, res, next) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      throw new AppError('Email and verification code are required', 400, 'MISSING_FIELDS');
    }
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      throw new AppError('Invalid verification code', 400, 'INVALID_OTP');
    }
    if (user.verification.otpAttempts >= 5) {
      throw new AppError('Too many attempts. Please request a new code.', 429, 'TOO_MANY_ATTEMPTS');
    }
    if (!user.verification.otpExpires || user.verification.otpExpires < new Date()) {
      throw new AppError('Verification code has expired. Please request a new one.', 400, 'OTP_EXPIRED');
    }
    const hashedOtp = crypto.createHash('sha256').update(otp).digest('hex');
    if (hashedOtp !== user.verification.otp) {
      user.verification.otpAttempts = (user.verification.otpAttempts || 0) + 1;
      await user.save();
      throw new AppError('Invalid verification code', 400, 'INVALID_OTP');
    }
    user.verification.otp = undefined;
    user.verification.otpExpires = undefined;
    user.verification.otpAttempts = 0;
    user.lastOtpVerifiedAt = new Date();
    await user.save();

    const accessToken = generateToken(user._id, user.role, user.rememberMe ? '7d' : '2h');
    const refreshToken = generateRefreshToken(user._id, user.rememberMe);

    await logAction(user._id, 'REVERIFY_OTP', 'user', user._id, null, req);

    res.json({
      success: true,
      message: 'Verification successful',
      data: {
        user: user.toJSON(),
        accessToken,
        refreshToken
      }
    });
  } catch (error) {
    next(error);
  }
};

export const registerAdmin = async (req, res, next) => {
  try {
    const { email, password, firstName, lastName, role, secretKey } = req.body;

    const ADMIN_SECRET = process.env.ADMIN_REGISTRATION_SECRET || 'ADMIN_SECRET_2026';
    
    if (!secretKey || secretKey !== ADMIN_SECRET) {
      throw new AppError('Invalid secret key', 403, 'INVALID_SECRET_KEY');
    }

    if (!email || !password || !firstName || !lastName) {
      throw new AppError('All fields are required', 400, 'MISSING_FIELDS');
    }

    if (![USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN].includes(role)) {
      throw new AppError('Invalid admin role', 400, 'INVALID_ROLE');
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      throw new AppError('Email already registered', 409, 'EMAIL_EXISTS');
    }

    const user = await User.create({
      email: email.toLowerCase(),
      password,
      role,
      profile: {
        firstName,
        lastName,
        displayName: `${firstName} ${lastName}`.trim()
      },
      verification: {
        emailVerified: true
      },
      consent: {
        termsAccepted: true,
        termsAcceptedAt: new Date(),
        privacyAccepted: true,
        privacyAcceptedAt: new Date()
      }
    });

    await logAction(user._id, 'REGISTER_ADMIN', 'user', user._id, { email: user.email, role }, req);

    res.status(201).json({
      success: true,
      message: 'Admin account created successfully.',
      data: {
        user: user.toJSON()
      }
    });
  } catch (error) {
    next(error);
  }
};
