import { Router } from 'express';
import { auth } from '../../middlewares/auth.js';
import { validateRequest } from '../../middlewares/validateRequest.js';
import { ZoneController } from './zone.controller.js';
import { ZoneValidation } from './zone.validation.js';

const router = Router();

// Public / Authenticated read
router.get('/', ZoneController.getAllZones);
router.get('/feeders/:id', ZoneController.getFeederById);

// Admin-only management routes
router.post(
  '/',
  auth('ADMIN'),
  validateRequest(ZoneValidation.createZoneSchema),
  ZoneController.createZone,
);

router.post(
  '/substations',
  auth('ADMIN'),
  validateRequest(ZoneValidation.createSubstationSchema),
  ZoneController.createSubstation,
);

router.post(
  '/feeders',
  auth('ADMIN'),
  validateRequest(ZoneValidation.createFeederSchema),
  ZoneController.createFeeder,
);

router.patch(
  '/feeders/:id/status',
  auth('ADMIN'),
  validateRequest(ZoneValidation.updateFeederStatusSchema),
  ZoneController.updateFeederStatus,
);

export const ZoneRoutes = router;
