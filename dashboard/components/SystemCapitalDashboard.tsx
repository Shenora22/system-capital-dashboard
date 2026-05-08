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

const navItems = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Command Center", href: "/command-center" },
  { label: "Operations", href: "/operations" },
  { label: "Agents", href: "/agents" },
  { label: "Automation", href: "/automation" },
  { label: "Signals", href: "/signals" },
  { label: "Deployment", href: "/deployment" },
  { label: "Prompts", href: "/prompts" },
  { label: "Brand Kit", href: "/brand-kit" },
];

const moduleDefinitions = [
  { title: "AI Operations Center", href: "/operations", key: "operations", detail: "Live operating queue, incidents, and owner handoffs." },
  { title: "Agent Registry", href: "/agents", key: "agents", detail: "Inspect autonomous workers, run tests, and view logs." },
  { title: "Workflow Architecture", href: "/automation", key: "automation", detail: "n8n workflow state, runbooks, and SLA controls." },
  { title: "Signal Engine", href: "/signals", key: "signals", detail: "Macro, risk, liquidity, and operational signal board." },
  { title: "Deployment Status", href: "/deployment", key: "deployment", detail: "Release surfaces, environment readiness, and blockers." },
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
  const blockedWorkflows = workflowStatuses.filter((workflow) => workflow.status === "blocked").length;
  const runningWorkflows = workflowStatuses.filter((workflow) => workflow.status === "running" || workflow.status === "scheduled").length;

  const commandStats = [
    { label: "Active agents", value: String(Math.max(metrics.activeAgents, agentRoster.filter((agent) => agent.status === "running").length)) },
    { label: "Recent logs", value: String(metrics.totalLogs) },
    { label: "Needs review", value: String(metrics.attentionItems + blockedWorkflows) },
  ];

  const moduleCards = moduleDefinitions.map((module) => {
    const metricByKey: Record<string, string> = {
      operations: metrics.health,
      agents: `${metrics.activeAgents || agentRoster.length} active`,
      automation: `${runningWorkflows} live`,
      signals: `${newestSignal.confidence}%`,
      deployment: blockedWorkflows > 0 ? `${blockedWorkflows} blocker` : "Ready",
      prompts: `${displayLogs.filter((log) => /prompt|brief|copy|memo/i.test(`${log.action} ${log.result}`)).length} used`,
      brand: "Assets live",
      command: `${metrics.totalLogs} events`,
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
              Recent Agent Logs now drive the module health, activity feed, review count, and operational posture.
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
          <p className="scd-kicker">Agent Logs</p>
          <span>{source === "notion" ? "Notion" : "Fallback"}</span>
        </div>
        <div className="scd-feed-list">
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
            min-height: auto;
            position: relative;
            border: 1px solid var(--scd-line);
            border-radius: 28px;
            margin: 0 32px 32px;
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
          .scd-module-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </main>
  );
}
