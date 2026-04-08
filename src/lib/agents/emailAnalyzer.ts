import { Groq } from "groq-sdk";

/**
 * Analyzes an email's metadata and content using Groq LLM to determine
 * whether it is a financial document (invoice, receipt, bill) that needs extraction.
 */
export async function analyzeIsInvoice(subject: string, bodyText: string, filenames: string[] = []): Promise<boolean> {
  const text = (subject + " " + bodyText).toLowerCase();
  
  if (!process.env.GROQ_API_KEY) {
    // Fast heuristic fallback if no key is present
    return text.includes("invoice") || text.includes("receipt") || text.includes("bill") || text.includes("payment");
  }

  try {
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    
    const prompt = `You are an automated invoice classifier.
Determine if the following incoming email contains a bill, invoice, receipt, or other financial document that needs data processing.
If it is a financial document, reply with EXACTLY "YES".
If it is promotional, spam, conversational, or not a bill/invoice, reply with EXACTLY "NO".

Subject: ${subject}
Attachment Filenames: ${filenames.join(", ")}
Body Snippet: ${bodyText.substring(0, 1500)}

Decision (YES/NO):`;

    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama-3.3-70b-versatile",
      temperature: 0.1, // low temp for deterministic output
    });
    
    const reply = chatCompletion.choices[0]?.message?.content?.trim().toUpperCase() || "NO";
    return reply.includes("YES");
  } catch (error) {
    console.error("[EmailAnalyzer] Error analyzing email:", error);
    // On API failure, fallback to heuristic avoiding dropping actual invoices
    return text.includes("invoice") || text.includes("receipt") || text.includes("bill");
  }
}
