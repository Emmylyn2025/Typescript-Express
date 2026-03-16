"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loginSchema = exports.registerSchema = void 0;
const zod_1 = __importDefault(require("zod"));
exports.registerSchema = zod_1.default.object({
    username: zod_1.default.string().min(3).trim(),
    email: zod_1.default.email().trim().toLowerCase(),
    password: zod_1.default.string().min(8).trim(),
    age: zod_1.default.number()
});
exports.loginSchema = zod_1.default.object({
    email: zod_1.default.email().trim().toLowerCase(),
    password: zod_1.default.string().min(8).trim(),
});
