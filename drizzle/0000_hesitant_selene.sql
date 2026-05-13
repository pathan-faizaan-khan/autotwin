CREATE TABLE "agent_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"agent" text NOT NULL,
	"action" text NOT NULL,
	"result" text NOT NULL,
	"confidence" real,
	"attempt" integer DEFAULT 1,
	"details" text,
	"duration_ms" integer,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "approvals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"invoice_id" uuid,
	"user_id" text NOT NULL,
	"status" text DEFAULT 'pending',
	"requested_by" text,
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"resolved_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "chat_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"role" text NOT NULL,
	"content" text NOT NULL,
	"channel" text DEFAULT 'platform',
	"language" text DEFAULT 'en',
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "extracted_documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"gmail_message_id" text,
	"invoice_id" text NOT NULL,
	"vendor" text NOT NULL,
	"amount" real NOT NULL,
	"date" text,
	"anomaly" boolean DEFAULT false,
	"confidence" real NOT NULL,
	"status" text NOT NULL,
	"decision" text NOT NULL,
	"explanation" text,
	"anomaly_details" jsonb,
	"confidence_breakdown" jsonb,
	"logs" jsonb,
	"risk_score" real NOT NULL,
	"category" text,
	"processing_time_ms" real,
	"file_url" text,
	"invoice_no" text,
	"due_date" text,
	"payment_terms" text,
	"subtotal" real,
	"gst_rate" real,
	"gst_amount" real,
	"line_items" jsonb,
	"seller_gstin" text,
	"buyer_gstin" text,
	"buyer_company" text,
	"notes" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "integrations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"provider" text NOT NULL,
	"enabled" boolean DEFAULT false,
	"access_token" text,
	"last_synced_at" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "invoices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"vendor" text NOT NULL,
	"invoice_no" text NOT NULL,
	"amount" real NOT NULL,
	"currency" text DEFAULT 'INR',
	"status" text DEFAULT 'pending',
	"confidence" real DEFAULT 0 NOT NULL,
	"category" text,
	"file_url" text,
	"due_date" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"category" text NOT NULL,
	"amount" real NOT NULL,
	"vendor" text NOT NULL,
	"date" timestamp NOT NULL,
	"anomaly_score" real DEFAULT 0,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"confidence_auto_approve" real DEFAULT 95,
	"confidence_hitl" real DEFAULT 70,
	"notify_email" boolean DEFAULT true,
	"notify_alerts" boolean DEFAULT true,
	"notify_workflow" boolean DEFAULT false,
	"plan" text DEFAULT 'free',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "user_settings_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "user_spreadsheets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"spreadsheet_id" text NOT NULL,
	"month" text NOT NULL,
	"type" text DEFAULT 'ledger',
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"firebase_uid" text NOT NULL,
	"display_name" text,
	"email" text NOT NULL,
	"whatsapp_number" text,
	"plan" text DEFAULT 'free',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "users_firebase_uid_unique" UNIQUE("firebase_uid")
);
--> statement-breakpoint
CREATE TABLE "workflow_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"status" text DEFAULT 'running',
	"steps_json" jsonb,
	"trigger_type" text DEFAULT 'manual',
	"started_at" timestamp DEFAULT now(),
	"finished_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "approvals" ADD CONSTRAINT "approvals_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE no action ON UPDATE no action;