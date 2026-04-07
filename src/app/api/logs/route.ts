import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { agentLogs } from "@/lib/schema";
import { desc, eq, and } from "drizzle-orm";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const agent = searchParams.get("agent");
  const result = searchParams.get("result");

  const db = getDb();
  if (!db) return NextResponse.json({ logs: [] });

  try {
    const conditions = [];
    if (agent && agent !== "all") conditions.push(eq(agentLogs.agent, agent));
    if (result && result !== "all") conditions.push(eq(agentLogs.result, result));

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
    
    const data = await db.select().from(agentLogs).where(whereClause).orderBy(desc(agentLogs.createdAt));
    return NextResponse.json({ logs: data });
  } catch {
    return NextResponse.json({ logs: [] });
  }
}
