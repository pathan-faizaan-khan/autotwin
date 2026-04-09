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
    // 1. Parse Pub/Sub push notification
    const body = await req.json();
    const message = body?.message;
    if (!message?.data) return NextResponse.json({ ok: true });

    const decodedData = Buffer.from(message.data, "base64").toString("utf8");
    const { emailAddress } = JSON.parse(decodedData);
    console.log(`[Webhook] Triggered for: ${emailAddress}`);

    // 2. Get validated token from DB
    const db = getDb();
    if (!db) return NextResponse.json({ ok: true });

    const allGmail = await db.select().from(integrations).where(eq(integrations.provider, "gmail"));
    const target = allGmail.find(i => {
      if (!i.accessToken || !i.enabled) return false;
      try { return JSON.parse(i.accessToken).refreshToken?.startsWith("1//"); }
      catch { return false; }
    }) ?? allGmail.find(i => i.accessToken && i.enabled);

    if (!target?.accessToken) {
      console.error("[Webhook] No enabled Gmail integration in DB.");
      return NextResponse.json({ ok: true });
    }

    let tokenData: { accessToken?: string; refreshToken?: string; expiryDate?: number };
    try { tokenData = JSON.parse(target.accessToken); }
    catch { tokenData = { accessToken: target.accessToken }; }

    // 3. Build Gmail client
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

    // 4. Fetch ONLY the latest 1 UNREAD message with attachment
    // Using maxResults: 1 ensures we do "one transaction at a time"
    console.log("[Webhook] Fetching latest unread message...");
    const listRes = await gmail.users.messages.list({
      userId: "me",
      maxResults: 1,
      q: "is:unread has:attachment in:inbox",
    });

    const messages = listRes.data.messages || [];
    if (messages.length === 0) {
      console.log("[Webhook] No unread messages. Done.");
      return NextResponse.json({ ok: true, processed: 0 });
    }

    let processedCount = 0;

    for (const msgRef of messages) {
      if (!msgRef.id) continue;

      // In-memory lock for concurrent requests in same instance
      if (processingIds.has(msgRef.id)) {
        console.log(`[Webhook] Skipped — already processing: ${msgRef.id}`);
        continue;
      }
      processingIds.add(msgRef.id);

      try {
        // 5. Fetch full details + double-check UNREAD status
        // This prevents race conditions where two webhooks pick up the same email.
        const msgDetails = await gmail.users.messages.get({ userId: "me", id: msgRef.id });
        const labels = msgDetails.data.labelIds || [];
        if (!labels.includes("UNREAD")) {
          console.log(`[Webhook] Skipped — message ${msgRef.id} was already marked as read.`);
          continue;
        }

        const msgPayload = msgDetails.data.payload;
        const subject = msgPayload?.headers?.find(h => h.name?.toLowerCase() === "subject")?.value || "No Subject";
        const snippet = msgDetails.data.snippet || "";
        const parts = msgPayload?.parts || [];
        const filenames = parts.filter(p => !!p.filename && p.filename.length > 0).map(p => p.filename!);

        // 6. LLM classification
        const isInvoice = await analyzeIsInvoice(subject, snippet, filenames);
        if (!isInvoice) {
          console.log(`[Webhook] Skipped — not an invoice: "${subject}"`);
          // Even if not an invoice, we mark as read so we don't keep asking the LLM about it
          await gmail.users.messages.modify({
            userId: "me", id: msgRef.id, requestBody: { removeLabelIds: ["UNREAD"] }
          }).catch(() => {});
          continue;
        }

        console.log(`[Webhook] ✅ Invoice detected: "${subject}"`);

        // 7. Process attachments
        for (const part of parts) {
          const filename = part.filename?.toLowerCase() ?? "";
          const supported = filename.endsWith(".pdf") || filename.endsWith(".png") || filename.endsWith(".jpg") || filename.endsWith(".jpeg");
          if (!part.body?.attachmentId || !supported) continue;

          const attachment = await gmail.users.messages.attachments.get({
            userId: "me", messageId: msgRef.id, id: part.body.attachmentId,
          });
          if (!attachment.data.data) continue;

          console.log(`[Webhook] 📎 Processing "${part.filename}"...`);
          const buffer = Buffer.from(attachment.data.data, "base64");
          const ext = part.filename!.toLowerCase().split(".").pop() ?? "pdf";
          const mimeTypes: Record<string, string> = { pdf: "application/pdf", png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg" };

          const fastApiForm = new FormData();
          fastApiForm.append("file", new File([buffer], part.filename!, { type: mimeTypes[ext] ?? "application/pdf" }));

          const fastApiUrl = process.env.NEXT_PUBLIC_FASTAPI_URL || "http://localhost:8000";
          try {
            const response = await axios.post(`${fastApiUrl}/api/process-invoice`, fastApiForm, { timeout: 200000 });
            const d = response.data;

            if (d?.invoice_id) {
              // 8. Save to DB
              const [savedDoc] = await db.insert(extractedDocuments).values({
                userId: target.userId,
                invoiceId: d.invoice_id,
                vendor: d.vendor,
                amount: d.amount,
                date: d.date,
                anomaly: d.anomaly,
                confidence: d.confidence,
                status: d.status,
                decision: d.decision,
                explanation: d.explanation,
                anomalyDetails: d.anomaly_details,
                confidenceBreakdown: d.confidence_breakdown,
                logs: d.logs,
                riskScore: d.risk_score,
                processingTimeMs: d.processing_time_ms,
                fileUrl: d.file_url,
              }).returning({ id: extractedDocuments.id });

              if (savedDoc) {
                // 9. MARK AS READ ONLY ON SUCCESS
                await gmail.users.messages.modify({
                  userId: "me",
                  id: msgRef.id,
                  requestBody: { removeLabelIds: ["UNREAD"] }
                }).catch(e => console.error("[Webhook] Final mark-as-read failed:", e.message));

                console.log(`[Webhook] ✅ Successfully processed and marked as read: ${msgRef.id}`);
                processedCount++;

                // Trigger analysis engine (non-blocking)
                axios.post(`${fastApiUrl}/api/process-invoice-analysis`, { document_id: savedDoc.id }, { timeout: 30000 }).catch(() => {});
              }
            }
          } catch (axErr: any) {
            console.error(`[Webhook] ❌ FastAPI error:`, axErr.response?.data || axErr.message);
          }
        }
      } finally {
        processingIds.delete(msgRef.id);
      }
    }

    return NextResponse.json({ ok: true, processed: processedCount });
  } catch (err: any) {
    console.error("[Webhook Error]:", err.message || err);
    return NextResponse.json({ ok: false, error: err.message });
  }
}