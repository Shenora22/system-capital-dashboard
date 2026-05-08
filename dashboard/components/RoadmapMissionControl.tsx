import Link from "next/link";
import ShenoraShell from "./ShenoraShell";

type RoadmapMissionControlProps = {
  view: "roadmap" | "mission-control";
};

const roadmapLanes = [
  {
    phase: "Now",
    title: "Stabilize command surfaces",
    status: "Active",
    items: ["Restore primary routes", "Keep dashboard modules linked", "Verify production build"],
  },
  {
    phase: "Next",
    title: "Connect operating telemetry",
    status: "Queued",
    items: ["Unify agent status", "Stream signal health", "Expose automation SLAs"],
  },
  {
    phase: "Later",
    title: "Autonomous capital workflows",
    status: "Planned",
    items: ["Decision audit trails", "Portfolio scenario runs", "Executive digest automation"],
  },
];

const missionMetrics = [
  { label: "Routes online", value: "2", detail: "Roadmap and Mission Control restored" },
  { label: "Critical pages", value: "6", detail: "Dashboard, command center, automation, agents, signals, projects preserved" },
  { label: "Ops posture", value: "Green", detail: "Navigation and module cards point to live surfaces" },
];

const controlPanels = [
  {
    title: "Launch readiness",
    detail: "Confirm every production entry point resolves before campaign traffic moves through the system.",
    href: "/dashboard",
  },
  {
    title: "Signal oversight",
    detail: "Monitor market and operational intelligence feeding Alora's command workflow.",
    href: "/signals",
  },
  {
    title: "Automation lane",
    detail: "Track n8n and agent-run workflow execution from intake through operator handoff.",
    href: "/automation",
  },
];

const statusClass = (status: string) => {
  switch (status.toLowerCase()) {
    case "active":
      return "border-emerald-400/30 bg-emerald-500/10 text-emerald-200";
    case "queued":
      return "border-cyan-400/30 bg-cyan-500/10 text-cyan-200";
    default:
      return "border-white/15 bg-slate-900/70 text-slate-200";
  }
};

export default function RoadmapMissionControl({ view }: RoadmapMissionControlProps) {
  const isMissionControl = view === "mission-control";

  return (
    <ShenoraShell
      current={view}
      title={isMissionControl ? "Mission Control" : "Roadmap"}
      description={
        isMissionControl
          ? "Live operator surface for route health, launch readiness, and System Capital priorities."
          : "Execution roadmap for the System Capital command layer and Shenora operating network."
      }
    >
      <section className="grid gap-4 md:grid-cols-3">
        {missionMetrics.map((metric) => (
          <article key={metric.label} className="rounded-3xl border border-white/5 bg-slate-900/70 p-5">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">{metric.label}</p>
            <p className="mt-3 text-3xl font-semibold text-white">{metric.value}</p>
            <p className="mt-2 text-sm text-slate-300">{metric.detail}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.25fr_0.75fr]">
        <div className="rounded-3xl border border-white/5 bg-slate-900/70 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Roadmap</p>
              <h2 className="text-2xl font-semibold text-white">Priority lanes</h2>
            </div>
            <Link
              href={isMissionControl ? "/roadmap" : "/mission-control"}
              className="rounded-full border border-emerald-400/40 px-4 py-2 text-sm font-medium text-emerald-200 transition hover:bg-emerald-500/10"
            >
              {isMissionControl ? "Open Roadmap" : "Open Mission Control"}
            </Link>
          </div>

          <div className="mt-6 space-y-4">
            {roadmapLanes.map((lane) => (
              <article key={lane.phase} className="rounded-2xl border border-white/5 bg-slate-950/40 p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-slate-500">{lane.phase}</p>
                    <h3 className="mt-1 text-lg font-semibold text-white">{lane.title}</h3>
                  </div>
                  <span className={`rounded-full border px-3 py-0.5 text-xs ${statusClass(lane.status)}`}>
                    {lane.status}
                  </span>
                </div>
                <ul className="mt-4 grid gap-2 text-sm text-slate-300 sm:grid-cols-3">
                  {lane.items.map((item) => (
                    <li key={item} className="rounded-xl border border-white/5 bg-slate-900/60 px-3 py-2">
                      {item}
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </div>

        <aside className="rounded-3xl border border-white/5 bg-slate-900/70 p-6">
          <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Mission Control</p>
          <h2 className="mt-1 text-2xl font-semibold text-white">Operator links</h2>
          <div className="mt-6 space-y-3">
            {controlPanels.map((panel) => (
              <Link
                key={panel.title}
                href={panel.href}
                className="block rounded-2xl border border-white/5 bg-slate-950/40 p-4 transition hover:border-emerald-400/30 hover:bg-emerald-500/10"
              >
                <p className="font-semibold text-white">{panel.title}</p>
                <p className="mt-1 text-sm text-slate-300">{panel.detail}</p>
                <span className="mt-3 inline-block text-xs font-medium text-emerald-200">Open surface →</span>
              </Link>
            ))}
          </div>
        </aside>
      </section>
    </ShenoraShell>
  );
}
