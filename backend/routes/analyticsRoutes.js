import express from 'express';
import {
  getAdminAnalytics,
  getHodAnalytics,
  getFacultyAnalytics,
  getStudentAnalytics,
} from '../controllers/analyticsController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/admin', getAdminAnalytics);
router.get('/hod', getHodAnalytics);
router.get('/faculty', getFacultyAnalytics);
router.get('/student', getStudentAnalytics);

export default router;
