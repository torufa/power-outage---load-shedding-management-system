import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { Express } from 'express';
import { config } from './src/app/config/index.js';
import { globalErrorHandler } from './src/app/middlewares/globalErrorHandler.js';
import { notFound } from './src/app/middlewares/notFound.js';
import { AppRoutes } from './src/app/routes/index.js';

const app:Express = express();

// Basic security and parsing middleware
app.use(cors({ origin: true, credentials: true }));
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Custom security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// Root route for Vercel health check
app.get('/', (req, res) => {
  res.send('GridPulse API is running successfully on Vercel!');
});

// REST API version 1 registration
app.use('/api/v1', AppRoutes);

// Error handling middleware
app.use(globalErrorHandler);
app.use(notFound);

// Local Development Server (Only runs when NOT on Vercel)
if (process.env.NODE_ENV !== 'production') {
  app.listen(config.port, () => {
    console.log(`⚡ GridPulse Power Management Server running on port ${config.port}`);
  });
}

// ⚡ Vercel Serverless Function-এর জন্য সবচেয়ে গুরুত্বপূর্ণ লাইন
export default app;