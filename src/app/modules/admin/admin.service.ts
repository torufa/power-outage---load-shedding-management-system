import httpStatus from 'http-status';
import { AppError } from '../../middlewares/globalErrorHandler.js';
import { prisma } from '../../utils/prisma.js';
import type { IAuditLogQuery, IUpdateUserRole } from './admin.interface.js';

const getDashboardStats = async () => {
  const zones = await prisma.distributionZone.findMany();
  const feeders = await prisma.feeder.findMany();
  const activeOutages = await prisma.outageReport.count({
    where: { status: { notIn: ['RESTORED', 'CANCELLED'] } },
  });
  const totalOutages = await prisma.outageReport.count();
  const activeSchedules = await prisma.loadSheddingSchedule.count({
    where: { status: 'ACTIVE' },
  });
  const technicians = await prisma.user.findMany({
    where: { role: 'TECHNICIAN' },
  });

  const totalMaxCapacityMW = zones.reduce((sum, z) => sum + z.maxCapacityMW, 0);
  const totalDemandMW = feeders.reduce((sum, f) => sum + f.currentDemandMW, 0);
  const deficitMW = Math.max(0, totalDemandMW - totalMaxCapacityMW * 0.75);

  return {
    gridCapacityMW: totalMaxCapacityMW,
    currentDemandMW: parseFloat(totalDemandMW.toFixed(2)),
    deficitMW: parseFloat(deficitMW.toFixed(2)),
    activeOutagesCount: activeOutages,
    totalOutagesResolvedCount: totalOutages - activeOutages,
    activeLoadSheddingSchedulesCount: activeSchedules,
    techniciansCount: technicians.length,
    gridStabilityIndex:
      deficitMW > 0 ? (deficitMW > 20 ? 'CRITICAL_DEFICIT' : 'MODERATE_DEFICIT') : 'STABLE_OPTIMAL',
    distributionZonesCount: zones.length,
    feedersCount: feeders.length,
  };
};

const getAuditLogs = async (query: IAuditLogQuery) => {
  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 15;
  const skip = (page - 1) * limit;

  const logs = await prisma.auditLog.findMany({
    skip,
    take: limit,
    orderBy: { createdAt: 'desc' },
  });

  const total = await prisma.auditLog.count();

  return {
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
    data: logs,
  };
};

const updateUserRole = async (
  targetUserId: string,
  payload: IUpdateUserRole,
  adminId: string,
  ipAddress?: string,
) => {
  const targetUser = await prisma.user.findUnique({
    where: { id: targetUserId },
  });

  if (!targetUser) {
    throw new AppError(httpStatus.NOT_FOUND, 'Target user not found');
  }

  const updatedUser = await prisma.$transaction(async (tx) => {
    const updated = await tx.user.update({
      where: { id: targetUserId },
      data: { role: payload.role },
    });

    await tx.auditLog.create({
      data: {
        userId: adminId,
        action: 'USER_ROLE_CHANGED',
        entity: 'User',
        entityId: targetUserId,
        details: { previousRole: targetUser.role, newRole: payload.role },
        ipAddress: ipAddress || null,
      },
    });

    return updated;
  });

  return {
    id: updatedUser.id,
    name: updatedUser.name,
    email: updatedUser.email,
    role: updatedUser.role,
  };
};

export const AdminService = {
  getDashboardStats,
  getAuditLogs,
  updateUserRole,
};
