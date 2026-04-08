"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAuthCallBackHandler = exports.googleAuthStart = exports.updateUser = exports.deleteUser = exports.resetPassword = exports.forgotpassword = exports.allUsers = exports.logout = exports.refresh = exports.LoginUsers = exports.verifyEmail = exports.RegisterUsers = exports.verifyUrl = void 0;
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
const templates_1 = require("../email/templates");
const google_1 = require("../utils/google");
const removePassword_1 = require("../utils/removePassword");
const templates_2 = require("../email/templates");
exports.RegisterUsers = (0, appError_1.asyncHandler)(async (req, res, next) => {
    const { username, email, password } = req.body;
    //Check if user exists before
    const user = await prismaClient_1.default.user.findUnique({
        where: {
            email: email
        }
    });
    if (user) {
        return next(new appError_1.appError("This is a registered user", 409));
    }
    //Hash the user password
    const hash = await (0, hashPassword_1.hashPassword)(password);
    //create user
    const newUser = await prismaClient_1.default.user.create({
        data: {
            username,
            email,
            password: hash
        }
    });
    //generate email verification token
    const token = (0, token_1.verifyToken)(newUser);
    exports.verifyUrl = `http://localhost:${process.env.PORT}/typescript/verify-email?token=${token}`;
    await (0, templates_1.sendEmail)(newUser.email, exports.verifyUrl);
    await redis_1.default.set(`registerToken${newUser.id}`, token, { EX: 3600 * 24 });
    res.status(201).json({
        status: 'success',
        message: "USer registered successfully, Make sure you verify your email",
        member: {
            id: newUser.id,
            email: newUser.email,
            emailVerified: newUser.isEmailVer
        }
    });
});
exports.verifyEmail = (0, appError_1.asyncHandler)(async (req, res, next) => {
    const token = req.query.token;
    if (!token)
        return next(new appError_1.appError("Verification token is missing", 400));
    const verify = (0, token_1.decodedEmailToken)(token);
    const user = await prismaClient_1.default.user.findUnique({
        where: {
            id: verify.id
        }
    });
    if (!user)
        return next(new appError_1.appError("User not found", 404));
    //Check if the token has expired in redis
    const userToken = await redis_1.default.get(`registerToken${user.id}`);
    if (!userToken)
        return next(new appError_1.appError("The email verification token has been expired", 400));
    //Update user email verification
    await prismaClient_1.default.user.update({
        where: {
            id: user.id
        },
        data: {
            isEmailVer: true
        }
    });
    res.json({
        message: "Email verification complete, You can now login"
    });
});
exports.LoginUsers = (0, appError_1.asyncHandler)(async (req, res, next) => {
    const { email, password } = req.body;
    //Check if email exists
    const user = await prismaClient_1.default.user.findUnique({
        where: {
            email: email
        },
        select: {
            id: true,
            username: true,
            email: true,
            password: true,
            role: true,
            isEmailVer: true
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
    if (user.isEmailVer === false)
        return next(new appError_1.appError("You haven't verified your email", 400));
    const removedPassword = (0, removePassword_1.removePassword)(user);
    //If password is valid
    const { accessToken, refreshToken } = (0, token_1.generateTokens)(removedPassword);
    //Save refresh token in redis
    await redis_1.default.set(`user:${user.id}`, refreshToken, { EX: 2592000 });
    //store accesstoken in redis for cookie expiration
    await redis_1.default.set(`access${user.id}`, accessToken, { EX: 1800 });
    //Save refresh token in httpOnly cookie
    (0, token_1.saveRefreshToken)(res, refreshToken);
    res.status(200).json({
        message: "Login Successful",
        token: accessToken,
        user: removedPassword
    });
});
exports.refresh = (0, appError_1.asyncHandler)(async (req, res, next) => {
    const refreshCookie = req.cookies?.refreshtoken;
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
    //Get access token fom cookie
    const accessToken = req.cookies?.accessToken;
    if (accessToken) {
        const user2 = (0, token_1.verifyAccessToken)(accessToken);
        if (user.sessionId === user2.sessionId) {
            res.clearCookie('accessToken');
            res.clearCookie('refreshtoken');
            return res.status(200).json({
                message: "Google logout successful"
            });
        }
    }
    //console.log(user);
    //Check if it is valid in redis
    const redis = await redis_1.default.get(`user:${user.id}`);
    const access = await redis_1.default.get(`access${user.id}`);
    //save the access token as blacklist
    await redis_1.default.set(`blacklist${access}`, "true", { EX: 3600 });
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
    const allowedFields = ['username', 'email', 'createdAt', 'role', 'id', "isEmailVer"];
    const builder = new queryBuilder_1.default(req.query).filter(allowedFields).limitFields(allowedFields).sort(allowedFields).paginate();
    try {
        const users = await prismaClient_1.default.user.findMany({
            ...builder.query,
            select: {
                ...(builder.query.select || {}),
                products: {
                    select: {
                        id: true,
                        name: true,
                        price: true
                    }
                },
                carts: {
                    select: {
                        id: true
                    }
                },
                orders: {
                    select: {
                        id: true,
                        status: true,
                        createdAt: true,
                        total: true,
                        orderItems: {
                            select: {
                                quantity: true,
                                price: true,
                                productId: true,
                                product: {
                                    select: {
                                        productImageUrl: true,
                                        name: true
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });
        res.status(200).json({
            status: 'success',
            data: users,
            length: users.length
        });
    }
    catch (error) {
        const { status, message } = (0, handleErrorPrisma_1.handlePrismaError)(error);
        res.status(status).json({ message });
        console.log(error);
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
    //Save hased bytes in redis
    await redis_1.default.set(`userReset:${randomToken}`, user.id, { EX: 60 * 10 });
    const url = `http://localhost:3000/typescript/reset-password?token=${randomToken}`;
    //Send the url link to the user email
    await (0, templates_2.sendResetPass)(user.email, url);
    res.status(200).json({
        message: "Sent to your gmail successfully"
    });
});
exports.resetPassword = (0, appError_1.asyncHandler)(async (req, res, next) => {
    const { token } = req.query;
    const { newPassword } = req.body;
    //Get user from redis
    const userId = await redis_1.default.get(`userReset:${token}`);
    //console.log(userId);
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
    let { username, role, orderId, status } = req.body;
    try {
        const user = await prismaClient_1.default.user.update({
            where: { id },
            data: {
                username,
                role,
                orders: {
                    update: {
                        where: {
                            id: orderId
                        },
                        data: {
                            status
                        }
                    }
                }
            },
            select: {
                username: true,
                role: true,
                orders: {
                    select: {
                        status: true
                    }
                }
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
exports.googleAuthStart = (0, appError_1.asyncHandler)(async (req, res, next) => {
    const client = (0, google_1.googleClient)();
    const url = client.generateAuthUrl({
        access_type: "offline",
        prompt: "consent",
        scope: ["openid", "email", "profile"]
    });
    //console.log(url);
    return res.redirect(url);
});
exports.getAuthCallBackHandler = (0, appError_1.asyncHandler)(async (req, res, next) => {
    const code = req.query.code;
    if (!code) {
        return next(new appError_1.appError("Missing code in callback", 400));
    }
    const client = (0, google_1.googleClient)();
    const { tokens } = await client.getToken(code);
    if (!tokens.id_token)
        return next(new appError_1.appError("Google id token is not present", 400));
    const ticket = await client.verifyIdToken({
        idToken: tokens.id_token,
        audience: process.env.GOOGLE_CLIENT_ID
    });
    const payload = ticket.payload;
    const email = payload?.email;
    const emailVerified = payload?.email_verified;
    if (!email || emailVerified !== true)
        return next(new appError_1.appError("This email is not verified by google", 400));
    const normalizedEmail = email.toLowerCase().trim();
    let user = await prismaClient_1.default.user.findUnique({
        where: {
            email: normalizedEmail
        }
    });
    if (user && user.isEmailVer === false) {
        await prismaClient_1.default.user.update({
            where: {
                id: user?.id
            },
            data: {
                isEmailVer: true
            }
        });
    }
    if (!user) {
        //Create a new user if the user does not exists
        const randomPassword = await crypto_1.default.randomBytes(16).toString('hex');
        const hashedPassword = await (0, hashPassword_1.hashPassword)(randomPassword);
        //Make google create a new user
        user = await prismaClient_1.default.user.create({
            data: {
                email: normalizedEmail,
                password: hashedPassword,
                role: 'USER',
                username: payload?.given_name,
                isEmailVer: true
            }
        });
    }
    const { accessToken, refreshToken } = (0, token_1.generateTokens)(user);
    //save refresh token in redis
    await redis_1.default.set(`user:${user.id}`, refreshToken, { EX: 2592000 });
    //Save refresh token in httpOnly cookie
    (0, token_1.saveRefreshToken)(res, refreshToken);
    //Save access token in httpOnly cookie too
    res.cookie("accessToken", accessToken, {
        httpOnly: true,
        secure: false, // true in production
        sameSite: "lax",
        maxAge: 30 * 60 * 1000
    });
    // res.status(200).json({
    //   message: "Google Login Successful",
    //   token: accessToken
    // });
    res.redirect("http://localhost:3000/typescript/products");
});
