import { NextResponse } from "next/server";

const N8N_URL = process.env.N8N_WEBHOOK_URL || "https://n8n-production-2f47.up.railway.app";
const N8N_SECRET = process.env.WEBHOOK_SECRET || "";

const FALLBACK_RESPONSE = "I'm having trouble connecting to the AI pipeline right now. Please try again in a moment.";

export async function GET() {
  return NextResponse.json({ messages: [] });
}

export async function POST(req: Request) {
  const { query, userId, language, languageCode } = await req.json();

  try {
    const n8nRes = await fetch(`${N8N_URL}/webhook/autotwin/chatbot`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-autotwin-secret": N8N_SECRET },
      body: JSON.stringify({
        query: query || "",
        userId: userId || "",
        channel: "platform",
        language: languageCode || language || null,
      }),
      signal: AbortSignal.timeout(45000),
    });

    if (!n8nRes.ok) throw new Error(`N8N responded ${n8nRes.status}`);

    const text = await n8nRes.text();
    if (!text || !text.trim()) {
      throw new Error("N8N returned empty body — Workflow 4 may not be activated in N8N");
    }

    let result: any;
    try {
      result = JSON.parse(text);
    } catch {
      throw new Error(`N8N returned non-JSON: ${text.slice(0, 120)}`);
    }

    return NextResponse.json({
      reply: result.response || FALLBACK_RESPONSE,
      language: result.language,
      languageName: result.languageName,
      ragDocCount: result.ragDocCount,
    });
  } catch (err: any) {
    console.error("[chat]", err.message, err.cause ? `| cause: ${err.cause}` : "");
    return NextResponse.json({ reply: FALLBACK_RESPONSE });
  }
}
