import { Request, Response, NextFunction } from "express";

//Custom Error class
export class appError extends Error {
  statusCode: number;
  status: string;
  isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);

    this.statusCode = statusCode;
    this.status = statusCode >= 400 && statusCode < 500 ? "Fail" : "Error";
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

//Error handler
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  }
}

//Global Error handler
export const globalError = (err: appError, req: Request, res: Response, next: NextFunction) => {
  console.log(err.message);
  const statusCode = err.statusCode || 500;

  res.status(statusCode).json({
    status: err.status || 'fail',
    message: err.message
  })
}