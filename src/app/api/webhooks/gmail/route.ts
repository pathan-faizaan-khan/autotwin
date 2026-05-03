import { NextResponse } from "next/server";

const N8N_URL = process.env.N8N_WEBHOOK_URL || "https://n8n-production-4cae.up.railway.app";
const N8N_SECRET = process.env.WEBHOOK_SECRET || "";

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  // Forward to N8N Gmail pipeline (fire-and-forget — Pub/Sub requires 200 within 10s)
  fetch(`${N8N_URL}/webhook/autotwin/gmail`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-autotwin-secret": N8N_SECRET },
    body: JSON.stringify(body),
  }).catch(err => console.error("[gmail-webhook] N8N forward failed:", err.message));

  return NextResponse.json({ ok: true });
}
