import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();
import fs from "fs";

if (
  !process.env.resend_api_host ||
  !process.env.resend_api_port ||
  !process.env.resend_api_user ||
  !process.env.resend_api_key ||
  !process.env.resend_from
) {
  throw new Error("SMTP variables are undefined");
}

const host = process.env.resend_api_host;
const port = Number(process.env.resend_api_port);
const user = process.env.resend_api_user;
const pass = process.env.resend_api_key;
const from = process.env.resend_from

const transporter = nodemailer.createTransport({
  host,
  port,
  secure: true,
  auth: {
    user,
    pass
  }
});

export async function sendEmail(userEmail: string, verifyUrl: string) {
  const htmlTemplate = fs.readFileSync("./src/email/template.html", "utf-8");
  const html = htmlTemplate.replace(/{{verification_link}}/g, verifyUrl);

  const mailOptions = {
    from,
    to: userEmail,
    subject: 'Verify Your Email Address',
    html: html,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Verification email sent:', info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
}

