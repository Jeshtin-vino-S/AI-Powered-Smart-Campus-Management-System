import express from 'express';
import {
  createAssignment,
  getAssignments,
  getAssignmentById,
  submitAssignment,
  getSubmissionsForAssignment,
  evaluateSubmission,
  deleteAssignment,
} from '../controllers/assignmentController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';
import { upload } from '../middleware/uploadMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/', getAssignments);
router.get('/:id', getAssignmentById);
router.post('/', authorize('faculty', 'hod'), upload.single('attachment'), createAssignment);
router.post('/:id/submit', authorize('student'), upload.single('file'), submitAssignment);
router.get('/:id/submissions', authorize('faculty', 'hod', 'admin'), getSubmissionsForAssignment);
router.put(
  '/submissions/:submissionId/grade',
  authorize('faculty', 'hod'),
  evaluateSubmission
);
router.delete('/:id', authorize('faculty', 'admin', 'hod'), deleteAssignment);

export default router;
