import Link from "next/link";
import ShenoraShell from "./ShenoraShell";

const commandStats = [
  { label: "Live agents", value: "12", detail: "Role-owned operators across capital, content, and workflow lanes." },
  { label: "Runs today", value: "284", detail: "Automation and analysis events routed through the operating layer." },
  { label: "Open decisions", value: "9", detail: "Items awaiting owner review before customer-facing release." },
];

const moduleCards = [
  {
    title: "Projects",
    href: "/projects",
    metric: "6",
    detail: "Current delivery surfaces and client-facing build priorities.",
  },
  {
    title: "Roadmap",
    href: "/roadmap",
    metric: "3",
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
    detail: "Recent system events across agents, leads, signals, and automations.",
  },
  {
    title: "Settings",
    href: "/settings",
    metric: "Ops",
    detail: "Workspace configuration, operating preferences, and governance controls.",
  },
];

const activityItems = [
  { title: "Alora analyzed Fed minutes", meta: "Macro desk · 2 min ago" },
  { title: "Workflow completed", meta: "Lead capture sync · 8 min ago" },
  { title: "Risk regime updated", meta: "Signal engine · 14 min ago" },
  { title: "n8n automation executed", meta: "Ops workflow · 21 min ago" },
];

export default function SystemCapitalDashboard() {
  return (
    <ShenoraShell
      current="dashboard"
      title="Dashboard"
      description="System Capital command overview for agents, roadmap, mission control, automations, signals, and activity."
    >
      <section className="grid gap-4 md:grid-cols-3">
        {commandStats.map((stat) => (
          <article key={stat.label} className="rounded-3xl border border-white/5 bg-slate-900/70 p-5">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">{stat.label}</p>
            <p className="mt-3 text-3xl font-semibold text-white">{stat.value}</p>
            <p className="mt-2 text-sm text-slate-300">{stat.detail}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.35fr_0.65fr]">
        <div className="rounded-3xl border border-white/5 bg-slate-900/70 p-6">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Command modules</p>
              <h2 className="mt-1 text-2xl font-semibold text-white">Working dashboard routes</h2>
            </div>
            <Link
              href="/mission-control"
              className="rounded-full border border-emerald-400/40 px-4 py-2 text-sm font-medium text-emerald-200 transition hover:bg-emerald-500/10"
            >
              Open Mission Control
            </Link>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {moduleCards.map((module) => (
              <Link
                key={module.href}
                href={module.href}
                className="rounded-2xl border border-white/5 bg-slate-950/40 p-5 transition hover:border-emerald-400/30 hover:bg-emerald-500/10"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-slate-500">{module.title}</p>
                    <p className="mt-3 text-sm text-slate-300">{module.detail}</p>
                  </div>
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-emerald-200">
                    {module.metric}
                  </span>
                </div>
                <span className="mt-4 inline-block text-xs font-medium text-emerald-200">Open route →</span>
              </Link>
            ))}
          </div>
        </div>

        <aside className="rounded-3xl border border-white/5 bg-slate-900/70 p-6">
          <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Live feed</p>
          <h2 className="mt-1 text-2xl font-semibold text-white">Operator activity</h2>
          <div className="mt-6 space-y-3">
            {activityItems.map((item) => (
              <article key={item.title} className="rounded-2xl border border-white/5 bg-slate-950/40 p-4">
                <p className="font-semibold text-white">{item.title}</p>
                <p className="mt-1 text-sm text-slate-300">{item.meta}</p>
              </article>
            ))}
          </div>
        </aside>
      </section>
    </ShenoraShell>
  );
}
