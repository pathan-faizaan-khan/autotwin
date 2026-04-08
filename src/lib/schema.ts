import {
  pgTable, text, real, integer, timestamp, jsonb, uuid, boolean,
} from "drizzle-orm/pg-core";

// ── Users ──────────────────────────────────────────────────────────────────────
// Stores profile data synced from Firebase on registration / Google sign-up
export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  firebaseUid: text("firebase_uid").notNull().unique(), // matches Firebase auth UID
  displayName: text("display_name"),
  email: text("email").notNull(),
  whatsappNumber: text("whatsapp_number"),              // e.g. "+919876543210"
  plan: text("plan").default("free"),                   // free | pro | enterprise
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ── Invoices ───────────────────────────────────────────────────────────────────
export const invoices = pgTable("invoices", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull(),
  vendor: text("vendor").notNull(),
  invoiceNo: text("invoice_no").notNull(),
  amount: real("amount").notNull(),
  currency: text("currency").default("INR"),
  status: text("status").default("pending"), // pending | approved | rejected | flagged
  confidence: real("confidence").notNull().default(0),
  category: text("category"),
  fileUrl: text("file_url"),
  dueDate: timestamp("due_date"),
  createdAt: timestamp("created_at").defaultNow(),
});

// ── Approvals ─────────────────────────────────────────────────────────────────
export const approvals = pgTable("approvals", {
  id: uuid("id").defaultRandom().primaryKey(),
  invoiceId: uuid("invoice_id").references(() => invoices.id),
  userId: text("user_id").notNull(),
  status: text("status").default("pending"), // pending | approved | rejected
  requestedBy: text("requested_by"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  resolvedAt: timestamp("resolved_at"),
});

// ── Transactions ──────────────────────────────────────────────────────────────
export const transactions = pgTable("transactions", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull(),
  category: text("category").notNull(),
  amount: real("amount").notNull(),
  vendor: text("vendor").notNull(),
  date: timestamp("date").notNull(),
  anomalyScore: real("anomaly_score").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// ── Workflow Runs ─────────────────────────────────────────────────────────────
export const workflowRuns = pgTable("workflow_runs", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull(),
  name: text("name").notNull(),
  status: text("status").default("running"), // running | completed | failed | retrying
  stepsJson: jsonb("steps_json"),
  triggerType: text("trigger_type").default("manual"), // manual | scheduled | webhook
  startedAt: timestamp("started_at").defaultNow(),
  finishedAt: timestamp("finished_at"),
});

// ── Agent Logs ─────────────────────────────────────────────────────────────────
export const agentLogs = pgTable("agent_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull(),
  agent: text("agent").notNull(), // vision | confidence | memory | reflection | browser
  action: text("action").notNull(),
  result: text("result").notNull(), // success | failed | retrying
  confidence: real("confidence"),
  attempt: integer("attempt").default(1),
  details: text("details"),
  durationMs: integer("duration_ms"),
  createdAt: timestamp("created_at").defaultNow(),
});

// ── Chat Messages ─────────────────────────────────────────────────────────────
export const chatMessages = pgTable("chat_messages", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull(),
  role: text("role").notNull(), // user | assistant
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// ── Integrations ──────────────────────────────────────────────────────────────
export const integrations = pgTable("integrations", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull(),
  provider: text("provider").notNull(), // gmail | sheets | drive | slack
  enabled: boolean("enabled").default(false),
  accessToken: text("access_token"),
  lastSyncedAt: timestamp("last_synced_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// ── User Settings ─────────────────────────────────────────────────────────────
export const userSettings = pgTable("user_settings", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull().unique(),
  confidenceAutoApprove: real("confidence_auto_approve").default(95),
  confidenceHitl: real("confidence_hitl").default(70),
  notifyEmail: boolean("notify_email").default(true),
  notifyAlerts: boolean("notify_alerts").default(true),
  notifyWorkflow: boolean("notify_workflow").default(false),
  plan: text("plan").default("free"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ── Extracted Documents (FastAPI OCR Outputs) ──────────────────────────────
export const extractedDocuments = pgTable("extracted_documents", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull(),
  gmailMessageId: text("gmail_message_id"),              // dedup key — prevents reprocessing on server restart
  invoiceId: text("invoice_id").notNull(),
  vendor: text("vendor").notNull(),
  amount: real("amount").notNull(),
  date: text("date"),
  anomaly: boolean("anomaly").default(false),
  confidence: real("confidence").notNull(),
  status: text("status").notNull(),
  decision: text("decision").notNull(),
  explanation: text("explanation"),
  anomalyDetails: jsonb("anomaly_details"),
  confidenceBreakdown: jsonb("confidence_breakdown"),
  logs: jsonb("logs"),
  riskScore: real("risk_score").notNull(),
  processingTimeMs: real("processing_time_ms"),
  fileUrl: text("file_url"),
  createdAt: timestamp("created_at").defaultNow(),
});
