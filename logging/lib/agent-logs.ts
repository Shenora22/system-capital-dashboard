export type AgentLog = {
  id: string;
  timestamp: string;
  agent: string;
  action: string;
  result: string;
  status: string;
  source?: "notion" | "fallback";
  url?: string;
};

export type LogsResponse = {
  logs: AgentLog[];
  source: "notion" | "fallback" | "not-configured" | "error";
  message?: string;
  updatedAt: string;
};

export const fallbackAgentLogs: AgentLog[] = [
  {
    id: "fallback-1",
    timestamp: "14:52",
    agent: "Growth Agent",
    action: "Synced 3 new venture leads",
    result: "Pushed to CRM",
    status: "Success",
    source: "fallback",
  },
  {
    id: "fallback-2",
    timestamp: "14:49",
    agent: "Monitoring Agent",
    action: "Flagged liquidity drift",
    result: "Escalated to Ops",
    status: "Warning",
    source: "fallback",
  },
  {
    id: "fallback-3",
    timestamp: "14:45",
    agent: "Research Agent",
    action: "Refined EM energy memo",
    result: "Marked ready",
    status: "Success",
    source: "fallback",
  },
  {
    id: "fallback-4",
    timestamp: "14:41",
    agent: "Social Media Agent",
    action: "Queued FOMC clip",
    result: "Scheduled",
    status: "Queued",
    source: "fallback",
  },
  {
    id: "fallback-5",
    timestamp: "14:30",
    agent: "Newsletter Agent",
    action: "Drafted intro paragraph",
    result: "Needs review",
    status: "Review",
    source: "fallback",
  },
];

export const isProblemStatus = (status: string, result = "") => {
  const text = `${status} ${result}`.toLowerCase();
  return ["error", "fail", "failed", "blocked", "warning", "escalated"].some((term) => text.includes(term));
};

export const formatLogTime = (timestamp: string) => {
  if (!timestamp) return "Unknown time";
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return timestamp;

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
};

export const deriveLogMetrics = (logs: AgentLog[]) => {
  const activeAgents = new Set(logs.map((log) => log.agent).filter(Boolean)).size;
  const attentionItems = logs.filter((log) => isProblemStatus(log.status, log.result)).length;
  const successfulRuns = logs.filter((log) => !isProblemStatus(log.status, log.result)).length;
  const queuedItems = logs.filter((log) => `${log.status} ${log.result}`.toLowerCase().includes("queue")).length;

  return {
    activeAgents,
    attentionItems,
    successfulRuns,
    queuedItems,
    totalLogs: logs.length,
    health: logs.length === 0 ? "No telemetry" : attentionItems > 0 ? "Needs review" : "Operational",
  };
};
