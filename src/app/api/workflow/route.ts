import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { workflowRuns } from "@/lib/schema";
import { desc } from "drizzle-orm";

export async function GET() {
  const db = getDb();
  if (!db) return NextResponse.json({ workflows: [] });
  
  try {
    const data = await db.select().from(workflowRuns).orderBy(desc(workflowRuns.startedAt));
    // Transform JSON steps back into arrays for the frontend
    const workflows = data.map(w => ({
      ...w,
      steps: w.stepsJson ? (w.stepsJson as any) : [],
    }));
    return NextResponse.json({ workflows });
  } catch {
    return NextResponse.json({ workflows: [] });
  }
}
