import jwt, { type JwtPayload, type Secret, type SignOptions } from 'jsonwebtoken';
import { config } from '../config/index.js';

export const createToken = (
  payload: Record<string, unknown>,
  secret: Secret,
  expireTime: string,
): string => {
  return jwt.sign(payload, secret, {
    expiresIn: expireTime as SignOptions['expiresIn'],
  });
};

export const verifyToken = (token: string, secret: Secret): JwtPayload => {
  return jwt.verify(token, secret) as JwtPayload;
};

export const generateAuthTokens = (payload: {
  id: string;
  email: string;
  role: string;
  name: string;
}) => {
  const accessToken = createToken(payload, config.jwt.access_secret, config.jwt.access_expires_in);

  const refreshToken = createToken(
    payload,
    config.jwt.refresh_secret,
    config.jwt.refresh_expires_in,
  );

  return {
    accessToken,
    refreshToken,
  };
};
