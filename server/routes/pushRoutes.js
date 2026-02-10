import { Router } from 'express';
import * as pushController from '../controllers/pushController.js';
import { authenticate } from '../middlewares/auth.js';

const router = Router();

router.get('/vapid-key', pushController.getVapidPublicKey);
router.post('/subscribe', authenticate, pushController.subscribe);
router.post('/unsubscribe', authenticate, pushController.unsubscribe);
router.get('/status', authenticate, pushController.getSubscriptionStatus);

export default router;
