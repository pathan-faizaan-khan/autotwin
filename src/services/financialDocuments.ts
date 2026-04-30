import { google } from "googleapis";
import { getDb } from "@/lib/db";
import { integrations, userSpreadsheets, extractedDocuments } from "@/lib/schema";
import { eq, and, gte, lt } from "drizzle-orm";

// ── OAuth helper (shared pattern with googleSheets.ts) ──────────────────────

async function getSheetsClient(userId: string) {
  const db = getDb();
  if (!db) throw new Error("Database not available");

  const [integration] = await db
    .select()
    .from(integrations)
    .where(and(eq(integrations.userId, userId), eq(integrations.provider, "gmail")))
    .limit(1);

  if (!integration?.accessToken) {
    throw new Error("No Google integration found. Please connect Google in Integrations.");
  }

  let tokens: { accessToken: string; refreshToken: string; expiryDate: number };
  try {
    tokens = JSON.parse(integration.accessToken);
  } catch {
    throw new Error("Invalid Google credentials. Please reconnect Google.");
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.GMAIL_CLIENT_ID,
    process.env.GMAIL_CLIENT_SECRET
  );
  oauth2Client.setCredentials({
    access_token: tokens.accessToken,
    refresh_token: tokens.refreshToken,
    expiry_date: tokens.expiryDate,
  });

  return { sheets: google.sheets({ version: "v4", auth: oauth2Client }), db };
}

// ── Data fetching ────────────────────────────────────────────────────────────

async function getMonthInvoices(userId: string, monthKey: string) {
  const db = getDb();
  if (!db) return [];

  const [year, month] = monthKey.split("-").map(Number);
  const start = new Date(year, month - 1, 1).toISOString();
  const end = new Date(year, month, 1).toISOString();

  return db
    .select()
    .from(extractedDocuments)
    .where(
      and(
        eq(extractedDocuments.userId, userId),
        gte(extractedDocuments.createdAt, new Date(start)),
        lt(extractedDocuments.createdAt, new Date(end))
      )
    );
}

function groupByCategory(docs: any[]) {
  const map: Record<string, { count: number; total: number; gst: number; docs: any[] }> = {};
  for (const doc of docs) {
    const cat = doc.category || "Other";
    if (!map[cat]) map[cat] = { count: 0, total: 0, gst: 0, docs: [] };
    map[cat].count++;
    map[cat].total += Number(doc.amount) || 0;
    map[cat].gst += Number(doc.gstAmount) || 0;
    map[cat].docs.push(doc);
  }
  return map;
}

// ── Spreadsheet helpers ──────────────────────────────────────────────────────

async function createSpreadsheet(
  sheets: ReturnType<typeof google.sheets>,
  title: string,
  firstSheetName: string
): Promise<string> {
  const res = await sheets.spreadsheets.create({
    requestBody: {
      properties: { title },
      sheets: [{ properties: { title: firstSheetName, index: 0 } }],
    },
    fields: "spreadsheetId",
  });
  return res.data.spreadsheetId!;
}

async function addSheet(
  sheets: ReturnType<typeof google.sheets>,
  spreadsheetId: string,
  title: string
) {
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: { requests: [{ addSheet: { properties: { title } } }] },
  });
}

async function writeValues(
  sheets: ReturnType<typeof google.sheets>,
  spreadsheetId: string,
  range: string,
  values: (string | number | null)[][]
) {
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range,
    valueInputOption: "USER_ENTERED",
    requestBody: { values },
  });
}

async function applyHeaderStyle(
  sheets: ReturnType<typeof google.sheets>,
  spreadsheetId: string,
  sheetId: number,
  numCols: number
) {
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: {
      requests: [
        {
          repeatCell: {
            range: { sheetId, startRowIndex: 0, endRowIndex: 1, startColumnIndex: 0, endColumnIndex: numCols },
            cell: {
              userEnteredFormat: {
                backgroundColor: { red: 0.18, green: 0.18, blue: 0.22 },
                textFormat: { bold: true, foregroundColor: { red: 0.98, green: 0.98, blue: 0.98 } },
              },
            },
            fields: "userEnteredFormat(backgroundColor,textFormat)",
          },
        },
      ],
    },
  });
}

async function saveSpreadsheetRecord(
  db: ReturnType<typeof getDb>,
  userId: string,
  spreadsheetId: string,
  monthKey: string,
  type: string
) {
  if (!db) return;
  // Remove any existing record of same type + month to avoid duplicates
  await db
    .delete(userSpreadsheets)
    .where(
      and(
        eq(userSpreadsheets.userId, userId),
        eq(userSpreadsheets.month, monthKey),
        eq(userSpreadsheets.type as any, type)
      )
    );
  await db.insert(userSpreadsheets).values({ userId, spreadsheetId, month: monthKey, type } as any);
}

