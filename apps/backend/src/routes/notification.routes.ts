import { Router } from 'express';
import * as NotificationController from '../controllers/notification.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

/**
 * §4.10 Notification routes
 */
router.get('/', authenticateToken, NotificationController.getNotifications);
router.put('/:id/read', authenticateToken, NotificationController.markAsRead);
router.post('/read-all', authenticateToken, NotificationController.markAllAsRead);
router.delete('/:id', authenticateToken, NotificationController.deleteNotification);
router.put('/preferences', authenticateToken, NotificationController.updatePreferences);

export default router;
