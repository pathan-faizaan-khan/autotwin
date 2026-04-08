import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { approvals, extractedDocuments } from "@/lib/schema";
import { eq, and } from "drizzle-orm";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");

  const db = getDb();
  if (!db) return NextResponse.json({ approvals: [] });
  try {
    // Filter approvals by userId
    const data = userId
      ? await db.select().from(approvals).where(eq(approvals.userId, userId))
      : [];

    // Filter AI-flagged OCR docs by userId + human_review decision
    const ocrAlerts = userId
      ? await db.select().from(extractedDocuments).where(
          and(eq(extractedDocuments.userId, userId), eq(extractedDocuments.decision, "human_review"))
        )
      : [];

    const mappedOcrAlerts = ocrAlerts.map(doc => ({
      id: doc.id,
      invoiceId: doc.invoiceId,
      vendor: doc.vendor,
      invoiceNo: String(doc.invoiceId).substring(0, 8).toUpperCase(),
      amount: doc.amount,
      fileUrl: doc.fileUrl,
      confidence: doc.confidence,
      reason: doc.explanation || `Risk Score: ${(doc.riskScore * 100).toFixed(0)}%`,
      requestedBy: "AutoTwin OCR Engine",
      status: doc.status === "needs_review" ? "pending" : (doc.status === "approved" || doc.status === "rejected" ? doc.status : "pending"),
      createdAt: doc.createdAt,
      notes: ""
    }));

    return NextResponse.json({ approvals: [...mappedOcrAlerts, ...data] });
  } catch (err: any) {
    console.error("Approvals API Error:", err.message);
    return NextResponse.json({ approvals: [] });
  }
}

export async function PATCH(req: Request) {
  const body = await req.json(); // { id, status, notes }
  const db = getDb();
  if (!db) return NextResponse.json({ error: "No DB connection" }, { status: 500 });
  try {
    const { extractedDocuments } = await import("@/lib/schema");
    
    // First try extractedDocuments
    let updatedObj = null;
    const [updatedDoc] = await db
      .update(extractedDocuments)
      .set({ status: body.status }) 
      .where(eq(extractedDocuments.id, body.id))
      .returning();
      
    if (updatedDoc) {
      updatedObj = updatedDoc;
    } else {
      // Fallback to approvals
      const [updatedApp] = await db
        .update(approvals)
        .set({ status: body.status, notes: body.notes })
        .where(eq(approvals.id, body.id))
        .returning();
      updatedObj = updatedApp;
    }
    
    if (!updatedObj) {
        return NextResponse.json({ error: "Record not found" }, { status: 404 });
    }

    return NextResponse.json({ approval: updatedObj });
  } catch (err: any) {
    return NextResponse.json({ error: "Update failed", details: err.message }, { status: 500 });
  }
}
