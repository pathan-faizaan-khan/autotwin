import { NextResponse } from "next/server";
import { google } from "googleapis";
import { getDb } from "@/lib/db";
import { integrations } from "@/lib/schema";
import { eq, and } from "drizzle-orm";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const userId = searchParams.get("state");
  const error = searchParams.get("error");

  if (error) {
    return NextResponse.redirect(new URL("/dashboard/settings/profile?error=access_denied", req.url));
  }
  if (!code || !userId) {
    return NextResponse.json({ error: "Missing code or state" }, { status: 400 });
  }

  const clientId = process.env.GMAIL_CLIENT_ID;
  const clientSecret = process.env.GMAIL_CLIENT_SECRET;

  const protocol = process.env.NODE_ENV === "development" ? "http" : "https";
  const host = req.headers.get("host") || "localhost:3000";
  const redirectUri = `${protocol}://${host}/api/integrations/gmail/callback`;

  const oauth2Client = new google.auth.OAuth2(
    clientId,
    clientSecret,
    redirectUri
  );

  try {
    // Exchange the code for the permanent tokens
    const { tokens } = await oauth2Client.getToken(code);
    
    const db = getDb();
    if (!db) return NextResponse.json({ error: "Database offline" }, { status: 503 });

    // Store the raw tokens combined
    const storedToken = JSON.stringify({
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token, // This is a REAL permanent refresh token!
      expiryDate: tokens.expiry_date
    });

    // Check if integration already exists
    const existing = await db.select().from(integrations).where(
      and(eq(integrations.userId, userId), eq(integrations.provider, "gmail"))
    ).limit(1);

    if (existing.length > 0) {
      await db.update(integrations).set({
        accessToken: storedToken,
        enabled: true,
      }).where(eq(integrations.id, existing[0].id));
    } else {
      await db.insert(integrations).values({
        userId,
        provider: "gmail",
        enabled: true,
        accessToken: storedToken,
      });
    }

    // Since we now securely hold the tokens, we can cleanly trigger 'watch'
    oauth2Client.setCredentials(tokens);
    const gmail = google.gmail({ version: "v1", auth: oauth2Client });
    const topicName = process.env.NEXT_PUBLIC_GMAIL_PUBSUB_TOPIC || "projects/autotwin-ai/topics/gmail-sync-topic";
    
    try {
      await gmail.users.watch({
        userId: "me",
        requestBody: {
          topicName: topicName,
          labelIds: ["INBOX"],
        }
      });
      console.log(`[Integrations] Successfully activated automated Gmail push sync to ${topicName}!`);
    } catch (watchErr: any) {
      console.error("[Integrations] Gmail Watch trigger failed post-callback:", watchErr.message);
    }

    // Redirect the user back to the profile page with a success flag
    return NextResponse.redirect(new URL("/dashboard/settings/profile?sync=success", req.url));

  } catch (err: any) {
    console.error("OAuth Exchange Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
