import type { Request, Response } from 'express';
import httpStatus from 'http-status';
import { catchAsync } from '../../utils/catchAsync.js';
import { sendResponse } from '../../utils/sendResponse.js';
import { ScheduleService } from './schedule.service.js';

const getAllSchedules = catchAsync(async (req: Request, res: Response) => {
  const result = await ScheduleService.getAllSchedules(req.query);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Load shedding schedules retrieved successfully',
    meta: result.meta,
    data: result.data,
  });
});

const createSchedule = catchAsync(async (req: Request, res: Response) => {
  const ip = req.ip || req.socket.remoteAddress;
  const result = await ScheduleService.createSchedule(req.body, req.user!.id, ip);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Load shedding schedule planned and saved',
    data: result,
  });
});

const generateAutomatedSchedule = catchAsync(async (req: Request, res: Response) => {
  const ip = req.ip || req.socket.remoteAddress;
  const result = await ScheduleService.generateAutomatedSchedule(req.body, req.user!.id, ip);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Automated load shedding generated and dispatched across prioritized feeders',
    data: result,
  });
});

const updateScheduleStatus = catchAsync(async (req: Request, res: Response) => {
  const ip = req.ip || req.socket.remoteAddress;
  const result = await ScheduleService.updateScheduleStatus(
    req.params.id,
    req.body.status,
    req.user!.id,
    ip,
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Schedule status updated successfully',
    data: result,
  });
});

const getCustomerAreaSchedule = catchAsync(async (req: Request, res: Response) => {
  const result = await ScheduleService.getCustomerAreaSchedule(req.user!.id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Local area load shedding schedule retrieved successfully',
    data: result,
  });
});

export const ScheduleController = {
  getAllSchedules,
  createSchedule,
  generateAutomatedSchedule,
  updateScheduleStatus,
  getCustomerAreaSchedule,
};
