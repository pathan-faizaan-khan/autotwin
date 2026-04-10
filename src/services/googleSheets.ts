import { google } from "googleapis";
import { getDb } from "@/lib/db";
import { integrations, userSpreadsheets } from "@/lib/schema";
import { eq, and } from "drizzle-orm";

interface InvoiceData {
  date: string;
  vendor: string;
  invoiceNo: string;
  amount: number;
  currency: string;
  category: string;
  status: string;
  confidence: number;
  fileUrl: string;
}

export async function appendInvoiceToSheet(userId: string, invoice: InvoiceData) {
  const db = getDb();
  if (!db) throw new Error("Database not available");

  // 1. Get Google Credentials for the user
  const [integration] = await db
    .select()
    .from(integrations)
    .where(and(eq(integrations.userId, userId), eq(integrations.provider, "gmail")))
    .limit(1);

  if (!integration || !integration.accessToken) {
    console.warn(`[GoogleSheets] No Google integration found for user ${userId}`);
    return;
  }

  let tokens;
  try {
    tokens = JSON.parse(integration.accessToken);
  } catch (e) {
    console.error(`[GoogleSheets] Failed to parse tokens for user ${userId}`);
    return;
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

  const sheets = google.sheets({ version: "v4", auth: oauth2Client });

  // 2. Determine Month and Day
  const now = new Date();
  const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const monthName = now.toLocaleString("default", { month: "long", year: "numeric" });
  const dayName = now.toISOString().split("T")[0]; // "2024-04-10"

  // 3. Get or Create Spreadsheet for the Month
  let [userSheet] = await db
    .select()
    .from(userSpreadsheets)
    .where(and(eq(userSpreadsheets.userId, userId), eq(userSpreadsheets.month, monthKey)))
    .limit(1);

  let spreadsheetId = userSheet?.spreadsheetId;

  if (!spreadsheetId) {
    console.log(`[GoogleSheets] Creating new spreadsheet for ${monthName}...`);
    const resource = {
      properties: {
        title: `AutoTwin Invoices - ${monthName}`,
      },
    };
    try {
      const spreadsheet = await sheets.spreadsheets.create({
        requestBody: resource,
        fields: "spreadsheetId",
      });
      spreadsheetId = spreadsheet.data.spreadsheetId!;

      // Save to DB
      await db.insert(userSpreadsheets).values({
        userId,
        spreadsheetId,
        month: monthKey,
      });

      // Initialize the first sheet with headers
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: {
          requests: [
            {
              updateSheetProperties: {
                properties: {
                  title: dayName,
                },
                fields: "title",
              },
            },
          ],
        },
      });

      // Add Headers
      await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: `${dayName}!A1`,
        valueInputOption: "RAW",
        requestBody: {
          values: [
            ["Date", "Vendor", "Invoice No", "Amount", "Currency", "Category", "Status", "Confidence (%)", "File Link"]
          ],
        },
      });
    } catch (err: any) {
      console.error("[GoogleSheets] Create Spreadsheet Error:", err.message);
      return;
    }
  }

  // 4. Ensure Daily Sheet (Tab) exists
  try {
    const ssContent = await sheets.spreadsheets.get({ spreadsheetId });
    const sheetExists = ssContent.data.sheets?.some(s => s.properties?.title === dayName);

    if (!sheetExists) {
      console.log(`[GoogleSheets] Creating new tab for ${dayName}...`);
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: {
          requests: [
            {
              addSheet: {
                properties: {
                  title: dayName,
                },
              },
            },
          ],
        },
      });

      // Add Headers to new sheet
      await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: `${dayName}!A1`,
        valueInputOption: "RAW",
        requestBody: {
          values: [
            ["Date", "Vendor", "Invoice No", "Amount", "Currency", "Category", "Status", "Confidence (%)", "File Link"]
          ],
        },
      });
    }
  } catch (err: any) {
    console.error("[GoogleSheets] Check/Create Tab Error:", err.message);
    // Continue anyway, maybe it exists but get failed
  }

  // 5. Append Row
  try {
    const row = [
      invoice.date || dayName,
      invoice.vendor,
      invoice.invoiceNo,
      invoice.amount,
      invoice.currency,
      invoice.category,
      invoice.status,
      (invoice.confidence * 100).toFixed(1),
      invoice.fileUrl
    ];

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `${dayName}!A1`,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [row],
      },
    });
    console.log(`[GoogleSheets] Successfully appended invoice to ${dayName}`);
  } catch (err: any) {
    console.error("[GoogleSheets] Append Row Error:", err.message);
  }
}
