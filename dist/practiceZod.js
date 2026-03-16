"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const zod_1 = __importDefault(require("zod"));
const schema = zod_1.default.object({
    username: zod_1.default.string().trim(),
    email: zod_1.default.email().trim(),
    password: zod_1.default.string().trim().min(8),
    age: zod_1.default.number()
});
const user = {
    username: " Awobodu ",
    email: "emma@gmail.com",
    password: "123456789",
    age: "20"
};
try {
    const result = schema.safeParse(user);
    if (!result.success) {
        console.log(result.error.flatten().fieldErrors);
    }
    else {
        console.log(result.data);
    }
}
catch (err) {
    console.log(err);
}
//console.log(result);
