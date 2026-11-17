import express from 'express';
import {
  getAllUsers,
  getUserById,
  updateUserStatus,
  deleteUser,
  getFacultyList,
  getStudentList,
  createAdmin,
  createHOD,
  createFaculty,
  createStudent,
} from '../controllers/userController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/', authorize('admin', 'hod'), getAllUsers);
router.post('/admin', authorize('admin'), createAdmin);
router.post('/hod', authorize('admin'), createHOD);
router.post('/faculty', authorize('admin', 'hod'), createFaculty);
router.post('/student', authorize('admin', 'hod'), createStudent);
router.get('/faculty/all', getFacultyList);
router.get('/students/filter', getStudentList);
router.get('/:id', getUserById);
router.patch('/:id/status', authorize('admin'), updateUserStatus);
router.delete('/:id', authorize('admin'), deleteUser);

export default router;
