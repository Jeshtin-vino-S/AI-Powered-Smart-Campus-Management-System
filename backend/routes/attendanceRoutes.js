import express from 'express';
import {
  startSession,
  getLiveSessionToken,
  markQRAttendance,
  markManualAttendance,
  getMyAttendance,
  getSubjectAttendanceReport,
  endSession,
} from '../controllers/attendanceController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.use(protect);

router.post('/session/start', authorize('faculty', 'hod'), startSession);
router.get('/session/:sessionId/token', authorize('faculty', 'hod'), getLiveSessionToken);
router.post('/session/:sessionId/end', authorize('faculty', 'hod'), endSession);
router.post('/scan', authorize('student'), markQRAttendance);
router.post('/manual', authorize('faculty', 'hod'), markManualAttendance);
router.get('/my', authorize('student', 'faculty', 'hod', 'admin'), getMyAttendance);
router.get('/subject/:subjectId', authorize('faculty', 'hod', 'admin'), getSubjectAttendanceReport);

export default router;
