import express from 'express';
import {
  createPlacement,
  getPlacements,
  getPlacementById,
  applyPlacement,
  getPlacementApplications,
  updateApplicationStatus,
  deletePlacement,
} from '../controllers/placementController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/', getPlacements);
router.post('/', authorize('admin', 'hod'), createPlacement);
router.get('/:id', getPlacementById);
router.post('/:id/apply', authorize('student'), applyPlacement);
router.get('/:id/applications', authorize('admin', 'hod'), getPlacementApplications);
router.put('/applications/:applicationId/status', authorize('admin', 'hod'), updateApplicationStatus);
router.delete('/:id', authorize('admin', 'hod'), deletePlacement);

export default router;
