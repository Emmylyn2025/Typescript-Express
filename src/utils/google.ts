import { OAuth2Client } from "google-auth-library";

export function googleClient(): any {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URL

  if (!clientId || !clientSecret || !redirectUri) {
    new Error("Google credentials are not in env");
  }

  return new OAuth2Client({
    clientId,
    clientSecret,
    redirectUri
  });
}
