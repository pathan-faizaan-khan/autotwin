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
      vendors: [],
      decisions: [],
      confidenceHistogram: [],
      riskStats: { avg: 0, highRiskCount: 0 },
      processingStats: { avgMs: 0, totalDocs: 0 },
      recentDocs: [],
      summary: {
        totalSpend: 0,
        avgInvoice: 0,
        anomaliesDetected: 0,
        budgetRemaining: 0,
        budgetUsed: 0,
        avgConfidence: 0,
        autoApproved: 0,
        warnCount: 0,
        humanReviewCount: 0,
        avgRiskScore: 0,
        avgProcessingMs: 0,
        totalDocs: 0,
      },
    });
  }

  try {
    const docs = userId
      ? await db
          .select()
          .from(extractedDocuments)
          .where(eq(extractedDocuments.userId, userId))
      : [];

    // ── Core Aggregates ──────────────────────────────────────────────────────
    let totalSpend = 0;
    let anomaliesDetected = 0;
    let totalConfidence = 0;
    let totalRisk = 0;
    let totalProcessingMs = 0;
    let autoApproved = 0;
    let warnCount = 0;
    let humanReviewCount = 0;
    let flaggedCount = 0;

    // Aggregation maps
    const monthlyMap = new Map<string, { actual: number; count: number }>();
    const vendorMap = new Map<string, { spend: number; count: number; avgConfidence: number; totalConf: number }>();
    const categoryMap = new Map<string, { spend: number; count: number }>();
    const confidenceBuckets = { critical: 0, low: 0, medium: 0, high: 0 };
    const riskBuckets = { low: 0, medium: 0, high: 0 };

    docs.forEach((d) => {
      totalSpend += d.amount;
      totalConfidence += d.confidence;
      totalRisk += d.riskScore;
      totalProcessingMs += d.processingTimeMs ?? 0;

      if (d.anomaly) anomaliesDetected++;

      // Decision counts
      const dec = d.decision?.toLowerCase() ?? "";
      if (dec === "auto" || dec === "auto_approve" || dec === "approve") autoApproved++;
      else if (dec === "warn") warnCount++;
      else if (dec === "human_review" || dec === "review") humanReviewCount++;
      else if (dec === "reject" || dec === "flag") flaggedCount++;

      // Monthly aggregates
      const dateTarget = d.createdAt ? new Date(d.createdAt) : new Date();
      const monthStr = dateTarget.toLocaleString("default", { month: "short", year: "2-digit" });
      const existing = monthlyMap.get(monthStr) ?? { actual: 0, count: 0 };
      monthlyMap.set(monthStr, { actual: existing.actual + d.amount, count: existing.count + 1 });

      // Vendor aggregates
      const vendor = d.vendor ?? "Unknown";
      const v = vendorMap.get(vendor) ?? { spend: 0, count: 0, avgConfidence: 0, totalConf: 0 };
      vendorMap.set(vendor, {
        spend: v.spend + d.amount,
        count: v.count + 1,
        totalConf: v.totalConf + d.confidence,
        avgConfidence: 0, // calculated after
      });

      // Category aggregates
      const category = d.category || "General";
      const cat = categoryMap.get(category) ?? { spend: 0, count: 0 };
      categoryMap.set(category, {
        spend: cat.spend + d.amount,
        count: cat.count + 1,
      });

      // Confidence histogram buckets
      const confPct = d.confidence <= 1 ? d.confidence * 100 : d.confidence;
      if (confPct < 50) confidenceBuckets.critical++;
      else if (confPct < 70) confidenceBuckets.low++;
      else if (confPct < 90) confidenceBuckets.medium++;
      else confidenceBuckets.high++;

      // Risk buckets
      if (d.riskScore < 0.3) riskBuckets.low++;
      else if (d.riskScore < 0.6) riskBuckets.medium++;
      else riskBuckets.high++;
    });

    const totalDocs = docs.length;
    const avgConfidence = totalDocs > 0 ? totalConfidence / totalDocs : 0;
    const avgRiskScore = totalDocs > 0 ? totalRisk / totalDocs : 0;
    const avgProcessingMs = totalDocs > 0 ? totalProcessingMs / totalDocs : 0;
    const avgInvoice = totalDocs > 0 ? Math.round(totalSpend / totalDocs) : 0;
    const budgetUsed = Math.min((totalSpend / 700000) * 100, 100);

    // ── Format Monthly ───────────────────────────────────────────────────────
    const monthly = Array.from(monthlyMap.entries())
      .map(([month, v]) => ({
        month,
        actual: Math.round(v.actual),
        forecast: Math.round(v.actual * 1.12),
        count: v.count,
      }))
      .sort((a, b) => {
        // Sort by parsing the month string
        const pa = new Date(`1 ${a.month}`).getTime();
        const pb = new Date(`1 ${b.month}`).getTime();
        return pa - pb;
      });

    if (monthly.length === 1) {
      monthly.push({ month: "Next Mo.", actual: 0, forecast: Math.round(monthly[0].actual * 1.05), count: 0 });
    }

    // ── Format Vendors ───────────────────────────────────────────────────────
    const vendors = Array.from(vendorMap.entries())
      .map(([name, v]) => ({
        name,
        spend: Math.round(v.spend),
        count: v.count,
        avgConfidence: Math.round(v.count > 0 ? (v.totalConf / v.count) * (v.totalConf / v.count <= 1 ? 100 : 1) : 0),
      }))
      .sort((a, b) => b.spend - a.spend)
      .slice(0, 10);

    // ── Format Categories ────────────────────────────────────────────────────
    const categories = Array.from(categoryMap.entries())
      .map(([name, v]) => ({
        name,
        spend: Math.round(v.spend),
        count: v.count,
      }))
      .sort((a, b) => b.spend - a.spend);

    // ── Decision Distribution ────────────────────────────────────────────────
    const decisions = [
      { name: "Auto Approved", value: autoApproved, color: "#10b981" },
      { name: "Warning", value: warnCount, color: "#f59e0b" },
      { name: "Human Review", value: humanReviewCount, color: "#6366f1" },
      { name: "Flagged", value: flaggedCount, color: "#ef4444" },
    ].filter((d) => d.value > 0);

    // ── Confidence Histogram ─────────────────────────────────────────────────
    const confidenceHistogram = [
      { range: "Critical (<50%)", count: confidenceBuckets.critical, color: "#ef4444" },
      { range: "Low (50–70%)", count: confidenceBuckets.low, color: "#f59e0b" },
      { range: "Medium (70–90%)", count: confidenceBuckets.medium, color: "#6366f1" },
      { range: "High (>90%)", count: confidenceBuckets.high, color: "#10b981" },
    ];

    // ── Risk Distribution ─────────────────────────────────────────────────────
    const riskDistribution = [
      { range: "Low Risk (<0.3)", count: riskBuckets.low, color: "#10b981" },
      { range: "Medium (0.3–0.6)", count: riskBuckets.medium, color: "#f59e0b" },
      { range: "High Risk (>0.6)", count: riskBuckets.high, color: "#ef4444" },
    ];

    // ── Scatter data (confidence vs risk) ────────────────────────────────────
    const scatterData = docs.map((d) => ({
      vendor: d.vendor,
      confidence: Math.round(d.confidence <= 1 ? d.confidence * 100 : d.confidence),
      risk: Math.round(d.riskScore * 100),
      amount: d.amount,
      decision: d.decision,
    }));

    // ── Recent Docs ──────────────────────────────────────────────────────────
    const recentDocs = docs
      .sort((a, b) => {
        const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return tb - ta;
      })
      .slice(0, 50)
      .map((d) => ({
        id: d.id,
        invoiceId: d.invoiceId,
        vendor: d.vendor,
        amount: d.amount,
        confidence: d.confidence,
        decision: d.decision,
        riskScore: d.riskScore,
        status: d.status,
        date: d.date,
        createdAt: d.createdAt,
        fileUrl: d.fileUrl,
        explanation: d.explanation,
        processingTimeMs: d.processingTimeMs,
        confidenceBreakdown: d.confidenceBreakdown,
        logs: d.logs,
        category: d.category,
        anomaly: d.anomaly,
        // Rich extraction fields
        invoiceNo: d.invoiceNo,
        dueDate: d.dueDate,
        paymentTerms: d.paymentTerms,
        subtotal: d.subtotal,
        gstRate: d.gstRate,
        gstAmount: d.gstAmount,
        lineItems: d.lineItems,
        sellerGstin: d.sellerGstin,
        buyerGstin: d.buyerGstin,
        buyerCompany: d.buyerCompany,
        notes: d.notes,
      }));

    return NextResponse.json({
      monthly,
      vendors,
      decisions,
      confidenceHistogram,
      riskDistribution,
      scatterData,
      categories,
      recentDocs,
      riskStats: {
        avg: Math.round(avgRiskScore * 100) / 100,
        highRiskCount: riskBuckets.high,
      },
      processingStats: {
        avgMs: Math.round(avgProcessingMs),
        totalDocs,
      },
      summary: {
        totalSpend: Math.round(totalSpend * 100) / 100,
        avgInvoice,
        anomaliesDetected,
        budgetRemaining: Math.max(700000 - totalSpend, 0),
        budgetUsed: Math.round(budgetUsed * 10) / 10,
        avgConfidence: Math.round(avgConfidence <= 1 ? avgConfidence * 100 : avgConfidence),
        autoApproved,
        warnCount,
        humanReviewCount,
        flaggedCount,
        avgRiskScore: Math.round(avgRiskScore * 1000) / 1000,
        avgProcessingMs: Math.round(avgProcessingMs),
        totalDocs,
      },
    });
  } catch (err) {
    console.error("[analytics] error", err);
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 });
  }
}
