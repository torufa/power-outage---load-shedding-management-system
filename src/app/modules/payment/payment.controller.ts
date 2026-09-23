import type { Request, Response } from 'express';
import httpStatus from 'http-status';
import { catchAsync } from '../../utils/catchAsync.js';
import { sendResponse } from '../../utils/sendResponse.js';
import { PaymentService } from './payment.service.js';

const createCheckoutSession = catchAsync(async (req: Request, res: Response) => {
  const ip = req.ip || req.socket.remoteAddress;
  const result = await PaymentService.createCheckoutSession(
    req.body,
    { id: req.user!.id, email: req.user!.email },
    ip,
  );

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Stripe payment checkout session initiated successfully',
    data: result,
  });
});

const verifyPayment = catchAsync(async (req: Request, res: Response) => {
  const ip = req.ip || req.socket.remoteAddress;
  const result = await PaymentService.verifyPayment(req.body, req.user!.id, ip);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Payment verified and credited successfully',
    data: result,
  });
});

const handleWebhook = catchAsync(async (req: Request, res: Response) => {
  const result = await PaymentService.handleWebhook(req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Stripe webhook processed',
    data: result,
  });
});

const getMyPayments = catchAsync(async (req: Request, res: Response) => {
  const result = await PaymentService.getMyPayments(req.user!.id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Payment history retrieved successfully',
    data: result,
  });
});

const getAllPayments = catchAsync(async (req: Request, res: Response) => {
  const result = await PaymentService.getAllPayments(req.query);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'All system payments retrieved',
    meta: result.meta,
    data: result.data,
  });
});

export const PaymentController = {
  createCheckoutSession,
  verifyPayment,
  handleWebhook,
  getMyPayments,
  getAllPayments,
};
