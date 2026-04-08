import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { integrations } from "@/lib/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  const db = getDb();
  if (!db) return NextResponse.json({ error: "DB offline" });
  
  const rows = await db.select().from(integrations).where(eq(integrations.provider, "gmail"));
  
  return NextResponse.json(rows.map(r => {
    let parsed: any = {};
    try { parsed = JSON.parse(r.accessToken!); } catch { parsed = { raw: r.accessToken?.substring(0, 50) }; }
    return {
      id: r.id,
      userId: r.userId,
      enabled: r.enabled,
      hasAccessToken: !!parsed.accessToken,
      accessTokenPrefix: parsed.accessToken?.substring(0, 20),
      hasRefreshToken: !!parsed.refreshToken,
      // Real Google OAuth refresh tokens START with "1//" — Firebase tokens do NOT
      refreshTokenPrefix: parsed.refreshToken?.substring(0, 15),
      isRealOAuthToken: parsed.refreshToken?.startsWith("1//"),
      expiryDate: parsed.expiryDate,
    };
  }));
}

export async function DELETE() {
  const db = getDb();
  if (!db) return NextResponse.json({ error: "DB offline" });
  await db.delete(integrations).where(eq(integrations.provider, "gmail"));
  return NextResponse.json({ success: true, message: "ALL Gmail integrations deleted from DB." });
}
