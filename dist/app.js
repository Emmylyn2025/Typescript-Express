"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const router_1 = __importDefault(require("./routes/router"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const appError_1 = require("./utils/appError");
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use((0, cookie_parser_1.default)());
app.use('/typescript', router_1.default);
//Not found error handler
app.use((req, res, next) => {
    next(new appError_1.appError(`The request ${req.originalUrl} with method ${req.method} is not found on the server`, 404));
});
//GlobalError handler 
app.use(appError_1.globalError);
exports.default = app;
