import { Router } from 'express';
import { auth } from '../../middlewares/auth.js';
import { validateRequest } from '../../middlewares/validateRequest.js';
import { UserController } from './user.controller.js';
import { UserValidation } from './user.validation.js';

const router = Router();

// My Profile (Any authenticated role: CUSTOMER, TECHNICIAN, ADMIN)
router.get('/me', auth('CUSTOMER', 'TECHNICIAN', 'ADMIN'), UserController.getMyProfile);

router.patch(
  '/me',
  auth('CUSTOMER', 'TECHNICIAN', 'ADMIN'),
  validateRequest(UserValidation.updateProfileValidationSchema),
  UserController.updateMyProfile,
);

// Get available technicians with active workload (ADMIN role only)
router.get('/technicians', auth('ADMIN'), UserController.getAvailableTechnicians);

// List all users with pagination and filtering (ADMIN role only)
router.get('/', auth('ADMIN'), UserController.getAllUsers);

export const UserRoutes:Router = router;
