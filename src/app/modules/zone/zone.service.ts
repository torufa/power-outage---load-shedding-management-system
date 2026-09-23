import httpStatus from 'http-status';
import { AppError } from '../../middlewares/globalErrorHandler.js';
import { prisma } from '../../utils/prisma.js';
import type {
  ICreateFeeder,
  ICreateSubstation,
  ICreateZone,
  IUpdateFeederStatus,
} from './zone.interface.js';

const getAllZones = async (query: { region?: string; searchTerm?: string }) => {
  const zones = await prisma.distributionZone.findMany({
    where: {
      ...(query.region ? { region: query.region } : {}),
      ...(query.searchTerm ? { name: { contains: query.searchTerm } } : {}),
    },
    include: {
      substations: true,
    },
  });

  return zones;
};

const createZone = async (payload: ICreateZone, adminId: string, ipAddress?: string) => {
  const existing = await prisma.distributionZone.findUnique({
    where: { code: payload.code },
  });

  if (existing) {
    throw new AppError(httpStatus.CONFLICT, `Zone code '${payload.code}' already exists`);
  }

  const zone = await prisma.distributionZone.create({
    data: payload,
  });

  await prisma.auditLog.create({
    data: {
      userId: adminId,
      action: 'ZONE_CREATED',
      entity: 'DistributionZone',
      entityId: zone.id,
      details: { code: zone.code, name: zone.name },
      ipAddress: ipAddress || null,
    },
  });

  return zone;
};

const createSubstation = async (
  payload: ICreateSubstation,
  adminId: string,
  ipAddress?: string,
) => {
  const sub = await prisma.substation.create({
    data: payload,
  });

  await prisma.auditLog.create({
    data: {
      userId: adminId,
      action: 'SUBSTATION_CREATED',
      entity: 'Substation',
      entityId: sub.id,
      details: { code: sub.code, name: sub.name, zoneId: payload.zoneId },
      ipAddress: ipAddress || null,
    },
  });

  return sub;
};

const createFeeder = async (payload: ICreateFeeder, adminId: string, ipAddress?: string) => {
  const feeder = await prisma.feeder.create({
    data: payload,
  });

  await prisma.auditLog.create({
    data: {
      userId: adminId,
      action: 'FEEDER_CREATED',
      entity: 'Feeder',
      entityId: feeder.id,
      details: { code: feeder.code, name: feeder.name, substationId: payload.substationId },
      ipAddress: ipAddress || null,
    },
  });

  return feeder;
};

const getFeederById = async (feederId: string) => {
  const feeder = await prisma.feeder.findUnique({
    where: { id: feederId },
  });

  if (!feeder) {
    throw new AppError(httpStatus.NOT_FOUND, 'Feeder line not found');
  }

  return feeder;
};

const updateFeederStatus = async (
  feederId: string,
  payload: IUpdateFeederStatus,
  adminId: string,
  ipAddress?: string,
) => {
  const feeder = await prisma.feeder.findUnique({
    where: { id: feederId },
  });

  if (!feeder) {
    throw new AppError(httpStatus.NOT_FOUND, 'Feeder line not found');
  }

  // Execute in transaction
  const updatedFeeder = await prisma.$transaction(async (tx) => {
    const updated = await tx.feeder.update({
      where: { id: feederId },
      data: { status: payload.status },
    });

    await tx.auditLog.create({
      data: {
        userId: adminId,
        action: 'FEEDER_STATUS_CHANGED',
        entity: 'Feeder',
        entityId: feederId,
        details: {
          previousStatus: feeder.status,
          newStatus: payload.status,
          reason: payload.reason || 'Manual grid operator action',
        },
        ipAddress: ipAddress || null,
      },
    });

    return updated;
  });

  return updatedFeeder;
};

export const ZoneService = {
  getAllZones,
  createZone,
  createSubstation,
  createFeeder,
  getFeederById,
  updateFeederStatus,
};
