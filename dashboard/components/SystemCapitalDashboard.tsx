"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  AgentLog,
  LogsResponse,
  deriveLogMetrics,
  fallbackAgentLogs,
  formatLogTime,
  isProblemStatus,
} from "@/logging/lib/agent-logs";
import { agentRoster, signalFeed, workflowStatuses } from "@/memory/data/shenora";
import {
  deriveSystemEventMetrics,
  formatSystemEventTime,
  isFailedSystemEvent,
  isHighPrioritySystemEvent,
  isPaymentSystemEvent,
  systemEventFixtures,
} from "@/logging/lib/system-events";
import {
  deriveLeadIntakeEventMetrics,
  leadIntakeSystemEvents,
  sortSystemEventsByNewest,
} from "@/lib/system-events";

type RoadmapTrack = {
  title: string;
  priority: string;
  status: string;
  milestones: string[];
  blockers: string[];
  dependencies: string[];
  revenueCheckpoints: string[];
};

const roadmapTracks: RoadmapTrack[] = [
  {
    title: "Growth & Revenue",
    priority: "Critical",
    status: "In Progress",
    milestones: ["Close 3 beta design partners", "Launch AI automation audit offer", "Reactivate 12 warm leads"],
    blockers: ["Demo script not finalized", "Pricing page pending"],
    dependencies: ["CRM integration", "Lead capture pipeline"],
    revenueCheckpoints: ["$25k committed pilots", "3 packaged audit offers sold"],
  },
  {
    title: "AI Automation Ops",
    priority: "Critical",
    status: "In Progress",
    milestones: ["Harden top 3 n8n workflows", "Agent Logs connected in production", "Command Center as daily cockpit"],
    blockers: ["NOTION_TOKEN not in Vercel env", "n8n webhook env vars pending"],
    dependencies: ["Notion integration", "n8n local runtime"],
    revenueCheckpoints: ["Automation audit deliverable ready", "Agent uptime >95%"],
  },
  {
    title: "Dashboard & Command",
    priority: "High",
    status: "In Progress",
    milestones: ["All module routes live", "Agent Logs feed active", "Roadmap groomed weekly"],
    blockers: ["Agent log owner assignment pending"],
    dependencies: ["Notion API", "Supabase optional"],
    revenueCheckpoints: ["Demo-ready dashboard for partner calls"],
  },
  {
    title: "Content & Social",
    priority: "Medium",
    status: "Queued",
    milestones: ["Newsletter pipeline live", "Social posting automation", "Content calendar system"],
    blockers: ["X API OAuth pending", "Brand voice pack in review"],
    dependencies: ["Beehiiv", "n8n social adapter"],
    revenueCheckpoints: ["500 newsletter subscribers", "Consistent inbound from content"],
  },
  {
    title: "Drone Operations",
    priority: "Low",
    status: "Queued",
    milestones: ["Map intelligence demo narrative", "Telemetry data contract defined", "Pilot use case packaged"],
    blockers: ["Core dashboard must stabilize first"],
    dependencies: ["Telemetry ingest source", "Drone data contract"],
    revenueCheckpoints: ["First drone pilot engagement signed"],
  },
];

const navItems = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Command Center", href: "/command-center" },
  { label: "System OS", href: "/system-capital-os" },
  { label: "Operations", href: "/operations" },
  { label: "Agents", href: "/agents" },
  { label: "Automation", href: "/automation" },
  { label: "Signals", href: "/signals" },
  { label: "SkyTrace", href: "/drone" },
  { label: "Deployment", href: "/deployment" },
  { label: "Prompts", href: "/prompts" },
  { label: "Brand Kit", href: "/brand-kit" },
];

const moduleDefinitions = [
  { title: "AI Operations Center", href: "/operations", key: "operations", detail: "Live operating queue, incidents, and owner handoffs." },
  { title: "System OS Backbone", href: "/system-capital-os#backbone", key: "backbone", detail: "Source map for CRM, workflows, agents, logs, payments, and health." },
  { title: "CRM + Lead Intake", href: "/system-capital-os#crm", key: "crm", detail: "Lead stages, ownership, handoffs, and automation-safe operating rules." },
  { title: "Agent Registry", href: "/agents", key: "agents", detail: "Inspect autonomous workers, run tests, and view logs." },
  { title: "Workflow Architecture", href: "/automation", key: "automation", detail: "n8n workflow state, runbooks, and SLA controls." },
  { title: "Workflow Governance", href: "/system-capital-os#workflow-governance", key: "governance", detail: "Production-safe rules for workflow changes, documentation, and read-only-first adapters." },
  { title: "System Event Logs", href: "/system-capital-os#logs", key: "logs", detail: "Development and runtime event ledger prepared for persistent storage." },
  { title: "SkyTrace Mission Control", href: "/drone", key: "skytrace", detail: "AI mission control for autonomous drone operations, mapped into the shared System Events observability model." },
  { title: "Signal Engine", href: "/signals", key: "signals", detail: "Macro, risk, liquidity, and operational signal board." },
  { title: "Deployment Status", href: "/deployment", key: "deployment", detail: "Release surfaces, environment readiness, and blockers." },
  { title: "Payments", href: "/system-capital-os#payments", key: "payments", detail: "Read-only Stripe/payment routing preparation and manual review notes." },
  { title: "System Health", href: "/system-capital-os#health", key: "health", detail: "Automation-safe readiness checks for webhooks, logs, backups, and payments." },
  { title: "Prompt Intelligence", href: "/prompts", key: "prompts", detail: "Prompt packs, governance, and evaluation backlog." },
  { title: "Brand Kit", href: "/brand-kit", key: "brand", detail: "Marketing assets, visual system, and reusable components." },
  { title: "Command Center", href: "/command-center", key: "command", detail: "Control page for status, shortcuts, and recent telemetry." },
];

