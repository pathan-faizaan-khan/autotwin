import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const maxDuration = 60; // seconds — n8n responds after Parse Document Type (~30-45s)

const N8N_URL = process.env.N8N_WEBHOOK_URL || "https://web-production-8cd36.up.railway.app";
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

    // Await n8n — the Respond node fires after Parse Document Type (~30-45s).
    // WA notifications and Analysis Engine continue in background after n8n responds.
    const n8nRes = await fetch(`${N8N_URL}/webhook/autotwin/ocr`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-autotwin-secret": N8N_SECRET },
      body: JSON.stringify({ fileUrl, userId, fileName, source: "website", mimeType }),
      signal: AbortSignal.timeout(55000),
    });

    if (!n8nRes.ok) {
      const body = await n8nRes.json().catch(() => ({}));
      const errorMsg =
        body?.message || body?.error || `Processing failed (HTTP ${n8nRes.status})`;
      console.error("[process-invoice] n8n error:", errorMsg);
      return NextResponse.json({ error: errorMsg }, { status: 422 });
    }

    const result = await n8nRes.json();
    return NextResponse.json({ success: true, ...result });
  } catch (err: any) {
    const msg = err.name === "TimeoutError"
      ? "Processing timed out — the document may still be analyzed in the background."
      : err.message;
    console.error("[process-invoice]", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
