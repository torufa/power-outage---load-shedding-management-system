import httpStatus from "http-status";
import { AppError } from "../../middlewares/globalErrorHandler.js";
import { sendEmail } from "../../utils/mailer.js";
import { prisma } from "../../utils/prisma.js";
import type {
  IAssignTechnician,
  ICreateOutageReport,
  IOutageFilterQuery,
  IUpdateOutageStatus,
} from "./outage.interface.js";

const createOutage = async (
  payload: ICreateOutageReport,
  reporterId: string,
  photoUrl?: string,
  ipAddress?: string,
) => {
  const feeder = await prisma.feeder.findUnique({
    where: { id: payload.feederId },
  });
  if (!feeder) {
    throw new AppError(httpStatus.NOT_FOUND, "Feeder line not found");
  }

  const area = await prisma.area.findUnique({
    where: { id: payload.areaId },
  });
  if (!area) {
    throw new AppError(httpStatus.NOT_FOUND, "Area not found");
  }

  const outage = await prisma.outageReport.create({
    data: {
      ticketNumber: `TKT-${new Date().getFullYear()}-${Date.now().toString().slice(-8)}`,
      title: payload.title,
      description: payload.description,
      feederId: payload.feederId,
      areaId: payload.areaId,
      reportedById: reporterId,
      outageType: payload.outageType || "UNPLANNED",
      severity: payload.severity || "MEDIUM",
      photoUrl: photoUrl || payload.photoUrl || null,
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: reporterId,
      action: "OUTAGE_REPORTED",
      entity: "OutageReport",
      entityId: outage.id,
      details: {
        ticketNumber: outage.ticketNumber,
        title: outage.title,
        feeder: feeder.name,
      },
      ipAddress: ipAddress || null,
    },
  });

  return outage;
};

const getAllOutages = async (query: IOutageFilterQuery) => {
  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 10;
  const skip = (page - 1) * limit;

  const whereCondition: any = {};
  if (query.status) whereCondition.status = query.status;
  if (query.severity) whereCondition.severity = query.severity;
  if (query.feederId) whereCondition.feederId = query.feederId;
  if (query.searchTerm) {
    whereCondition.title = { contains: query.searchTerm };
  }

  const outages = await prisma.outageReport.findMany({
    where: whereCondition,
    include: {
      feeder: true,
      area: true,
      reportedBy: true,
      assignedTechnician: true,
      timeline: true,
    },
    skip,
    take: limit,
    orderBy: { createdAt: "desc" },
  });

  const total = await prisma.outageReport.count({ where: whereCondition });

  return {
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
    data: outages,
  };
};

const getOutageById = async (id: string) => {
  const outage = await prisma.outageReport.findUnique({
    where: { id },
    include: {
      feeder: true,
      area: true,
      reportedBy: true,
      assignedTechnician: true,
      timeline: true,
    },
  });

  if (!outage) {
    throw new AppError(httpStatus.NOT_FOUND, "Outage report not found");
  }

  return outage;
};

