"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminAuth = exports.auth = void 0;
const appError_1 = require("../utils/appError");
const token_1 = require("../utils/token");
const redis_1 = __importDefault(require("../redis/redis"));
const auth = async (req, res, next) => {
    // const headers = req.headers.authorization;
    // if (!headers) return next(new appError("No access token available", 401));
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
        token = req.headers.authorization.split(" ")[1];
    }
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
    const blackListToken = await redis_1.default.get(`blacklist${token}`);
    if (blackListToken)
        return next(new appError_1.appError("You have logged out", 401));
    //Decode access token
    const decoded = (0, token_1.verifyAccessToken)(token);
    //console.log(decoded);
    req.user = decoded;
    //console.log(decoded);
    next();
};
exports.auth = auth;
const adminAuth = (req, res, next) => {
    //console.log(req.user?.role);
    if (req.user?.role !== 'ADMIN')
        return next(new appError_1.appError("You are not authorised for this action", 403));
    next();
};
exports.adminAuth = adminAuth;
