export type RoadmapChecklistItem = {
  id: string;
  label: string;
  owner: string;
  status: "todo" | "in-progress" | "done";
  priority: "critical" | "high" | "medium";
};

export type RoadmapPhase = {
  id: string;
  name: string;
  timeline: string;
  status: "current" | "next" | "queued" | "complete";
  progress: number;
  objective: string;
  deliverables: string[];
};

export type ProgressTrack = {
  label: string;
  progress: number;
  detail: string;
};

export const missionControlRoadmap = {
  currentPhase: {
    label: "Phase 2",
    title: "Operational Command Layer",
    progress: 68,
    summary:
      "Turn System Capital from a beautiful dashboard into a daily execution cockpit for revenue, automation, agent oversight, and launch sequencing.",
    checkpoint: "Ship the operational roadmap, connect live Agent Logs, and keep focus on revenue-producing automation before expanding new surfaces.",
  },
  dailyFocus: [
    "Stabilize dashboard + command center as the single source of truth.",
    "Convert roadmap priorities into executable agent and automation tasks.",
    "Keep founder attention on revenue workflows, client demos, and blocked integrations.",
  ],
  revenuePriorities: [
    { label: "Close private beta design partners", value: "$25k", detail: "Target committed pilots before adding more feature scope." },
    { label: "Package AI automation audits", value: "3 offers", detail: "Turn current workflow map into a sellable diagnostic." },
    { label: "Reactivate warm operator leads", value: "12 leads", detail: "Use Agent Logs + CRM notes to trigger contextual follow-up." },
  ],
  criticalTasks: [
    { id: "task-agent-logs", label: "Verify Notion Agent Logs in production with server-only token", owner: "Ops", status: "in-progress", priority: "critical" },
    { id: "task-command-center", label: "Route daily operator review through Command Center", owner: "Founder", status: "in-progress", priority: "critical" },
    { id: "task-revenue", label: "Draft beta revenue offer and demo script", owner: "Revenue", status: "todo", priority: "high" },
    { id: "task-automation", label: "Identify top 3 n8n automations to harden", owner: "Automation", status: "todo", priority: "high" },
  ] satisfies RoadmapChecklistItem[],
  blockers: [
    { id: "blocker-notion", label: "Production Notion integration access must include the Agent Logs data source", owner: "Ops", status: "todo", priority: "critical" },
    { id: "blocker-secrets", label: "Confirm Vercel env vars for NOTION_TOKEN and NOTION_DATA_SOURCE_ID", owner: "Deployment", status: "todo", priority: "critical" },
    { id: "blocker-owner", label: "Assign one owner for daily roadmap grooming", owner: "Founder", status: "in-progress", priority: "medium" },
  ] satisfies RoadmapChecklistItem[],
  completedWins: [
    { id: "win-dashboard", label: "Dashboard and Command Center unified on the premium System Capital UI", owner: "Product", status: "done", priority: "high" },
    { id: "win-routes", label: "Open Module routes now resolve for operations, agents, automation, signals, deployment, and prompts", owner: "Engineering", status: "done", priority: "high" },
    { id: "win-api", label: "Server-side Agent Logs API added without exposing NOTION_TOKEN", owner: "Engineering", status: "done", priority: "critical" },
  ] satisfies RoadmapChecklistItem[],
  automationProgress: [
    { label: "Agent Logs ingestion", progress: 72, detail: "API route and dashboard feed are live; production token/access validation remains." },
    { label: "n8n workflow hardening", progress: 48, detail: "Prioritize the workflows that directly support lead capture, follow-up, and reporting." },
    { label: "Agent operating loops", progress: 57, detail: "Registry UI exists; next step is tying checklist outcomes to agent actions." },
    { label: "Prompt governance", progress: 36, detail: "Placeholder is ready; defer full library until revenue loops are active." },
  ] satisfies ProgressTrack[],
  droneRoadmap: [
    { id: "drone-map", label: "Map intelligence demo narrative", owner: "Drone", status: "in-progress", priority: "medium" },
    { id: "drone-data", label: "Define telemetry data contract and ingest source", owner: "Drone", status: "todo", priority: "medium" },
    { id: "drone-pilot", label: "Package first pilot use case after core dashboard stabilizes", owner: "Founder", status: "todo", priority: "medium" },
  ] satisfies RoadmapChecklistItem[],
  roadmapPhases: [
    {
      id: "phase-1",
      name: "Foundation",
      timeline: "Complete",
      status: "complete",
      progress: 100,
      objective: "Establish the premium System Capital interface, core routes, and design language.",
      deliverables: ["Dashboard shell", "Module navigation", "Dark glass design system"],
    },
    {
      id: "phase-2",
      name: "Operational Command Layer",
      timeline: "Now",
      status: "current",
      progress: 68,
      objective: "Make the product useful every day for execution, roadmap focus, and AI operations review.",
      deliverables: ["Mission Control roadmap", "Agent Logs feed", "Critical task ownership"],
    },
    {
      id: "phase-3",
      name: "Revenue Automation",
      timeline: "Next",
      status: "next",
      progress: 34,
      objective: "Convert operational visibility into repeatable revenue workflows and beta conversion loops.",
      deliverables: ["Lead recovery automation", "Demo script", "Offer tracker"],
    },
    {
      id: "phase-4",
      name: "Expansion Surfaces",
      timeline: "Queued",
      status: "queued",
      progress: 18,
      objective: "Expand prompts, deployment intelligence, and drone app workflows after core operating loops prove value.",
      deliverables: ["Prompt library", "Deployment gates", "Drone telemetry roadmap"],
    },
  ] satisfies RoadmapPhase[],
  doNotBuildYet: [
    "A full prompt marketplace before revenue workflows are validated.",
    "Complex multi-tenant permissions before design partners are active.",
    "Drone app production infrastructure before the demo narrative and telemetry contract are approved.",
    "Additional dashboards that duplicate Mission Control, Command Center, or Automation views.",
  ],
};
