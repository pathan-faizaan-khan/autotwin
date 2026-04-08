import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { integrations } from "@/lib/schema";
import { eq, and } from "drizzle-orm";
import { google } from "googleapis";

// GET: Check if a user has an active integration
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");
  const provider = searchParams.get("provider") || "gmail";
  if (!userId) return NextResponse.json({ connected: false });
  const db = getDb();
  if (!db) return NextResponse.json({ connected: false });
  const existing = await db.select().from(integrations).where(
    and(eq(integrations.userId, userId), eq(integrations.provider, provider))
  ).limit(1);
  return NextResponse.json({ connected: existing.length > 0 && !!existing[0].accessToken });
}

// DELETE: Disconnect an integration
export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");
  const provider = searchParams.get("provider") || "gmail";
  if (!userId) return NextResponse.json({ error: "Missing userId" }, { status: 400 });
  const db = getDb();
  if (!db) return NextResponse.json({ error: "DB offline" }, { status: 503 });
  await db.delete(integrations).where(
    and(eq(integrations.userId, userId), eq(integrations.provider, provider))
  );
  return NextResponse.json({ success: true });
}

// POST: Save tokens + trigger Gmail watch
export async function POST(req: Request) {
  try {
    const { userId, provider, accessToken, refreshToken } = await req.json();

    if (!userId || !provider || !accessToken) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const db = getDb();
    if (!db) {
      return NextResponse.json({ error: "Database not available" }, { status: 503 });
    }

    const tokenToStore = refreshToken ? JSON.stringify({ accessToken, refreshToken }) : accessToken;

    const existing = await db.select().from(integrations).where(
      and(eq(integrations.userId, userId), eq(integrations.provider, provider))
    ).limit(1);

    if (existing.length > 0) {
      await db.update(integrations).set({
        enabled: true,
        accessToken: tokenToStore,
      }).where(eq(integrations.id, existing[0].id));
    } else {
      await db.insert(integrations).values({
        userId,
        provider,
        enabled: true,
        accessToken: tokenToStore,
      });
    }

    // Automatically trigger watch after saving token
    let watchStatus = "Not attempted";
    if (provider === "gmail" && accessToken) {
      try {
        const oAuth2Client = new google.auth.OAuth2();
        oAuth2Client.setCredentials({ access_token: accessToken });
        const gmail = google.gmail({ version: "v1", auth: oAuth2Client });
        const topicName = process.env.NEXT_PUBLIC_GMAIL_PUBSUB_TOPIC || "projects/autotwin-ai/topics/gmail-sync-topic";
        await gmail.users.watch({
          userId: "me",
          requestBody: { topicName, labelIds: ["INBOX"] }
        });
        watchStatus = `Active: ${topicName}`;
        console.log(`[Integrations] Gmail watch activated: ${topicName}`);
      } catch (watchErr: any) {
        watchStatus = `FAILED: ${watchErr.message}`;
        console.error("[Integrations] Gmail Watch failed:", watchErr.message);
        return NextResponse.json({ success: false, error: "Token saved, but GCP watch failed: " + watchErr.message }, { status: 400 });
      }
    }

    return NextResponse.json({ success: true, watchStatus });
  } catch (err: any) {
    console.error("[Integrations API Error]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
