import { Router } from 'express';
import * as adminController from '../controllers/adminController.js';
import * as staffMessageController from '../controllers/staffMessageController.js';
import { authenticate, isAdmin, isSuperAdmin, isAdminOrSupport } from '../middlewares/auth.js';

const router = Router();

router.get('/admins/invite/:token', adminController.getAdminInvite);
router.post('/admins/invite/accept', adminController.acceptAdminInvite);

router.use(authenticate, isAdminOrSupport);

router.get('/users', adminController.getUsers);
router.get('/users/:id', adminController.getUser);
router.get('/users/:id/usage', adminController.getUserUsageStats);
router.put('/users/:id', isAdmin, adminController.updateUser);
router.delete('/users/:id', isAdmin, adminController.deleteUser);
router.delete('/users/:id/permanent', isSuperAdmin, adminController.permanentlyDeleteUser);

router.get('/providers', adminController.getProviders);
router.post('/providers/:id/verify', isAdmin, adminController.verifyProvider);
router.post('/providers/:id/reject', isAdmin, adminController.rejectProvider);
router.post('/providers/:id/suspend', isAdmin, adminController.suspendProvider);
router.post('/providers/:id/unsuspend', isAdmin, adminController.unsuspendProvider);
router.post('/providers/:id/unverify', isAdmin, adminController.unverifyProvider);
router.put('/providers/:id', isAdmin, adminController.updateProvider);
router.delete('/providers/:id', isSuperAdmin, adminController.deleteProvider);

router.get('/audit-logs', adminController.getAuditLogs);
router.get('/dashboard', adminController.getDashboardStats);
router.get('/ai-insights', adminController.getAIInsights);
router.get('/activity', adminController.getPlatformActivity);
router.get('/reported-chats', adminController.getReportedChats);
router.get('/reported-chats/:id', adminController.getReportedChatDetails);
router.patch('/reported-chats/:id/resolve', isAdmin, adminController.resolveReportedChat);

router.post('/admins/invite', isSuperAdmin, adminController.inviteAdmin);
router.get('/admins', isSuperAdmin, adminController.getAdmins);
router.delete('/admins/:id', isSuperAdmin, adminController.deleteAdmin);
router.patch('/admins/:id', isSuperAdmin, adminController.updateAdmin);
router.get('/settings', isSuperAdmin, adminController.getSystemSettings);
router.get('/analytics', isSuperAdmin, adminController.getAnonymizedAnalytics);
router.get('/superadmin-stats', isSuperAdmin, adminController.getSuperAdminStats);
router.get('/subscription-analytics', isSuperAdmin, adminController.getSubscriptionAnalytics);

router.get('/messages/members', staffMessageController.getStaffMembers);
router.get('/messages/unread-count', staffMessageController.getStaffUnreadCount);
router.get('/messages/conversations', staffMessageController.getStaffConversations);
router.post('/messages/conversations', staffMessageController.createStaffConversation);
router.get('/messages/conversations/:id', staffMessageController.getStaffConversationMessages);
router.post('/messages/conversations/:id/send', staffMessageController.sendStaffMessage);
router.patch('/messages/conversations/:id/read', staffMessageController.markStaffConversationRead);

export default router;
