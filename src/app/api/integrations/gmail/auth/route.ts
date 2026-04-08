import { NextResponse } from "next/server";
import { google } from "googleapis";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({ error: "No userId provided" }, { status: 400 });
  }

  const clientId = process.env.GMAIL_CLIENT_ID;
  const clientSecret = process.env.GMAIL_CLIENT_SECRET;
  
  if (!clientId || !clientSecret) {
    return NextResponse.json({ error: "GMAIL_CLIENT_ID or GMAIL_CLIENT_SECRET not configured in .env.local" }, { status: 500 });
  }

  // Get dynamic redirect URI based on host
  const protocol = process.env.NODE_ENV === "development" ? "http" : "https";
  const host = req.headers.get("host") || "localhost:3000";
  const redirectUri = `${protocol}://${host}/api/integrations/gmail/callback`;

  const oauth2Client = new google.auth.OAuth2(
    clientId,
    clientSecret,
    redirectUri
  );

  // Generate a url that asks permissions for Gmail Readonly
  // Pass the userId in the state so we can recover it in the callback
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: "offline", // Crucial: gets the refresh_token
    prompt: "consent",      // Crucial: forces google to issue the refresh_token again
    scope: ["https://www.googleapis.com/auth/gmail.readonly"],
    state: userId,
  });

  // Redirect user to Google OAuth screen
  return NextResponse.redirect(authUrl);
}
