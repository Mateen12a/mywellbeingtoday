import { Router } from 'express';
import authRoutes from './authRoutes.js';
import activityRoutes from './activityRoutes.js';
import moodRoutes from './moodRoutes.js';
import wellbeingRoutes from './wellbeingRoutes.js';
import providerRoutes from './providerRoutes.js';
import appointmentRoutes from './appointmentRoutes.js';
import adminRoutes from './adminRoutes.js';
import messageRoutes from './messageRoutes.js';
import certificateRoutes from './certificateRoutes.js';
import supportRoutes from './supportRoutes.js';
import subscriptionRoutes from './subscriptionRoutes.js';
import notificationRoutes from './notificationRoutes.js';
import pushRoutes from './pushRoutes.js';
import uploadRoutes from './uploadRoutes.js';

const router = Router();

router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'mywellbeingtoday API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

router.use('/auth', authRoutes);
router.use('/activities', activityRoutes);
router.use('/moods', moodRoutes);
router.use('/wellbeing', wellbeingRoutes);
router.use('/providers', providerRoutes);
router.use('/appointments', appointmentRoutes);
router.use('/admin', adminRoutes);
router.use('/messages', messageRoutes);
router.use('/certificates', certificateRoutes);
router.use('/support', supportRoutes);
router.use('/subscription', subscriptionRoutes);
router.use('/notifications', notificationRoutes);
router.use('/push', pushRoutes);
router.use('/upload', uploadRoutes);

export default router;
