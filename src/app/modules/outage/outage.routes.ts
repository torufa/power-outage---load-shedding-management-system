import { Router } from 'express';
import { auth } from '../../middlewares/auth.js';
import { upload } from '../../middlewares/upload.js';
import { validateRequest } from '../../middlewares/validateRequest.js';
import { OutageController } from './outage.controller.js';
import { OutageValidation } from './outage.validation.js';

const router = Router();

// Public / Authenticated read
router.get('/', OutageController.getAllOutages);

// Technician assigned outages
router.get('/my-assigned', auth('TECHNICIAN'), OutageController.getMyAssignedOutages);

router.get('/:id', OutageController.getOutageById);

// Report Outage (CUSTOMER or ADMIN) with optional photo upload
router.post(
  '/',
  auth('CUSTOMER', 'ADMIN'),
  upload.single('photo'),
  validateRequest(OutageValidation.createOutageSchema),
  OutageController.createOutage,
);

// Assign technician (ADMIN only)
router.post(
  '/:id/assign',
  auth('ADMIN'),
  validateRequest(OutageValidation.assignTechnicianSchema),
  OutageController.assignTechnician,
);

// Update status (TECHNICIAN or ADMIN)
router.patch(
  '/:id/status',
  auth('TECHNICIAN', 'ADMIN'),
  validateRequest(OutageValidation.updateOutageStatusSchema),
  OutageController.updateOutageStatus,
);

// Soft delete outage (ADMIN only)
router.delete('/:id', auth('ADMIN'), OutageController.softDeleteOutage);

export const OutageRoutes = router;