// ── Balance Sheet ────────────────────────────────────────────────────────────

export async function generateBalanceSheet(
  userId: string,
  monthKey: string
): Promise<{ spreadsheetId: string; url: string }> {
  const { sheets, db } = await getSheetsClient(userId);
  const [year, month] = monthKey.split("-").map(Number);
  const monthName = new Date(year, month - 1, 1).toLocaleString("default", { month: "long", year: "numeric" });

  const docs = await getMonthInvoices(userId, monthKey);
  const byCategory = groupByCategory(docs);

  const approved = docs.filter(d => d.decision === "auto_execute" || d.status === "approved");
  const pending = docs.filter(d => d.decision === "human_review" || d.status === "pending");
  const totalApproved = approved.reduce((s, d) => s + (Number(d.amount) || 0), 0);
  const totalPending = pending.reduce((s, d) => s + (Number(d.amount) || 0), 0);
  const totalGst = docs.reduce((s, d) => s + (Number(d.gstAmount) || 0), 0);

  const spreadsheetId = await createSpreadsheet(sheets, `AutoTwin Balance Sheet — ${monthName}`, "Balance Sheet");
  await addSheet(sheets, spreadsheetId, "Ledger");

  // ── Tab 1: Balance Sheet ────────────────────────────────────────────────
  const bsRows: (string | number | null)[][] = [
    ["AutoTwin AI — Balance Sheet", null, null, null],
    [`Period: ${monthName}`, null, null, null],
    ["Generated:", new Date().toLocaleDateString(), null, null],
    [],
    ["ASSETS", null, null, null],
    ["Category", "Invoice Count", "Amount (INR)", "GST (INR)"],
    ...Object.entries(byCategory).map(([cat, data]) => [cat, data.count, data.total, data.gst]),
    [],
    ["Total Assets", null, docs.reduce((s, d) => s + (Number(d.amount) || 0), 0), totalGst],
    [],
    ["LIABILITIES", null, null, null],
    ["Description", "Count", "Amount (INR)", null],
    ["Approved / Settled", approved.length, totalApproved, null],
    ["Pending / Under Review", pending.length, totalPending, null],
    [],
    ["Net Position (Assets − Liabilities)", null, totalApproved - totalPending, null],
  ];

  await writeValues(sheets, spreadsheetId, "Balance Sheet!A1", bsRows);

  // ── Tab 2: Ledger (full invoice list) ──────────────────────────────────
  const headers = ["Date", "Vendor", "Invoice No", "Category", "Subtotal", "GST Rate %", "GST Amount", "Total", "Status", "Confidence %", "File URL"];
  const rows: (string | number | null)[][] = [
    headers,
    ...docs.map(d => [
      d.date || "",
      d.vendor,
      (d as any).invoiceNo || d.invoiceId?.slice(0, 8) || "",
      d.category || "Other",
      (d as any).subtotal ?? null,
      (d as any).gstRate ?? null,
      (d as any).gstAmount ?? null,
      d.amount,
      d.status,
      d.confidence ? `${(d.confidence * 100).toFixed(0)}%` : "",
      (d as any).fileUrl || "",
    ]),
  ];
  await writeValues(sheets, spreadsheetId, "Ledger!A1", rows);

  // Style headers
  const ss = await sheets.spreadsheets.get({ spreadsheetId });
  const sheetIds = Object.fromEntries(
    (ss.data.sheets || []).map(s => [s.properties?.title, s.properties?.sheetId])
  );
  if (sheetIds["Balance Sheet"] != null) await applyHeaderStyle(sheets, spreadsheetId, sheetIds["Balance Sheet"]!, 4);
  if (sheetIds["Ledger"] != null) await applyHeaderStyle(sheets, spreadsheetId, sheetIds["Ledger"]!, headers.length);

  await saveSpreadsheetRecord(db, userId, spreadsheetId, monthKey, "balance_sheet");

  return {
    spreadsheetId,
    url: `https://docs.google.com/spreadsheets/d/${spreadsheetId}`,
  };
}

// ── Income Statement ─────────────────────────────────────────────────────────

