import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { integrations, extractedDocuments } from "@/lib/schema";
import { eq, and } from "drizzle-orm";
import { google } from "googleapis";
import { analyzeIsInvoice } from "@/lib/agents/emailAnalyzer";
import axios from "axios";
import { supabase } from "@/lib/supabase";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

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
            const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
              .from("chat-attachments")
              .upload(`invoices/${storageFileName}`, fileObj, { contentType: mimeType });
              
            if (uploadError) {
              console.error(`[Webhook] Supabase upload error:`, uploadError);
            } else if (uploadData?.path) {
              const { data: urlData } = supabaseAdmin.storage.from("chat-attachments").getPublicUrl(uploadData.path);
              publicUrl = urlData.publicUrl;
              console.log(`[Webhook] Uploaded to Supabase: ${publicUrl}`);
            }
          } catch (storageErr) {
            console.error(`[Webhook] Error uploading to Supabase:`, storageErr);
          }

          // ── Forward to n8n OCR Extraction Pipeline ──
          const n8nUrl = process.env.N8N_WEBHOOK_URL || "https://n8n-production-2f47.up.railway.app";
          const n8nSecret = process.env.WEBHOOK_SECRET || "892hrnwfbw7t298r2";

          try {
            console.log(`[Webhook] 🚀 Forwarding "${part.filename}" to n8n OCR Pipeline...`);
            const n8nResponse = await axios.post(`${n8nUrl}/webhook/autotwin/ocr`, {
              fileUrl: publicUrl,
              userId: target.userId,
              fileName: part.filename,
              source: "gmail",
              whatsappNumber: dbUser.whatsappNumber || "",
              gmailMessageId: msgRef.id,
              mimeType: mimeType
            }, {
              headers: { "x-autotwin-secret": n8nSecret },
              timeout: 60000 
            });

            if (n8nResponse.data?.ok || n8nResponse.status === 200) {
              console.log(`[Webhook] ✅ Successfully handed off to n8n: ${part.filename}`);
              processedCount++;
            } else {
              console.error(`[Webhook] ⚠️ n8n returned non-ok response:`, n8nResponse.data);
            }
          } catch (n8nErr: any) {
            console.error(`[Webhook] ❌ n8n OCR error for "${part.filename}":`, n8nErr.response?.data || n8nErr.message);
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