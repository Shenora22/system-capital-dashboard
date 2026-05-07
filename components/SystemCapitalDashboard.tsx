"use client";

import Link from "next/link";

const navItems = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Agents", href: "/agents" },
  { label: "Signals", href: "/signals" },
  { label: "Automations", href: "/automation" },
  { label: "Deployments", href: "/deployment" },
  { label: "Prompt Library", href: "/prompts" },
  { label: "Settings", href: "/settings" },
];

const moduleCards = [
  {
    title: "AI Operations Center",
    href: "/operations",
    metric: "98.4%",
    detail: "Automation uptime across live orchestration lanes.",
  },
  {
    title: "Agent Registry",
    href: "/agents",
    metric: "12",
    detail: "Active agents with role ownership and health telemetry.",
  },
  {
    title: "Workflow Architecture",
    href: "/automation",
    metric: "42",
    detail: "n8n and OpenClaw workflows mapped to business outcomes.",
  },
  {
    title: "Signal Engine",
    href: "/signals",
    metric: "187",
    detail: "Macro, risk, liquidity, and operational signals monitored.",
  },
  {
    title: "Deployment Status",
    href: "/deployment",
    metric: "7",
    detail: "Production surfaces staged for agent-assisted release.",
  },
  {
    title: "Prompt Intelligence",
    href: "/prompts",
    metric: "63",
    detail: "Governed prompt assets with reusable operating context.",
  },
];

const activityItems = [
  { title: "Alora analyzed Fed minutes", meta: "Macro desk · 2 min ago", tone: "cyan" },
  { title: "Workflow completed", meta: "Lead capture sync · 8 min ago", tone: "violet" },
  { title: "Risk regime updated", meta: "Signal engine · 14 min ago", tone: "amber" },
  { title: "n8n automation executed", meta: "Ops workflow · 21 min ago", tone: "emerald" },
  { title: "Agent status changed", meta: "Registry monitor · 33 min ago", tone: "rose" },
];

const commandStats = [
  { label: "Live agents", value: "12" },
  { label: "Runs today", value: "284" },
  { label: "Open decisions", value: "9" },
];

