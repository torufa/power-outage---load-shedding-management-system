import type { Response } from 'express';

interface IMeta {
  page?: number;
  limit?: number;
  total?: number;
  totalPages?: number;
}

interface IApiResponse<T> {
  statusCode: number;
  success: boolean;
  message?: string;
  meta?: IMeta;
  data: T;
}

export const sendResponse = <T>(res: Response, data: IApiResponse<T>) => {
  res.status(data.statusCode).json({
    success: data.success,
    message: data.message || 'Operation successful',
    meta: data.meta,
    data: data.data,
  });
};
