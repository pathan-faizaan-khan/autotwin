import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

const N8N_URL = process.env.N8N_WEBHOOK_URL || "https://n8n-production-4cae.up.railway.app";
const N8N_SECRET = process.env.WEBHOOK_SECRET || "";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const userId = formData.get("userId") as string | null;
    let fileUrl = formData.get("fileUrl") as string | null;
    const fileName = file?.name || (formData.get("fileName") as string) || "document";
    const mimeType = file?.type || "application/pdf";

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    // Upload to Supabase if no public URL was provided by the frontend
    if (!fileUrl && file) {
      const safeName = fileName.replace(/[^a-zA-Z0-9.\-_]/g, "_");
      const storageKey = `website/${userId}/${Date.now()}_${safeName}`;
      const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
        .from("invoices")
        .upload(storageKey, file, { contentType: mimeType });

      if (uploadError) {
        console.error("[process-invoice] Supabase upload:", uploadError.message);
        return NextResponse.json({ error: "File upload failed", detail: uploadError.message }, { status: 500 });
      }
      const { data: urlData } = supabaseAdmin.storage.from("invoices").getPublicUrl(uploadData.path);
      fileUrl = urlData.publicUrl;
    }

    if (!fileUrl) {
      return NextResponse.json({ error: "Missing file or fileUrl" }, { status: 400 });
    }

    // Hand off to N8N OCR pipeline — handles OCR, DB insert, RAG indexing, analysis, Sheets sync
    const n8nRes = await fetch(`${N8N_URL}/webhook/autotwin/ocr`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-autotwin-secret": N8N_SECRET },
      body: JSON.stringify({ fileUrl, userId, fileName, source: "website", mimeType }),
      signal: AbortSignal.timeout(120000),
    });

    if (!n8nRes.ok) {
      const detail = await n8nRes.text().catch(() => n8nRes.statusText);
      console.error("[process-invoice] N8N error:", n8nRes.status, detail);
      return NextResponse.json({ error: "Processing pipeline failed", detail }, { status: 502 });
    }

    const result = await n8nRes.json();
    return NextResponse.json({ success: true, data: result });
  } catch (err: any) {
    if (err.name === "TimeoutError" || err.name === "AbortError") {
      return NextResponse.json({ error: "Pipeline timed out — the document is still being processed" }, { status: 504 });
    }
    console.error("[process-invoice]", err.message);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
