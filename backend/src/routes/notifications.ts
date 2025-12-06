import { Router } from 'express';
import * as notificationController from '../controllers/notificationController';
import { authenticate, authorize } from '../middleware/auth';
import { Role } from '@prisma/client';

const router = Router();

// Alle Routes erfordern Authentifizierung
router.use(authenticate);

// User Notifications
router.get('/', notificationController.getNotifications);
router.get('/unread-count', notificationController.getUnreadCount);
router.patch('/:id/read', notificationController.markAsRead);
router.patch('/read-all', notificationController.markAllAsRead);

// Admin: Manuelle Alert-Trigger
router.post(
  '/alerts/deadlines',
  authorize(Role.ADMIN),
  notificationController.triggerDeadlineAlerts
);

router.post(
  '/alerts/bottlenecks',
  authorize(Role.ADMIN),
  notificationController.triggerBottleneckAlerts
);

export default router;
