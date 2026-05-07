import ShenoraShell from "@/dashboard/components/ShenoraShell";

const commandMetrics = [
  { label: "Live agents", value: "12", detail: "Role-owned operators online" },
  { label: "Runs today", value: "284", detail: "Completed automation cycles" },
  { label: "Signals watched", value: "187", detail: "Macro and operational inputs" },
  { label: "Open decisions", value: "9", detail: "Queued for review" },
];

const missionThreads = [
  { label: "Capital posture", owner: "Alora", state: "Monitoring liquidity and credit deltas" },
  { label: "Growth workflow", owner: "Automation", state: "Lead capture and social syndication active" },
  { label: "Release readiness", owner: "Ops", state: "Dashboard navigation hardening underway" },
];

export default function MissionControlPage() {
  return (
    <ShenoraShell
      current="mission-control"
      title="Mission Control"
      description="Coordinate System Capital agents, signals, automations, and operator decisions from one command surface."
    >
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {commandMetrics.map((metric) => (
          <article key={metric.label} className="rounded-3xl border border-white/5 bg-slate-900/70 p-5">
            <p className="text-xs uppercase tracking-[0.25em] text-slate-500">{metric.label}</p>
            <strong className="mt-3 block text-3xl text-white">{metric.value}</strong>
            <p className="mt-2 text-sm text-slate-400">{metric.detail}</p>
          </article>
        ))}
      </section>

      <section className="rounded-3xl border border-white/5 bg-slate-900/70 p-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-slate-500">Active threads</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">Mission queue</h2>
          </div>
          <span className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-200">
            Live
          </span>
        </div>
        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          {missionThreads.map((thread) => (
            <article key={thread.label} className="rounded-2xl border border-white/5 bg-slate-950/40 p-4">
              <p className="text-sm font-semibold text-white">{thread.label}</p>
              <p className="mt-1 text-xs uppercase tracking-[0.25em] text-cyan-200">{thread.owner}</p>
              <p className="mt-3 text-sm text-slate-400">{thread.state}</p>
            </article>
          ))}
        </div>
      </section>
    </ShenoraShell>
  );
}
