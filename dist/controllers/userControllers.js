"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logout = exports.refresh = exports.LoginUsers = exports.RegisterUsers = void 0;
const prismaClient_1 = __importDefault(require("../prisma/prismaClient"));
const hashPassword_1 = require("../utils/hashPassword");
const redis_1 = __importDefault(require("../redis/redis"));
const token_1 = require("../utils/token");
const appError_1 = require("../utils/appError");
exports.RegisterUsers = (0, appError_1.asyncHandler)(async (req, res, next) => {
    const { username, email, password, age } = req.body;
    //Check if user exists before
    const user = await prismaClient_1.default.user.findUnique({
        where: {
            email: email
        }
    });
    if (user) {
        return next(new appError_1.appError("This is a registered user", 400));
    }
    //Hash the user password
    const hash = await (0, hashPassword_1.hashPassword)(password);
    //create user
    await prismaClient_1.default.user.create({
        data: {
            username,
            email,
            age,
            password: hash
        }
    });
    res.status(200).json({
        status: 'success',
        message: "USer registered successfully"
    });
});
exports.LoginUsers = (0, appError_1.asyncHandler)(async (req, res, next) => {
    const { email, password } = req.body;
    //Check if email exists
    const user = await prismaClient_1.default.user.findUnique({
        where: {
            email: email
        }
    });
    if (!user) {
        return next(new appError_1.appError("Invalid email", 401));
    }
    //Compare user password
    const confirm = await (0, hashPassword_1.confirmPassword)(password, user.password);
    if (!confirm) {
        return next(new appError_1.appError("Invalid password", 401));
    }
    //If password is valid
    const { accessToken, refreshToken } = (0, token_1.generateTokens)(user);
    //Save refresh token in redis
    await redis_1.default.set(`user:${user.id}`, refreshToken);
    //Save refresh token in httpOnly cookie
    (0, token_1.saveRefreshToken)(res, refreshToken);
    res.status(200).json({
        message: "Login Successful",
        token: accessToken
    });
});
exports.refresh = (0, appError_1.asyncHandler)(async (req, res, next) => {
    const refreshCookie = req.cookies.refreshtoken;
    if (!refreshCookie)
        return next(new appError_1.appError("No refresh token available in cookie", 401));
    const user = (0, token_1.verifyRefreshToken)(refreshCookie);
    //Check if it is valid in redis
    const redis = await redis_1.default.get(`user:${user.id}`);
    if (!redis)
        return next(new appError_1.appError("Invalid refresh token or Expired refresh token", 401));
    if (refreshCookie !== redis) {
        return next(new appError_1.appError("Invalid refresh token", 401));
    }
    //Assign new tokens
    const { accessToken, refreshToken } = (0, token_1.generateTokens)(user);
    //Save refresh token in redis
    await redis_1.default.set(`user:${user.id}`, refreshToken);
    //Save refresh token inside cookie
    (0, token_1.saveRefreshToken)(res, refreshToken);
    res.status(200).json({
        token: accessToken
    });
});
exports.logout = (0, appError_1.asyncHandler)(async (req, res, next) => {
    const refreshCookie = req.cookies.refreshtoken;
    if (!refreshCookie)
        return next(new appError_1.appError("No refresh token available in cookie", 401));
    const user = (0, token_1.verifyRefreshToken)(refreshCookie);
    //Check if it is valid in redis
    const redis = await redis_1.default.get(`user:${user.id}`);
    if (!redis)
        return next(new appError_1.appError("Invalid refresh token or Expired refresh token", 401));
    //Delete from redis
    await redis_1.default.del(`user:${user.id}`);
    //Remove from cookie
    res.clearCookie('refreshtoken');
    res.status(200).json({
        status: "Successful",
        message: "Logout successfully"
    });
});
