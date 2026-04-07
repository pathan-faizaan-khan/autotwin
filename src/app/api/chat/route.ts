import { NextResponse } from "next/server";

const FINANCIAL_KB: [RegExp, string][] = [
  [/anomal|unusual|spike|suspicious/i, "🔍 **3 anomalies detected in the last 7 days:**\n\n1. **TechnoVendor price spike** — ₹1,47,600 vs ₹49,200 avg (3× increase, no contract change)\n2. **SupplyPro duplicate** — INV-2026-0052 matches INV-2026-0031 exactly\n3. **DigitalOcean surge** — ₹45,200 vs ₹12,800 avg (340% increase)\n\n> 💡 Recommend reviewing all 3 in the Approvals queue immediately."],
  [/top|vendor|expensive|cost|spend/i, "📊 **Top vendors by spend (last 30 days):**\n\n| Vendor | Amount | Risk |\n|---|---|---|\n| Amazon Web Services | ₹2,89,500 | 🟢 Low |\n| TechnoVendor Inc. | ₹1,47,600 | 🔴 High |\n| Stripe Payments | ₹1,25,000 | 🟢 Low |\n| Razorpay | ₹98,000 | 🔴 High |\n| Datadog | ₹78,000 | 🟡 Medium |\n\n> 💡 AWS alone is 38% of total spend. Consider reserved instances to cut 30%."],
  [/budget|burn|forecast|overrun/i, "📈 **Budget Analysis:**\n\n- **Current burn rate:** ₹7.03L / month\n- **April budget:** ₹7.00L\n- **Days until breach:** ~9 days at current pace\n- **Projected overrun:** ₹1,21,000\n\n> ⚠️ Recommended: Defer non-critical vendor payments (Notion, Zoho) to next cycle. Saves ~₹37,500."],
  [/duplicate|double|twice/i, "🔁 **Duplicate Invoice Detection:**\n\nI found **1 confirmed duplicate** this month:\n\n- **SupplyPro Ltd.** — INV-2026-0052 is identical to INV-2026-0031\n  - Same amount: ₹86,200\n  - Same line items: Office supplies\n  - Submitted 3 days apart\n\n> ✅ Invoice INV-2026-0052 has been flagged and held. No payment will be made pending your review."],
  [/invoice|pending|review|approval/i, "📋 **Current Invoice Status:**\n\n- ✅ **Approved:** 4 invoices (₹4,55,000)\n- ⏳ **Pending:** 3 invoices (₹1,25,500)\n- 🚩 **Flagged:** 3 invoices (₹2,70,800) — need your review\n- ❌ **Rejected:** 1 invoice (₹98,000)\n\n> 💡 3 flagged invoices in the Approvals queue have confidence < 70%. HITL review required."],
  [/risk|dangerous|fraud/i, "🛡️ **Risk Report:**\n\n- **High risk vendors:** TechnoVendor (risk 91/100), Razorpay (not onboarded)\n- **Fraud signals:** Price spike + unverified GST on 2 vendors\n- **Confidence Engine blocks:** 3 invoices held for review today\n\n> 🔒 AutoTwin AI prevented ₹2,45,600 in potentially fraudulent payments this week."],
  [/workflow|agent|automation/i, "⚙️ **Workflow Status:**\n\n- 🔄 **Running:** Batch Invoice Processing (18/24 invoices done)\n- ❌ **Failed:** TechnoVendor Escalation — API timeout\n- ✅ **Completed:** Vendor Onboarding — Razorpay (today 9:30 AM)\n- ✅ **Completed:** Monthly Budget Reconciliation (Apr 1)\n\n> 🧠 Self-healing activated: Browser Agent retried 3× and recovered on wf-001."],
];

const DEFAULT_RESPONSE = "🤔 I can help with financial analysis, anomaly detection, vendor intelligence, and workflow status. Try asking:\n\n- *\"Show me spending anomalies this week\"*\n- *\"Which vendors are highest risk?\"*\n- *\"What's our budget burn rate?\"*\n- *\"Any duplicate invoices?\"*\n- *\"What's pending in approvals?\"*";

function mockAIResponse(message: string): string {
  for (const [pattern, response] of FINANCIAL_KB) {
    if (pattern.test(message)) return response;
  }
  return DEFAULT_RESPONSE;
}

const MOCK_HISTORY = [
  { id: "msg-001", role: "assistant", content: "👋 Hello! I'm your AutoTwin AI financial co-pilot. I have real-time access to your invoices, vendor data, anomaly alerts, and workflow status. What would you like to know?", createdAt: "2026-04-05T10:00:00Z" },
];

export async function GET() {
  return NextResponse.json({ messages: MOCK_HISTORY });
}

export async function POST(req: Request) {
  const { query, messages } = await req.json();

  console.log("=== CHAT API ROUTE HIT ===");
  console.log("Incoming query:", query);
  console.log("API Key present:", !!process.env.GEMINI_API_KEY);

  // Try Gemini if API key is set
  if (process.env.GEMINI_API_KEY) {
    try {
      console.log("Initializing Gemini model...");
      const { GoogleGenerativeAI } = await import("@google/generative-ai");
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      const systemPrompt = `You are AutoTwin AI, an intelligent financial co-pilot for an Indian SMB. 
You have access to their financial data: invoices, vendor spending, budget burn rate, anomaly alerts, and workflow status.
Key data:
- Total spend this month: ₹8,85,500
- Budget: ₹7,00,000 (exceeded by ₹1,85,500)
- Active vendors: 47
- Flagged invoices: 3 (TechnoVendor+200%, DigitalOcean+340%, SupplyPro duplicate)
- Top vendor: AWS (₹2,89,500 / 38% of spend)
- Burn rate: ₹7.03L/month
Answer concisely with relevant financial insights. Use markdown formatting. Keep responses under 300 words.
User question: ${query}`;

      console.log("Calling model.generateContent...");
      const result = await model.generateContent(systemPrompt);
      const text = result.response.text();
      
      console.log("Gemini successfully generated response.");
      return NextResponse.json({ reply: text });
    } catch (error: any) {
      console.error("/// GEMINI API ERROR ///");
      console.error(error.message);
      console.error(error.stack);
      // Fall through to mock
    }
  }

  // Fallback to rule-based mock AI
  console.log("Falling back to simulated AI response...");
  await new Promise(r => setTimeout(r, 600 + Math.random() * 800));
  const reply = mockAIResponse(query || "");
  return NextResponse.json({ reply });
}