const toneForStatus = (status: string, result: string) => {
  if (isProblemStatus(status, result)) return "rose";
  if (`${status} ${result}`.toLowerCase().includes("queue")) return "amber";
  if (`${status} ${result}`.toLowerCase().includes("review")) return "violet";
  return "cyan";
};

const toneForSystemEvent = (status: string, priority: string) => {
  if (status === "Failed" || priority === "Critical") return "rose";
  if (priority === "High") return "amber";
  if (status === "Warning" || status === "Pending") return "violet";
  return "cyan";
};

export default function SystemCapitalDashboard() {
  const [logs, setLogs] = useState<AgentLog[]>([]);
  const [source, setSource] = useState<LogsResponse["source"]>("not-configured");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    const loadLogs = async () => {
      setLoading(true);
      setError("");

      try {
        const response = await fetch("/api/logs", { cache: "no-store" });
        const payload = (await response.json()) as LogsResponse;

        if (!active) return;

        if (!response.ok) {
          throw new Error(payload.message || "Unable to load Agent Logs.");
        }

        setLogs(payload.logs);
        setSource(payload.source);
        setMessage(payload.message || "");
      } catch (loadError) {
        if (!active) return;
        const nextMessage = loadError instanceof Error ? loadError.message : "Unable to load Agent Logs.";
        setError(nextMessage);
        setLogs([]);
        setSource("error");
      } finally {
        if (active) setLoading(false);
      }
    };

    loadLogs();

    return () => {
      active = false;
    };
  }, []);

  const displayLogs = logs.length > 0 ? logs : fallbackAgentLogs;
  const metrics = useMemo(() => deriveLogMetrics(displayLogs), [displayLogs]);
  const newestSignal = signalFeed[0];
  const systemEvents = useMemo(() => sortSystemEventsByNewest(leadIntakeSystemEvents), []);
  const leadIntakeMetrics = useMemo(() => deriveLeadIntakeEventMetrics(systemEvents), [systemEvents]);
  const leadIntakeFailedEvents = leadIntakeMetrics.failedEvents;
  const lastLeadCaptured = leadIntakeMetrics.lastLeadCaptured;
  const blockedWorkflows = workflowStatuses.filter((workflow) => workflow.status === "blocked").length;
  const runningWorkflows = workflowStatuses.filter((workflow) => workflow.status === "running" || workflow.status === "scheduled").length;
  const {
    systemEventMetrics,
    recentSystemEvents,
    failedHeartbeatSystemEvents,
    highPrioritySystemEvents,
    paymentSystemEvents,
  } = useMemo(() => ({
    systemEventMetrics: deriveSystemEventMetrics(systemEventFixtures),
    recentSystemEvents: systemEventFixtures.slice(0, 4),
    failedHeartbeatSystemEvents: systemEventFixtures.filter(isFailedSystemEvent),
    highPrioritySystemEvents: systemEventFixtures.filter(isHighPrioritySystemEvent),
    paymentSystemEvents: systemEventFixtures.filter(isPaymentSystemEvent),
  }), []);

  const commandStats = [
    { label: "Active agents", value: String(Math.max(metrics.activeAgents, agentRoster.filter((agent) => agent.status === "running").length)) },
    { label: "Recent logs", value: String(metrics.totalLogs) },
    { label: "Needs review", value: String(metrics.attentionItems + blockedWorkflows + leadIntakeFailedEvents.length + failedHeartbeatSystemEvents.length) },
    { label: "Events today", value: String(leadIntakeMetrics.eventsToday) },
  ];

  const moduleCards = moduleDefinitions.map((module) => {
    const metricByKey: Record<string, string> = {
      operations: metrics.health,
      backbone: "Mapped",
      crm: "Staged",
      agents: `${metrics.activeAgents || agentRoster.length} active`,
      automation: `${runningWorkflows} live`,
      governance: "Rules",
      signals: `${newestSignal.confidence}%`,
      deployment: blockedWorkflows > 0 ? `${blockedWorkflows} blocker` : "Ready",
      payments: "Manual",
      health: blockedWorkflows > 0 ? "Review" : "Ready",
      prompts: `${displayLogs.filter((log) => /prompt|brief|copy|memo/i.test(`${log.action} ${log.result}`)).length} used`,
      brand: "Assets live",
      command: `${metrics.totalLogs} events`,
      logs: `${systemEventMetrics.total} events`,
      skytrace: "Mission workflow live",
    };

    return { ...module, metric: metricByKey[module.key] || "Open" };
  });

  return (
    <main className="scd-shell">
      <aside className="scd-sidebar" aria-label="System Capital navigation">
        <Link className="scd-brand" href="/dashboard" aria-label="System Capital dashboard home">
          <span className="scd-brand-mark">SC</span>
          <span>
            System Capital
            <strong>Dashboard</strong>
          </span>
        </Link>

        <nav className="scd-nav" aria-label="Primary navigation">
          {navItems.map((item) => (
            <Link href={item.href} key={item.href}>
              {item.label}
            </Link>
          ))}
        </nav>

        <section className="scd-sidebar-card" aria-label="Current operating mode">
          <span>OS Mode</span>
          <strong>{source === "notion" ? "Notion telemetry online" : "Telemetry fallback mode"}</strong>
          <p>{message || "Command surface is deriving module status from the latest Agent Logs and memory fixtures."}</p>
        </section>
      </aside>

      <section className="scd-workspace" aria-label="Dashboard workspace">
        <div className="scd-hero scd-glass">
          <div>
            <p className="scd-kicker">System Capital OS · Mission Control</p>
            <h1>Operational command dashboard for agents, automations, signals, and deployment.</h1>
            <p>
              Recent Agent Logs now drive the module health, activity feed, review count, and operational posture. The System OS backbone links CRM, workflows, agents, logs, payments, and health without changing production automations.
            </p>
          </div>
          <div className="scd-command-card" aria-label="Command stats">
            {commandStats.map((stat) => (
              <div key={stat.label}>
                <span>{stat.label}</span>
                <strong>{stat.value}</strong>
              </div>
            ))}
          </div>
        </div>

        <div className="scd-state-row" aria-live="polite">
          {loading && <span className="scd-state-pill">Loading Notion Agent Logs…</span>}
          {!loading && error && <span className="scd-state-pill scd-state-error">Notion error: {error}</span>}
          {!loading && !error && source === "not-configured" && (
            <span className="scd-state-pill scd-state-warn">{message}</span>
          )}
          {!loading && !error && source === "notion" && logs.length === 0 && (
            <span className="scd-state-pill scd-state-warn">Notion returned no recent Agent Logs.</span>
          )}
          {!loading && !error && source === "notion" && logs.length > 0 && (
            <span className="scd-state-pill scd-state-ok">Connected to Notion · {logs.length} recent Agent Logs</span>
          )}
        </div>

        <div className="scd-module-grid" aria-label="Dashboard modules">
          {moduleCards.map((module) => (
            <Link className="scd-module scd-glass" href={module.href} key={module.href}>
              <span>{module.title}</span>
              <strong>{module.metric}</strong>
              <p>{module.detail}</p>
              <em>Open module →</em>
            </Link>
          ))}
        </div>


        <section className="scd-system-events scd-glass" aria-label="Lead Intake System Events">
          <div className="scd-system-events-header">
            <div>
              <p className="scd-kicker">System Events / Lead Intake</p>
              <h2>Lead Intake is the first observable System Capital heartbeat.</h2>
              <p>Fixture-backed System Events show the safe contract n8n will emit after validation, CRM write, Telegram alert, and failure branches.</p>
            </div>
            <span>SC - Lead Intake CORE</span>
          </div>

          <div className="scd-event-health-grid" aria-label="Lead Intake Health">
            <article>
              <span>Lead Intake Health</span>
              <strong>{leadIntakeMetrics.health}</strong>
              <p>{leadIntakeFailedEvents.length ? `${leadIntakeFailedEvents.length} event needs review` : "No failed lead events in fixtures"}</p>
            </article>
            <article>
              <span>Failed Events</span>
              <strong>{leadIntakeFailedEvents.length}</strong>
              <p>{leadIntakeMetrics.lastFailure?.errorMessage || "No active failure in the event fixture"}</p>
            </article>
            <article>
              <span>Events Today</span>
              <strong>{leadIntakeMetrics.eventsToday}</strong>
              <p>Counted from fixture timestamps for the current UTC day.</p>
            </article>
            <article>
              <span>Last Lead Captured</span>
              <strong>{lastLeadCaptured?.clientName || "None"}</strong>
              <p>{lastLeadCaptured ? `${lastLeadCaptured.leadEmail} · ${formatSystemEventTime(lastLeadCaptured.timestamp)}` : "Waiting for first lead event"}</p>
            </article>
          </div>

          <div className="scd-event-columns">
            <div>
              <div className="scd-section-label">Recent System Events</div>
              <div className="scd-system-event-list">
                {systemEvents.slice(0, 6).map((event) => (
                  <article className="scd-system-event" data-tone={toneForSystemEvent(event.status, event.priority)} key={event.id}>
                    <div>
                      <strong>{event.eventType}</strong>
                      <p>{event.workflowKey} · {event.status} · {formatSystemEventTime(event.timestamp)}</p>
                      <small>{event.aiSummary || event.notes}</small>
                    </div>
                    <span>{event.priority}</span>
                  </article>
                ))}
              </div>
            </div>

            <div>
              <div className="scd-section-label">Failed Events</div>
              <div className="scd-system-event-list">
                {leadIntakeFailedEvents.map((event) => (
                  <article className="scd-system-event" data-tone="rose" key={event.id}>
                    <div>
                      <strong>{event.eventType}</strong>
                      <p>{event.clientName || "Unknown lead"} · {formatSystemEventTime(event.timestamp)}</p>
                      <small>{event.errorMessage || event.notes}</small>
                    </div>
                    <span>{event.priority}</span>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="scd-heartbeat scd-glass" aria-label="System Heartbeat demo event layer">
          <div className="scd-heartbeat-header">
            <div>
              <p className="scd-kicker">System Heartbeat</p>
              <h2>Demo-safe System Events layer for future Notion logging.</h2>
              <p>
                Fixture data previews how workflows will report into <strong>SC CORE - System Event Logger</strong> without touching live n8n workflows, Notion, webhook paths, or Stripe write behavior.
              </p>
            </div>
            <div className="scd-heartbeat-status">
              <span>Workflow health</span>
              <strong>{systemEventMetrics.workflowHealthSummary}</strong>
              <small>{systemEventMetrics.successfulWorkflows} successful · {systemEventMetrics.failed} failed</small>
            </div>
          </div>

          <div className="scd-heartbeat-metrics" aria-label="System Event counts">
            <div>
              <span>Recent events</span>
              <strong>{systemEventMetrics.total}</strong>
            </div>
            <div>
              <span>Failed events</span>
              <strong>{systemEventMetrics.failed}</strong>
            </div>
            <div>
              <span>High priority</span>
              <strong>{systemEventMetrics.highPriority}</strong>
            </div>
            <div>
              <span>Payment events</span>
              <strong>{systemEventMetrics.paymentEvents}</strong>
            </div>
          </div>

          <div className="scd-heartbeat-columns">
            <div className="scd-heartbeat-panel">
              <h3>Recent events</h3>
              {recentSystemEvents.map((event) => (
                <article className="scd-system-event" key={`${event.workflowKey}-${event.eventType}-${event.timestamp}`}>
                  <span>{event.eventType}</span>
                  <strong>{event.workflowName}</strong>
                  <p>{event.status} · {event.priority} · {formatSystemEventTime(event.timestamp)}</p>
                </article>
              ))}
            </div>

            <div className="scd-heartbeat-panel">
              <h3>Failed events</h3>
              {failedHeartbeatSystemEvents.map((event) => (
                <article className="scd-system-event" data-state="failed" key={`${event.workflowKey}-failed-${event.timestamp}`}>
                  <span>{event.eventType}</span>
                  <strong>{event.errorMessage || event.workflowName}</strong>
                  <p>{event.aiSummary}</p>
                </article>
              ))}
            </div>

            <div className="scd-heartbeat-panel">
              <h3>High priority</h3>
              {highPrioritySystemEvents.map((event) => (
                <article className="scd-system-event" data-state="priority" key={`${event.workflowKey}-priority-${event.timestamp}`}>
                  <span>{event.priority}</span>
                  <strong>{event.eventType}</strong>
                  <p>{event.workflowName}</p>
                </article>
              ))}
            </div>

            <div className="scd-heartbeat-panel">
              <h3>Payment events</h3>
              {paymentSystemEvents.map((event) => (
                <article className="scd-system-event" data-state="payment" key={`${event.workflowKey}-payment-${event.timestamp}`}>
                  <span>{event.paymentStatus}</span>
                  <strong>{event.eventType}</strong>
                  <p>{event.clientName || "Manual review"} · {event.sourceSystem}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
        <section className="scd-roadmap scd-glass" aria-label="Roadmap and Mission Control">
          <div className="scd-roadmap-header">
            <div>
              <p className="scd-kicker">Roadmap / Mission Control</p>
              <h2>Operating roadmap across growth, automation, AI ops, and drone operations.</h2>
            </div>
            <span>5 active lanes</span>
          </div>

          <div className="scd-roadmap-grid">
            {roadmapTracks.map((track) => (
              <article className="scd-roadmap-card" key={track.title}>
                <div className="scd-roadmap-card-header">
                  <h3>{track.title}</h3>
                  <span>{track.priority}</span>
                </div>
                <div className="scd-roadmap-status">
                  <span>Status</span>
                  <strong>{track.status}</strong>
                </div>

                <div className="scd-roadmap-section">
                  <p>Milestones</p>
                  <div className="scd-roadmap-tags">
                    {track.milestones.map((milestone) => (
                      <span key={milestone}>{milestone}</span>
                    ))}
                  </div>
                </div>

                <div className="scd-roadmap-columns">
                  <div className="scd-roadmap-section">
                    <p>Blockers</p>
                    <ul>
                      {track.blockers.map((blocker) => (
                        <li key={blocker}>{blocker}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="scd-roadmap-section">
                    <p>Technical dependencies</p>
                    <ul>
                      {track.dependencies.map((dependency) => (
                        <li key={dependency}>{dependency}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="scd-roadmap-section">
                  <p>Revenue validation checkpoints</p>
                  <ul>
                    {track.revenueCheckpoints.map((checkpoint) => (
                      <li key={checkpoint}>{checkpoint}</li>
                    ))}
                  </ul>
                </div>
              </article>
            ))}
          </div>
        </section>
      </section>

      <aside className="scd-activity scd-glass" aria-label="Live activity feed">
        <div className="scd-activity-header">
          <p className="scd-kicker">Lead + System Activity</p>
          <span>Events + {source === "notion" ? "Notion" : "Fallback"}</span>
        </div>
        <div className="scd-feed-list">
          {systemEvents.slice(0, 4).map((event) => (
            <article className="scd-feed-item" data-tone={toneForSystemEvent(event.status, event.priority)} key={event.id}>
              <div className="scd-feed-dot" />
              <div>
                <strong>{event.eventType}</strong>
                <p>{event.workflowKey} · {event.status} · {formatSystemEventTime(event.timestamp)}</p>
                <small>{event.clientName || event.sourceSystem}</small>
              </div>
            </article>
          ))}

          {loading && ["Loading 01", "Loading 02", "Loading 03"].map((item) => (
            <article className="scd-feed-item scd-feed-skeleton" key={item}>
              <div className="scd-feed-dot" />
              <div>
                <strong>Loading Agent Log…</strong>
                <p>Reading Notion data source</p>
              </div>
            </article>
          ))}

          {!loading && displayLogs.slice(0, 8).map((log) => (
            <article className="scd-feed-item" data-tone={toneForStatus(log.status, log.result)} key={log.id}>
              <div className="scd-feed-dot" />
              <div>
                <strong>{log.action}</strong>
                <p>{log.agent} · {log.status} · {formatLogTime(log.timestamp)}</p>
                <small>{log.result}</small>
              </div>
            </article>
          ))}
        </div>
      </aside>

      <style jsx>{`
        .scd-shell {
          --scd-bg: #030711;
          --scd-panel: rgba(12, 18, 32, 0.74);
          --scd-panel-strong: rgba(15, 23, 42, 0.88);
          --scd-line: rgba(125, 211, 252, 0.18);
          --scd-line-strong: rgba(34, 211, 238, 0.72);
          --scd-cyan: #22d3ee;
          --scd-blue: #38bdf8;
          --scd-violet: #8b5cf6;
          --scd-text: #f8fafc;
          --scd-muted: #94a3b8;
          min-height: 100vh;
          display: grid;
          grid-template-columns: 280px minmax(0, 1fr) 360px;
          background:
            radial-gradient(circle at 18% 14%, rgba(34, 211, 238, 0.18), transparent 30%),
            radial-gradient(circle at 78% 22%, rgba(139, 92, 246, 0.2), transparent 34%),
            linear-gradient(135deg, #020617 0%, var(--scd-bg) 52%, #070b18 100%);
          color: var(--scd-text);
          overflow-x: hidden;
        }

        .scd-shell::before {
          content: "";
          position: fixed;
          inset: 0;
          pointer-events: none;
          background-image: linear-gradient(rgba(148, 163, 184, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(148, 163, 184, 0.05) 1px, transparent 1px);
          background-size: 42px 42px;
          mask-image: linear-gradient(to bottom, black, transparent 82%);
        }

        .scd-glass,
        .scd-sidebar {
          border: 1px solid var(--scd-line);
          background: linear-gradient(145deg, rgba(15, 23, 42, 0.78), rgba(2, 6, 23, 0.58));
          box-shadow: 0 24px 80px rgba(2, 6, 23, 0.46);
          backdrop-filter: blur(20px);
        }

        .scd-sidebar {
          position: sticky;
          top: 0;
          z-index: 1;
          min-height: 100vh;
          padding: 28px 22px;
          display: flex;
          flex-direction: column;
          gap: 28px;
        }

        .scd-brand {
          display: flex;
          align-items: center;
          gap: 14px;
          font-weight: 900;
          letter-spacing: -0.04em;
        }

        .scd-brand strong {
          display: block;
          color: var(--scd-cyan);
          font-size: 0.78rem;
          letter-spacing: 0.18em;
          text-transform: uppercase;
        }

        .scd-brand-mark {
          display: grid;
          width: 44px;
          height: 44px;
          place-items: center;
          border-radius: 16px;
          background: linear-gradient(135deg, var(--scd-cyan), var(--scd-violet));
          color: #020617;
          font-weight: 900;
        }

        .scd-nav {
          display: grid;
          gap: 9px;
        }

        .scd-nav a,
        .scd-sidebar-card,
        .scd-glass {
          border: 1px solid var(--scd-line);
          background: linear-gradient(145deg, rgba(15, 23, 42, 0.72), rgba(15, 23, 42, 0.38));
          backdrop-filter: blur(22px);
        }

        .scd-nav a {
          border-color: transparent;
          border-radius: 16px;
          color: var(--scd-muted);
          padding: 12px 14px;
          transition: transform 180ms ease, border-color 180ms ease, box-shadow 180ms ease, color 180ms ease, background 180ms ease;
        }

        .scd-nav a:hover {
          transform: translateX(4px) scale(1.02);
          border-color: var(--scd-line-strong);
          background: rgba(34, 211, 238, 0.1);
          box-shadow: 0 0 24px rgba(34, 211, 238, 0.2);
          color: var(--scd-text);
        }

        .scd-sidebar-card {
          margin-top: auto;
          border-radius: 26px;
          padding: 20px;
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.08);
        }

        .scd-sidebar-card span,
        .scd-kicker,
        .scd-module span {
          color: var(--scd-cyan);
          font-family: var(--font-geist-mono), ui-monospace, SFMono-Regular, Menlo, monospace;
          font-size: 0.72rem;
          font-weight: 800;
          letter-spacing: 0.2em;
          text-transform: uppercase;
        }

        .scd-sidebar-card strong {
          display: block;
          margin-top: 8px;
          color: #fff;
        }

        .scd-workspace {
          padding: 32px;
          display: flex;
          flex-direction: column;
          gap: 18px;
        }

        .scd-hero {
          border-radius: 34px;
          padding: 32px;
          display: grid;
          grid-template-columns: minmax(0, 1fr) 280px;
          gap: 28px;
          align-items: center;
        }

        .scd-hero h1 {
          margin: 10px 0 14px;
          max-width: 840px;
          font-size: clamp(36px, 5vw, 72px);
          line-height: 0.94;
          letter-spacing: -0.07em;
        }

        .scd-hero p:not(.scd-kicker) {
          max-width: 720px;
          color: #cbd5e1;
          font-size: 16px;
          line-height: 1.7;
        }

        .scd-command-card {
          display: grid;
          gap: 12px;
        }

        .scd-command-card div {
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 20px;
          background: rgba(2, 6, 23, 0.44);
          padding: 16px;
        }

        .scd-command-card span {
          color: var(--scd-muted);
          font-size: 0.78rem;
        }

        .scd-command-card strong {
          display: block;
          margin-top: 4px;
          font-size: 34px;
        }

        .scd-state-row {
          min-height: 38px;
        }

        .scd-state-pill {
          display: inline-flex;
          border: 1px solid rgba(34, 211, 238, 0.3);
          border-radius: 999px;
          background: rgba(34, 211, 238, 0.08);
          padding: 8px 12px;
          color: #bae6fd;
          font-size: 12px;
        }

        .scd-state-error {
          border-color: rgba(244, 63, 94, 0.4);
          background: rgba(244, 63, 94, 0.12);
          color: #fecdd3;
        }

        .scd-state-warn {
          border-color: rgba(251, 191, 36, 0.4);
          background: rgba(251, 191, 36, 0.1);
          color: #fde68a;
        }

        .scd-state-ok {
          border-color: rgba(16, 185, 129, 0.4);
          background: rgba(16, 185, 129, 0.1);
          color: #bbf7d0;
        }


        .scd-system-events {
          border-radius: 34px;
          padding: 28px;
        }

        .scd-system-events-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 24px;
        }

        .scd-system-events-header h2 {
          margin: 8px 0 10px;
          max-width: 780px;
          font-size: clamp(1.8rem, 3vw, 3rem);
          line-height: 1;
          letter-spacing: -0.06em;
        }

        .scd-system-events-header p:not(.scd-kicker) {
          max-width: 760px;
          color: #cbd5e1;
          line-height: 1.7;
        }

        .scd-system-events-header > span,
        .scd-section-label {
          border: 1px solid rgba(34, 211, 238, 0.34);
          border-radius: 999px;
          color: #bae6fd;
          padding: 8px 12px;
          font-size: 0.75rem;
          white-space: nowrap;
        }

        .scd-event-health-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 14px;
          margin-top: 24px;
        }

        .scd-event-health-grid article {
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 22px;
          background: rgba(2, 6, 23, 0.44);
          padding: 18px;
        }

        .scd-event-health-grid span {
          color: var(--scd-muted);
          font-size: 0.76rem;
        }

        .scd-event-health-grid strong {
          display: block;
          margin-top: 6px;
          font-size: clamp(1.6rem, 2.8vw, 2.6rem);
          letter-spacing: -0.06em;
        }

        .scd-event-health-grid p {
          margin: 8px 0 0;
          color: #cbd5e1;
          font-size: 0.85rem;
          line-height: 1.45;
        }

        .scd-event-columns {
          display: grid;
          grid-template-columns: minmax(0, 1.3fr) minmax(280px, 0.7fr);
          gap: 18px;
          margin-top: 24px;
        }

        .scd-section-label {
          display: inline-flex;
          margin-bottom: 12px;
        }

        .scd-system-event-list {
          display: grid;
          gap: 12px;
        }

        .scd-system-event {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 14px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 20px;
          background: rgba(2, 6, 23, 0.46);
          padding: 14px;
        }

        .scd-system-event strong {
          display: block;
          color: #fff;
        }

        .scd-system-event p,
        .scd-system-event small {
          color: #cbd5e1;
          line-height: 1.4;
        }

        .scd-system-event p {
          margin: 4px 0;
        }

        .scd-system-event > span {
          border: 1px solid rgba(34, 211, 238, 0.28);
          border-radius: 999px;
          padding: 5px 9px;
          color: #bae6fd;
          font-size: 0.72rem;
        }

        .scd-system-event[data-tone="rose"] { border-color: rgba(251, 113, 133, 0.34); }
        .scd-system-event[data-tone="amber"] { border-color: rgba(251, 191, 36, 0.34); }
        .scd-system-event[data-tone="violet"] { border-color: rgba(167, 139, 250, 0.34); }

        .scd-module-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 18px;
        }

        .scd-module {
          min-height: 230px;
          padding: 24px;
          transition: transform 180ms ease, border-color 180ms ease, box-shadow 180ms ease, background 180ms ease;
        }

        .scd-module:hover {
          transform: translateY(-5px) scale(1.018);
          border-color: var(--scd-line-strong);
          background: linear-gradient(145deg, rgba(15, 23, 42, 0.92), rgba(8, 47, 73, 0.46));
          box-shadow: 0 0 34px rgba(34, 211, 238, 0.26), 0 28px 90px rgba(0, 0, 0, 0.44);
        }

        .scd-module strong {
          display: block;
          margin-top: 28px;
          font-size: clamp(2.2rem, 4vw, 3.7rem);
          letter-spacing: -0.08em;
        }

        .scd-module p {
          margin: 14px 0 0;
        }

        .scd-module em {
          display: inline-flex;
          margin-top: 22px;
          color: #bae6fd;
          font-style: normal;
          font-weight: 800;
        }


        .scd-heartbeat {
          display: grid;
          gap: 22px;
          padding: 26px;
        }

        .scd-heartbeat-header {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 240px;
          gap: 22px;
          align-items: stretch;
        }

        .scd-heartbeat-header h2 {
          margin: 8px 0 10px;
          font-size: clamp(1.7rem, 3vw, 2.6rem);
          letter-spacing: -0.06em;
        }

        .scd-heartbeat-header p {
          max-width: 780px;
          color: #cbd5e1;
          line-height: 1.7;
        }

        .scd-heartbeat-status,
        .scd-heartbeat-metrics div,
        .scd-heartbeat-panel,
        .scd-system-event {
          border: 1px solid rgba(255, 255, 255, 0.08);
          background: rgba(2, 6, 23, 0.44);
        }

        .scd-heartbeat-status {
          display: flex;
          flex-direction: column;
          justify-content: center;
          border-radius: 24px;
          padding: 18px;
        }

        .scd-heartbeat-status span,
        .scd-heartbeat-metrics span,
        .scd-system-event span {
          color: var(--scd-cyan);
          font-family: var(--font-geist-mono), ui-monospace, SFMono-Regular, Menlo, monospace;
          font-size: 0.72rem;
          font-weight: 800;
          letter-spacing: 0.16em;
          text-transform: uppercase;
        }

        .scd-heartbeat-status strong {
          margin-top: 8px;
          font-size: 2rem;
          letter-spacing: -0.05em;
        }

        .scd-heartbeat-status small,
        .scd-system-event p {
          color: var(--scd-muted);
          line-height: 1.45;
        }

        .scd-heartbeat-metrics {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 14px;
        }

        .scd-heartbeat-metrics div {
          border-radius: 20px;
          padding: 16px;
        }

        .scd-heartbeat-metrics strong {
          display: block;
          margin-top: 8px;
          font-size: 2.2rem;
          letter-spacing: -0.07em;
        }

        .scd-heartbeat-columns {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 14px;
        }

        .scd-heartbeat-panel {
          border-radius: 22px;
          padding: 16px;
        }

        .scd-heartbeat-panel h3 {
          margin: 0 0 12px;
          font-size: 1rem;
        }

        .scd-system-event {
          border-radius: 16px;
          padding: 12px;
        }

        .scd-system-event + .scd-system-event {
          margin-top: 10px;
        }

        .scd-system-event strong {
          display: block;
          margin-top: 6px;
          line-height: 1.3;
        }

        .scd-system-event[data-state="failed"] span { color: #fb7185; }
        .scd-system-event[data-state="priority"] span { color: #fbbf24; }
        .scd-system-event[data-state="payment"] span { color: #a78bfa; }

        .scd-activity {
          position: fixed;
          inset: 28px 28px 28px auto;
          z-index: 8;
          width: 312px;
          display: flex;
          flex-direction: column;
          gap: 22px;
          padding: 24px;
        }

        .scd-activity-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }

        .scd-activity-header span {
          border: 1px solid rgba(34, 211, 238, 0.34);
          border-radius: 999px;
          color: #bae6fd;
          padding: 6px 10px;
          font-size: 0.75rem;
        }

        .scd-feed-list {
          display: grid;
          gap: 14px;
        }

        .scd-feed-item {
          display: grid;
          grid-template-columns: auto 1fr;
          gap: 12px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 20px;
          background: rgba(2, 6, 23, 0.46);
          padding: 14px;
          transition: transform 180ms ease, border-color 180ms ease, box-shadow 180ms ease;
        }

        .scd-feed-item:hover {
          transform: scale(1.018);
          border-color: var(--scd-line-strong);
          box-shadow: 0 0 24px rgba(34, 211, 238, 0.18);
        }

        .scd-feed-dot {
          width: 10px;
          height: 10px;
          margin-top: 6px;
          border-radius: 50%;
          background: var(--scd-cyan);
          box-shadow: 0 0 24px var(--scd-cyan);
        }

        .scd-feed-item[data-tone="rose"] .scd-feed-dot { background: #fb7185; box-shadow: 0 0 24px #fb7185; }
        .scd-feed-item[data-tone="amber"] .scd-feed-dot { background: #fbbf24; box-shadow: 0 0 24px #fbbf24; }
        .scd-feed-item[data-tone="violet"] .scd-feed-dot { background: #a78bfa; box-shadow: 0 0 24px #a78bfa; }

        .scd-feed-item strong {
          display: block;
          color: #fff;
          line-height: 1.35;
        }

        .scd-feed-item small {
          display: block;
          margin-top: 6px;
          line-height: 1.35;
        }

        .scd-feed-skeleton {
          opacity: 0.68;
        }

        @media (max-width: 1180px) {
          .scd-shell {
            grid-template-columns: 240px minmax(0, 1fr);
          }

          .scd-activity {
            grid-column: 2;
            width: auto;
            min-height: auto;
            position: relative;
            inset: auto;
            border: 1px solid var(--scd-line);
            border-radius: 28px;
            margin: 0 32px 32px;
          }

          .scd-heartbeat-columns,
          .scd-heartbeat-metrics {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 860px) {
          .scd-shell {
            display: block;
          }

          .scd-sidebar,
          .scd-activity {
            position: relative;
            min-height: auto;
            margin: 16px;
            border: 1px solid var(--scd-line);
            border-radius: 28px;
          }

          .scd-workspace {
            padding: 16px;
          }

          .scd-hero,
          .scd-module-grid,
.scd-event-health-grid,
.scd-event-columns,
.scd-heartbeat-header,
.scd-heartbeat-metrics,
.scd-heartbeat-columns {
  grid-template-columns: 1fr;
}
          

          .scd-system-events-header {
            display: grid;
          }
        }
      `}</style>
    </main>
  );
}
