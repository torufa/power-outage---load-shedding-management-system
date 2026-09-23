import path from 'node:path';
import dotenv from 'dotenv';

dotenv.config({ path: path.join(process.cwd(), '.env') });

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 3000,
  database_url:
    process.env.DATABASE_URL ||
    'postgresql://postgres:postgres@localhost:5432/gridpulse_db?schema=public',
  jwt: {
    access_secret:
      process.env.JWT_ACCESS_SECRET || 'gridpulse_super_secret_access_jwt_key_2026_secure',
    refresh_secret:
      process.env.JWT_REFRESH_SECRET || 'gridpulse_super_secret_refresh_jwt_key_2026_secure',
    access_expires_in: process.env.JWT_ACCESS_EXPIRES_IN || '1d',
    refresh_expires_in: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },
  redis: {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: Number(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD || '',
  },
  stripe: {
    secret_key:
      process.env.STRIPE_SECRET_KEY || 'sk_test_51MockStripeSecretKeyForEvaluationAndTesting',
    webhook_secret: process.env.STRIPE_WEBHOOK_SECRET || 'whsec_mock_stripe_webhook_secret_key',
    success_url: process.env.STRIPE_SUCCESS_URL || 'http://localhost:3000/payments/success',
    cancel_url: process.env.STRIPE_CANCEL_URL || 'http://localhost:3000/payments/cancel',
  },
  cloudinary: {
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'gridpulse-utility',
    api_key: process.env.CLOUDINARY_API_KEY || 'mock_cloudinary_key',
    api_secret: process.env.CLOUDINARY_API_SECRET || 'mock_cloudinary_secret',
  },
  email: {
    host: process.env.EMAIL_HOST || 'smtp.ethereal.email',
    port: Number(process.env.EMAIL_PORT) || 587,
    user: process.env.EMAIL_USER || 'gridpulse.alerts@ethereal.email',
    pass: process.env.EMAIL_PASS || 'ethereal_mock_password',
    from: process.env.EMAIL_FROM || 'GridPulse Power Authority <alerts@gridpulse.gov>',
  },
  gcp: {
    client_id: process.env.GCP_CLIENT_ID || 'mock-gcp-oauth-client-id.apps.googleusercontent.com',
    client_secret: process.env.GCP_CLIENT_SECRET || 'mock-gcp-client-secret',
  },
  app_url: process.env.APP_URL || 'http://localhost:3000',
};
