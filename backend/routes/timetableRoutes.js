import express from 'express';
import {
  getTimetable,
  createTimetableEntry,
  updateTimetableEntry,
  deleteTimetableEntry,
  autoGenerateTimetable,
} from '../controllers/timetableController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/', getTimetable);
router.post('/', authorize('admin', 'hod'), createTimetableEntry);
router.post('/auto-generate', authorize('admin', 'hod'), autoGenerateTimetable);
router.put('/:id', authorize('admin', 'hod'), updateTimetableEntry);
router.delete('/:id', authorize('admin', 'hod'), deleteTimetableEntry);

export default router;
