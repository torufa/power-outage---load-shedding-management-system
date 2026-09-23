import { z } from 'zod';

const registerValidationSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email address format'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    role: z.enum(['CUSTOMER', 'TECHNICIAN', 'ADMIN']).optional(),
    phone: z.string().optional(),
    areaId: z.string().optional(),
  }),
});

const loginValidationSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required'),
  }),
});

const verifyOtpValidationSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    otp: z.string().length(6, 'OTP must be exactly 6 digits'),
  }),
});

const googleLoginValidationSchema = z.object({
  body: z.object({
    email: z.string().email('Valid email is required'),
    name: z.string().min(1, 'Name is required'),
    googleId: z.string().min(1, 'Google ID is required'),
    avatarUrl: z.string().optional(),
  }),
});

const refreshTokenValidationSchema = z.object({
  cookies: z
    .object({
      refreshToken: z.string().optional(),
    })
    .optional(),
  body: z
    .object({
      refreshToken: z.string().optional(),
    })
    .optional(),
});

export const AuthValidation = {
  registerValidationSchema,
  loginValidationSchema,
  verifyOtpValidationSchema,
  googleLoginValidationSchema,
  refreshTokenValidationSchema,
};
