import { google } from "googleapis";

export function getOAuth2Client() {
  const redirectUri =
    process.env.APP_URL
      ? `${process.env.APP_URL}/auth/google/callback`
      : "http://localhost:5173/auth/google/callback";

  return new google.auth.OAuth2(
    process.env.AUTH_GOOGLE_ID!,
    process.env.AUTH_GOOGLE_SECRET!,
    redirectUri
  );
}

export function getGoogleAuthUrl() {
  const client = getOAuth2Client();
  return client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: [
      "openid",
      "email",
      "profile",
      "https://www.googleapis.com/auth/calendar",
    ],
  });
}
