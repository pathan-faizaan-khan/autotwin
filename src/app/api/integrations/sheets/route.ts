import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { userSpreadsheets } from "@/lib/schema";
import { eq, and, desc } from "drizzle-orm";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");
  
  if (!userId) {
    return NextResponse.json({ error: "Missing userId" }, { status: 400 });
  }

  const db = getDb();
  if (!db) return NextResponse.json({ error: "DB offline" }, { status: 503 });

  // Get all spreadsheets for this user
  const sheets = await db
    .select()
    .from(userSpreadsheets)
    .where(eq(userSpreadsheets.userId, userId))
    .orderBy(desc(userSpreadsheets.createdAt));

  return NextResponse.json({ 
    sheets: sheets.map(s => ({
      spreadsheetId: s.spreadsheetId,
      month: s.month,
      createdAt: s.createdAt
    }))
  });
}
