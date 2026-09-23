import type { RequestHandler } from 'express';
import httpStatus from 'http-status';

export const notFound: RequestHandler = (req, res, next) => {
  res.status(httpStatus.NOT_FOUND).json({
    success: false,
    message: `Endpoint not found: ${req.method} ${req.originalUrl}`,
    errors: [{ path: req.originalUrl, message: 'API route does not exist' }],
  });
};
