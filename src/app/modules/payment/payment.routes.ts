import { Router } from 'express';
import { auth } from '../../middlewares/auth.js';
import { validateRequest } from '../../middlewares/validateRequest.js';
import { PaymentController } from './payment.controller.js';
import { PaymentValidation } from './payment.validation.js';

const router = Router();

// Create checkout session (CUSTOMER or ADMIN)
router.post(
  '/create-checkout-session',
  auth('CUSTOMER', 'ADMIN'),
  validateRequest(PaymentValidation.createCheckoutSessionSchema),
  PaymentController.createCheckoutSession,
);

// Verify payment
router.post(
  '/verify',
  auth('CUSTOMER', 'ADMIN'),
  validateRequest(PaymentValidation.verifyPaymentSchema),
  PaymentController.verifyPayment,
);

// Stripe Webhook
router.post('/webhook', PaymentController.handleWebhook);

// User's own payment history
router.get(
  '/my-payments',
  auth('CUSTOMER', 'TECHNICIAN', 'ADMIN'),
  PaymentController.getMyPayments,
);

// Admin view all payments
router.get('/', auth('ADMIN'), PaymentController.getAllPayments);

export const PaymentRoutes:Router = router;
