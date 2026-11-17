import express from 'express';
import {
  createExam,
  getExams,
  submitMarks,
  getMyResults,
  getExamResults,
} from '../controllers/examController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/', getExams);
router.post('/', authorize('admin', 'hod', 'faculty'), createExam);
router.get('/my-results', authorize('student'), getMyResults);
router.get('/:examId/results', authorize('faculty', 'hod', 'admin'), getExamResults);
router.post('/:examId/marks', authorize('faculty', 'hod'), submitMarks);

export default router;
