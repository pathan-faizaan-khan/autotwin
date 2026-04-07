import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { invoices } from "@/lib/schema";
import { eq } from "drizzle-orm";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const db = getDb();

  if (!db) {
    return NextResponse.json({ success: true, id, ...body });
  }

  try {
    const [updated] = await db
      .update(invoices)
      .set(body)
      .where(eq(invoices.id, id))
      .returning();
    return NextResponse.json({ invoice: updated });
  } catch {
    return NextResponse.json({ error: "Failed to update invoice" }, { status: 500 });
  }
}
