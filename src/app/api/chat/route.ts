import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { chatMessages } from "@/lib/schema";

const N8N_URL = process.env.N8N_WEBHOOK_URL || "https://web-production-8cd36.up.railway.app";
const N8N_SECRET = process.env.WEBHOOK_SECRET || "";

const FALLBACK_RESPONSE = "I'm having trouble connecting to the AI pipeline right now. Please try again in a moment.";

async function saveMessage(userId: string, role: "user" | "assistant", content: string, lang?: string) {
  try {
    const db = getDb();
    if (!db) return;
    await db.insert(chatMessages).values({
      userId,
      role,
      content,
      channel: "platform",
      language: lang || "en",
    });
  } catch (err: any) {
    console.warn("[chat] save message failed:", err.message);
  }
}

export async function GET() {
  return NextResponse.json({ messages: [] });
}

export async function POST(req: Request) {
  const { query, userId, language, languageCode } = await req.json();

  const lang = languageCode || language || "en";

  if (userId && query) {
    await saveMessage(userId, "user", query, lang);
  }

  try {
    const n8nRes = await fetch(`${N8N_URL}/webhook/autotwin/chatbot`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-autotwin-secret": N8N_SECRET },
      body: JSON.stringify({
        query: query || "",
        userId: userId || "",
        channel: "platform",
        language: lang,
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

    const reply = result.response || FALLBACK_RESPONSE;

    if (userId) {
      await saveMessage(userId, "assistant", reply, result.language || lang);
    }

    return NextResponse.json({
      reply,
      language: result.language,
      languageName: result.languageName,
      ragDocCount: result.ragDocCount,
    });
  } catch (err: any) {
    console.error("[chat]", err.message, err.cause ? `| cause: ${err.cause}` : "");
    return NextResponse.json({ reply: FALLBACK_RESPONSE });
  }
}
