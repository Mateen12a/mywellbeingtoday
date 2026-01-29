import { Router } from 'express';
import * as wellbeingController from '../controllers/wellbeingController.js';
import { authenticate } from '../middlewares/auth.js';

const router = Router();

router.use(authenticate);

router.post('/report', wellbeingController.generateReport);
router.get('/reports', wellbeingController.getReports);
router.get('/reports/latest', wellbeingController.getLatestReport);
router.get('/reports/:id', wellbeingController.getReport);
router.post('/reports/:id/share', wellbeingController.shareReport);
router.get('/dashboard', wellbeingController.getDashboardSummary);
router.post('/chat', wellbeingController.searchKnowledgeBase);
router.get('/chat/history', wellbeingController.getChatHistory);
router.delete('/chat/history', wellbeingController.clearChatHistory);

router.get('/conversations', wellbeingController.getConversations);
router.post('/conversations', wellbeingController.createConversation);
router.get('/conversations/:conversationId', wellbeingController.getConversation);
router.patch('/conversations/:conversationId', wellbeingController.updateConversationTitle);
router.delete('/conversations/:conversationId', wellbeingController.deleteConversation);
router.post('/conversations/:conversationId/messages', wellbeingController.sendMessage);

export default router;
