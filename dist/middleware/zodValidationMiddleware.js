"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const validation = (schema) => (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success)
        return res.status(400).json({ message: "Invalid data", error: result.error.flatten().fieldErrors });
    req.body = result.data;
    next();
};
exports.default = validation;
