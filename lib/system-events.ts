export type SystemEventStatus = "Success" | "Failed" | "Warning" | "Pending";

export type SystemEventPriority = "Low" | "Normal" | "High" | "Critical";

export type SystemEvent = {
  id: string;
  eventType: string;
  workflowName: string;
  workflowKey: string;
  status: SystemEventStatus;
  priority: SystemEventPriority;
  timestamp: string;
  leadEmail?: string;
  clientName?: string;
  sourceSystem: string;
  notes?: string;
  errorMessage?: string;
  aiSummary?: string;
};

export const leadIntakeWorkflowName = "SC - Lead Intake CORE";
export const leadIntakeWorkflowKey = "SC CORE";

export const leadIntakeSystemEvents: SystemEvent[] = [
  {
    id: "sc-lead-intake-evt-001",
    eventType: "Lead Captured",
    workflowName: leadIntakeWorkflowName,
    workflowKey: leadIntakeWorkflowKey,
    status: "Success",
    priority: "Normal",
    timestamp: "2026-05-12T14:35:00.000Z",
    leadEmail: "morgan@example.com",
    clientName: "Morgan Lee",
    sourceSystem: "n8n",
    notes: "Lead successfully captured and written to CRM.",
    aiSummary: "New lead captured through the lead intake workflow.",
  },
  {
    id: "sc-lead-intake-evt-002",
    eventType: "Lead Validation Passed",
    workflowName: leadIntakeWorkflowName,
    workflowKey: leadIntakeWorkflowKey,
    status: "Success",
    priority: "Normal",
    timestamp: "2026-05-12T14:34:12.000Z",
    leadEmail: "morgan@example.com",
    clientName: "Morgan Lee",
    sourceSystem: "n8n",
    notes: "Required lead fields were present and email format validated.",
    aiSummary: "Lead passed validation and moved to CRM write.",
  },
  {
    id: "sc-lead-intake-evt-003",
    eventType: "Telegram Alert Sent",
    workflowName: leadIntakeWorkflowName,
    workflowKey: leadIntakeWorkflowKey,
    status: "Success",
    priority: "Normal",
    timestamp: "2026-05-12T14:35:24.000Z",
    leadEmail: "morgan@example.com",
    clientName: "Morgan Lee",
    sourceSystem: "n8n",
    notes: "Telegram notification sent after successful CRM write.",
    aiSummary: "Operator alert was delivered for the new lead.",
  },
  {
    id: "sc-lead-intake-evt-004",
    eventType: "CRM Write Success",
    workflowName: leadIntakeWorkflowName,
    workflowKey: leadIntakeWorkflowKey,
    status: "Success",
    priority: "Normal",
    timestamp: "2026-05-12T14:34:58.000Z",
    leadEmail: "morgan@example.com",
    clientName: "Morgan Lee",
    sourceSystem: "n8n",
    notes: "Notion CRM lead record created successfully.",
    aiSummary: "Lead record exists in CRM and is ready for follow-up.",
  },
  {
    id: "sc-lead-intake-evt-005",
    eventType: "Lead Validation Failed",
    workflowName: leadIntakeWorkflowName,
    workflowKey: leadIntakeWorkflowKey,
    status: "Failed",
    priority: "High",
    timestamp: "2026-05-12T13:08:10.000Z",
    leadEmail: "",
    clientName: "Unknown lead",
    sourceSystem: "n8n",
    notes: "Incoming lead payload was missing the required email field.",
    errorMessage: "Validation failed: email is required before CRM write.",
    aiSummary: "A lead intake submission was rejected before touching CRM.",
  },
  {
    id: "sc-lead-intake-evt-006",
    eventType: "Workflow Failed",
    workflowName: leadIntakeWorkflowName,
    workflowKey: leadIntakeWorkflowKey,
    status: "Failed",
    priority: "Critical",
    timestamp: "2026-05-12T12:42:44.000Z",
    leadEmail: "taylor@example.com",
    clientName: "Taylor Reed",
    sourceSystem: "n8n",
    notes: "Workflow stopped before operator notification completed.",
    errorMessage: "Telegram node returned a credential or chat delivery error.",
    aiSummary: "Lead workflow needs manual review because an alert step failed.",
  },
];

export const sortSystemEventsByNewest = (events: SystemEvent[]) =>
  [...events].sort((left, right) => new Date(right.timestamp).getTime() - new Date(left.timestamp).getTime());

export const isFailedSystemEvent = (event: SystemEvent) => event.status === "Failed" || Boolean(event.errorMessage);

export const formatSystemEventTime = (timestamp: string) =>
  new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(timestamp));

export const deriveLeadIntakeEventMetrics = (events: SystemEvent[], now = new Date()) => {
  const sortedEvents = sortSystemEventsByNewest(events);
  const leadEvents = sortedEvents.filter((event) => event.workflowName === leadIntakeWorkflowName);
  const failedEvents = leadEvents.filter(isFailedSystemEvent);
  const todayKey = now.toISOString().slice(0, 10);
  const eventsToday = leadEvents.filter((event) => event.timestamp.slice(0, 10) === todayKey).length;
  const lastLeadCaptured = leadEvents.find((event) => event.eventType === "Lead Captured");
  const lastFailure = failedEvents[0];

  return {
    totalEvents: leadEvents.length,
    eventsToday,
    failedEvents,
    lastLeadCaptured,
    lastFailure,
    health: failedEvents.some((event) => event.priority === "Critical") ? "Review" : "Stable",
  };
};
