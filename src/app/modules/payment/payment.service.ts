import httpStatus from 'http-status';
import { AppError } from '../../middlewares/globalErrorHandler.js';
import { prisma } from '../../utils/prisma.js';
import { createStripeCheckoutSession } from '../../utils/stripe.js';
import type { ICreatePaymentSession, IVerifyPayment } from './payment.interface.js';

const createCheckoutSession = async (
  payload: ICreatePaymentSession,
  user: { id: string; email: string },
  ipAddress?: string,
) => {
  const transactionId = `TXN-GP-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

  const session = await createStripeCheckoutSession({
    amount: payload.amount,
    currency: payload.currency || 'usd',
    purpose: payload.purpose,
    customerEmail: user.email,
    userId: user.id,
    invoiceOrTicketNumber: payload.invoiceOrTicketNumber,
  });

  const paymentRecord = await prisma.payment.create({
    data: {
      transactionId,
      stripeSessionId: session.sessionId,
      userId: user.id,
      amount: payload.amount,
      currency: payload.currency || 'usd',
      purpose: payload.purpose,
      status: 'PENDING',
      metadata: {
        invoiceOrTicketNumber: payload.invoiceOrTicketNumber || 'N/A',
      },
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: user.id,
      action: 'PAYMENT_SESSION_INITIATED',
      entity: 'Payment',
      entityId: paymentRecord.id,
      details: {
        transactionId,
        amount: payload.amount,
        purpose: payload.purpose,
        sessionId: session.sessionId,
      },
      ipAddress: ipAddress || null,
    },
  });

  return {
    paymentId: paymentRecord.id,
    transactionId,
    sessionId: session.sessionId,
    checkoutUrl: session.url,
  };
};

const verifyPayment = async (payload: IVerifyPayment, userId: string, ipAddress?: string) => {
  const payment = await prisma.payment.findFirst({
    where: { stripeSessionId: payload.sessionId },
  });

  if (!payment) {
    throw new AppError(httpStatus.NOT_FOUND, 'No payment found matching this Stripe session ID');
  }

  // Update status to COMPLETED
  const updated = await prisma.$transaction(async (tx) => {
    const updatedPayment = await tx.payment.update({
      where: { id: payment.id },
      data: { status: 'COMPLETED' },
    });

    await tx.auditLog.create({
      data: {
        userId,
        action: 'PAYMENT_COMPLETED',
        entity: 'Payment',
        entityId: payment.id,
        details: {
          transactionId: payment.transactionId,
          amount: payment.amount,
          purpose: payment.purpose,
          status: 'COMPLETED',
        },
        ipAddress: ipAddress || null,
      },
    });

    return updatedPayment;
  });

  return updated;
};

const handleWebhook = async (event: any) => {
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const payment = await prisma.payment.findFirst({
      where: { stripeSessionId: session.id },
    });

    if (payment) {
      await prisma.payment.update({
        where: { id: payment.id },
        data: { status: 'COMPLETED' },
      });
    }
  }

  return { received: true };
};

const getMyPayments = async (userId: string) => {
  const payments = await prisma.payment.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });

  return payments;
};

const getAllPayments = async (query: { page?: number; limit?: number }) => {
  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 10;
  const skip = (page - 1) * limit;

  const payments = await prisma.payment.findMany({
    skip,
    take: limit,
    orderBy: { createdAt: 'desc' },
  });

  const total = await prisma.payment.count();

  return {
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
    data: payments,
  };
};

export const PaymentService = {
  createCheckoutSession,
  verifyPayment,
  handleWebhook,
  getMyPayments,
  getAllPayments,
};
