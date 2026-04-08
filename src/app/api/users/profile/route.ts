import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { users } from "@/lib/schema";
import { eq } from "drizzle-orm";

// POST — upsert user profile (called after signup/login)
export async function POST(req: Request) {
  try {
    const { firebaseUid, displayName, email, whatsappNumber } = await req.json();
    if (!firebaseUid || !email) {
      return NextResponse.json({ error: "firebaseUid and email are required" }, { status: 400 });
    }

    const db = getDb();
    if (!db) return NextResponse.json({ error: "DB offline" }, { status: 503 });

    const existing = await db.select().from(users).where(eq(users.firebaseUid, firebaseUid));

    if (existing.length > 0) {
      // Update — only set whatsappNumber if provided (don't overwrite with null)
      await db.update(users)
        .set({
          displayName: displayName || existing[0].displayName,
          ...(whatsappNumber ? { whatsappNumber } : {}),
          updatedAt: new Date(),
        })
        .where(eq(users.firebaseUid, firebaseUid));
    } else {
      // Insert new user
      await db.insert(users).values({
        firebaseUid,
        displayName,
        email,
        whatsappNumber: whatsappNumber || null,
      });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[UserProfile] Error:", err.message);
    return NextResponse.json({ error: "Failed to save profile" }, { status: 500 });
  }
}

// GET — fetch user profile
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const firebaseUid = searchParams.get("firebaseUid");
    if (!firebaseUid) return NextResponse.json({ error: "Missing firebaseUid" }, { status: 400 });

    const db = getDb();
    if (!db) return NextResponse.json({ error: "DB offline" }, { status: 503 });

    const [profile] = await db.select().from(users).where(eq(users.firebaseUid, firebaseUid));
    return NextResponse.json(profile || null);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
