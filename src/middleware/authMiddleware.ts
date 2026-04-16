import { Request, Response, NextFunction } from "express";
import { appError } from "../utils/appError";
import { verifyAccessToken } from "../utils/token";
import redisClient from "../redis/redis";

export const auth = async (req: Request, res: Response, next: NextFunction) => {
  // const headers = req.headers.authorization;
  // if (!headers) return next(new appError("No access token available", 401));
  let token: string | undefined;

  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
  }

  //For google login
  if (!token && req.cookies?.accessToken) {
    token = req.cookies?.accessToken;

    if (!token) {
      return res.status(401).json({
        message: "Not authenticated"
      });
    }
  }

  //let token = headers?.split(" ")[1];

  //Black listed token after logout
  const blackListToken = await redisClient.get(`blacklist${token}`);
  if (blackListToken) return next(new appError("You have logged out", 401));

  try {
  //Decode access token
    const decoded = verifyAccessToken(token as string);
    req.user = decoded;
  } catch (error: any) {

    if (error.name === 'TokenExpiredError') {
      return next(new appError("jwt expired", 401));
    }

    return next(new appError("internal server error", 500))
  }

  next();
};

export const adminAuth = (req: Request, res: Response, next: NextFunction) => {
  //console.log(req.user?.role);
  if (req.user?.role !== 'ADMIN') return next(new appError("You are not authorised for this action", 403));

  next();
};