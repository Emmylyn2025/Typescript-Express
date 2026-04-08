"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.removePassword = void 0;
const removePassword = (user) => {
    const { password, ...rest } = user;
    return rest;
};
exports.removePassword = removePassword;
