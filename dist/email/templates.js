"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendEmail = sendEmail;
exports.sendResetPass = sendResetPass;
const nodemailer_1 = __importDefault(require("nodemailer"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const fs_1 = __importDefault(require("fs"));
if (!process.env.resend_api_host ||
    !process.env.resend_api_port ||
    !process.env.resend_api_user ||
    !process.env.resend_api_key ||
    !process.env.resend_from) {
    throw new Error("SMTP variables are undefined");
}
const host = process.env.resend_api_host;
const port = Number(process.env.resend_api_port);
const user = process.env.resend_api_user;
const pass = process.env.resend_api_key;
const from = process.env.resend_from;
const transporter = nodemailer_1.default.createTransport({
    host,
    port,
    secure: true,
    auth: {
        user,
        pass
    }
});
async function sendEmail(userEmail, verifyUrl) {
    const htmlTemplate = fs_1.default.readFileSync("./src/email/tmp.html", "utf-8");
    const html = htmlTemplate.replace(/{{verification_link}}/g, verifyUrl);
    const another = html.replace(/{{user_email}}/g, userEmail);
    const mailOptions = {
        from,
        to: userEmail,
        subject: 'Verify Your Email Address',
        html: another,
    };
    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('Verification email sent:', info.messageId);
        return info;
    }
    catch (error) {
        console.error('Error sending email:', error);
        throw error;
    }
}
async function sendResetPass(userEmail, resetUrl) {
    const htmlTemplate = fs_1.default.readFileSync("./src/email/passTemplate.html", "utf-8");
    const html = htmlTemplate.replace(/{{reset_link}}/g, resetUrl);
    const final = html.replace(/{{user_email}}/g, userEmail);
    const mailOptions = {
        from,
        to: userEmail,
        subject: 'Verify Your Email Address',
        html: final,
    };
    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('Verification email sent:', info.messageId);
        return info;
    }
    catch (error) {
        console.error('Error sending email:', error);
        throw error;
    }
}
