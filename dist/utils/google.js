"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.googleClient = googleClient;
const google_auth_library_1 = require("google-auth-library");
function googleClient() {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = process.env.GOOGLE_REDIRECT_URL;
    if (!clientId || !clientSecret || !redirectUri) {
        new Error("Google credentials are not in env");
    }
    return new google_auth_library_1.OAuth2Client({
        clientId,
        clientSecret,
        redirectUri
    });
}
