import { z } from 'zod';

const updateUserRoleSchema = z.object({
  body: z.object({
    role: z.enum(['CUSTOMER', 'TECHNICIAN', 'ADMIN']),
  }),
});

export const AdminValidation = {
  updateUserRoleSchema,
};
