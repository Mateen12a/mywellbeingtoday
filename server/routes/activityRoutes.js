import { Router } from 'express';
import * as activityController from '../controllers/activityController.js';
import { authenticate } from '../middlewares/auth.js';
import { validateActivityLog } from '../middlewares/validate.js';

const router = Router();

router.use(authenticate);

router.post('/', validateActivityLog, activityController.createActivity);
router.get('/', activityController.getActivities);
router.get('/today', activityController.getTodayActivities);
router.get('/stats', activityController.getActivityStats);
router.get('/:id', activityController.getActivity);
router.put('/:id', activityController.updateActivity);
router.delete('/:id', activityController.deleteActivity);

export default router;
