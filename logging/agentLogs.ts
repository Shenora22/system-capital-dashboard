export type AgentLogStatus = "info" | "ok" | "error";

export type ServerAgentLogEntry = {
  timestamp: string;
  agent: string;
  action: string;
  result: string;
  status: AgentLogStatus;
  metadata?: Record<string, unknown>;
};

export function logAgentEvent(entry: Omit<ServerAgentLogEntry, "timestamp">) {
  const logEntry: ServerAgentLogEntry = {
    timestamp: new Date().toISOString(),
    ...entry,
  };

  console.info("[Agent Logs]", logEntry);

  return logEntry;
}
