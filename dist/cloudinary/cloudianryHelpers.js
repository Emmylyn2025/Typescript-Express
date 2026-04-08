"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const cloudinary_1 = __importDefault(require("./cloudinary"));
const uploadToCloudinary = async (filePath) => {
    try {
        const result = await cloudinary_1.default.uploader.upload(filePath);
        //console.log(result);
        return {
            productImageUrl: result.secure_url,
            productImageId: result.public_id
        };
    }
    catch (error) {
        console.log(error);
        new Error("Error while uploading to cloudinary");
    }
};
exports.default = uploadToCloudinary;
