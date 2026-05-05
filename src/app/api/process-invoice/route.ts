import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const N8N_URL = process.env.N8N_WEBHOOK_URL || "https://n8n-production-2f47.up.railway.app";
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

    // Fire-and-forget: trigger N8N pipeline without waiting for it to complete.
    // This prevents users from seeing a timeout and retrying, which caused double uploads.
    fetch(`${N8N_URL}/webhook/autotwin/ocr`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-autotwin-secret": N8N_SECRET },
      body: JSON.stringify({ fileUrl, userId, fileName, source: "website", mimeType }),
      signal: AbortSignal.timeout(10000), // only wait long enough to confirm N8N accepted it
    }).catch((err) => {
      // Log but do not surface — the file is already uploaded; N8N will process it
      console.error("[process-invoice] N8N trigger failed (non-fatal):", err.message);
    });

    return NextResponse.json({ success: true, message: "Invoice received and queued for processing." });
  } catch (err: any) {
    console.error("[process-invoice]", err.message);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
