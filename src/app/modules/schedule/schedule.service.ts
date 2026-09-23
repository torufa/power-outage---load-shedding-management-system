import httpStatus from 'http-status';
import { AppError } from '../../middlewares/globalErrorHandler.js';
import { prisma } from '../../utils/prisma.js';
import { redisClient } from '../../utils/redis.js';
import type {
  IAutomatedScheduleGen,
  ICreateSchedule,
  IScheduleFilterQuery,
} from './schedule.interface.js';

const getAllSchedules = async (query: IScheduleFilterQuery) => {
  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 10;
  const skip = (page - 1) * limit;

  const whereCondition: any = {};
  if (query.feederId) whereCondition.feederId = query.feederId;
  if (query.status) whereCondition.status = query.status;

  const schedules = await prisma.loadSheddingSchedule.findMany({
    where: whereCondition,
    include: { feeder: true },
    skip,
    take: limit,
    orderBy: { startTime: 'asc' },
  });

  const total = await prisma.loadSheddingSchedule.count({ where: whereCondition });

  return {
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
    data: schedules,
  };
};

const createSchedule = async (payload: ICreateSchedule, adminId: string, ipAddress?: string) => {
  const feeder = await prisma.feeder.findUnique({
    where: { id: payload.feederId },
  });

  if (!feeder) {
    throw new AppError(httpStatus.NOT_FOUND, 'Feeder line not found');
  }

  const schedule = await prisma.loadSheddingSchedule.create({
    data: {
      title: payload.title,
      feederId: payload.feederId,
      startTime: new Date(payload.startTime),
      endTime: new Date(payload.endTime),
      targetDeficitMW: payload.targetDeficitMW || feeder.currentDemandMW,
      recurringDays: payload.recurringDays || [],
      status: 'SCHEDULED',
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: adminId,
      action: 'LOAD_SHEDDING_SCHEDULE_CREATED',
      entity: 'LoadSheddingSchedule',
      entityId: schedule.id,
      details: {
        feeder: feeder.name,
        targetDeficitMW: schedule.targetDeficitMW,
        time: `${schedule.startTime.toISOString()} - ${schedule.endTime.toISOString()}`,
      },
      ipAddress: ipAddress || null,
    },
  });

  return schedule;
};

