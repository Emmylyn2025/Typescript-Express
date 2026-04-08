"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.rateLimiter = void 0;
const redis_1 = __importDefault(require("../redis/redis"));
const appError_1 = require("../utils/appError");
const WINDOW_SIZE = 60;
const MAX_REQUESTS = 10;
exports.rateLimiter = (0, appError_1.asyncHandler)(async (req, res, next) => {
    const ip = req.ip;
    const key = `rate-limit:${ip}`;
    const request = await redis_1.default.incr(key);
    if (request === 1) {
        await redis_1.default.expire(key, WINDOW_SIZE);
    }
    if (request > MAX_REQUESTS) {
        return next(new appError_1.appError("To many request from this ip", 429));
    }
    next();
});
