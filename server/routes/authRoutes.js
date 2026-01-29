import { Router } from 'express';
import * as authController from '../controllers/authController.js';
import { authenticate } from '../middlewares/auth.js';
import { validateRegistration, validateLogin, validateProfileUpdate } from '../middlewares/validate.js';

const router = Router();

router.post('/register', validateRegistration, authController.register);
router.post('/register-provider', validateRegistration, authController.registerProvider);
router.post('/register-admin', authController.registerAdmin);
router.post('/login', validateLogin, authController.login);
router.post('/logout', authenticate, authController.logout);
router.post('/refresh-token', authController.refreshToken);
router.get('/verify-email', authController.verifyEmail);
router.post('/resend-verification', authenticate, authController.resendVerification);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);
router.get('/profile', authenticate, authController.getProfile);
router.put('/profile', authenticate, validateProfileUpdate, authController.updateProfile);
router.post('/change-password', authenticate, authController.changePassword);
router.post('/verify-password', authenticate, authController.verifyPassword);

export default router;
