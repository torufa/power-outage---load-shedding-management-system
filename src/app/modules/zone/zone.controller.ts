import type { Request, Response } from 'express';
import httpStatus from 'http-status';
import { catchAsync } from '../../utils/catchAsync.js';
import { sendResponse } from '../../utils/sendResponse.js';
import { ZoneService } from './zone.service.js';

const getAllZones = catchAsync(async (req: Request, res: Response) => {
  const result = await ZoneService.getAllZones(req.query);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Distribution zones and power grid hierarchy retrieved successfully',
    data: result,
  });
});

const createZone = catchAsync(async (req: Request, res: Response) => {
  const ip = req.ip || req.socket.remoteAddress;
  const result = await ZoneService.createZone(req.body, req.user!.id, ip);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Distribution zone created successfully',
    data: result,
  });
});

const createSubstation = catchAsync(async (req: Request, res: Response) => {
  const ip = req.ip || req.socket.remoteAddress;
  const result = await ZoneService.createSubstation(req.body, req.user!.id, ip);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Substation created successfully',
    data: result,
  });
});

const createFeeder = catchAsync(async (req: Request, res: Response) => {
  const ip = req.ip || req.socket.remoteAddress;
  const result = await ZoneService.createFeeder(req.body, req.user!.id, ip);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Feeder line created successfully',
    data: result,
  });
});

const getFeederById = catchAsync(async (req: Request, res: Response) => {
  const result = await ZoneService.getFeederById(req.params.id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Feeder details retrieved successfully',
    data: result,
  });
});

const updateFeederStatus = catchAsync(async (req: Request, res: Response) => {
  const ip = req.ip || req.socket.remoteAddress;
  const result = await ZoneService.updateFeederStatus(req.params.id, req.body, req.user!.id, ip);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Feeder status updated successfully',
    data: result,
  });
});

export const ZoneController = {
  getAllZones,
  createZone,
  createSubstation,
  createFeeder,
  getFeederById,
  updateFeederStatus,
};
