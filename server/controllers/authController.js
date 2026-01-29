import crypto from 'crypto';
import { User, Provider } from '../models/index.js';
import { generateToken, generateRefreshToken, verifyToken } from '../middlewares/auth.js';
import { sendVerificationEmail, sendPasswordResetEmail, sendWelcomeEmail } from '../services/emailService.js';
import { logAction } from '../middlewares/auditLog.js';
import { AppError } from '../middlewares/errorHandler.js';
import { USER_ROLES } from '../config/constants.js';

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

    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

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
        emailVerificationToken: verificationToken,
        emailVerificationExpires: verificationExpires
      },
      consent: {
        termsAccepted: true,
        termsAcceptedAt: new Date(),
        privacyAccepted: true,
        privacyAcceptedAt: new Date()
      }
    });

    const baseUrl = process.env.APP_URL || `https://${process.env.REPLIT_DEV_DOMAIN}`;
    await sendVerificationEmail(user.email, user.profile.firstName, `${baseUrl}/verify-email?token=${verificationToken}`);

    const accessToken = generateToken(user._id, user.role);
    const refreshToken = generateRefreshToken(user._id);

    await logAction(user._id, 'REGISTER', 'user', user._id, { email: user.email }, req);

    res.status(201).json({
      success: true,
      message: 'Registration successful. Please check your email to verify your account.',
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

export const registerProvider = async (req, res, next) => {
  try {
    const { email, password, firstName, lastName, providerData } = req.body;

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      throw new AppError('Email already registered', 409, 'EMAIL_EXISTS');
    }

    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

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
        emailVerificationToken: verificationToken,
        emailVerificationExpires: verificationExpires
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

    const baseUrl = process.env.APP_URL || `https://${process.env.REPLIT_DEV_DOMAIN}`;
    await sendVerificationEmail(user.email, user.profile.firstName, `${baseUrl}/verify-email?token=${verificationToken}`);

    const accessToken = generateToken(user._id, user.role);
    const refreshToken = generateRefreshToken(user._id);

    await logAction(user._id, 'REGISTER_PROVIDER', 'user', user._id, { email: user.email }, req);

    res.status(201).json({
      success: true,
      message: 'Provider registration successful. Please check your email to verify your account.',
      data: {
        user: user.toJSON(),
        provider: provider?.toJSON(),
        accessToken,
        refreshToken
      }
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

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

    // Note: Email verification is recommended but not required for login
    // Providers can access their dashboard to see verification status
    // This matches the behavior after registration where they're logged in immediately

    user.lastLogin = new Date();
    await user.save();

    const accessToken = generateToken(user._id, user.role);
    const refreshToken = generateRefreshToken(user._id);

    await logAction(user._id, 'LOGIN', 'user', user._id, { email: user.email }, req);

    res.json({
      success: true,
      message: 'Login successful',
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

    const accessToken = generateToken(user._id, user.role);
    const newRefreshToken = generateRefreshToken(user._id);

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
