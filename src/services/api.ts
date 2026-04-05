// Dummy data and simulated API for AutoTwin AI dashboard
import type {
  OverviewMetric, SpendDataPoint, VendorSpend,
  AnomalyAlert, Invoice, AIInsight, WorkflowJob, Notification
} from "@/types/dashboard";

// ─── OVERVIEW METRICS ─────────────────────────────────────────────────────────
export const overviewMetrics: OverviewMetric[] = [
  { id: "spend", label: "Total Spend", value: "₹84,21,600", rawValue: 8421600, change: 12.4, trend: "up", icon: "IndianRupee", color: "#a78bfa" },
  { id: "burn", label: "Burn Rate / Month", value: "₹7,03,200", rawValue: 703200, change: -3.2, trend: "down", icon: "Flame", color: "#f472b6" },
  { id: "vendors", label: "Active Vendors", value: "47", rawValue: 47, change: 5.6, trend: "up", icon: "Building2", color: "#818cf8" },
  { id: "alerts", label: "Risk Alerts", value: "8", rawValue: 8, change: 33.3, trend: "up", icon: "AlertTriangle", color: "#fbbf24" },
];

// ─── MONTHLY SPEND DATA ────────────────────────────────────────────────────────
export const monthlySpendData: SpendDataPoint[] = [
  { month: "Oct", actual: 520000, forecast: 500000, budget: 700000 },
  { month: "Nov", actual: 615000, forecast: 600000, budget: 700000 },
  { month: "Dec", actual: 720000, forecast: 680000, budget: 700000 },
  { month: "Jan", actual: 658000, forecast: 650000, budget: 700000 },
  { month: "Feb", actual: 703000, forecast: 710000, budget: 700000 },
  { month: "Mar", actual: 782000, forecast: 750000, budget: 700000 },
  { month: "Apr (F)", actual: 0, forecast: 821000, budget: 700000 },
  { month: "May (F)", actual: 0, forecast: 890000, budget: 700000 },
];

// ─── VENDOR SPEND ─────────────────────────────────────────────────────────────
export const vendorSpendData: VendorSpend[] = [
  { vendor: "TechnoVendor", amount: 147600, invoices: 12, riskLevel: "high" },
  { vendor: "CloudServe", amount: 98400, invoices: 8, riskLevel: "low" },
  { vendor: "SupplyPro", amount: 86200, invoices: 15, riskLevel: "medium" },
  { vendor: "DataSystems", amount: 74800, invoices: 6, riskLevel: "low" },
  { vendor: "NetInfra", amount: 62100, invoices: 9, riskLevel: "medium" },
  { vendor: "ServiceHub", amount: 48500, invoices: 11, riskLevel: "low" },
];

// ─── ANOMALY ALERTS ────────────────────────────────────────────────────────────
export const anomalyAlerts: AnomalyAlert[] = [
  {
    id: "a1", title: "Vendor price spike detected", vendor: "TechnoVendor Inc.",
    description: "Invoice #1092 shows ₹1,47,600 vs previous ₹49,200 — 3× increase with no contract amendment.",
    severity: "high", confidence: 87, amount: "₹1,47,600", change: "+200%", timestamp: "2 mins ago", status: "pending",
  },
  {
    id: "a2", title: "Duplicate invoice suspected", vendor: "SupplyPro Ltd.",
    description: "Invoice #0934 appears identical to #0921 submitted 3 days ago. Same amount, same line items.",
    severity: "high", confidence: 94, amount: "₹86,200", change: "Duplicate", timestamp: "18 mins ago", status: "pending",
  },
  {
    id: "a3", title: "Unusual payment frequency", vendor: "NetInfra Pvt.",
    description: "3 invoices submitted in a 48-hour window. Historical pattern: 1 invoice per 2 weeks.",
    severity: "medium", confidence: 72, amount: "₹1,86,300", change: "+300%", timestamp: "1 hr ago", status: "reviewing",
  },
  {
    id: "a4", title: "Vendor not in approved list", vendor: "QuickSupplies Co.",
    description: "This vendor has not been onboarded. No GST number verified. Payment blocked pending review.",
    severity: "medium", confidence: 95, amount: "₹22,500", change: "Unknown", timestamp: "3 hrs ago", status: "pending",
  },
];

// ─── INVOICES ─────────────────────────────────────────────────────────────────
export const recentInvoices: Invoice[] = [
  { id: "i1", vendor: "CloudServe", invoiceNo: "INV-2024-0041", amount: "₹98,400", rawAmount: 98400, date: "Apr 5, 2026", status: "approved", confidence: 98, category: "Cloud" },
  { id: "i2", vendor: "TechnoVendor Inc.", invoiceNo: "INV-2024-1092", amount: "₹1,47,600", rawAmount: 147600, date: "Apr 5, 2026", status: "needs_review", confidence: 87, category: "Infrastructure" },
  { id: "i3", vendor: "SupplyPro Ltd.", invoiceNo: "INV-2024-0934", amount: "₹86,200", rawAmount: 86200, date: "Apr 4, 2026", status: "needs_review", confidence: 94, category: "Supplies" },
  { id: "i4", vendor: "DataSystems", invoiceNo: "INV-2024-0318", amount: "₹74,800", rawAmount: 74800, date: "Apr 4, 2026", status: "pending", confidence: 91, category: "Software" },
  { id: "i5", vendor: "ServiceHub", invoiceNo: "INV-2024-0217", amount: "₹48,500", rawAmount: 48500, date: "Apr 3, 2026", status: "approved", confidence: 99, category: "Services" },
  { id: "i6", vendor: "NetInfra Pvt.", invoiceNo: "INV-2024-0441", amount: "₹62,100", rawAmount: 62100, date: "Apr 3, 2026", status: "pending", confidence: 78, category: "Network" },
  { id: "i7", vendor: "QuickSupplies Co.", invoiceNo: "INV-2024-0089", amount: "₹22,500", rawAmount: 22500, date: "Apr 2, 2026", status: "rejected", confidence: 42, category: "Misc" },
];