export default function SystemCapitalDashboard() {
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
          <strong>Autonomous command layer</strong>
          <p>Dark glass workspace for agents, signals, workflows, deployments, and prompts.</p>
        </section>
      </aside>

      <section className="scd-workspace" aria-label="Dashboard workspace">
        <div className="scd-hero scd-glass">
          <div>
            <p className="scd-kicker">System Capital OS · Mission Control</p>
            <h1>Full-stack operating dashboard for intelligent capital.</h1>
            <p>
              Monitor AI operations, agent status, macro signals, automations, deployments, and prompt intelligence from one glassmorphism command surface.
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
      </section>

      <aside className="scd-activity scd-glass" aria-label="Live activity feed">
        <div className="scd-activity-header">
          <p className="scd-kicker">Live Feed</p>
          <span>Streaming</span>
        </div>
        <div className="scd-feed-list">
          {activityItems.map((item) => (
            <article className="scd-feed-item" data-tone={item.tone} key={item.title}>
              <div className="scd-feed-dot" />
              <div>
                <strong>{item.title}</strong>
                <p>{item.meta}</p>
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
          grid-template-columns: 280px minmax(0, 1fr) 340px;
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
          background-image:
            linear-gradient(rgba(148, 163, 184, 0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(148, 163, 184, 0.04) 1px, transparent 1px);
          background-size: 52px 52px;
          mask-image: linear-gradient(to bottom, black, transparent 88%);
        }

        .scd-sidebar {
          position: fixed;
          inset: 0 auto 0 0;
          z-index: 10;
          width: 280px;
          display: flex;
          flex-direction: column;
          gap: 26px;
          border-right: 1px solid var(--scd-line);
          background: rgba(2, 6, 23, 0.78);
          padding: 26px;
          backdrop-filter: blur(24px);
          box-shadow: 20px 0 80px rgba(0, 0, 0, 0.28);
        }

        .scd-brand,
        .scd-nav a,
        .scd-module {
          color: inherit;
          text-decoration: none;
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
          place-items: center;
          width: 48px;
          height: 48px;
          border: 1px solid rgba(34, 211, 238, 0.44);
          border-radius: 16px;
          background: linear-gradient(145deg, rgba(34, 211, 238, 0.2), rgba(139, 92, 246, 0.18));
          box-shadow: 0 0 34px rgba(34, 211, 238, 0.28);
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
          margin-top: 12px;
          font-size: 1.18rem;
          line-height: 1.15;
        }

        .scd-sidebar-card p,
        .scd-hero p,
        .scd-module p,
        .scd-feed-item p {
          color: var(--scd-muted);
          line-height: 1.65;
        }

        .scd-workspace {
          position: relative;
          z-index: 1;
          grid-column: 2;
          display: grid;
          gap: 22px;
          padding: 28px;
        }

        .scd-glass {
          position: relative;
          overflow: hidden;
          border-radius: 30px;
          box-shadow: 0 24px 80px rgba(0, 0, 0, 0.34), inset 0 1px 0 rgba(255, 255, 255, 0.08);
        }

        .scd-glass::after {
          content: "";
          position: absolute;
          inset: 0;
          pointer-events: none;
          background: linear-gradient(120deg, rgba(34, 211, 238, 0.12), transparent 34%, rgba(139, 92, 246, 0.12));
          opacity: 0.7;
        }

        .scd-glass > * {
          position: relative;
          z-index: 1;
        }

        .scd-hero {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 280px;
          gap: 26px;
          align-items: end;
          min-height: 360px;
          padding: 38px;
        }

        .scd-hero h1 {
          max-width: 900px;
          margin: 12px 0 0;
          font-size: clamp(3rem, 6vw, 6.2rem);
          line-height: 0.9;
          letter-spacing: -0.075em;
        }

        .scd-hero p:not(.scd-kicker) {
          max-width: 740px;
          margin: 22px 0 0;
          font-size: 1.06rem;
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
          margin-top: 5px;
          font-size: 2rem;
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
          margin-top: 7px;
          border-radius: 999px;
          background: var(--scd-cyan);
          box-shadow: 0 0 18px currentColor;
        }

        .scd-feed-item[data-tone="violet"] .scd-feed-dot { background: #a78bfa; }
        .scd-feed-item[data-tone="amber"] .scd-feed-dot { background: #f59e0b; }
        .scd-feed-item[data-tone="emerald"] .scd-feed-dot { background: #34d399; }
        .scd-feed-item[data-tone="rose"] .scd-feed-dot { background: #fb7185; }

        .scd-feed-item strong {
          display: block;
          font-size: 0.95rem;
        }

        .scd-feed-item p {
          margin: 4px 0 0;
          font-size: 0.82rem;
        }

        @media (max-width: 1180px) {
          .scd-shell {
            grid-template-columns: 240px minmax(0, 1fr);
          }

          .scd-sidebar {
            width: 240px;
          }

          .scd-activity {
            position: relative;
            inset: auto;
            grid-column: 2;
            width: auto;
            margin: 0 28px 28px;
          }

          .scd-module-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 820px) {
          .scd-shell {
            display: block;
            padding-top: 0;
          }

          .scd-sidebar {
            position: relative;
            width: auto;
            min-height: auto;
            inset: auto;
          }

          .scd-workspace {
            padding: 18px;
          }

          .scd-hero {
            grid-template-columns: 1fr;
            min-height: auto;
            padding: 28px;
          }

          .scd-module-grid {
            grid-template-columns: 1fr;
          }

          .scd-activity {
            margin: 0 18px 18px;
          }
        }
      `}</style>
    </main>
  );
}
