import type { Request, Response } from 'express';
import httpStatus from 'http-status';
import { catchAsync } from '../../utils/catchAsync.js';
import { uploadToCloudinary } from '../../utils/cloudinary.js';
import { sendResponse } from '../../utils/sendResponse.js';
import { OutageService } from './outage.service.js';

const createOutage = catchAsync(async (req: Request, res: Response) => {
  let photoUrl: string | undefined;

  if (req.file) {
    const uploadResult = await uploadToCloudinary(req.file, 'gridpulse/outages');
    photoUrl = uploadResult.secure_url;
  }

  const ip = req.ip || req.socket.remoteAddress;
  const result = await OutageService.createOutage(req.body, req.user!.id, photoUrl, ip);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Power outage report registered successfully. Ticket issued.',
    data: result,
  });
});

const getAllOutages = catchAsync(async (req: Request, res: Response) => {
  const result = await OutageService.getAllOutages(req.query);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Outages retrieved successfully',
    meta: result.meta,
    data: result.data,
  });
});

const getOutageById = catchAsync(async (req: Request, res: Response) => {
  const result = await OutageService.getOutageById(req.params.id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Outage report details and audit timeline retrieved',
    data: result,
  });
});

const getMyAssignedOutages = catchAsync(async (req: Request, res: Response) => {
  const result = await OutageService.getMyAssignedOutages(req.user!.id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Technician assigned tickets retrieved',
    data: result,
  });
});

const assignTechnician = catchAsync(async (req: Request, res: Response) => {
  const ip = req.ip || req.socket.remoteAddress;
  const result = await OutageService.assignTechnician(req.params.id, req.body, req.user!.id, ip);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Technician successfully dispatched and notified',
    data: result,
  });
});

const updateOutageStatus = catchAsync(async (req: Request, res: Response) => {
  const ip = req.ip || req.socket.remoteAddress;
  const result = await OutageService.updateOutageStatus(
    req.params.id,
    req.body,
    req.user!.id,
    req.user!.role,
    ip,
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Outage status updated successfully',
    data: result,
  });
});

const softDeleteOutage = catchAsync(async (req: Request, res: Response) => {
  const ip = req.ip || req.socket.remoteAddress;
  const result = await OutageService.softDeleteOutage(req.params.id, req.user!.id, ip);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Outage soft deleted successfully',
    data: result,
  });
});

export const OutageController = {
  createOutage,
  getAllOutages,
  getOutageById,
  getMyAssignedOutages,
  assignTechnician,
  updateOutageStatus,
  softDeleteOutage,
};