// ─── AI INSIGHTS ──────────────────────────────────────────────────────────────
export const aiInsights: AIInsight[] = [
  { id: "ins1", type: "critical", title: "Budget breach projected in 9 days", description: "At current burn rate of ₹7.03L/month, you will exceed April budget by ₹1,21,000. Consider deferring non-critical vendor payments.", metric: "₹1,21,000 over budget", action: "View budget forecast", timestamp: "Just now" },
  { id: "ins2", type: "warning", title: "Top 3 vendors = 68% of spend", description: "TechnoVendor, CloudServe, and SupplyPro account for ₹3.32L of your monthly spend. Consider renegotiating contracts.", metric: "₹3,32,200 / month", action: "View vendor breakdown", timestamp: "5 mins ago" },
  { id: "ins3", type: "info", title: "Q1 anomaly detection saved ₹4.2L", description: "AutoTwin AI flagged and blocked 14 suspicious invoices this quarter. 11 were confirmed fraud or billing errors.", metric: "₹4,20,000 saved", action: "View full report", timestamp: "Today 9:00 AM" },
  { id: "ins4", type: "success", title: "Payment cycle optimized", description: "Switching 8 vendors to net-30 from net-15 has improved cash flow by ₹1.8L this month. Recommendation applied successfully.", metric: "+₹1,80,000 cash flow", action: "View payment schedule", timestamp: "Yesterday" },
];

// ─── WORKFLOW JOBS ────────────────────────────────────────────────────────────
export const workflowJobs: WorkflowJob[] = [
  {
    id: "w1", name: "Batch Invoice Processing — Apr 5", status: "running", startedAt: "10:42 AM",
    steps: [
      { id: "s1", name: "Upload", status: "completed", duration: "0.3s", count: 24 },
      { id: "s2", name: "Extract", status: "completed", duration: "2.1s", count: 24 },
      { id: "s3", name: "Analyze", status: "running", count: 18 },
      { id: "s4", name: "Decision", status: "pending" },
      { id: "s5", name: "Execute", status: "pending" },
    ],
  },
  {
    id: "w2", name: "TechnoVendor Escalation — Apr 5", status: "failed", startedAt: "10:05 AM",
    steps: [
      { id: "s1", name: "Upload", status: "completed", duration: "0.2s" },
      { id: "s2", name: "Extract", status: "completed", duration: "1.8s" },
      { id: "s3", name: "Analyze", status: "failed" },
      { id: "s4", name: "Decision", status: "pending" },
      { id: "s5", name: "Execute", status: "pending" },
    ],
  },
  {
    id: "w3", name: "Vendor Onboarding — QuickSupplies", status: "completed", startedAt: "9:30 AM",
    steps: [
      { id: "s1", name: "Upload", status: "completed", duration: "0.1s" },
      { id: "s2", name: "Extract", status: "completed", duration: "1.2s" },
      { id: "s3", name: "Analyze", status: "completed", duration: "4.5s" },
      { id: "s4", name: "Decision", status: "completed", duration: "0.8s" },
      { id: "s5", name: "Execute", status: "completed", duration: "1.1s" },
    ],
  },
];

// ─── NOTIFICATIONS ────────────────────────────────────────────────────────────
export const notifications: Notification[] = [
  { id: "n1", type: "alert", title: "High-risk invoice flagged", description: "TechnoVendor #1092 requires immediate review", timestamp: "2 mins ago", read: false },
  { id: "n2", type: "alert", title: "Duplicate invoice detected", description: "SupplyPro #0934 matches #0921 exactly", timestamp: "18 mins ago", read: false },
  { id: "n3", type: "error", title: "Workflow failed", description: "TechnoVendor escalation workflow encountered an error", timestamp: "1 hr ago", read: false },
  { id: "n4", type: "success", title: "Batch processing complete", description: "18 of 24 invoices processed without issues", timestamp: "2 hrs ago", read: true },
  { id: "n5", type: "info", title: "New vendor added", description: "CloudServe renewed annual contract", timestamp: "Yesterday", read: true },
];

// Simulated API fetch (replace with real API calls)
export const api = {
  getOverview: () => Promise.resolve(overviewMetrics),
  getSpendData: () => Promise.resolve(monthlySpendData),
  getVendorSpend: () => Promise.resolve(vendorSpendData),
  getAlerts: () => Promise.resolve(anomalyAlerts),
  getInvoices: () => Promise.resolve(recentInvoices),
  getInsights: () => Promise.resolve(aiInsights),
  getWorkflows: () => Promise.resolve(workflowJobs),
  getNotifications: () => Promise.resolve(notifications),
};
