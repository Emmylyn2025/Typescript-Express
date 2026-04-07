import { Request, Response, NextFunction } from "express";
import redisClient from "../redis/redis";
import { appError, asyncHandler } from "../utils/appError";

const WINDOW_SIZE = 60;
const MAX_REQUESTS = 10;

export const rateLimiter = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const ip = req.ip;
  const key = `rate-limit:${ip}`;

  const request = await redisClient.incr(key);
  if (request === 1) {
    await redisClient.expire(key, WINDOW_SIZE);
  }

  if (request > MAX_REQUESTS) {
    return next(new appError("To many request from this ip", 429));
  }

  next();
});