import express from 'express';
import {
  getMyNotifications,
  markAsRead,
  markAllAsRead,
  clearNotifications,
} from '../controllers/notificationController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/', getMyNotifications);
router.patch('/read-all', markAllAsRead);
router.patch('/:id/read', markAsRead);
router.delete('/clear', clearNotifications);

export default router;
