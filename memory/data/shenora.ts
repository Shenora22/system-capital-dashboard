export type AgentRecord = {
  name: string;
  status: 'running' | 'idle' | 'error' | 'paused';
  focus: string;
  cadence: string;
  nextRun: string;
  queue: string;
};

export const agentRoster: AgentRecord[] = [
  {
    name: "Growth Agent",
    status: "running",
    focus: "Pipeline expansion & outbound personalization",
    cadence: "Every 15 min",
    nextRun: "14:58 CDT",
    queue: "4 queued",
  },
  {
    name: "Research Agent",
    status: "running",
    focus: "Macro + thematic memos",
    cadence: "Live",
    nextRun: "Streaming",
    queue: "1 queued",
  },
  {
    name: "Newsletter Agent",
    status: "idle",
    focus: "Weekend macro brief",
    cadence: "Daily 17:00",
    nextRun: "17:00 CDT",
    queue: "0 queued",
  },
  {
    name: "Social Media Agent",
    status: "running",
    focus: "Clips + callouts",
    cadence: "Every 30 min",
    nextRun: "15:10 CDT",
    queue: "2 queued",
  },
  {
    name: "Monitoring Agent",
    status: "error",
    focus: "Ops guardrails & alerts",
    cadence: "Continuous",
    nextRun: "Retrying",
    queue: "6 queued",
  },
];

export const agentActivityLog = [
  { time: "06:45", agent: "Research Agent", task: "Content Engine workflow scheduled", result: "Daily 06:45 CDT run active" },
  { time: "06:47", agent: "Social Media Agent", task: "Queued Morning Macro Insight", result: "08:15 CDT slot locked" },
  { time: "06:48", agent: "Social Media Agent", task: "Queued Evening Market Observation", result: "19:30 CDT slot locked" },
  { time: "06:50", agent: "Social Media Agent", task: "Liquidity Signal Thread", result: "Needs Review before publishing" },
  { time: "06:52", agent: "Newsletter Agent", task: "Weekly Liquidity Brief", result: "Needs Review" },
  { time: "14:52", agent: "Growth Agent", task: "Synced 3 new venture leads", result: "Pushed to CRM" },
  { time: "14:49", agent: "Monitoring Agent", task: "Flagged liquidity drift", result: "Escalated to Ops" },
  { time: "14:45", agent: "Research Agent", task: "Refined EM energy memo", result: "Marked ready" },
  { time: "14:41", agent: "Social Media Agent", task: "Queued FOMC clip", result: "Scheduled" },
  { time: "14:36", agent: "Growth Agent", task: "Updated outbound sequences", result: "Live" },
  { time: "14:30", agent: "Newsletter Agent", task: "Drafted intro paragraph", result: "Needs review" },
  { time: "14:24", agent: "Research Agent", task: "Summarized IMF remarks", result: "Posted to vault" },
  { time: "14:19", agent: "Growth Agent", task: "Scored inbound partner lead", result: "Approved" },
  { time: "14:15", agent: "Monitoring Agent", task: "Heartbeat check", result: "Stable" },
  { time: "14:12", agent: "Social Media Agent", task: "Published liquidity thread", result: "Success" },
  { time: "14:05", agent: "Research Agent", task: "Parsed ECB minutes", result: "Added bullets" },
  { time: "13:58", agent: "Growth Agent", task: "Synced pipeline dashboard", result: "Completed" },
  { time: "13:52", agent: "Monitoring Agent", task: "Reset alert threshold", result: "Stored" },
  { time: "13:48", agent: "Social Media Agent", task: "Generated carousel copy", result: "Awaiting media" },
  { time: "13:42", agent: "Newsletter Agent", task: "Collected charts", result: "3 assets" },
  { time: "13:36", agent: "Research Agent", task: "Ran CTA sentiment sweep", result: "Logged" },
  { time: "13:30", agent: "Growth Agent", task: "Pulled NRR cohort", result: "Attached" },
  { time: "13:25", agent: "Social Media Agent", task: "Drafted LinkedIn hook", result: "Approved" },
  { time: "13:18", agent: "Monitoring Agent", task: "Cleared stale webhook", result: "Success" },
  { time: "13:12", agent: "Research Agent", task: "Tagged geopolitics brief", result: "Filed" },
];

export const networkActivityFeed = [
  { time: "14:52", title: "Growth Agent synced venture leads", detail: "3 contacts pushed to CRM" },
  { time: "14:49", title: "Monitoring Agent flagged liquidity drift", detail: "Escalated to Ops" },
  { time: "14:45", title: "System Capital energy drill armed", detail: "Awaiting Brent tape" },
  { time: "14:41", title: "Pulse Social queued FOMC clip", detail: "Scheduled for 15:05" },
  { time: "14:36", title: "Atlas Research imported IMF remarks", detail: "Summary ready" },
];

export type WorkflowStatus = {
  name: string;
  status: 'running' | 'queued' | 'snoozed' | 'blocked' | 'scheduled';
  detail: string;
  lastRun: string;
};

export const workflowStatuses: WorkflowStatus[] = [
  {
    name: "System Capital Content Engine",
    status: "scheduled",
    detail: "Daily 06:45 CDT",
    lastRun: "--",
  },
  {
    name: "Signal publish → Slack brief",
    status: "running",
    detail: "Next dispatch in 12 min",
    lastRun: "14:52",
  },
  {
    name: "Macro data ingestion",
    status: "queued",
    detail: "Waiting for APAC econ releases",
    lastRun: "14:15",
  },
  {
    name: "Portfolio rebalance trigger",
    status: "snoozed",
    detail: "Paused until volatility < 18",
    lastRun: "13:05",
  },
  {
    name: "Compliance attest",
    status: "blocked",
    detail: "Legal review pending",
    lastRun: "--",
  },
];

export const signalFeed = [
  {
    category: "Liquidity",
    headline: "Treasury buybacks oversubscribed",
    detail: "ON RRP usage falls another $18B",
    confidence: 82,
    timestamp: "14:52",
  },
  {
    category: "Energy",
    headline: "Refinery restarts flatten Brent curve",
    detail: "Curve compression removes upside risk",
    confidence: 63,
    timestamp: "14:15",
  },
  {
    category: "Credit",
    headline: "HY ETF flows flip positive",
    detail: "First positive print in three sessions",
    confidence: 70,
    timestamp: "13:58",
  },
  {
    category: "Macro",
    headline: "ECB minutes lean dovish",
    detail: "Markets pricing 28 bps by June",
    confidence: 68,
    timestamp: "13:40",
  },
];
