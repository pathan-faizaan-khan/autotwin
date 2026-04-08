import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { integrations, extractedDocuments } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { google } from "googleapis";
import { analyzeIsInvoice } from "@/lib/agents/emailAnalyzer";
import axios from "axios";

// ─── Module-level state ───────────────────────────────────────────────────────
// In-memory lock: prevents two concurrent requests from double-processing the
// same message within a single server lifetime.
const processingIds = new Set<string>();

// Per-user lastHistoryId: used by the History API guard (see below).
// Lost on restart → recovers automatically on the first notification after restart.
const lastHistoryIds = new Map<string, string>();

export async function POST(req: Request) {
  try {
    // 1. Parse Pub/Sub push notification
    const body = await req.json();
    const message = body?.message;
    if (!message?.data) {
      return NextResponse.json({ ok: true });
    }

    // ── Security: verify shared secret token ─────────────────────────────────
    // In production the Pub/Sub push URL is set to:
    //   https://yourdomain.vercel.app/api/webhooks/gmail?token=<WEBHOOK_SECRET>
    // Any request without the correct token is rejected immediately.
    const { searchParams } = new URL(req.url);
    const webhookSecret = process.env.WEBHOOK_SECRET;
    if (webhookSecret && searchParams.get("token") !== webhookSecret) {
      console.warn("[Webhook] ❌ Unauthorized request — invalid or missing token");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    // ─────────────────────────────────────────────────────────────────────────

    const decodedData = Buffer.from(message.data, "base64").toString("utf8");
    const { emailAddress, historyId: newHistoryId } = JSON.parse(decodedData);

    console.log(`[Webhook] Triggered for: ${emailAddress} (historyId: ${newHistoryId})`);

    // 2. Get validated token from DB
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

    // ─── GUARD: History API filter ────────────────────────────────────────────
    // The root cause of the infinite loop: when we mark an email as "read"
    // (removing the UNREAD label), Gmail fires ANOTHER Pub/Sub notification.
    // That notification also runs this webhook, which marks as read again → loop.
    //
    // Fix: use gmail.users.history.list with historyTypes=['messageAdded'].
    // This ONLY returns events where a new message was added to the mailbox.
    // Label changes (our own mark-as-read) produce NO results → we return early.
    const storedHistoryId = lastHistoryIds.get(emailAddress);
    lastHistoryIds.set(emailAddress, newHistoryId); // always advance the cursor

    if (storedHistoryId) {
      const histRes = await gmail.users.history.list({
        userId: "me",
        startHistoryId: storedHistoryId,
        historyTypes: ["messageAdded"],
      }).catch(() => null);

      const addedMessages = histRes?.data?.history?.flatMap(h => h.messagesAdded ?? []) ?? [];

      if (addedMessages.length === 0) {
        // This notification was triggered by a label change (e.g. our mark-as-read).
        // There are no genuinely new messages — skip entirely to break the loop.
        console.log(`[Webhook] Skipped — label-change notification only (no new messages added)`);
        return NextResponse.json({ ok: true, processed: 0 });
      }

      console.log(`[Webhook] ✅ History check passed — ${addedMessages.length} new message(s) arrived`);
    } else {
      // First notification for this user since server start — no baseline historyId yet.
      // Proceed normally; the History cursor is now set for all future notifications.
      console.log(`[Webhook] First notification since server start — proceeding without history filter`);
    }
    // ─────────────────────────────────────────────────────────────────────────

    // 4. Fetch latest unread inbox message with an attachment
    console.log("[Webhook] Fetching latest unread message with attachment...");
    const listRes = await gmail.users.messages.list({
      userId: "me",
      maxResults: 1,
      q: "is:unread has:attachment in:inbox",
    });

    const messages = listRes.data.messages || [];
    if (messages.length === 0) {
      console.log("[Webhook] No unread messages with attachments found. Done.");
      return NextResponse.json({ ok: true, processed: 0 });
    }

    let processedCount = 0;

    for (const msgRef of messages) {
      if (!msgRef.id) continue;

      // Guard A — In-memory lock (same process, concurrent requests)
      if (processingIds.has(msgRef.id)) {
        console.log(`[Webhook] Skipped — already processing message ${msgRef.id}`);
        continue;
      }
      processingIds.add(msgRef.id);

      try {
        // Guard B — DB-level dedup (survives server restarts)
        // Requires gmail_message_id column: run scripts/migrate-gmail-dedup.mjs once.
        let alreadySaved: { id: string }[] = [];
        try {
          alreadySaved = await db
            .select({ id: extractedDocuments.id })
            .from(extractedDocuments)
            .where(eq(extractedDocuments.gmailMessageId, msgRef.id))
            .limit(1);
        } catch {
          // Column may not exist yet if migration hasn't been run — proceed anyway
          console.warn("[Webhook] ⚠️ gmailMessageId column missing — run scripts/migrate-gmail-dedup.mjs");
        }

        if (alreadySaved.length > 0) {
          console.log(`[Webhook] Skipped — already in DB: message ${msgRef.id}`);
          continue;
        }

        // 5. Fetch full message & mark as read immediately
        const msgDetails = await gmail.users.messages.get({ userId: "me", id: msgRef.id });
        const msgPayload = msgDetails.data.payload;

        const subject = msgPayload?.headers?.find(h => h.name?.toLowerCase() === "subject")?.value || "No Subject";
        const snippet = msgDetails.data.snippet || "";
        const parts = msgPayload?.parts || [];
        const filenames = parts.filter(p => !!p.filename && p.filename.length > 0).map(p => p.filename!);

        // Mark as read before the LLM call so even if we crash mid-way,
        // the next Pub/Sub retry won't reprocess this email.
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

        // 7. Download attachments and pipeline to FastAPI
        for (const part of parts) {
          const filename = part.filename?.toLowerCase() ?? "";
          if (!part.body?.attachmentId || (!filename.endsWith(".pdf") && !filename.endsWith(".png") && !filename.endsWith(".jpg") && !filename.endsWith(".jpeg"))) continue;

          const attachment = await gmail.users.messages.attachments.get({
            userId: "me",
            messageId: msgRef.id,
            id: part.body.attachmentId,
          });
          if (!attachment.data.data) continue;

          console.log(`[Webhook] 📎 Downloading "${part.filename}" and sending to FastAPI...`);

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

            const [savedDoc] = await db.insert(extractedDocuments).values({
              userId: target.userId,
              gmailMessageId: msgRef.id,       // ← persistent dedup key
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

            // 🔔 Trigger analysis engine
            if (savedDoc?.id) {
              try {
                const analysisRes = await axios.post(
                  `${fastApiUrl}/api/process-invoice-analysis`,
                  { document_id: savedDoc.id },
                  { timeout: 30000 }
                );
                console.log(`[Webhook] ✅ Analysis complete for ${savedDoc.id}:`, analysisRes.data?.decision);
              } catch (analysisErr: any) {
                console.warn(`[Webhook] ⚠️ Analysis engine error (non-fatal):`, analysisErr.response?.data || analysisErr.message);
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

    console.log(`[Webhook] Done. Processed ${processedCount} invoices.`);
    return NextResponse.json({ ok: true, processed: processedCount });

  } catch (err: any) {
    console.error("[Webhook Error]:", err.message || err);
    return NextResponse.json({ ok: false, error: err.message });
  }
}
