import type { NextFunction, Request, Response } from 'express';
import httpStatus from 'http-status';
import { config } from '../config/index.js';
import { verifyToken } from '../utils/jwt.js';

export interface IAuthUser {
  id: string;
  email: string;
  role: 'CUSTOMER' | 'TECHNICIAN' | 'ADMIN';
  name: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: IAuthUser;
    }
  }
}

export const auth = (...requiredRoles: Array<'CUSTOMER' | 'TECHNICIAN' | 'ADMIN'>) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      let token = req.headers.authorization;

      if (token && token.startsWith('Bearer ')) {
        token = token.split(' ')[1];
      } else if (req.cookies && req.cookies.accessToken) {
        token = req.cookies.accessToken;
      }

      if (!token) {
        return res.status(httpStatus.UNAUTHORIZED).json({
          success: false,
          message: 'You are not authorized! Token is missing.',
          errors: [{ path: 'authorization', message: 'No bearer token or cookie provided' }],
        });
      }

      let verifiedUser: any;
      try {
        verifiedUser = verifyToken(token, config.jwt.access_secret);
      } catch (err) {
        return res.status(httpStatus.UNAUTHORIZED).json({
          success: false,
          message: 'Invalid or expired authentication token',
          errors: [{ path: 'token', message: (err as Error).message }],
        });
      }

      req.user = verifiedUser as IAuthUser;

      // Role check
      if (requiredRoles.length && !requiredRoles.includes(verifiedUser.role)) {
        return res.status(httpStatus.FORBIDDEN).json({
          success: false,
          message: `Forbidden: User role '${verifiedUser.role}' does not have permission to access this resource`,
          errors: [{ path: 'role', message: 'Insufficient privileges' }],
        });
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};
