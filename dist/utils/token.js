"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateTokens = generateTokens;
exports.verifyToken = verifyToken;
exports.decodedEmailToken = decodedEmailToken;
exports.verifyAccessToken = verifyAccessToken;
exports.verifyRefreshToken = verifyRefreshToken;
exports.saveRefreshToken = saveRefreshToken;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const crypto_1 = __importDefault(require("crypto"));
function generateTokens(user) {
    const accessSecret = process.env.accessToken;
    const refreshSecret = process.env.refreshToken;
    if (!accessSecret || !refreshSecret) {
        throw new Error("JWT are not defined in environmental variables");
    }
    const sessionId = crypto_1.default.randomBytes(16).toString('hex');
    const accessToken = jsonwebtoken_1.default.sign({
        id: user?.id,
        username: user?.username,
        email: user?.email,
        role: user?.role,
        isEmailVer: user?.isEmailVer,
        sessionId
    }, accessSecret, { expiresIn: "30m" });
    const refreshToken = jsonwebtoken_1.default.sign({
        id: user?.id,
        username: user?.username,
        email: user?.email,
        role: user?.role,
        isEmailVer: user?.isEmailVer,
        sessionId
    }, refreshSecret, { expiresIn: "30d" });
    return { accessToken, refreshToken };
}
function verifyToken(user) {
    const emailSecret = process.env.emailtoken;
    if (!emailSecret) {
        throw new Error("JWT are not defined in environmental variables");
    }
    const token = jsonwebtoken_1.default.sign({
        id: user?.id,
        username: user?.username
    }, emailSecret, { expiresIn: "1d" });
    return token;
}
function decodedEmailToken(token) {
    const emailSecret = process.env.emailtoken;
    if (!emailSecret) {
        throw new Error("JWT are not defined in environmental variables");
    }
    return jsonwebtoken_1.default.verify(token, emailSecret);
}
//Verify accesstoken
function verifyAccessToken(token) {
    const accessSecret = process.env.accessToken;
    if (!accessSecret) {
        throw new Error("Access Token is not in env");
    }
    return jsonwebtoken_1.default.verify(token, accessSecret);
}
//Verify refresh Token
function verifyRefreshToken(token) {
    const refreshSecret = process.env.refreshToken;
    if (!refreshSecret) {
        throw new Error("Refresh Token is not in env");
    }
    return jsonwebtoken_1.default.verify(token, refreshSecret);
}
function saveRefreshToken(res, token) {
    res.cookie('refreshtoken', token, {
        httpOnly: true,
        secure: false,
        maxAge: 30 * 24 * 60 * 60 * 1000,
        sameSite: "lax",
    });
}
