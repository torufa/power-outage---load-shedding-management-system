import { z } from 'zod';

const updateProfileValidationSchema = z.object({
  body: z.object({
    name: z.string().min(2).optional(),
    phone: z.string().optional(),
    areaId: z.string().optional(),
    avatarUrl: z.string().url().optional(),
  }),
});

export const UserValidation = {
  updateProfileValidationSchema,
};
