"use client";

import Link from "next/link";

const navItems = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Command Center", href: "/command-center" },
  { label: "Landing", href: "/landing" },
  { label: "System Capital OS", href: "/system-capital-os" },
  { label: "Projects", href: "/projects" },
  { label: "Roadmap", href: "/roadmap" },
  { label: "Mission Control", href: "/mission-control" },
  { label: "Operations", href: "/operations" },
  { label: "Drone Ops", href: "/drone" },
  { label: "Agents", href: "/agents" },
  { label: "Automations", href: "/automation" },
  { label: "Signals", href: "/signals" },
  { label: "Activity", href: "/activity" },
  { label: "Brand Kit", href: "/brand-kit" },
  { label: "Lead Payments", href: "/lead/next-step" },
  { label: "Settings", href: "/settings" },
];

const moduleCards = [
  {
    title: "Projects",
    href: "/projects",
    metric: "6",
    detail: "Current delivery surfaces and client-facing build priorities.",
  },
  {
    title: "Lead Capture Routing",
    href: "/lead/next-step",
    metric: "3",
    detail: "Starter, Pro, and Custom paths route to Stripe or booking next steps.",
  },
  {
    title: "Roadmap",
    href: "/roadmap",
    metric: "5",
    detail: "Now, next, and later execution lanes for the command layer.",
  },
  {
    title: "Mission Control",
    href: "/mission-control",
    metric: "Green",
    detail: "Route health, launch readiness, and operator escalation links.",
  },
  {
    title: "Agents",
    href: "/agents",
    metric: "12",
    detail: "Agent registry with ownership, posture, and workflow context.",
  },
  {
    title: "Automation",
    href: "/automation",
    metric: "42",
    detail: "n8n and workflow architecture mapped to operating outcomes.",
  },
  {
    title: "Signals",
    href: "/signals",
    metric: "187",
    detail: "Macro, risk, liquidity, and operational signals monitored by Alora.",
  },
  {
    title: "Activity",
    href: "/activity",
    metric: "Live",
    detail: "Unified audit and activity stream for operator handoffs.",
  },
  {
    title: "Drone Operations",
    href: "/drone",
    metric: "P0",
    detail: "SkyTrace telemetry, incident logging, and monetization milestones.",
  },
  {
    title: "System Capital OS",
    href: "/system-capital-os",
    metric: "Core",
    detail: "Primary operating system surface for the System Capital stack.",
  },
  {
    title: "Landing Page",
    href: "/landing",
    metric: "Live",
    detail: "Public entry route for System Capital lead and marketing flows.",
  },
  {
    title: "Brand Kit",
    href: "/brand-kit",
    metric: "Ready",
    detail: "Marketing assets and identity surfaces for launch collateral.",
  },
  {
    title: "Settings",
    href: "/settings",
    metric: "Ops",
    detail: "Workspace configuration, operating preferences, and governance controls.",
  },
];

const activityItems = [
  { title: "Alora analyzed Fed minutes", meta: "Macro desk · 2 min ago", tone: "cyan" },
  { title: "Lead capture routed to payment", meta: "Tally → n8n → Stripe · 8 min ago", tone: "violet" },
  { title: "Risk regime updated", meta: "Signal engine · 14 min ago", tone: "amber" },
  { title: "n8n production webhook verified", meta: "Lead automation workflow · 21 min ago", tone: "emerald" },
  { title: "Agent status changed", meta: "Registry monitor · 33 min ago", tone: "rose" },
];

const commandStats = [
  { label: "Live agents", value: "12" },
  { label: "Runs today", value: "284" },
  { label: "Open decisions", value: "9" },
];

