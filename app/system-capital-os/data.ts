export type AgentHealth = "Online" | "Training" | "Degraded" | "Queued";
export type WorkflowStatus = "Live" | "Draft" | "Review";
export type LogLevel = "Info" | "Success" | "Warning";
export type OperatingStatus = "Ready" | "Needs Review" | "Manual" | "Planned" | "Connected";

export const navItems = [
  { label: "Operations Center", href: "#operations" },
  { label: "Operating Backbone", href: "#backbone" },
  { label: "CRM + Lead Intake", href: "#crm" },
  { label: "Agent Registry", href: "#agents" },
  { label: "Prompt Library", href: "#prompts" },
  { label: "Workflow Architecture", href: "#architecture" },
  { label: "Workflow Governance", href: "#workflow-governance" },
  { label: "Founder Dashboard", href: "#founder" },
  { label: "Status Tracker", href: "#status" },
  { label: "Development Log", href: "#logs" },
  { label: "System Events", href: "#system-events" },
  { label: "System Reports", href: "#reports" },
  { label: "Payments", href: "#payments" },
  { label: "Build Rules", href: "#build-rules" },
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

export const operatingBackbone = [
  {
    area: "CRM",
    owner: "Growth",
    status: "Needs Review" as OperatingStatus,
    source: "Tally lead payloads + future CRM records",
    nextConnection: "Map accepted leads to account, contact, package, owner, and next action fields.",
  },
  {
    area: "Lead Intake",
    owner: "Automation",
    status: "Connected" as OperatingStatus,
    source: "Next.js Tally API route → n8n webhook",
    nextConnection: "Add delivery audit rows to the system event ledger without changing the production webhook.",
  },
  {
    area: "Workflow Registry",
    owner: "Ops",
    status: "Ready" as OperatingStatus,
    source: "Checked-in n8n workflow JSON + human specs",
    nextConnection: "Attach workflow IDs, SLA, credential owner, and rollback notes from Notion when available.",
  },
  {
    area: "AI Agents Registry",
    owner: "Founder Office",
    status: "Ready" as OperatingStatus,
    source: "Dashboard fixtures + Agent Logs",
    nextConnection: "Bind each agent to prompts, workflow IDs, approval policies, and live health signals.",
  },
  {
    area: "System Event Logging",
    owner: "Engineering",
    status: "Planned" as OperatingStatus,
    source: "Agent Logs API fallback now; Supabase ledger later",
    nextConnection: "Persist normalized events for lead intake, workflow runs, agent actions, payment events, and incidents.",
  },
  {
    area: "Stripe / Payments",
    owner: "Finance",
    status: "Manual" as OperatingStatus,
    source: "Payment links in lead routing",
    nextConnection: "Add read-only Stripe event mirror after products, links, and webhook signing are reviewed.",
  },
];

export const crmStages = [
  { stage: "New lead", trigger: "Tally FORM_RESPONSE accepted", owner: "Growth", automationSafeRule: "Do not overwrite raw submission fields." },
  { stage: "Qualified", trigger: "Package, budget, timeline, and business need confirmed", owner: "Founder Office", automationSafeRule: "Require human review before proposal generation." },
  { stage: "Payment / booking", trigger: "Starter or Pro gets Stripe link; Custom Build gets booking link", owner: "Finance", automationSafeRule: "Never auto-charge or edit Stripe products from the dashboard." },
  { stage: "Onboarding", trigger: "Payment confirmed or call booked", owner: "Ops", automationSafeRule: "Create tasks and docs only after source-of-truth confirmation." },
];

export const paymentTracks = [
  { name: "Starter Automation Audit", source: "Stripe payment link", status: "Manual" as OperatingStatus, review: "Confirm link, product, tax, and fulfillment handoff before exposing live metrics." },
  { name: "Pro Automation Audit", source: "Stripe payment link", status: "Manual" as OperatingStatus, review: "Confirm fulfillment capacity and refund procedure before automation expansion." },
  { name: "Custom Build", source: "Booking link", status: "Ready" as OperatingStatus, review: "Track booked calls separately from paid invoices until contract terms are final." },
];

export const systemHealthChecks = [
  { name: "Lead webhook path", state: "Connected" as OperatingStatus, detail: "Keep production path stable; validate with existing workflow scripts before publishing." },
  { name: "Agent Logs", state: "Ready" as OperatingStatus, detail: "Dashboard uses Notion when configured and safe fallback fixtures otherwise." },
  { name: "Workflow backups", state: "Ready" as OperatingStatus, detail: "Checked-in n8n JSON and backup scripts remain the recoverable source for automation changes." },
  { name: "Payment telemetry", state: "Planned" as OperatingStatus, detail: "Prepare read-only event ingestion before adding any write-capable Stripe integration." },
];

export const buildRules = [
  "Stabilize before expanding; do not rebuild working production workflows.",
  "Use checked-in fixtures and adapter boundaries until live credentials are reviewed.",
  "Prefer improving existing pages, routes, and workflow assets instead of duplicating systems.",
  "Keep Notion, n8n, and Stripe changes manual until source-of-truth ownership is confirmed.",
  "Document every new operating surface with owner, data source, next connector, and do-not-touch rule.",
];


export const workflowGovernanceRules = [
  {
    rule: "Preserve production paths",
    owner: "Automation",
    checkpoint: "Confirm webhook path, active n8n workflow, rollback file, and credential owner before edits.",
  },
  {
    rule: "Document before connecting",
    owner: "Ops",
    checkpoint: "Every workflow needs purpose, trigger, data touched, human approval point, and failure notification route.",
  },
  {
    rule: "Read-only first",
    owner: "Engineering",
    checkpoint: "New connectors should observe current state before adding write actions or side effects.",
  },
  {
    rule: "One source of truth",
    owner: "Founder Office",
    checkpoint: "Avoid duplicate registries; link dashboard cards to the approved registry or adapter once available.",
  },
];

export const systemEventBlueprint = [
  { field: "eventId", purpose: "Stable unique identifier for audit and replay." },
  { field: "eventType", purpose: "Lead, workflow_run, agent_action, payment_event, incident, or manual_review." },
  { field: "source", purpose: "Origin system such as dashboard, Tally route, n8n, Notion, Stripe, or Supabase." },
  { field: "owner", purpose: "Human or team responsible for the next action." },
  { field: "severity", purpose: "Info, success, warning, blocked, or critical for triage." },
  { field: "relatedRecord", purpose: "Optional lead, workflow, agent, payment, or issue reference." },
  { field: "nextAction", purpose: "Plain-language operator handoff without triggering writes automatically." },
];
