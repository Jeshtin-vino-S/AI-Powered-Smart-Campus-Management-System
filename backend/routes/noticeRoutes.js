import express from 'express';
import {
  getNotices,
  createNotice,
  deleteNotice,
} from '../controllers/noticeController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/', getNotices);
router.post('/', authorize('admin', 'hod', 'faculty'), createNotice);
router.delete('/:id', authorize('admin', 'hod'), deleteNotice);

export default router;
