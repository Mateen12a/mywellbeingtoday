import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { User } from '../models/index.js';
import { USER_ROLES } from '../config/constants.js';

const getJwtSecret = () => {
  if (process.env.JWT_SECRET) {
    return process.env.JWT_SECRET;
  }
  if (process.env.SESSION_SECRET) {
    return process.env.SESSION_SECRET;
  }
  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET environment variable must be set in production');
  }
  console.warn('[AUTH] Warning: Using generated JWT secret. Set JWT_SECRET for persistent sessions.');
  return crypto.randomBytes(64).toString('hex');
};

const JWT_SECRET = getJwtSecret();

export const generateToken = (userId, role, expiresIn = '1h') => {
  return jwt.sign(
    { userId, role },
    JWT_SECRET,
    { expiresIn }
  );
};

export const generateRefreshToken = (userId) => {
  return jwt.sign(
    { userId, type: 'refresh' },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
};

export const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
};

export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        success: false,
        message: 'Access denied. No token provided.' 
      });
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    if (!decoded) {
      return res.status(401).json({ 
        success: false,
        message: 'Invalid or expired token.' 
      });
    }

    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return res.status(401).json({ 
        success: false,
        message: 'User not found.' 
      });
    }

    if (!user.isActive) {
      return res.status(403).json({ 
        success: false,
        message: 'Account is deactivated.' 
      });
    }

    req.user = user;
    req.userId = user._id;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Authentication failed.' 
    });
  }
};

export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    if (decoded) {
      const user = await User.findById(decoded.userId).select('-password');
      if (user && user.isActive) {
        req.user = user;
        req.userId = user._id;
      }
    }
    
    next();
  } catch (error) {
    next();
  }
};

export const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false,
        message: 'Authentication required.' 
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false,
        message: 'Access denied. Insufficient permissions.' 
      });
    }

    next();
  };
};

export const requireVerifiedEmail = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ 
      success: false,
      message: 'Authentication required.' 
    });
  }

  if (!req.user.verification?.emailVerified) {
    return res.status(403).json({ 
      success: false,
      message: 'Email verification required.',
      code: 'EMAIL_NOT_VERIFIED'
    });
  }

  next();
};

export const isAdmin = authorize(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN);
export const isSuperAdmin = authorize(USER_ROLES.SUPER_ADMIN);
export const isProvider = authorize(USER_ROLES.PROVIDER, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN);
export const isUser = authorize(USER_ROLES.USER, USER_ROLES.PROVIDER, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN);
