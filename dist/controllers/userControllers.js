"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateUser = exports.deleteUser = exports.resetPassword = exports.forgotpassword = exports.allUsers = exports.logout = exports.refresh = exports.LoginUsers = exports.RegisterUsers = void 0;
//import { Prisma } from "@prisma/client";
const handleErrorPrisma_1 = require("../utils/handleErrorPrisma");
const prismaClient_1 = __importDefault(require("../prisma/prismaClient"));
const hashPassword_1 = require("../utils/hashPassword");
const redis_1 = __importDefault(require("../redis/redis"));
const token_1 = require("../utils/token");
const appError_1 = require("../utils/appError");
const queryBuilder_1 = __importDefault(require("../utils/queryBuilder"));
const uuid_1 = require("uuid");
const crypto_1 = __importDefault(require("crypto"));
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
    await redis_1.default.set(`user:${user.id}`, refreshToken, { EX: 2592000 });
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
    await redis_1.default.set(`user:${user.id}`, refreshToken, { EX: 2592000 });
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
exports.allUsers = (0, appError_1.asyncHandler)(async (req, res, next) => {
    const allowedFields = ['username', 'email', 'createdAt', 'age', 'role', 'id'];
    const builder = new queryBuilder_1.default(req.query).filter(allowedFields).limitFields(allowedFields).sort(allowedFields).paginate();
    try {
        const users = await prismaClient_1.default.user.findMany(builder.query);
        res.status(200).json({
            status: 'success',
            data: users,
            length: users.length
        });
    }
    catch (error) {
        const { status, message } = (0, handleErrorPrisma_1.handlePrismaError)(error);
        res.status(status).json({ message });
    }
});
exports.forgotpassword = (0, appError_1.asyncHandler)(async (req, res, next) => {
    const { email } = req.body;
    const user = await prismaClient_1.default.user.findUnique({
        where: {
            email
        }
    });
    if (!user)
        return next(new appError_1.appError("User not found", 404));
    //Generate random token
    const randomToken = await crypto_1.default.randomBytes(32).toString('base64');
    const url = `http://localhost:3000/typescript/reset-password/${randomToken}`;
    console.log(url);
    //Save hased bytes in redis
    await redis_1.default.set(`userReset:${randomToken}`, user.id, { EX: 600 });
    res.status(200).json({
        message: "Sent to your gmail successfully"
    });
});
exports.resetPassword = (0, appError_1.asyncHandler)(async (req, res, next) => {
    const { token } = req.params;
    const { newPassword } = req.body;
    //Get user from redis
    const userId = await redis_1.default.get(`userReset:${token}`);
    if (!userId)
        return next(new appError_1.appError("Invalid or expired token", 401));
    const hashedPassword = await (0, hashPassword_1.hashPassword)(newPassword);
    try {
        await prismaClient_1.default.user.update({
            where: {
                id: userId
            },
            data: {
                password: hashedPassword
            }
        });
        res.status(200).json({
            message: "Password reset successfully"
        });
    }
    catch (error) {
        const { status, message } = (0, handleErrorPrisma_1.handlePrismaError)(error);
        res.status(status).json({ message });
    }
});
exports.deleteUser = (0, appError_1.asyncHandler)(async (req, res, next) => {
    const { id } = req.params;
    if (!(0, uuid_1.validate)(id))
        return next(new appError_1.appError("Invalid id format", 400));
    try {
        const user = await prismaClient_1.default.user.delete({
            where: { id },
            select: {
                id: true,
                username: true,
                email: true,
                createdAt: true,
                role: true
            }
        });
        res.status(200).json({
            message: "User deleted successfully",
            user
        });
    }
    catch (error) {
        const { status, message } = (0, handleErrorPrisma_1.handlePrismaError)(error);
        res.status(status).json({ message });
    }
});
exports.updateUser = (0, appError_1.asyncHandler)(async (req, res, next) => {
    const { id } = req.params;
    if (!(0, uuid_1.validate)(id))
        return next(new appError_1.appError("Invalid id format", 400));
    let { username, age, role } = req.body;
    try {
        const user = await prismaClient_1.default.user.update({
            where: { id },
            data: {
                username,
                age,
                role
            },
            select: {
                username: true,
                age: true,
                role: true
            }
        });
        res.status(200).json({
            user,
            message: 'User updated successfully'
        });
    }
    catch (error) {
        const { status, message } = (0, handleErrorPrisma_1.handlePrismaError)(error);
        res.status(status).json({ message });
    }
});
