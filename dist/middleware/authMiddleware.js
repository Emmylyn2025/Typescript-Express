"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminAuth = exports.auth = void 0;
const appError_1 = require("../utils/appError");
const token_1 = require("../utils/token");
const auth = (req, res, next) => {
    const headers = req.headers.authorization;
    if (!headers)
        return next(new appError_1.appError("No access token available", 401));
    const token = headers?.split(" ")[1];
    //Decode access token
    const decoded = (0, token_1.verifyAccessToken)(token);
    //console.log(decoded);
    req.user = decoded;
    next();
};
exports.auth = auth;
const adminAuth = (req, res, next) => {
    if (req.user?.role !== 'ADMIN')
        return next(new appError_1.appError("You are not authorised for this action", 403));
    next();
};
exports.adminAuth = adminAuth;
