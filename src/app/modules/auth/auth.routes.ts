import { Router } from 'express';
import { validateRequest } from '../../middlewares/validateRequest.js';
import { AuthController } from './auth.controller.js';
import { AuthValidation } from './auth.validation.js';

const router = Router();

router.post(
  '/register',
  validateRequest(AuthValidation.registerValidationSchema),
  AuthController.register,
);

router.post(
  '/verify-otp',
  validateRequest(AuthValidation.verifyOtpValidationSchema),
  AuthController.verifyOtp,
);

router.post('/login', validateRequest(AuthValidation.loginValidationSchema), AuthController.login);

router.post(
  '/google-login',
  validateRequest(AuthValidation.googleLoginValidationSchema),
  AuthController.googleLogin,
);

router.post(
  '/refresh-token',
  validateRequest(AuthValidation.refreshTokenValidationSchema),
  AuthController.refreshToken,
);

router.post('/logout', AuthController.logout);

export const AuthRoutes:Router = router;
