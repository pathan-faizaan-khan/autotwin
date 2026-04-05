// TypeScript types for the AutoTwin AI dashboard

export interface OverviewMetric {
  id: string;
  label: string;
  value: string;
  rawValue: number;
  change: number; // percentage
  trend: "up" | "down" | "neutral";
  icon: string;
  color: string;
}

export interface SpendDataPoint {
  month: string;
  actual: number;
  forecast: number;
  budget: number;
}

export interface VendorSpend {
  vendor: string;
  amount: number;
  invoices: number;
  riskLevel: "low" | "medium" | "high";
}

export interface AnomalyAlert {
  id: string;
  title: string;
  description: string;
  vendor: string;
  severity: "high" | "medium" | "low";
  confidence: number;
  amount: string;
  change: string;
  timestamp: string;
  status: "pending" | "approved" | "rejected" | "reviewing";
}

export interface Invoice {
  id: string;
  vendor: string;
  invoiceNo: string;
  amount: string;
  rawAmount: number;
  date: string;
  status: "approved" | "pending" | "needs_review" | "rejected";
  confidence: number;
  category: string;
}

export interface AIInsight {
  id: string;
  type: "warning" | "info" | "success" | "critical";
  title: string;
  description: string;
  metric?: string;
  action?: string;
  timestamp: string;
}

export interface WorkflowStep {
  id: string;
  name: string;
  status: "completed" | "running" | "failed" | "retrying" | "pending";
  duration?: string;
  count?: number;
}

export interface WorkflowJob {
  id: string;
  name: string;
  steps: WorkflowStep[];
  startedAt: string;
  status: "running" | "completed" | "failed";
}

export interface Notification {
  id: string;
  type: "alert" | "info" | "success" | "error";
  title: string;
  description: string;
  timestamp: string;
  read: boolean;
}
