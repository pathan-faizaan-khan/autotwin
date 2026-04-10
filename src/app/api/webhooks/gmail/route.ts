import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { integrations, extractedDocuments } from "@/lib/schema";
import { eq, and } from "drizzle-orm";
import { google } from "googleapis";
import { analyzeIsInvoice } from "@/lib/agents/emailAnalyzer";
import axios from "axios";
import { supabase } from "@/lib/supabase";

// In-memory lock prevents two simultaneous notifications processing the same message
const processingIds = new Set<string>();

// ── Recursively flatten all parts in a Gmail message (handles forwarded emails) ──
function flattenParts(parts: any[]): any[] {
  const result: any[] = [];
  for (const part of parts) {
    result.push(part);
    if (part.parts && Array.isArray(part.parts)) {
      result.push(...flattenParts(part.parts));
    }
  }
  return result;
}

export async function POST(req: Request) {
  try {
    // 1. Parse Pub/Sub push notification
    const body = await req.json();
    const message = body?.message;
    if (!message?.data) return NextResponse.json({ ok: true });

    const decodedData = Buffer.from(message.data, "base64").toString("utf8");
    const { emailAddress } = JSON.parse(decodedData);
    console.log(`[Webhook] Triggered for: ${emailAddress}`);

    // 2. Get validated token from DB for THIS specific email user
    const db = getDb();
    if (!db) return NextResponse.json({ ok: true });

    const { users } = await import("@/lib/schema");
    const [dbUser] = await db.select().from(users).where(eq(users.email, emailAddress)).limit(1);
    
    if (!dbUser) {
      console.error(`[Webhook] No user found in DB for email: ${emailAddress}`);
      return NextResponse.json({ ok: true });
    }

    const allGmail = await db.select().from(integrations).where(
      and(eq(integrations.provider, "gmail"), eq(integrations.userId, dbUser.firebaseUid))
    );
    
    const target = allGmail.find(i => {
      if (!i.accessToken || !i.enabled) return false;
      try { return JSON.parse(i.accessToken).refreshToken?.startsWith("1//"); }
      catch { return false; }
    }) ?? allGmail.find(i => i.accessToken && i.enabled);

    if (!target?.accessToken) {
      console.error(`[Webhook] No enabled Gmail integration for user: ${emailAddress}`);
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

    // 4. Fetch the 5 most recent messages directly (bypasses Gmail search index delay)
    console.log("[Webhook] Fetching recent messages to avoid search index lag...");
    const listRes = await gmail.users.messages.list({
      userId: "me",
      maxResults: 5,
    });

    const messages = listRes.data.messages || [];
    if (messages.length === 0) {
      console.log("[Webhook] No unread messages. Done.");
      return NextResponse.json({ ok: true, processed: 0 });
    }

    let processedCount = 0;

    for (const msgRef of messages) {
      if (!msgRef.id) continue;

      // ── In-memory lock ───────────────────────────────────────────────
      if (processingIds.has(msgRef.id)) {
        console.log(`[Webhook] Skipped — already processing in-flight: ${msgRef.id}`);
        continue;
      }
      processingIds.add(msgRef.id);

      try {
        // ── DB dedup check using gmailMessageId ──────────────────────
        const [alreadyProcessed] = await db
          .select({ id: extractedDocuments.id })
          .from(extractedDocuments)
          .where(
            and(
              eq(extractedDocuments.userId, target.userId),
              eq(extractedDocuments.gmailMessageId, msgRef.id)
            )
          )
          .limit(1);

        if (alreadyProcessed) {
          console.log(`[Webhook] Skipped — already in DB (gmailMessageId=${msgRef.id}). Marking read.`);
          await gmail.users.messages.modify({
            userId: "me", id: msgRef.id,
            requestBody: { removeLabelIds: ["UNREAD"] }
          }).catch(() => {});
          continue;
        }

        // ── Fetch full message ───────────────────────────────────────
        const msgDetails = await gmail.users.messages.get({ userId: "me", id: msgRef.id });
        const labels = msgDetails.data.labelIds || [];
        if (!labels.includes("UNREAD")) {
          console.log(`[Webhook] Skipped — already read: ${msgRef.id}`);
          continue;
        }

        const msgPayload = msgDetails.data.payload;
        const subject = msgPayload?.headers?.find(h => h.name?.toLowerCase() === "subject")?.value || "No Subject";
        const snippet = msgDetails.data.snippet || "";

        // ── Recursively flatten ALL nested parts (handles forwarded emails) ──
        const topLevelParts = msgPayload?.parts || [];
        const allParts = flattenParts(topLevelParts);
        const filenames = allParts
          .filter(p => !!p.filename && p.filename.length > 0)
          .map(p => p.filename!);

        console.log(`[Webhook] Subject: "${subject}" | Attachments found: [${filenames.join(", ") || "none"}]`);

        // ── LLM classification ───────────────────────────────────────
        const isInvoice = await analyzeIsInvoice(subject, snippet, filenames);

        if (!isInvoice) {
          console.log(`[Webhook] Not an invoice: "${subject}" — marking read.`);
          await gmail.users.messages.modify({
            userId: "me", id: msgRef.id,
            requestBody: { removeLabelIds: ["UNREAD"] }
          }).catch(() => {});
          continue;
        }

        console.log(`[Webhook] ✅ Invoice detected: "${subject}"`);

        // ── MARK AS READ IMMEDIATELY after classification ─────────────
        // This is critical — prevents infinite Pub/Sub refire regardless of
        // whether the attachment processing succeeds or fails downstream.
        await gmail.users.messages.modify({
          userId: "me", id: msgRef.id,
          requestBody: { removeLabelIds: ["UNREAD"] }
        }).catch(e => console.error("[Webhook] Mark-as-read failed:", e.message));

        // ── Process supported attachments ────────────────────────────
        const supportedParts = allParts.filter(part => {
          const fn = (part.filename ?? "").toLowerCase();
          const supported = fn.endsWith(".pdf") || fn.endsWith(".png") || fn.endsWith(".jpg") || fn.endsWith(".jpeg");
          return supported && !!part.body?.attachmentId;
        });

        if (supportedParts.length === 0) {
          console.log(`[Webhook] ⚠️ Invoice email detected but no supported attachment found (PDF/PNG/JPG) in "${subject}".`);
          continue;
        }

        for (const part of supportedParts) {
          const attachment = await gmail.users.messages.attachments.get({
            userId: "me", messageId: msgRef.id, id: part.body.attachmentId,
          });
          if (!attachment.data.data) {
            console.log(`[Webhook] Empty attachment data for "${part.filename}" — skipping.`);
            continue;
          }

          console.log(`[Webhook] 📎 Sending "${part.filename}" to FastAPI...`);
          const buffer = Buffer.from(attachment.data.data, "base64");
          const ext = part.filename!.toLowerCase().split(".").pop() ?? "pdf";
          const mimeTypes: Record<string, string> = {
            pdf: "application/pdf", png: "image/png",
            jpg: "image/jpeg", jpeg: "image/jpeg",
          };
          const mimeType = mimeTypes[ext] ?? "application/pdf";
          const fileObj = new File([buffer], part.filename!, { type: mimeType });

          // ── Upload to Supabase Storage ──
          let publicUrl = "";
          try {
            const safeName = part.filename!.replace(/[^a-zA-Z0-9.\-_]/g, "_");
            const storageFileName = `${Date.now()}_${Math.random().toString(36).substring(7)}_${safeName}`;
            const { data: uploadData, error: uploadError } = await supabase.storage
              .from("chat-attachments")
              .upload(`invoices/${storageFileName}`, fileObj, { contentType: mimeType });
              
            if (uploadError) {
              console.error(`[Webhook] Supabase upload error:`, uploadError);
            } else if (uploadData?.path) {
              const { data: urlData } = supabase.storage.from("chat-attachments").getPublicUrl(uploadData.path);
              publicUrl = urlData.publicUrl;
              console.log(`[Webhook] Uploaded to Supabase: ${publicUrl}`);
            }
          } catch (storageErr) {
            console.error(`[Webhook] Error uploading to Supabase:`, storageErr);
          }

          const fastApiForm = new FormData();
          fastApiForm.append("file", fileObj);
          // pass the publicUrl to fastapi if needed, though we will just save it to db directly

          const fastApiUrl = process.env.NEXT_PUBLIC_FASTAPI_URL || "http://localhost:8000";
          const whatsappurl = process.env.NEXT_PUBLIC_WHATSAPP_SERVICE || "http://localhost:8000";
          try {
            const response = await axios.post(`${fastApiUrl}/api/process-invoice`, fastApiForm, { timeout: 200000 });
            const d = response.data;

            if (d?.invoice_id) {
              // ── Save to DB with gmailMessageId for future dedup ──
              const [savedDoc] = await db.insert(extractedDocuments).values({
                userId: target.userId,
                gmailMessageId: msgRef.id,          // ← dedup key
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
                fileUrl: publicUrl || d.file_url, // Use our generated url, fallback to fastapi
              }).returning({ id: extractedDocuments.id });

              console.log(`[Webhook] ✅ Saved to DB: docId=${savedDoc?.id} | msgId=${msgRef.id}`);
              processedCount++;

              // Trigger analysis (non-blocking)
              if (savedDoc?.id) {
               const  response =  await axios.post(`${whatsappurl}/api/process-invoice-analysis`, { document_id: savedDoc.id }, { timeout: 30000 }).catch(() => {});
               console.log("WEBHOOK ANALYSIS", response?.data || "ok");
              }
            } else {
              console.log(`[Webhook] ⚠️ FastAPI returned no invoice_id for "${part.filename}":`, JSON.stringify(d).slice(0, 200));
            }
          } catch (axErr: any) {
            console.error(`[Webhook] ❌ FastAPI error for "${part.filename}":`, axErr.response?.data || axErr.message);
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