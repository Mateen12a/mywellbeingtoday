import { Router } from 'express';
import * as providerController from '../controllers/providerController.js';
import { authenticate, isProvider, optionalAuth } from '../middlewares/auth.js';

const router = Router();

router.get('/search', optionalAuth, providerController.searchProviders);
router.get('/ai-suggestions', authenticate, providerController.getAISuggestedProviders);
router.post('/profile', authenticate, providerController.createProviderProfile);
router.get('/profile/me', authenticate, isProvider, providerController.getProviderProfile);
router.put('/profile', authenticate, isProvider, providerController.updateProviderProfile);
router.get('/appointments', authenticate, isProvider, providerController.getProviderAppointments);
router.put('/appointments/:appointmentId', authenticate, isProvider, providerController.updateAppointmentStatus);
router.get('/shared-reports', authenticate, isProvider, providerController.getSharedReports);
router.get('/users/search', authenticate, isProvider, providerController.searchUsersForCertificate);
router.get('/ai-insights', authenticate, isProvider, providerController.getProviderAIInsights);
router.post('/ai-chat', authenticate, isProvider, providerController.providerAiChat);

// Provider AI Chat Conversations
router.get('/ai-conversations', authenticate, isProvider, providerController.getProviderConversations);
router.post('/ai-conversations', authenticate, isProvider, providerController.createProviderConversation);
router.get('/ai-conversations/:conversationId', authenticate, isProvider, providerController.getProviderConversation);
router.patch('/ai-conversations/:conversationId', authenticate, isProvider, providerController.updateProviderConversationTitle);
router.delete('/ai-conversations/:conversationId', authenticate, isProvider, providerController.deleteProviderConversation);
router.post('/ai-conversations/:conversationId/messages', authenticate, isProvider, providerController.sendProviderChatMessage);

// Must be last - catches provider IDs
router.get('/:id', optionalAuth, providerController.getProviderById);

export default router;
