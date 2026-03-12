"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handlePrismaError = handlePrismaError;
const client_1 = require("@prisma/client/runtime/client");
function handlePrismaError(error) {
    if (error instanceof client_1.PrismaClientKnownRequestError) {
        if (error.code === "P2025") {
            return {
                status: 404,
                message: "Record not found"
            };
        }
    }
    //Other prisma error
    if (error instanceof client_1.PrismaClientInitializationError) {
        return {
            status: 400,
            message: "Invalid request"
        };
    }
    return {
        status: 500,
        message: "Something went wrog please try again later"
    };
}
