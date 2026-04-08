import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { extractedDocuments } from "@/lib/schema";
import { eq } from "drizzle-orm";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");

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
    const docs = userId
      ? await db.select().from(extractedDocuments).where(eq(extractedDocuments.userId, userId))
      : [];

    let totalSpend = 0;
    let anomaliesDetected = 0;
    
    // Aggregation maps
    const monthlyMap = new Map<string, number>();
    const anomalyMap = new Map<string, number>();

    docs.forEach(d => {
      totalSpend += d.amount;
      if (d.anomaly) anomaliesDetected++;
      
      const dateTarget = d.createdAt ? new Date(d.createdAt) : new Date();
      
      // Calculate monthly aggregates
      const monthStr = dateTarget.toLocaleString('default', { month: 'short' }); 
      monthlyMap.set(monthStr, (monthlyMap.get(monthStr) || 0) + d.amount);
      
      // Calculate daily anomaly aggregates
      if (d.anomaly) {
        const dayStr = dateTarget.toISOString().split('T')[0];
        anomalyMap.set(dayStr, (anomalyMap.get(dayStr) || 0) + 1);
      }
    });

    // Formatting for charts
    const monthly = Array.from(monthlyMap.entries()).map(([month, amount]) => ({
      month,
      actual: amount,
      forecast: amount * 1.15 // +15% forecast rule
    }));
    
    // Fallback if data is too small to build a graph line
    if (monthly.length === 1) {
       monthly.push({ month: "Next Mo.", actual: 0, forecast: monthly[0].actual * 1.05 });
    }

    const anomalies = Array.from(anomalyMap.entries()).map(([date, count]) => ({
      date,
      count
    })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const avgInvoice = docs.length > 0 ? (Math.round(totalSpend / docs.length)) : 0;
    const budgetUsed = Math.min((totalSpend / 700000) * 100, 100);

    return NextResponse.json({
      monthly,
      categories: [],
      vendors: [],
      anomalies,
      summary: { totalSpend, avgInvoice, anomaliesDetected, budgetRemaining: Math.max(700000 - totalSpend, 0), budgetUsed },
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 });
  }
}
