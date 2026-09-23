import type { Request, Response } from 'express';
import httpStatus from 'http-status';
import { config } from '../../config/index.js';
import { catchAsync } from '../../utils/catchAsync.js';
import { sendResponse } from '../../utils/sendResponse.js';
import { AuthService } from './auth.service.js';

const register = catchAsync(async (req: Request, res: Response) => {
  const ip = req.ip || req.socket.remoteAddress;
  const result = await AuthService.register(req.body, ip);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'User registered successfully. Please verify the OTP code sent to your email.',
    data: result,
  });
});

const verifyOtp = catchAsync(async (req: Request, res: Response) => {
  const ip = req.ip || req.socket.remoteAddress;
  const result = await AuthService.verifyOtp(req.body, ip);

  const { refreshToken, accessToken, user } = result;

  res.cookie('refreshToken', refreshToken, {
    secure: config.env === 'production',
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  res.cookie('accessToken', accessToken, {
    secure: config.env === 'production',
    httpOnly: false,
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000,
  });

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Account verified successfully with Redis OTP.',
    data: { user, accessToken },
  });
});

const login = catchAsync(async (req: Request, res: Response) => {
  const ip = req.ip || req.socket.remoteAddress;
  const result = await AuthService.login(req.body, ip);

  const { refreshToken, accessToken, user } = result;

  res.cookie('refreshToken', refreshToken, {
    secure: config.env === 'production',
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  res.cookie('accessToken', accessToken, {
    secure: config.env === 'production',
    httpOnly: false,
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000,
  });

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'User logged in successfully',
    data: { user, accessToken },
  });
});

const googleLogin = catchAsync(async (req: Request, res: Response) => {
  const ip = req.ip || req.socket.remoteAddress;
  const result = await AuthService.googleLogin(req.body, ip);

  const { refreshToken, accessToken, user } = result;

  res.cookie('refreshToken', refreshToken, {
    secure: config.env === 'production',
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'GCP Social Login verified successfully',
    data: { user, accessToken },
  });
});

const refreshToken = catchAsync(async (req: Request, res: Response) => {
  const token = req.cookies.refreshToken || req.body.refreshToken;
  const result = await AuthService.refreshToken(token);

  res.cookie('refreshToken', result.refreshToken, {
    secure: config.env === 'production',
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Access token refreshed successfully',
    data: { accessToken: result.accessToken },
  });
});

const logout = catchAsync(async (req: Request, res: Response) => {
  res.clearCookie('refreshToken');
  res.clearCookie('accessToken');

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'User logged out successfully',
    data: null,
  });
});

export const AuthController = {
  register,
  verifyOtp,
  login,
  googleLogin,
  refreshToken,
  logout,
};
