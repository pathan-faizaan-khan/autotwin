import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { invoices, transactions } from "@/lib/schema";

export async function GET() {
  const db = getDb();
  if (!db) {
    return NextResponse.json({
      monthly: [],
      categories: [],
      vendors: [],
      anomalies: [],
      summary: { totalSpend: 0, avgInvoice: 0, anomaliesDetected: 0, budgetRemaining: 0, budgetUsed: 0 },
    });
  }

  try {
    const { extractedDocuments } = await import("@/lib/schema");
    const docs = await db.select().from(extractedDocuments);

    let totalSpend = 0;
    let anomaliesDetected = 0;

    docs.forEach(d => {
      totalSpend += d.amount;
      if (d.anomaly) anomaliesDetected++;
    });

    const avgInvoice = docs.length > 0 ? (totalSpend / docs.length) : 0;
    const budgetUsed = Math.min((totalSpend / 700000) * 100, 100);

    return NextResponse.json({
      monthly: [],
      categories: [],
      vendors: [],
      anomalies: docs.filter(d => d.anomaly).map(d => ({ vendor: d.vendor, amount: d.amount })),
      summary: { totalSpend, avgInvoice, anomaliesDetected, budgetRemaining: Math.max(700000 - totalSpend, 0), budgetUsed },
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 });
  }
}
