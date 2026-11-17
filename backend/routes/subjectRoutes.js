import express from 'express';
import {
  getSubjects,
  createSubject,
  updateSubject,
  deleteSubject,
} from '../controllers/subjectController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/', getSubjects);
router.post('/', authorize('admin', 'hod'), createSubject);
router.put('/:id', authorize('admin', 'hod'), updateSubject);
router.delete('/:id', authorize('admin', 'hod'), deleteSubject);

export default router;
