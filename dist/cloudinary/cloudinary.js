"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const cloudinary_1 = require("cloudinary");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const cloudName = process.env.cloudinart_cloud_name;
const cloudKey = process.env.cloudinary_api_key;
const cloudSecret = process.env.cloudinary_api_secret;
if (!cloudName || !cloudKey || !cloudSecret) {
    new Error("Cloudinary credentials are missing in env");
}
cloudinary_1.v2.config({
    cloud_name: cloudName,
    api_key: cloudKey,
    api_secret: cloudSecret
});
exports.default = cloudinary_1.v2;
