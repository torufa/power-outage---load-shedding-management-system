import { Router } from 'express';
import { auth } from '../../middlewares/auth.js';
import { validateRequest } from '../../middlewares/validateRequest.js';
import { AdminController } from './admin.controller.js';
import { AdminValidation } from './admin.validation.js';

const router = Router();

// All admin routes strictly require 'ADMIN' role
router.get('/dashboard-stats', auth('ADMIN'), AdminController.getDashboardStats);

router.get('/audit-logs', auth('ADMIN'), AdminController.getAuditLogs);

router.patch(
  '/users/:id/role',
  auth('ADMIN'),
  validateRequest(AdminValidation.updateUserRoleSchema),
  AdminController.updateUserRole,
);

export const AdminRoutes:Router = router;
