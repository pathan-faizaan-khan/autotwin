import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { integrations, extractedDocuments } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { google } from "googleapis";
import { analyzeIsInvoice } from "@/lib/agents/emailAnalyzer";
import axios from "axios";

// In-memory lock: prevents two simultaneous Pub/Sub notifications
// from processing the same email at the exact same millisecond
const processingIds = new Set<string>();


export async function POST(req: Request) {
  try {
    // 1. Parse Pub/Sub push notification — just need to know it fired
    const body = await req.json();
    const message = body?.message;
    if (!message?.data) {
      return NextResponse.json({ ok: true });
    }

    const decodedData = Buffer.from(message.data, "base64").toString("utf8");
    const { emailAddress } = JSON.parse(decodedData);

    console.log(`[Webhook] Triggered for: ${emailAddress}`);

    // 2. Get validated token from DB (prefer real OAuth token starting with 1//)
    const db = getDb();
    if (!db) return NextResponse.json({ ok: true });

    const allGmail = await db.select().from(integrations).where(eq(integrations.provider, "gmail"));

    const target = allGmail.find(i => {
      if (!i.accessToken || !i.enabled) return false;
      try {
        const p = JSON.parse(i.accessToken);
        return p.refreshToken?.startsWith("1//");
      } catch { return false; }
    }) ?? allGmail.find(i => i.accessToken && i.enabled);

    if (!target?.accessToken) {
      console.error("[Webhook] No enabled Gmail integration in DB. User must reconnect from Settings.");
      return NextResponse.json({ ok: true });
    }

    let tokenData: { accessToken?: string; refreshToken?: string; expiryDate?: number };
    try { tokenData = JSON.parse(target.accessToken); }
    catch { tokenData = { accessToken: target.accessToken }; }

    if (!tokenData.refreshToken?.startsWith("1//")) {
      console.error("[Webhook] Stale Firebase token detected. User must Disconnect and Reconnect Gmail.");
      return NextResponse.json({ ok: true });
    }

    // 3. Build Gmail client — refresh_token handles expiry automatically
    const oAuth2Client = new google.auth.OAuth2(
      process.env.GMAIL_CLIENT_ID,
      process.env.GMAIL_CLIENT_SECRET
    );
    oAuth2Client.setCredentials({
      access_token: tokenData.accessToken,
      refresh_token: tokenData.refreshToken,
      expiry_date: tokenData.expiryDate,
    });

    const gmail = google.gmail({ version: "v1", auth: oAuth2Client });

    // 4. Fetch ONLY the latest 1 UNREAD inbox message with an attachment
    // "is:unread" ensures we never reprocess the same email twice
    // After processing we mark it as read, so repeat Pub/Sub notifications are ignored
    console.log("[Webhook] Fetching latest unread message with attachment...");
    const listRes = await gmail.users.messages.list({
      userId: "me",
      maxResults: 1,
      q: "is:unread has:attachment in:inbox",
    });

    const messages = listRes.data.messages || [];
    if (messages.length === 0) {
      console.log("[Webhook] Inbox is empty. Done.");
      return NextResponse.json({ ok: true, processed: 0 });
    }

    let processedCount = 0;

    for (const msgRef of messages) {
      if (!msgRef.id) continue;

      // In-memory lock: if another request is already handling this message, skip it
      if (processingIds.has(msgRef.id)) {
        console.log(`[Webhook] Skipped — already processing message ${msgRef.id}`);
        continue;
      }
      processingIds.add(msgRef.id);

      try {
      // 5. Fetch full message
      const msgDetails = await gmail.users.messages.get({ userId: "me", id: msgRef.id });
      const msgPayload = msgDetails.data.payload;

      const subject = msgPayload?.headers?.find(h => h.name?.toLowerCase() === "subject")?.value || "No Subject";
      const snippet = msgDetails.data.snippet || "";
      const parts = msgPayload?.parts || [];
      const filenames = parts.filter(p => !!p.filename && p.filename.length > 0).map(p => p.filename!);

      // Mark as read IMMEDIATELY to prevent the duplicate race condition where
      // 2 simultaneous Pub/Sub notifications both fetch and process the same email.
      await gmail.users.messages.modify({
        userId: "me",
        id: msgRef.id,
        requestBody: { removeLabelIds: ["UNREAD"] }
      }).catch(() => {});

      console.log(`[Webhook] Checking: "${subject}" | Files: ${filenames.join(", ") || "none"}`);

      // 6. LLM classification
      const isInvoice = await analyzeIsInvoice(subject, snippet, filenames);
      if (!isInvoice) {
        console.log(`[Webhook] Skipped — not an invoice: "${subject}"`);
        continue;
      }

      console.log(`[Webhook] ✅ Invoice detected: "${subject}"`);

      // 7. Download and pipeline each supported attachment
      for (const part of parts) {
        const filename = part.filename?.toLowerCase() ?? "";
        if (!part.body?.attachmentId || (!filename.endsWith(".pdf") && !filename.endsWith(".png") && !filename.endsWith(".jpg") && !filename.endsWith(".jpeg"))) continue;

        const attachment = await gmail.users.messages.attachments.get({
          userId: "me",
          messageId: msgRef.id,
          id: part.body.attachmentId,
        });
        if (!attachment.data.data) continue;

        console.log(`[Webhook] 📎 Downloading "${part.filename}" and sending direct to FastAPI...`);

        const buffer = Buffer.from(attachment.data.data, "base64");
        const ext = part.filename!.toLowerCase().split(".").pop() ?? "pdf";
        const mimeTypes: Record<string, string> = { pdf: "application/pdf", png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg" };
        const mimeType = mimeTypes[ext] ?? "application/pdf";

        // Build FormData exactly as the upload page does — using global File/FormData (Node 18+)
        const fastApiForm = new FormData();
        fastApiForm.append("file", new File([buffer], part.filename!, { type: mimeType }));

        const fastApiUrl = process.env.NEXT_PUBLIC_FASTAPI_URL || "http://localhost:8000";
        try {
          const response = await axios.post(`${fastApiUrl}/api/process-invoice`, fastApiForm, { timeout: 200000 });
          const pipelineData = response.data;

          if (!pipelineData?.invoice_id || !pipelineData?.logs) {
            console.error("[Webhook] Invalid FastAPI response:", pipelineData);
            continue;
          }

          // Save to DB — identical to process-invoice route
          const [savedDoc] = await db.insert(extractedDocuments).values({
            userId: target.userId,
            invoiceId: pipelineData.invoice_id,
            vendor: pipelineData.vendor,
            amount: pipelineData.amount,
            date: pipelineData.date,
            anomaly: pipelineData.anomaly,
            confidence: pipelineData.confidence,
            status: pipelineData.status,
            decision: pipelineData.decision,
            explanation: pipelineData.explanation,
            anomalyDetails: pipelineData.anomaly_details,
            confidenceBreakdown: pipelineData.confidence_breakdown,
            logs: pipelineData.logs,
            riskScore: pipelineData.risk_score,
            processingTimeMs: pipelineData.processing_time_ms,
            fileUrl: pipelineData.file_url,
          }).returning({ id: extractedDocuments.id });

          console.log(`[Webhook] ✅ Invoice saved to DB from "${part.filename}" — ID: ${savedDoc?.id}`);
          processedCount++;

          // 🔔 Trigger analysis engine: confidence scoring + WhatsApp notification
          if (savedDoc?.id) {
            try {
              const analysisRes = await axios.post(
                `${fastApiUrl}/process-invoice-analysis`,
                { document_id: savedDoc.id },
                { timeout: 30000 }
              );
              console.log(`[Webhook] ✅ Analysis complete for ${savedDoc.id}:`, analysisRes.data?.decision);
            } catch (analysisErr: any) {
              // Non-fatal — invoice is already saved, analysis failure should not fail the webhook
              console.warn(`[Webhook] ⚠️ Analysis engine error (non-fatal):`, analysisErr.response?.data || analysisErr.message);
            }
          }
        } catch (axErr: any) {
          console.error(`[Webhook] ❌ FastAPI error for "${part.filename}":`, axErr.response?.data || axErr.message);
        }
      }
      } finally {
        // Always release the lock
        processingIds.delete(msgRef.id);
      }
    }

    console.log(`[Webhook] Done. Processed ${processedCount} invoices.`);
    return NextResponse.json({ ok: true, processed: processedCount });

  } catch (err: any) {
    console.error("[Webhook Error]:", err.message || err);
    return NextResponse.json({ ok: false, error: err.message });
  }
}