// Automated Load Shedding Generation Algorithm based on Grid Deficit
const generateAutomatedSchedule = async (
  payload: IAutomatedScheduleGen,
  adminId: string,
  ipAddress?: string,
) => {
  // Fetch all feeders with their connected areas to evaluate priority
  const feeders: any[] = await prisma.feeder.findMany({
    where: { status: { not: 'TRIPPED' } },
    include: { areas: true },
  });

  // Filter out feeders feeding CRITICAL_HOSPITAL zones
  const eligibleFeeders = feeders.filter((feeder: any) => {
    const hasCriticalHospital = feeder.areas?.some(
      (area: any) => area.priority === 'CRITICAL_HOSPITAL',
    );
    return !hasCriticalHospital;
  });

  if (eligibleFeeders.length === 0) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'No eligible non-critical feeders available for automated load shedding',
    );
  }

  // Sort feeders by NORMAL priority first, then descending demand
  eligibleFeeders.sort((a: any, b: any) => {
    const aNormal = a.areas?.some((ar: any) => ar.priority === 'NORMAL') ? 1 : 0;
    const bNormal = b.areas?.some((ar: any) => ar.priority === 'NORMAL') ? 1 : 0;
    if (aNormal !== bNormal) return bNormal - aNormal;
    return b.currentDemandMW - a.currentDemandMW;
  });

  let accumulatedMW = 0;
  const selectedFeeders: any[] = [];
  for (const f of eligibleFeeders) {
    selectedFeeders.push(f);
    accumulatedMW += f.currentDemandMW;
    if (accumulatedMW >= payload.gridDeficitMW) {
      break;
    }
  }

  const startTime = new Date();
  const endTime = new Date(Date.now() + payload.durationHours * 3600 * 1000);

  // Execute database transaction to create schedules and update feeder states
  const createdSchedules = await prisma.$transaction(async (tx) => {
    const results = [];
    for (const f of selectedFeeders) {
      const sched = await tx.loadSheddingSchedule.create({
        data: {
          title: `Auto-Shed: ${payload.reason}`,
          feederId: f.id,
          startTime,
          endTime,
          targetDeficitMW: f.currentDemandMW,
          status: 'ACTIVE',
        },
      });

      await tx.feeder.update({
        where: { id: f.id },
        data: { status: 'LOAD_SHEDDING' },
      });

      results.push({
        scheduleId: sched.id,
        feederId: f.id,
        feederName: f.name,
        relievedDemandMW: f.currentDemandMW,
      });
    }

    await tx.auditLog.create({
      data: {
        userId: adminId,
        action: 'AUTOMATED_LOAD_SHED_EXECUTED',
        entity: 'LoadSheddingSchedule',
        details: {
          deficitRequestedMW: payload.gridDeficitMW,
          actualRelievedMW: accumulatedMW,
          affectedFeedersCount: selectedFeeders.length,
          durationHours: payload.durationHours,
        },
        ipAddress: ipAddress || null,
      },
    });

    return results;
  });

  // Cache active load shedding state in Redis
  await redisClient.set(
    'grid:active_load_shedding',
    JSON.stringify({
      relievedMW: accumulatedMW,
      feeders: selectedFeeders.map((f) => f.id),
      until: endTime,
    }),
    Math.round(payload.durationHours * 3600),
  );

  return {
    targetDeficitMW: payload.gridDeficitMW,
    totalRelievedMW: accumulatedMW,
    affectedFeedersCount: selectedFeeders.length,
    validUntil: endTime,
    schedules: createdSchedules,
  };
};

const updateScheduleStatus = async (
  id: string,
  status: 'SCHEDULED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED',
  adminId: string,
  ipAddress?: string,
) => {
  const schedule = await prisma.loadSheddingSchedule.findUnique({
    where: { id },
  });

  if (!schedule) {
    throw new AppError(httpStatus.NOT_FOUND, 'Schedule not found');
  }

  const updated = await prisma.$transaction(async (tx) => {
    const updatedSched = await tx.loadSheddingSchedule.update({
      where: { id },
      data: { status },
    });

    // If completed or cancelled, restore feeder back to ACTIVE
    if (status === 'COMPLETED' || status === 'CANCELLED') {
      await tx.feeder.update({
        where: { id: schedule.feederId },
        data: { status: 'ACTIVE' },
      });
    }

    await tx.auditLog.create({
      data: {
        userId: adminId,
        action: 'SCHEDULE_STATUS_UPDATED',
        entity: 'LoadSheddingSchedule',
        entityId: id,
        details: { previousStatus: schedule.status, newStatus: status },
        ipAddress: ipAddress || null,
      },
    });

    return updatedSched;
  });

  return updated;
};

const getCustomerAreaSchedule = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user || !user.areaId) {
    return {
      message: 'No registered residential area linked to your profile.',
      schedules: [],
    };
  }

  const area = await prisma.area.findUnique({
    where: { id: user.areaId },
  });

  if (!area) {
    return { message: 'Area not found', schedules: [] };
  }

  const schedules = await prisma.loadSheddingSchedule.findMany({
    where: {
      feederId: area.feederId,
      status: { in: ['SCHEDULED', 'ACTIVE'] },
    },
    include: { feeder: true },
  });

  return {
    areaName: area.name,
    feederId: area.feederId,
    schedules,
  };
};

export const ScheduleService = {
  getAllSchedules,
  createSchedule,
  generateAutomatedSchedule,
  updateScheduleStatus,
  getCustomerAreaSchedule,
};