export async function generateIncomeStatement(
  userId: string,
  monthKey: string
): Promise<{ spreadsheetId: string; url: string }> {
  const { sheets, db } = await getSheetsClient(userId);
  const [year, month] = monthKey.split("-").map(Number);
  const monthName = new Date(year, month - 1, 1).toLocaleString("default", { month: "long", year: "numeric" });

  const docs = await getMonthInvoices(userId, monthKey);
  const byCategory = groupByCategory(docs);
  const grandTotal = docs.reduce((s, d) => s + (Number(d.amount) || 0), 0);

  const spreadsheetId = await createSpreadsheet(sheets, `AutoTwin Income Statement — ${monthName}`, "Summary");
  await addSheet(sheets, spreadsheetId, "Detail");

  // ── Tab 1: Summary ─────────────────────────────────────────────────────
  const summaryRows: (string | number | null)[][] = [
    ["AutoTwin AI — Income Statement (Expenses)", null, null, null],
    [`Period: ${monthName}`, null, null, null],
    ["Generated:", new Date().toLocaleDateString(), null, null],
    [],
    ["Category", "# Invoices", "Total Spend (INR)", "% of Total"],
    ...Object.entries(byCategory)
      .sort((a, b) => b[1].total - a[1].total)
      .map(([cat, data]) => [
        cat,
        data.count,
        data.total,
        grandTotal > 0 ? `${((data.total / grandTotal) * 100).toFixed(1)}%` : "0%",
      ]),
    [],
    ["Total Operating Expenses", docs.length, grandTotal, "100%"],
  ];

  await writeValues(sheets, spreadsheetId, "Summary!A1", summaryRows);

  // ── Tab 2: Detail ──────────────────────────────────────────────────────
  const detailHeaders = ["Date", "Vendor", "Invoice No", "Category", "Amount (INR)", "GST (INR)", "Status", "Decision", "Notes"];
  const detailRows: (string | number | null)[][] = [
    detailHeaders,
    ...docs.map(d => [
      d.date || "",
      d.vendor,
      (d as any).invoiceNo || d.invoiceId?.slice(0, 8) || "",
      d.category || "Other",
      d.amount,
      (d as any).gstAmount ?? null,
      d.status,
      d.decision,
      (d as any).notes || "",
    ]),
  ];
  await writeValues(sheets, spreadsheetId, "Detail!A1", detailRows);

  // Style headers
  const ss = await sheets.spreadsheets.get({ spreadsheetId });
  const sheetIds = Object.fromEntries(
    (ss.data.sheets || []).map(s => [s.properties?.title, s.properties?.sheetId])
  );
  if (sheetIds["Summary"] != null) await applyHeaderStyle(sheets, spreadsheetId, sheetIds["Summary"]!, 4);
  if (sheetIds["Detail"] != null) await applyHeaderStyle(sheets, spreadsheetId, sheetIds["Detail"]!, detailHeaders.length);

  await saveSpreadsheetRecord(db, userId, spreadsheetId, monthKey, "income_statement");

  return {
    spreadsheetId,
    url: `https://docs.google.com/spreadsheets/d/${spreadsheetId}`,
  };
}

// ── Cash Flow Data (for UI chart) ────────────────────────────────────────────

export interface CashFlowData {
  byCategory: { category: string; total: number; count: number }[];
  byWeek: { week: string; total: number; approved: number; pending: number }[];
  totalOutflow: number;
  approvedTotal: number;
  pendingTotal: number;
  invoiceCount: number;
  largestCategory: string;
}

export async function getCashFlowData(userId: string, monthKey: string): Promise<CashFlowData> {
  const docs = await getMonthInvoices(userId, monthKey);

  const byCategory = groupByCategory(docs);
  const categoryList = Object.entries(byCategory)
    .map(([category, data]) => ({ category, total: data.total, count: data.count }))
    .sort((a, b) => b.total - a.total);

  // Group by week of month
  const weekMap: Record<string, { total: number; approved: number; pending: number }> = {};
  for (const doc of docs) {
    const d = doc.date ? new Date(doc.date) : doc.createdAt ? new Date(doc.createdAt) : new Date();
    const dayOfMonth = d.getDate();
    const weekNum = Math.ceil(dayOfMonth / 7);
    const key = `Week ${weekNum}`;
    if (!weekMap[key]) weekMap[key] = { total: 0, approved: 0, pending: 0 };
    const amount = Number(doc.amount) || 0;
    weekMap[key].total += amount;
    if (doc.decision === "auto_execute" || doc.status === "approved") {
      weekMap[key].approved += amount;
    } else {
      weekMap[key].pending += amount;
    }
  }

  const byWeek = Object.entries(weekMap).map(([week, data]) => ({ week, ...data }));
  const totalOutflow = docs.reduce((s, d) => s + (Number(d.amount) || 0), 0);
  const approvedTotal = docs
    .filter(d => d.decision === "auto_execute" || d.status === "approved")
    .reduce((s, d) => s + (Number(d.amount) || 0), 0);

  return {
    byCategory: categoryList,
    byWeek,
    totalOutflow,
    approvedTotal,
    pendingTotal: totalOutflow - approvedTotal,
    invoiceCount: docs.length,
    largestCategory: categoryList[0]?.category || "—",
  };
}
