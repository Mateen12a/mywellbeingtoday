import { Router } from 'express';
import * as adminController from '../controllers/adminController.js';
import { authenticate, isAdmin, isSuperAdmin } from '../middlewares/auth.js';

const router = Router();

router.use(authenticate, isAdmin);

router.get('/users', adminController.getUsers);
router.get('/users/:id', adminController.getUser);
router.get('/users/:id/usage', adminController.getUserUsageStats);
router.put('/users/:id', adminController.updateUser);
router.delete('/users/:id', adminController.deleteUser);
router.delete('/users/:id/permanent', isSuperAdmin, adminController.permanentlyDeleteUser);

router.get('/providers', adminController.getProviders);
router.post('/providers/:id/verify', adminController.verifyProvider);
router.post('/providers/:id/reject', adminController.rejectProvider);
router.post('/providers/:id/suspend', adminController.suspendProvider);
router.post('/providers/:id/unsuspend', adminController.unsuspendProvider);
router.post('/providers/:id/unverify', adminController.unverifyProvider);
router.put('/providers/:id', adminController.updateProvider);

router.get('/audit-logs', adminController.getAuditLogs);
router.get('/dashboard', adminController.getDashboardStats);
router.get('/ai-insights', adminController.getAIInsights);
router.get('/activity', adminController.getPlatformActivity);
router.get('/reported-chats', adminController.getReportedChats);
router.get('/reported-chats/:id', adminController.getReportedChatDetails);
router.patch('/reported-chats/:id/resolve', adminController.resolveReportedChat);

router.post('/admins', isSuperAdmin, adminController.createAdmin);
router.get('/admins', isSuperAdmin, adminController.getAdmins);
router.get('/settings', isSuperAdmin, adminController.getSystemSettings);
router.get('/analytics', isSuperAdmin, adminController.getAnonymizedAnalytics);
router.get('/superadmin-stats', isSuperAdmin, adminController.getSuperAdminStats);
router.get('/subscription-analytics', isSuperAdmin, adminController.getSubscriptionAnalytics);

export default router;
