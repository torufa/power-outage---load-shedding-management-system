import { Router } from 'express';
import { auth } from '../../middlewares/auth.js';
import { validateRequest } from '../../middlewares/validateRequest.js';
import { ScheduleController } from './schedule.controller.js';
import { ScheduleValidation } from './schedule.validation.js';

const router = Router();

// Public / Authenticated read
router.get('/', ScheduleController.getAllSchedules);

// Customer local area schedule
router.get(
  '/my-area',
  auth('CUSTOMER', 'TECHNICIAN', 'ADMIN'),
  ScheduleController.getCustomerAreaSchedule,
);

// Admin-only load shedding management
router.post(
  '/',
  auth('ADMIN'),
  validateRequest(ScheduleValidation.createScheduleSchema),
  ScheduleController.createSchedule,
);

router.post(
  '/generate-automated',
  auth('ADMIN'),
  validateRequest(ScheduleValidation.generateAutomatedScheduleSchema),
  ScheduleController.generateAutomatedSchedule,
);

router.patch(
  '/:id/status',
  auth('ADMIN'),
  validateRequest(ScheduleValidation.updateScheduleStatusSchema),
  ScheduleController.updateScheduleStatus,
);

export const ScheduleRoutes:Router = router;