const roadmapTracks = [
  {
    title: "Content Engine",
    status: "In production",
    priority: "P1",
    blockers: ["Approval queue capacity"],
    dependencies: ["Publishing calendar", "Asset library", "Research agent prompts"],
    revenueCheckpoints: ["Newsletter CTA conversion", "Content-to-call attribution"],
    milestones: ["Daily signal brief", "Short-form post pipeline", "Campaign performance review"],
  },
  {
    title: "Lead Engine",
    status: "Pilot",
    priority: "P1",
    blockers: ["CRM field mapping", "Sales handoff SLA"],
    dependencies: ["Waitlist API", "Resend alerts", "Supabase leads table"],
    revenueCheckpoints: ["Qualified lead rate", "Booked consults from automation"],
    milestones: ["Lead capture alerts", "Follow-up scripts", "Pipeline scoring"],
  },
  {
    title: "Automation",
    status: "Buildout",
    priority: "P2",
    blockers: ["Workflow QA coverage"],
    dependencies: ["n8n templates", "Credential vault", "Runbook ownership"],
    revenueCheckpoints: ["Hours saved per client", "Automation package renewal intent"],
    milestones: ["Backup workflows", "SLA monitoring", "Recovery playbooks"],
  },
  {
    title: "AI Operations",
    status: "Active",
    priority: "P0",
    blockers: ["Escalation policy finalization"],
    dependencies: ["Agent registry", "Prompt library", "Activity telemetry"],
    revenueCheckpoints: ["Operator adoption", "Client-facing ops report demand"],
    milestones: ["Agent health dashboard", "Ops audit cadence", "Incident triage loop"],
  },
  {
    title: "Drone Operations",
    status: "Scoping",
    priority: "P0",
    blockers: ["Mapbox/Supabase production keys", "Flight telemetry schema approval", "FAA/compliance review for pilot workflows"],
    dependencies: ["SkyTrace drone dashboard", "Realtime telemetry ingestion", "Incident log storage", "Alert routing", "Mapping provider"],
    revenueCheckpoints: ["Validate paid inspection use case", "Confirm pilot customers for monitoring subscriptions", "Price incident-report exports"],
    milestones: [
      "Drone MVP Definition",
      "Dashboard Modules",
      "Signal Intelligence",
      "AI Incident Logging",
      "Telemetry/Data Layer",
      "Future Mapping System",
      "Alerting Infrastructure",
      "Monetization Milestones",
      "Deployment Milestones",
    ],
  },
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
          <p>Dark glass workspace for agents, signals, workflows, lead routing, payments, and launch operations.</p>
        </section>
      </aside>

      <section className="scd-workspace" aria-label="Dashboard workspace">
        <div className="scd-hero scd-glass">
          <div>
            <p className="scd-kicker">System Capital OS · Mission Control</p>
            <h1>Full-stack operating dashboard for intelligent capital.</h1>
            <p>
              Monitor AI operations, agent status, macro signals, automations, n8n lead capture, payment routing, and launch operations from one glassmorphism command surface.
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
          overflow-y: auto;
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


        .scd-roadmap {
          padding: 28px;
        }

        .scd-roadmap-header {
          display: flex;
          align-items: start;
          justify-content: space-between;
          gap: 18px;
          margin-bottom: 22px;
        }

        .scd-roadmap-header h2 {
          max-width: 780px;
          margin: 10px 0 0;
          font-size: clamp(1.8rem, 3vw, 3rem);
          line-height: 0.98;
          letter-spacing: -0.055em;
        }

        .scd-roadmap-header > span,
        .scd-roadmap-card-header span {
          border: 1px solid rgba(34, 211, 238, 0.34);
          border-radius: 999px;
          background: rgba(34, 211, 238, 0.1);
          color: #bae6fd;
          padding: 7px 11px;
          font-size: 0.72rem;
          font-weight: 800;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          white-space: nowrap;
        }

        .scd-roadmap-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 16px;
        }

        .scd-roadmap-card {
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 24px;
          background: rgba(2, 6, 23, 0.44);
          padding: 20px;
        }

        .scd-roadmap-card:last-child {
          grid-column: 1 / -1;
          border-color: rgba(34, 211, 238, 0.32);
          background:
            radial-gradient(circle at 85% 15%, rgba(34, 211, 238, 0.16), transparent 28%),
            rgba(2, 6, 23, 0.56);
        }

        .scd-roadmap-card-header {
          display: flex;
          align-items: start;
          justify-content: space-between;
          gap: 12px;
        }

        .scd-roadmap-card h3 {
          margin: 0;
          font-size: 1.35rem;
          letter-spacing: -0.04em;
        }

        .scd-roadmap-status {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-top: 16px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 16px;
          background: rgba(15, 23, 42, 0.58);
          padding: 12px 14px;
        }

        .scd-roadmap-status span,
        .scd-roadmap-section p {
          margin: 0;
          color: var(--scd-muted);
          font-size: 0.72rem;
          font-weight: 800;
          letter-spacing: 0.14em;
          text-transform: uppercase;
        }

        .scd-roadmap-status strong {
          color: #d9f99d;
          font-size: 0.9rem;
        }

        .scd-roadmap-section {
          margin-top: 16px;
        }

        .scd-roadmap-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 10px;
        }

        .scd-roadmap-tags span {
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 999px;
          background: rgba(15, 23, 42, 0.62);
          color: #e2e8f0;
          padding: 6px 10px;
          font-size: 0.78rem;
        }

        .scd-roadmap-columns {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 14px;
        }

        .scd-roadmap-section ul {
          display: grid;
          gap: 7px;
          margin: 10px 0 0;
          padding-left: 18px;
          color: var(--scd-muted);
          font-size: 0.86rem;
          line-height: 1.45;
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

          .scd-module-grid,
          .scd-roadmap-grid {
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

          .scd-module-grid,
          .scd-roadmap-grid,
          .scd-roadmap-columns {
            grid-template-columns: 1fr;
          }

          .scd-roadmap {
            padding: 22px;
          }

          .scd-roadmap-header {
            flex-direction: column;
          }

          .scd-roadmap-card:last-child {
            grid-column: auto;
          }

          .scd-activity {
            margin: 0 18px 18px;
          }
        }
      `}</style>
    </main>
  );
}
