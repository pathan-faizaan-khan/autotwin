import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { userSettings } from "@/lib/schema";
import { eq } from "drizzle-orm";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");
  if (!userId) return NextResponse.json({ error: "Missing userId" }, { status: 400 });

  const db = getDb();
  if (!db) return NextResponse.json(defaultSettings(userId));

  try {
    const [row] = await db.select().from(userSettings).where(eq(userSettings.userId, userId));
    return NextResponse.json(row ?? defaultSettings(userId));
  } catch {
    return NextResponse.json(defaultSettings(userId));
  }
}

export async function POST(req: Request) {
  const body = await req.json();
  const { userId, ...fields } = body;
  if (!userId) return NextResponse.json({ error: "Missing userId" }, { status: 400 });

  const db = getDb();
  if (!db) return NextResponse.json({ error: "DB offline" }, { status: 503 });

  try {
    const [existing] = await db.select().from(userSettings).where(eq(userSettings.userId, userId));
    if (existing) {
      const [updated] = await db
        .update(userSettings)
        .set({ ...fields, updatedAt: new Date() })
        .where(eq(userSettings.userId, userId))
        .returning();
      return NextResponse.json({ settings: updated });
    } else {
      const [created] = await db
        .insert(userSettings)
        .values({ userId, ...fields })
        .returning();
      return NextResponse.json({ settings: created });
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

function defaultSettings(userId: string) {
  return {
    userId,
    confidenceAutoApprove: 95,
    confidenceHitl: 70,
    notifyEmail: true,
    notifyAlerts: true,
    notifyWorkflow: false,
    plan: "free",
  };
}
