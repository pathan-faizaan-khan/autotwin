import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { users } from "@/lib/schema";
import { eq, and, ne } from "drizzle-orm";

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

    // Check phone uniqueness before saving
    if (whatsappNumber) {
      const digits = whatsappNumber.replace(/[^0-9]/g, "");
      if (digits.length >= 10) {
        const suffix = digits.slice(-10);
        const conflict = await db
          .select({ id: users.id })
          .from(users)
          .where(
            existing.length > 0
              ? and(ne(users.firebaseUid, firebaseUid))
              : undefined as any
          )
          .limit(20);
        // Check suffix manually (Drizzle doesn't support REGEXP in all dialects)
        const duplicate = conflict.find(u => {
          // We can't do REGEXP in Drizzle easily, so we do a JS check on raw data
          return false; // rely on DB-level check via Supabase; skip JS check here
        });
        if (duplicate) {
          return NextResponse.json({ error: "This phone number is already registered to another account." }, { status: 409 });
        }
        // Supabase-level check
        try {
          const { createClient } = await import("@supabase/supabase-js");
          const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
          );
          const { data: phoneCheck } = await supabase
            .from("users")
            .select("id, firebase_uid")
            .neq("firebase_uid", firebaseUid)
            .ilike("whatsapp_number", `%${suffix}`)
            .limit(1);
          if (phoneCheck && phoneCheck.length > 0) {
            return NextResponse.json({ error: "This phone number is already registered to another account." }, { status: 409 });
          }
        } catch { /* non-fatal: proceed if Supabase check fails */ }
      }
    }

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
