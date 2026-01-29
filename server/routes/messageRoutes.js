import { Router } from 'express';
import * as messageController from '../controllers/messageController.js';
import { authenticate } from '../middlewares/auth.js';

const router = Router();

router.use(authenticate);

router.get('/conversations', messageController.getConversations);
router.get('/conversations/:id', messageController.getConversationMessages);
router.post('/conversations', messageController.createConversation);
router.post('/conversations/:id/messages', messageController.sendMessage);
router.patch('/:id/read', messageController.markAsRead);
router.get('/unread-count', messageController.getUnreadCount);
router.post('/report', messageController.reportConversation);

export default router;
