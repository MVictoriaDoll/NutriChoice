// src/middleware/errorHandler.ts
import { Request, Response, NextFunction } from 'express'
import config from '../config'

export const errorHandler = (
  err: Error & { status?: number; name?: string },
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  // new: for handling the UnauthorizedError thrown by express-jwt
  if (err.name === 'UnauthorizedError') {
    console.error(`[AUTH ERROR] ${err.message}`)
    return res.status(err.status || 401).json({
      message: err.message,
    })
  }

  console.error(`[ERROR] Unhandled error: ${err.message}`)
  if (err.stack && config.nodeEnv === 'development') {
    console.error(err.stack) // only in dev
  }
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode

  res.status(statusCode).json({
    message: err.message,
    // detailed stack errors should be avoided for security
    stack: config.nodeEnv === 'production' ? 'Production error' : err.stack,
  })
}
