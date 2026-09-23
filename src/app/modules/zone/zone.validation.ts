import { z } from 'zod';

const createZoneSchema = z.object({
  body: z.object({
    name: z.string().min(3, 'Zone name is required'),
    code: z.string().min(2, 'Zone code is required'),
    region: z.string().min(2, 'Region is required'),
    maxCapacityMW: z.number().positive().optional(),
    currentLoadMW: z.number().nonnegative().optional(),
  }),
});

const createSubstationSchema = z.object({
  body: z.object({
    name: z.string().min(3, 'Substation name is required'),
    code: z.string().min(2, 'Substation code is required'),
    zoneId: z.string().min(1, 'Zone ID is required'),
    capacityMVA: z.number().positive().optional(),
  }),
});

const createFeederSchema = z.object({
  body: z.object({
    name: z.string().min(3, 'Feeder name is required'),
    code: z.string().min(2, 'Feeder code is required'),
    substationId: z.string().min(1, 'Substation ID is required'),
    currentDemandMW: z.number().positive().optional(),
    maxLimitMW: z.number().positive().optional(),
    status: z.enum(['ACTIVE', 'LOAD_SHEDDING', 'TRIPPED', 'MAINTENANCE']).optional(),
  }),
});

const updateFeederStatusSchema = z.object({
  body: z.object({
    status: z.enum(['ACTIVE', 'LOAD_SHEDDING', 'TRIPPED', 'MAINTENANCE']),
    reason: z.string().optional(),
  }),
});

export const ZoneValidation = {
  createZoneSchema,
  createSubstationSchema,
  createFeederSchema,
  updateFeederStatusSchema,
};
