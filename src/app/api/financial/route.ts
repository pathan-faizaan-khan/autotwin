import { NextRequest, NextResponse } from "next/server";
import {
  getCashFlowData,
  generateBalanceSheet,
  generateIncomeStatement,
} from "@/services/financialDocuments";

// GET /api/financial?type=cash-flow&userId=xxx&month=2025-04
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const type = searchParams.get("type");
  const userId = searchParams.get("userId");
  const month = searchParams.get("month") || currentMonthKey();

  if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });

  if (type === "cash-flow") {
    try {
      const data = await getCashFlowData(userId, month);
      return NextResponse.json(data);
    } catch (err: any) {
      return NextResponse.json({ error: err.message }, { status: 500 });
    }
  }

  return NextResponse.json({ error: "Use POST for document generation" }, { status: 405 });
}

// POST /api/financial?type=balance-sheet&userId=xxx&month=2025-04
// POST /api/financial?type=income-statement&userId=xxx&month=2025-04
export async function POST(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const type = searchParams.get("type");
  const userId = searchParams.get("userId");
  const month = searchParams.get("month") || currentMonthKey();

  if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });

  try {
    if (type === "balance-sheet") {
      const result = await generateBalanceSheet(userId, month);
      return NextResponse.json(result);
    }

    if (type === "income-statement") {
      const result = await generateIncomeStatement(userId, month);
      return NextResponse.json(result);
    }

    return NextResponse.json({ error: "type must be balance-sheet or income-statement" }, { status: 400 });
  } catch (err: any) {
    console.error("[Financial API]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

function currentMonthKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}
