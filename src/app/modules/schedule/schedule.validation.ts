import { z } from 'zod';

const createScheduleSchema = z.object({
  body: z.object({
    title: z.string().min(3, 'Title is required'),
    feederId: z.string().min(1, 'Feeder ID is required'),
    startTime: z.string().datetime().or(z.string().min(10)),
    endTime: z.string().datetime().or(z.string().min(10)),
    targetDeficitMW: z.number().positive().optional(),
    recurringDays: z.array(z.string()).optional(),
  }),
});

const generateAutomatedScheduleSchema = z.object({
  body: z.object({
    zoneId: z.string().optional(),
    gridDeficitMW: z.number().positive('Deficit must be greater than 0 MW'),
    durationHours: z.number().min(0.5).max(12, 'Duration must be between 30 mins and 12 hours'),
    reason: z.string().min(3, 'Reason is required (e.g. National grid transmission deficit)'),
  }),
});

const updateScheduleStatusSchema = z.object({
  body: z.object({
    status: z.enum(['SCHEDULED', 'ACTIVE', 'COMPLETED', 'CANCELLED']),
  }),
});

export const ScheduleValidation = {
  createScheduleSchema,
  generateAutomatedScheduleSchema,
  updateScheduleStatusSchema,
};
