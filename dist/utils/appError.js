"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.globalError = exports.asyncHandler = exports.appError = void 0;
//Custom Error class
class appError extends Error {
    statusCode;
    status;
    isOperational;
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.status = statusCode >= 400 && statusCode < 500 ? "Fail" : "Error";
        this.isOperational = true;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.appError = appError;
//Error handler
const asyncHandler = (fn) => {
    return (req, res, next) => {
        fn(req, res, next).catch(next);
    };
};
exports.asyncHandler = asyncHandler;
//Global Error handler
const globalError = (err, req, res, next) => {
    console.log(err.message);
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({
        status: err.status || 'fail',
        message: err.message
    });
};
exports.globalError = globalError;
