import { Request, Response, NextFunction } from "express";
import { appError } from "../utils/appError";
import { verifyAccessToken } from "../utils/token";

export const auth = (req: Request, res: Response, next: NextFunction) => {
  const headers = req.headers.authorization;
  if (!headers) return next(new appError("No access token available", 401));

  const token = headers?.split(" ")[1];

  //Decode access token
  const decoded = verifyAccessToken(token);
  //console.log(decoded);
  req.user = decoded;

  next();
};

export const adminAuth = (req: Request, res: Response, next: NextFunction) => {
  //console.log(req.user?.role);
  if (req.user?.role !== 'ADMIN') return next(new appError("You are not authorised for this action", 403));

  next();
};