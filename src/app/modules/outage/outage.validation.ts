import { z } from 'zod';

const createOutageSchema = z.object({
  body: z.object({
    title: z.string().min(3, 'Title is required'),
    description: z.string().min(5, 'Detailed description is required'),
    feederId: z.string().min(1, 'Feeder ID is required'),
    areaId: z.string().min(1, 'Area ID is required'),
    outageType: z
      .enum(['UNPLANNED', 'FEEDER_TRIP', 'TRANSFORMER_FAILURE', 'CABLE_FAULT', 'SCHEDULED_SHED'])
      .optional(),
    severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'EMERGENCY']).optional(),
    photoUrl: z.string().optional(),
  }),
});

const assignTechnicianSchema = z.object({
  body: z.object({
    technicianId: z.string().min(1, 'Technician ID is required'),
    estimatedRestorationHours: z.number().positive().optional(),
    dispatchNotes: z.string().optional(),
  }),
});

const updateOutageStatusSchema = z.object({
  body: z.object({
    status: z.enum([
      'REPORTED',
      'VERIFIED',
      'TECHNICIAN_ASSIGNED',
      'EN_ROUTE',
      'REPAIR_IN_PROGRESS',
      'RESTORED',
      'CANCELLED',
    ]),
    notes: z.string().optional(),
    resolutionNotes: z.string().optional(),
  }),
});

export const OutageValidation = {
  createOutageSchema,
  assignTechnicianSchema,
  updateOutageStatusSchema,
};
