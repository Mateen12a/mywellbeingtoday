import { Router } from 'express';
import * as moodController from '../controllers/moodController.js';
import { authenticate } from '../middlewares/auth.js';
import { validateMoodLog } from '../middlewares/validate.js';

const router = Router();

router.use(authenticate);

router.post('/', validateMoodLog, moodController.createMoodLog);
router.post('/quick', moodController.quickMoodLog);
router.get('/', moodController.getMoodLogs);
router.get('/today', moodController.getTodayMood);
router.get('/stats', moodController.getMoodStats);
router.get('/:id', moodController.getMoodLog);
router.put('/:id', moodController.updateMoodLog);
router.delete('/:id', moodController.deleteMoodLog);

export default router;
