export type AgentHealth = "Online" | "Training" | "Degraded" | "Queued";
export type WorkflowStatus = "Live" | "Draft" | "Review";
export type LogLevel = "Info" | "Success" | "Warning";

export const navItems = [
  { label: "Operations Center", href: "#operations" },
  { label: "Agent Registry", href: "#agents" },
  { label: "Prompt Library", href: "#prompts" },
  { label: "Workflow Architecture", href: "#architecture" },
  { label: "Founder Dashboard", href: "#founder" },
  { label: "Status Tracker", href: "#status" },
  { label: "Development Log", href: "#logs" },
  { label: "System Reports", href: "#reports" },
];

export const opsMetrics = [
  { label: "AI workforce uptime", value: "99.2%", delta: "+1.8%", detail: "Across active agents" },
  { label: "Automations executed", value: "18,420", delta: "+24%", detail: "Last 30 days" },
  { label: "Human hours reclaimed", value: "742", delta: "+116", detail: "Founder + ops leverage" },
  { label: "Revenue leaks flagged", value: "38", delta: "12 urgent", detail: "Needs operator review" },
];

export const agents = [
  { id: "ALR-001", name: "Alora Prime", role: "Executive AI operator", owner: "Founder Office", health: "Online" as AgentHealth, workflow: "Command routing", lastRun: "2 min ago" },
  { id: "REV-014", name: "Revenue Sentinel", role: "Pipeline leak detection", owner: "Growth", health: "Online" as AgentHealth, workflow: "CRM + alerts", lastRun: "8 min ago" },
  { id: "OPS-022", name: "Ops Architect", role: "n8n workflow builder", owner: "Automation", health: "Training" as AgentHealth, workflow: "Workflow QA", lastRun: "21 min ago" },
  { id: "RPT-009", name: "Board Reporter", role: "Weekly reporting", owner: "Finance", health: "Queued" as AgentHealth, workflow: "Report generation", lastRun: "1 hr ago" },
  { id: "SGN-117", name: "Signal Scout", role: "Market + risk signals", owner: "Research", health: "Degraded" as AgentHealth, workflow: "Signal engine", lastRun: "12 min ago" },
];

export const prompts = [
  { title: "Founder Briefing", type: "Executive", version: "v3.4", tokens: "1.8k", useCase: "Daily narrative, blockers, priorities" },
  { title: "Lead Recovery Agent", type: "Growth", version: "v2.1", tokens: "2.6k", useCase: "Recover stale opportunities with contextual follow-up" },
  { title: "Workflow Builder Spec", type: "Automation", version: "v1.9", tokens: "3.1k", useCase: "Convert SOPs into n8n/OpenClaw-ready steps" },
  { title: "Investor Report Voice", type: "Reports", version: "v4.0", tokens: "1.2k", useCase: "Premium board-level reporting tone" },
];

export const workflows = [
  { name: "Lead Capture to Alora Triage", status: "Live" as WorkflowStatus, nodes: 18, integration: "Webhooks → CRM → Slack → Alora", sla: "< 45 sec" },
  { name: "Revenue Leak Detection", status: "Live" as WorkflowStatus, nodes: 24, integration: "CRM → Supabase → OpenAI → Founder Digest", sla: "15 min" },
  { name: "Founder Daily Brief", status: "Review" as WorkflowStatus, nodes: 12, integration: "Calendar → Email → Tasks → Report", sla: "7:00 AM" },
  { name: "OpenClaw Agent Sandbox", status: "Draft" as WorkflowStatus, nodes: 9, integration: "Agent runtime → Test logs → QA queue", sla: "Manual" },
];

export const founderMetrics = [
  { label: "Strategic focus score", value: "91", note: "More founder time on decisions, less on admin" },
  { label: "Blocked workflows", value: "4", note: "Awaiting credentials or final approval" },
  { label: "Next best action", value: "Approve", note: "Revenue Sentinel recovery sequence" },
];

export const statusTracks = [
  { agent: "Alora Prime", progress: 94, status: "Online" as AgentHealth, task: "Routing executive priorities" },
  { agent: "Revenue Sentinel", progress: 88, status: "Online" as AgentHealth, task: "Scanning stale opportunities" },
  { agent: "Ops Architect", progress: 62, status: "Training" as AgentHealth, task: "Learning workflow approval rules" },
  { agent: "Signal Scout", progress: 41, status: "Degraded" as AgentHealth, task: "Waiting on market data connector" },
];

export const developmentLogs = [
  { time: "14:06 UTC", level: "Success" as LogLevel, source: "n8n adapter", message: "Lead Capture workflow validated against mock webhook payload." },
  { time: "13:42 UTC", level: "Info" as LogLevel, source: "Prompt library", message: "Founder Briefing prompt promoted to v3.4 with sharper decision framing." },
  { time: "12:18 UTC", level: "Warning" as LogLevel, source: "OpenClaw sandbox", message: "Agent runtime requires credential mapping before production handoff." },
  { time: "11:55 UTC", level: "Success" as LogLevel, source: "Reports", message: "Weekly board report generated with operational metrics and agent deltas." },
];

export const reports = [
  { title: "Weekly AI Workforce Report", cadence: "Friday", audience: "Founder + leadership", confidence: "High", status: "Ready" },
  { title: "Revenue Recovery Brief", cadence: "Daily", audience: "Growth", confidence: "Medium", status: "Needs approval" },
  { title: "Automation Health Audit", cadence: "Monthly", audience: "Ops", confidence: "High", status: "Scheduled" },
];

export const integrationBacklog = ["n8n webhook registry", "OpenClaw agent runtime", "Supabase event ledger", "Slack/Email command approvals"];
