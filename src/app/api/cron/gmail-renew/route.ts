

import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { integrations } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { google } from "googleapis";

export async function GET(req: Request) {
  // Verify this is a legitimate Vercel cron call (or internal call in dev)
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = getDb();
  if (!db) return NextResponse.json({ error: "DB offline" }, { status: 503 });

  // Fetch all enabled Gmail integrations that have a valid refresh token
  const allGmail = await db
    .select()
    .from(integrations)
    .where(eq(integrations.provider, "gmail"));

  const enabled = allGmail.filter(i => {
    if (!i.accessToken || !i.enabled) return false;
    try {
      const p = JSON.parse(i.accessToken);
      return p.refreshToken?.startsWith("1//");
    } catch { return false; }
  });

  const results: { userId: string; status: string }[] = [];

  for (const integration of enabled) {
    let tokenData: { accessToken?: string; refreshToken?: string; expiryDate?: number };
    try { tokenData = JSON.parse(integration.accessToken!); }
    catch { continue; }

    try {
      const oAuth2Client = new google.auth.OAuth2(
        process.env.GMAIL_CLIENT_ID,
        process.env.GMAIL_CLIENT_SECRET
      );
      oAuth2Client.setCredentials({
        access_token: tokenData.accessToken,
        refresh_token: tokenData.refreshToken,
        expiry_date: tokenData.expiryDate,
      });

      const gmail = google.gmail({ version: "v1", auth: oAuth2Client });
      const topicName = process.env.NEXT_PUBLIC_GMAIL_PUBSUB_TOPIC!;

      await gmail.users.watch({
        userId: "me",
        requestBody: { topicName, labelIds: ["INBOX"] },
      });

      // Update lastSyncedAt to track renewal time
      await db
        .update(integrations)
        .set({ lastSyncedAt: new Date() })
        .where(eq(integrations.id, integration.id));

      console.log(`[CronRenew] ✅ Gmail watch renewed for user ${integration.userId}`);
      results.push({ userId: integration.userId, status: "renewed" });
    } catch (err: any) {
      console.error(`[CronRenew] ❌ Failed for user ${integration.userId}:`, err.message);
      results.push({ userId: integration.userId, status: `failed: ${err.message}` });
    }
  }

  return NextResponse.json({
    ok: true,
    renewed: results.filter(r => r.status === "renewed").length,
    results,
  });
}
