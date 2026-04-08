"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.upload = void 0;
const multer_1 = __importDefault(require("multer"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const storage = multer_1.default.diskStorage({
    destination: function (req, file, cb) {
        const dest = 'src/uploads';
        //Check if uploads folder exists
        if (!fs_1.default.existsSync(dest)) {
            fs_1.default.mkdirSync(dest);
        }
        cb(null, dest);
    },
    filename: function (req, file, cb) {
        const filename = Date.now() + path_1.default.extname(file.originalname);
        cb(null, filename);
    }
});
const fileFilter = function (req, file, cb) {
    if (!file.mimetype.startsWith('image')) {
        cb(false, new Error('Only images can be uploaded'));
    }
    else {
        cb(null, 'image allowed');
    }
};
exports.upload = (0, multer_1.default)({
    storage,
    fileFilter,
    limits: 10 * 1024 * 1024 //Maximum of 10mb 
});
