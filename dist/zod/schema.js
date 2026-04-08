"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateSchema = exports.productSchema = exports.forgotSchema = exports.loginSchema = exports.registerSchema = void 0;
const zod_1 = __importDefault(require("zod"));
exports.registerSchema = zod_1.default.object({
    username: zod_1.default.string().min(3, { message: "Username must be minimum of 3 characters" }).trim(),
    email: zod_1.default.email({ message: "Invalid email format" }).trim().toLowerCase(),
    password: zod_1.default.string().min(8, { message: "Username must be minimum of 8 characters" }).trim(),
});
exports.loginSchema = zod_1.default.object({
    email: zod_1.default.email({ message: "Invalid email format" }).trim().toLowerCase(),
    password: zod_1.default.string().min(8, { message: "Username must be minimum of 8 characters" }).trim(),
});
exports.forgotSchema = zod_1.default.object({
    email: zod_1.default.email({ message: "Invalid email format" }).trim().toLowerCase()
});
exports.productSchema = zod_1.default.object({
    name: zod_1.default.string().min(3, { message: "Product name must be atleast 3 characters" }).trim(),
    price: zod_1.default.coerce.number({ message: "Product price must be a number" }),
    description: zod_1.default.string().optional(),
    InStock: zod_1.default.coerce.boolean().optional()
});
exports.updateSchema = zod_1.default.object({
    name: zod_1.default.string().min(3, { message: "Product name must be atleast 3 characters" }).optional(),
    price: zod_1.default.coerce.number({ message: "Product price must be a number" }).optional(),
    description: zod_1.default.string().optional(),
    InStock: zod_1.default.coerce.boolean().optional()
});
