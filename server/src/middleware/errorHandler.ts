import { Request, Response, NextFunction } from 'express';
import config from '../config';

export const errorHandler = ( err: Error, req: Request, res: Response, _next: NextFunction ) => {
  console.error(`[ERROR] Unhandled error: ${err.message}`);
  if (err.stack && config.nodeEnv === 'development') {
    console.error (err.stack); // only in dev
  }
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;

  res.status(statusCode).json({
    message: err.message,
    // detailed stack errors should be avoided for security
    stack: config.nodeEnv === 'production' ? 'Production error' : err.stack,
  })
}