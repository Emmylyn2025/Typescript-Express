"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.hashPassword = hashPassword;
exports.confirmPassword = confirmPassword;
const bcrypt_1 = __importDefault(require("bcrypt"));
async function hashPassword(password) {
    return await bcrypt_1.default.hash(password, 10);
}
async function confirmPassword(password, savedPassword) {
    return await bcrypt_1.default.compare(password, savedPassword);
}
