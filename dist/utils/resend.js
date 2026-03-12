"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const resend_1 = require("resend");
const resend = new resend_1.Resend(process.env.resend_api_key);
// async function sendEmail() {
//   try {
//     const response = await resend.emails.send({
//       from: 'awobodu@emmanuel.com',
//       to: "recipient@example.com",
//       subject: "Hello from Resend!",
//       html: "<h1>This is a test email</h1><p>Sent using Resend API</p>",
//     });
//     console.log("Email sent successfully:", response);
//   } catch (error) {
//     console.error("Error sending email:", error);
//   }
// }
