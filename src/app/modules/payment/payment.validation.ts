import { z } from 'zod';

const createCheckoutSessionSchema = z.object({
  body: z.object({
    amount: z.number().positive('Amount must be greater than 0'),
    purpose: z.enum(['BILL_PAYMENT', 'PRIORITY_RECONNECTION', 'MAINTENANCE_FEE']),
    invoiceOrTicketNumber: z.string().optional(),
    currency: z.string().default('usd').optional(),
  }),
});

const verifyPaymentSchema = z.object({
  body: z.object({
    sessionId: z.string().min(3, 'Stripe session ID is required'),
  }),
});

export const PaymentValidation = {
  createCheckoutSessionSchema,
  verifyPaymentSchema,
};