const getMyAssignedOutages = async (technicianId: string) => {
  const outages = await prisma.outageReport.findMany({
    where: { assignedTechnicianId: technicianId },
    include: {
      feeder: true,
      area: true,
      timeline: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return outages;
};

const assignTechnician = async (
  outageId: string,
  payload: IAssignTechnician,
  adminId: string,
  ipAddress?: string,
) => {
  const outage = await prisma.outageReport.findUnique({
    where: { id: outageId },
  });

  if (!outage) {
    throw new AppError(httpStatus.NOT_FOUND, "Outage ticket not found");
  }

  const technician = await prisma.user.findUnique({
    where: { id: payload.technicianId },
  });

  if (!technician || technician.role !== "TECHNICIAN") {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Selected user is not an active technician",
    );
  }

  const estimatedRestoration = payload.estimatedRestorationHours
    ? new Date(Date.now() + payload.estimatedRestorationHours * 3600 * 1000)
    : new Date(Date.now() + 2 * 3600 * 1000);

  // Execute in transaction
  const updatedOutage = await prisma.$transaction(async (tx) => {
    const updated = await tx.outageReport.update({
      where: { id: outageId },
      data: {
        assignedTechnicianId: payload.technicianId,
        status: "TECHNICIAN_ASSIGNED",
        estimatedRestoration,
      },
    });

    await tx.outageTimeline.create({
      data: {
        outageId,
        status: "TECHNICIAN_ASSIGNED",
        notes:
          payload.dispatchNotes || `Assigned to technician ${technician.name}`,
        updatedById: adminId,
      },
    });

    await tx.auditLog.create({
      data: {
        userId: adminId,
        action: "TECHNICIAN_DISPATCHED",
        entity: "OutageReport",
        entityId: outageId,
        details: {
          ticket: outage.ticketNumber,
          technicianId: technician.id,
          technicianName: technician.name,
        },
        ipAddress: ipAddress || null,
      },
    });

    return updated;
  });

  // Notify technician via email
  await sendEmail({
    to: technician.email,
    subject: `🚨 Urgent Dispatch: Outage Ticket ${outage.ticketNumber}`,
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h3 style="color: #d97706;">GridPulse Emergency Field Dispatch</h3>
        <p>You have been assigned to repair: <strong>${outage.title}</strong></p>
        <p><strong>Ticket Number:</strong> ${outage.ticketNumber}</p>
        <p><strong>Severity:</strong> ${outage.severity}</p>
        <p><strong>Dispatch Notes:</strong> ${payload.dispatchNotes || "Immediate inspection required"}</p>
      </div>
    `,
  });

  return updatedOutage;
};

const updateOutageStatus = async (
  outageId: string,
  payload: IUpdateOutageStatus,
  userId: string,
  userRole: string,
  ipAddress?: string,
) => {
  const outage = await prisma.outageReport.findUnique({
    where: { id: outageId },
  });

  if (!outage) {
    throw new AppError(httpStatus.NOT_FOUND, "Outage report not found");
  }

  // If technician, verify they are the assigned technician
  if (userRole === "TECHNICIAN" && outage.assignedTechnicianId !== userId) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "You can only update status for outages assigned to you",
    );
  }

  const isRestored = payload.status === "RESTORED";

  const updatedOutage = await prisma.$transaction(async (tx) => {
    const updated = await tx.outageReport.update({
      where: { id: outageId },
      data: {
        status: payload.status,
        ...(isRestored ? { restoredAt: new Date() } : {}),
        ...(payload.resolutionNotes
          ? { resolutionNotes: payload.resolutionNotes }
          : {}),
      },
    });

    await tx.outageTimeline.create({
      data: {
        outageId,
        status: payload.status,
        notes:
          payload.notes ||
          payload.resolutionNotes ||
          `Status updated to ${payload.status}`,
        updatedById: userId,
      },
    });

    await tx.auditLog.create({
      data: {
        userId,
        action: `OUTAGE_${payload.status}`,
        entity: "OutageReport",
        entityId: outageId,
        details: { previousStatus: outage.status, newStatus: payload.status },
        ipAddress: ipAddress || null,
      },
    });

    return updated;
  });

  return updatedOutage;
};

const softDeleteOutage = async (
  outageId: string,
  adminId: string,
  ipAddress?: string,
) => {
  const outage = await prisma.outageReport.findUnique({
    where: { id: outageId },
  });

  if (!outage) {
    throw new AppError(httpStatus.NOT_FOUND, "Outage report not found");
  }

  await prisma.outageReport.update({
    where: { id: outageId },
    data: { isDeleted: true },
  });

  await prisma.auditLog.create({
    data: {
      userId: adminId,
      action: "OUTAGE_SOFT_DELETED",
      entity: "OutageReport",
      entityId: outageId,
      details: { ticket: outage.ticketNumber },
      ipAddress: ipAddress || null,
    },
  });

  return { message: "Outage record soft deleted successfully" };
};

export const OutageService = {
  createOutage,
  getAllOutages,
  getOutageById,
  getMyAssignedOutages,
  assignTechnician,
  updateOutageStatus,
  softDeleteOutage,
};
