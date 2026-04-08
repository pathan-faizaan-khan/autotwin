import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { integrations, extractedDocuments } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { google } from "googleapis";
import { analyzeIsInvoice } from "@/lib/agents/emailAnalyzer";
import axios from "axios";

// ─── Module-level state ───────────────────────────────────────────────────────
// In-memory lock: prevents two concurrent requests (within the same server
// process) from double-processing the same message simultaneously.
const processingIds = new Set<string>();

export async function POST(req: Request) {
  try {
    // ── Security: verify shared secret ───────────────────────────────────────
    // Configure the Pub/Sub push URL as:
    //   https://your-domain.vercel.app/api/webhooks/gmail?token=<WEBHOOK_SECRET>
    // Requests without the correct token are rejected immediately.
    const { searchParams } = new URL(req.url);
    const webhookSecret = process.env.WEBHOOK_SECRET;
    if (webhookSecret && searchParams.get("token") !== webhookSecret) {
      console.warn("[Webhook] ❌ Unauthorized — invalid or missing token");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    // ─────────────────────────────────────────────────────────────────────────

    // 1. Parse Pub/Sub push notification
    const body = await req.json();
    const message = body?.message;
    if (!message?.data) {
      return NextResponse.json({ ok: true });
    }

    const decodedData = Buffer.from(message.data, "base64").toString("utf8");
    const { emailAddress } = JSON.parse(decodedData);
    console.log(`[Webhook] Triggered for: ${emailAddress}`);

    // 2. Look up the active Gmail integration token
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
      console.error("[Webhook] No enabled Gmail integration. User must reconnect.");
      return NextResponse.json({ ok: true });
    }

    let tokenData: { accessToken?: string; refreshToken?: string; expiryDate?: number };
    try { tokenData = JSON.parse(target.accessToken); }
    catch { tokenData = { accessToken: target.accessToken }; }

    if (!tokenData.refreshToken?.startsWith("1//")) {
      console.error("[Webhook] Stale token — user must Disconnect and Reconnect Gmail.");
      return NextResponse.json({ ok: true });
    }

    // 3. Build Gmail client (refresh_token handles expiry automatically)
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

    // 4. Get latest unread inbox message with an attachment
    // ─── Why this stops the "infinite loop" ──────────────────────────────────
    // When we process an email we mark it as READ immediately (step 6 below).
    // Subsequent Pub/Sub notifications (triggered by that label change) will
    // hit this query and find ZERO results → fast return, nothing processed.
    // Combined with:
    //   • In-memory lock  → prevents concurrent same-process double-processing
    //   • DB gmailMessageId dedup → prevents re-processing after server restart
    // ─────────────────────────────────────────────────────────────────────────
    console.log("[Webhook] Checking for unread messages with attachments...");
    const listRes = await gmail.users.messages.list({
      userId: "me",
      maxResults: 1,   // fetch up to 5 so stuck old emails don't block new ones
      q: "is:unread has:attachment in:inbox",
    });

    const messages = listRes.data.messages || [];
    if (messages.length === 0) {
      console.log("[Webhook] No unread messages with attachments. Done.");
      return NextResponse.json({ ok: true, processed: 0 });
    }

    let processedCount = 0;

    for (const msgRef of messages) {
      if (!msgRef.id) continue;

      // Guard A — In-memory lock (concurrent requests, same process)
      if (processingIds.has(msgRef.id)) {
        console.log(`[Webhook] Skipped — already in flight: ${msgRef.id}`);
        continue;
      }
      processingIds.add(msgRef.id);

      try {
        // Guard B — DB dedup (survives server restarts & hot reloads)
        // Requires the gmail_message_id column: run scripts/migrate-gmail-dedup.mjs
        let alreadySaved: { id: string }[] = [];
        try {
          alreadySaved = await db
            .select({ id: extractedDocuments.id })
            .from(extractedDocuments)
            .where(eq(extractedDocuments.gmailMessageId, msgRef.id))
            .limit(1);
        } catch {
          console.warn("[Webhook] ⚠️ gmailMessageId column missing — run scripts/migrate-gmail-dedup.mjs");
        }
        if (alreadySaved.length > 0) {
          console.log(`[Webhook] Skipped — already in DB: ${msgRef.id}. Marking as read to unblock queue...`);
          // Force read so this stuck email stops appearing in is:unread queries
          // and blocking new invoice emails from being processed.
          await gmail.users.messages.modify({
            userId: "me",
            id: msgRef.id,
            requestBody: { removeLabelIds: ["UNREAD"] }
          }).catch(e => console.warn("[Webhook] Could not mark old email as read:", e.message));
          continue;
        }

        // 5. Fetch full message details
        const msgDetails = await gmail.users.messages.get({ userId: "me", id: msgRef.id });
        const msgPayload = msgDetails.data.payload;
        const subject = msgPayload?.headers?.find(h => h.name?.toLowerCase() === "subject")?.value || "No Subject";
        const snippet = msgDetails.data.snippet || "";
        const parts = msgPayload?.parts || [];
        const filenames = parts.filter(p => !!p.filename && p.filename.length > 0).map(p => p.filename!);

        // 6. Mark as READ immediately — this is what stops the loop.
        // Once marked read, all future is:unread queries miss this email.
        // If we crash after this line, the email is saved from re-processing
        // by the DB dedup check above (Guard B).
        await gmail.users.messages.modify({
          userId: "me",
          id: msgRef.id,
          requestBody: { removeLabelIds: ["UNREAD"] }
        }).catch(() => {});

        console.log(`[Webhook] Checking: "${subject}" | Files: ${filenames.join(", ") || "none"}`);

        // 7. LLM classification — is this an invoice email?
        const isInvoice = await analyzeIsInvoice(subject, snippet, filenames);
        if (!isInvoice) {
          console.log(`[Webhook] Skipped — not an invoice: "${subject}"`);
          continue;
        }
        console.log(`[Webhook] ✅ Invoice detected: "${subject}"`);

        // 8. Download each supported attachment and send to FastAPI
        for (const part of parts) {
          const filename = part.filename?.toLowerCase() ?? "";
          const isSupportedType = filename.endsWith(".pdf") || filename.endsWith(".png") || filename.endsWith(".jpg") || filename.endsWith(".jpeg");
          if (!part.body?.attachmentId || !isSupportedType) continue;

          const attachment = await gmail.users.messages.attachments.get({
            userId: "me",
            messageId: msgRef.id,
            id: part.body.attachmentId,
          });
          if (!attachment.data.data) continue;

          console.log(`[Webhook] 📎 Downloading "${part.filename}" → FastAPI...`);

          const buffer = Buffer.from(attachment.data.data, "base64");
          const ext = part.filename!.toLowerCase().split(".").pop() ?? "pdf";
          const mimeTypes: Record<string, string> = { pdf: "application/pdf", png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg" };
          const mimeType = mimeTypes[ext] ?? "application/pdf";

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

            // 9. Save to DB with gmailMessageId so Guard B catches future retries
            const [savedDoc] = await db.insert(extractedDocuments).values({
              userId: target.userId,
              gmailMessageId: msgRef.id,        // ← persistent dedup key
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

            console.log(`[Webhook] ✅ Saved "${part.filename}" — DB ID: ${savedDoc?.id}`);
            processedCount++;

            // 10. Trigger analysis engine (non-fatal if unavailable)
            if (savedDoc?.id) {
              try {
                const analysisRes = await axios.post(
                  `${fastApiUrl}/api/process-invoice-analysis`,
                  { document_id: savedDoc.id },
                  { timeout: 30000 }
                );
                console.log(`[Webhook] ✅ Analysis complete for ${savedDoc.id}:`, analysisRes.data?.decision);
              } catch (analysisErr: any) {
                console.warn(`[Webhook] ⚠️ Analysis engine (non-fatal):`, analysisErr.response?.data || analysisErr.message);
              }
            }
          } catch (axErr: any) {
            console.error(`[Webhook] ❌ FastAPI error for "${part.filename}":`, axErr.response?.data || axErr.message);
          }
        }
      } finally {
        processingIds.delete(msgRef.id);
      }
    }

    console.log(`[Webhook] Done. Processed ${processedCount} invoice(s).`);
    return NextResponse.json({ ok: true, processed: processedCount });

  } catch (err: any) {
    console.error("[Webhook Error]:", err.message || err);
    return NextResponse.json({ ok: false, error: err.message });
  }
}
