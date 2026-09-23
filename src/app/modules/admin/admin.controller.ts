import type { Request, Response } from 'express';
import httpStatus from 'http-status';
import { catchAsync } from '../../utils/catchAsync.js';
import { sendResponse } from '../../utils/sendResponse.js';
import { AdminService } from './admin.service.js';

const getDashboardStats = catchAsync(async (req: Request, res: Response) => {
  const result = await AdminService.getDashboardStats();

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Grid administration dashboard telemetry retrieved successfully',
    data: result,
  });
});

const getAuditLogs = catchAsync(async (req: Request, res: Response) => {
  const result = await AdminService.getAuditLogs(req.query);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'System audit logs retrieved successfully',
    meta: result.meta,
    data: result.data,
  });
});

const updateUserRole = catchAsync(async (req: Request, res: Response) => {
  const ip = req.ip || req.socket.remoteAddress;
  const result = await AdminService.updateUserRole(req.params.id, req.body, req.user!.id, ip);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'User role updated successfully and logged in audit registry',
    data: result,
  });
});

export const AdminController = {
  getDashboardStats,
  getAuditLogs,
  updateUserRole,
};
