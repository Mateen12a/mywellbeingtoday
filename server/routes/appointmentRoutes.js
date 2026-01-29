import { Router } from 'express';
import * as appointmentController from '../controllers/appointmentController.js';
import { authenticate } from '../middlewares/auth.js';
import { validateAppointment } from '../middlewares/validate.js';

const router = Router();

router.use(authenticate);

router.post('/', validateAppointment, appointmentController.createAppointment);
router.get('/', appointmentController.getAppointments);
router.get('/upcoming', appointmentController.getUpcomingAppointment);
router.get('/pending-with/:providerId', appointmentController.checkPendingWithProvider);
router.get('/:id', appointmentController.getAppointment);
router.put('/:id', appointmentController.updateAppointment);
router.post('/:id/cancel', appointmentController.cancelAppointment);

export default router;
