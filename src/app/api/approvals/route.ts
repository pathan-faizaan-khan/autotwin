import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { approvals } from "@/lib/schema";
import { eq } from "drizzle-orm";

const MOCK_APPROVALS = [
  { id: "apr-001", invoiceId: "inv-003", vendor: "DigitalOcean", invoiceNo: "INV-2026-0043", amount: 45200, confidence: 48, reason: "Price 340% above 3-month average", requestedBy: "Vision Agent", status: "pending", createdAt: "2026-04-04T08:30:00Z", notes: "" },
  { id: "apr-002", invoiceId: "inv-006", vendor: "Razorpay", invoiceNo: "INV-2026-0046", amount: 98000, confidence: 33, reason: "Vendor not in approved vendor list. GST not verified.", requestedBy: "Memory Graph Agent", status: "pending", createdAt: "2026-04-02T15:00:00Z", notes: "" },
  { id: "apr-003", invoiceId: "inv-010", vendor: "Datadog", invoiceNo: "INV-2026-0050", amount: 78000, confidence: 55, reason: "Duplicate invoice suspected — matches INV-2026-0031", requestedBy: "Anomaly Detection Agent", status: "pending", createdAt: "2026-03-31T14:00:00Z", notes: "" },
  { id: "apr-004", invoiceId: "inv-011", vendor: "TechnoVendor Inc.", invoiceNo: "INV-2026-0051", amount: 147600, confidence: 41, reason: "3× price spike. Previous invoice was ₹49,200 (no contract change)", requestedBy: "Confidence Engine", status: "pending", createdAt: "2026-03-30T11:00:00Z", notes: "" },
  { id: "apr-005", invoiceId: "inv-012", vendor: "SupplyPro Ltd.", invoiceNo: "INV-2026-0052", amount: 86200, confidence: 58, reason: "3 invoices in 48 hours — abnormal frequency (historical: 1/2 weeks)", requestedBy: "Reflection Agent", status: "pending", createdAt: "2026-03-29T10:00:00Z", notes: "" },
];

export async function GET() {
  const db = getDb();
  if (!db) return NextResponse.json({ approvals: [] });
  try {
    const data = await db.select().from(approvals);
    
    // Pull real AI flagged items from the new FastAPI extracted_documents
    const { extractedDocuments } = await import("@/lib/schema");
    const { eq } = await import("drizzle-orm");
    
    const ocrAlerts = await db.select().from(extractedDocuments).where(eq(extractedDocuments.decision, "human_review"));
    
    const mappedOcrAlerts = ocrAlerts.map(doc => ({
      id: doc.id,
      invoiceId: doc.invoiceId,
      vendor: doc.vendor,
      invoiceNo: String(doc.invoiceId).substring(0, 8).toUpperCase(),
      amount: doc.amount,
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
    const [updated] = await db
      .update(approvals)
      .set({ status: body.status, notes: body.notes })
      .where(eq(approvals.id, body.id))
      .returning();
    return NextResponse.json({ approval: updated });
  } catch {
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}
