import express from 'express';
import {
  getDepartments,
  getDepartmentById,
  createDepartment,
  updateDepartment,
  deleteDepartment,
} from '../controllers/departmentController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.get('/', getDepartments);
router.get('/:id', getDepartmentById);

router.use(protect);
router.post('/', authorize('admin'), createDepartment);
router.put('/:id', authorize('admin'), updateDepartment);
router.delete('/:id', authorize('admin'), deleteDepartment);

export default router;
