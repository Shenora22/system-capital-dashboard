export type SystemEventType =
  | "Lead Captured"
  | "Workflow Success"
  | "Workflow Failed"
  | "Payment Received"
  | "Payment Failed"
  | "Agent Action"
  | "Automation Warning";

export type SystemEventStatus = "success" | "failed" | "warning" | "info" | "pending";

export type SystemEventPriority = "low" | "normal" | "high" | "critical";

export type SystemEventPaymentStatus = "not_applicable" | "pending" | "paid" | "failed" | "refunded";

export interface SystemEvent {
  eventType: SystemEventType | string;
  workflowName: string;
  workflowKey: string;
  status: SystemEventStatus | string;
  priority: SystemEventPriority | string;
  timestamp: string;
  leadEmail: string | null;
  clientName: string | null;
  paymentStatus: SystemEventPaymentStatus | string | null;
  errorMessage: string | null;
  errorDetails: string | null;
  sourceSystem: string;
  linkedWorkflow: string | null;
  notes: string | null;
  aiSummary: string | null;
}

export type SystemEventMetrics = {
  total: number;
  failed: number;
  highPriority: number;
  paymentEvents: number;
  successfulWorkflows: number;
  workflowHealthSummary: string;
};

export const systemEventFixtures: SystemEvent[] = [
  {
    eventType: "Lead Captured",
    workflowName: "SC - Lead Intake CORE",
    workflowKey: "lead-intake-core",
    status: "success",
    priority: "normal",
    timestamp: "2026-05-12T14:05:00.000Z",
    leadEmail: "morgan@example.com",
    clientName: "Morgan Lee",
    paymentStatus: "pending",
    errorMessage: null,
    errorDetails: null,
    sourceSystem: "Tally",
    linkedWorkflow: "SC CORE - System Event Logger",
    notes: "Demo-safe fixture. Represents a completed lead intake handoff only.",
    aiSummary: "New lead captured and staged for CRM review.",
  },
  {
    eventType: "Workflow Success",
    workflowName: "SC - Lead Intake CORE",
    workflowKey: "lead-intake-core",
    status: "success",
    priority: "normal",
    timestamp: "2026-05-12T14:08:00.000Z",
    leadEmail: "morgan@example.com",
    clientName: "Morgan Lee",
    paymentStatus: "not_applicable",
    errorMessage: null,
    errorDetails: null,
    sourceSystem: "n8n",
    linkedWorkflow: "SC CORE - System Event Logger",
    notes: "Lead workflow finished all non-payment actions.",
    aiSummary: "Lead intake automation completed without errors.",
  },
  {
    eventType: "Workflow Failed",
    workflowName: "SC - Lead Intake CORE",
    workflowKey: "lead-intake-core",
    status: "failed",
    priority: "high",
    timestamp: "2026-05-12T14:12:00.000Z",
    leadEmail: "casey@example.com",
    clientName: "Casey Morgan",
    paymentStatus: "not_applicable",
    errorMessage: "CRM create page step timed out",
    errorDetails: "HTTP 504 from downstream CRM adapter after validated webhook payload was accepted.",
    sourceSystem: "n8n",
    linkedWorkflow: "SC CORE - System Event Logger",
    notes: "Fixture only. Do not wire until Notion System Events schema is approved.",
    aiSummary: "Lead intake needs operator review because the CRM write did not complete.",
  },
  {
    eventType: "Payment Received",
    workflowName: "Stripe Checkout Monitor",
    workflowKey: "stripe-checkout-monitor",
    status: "success",
    priority: "high",
    timestamp: "2026-05-12T14:18:00.000Z",
    leadEmail: "morgan@example.com",
    clientName: "Morgan Lee",
    paymentStatus: "paid",
    errorMessage: null,
    errorDetails: null,
    sourceSystem: "Stripe",
    linkedWorkflow: "SC CORE - System Event Logger",
    notes: "Read-only event example for a successful checkout notification.",
    aiSummary: "Payment received and ready for manual fulfillment confirmation.",
  },
  {
    eventType: "Payment Failed",
    workflowName: "Stripe Checkout Monitor",
    workflowKey: "stripe-checkout-monitor",
    status: "failed",
    priority: "high",
    timestamp: "2026-05-12T14:22:00.000Z",
    leadEmail: "riley@example.com",
    clientName: "Riley Chen",
    paymentStatus: "failed",
    errorMessage: "Payment method declined",
    errorDetails: "Stripe read-only webhook reported a checkout failure. No payment retry action should run from this scaffold.",
    sourceSystem: "Stripe",
    linkedWorkflow: "SC CORE - System Event Logger",
    notes: "Demo-safe fixture; payment behavior remains manual/review-only.",
    aiSummary: "Payment failed and should be reviewed before any client follow-up.",
  },
  {
    eventType: "Agent Action",
    workflowName: "AI Agent Ops Review",
    workflowKey: "ai-agent-ops-review",
    status: "info",
    priority: "normal",
    timestamp: "2026-05-12T14:30:00.000Z",
    leadEmail: null,
    clientName: null,
    paymentStatus: "not_applicable",
    errorMessage: null,
    errorDetails: null,
    sourceSystem: "AI Agent",
    linkedWorkflow: "SC CORE - System Event Logger",
    notes: "Agent summarized morning automation posture for operator review.",
    aiSummary: "Agent action logged for audit visibility.",
  },
  {
    eventType: "Automation Warning",
    workflowName: "SC - Lead Intake CORE",
    workflowKey: "lead-intake-core",
    status: "warning",
    priority: "critical",
    timestamp: "2026-05-12T14:36:00.000Z",
    leadEmail: null,
    clientName: null,
    paymentStatus: "not_applicable",
    errorMessage: "Webhook retry volume above normal baseline",
    errorDetails: "Three retry attempts observed in the demo telemetry window. Keep production paths unchanged until reviewed.",
    sourceSystem: "n8n",
    linkedWorkflow: "SC CORE - System Event Logger",
    notes: "Escalate to manual workflow review before expanding automation.",
    aiSummary: "Automation warning indicates heartbeat visibility is needed before more workflow expansion.",
  },
];

export const isFailedSystemEvent = (event: SystemEvent) => {
  const text = `${event.status} ${event.eventType} ${event.errorMessage ?? ""}`.toLowerCase();
  return text.includes("fail") || text.includes("error");
};

export const isHighPrioritySystemEvent = (event: SystemEvent) => ["high", "critical"].includes(event.priority.toLowerCase());

export const isPaymentSystemEvent = (event: SystemEvent) => {
  const text = `${event.eventType} ${event.paymentStatus ?? ""} ${event.sourceSystem}`.toLowerCase();
  return text.includes("payment") || text.includes("stripe") || ["paid", "failed", "refunded"].includes((event.paymentStatus ?? "").toLowerCase());
};

export const deriveSystemEventMetrics = (events: SystemEvent[]): SystemEventMetrics => {
  const failed = events.filter(isFailedSystemEvent).length;
  const highPriority = events.filter(isHighPrioritySystemEvent).length;
  const paymentEvents = events.filter(isPaymentSystemEvent).length;
  const successfulWorkflows = events.filter((event) => event.status.toLowerCase() === "success").length;

  return {
    total: events.length,
    failed,
    highPriority,
    paymentEvents,
    successfulWorkflows,
    workflowHealthSummary: failed > 0 ? "Review needed" : highPriority > 0 ? "Watch closely" : "Stable",
  };
};

export const formatSystemEventTime = (timestamp: string) => {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return timestamp;

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
};
