import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { extractedDocuments } from "@/lib/schema";
import axios, { AxiosError } from "axios";
export async function POST(req: Request) {
  try {
   
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const userId = formData.get("userId") as string | null;
    const fileUrl = formData.get("fileUrl") as string | null;
    if (!userId || !file) {
      console.error("[Next.js] Missing requirements:", { hasUserId: !!userId, hasFile: !!file });
      return NextResponse.json({ error: "Missing userId or file in request" }, { status: 400 });
    }
    const fastApiForm = new FormData();
    fastApiForm.append("file", file);
    
    const fastApiUrl = process.env.NEXT_PUBLIC_FASTAPI_URL || "http://localhost:8000";
    let response;
    try {
      response = await axios.post(`${fastApiUrl}/api/process-invoice`, fastApiForm, {
        timeout: 200000, // 20 second hard timeout
      });
    } catch (axError: any) {
      // 4. AXIOS ERROR HANDLING
      if (axError.code === "ECONNABORTED") {
        console.error("[Next.js] FastAPI Timeout Error (504)");
        return NextResponse.json({ error: "Upstream pipeline service timed out" }, { status: 504 });
      }
      
      const status = axError.response?.status || 500;
      const detail = axError.response?.data?.detail || axError.message;
      return NextResponse.json({ error: "Processing service failed", detail }, { status });
    }
    // ---------------------------------------------------------
    // 5. VALIDATE RESPONSE PIPELINE
    // ---------------------------------------------------------
    const pipelineData = response.data;

    console.log(pipelineData)
    
    if (!pipelineData || !pipelineData.invoice_id || !pipelineData.logs) {
      console.error("[Next.js] Invalid FastAPI payload:", pipelineData);
      return NextResponse.json({ error: "Invalid response from AI Pipeline" }, { status: 502 });
    }
    // ---------------------------------------------------------
    // 6. SAFE DATABASE INSERT
    // ---------------------------------------------------------
    const drizzleDb = getDb();
    if (!drizzleDb) {
      throw new Error("Database instance not available");
    }
    // Wrap in try/catch to log schema/insertion mismatches safely
    try {
      const [inserted] = await drizzleDb.insert(extractedDocuments).values({
        userId: userId, // Safe types
        invoiceId: pipelineData.invoice_id,
        vendor: pipelineData.vendor,
        amount: pipelineData.amount,
        date: pipelineData.date,
        anomaly: pipelineData.anomaly,
        confidence: pipelineData.confidence, // DO NOT MODIFY (e.g. no * 100)
        status: pipelineData.status,
        decision: pipelineData.decision,
        explanation: pipelineData.explanation,
        anomalyDetails: pipelineData.anomaly_details, // Maps smoothly to jsonb
        confidenceBreakdown: pipelineData.confidence_breakdown, // Maps smoothly to jsonb
        logs: pipelineData.logs, // Maps smoothly to jsonb
        riskScore: pipelineData.risk_score,
        processingTimeMs: pipelineData.processing_time_ms,
        fileUrl: fileUrl || pipelineData.file_url 
      }).returning();

      // 🔔 Trigger analysis engine (confidence scoring + WhatsApp notification) — non-fatal
      if (inserted?.id) {
        axios.post(
          `${fastApiUrl}/process-invoice-analysis`,
          { document_id: inserted.id },
          { timeout: 30000 }
        ).then(r => console.log("[ProcessInvoice] Analysis triggered:", r.data?.decision))
         .catch(e => console.warn("[ProcessInvoice] Analysis engine (non-fatal):", e.response?.data || e.message));
      }

      return NextResponse.json({ success: true, data: inserted });
    } catch (dbError: any) {
      console.error("[Next.js] Supabase Insertion Error:", dbError.message);
      return NextResponse.json({ error: "Database mapping error after processing" }, { status: 500 });
    }
  } catch (globalError: any) {
    // Ensure all blindspots and unhandled rejections hit a strict 500
    console.error("[Next.js] Unhandled API Route Exception:", globalError.message || globalError);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}