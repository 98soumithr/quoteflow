import { Request, Response, NextFunction } from 'express';
import { AppError } from '../lib/AppError';

export const errorHandler = (
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  console.error(err);

  if (err instanceof AppError) {
    res.status(err.status).json({
      success: false,
      message: err.message,
    });
    return;
  }

  if (err instanceof Error) {
    res.status(500).json({
      success: false,
      message: err.message || 'Internal server error',
    });
    return;
  }

  res.status(500).json({
    success: false,
    message: 'Internal server error',
  });
};
