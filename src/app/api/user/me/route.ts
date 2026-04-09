import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { users } from "@/lib/schema";
import { eq } from "drizzle-orm";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const firebaseUid = searchParams.get("firebaseUid");

  if (!firebaseUid) {
    return NextResponse.json({ error: "Missing firebaseUid" }, { status: 400 });
  }

  try {
    const db = getDb();
    if (!db) throw new Error("DB offline");

    const [user] = await db.select().from(users).where(eq(users.firebaseUid, firebaseUid)).limit(1);

    if (!user) {
      return NextResponse.json({ needsOnboarding: true, user: null });
    }

    // Check mandatory fields
    if (!user.whatsappNumber || !user.displayName) {
      return NextResponse.json({ needsOnboarding: true, user });
    }

    return NextResponse.json({ needsOnboarding: false, user });
  } catch (error: any) {
    console.error("[GET /api/user/me]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const body = await req.json();
  const { firebaseUid, email, displayName, whatsappNumber } = body;

  if (!firebaseUid || !email || !whatsappNumber) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  try {
    const db = getDb();
    if (!db) throw new Error("DB offline");

    const [existingUser] = await db.select().from(users).where(eq(users.firebaseUid, firebaseUid)).limit(1);

    if (existingUser) {
      await db.update(users).set({
        displayName: displayName || existingUser.displayName,
        whatsappNumber,
        updatedAt: new Date()
      }).where(eq(users.firebaseUid, firebaseUid));
    } else {
      await db.insert(users).values({
        firebaseUid,
        email,
        displayName: displayName || email.split("@")[0],
        whatsappNumber,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[POST /api/user/setup]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
