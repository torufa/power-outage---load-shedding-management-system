import httpStatus from 'http-status';
import { AppError } from '../../middlewares/globalErrorHandler.js';
import { prisma } from '../../utils/prisma.js';
import type { IUpdateUserProfile, IUserFilterQuery } from './user.interface.js';

const getMyProfile = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      phone: true,
      role: true,
      isVerified: true,
      areaId: true,
      avatarUrl: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, 'User profile not found');
  }

  let areaDetails = null;
  if (user.areaId) {
    areaDetails = await prisma.area.findUnique({
      where: { id: user.areaId },
    });
  }

  return {
    ...user,
    area: areaDetails,
  };
};

const updateMyProfile = async (userId: string, payload: IUpdateUserProfile) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, 'User profile not found');
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: payload,
  });

  return {
    id: updatedUser.id,
    name: updatedUser.name,
    email: updatedUser.email,
    phone: updatedUser.phone,
    role: updatedUser.role,
    areaId: updatedUser.areaId,
    avatarUrl: updatedUser.avatarUrl,
    updatedAt: updatedUser.updatedAt,
  };
};

const getAvailableTechnicians = async () => {
  const technicians = await prisma.user.findMany({
    where: { role: 'TECHNICIAN' },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      areaId: true,
      avatarUrl: true,
    },
  });

  // Calculate active outage repair count for each technician
  const activeOutages = await prisma.outageReport.findMany({
    where: {
      status: {
        in: ['TECHNICIAN_ASSIGNED', 'EN_ROUTE', 'REPAIR_IN_PROGRESS'],
      },
    },
  });

  return technicians.map((tech) => {
    const assignedCount = activeOutages.filter((o) => o.assignedTechnicianId === tech.id).length;
    return {
      ...tech,
      activeWorkload: assignedCount,
      status: assignedCount === 0 ? 'AVAILABLE' : assignedCount < 3 ? 'BUSY' : 'FULL_CAPACITY',
    };
  });
};

const getAllUsers = async (query: IUserFilterQuery) => {
  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 10;
  const skip = (page - 1) * limit;

  const whereCondition: any = {};
  if (query.role) {
    whereCondition.role = query.role;
  }
  if (query.searchTerm) {
    whereCondition.name = { contains: query.searchTerm };
  }

  const users = await prisma.user.findMany({
    where: whereCondition,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      phone: true,
      isVerified: true,
      areaId: true,
      avatarUrl: true,
      createdAt: true,
    },
    skip,
    take: limit,
    orderBy: { createdAt: 'desc' },
  });

  const total = await prisma.user.count({ where: whereCondition });

  return {
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
    data: users,
  };
};

export const UserService = {
  getMyProfile,
  updateMyProfile,
  getAvailableTechnicians,
  getAllUsers,
};
