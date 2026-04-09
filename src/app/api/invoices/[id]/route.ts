import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { extractedDocuments } from "@/lib/schema";
import { eq } from "drizzle-orm";

// GET /api/invoices/[id] — returns full extractedDocument with all AI fields
export async function GET(req: Request, { params }: { params: { id: string } }) {
  const db = getDb();
  if (!db) return NextResponse.json({ error: "No DB" }, { status: 500 });

  try {
    const [doc] = await db
      .select()
      .from(extractedDocuments)
      .where(eq(extractedDocuments.id, params.id));

    if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ doc });
  } catch (err) {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
