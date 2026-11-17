import express from 'express';
import {
  getAtRiskStudents,
  getStudentRiskReport,
  chatAssistant,
  getPlacementMatch,
  getDepartmentSummary,
} from '../controllers/aiController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/at-risk-students', authorize('admin', 'hod', 'faculty'), getAtRiskStudents);
router.get('/student-risk/:studentId', getStudentRiskReport);
router.post('/assistant/chat', chatAssistant);
router.get('/placement-match/:placementId', getPlacementMatch);
router.get('/department-summary', authorize('hod', 'admin'), getDepartmentSummary);

export default router;
