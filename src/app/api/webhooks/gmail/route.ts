import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { integrations, extractedDocuments } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { google } from "googleapis";
import { analyzeIsInvoice } from "@/lib/agents/emailAnalyzer";
import axios from "axios";

// In-memory lock: prevents two concurrent requests from double-processing
// the same message within a single server/serverless instance lifetime.
const processingIds = new Set<string>();

export async function POST(req: Request) {
  try {
    // ── 0. Security: verify shared secret ────────────────────────────────────
    const { searchParams } = new URL(req.url);
    const webhookSecret = process.env.WEBHOOK_SECRET;
    if (webhookSecret && searchParams.get("token") !== webhookSecret) {
      console.warn("[Webhook] ❌ Unauthorized — invalid or missing token");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ── 1. Parse Pub/Sub push notification ───────────────────────────────────
    const body = await req.json();
    const message = body?.message;
    if (!message?.data) return NextResponse.json({ ok: true });

    const decodedData = Buffer.from(message.data, "base64").toString("utf8");
    const { emailAddress } = JSON.parse(decodedData);
    console.log(`[Webhook] Triggered for: ${emailAddress}`);

    // ── 2. Load active Gmail integration token ────────────────────────────────
    const db = getDb();
    if (!db) return NextResponse.json({ ok: true });

    const allGmail = await db.select().from(integrations).where(eq(integrations.provider, "gmail"));
    const target = allGmail.find(i => {
      if (!i.accessToken || !i.enabled) return false;
      try { return JSON.parse(i.accessToken).refreshToken?.startsWith("1//"); }
      catch { return false; }
    }) ?? allGmail.find(i => i.accessToken && i.enabled);

    if (!target?.accessToken) {
      console.error("[Webhook] No enabled Gmail integration. User must reconnect.");
      return NextResponse.json({ ok: true });
    }

    let tokenData: { accessToken?: string; refreshToken?: string; expiryDate?: number };
    try { tokenData = JSON.parse(target.accessToken); }
    catch { tokenData = { accessToken: target.accessToken }; }

    if (!tokenData.refreshToken?.startsWith("1//")) {
      console.error("[Webhook] Stale token — Disconnect and Reconnect Gmail.");
      return NextResponse.json({ ok: true });
    }

    // ── 3. Build authenticated Gmail client ───────────────────────────────────
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

    // ── 4. Query inbox: attachments in the last 7 days ────────────────────────
    // WHY NOT is:unread?
    // The stored token may only have gmail.readonly scope — mark-as-read calls
    // fail with "insufficient authentication scopes". Using is:unread as the
    // dedup mechanism is therefore unreliable. Instead:
    //  • DATE WINDOW  — naturally excludes old/stuck emails without any writes
    //  • DB gmailMessageId — sole persistent dedup, scope-independent
    //  • In-memory lock   — prevents concurrent same-request double-processing
    const sevenDaysAgo = Math.floor((Date.now() - 7 * 24 * 60 * 60 * 1000) / 1000);
    console.log("[Webhook] Scanning inbox for recent attachments...");
    const listRes = await gmail.users.messages.list({
      userId: "me",
      maxResults: 10,
      q: `has:attachment in:inbox after:${sevenDaysAgo}`,
    });

    const messages = listRes.data.messages || [];
    if (messages.length === 0) {
      console.log("[Webhook] No recent messages with attachments. Done.");
      return NextResponse.json({ ok: true, processed: 0 });
    }

    let processedCount = 0;

    for (const msgRef of messages) {
      if (!msgRef.id) continue;

      // Guard A — in-memory lock (concurrent requests, same process)
      if (processingIds.has(msgRef.id)) {
        console.log(`[Webhook] Skipped — already in flight: ${msgRef.id}`);
        continue;
      }
      processingIds.add(msgRef.id);

      try {
        // Guard B — DB dedup (persists across restarts, cold starts, deploys)
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
          console.log(`[Webhook] Skipped — already in DB: ${msgRef.id}`);
          continue;
        }

        // ── 5. Fetch full message ─────────────────────────────────────────────
        const msgDetails = await gmail.users.messages.get({ userId: "me", id: msgRef.id });
        const msgPayload = msgDetails.data.payload;
        const subject = msgPayload?.headers?.find(h => h.name?.toLowerCase() === "subject")?.value || "No Subject";
        const snippet = msgDetails.data.snippet || "";
        const parts = msgPayload?.parts || [];
        const filenames = parts.filter(p => !!p.filename && p.filename.length > 0).map(p => p.filename!);

        console.log(`[Webhook] Checking: "${subject}" | Files: ${filenames.join(", ") || "none"}`);

        // ── 6. LLM classification ─────────────────────────────────────────────
        const isInvoice = await analyzeIsInvoice(subject, snippet, filenames);
        if (!isInvoice) {
          console.log(`[Webhook] Skipped — not an invoice: "${subject}"`);
          continue;
        }
        console.log(`[Webhook] ✅ Invoice detected: "${subject}"`);

        // ── 7. Download attachments and send to FastAPI ───────────────────────
        for (const part of parts) {
          const filename = part.filename?.toLowerCase() ?? "";
          const supported = filename.endsWith(".pdf") || filename.endsWith(".png") || filename.endsWith(".jpg") || filename.endsWith(".jpeg");
          if (!part.body?.attachmentId || !supported) continue;

          const attachment = await gmail.users.messages.attachments.get({
            userId: "me", messageId: msgRef.id, id: part.body.attachmentId,
          });
          if (!attachment.data.data) continue;

          console.log(`[Webhook] 📎 Downloading "${part.filename}" → FastAPI...`);
          const buffer = Buffer.from(attachment.data.data, "base64");
          const ext = part.filename!.toLowerCase().split(".").pop() ?? "pdf";
          const mimeTypes: Record<string, string> = { pdf: "application/pdf", png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg" };

          const fastApiForm = new FormData();
          fastApiForm.append("file", new File([buffer], part.filename!, { type: mimeTypes[ext] ?? "application/pdf" }));

          const fastApiUrl = process.env.NEXT_PUBLIC_FASTAPI_URL || "http://localhost:8000";
          try {
            const response = await axios.post(`${fastApiUrl}/api/process-invoice`, fastApiForm, { timeout: 200000 });
            const d = response.data;
            if (!d?.invoice_id || !d?.logs) { console.error("[Webhook] Invalid FastAPI response:", d); continue; }

            // ── 8. Save to DB — gmailMessageId stored for Guard B ─────────────
            const [savedDoc] = await db.insert(extractedDocuments).values({
              userId: target.userId,
              gmailMessageId: msgRef.id,
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

            console.log(`[Webhook] ✅ Saved "${part.filename}" — DB ID: ${savedDoc?.id}`);
            processedCount++;

            // ── 9. Trigger analysis engine (non-fatal) ────────────────────────
            if (savedDoc?.id) {
              axios.post(`${fastApiUrl}/api/process-invoice-analysis`, { document_id: savedDoc.id }, { timeout: 30000 })
                .then(r => console.log(`[Webhook] ✅ Analysis done for ${savedDoc.id}:`, r.data?.decision))
                .catch((e: any) => console.warn(`[Webhook] ⚠️ Analysis (non-fatal):`, e.response?.data || e.message));
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
