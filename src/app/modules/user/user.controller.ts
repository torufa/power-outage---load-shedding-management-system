import type { Request, Response } from 'express';
import httpStatus from 'http-status';
import { catchAsync } from '../../utils/catchAsync.js';
import { sendResponse } from '../../utils/sendResponse.js';
import { UserService } from './user.service.js';

const getMyProfile = catchAsync(async (req: Request, res: Response) => {
  const result = await UserService.getMyProfile(req.user!.id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'User profile retrieved successfully',
    data: result,
  });
});

const updateMyProfile = catchAsync(async (req: Request, res: Response) => {
  const result = await UserService.updateMyProfile(req.user!.id, req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Profile updated successfully',
    data: result,
  });
});

const getAvailableTechnicians = catchAsync(async (req: Request, res: Response) => {
  const result = await UserService.getAvailableTechnicians();

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Technicians list retrieved successfully with workload analytics',
    data: result,
  });
});

const getAllUsers = catchAsync(async (req: Request, res: Response) => {
  const result = await UserService.getAllUsers(req.query);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Users list retrieved successfully',
    meta: result.meta,
    data: result.data,
  });
});

export const UserController = {
  getMyProfile,
  updateMyProfile,
  getAvailableTechnicians,
  getAllUsers,
};
