import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { invoices, extractedDocuments } from "@/lib/schema";
import { desc, eq } from "drizzle-orm";

const MOCK_INVOICES = [
  { id: "inv-001", userId: "demo", vendor: "Amazon Web Services", invoiceNo: "INV-2026-0041", amount: 289500, currency: "INR", status: "approved", confidence: 96, category: "Cloud", fileUrl: null, createdAt: "2026-04-05T10:00:00Z" },
  { id: "inv-002", userId: "demo", vendor: "Stripe Payments", invoiceNo: "INV-2026-0042", amount: 125000, currency: "INR", status: "pending", confidence: 82, category: "Payments", fileUrl: null, createdAt: "2026-04-04T09:00:00Z" },
  { id: "inv-003", userId: "demo", vendor: "DigitalOcean", invoiceNo: "INV-2026-0043", amount: 45200, currency: "INR", status: "flagged", confidence: 48, category: "Cloud", fileUrl: null, createdAt: "2026-04-04T08:30:00Z" },
  { id: "inv-004", userId: "demo", vendor: "Slack Enterprise", invoiceNo: "INV-2026-0044", amount: 38500, currency: "INR", status: "approved", confidence: 94, category: "SaaS", fileUrl: null, createdAt: "2026-04-03T12:00:00Z" },
  { id: "inv-005", userId: "demo", vendor: "Notion Business", invoiceNo: "INV-2026-0045", amount: 22000, currency: "INR", status: "pending", confidence: 71, category: "SaaS", fileUrl: null, createdAt: "2026-04-03T10:00:00Z" },
  { id: "inv-006", userId: "demo", vendor: "Razorpay", invoiceNo: "INV-2026-0046", amount: 98000, currency: "INR", status: "rejected", confidence: 33, category: "Payments", fileUrl: null, createdAt: "2026-04-02T15:00:00Z" },
  { id: "inv-007", userId: "demo", vendor: "Figma Professional", invoiceNo: "INV-2026-0047", amount: 28000, currency: "INR", status: "approved", confidence: 97, category: "Design", fileUrl: null, createdAt: "2026-04-02T11:00:00Z" },
  { id: "inv-008", userId: "demo", vendor: "Zoho CRM", invoiceNo: "INV-2026-0048", amount: 15500, currency: "INR", status: "pending", confidence: 65, category: "CRM", fileUrl: null, createdAt: "2026-04-01T09:00:00Z" },
  { id: "inv-009", userId: "demo", vendor: "Google Workspace", invoiceNo: "INV-2026-0049", amount: 42000, currency: "INR", status: "approved", confidence: 99, category: "Productivity", fileUrl: null, createdAt: "2026-04-01T08:00:00Z" },
  { id: "inv-010", userId: "demo", vendor: "Datadog", invoiceNo: "INV-2026-0050", amount: 78000, currency: "INR", status: "flagged", confidence: 55, category: "Monitoring", fileUrl: null, createdAt: "2026-03-31T14:00:00Z" },
  { id: "inv-011", userId: "demo", vendor: "TechnoVendor Inc.", invoiceNo: "INV-2026-0051", amount: 147600, currency: "INR", status: "flagged", confidence: 41, category: "Infrastructure", fileUrl: null, createdAt: "2026-03-30T11:00:00Z" },
  { id: "inv-012", userId: "demo", vendor: "SupplyPro Ltd.", invoiceNo: "INV-2026-0052", amount: 86200, currency: "INR", status: "pending", confidence: 58, category: "Supplies", fileUrl: null, createdAt: "2026-03-29T10:00:00Z" },
];

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");

  const db = getDb();
  if (!db) return NextResponse.json({ invoices: [] });
  try {
    // Filter invoices by userId
    const data = userId
      ? await db.select().from(invoices).where(eq(invoices.userId, userId)).orderBy(desc(invoices.createdAt))
      : [];

    // Filter OCR extractions by userId
    const ocrData = userId
      ? await db.select().from(extractedDocuments).where(eq(extractedDocuments.userId, userId)).orderBy(desc(extractedDocuments.createdAt))
      : [];

    const mappedOcrData = ocrData.map(doc => ({
      id: doc.id,
      userId: doc.userId,
      vendor: doc.vendor,
      invoiceNo: String(doc.invoiceId).substring(0, 8).toUpperCase(),
      amount: doc.amount,
      currency: "USD",
      status: doc.status,
      decision: doc.decision,
      confidence: doc.confidence,
      category: "OCR Extracted",
      fileUrl: doc.fileUrl,
      createdAt: doc.createdAt
    }));

    return NextResponse.json({ invoices: [...mappedOcrData, ...data] });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ invoices: [] });
  }
}

export async function POST(req: Request) {
  const body = await req.json();
  const db = getDb();
  if (!db) {
    return NextResponse.json({ error: "No DB connection" }, { status: 500 });
  }
  try {
    const [created] = await db.insert(invoices).values(body).returning();
    return NextResponse.json({ invoice: created }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: "Failed to create invoice" }, { status: 500 });
  }
}
