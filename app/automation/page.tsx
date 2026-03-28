import ShenoraShell from "@/components/ShenoraShell";
import { workflowStatuses } from "@/data/shenora";

const runbooks = [
  { name: "Asia open pre-brief", eta: "00:18", owner: "Clara", stage: "assembling" },
  { name: "Energy stress drill", eta: "01:05", owner: "Dasir", stage: "ready" },
  { name: "Automation restart", eta: "—", owner: "OpsBot", stage: "blocked" },
];

const metrics = [
  { label: "Jobs running", value: 8 },
  { label: "Queued", value: 3 },
  { label: "SLA breaches", value: 0 },
];

const statusClass = (status: string) => {
  switch (status.toLowerCase()) {
    case "running":
      return "text-emerald-200 border-emerald-400/30 bg-emerald-500/10";
    case "queued":
      return "text-amber-200 border-amber-300/30 bg-amber-500/10";
    case "snoozed":
      return "text-slate-200 border-white/15 bg-slate-900/60";
    case "blocked":
      return "text-rose-200 border-rose-400/30 bg-rose-500/10";
    case "scheduled":
      return "text-cyan-200 border-cyan-400/30 bg-cyan-500/10";
    case "ready":
      return "text-emerald-200 border-emerald-400/30 bg-emerald-500/10";
    case "assembling":
      return "text-cyan-200 border-cyan-400/30 bg-cyan-500/10";
    default:
      return "text-slate-200 border-white/15 bg-slate-900/60";
  }
};

export default function AutomationPage() {
  return (
    <ShenoraShell
      current="automation"
      title="Automation"
      description="Observe and steer every workflow inside the Shenora Network automation mesh."
    >
      <section className="grid gap-4 sm:grid-cols-3">
        {metrics.map((metric) => (
          <div
            key={metric.label}
            className="rounded-2xl border border-white/5 bg-slate-900/70 p-5 text-center"
          >
            <p className="text-sm uppercase tracking-[0.3em] text-slate-500">{metric.label}</p>
            <p className="mt-2 text-4xl font-semibold text-white">{metric.value}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="rounded-3xl border border-white/5 bg-slate-900/70 p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-white">Workflows</h2>
            <span className="text-xs text-slate-400">Live state</span>
          </div>
          <div className="mt-4 space-y-3">
            {workflowStatuses.map((workflow) => (
              <div
                key={workflow.name}
                className="rounded-2xl border border-white/5 bg-slate-950/40 p-4 text-sm text-slate-200"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-base font-semibold text-white">{workflow.name}</p>
                  <span className={`rounded-full border px-3 py-0.5 text-xs capitalize ${statusClass(workflow.status)}`}>
                    {workflow.status}
                  </span>
                </div>
                <p className="text-sm text-slate-300">{workflow.detail}</p>
                <p className="text-xs text-slate-500">Last run · {workflow.lastRun}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-white/5 bg-slate-900/70 p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-white">Runbooks</h2>
            <span className="text-xs text-slate-400">SLA &lt; 60m</span>
          </div>
          <div className="mt-4 space-y-3">
            {runbooks.map((runbook) => (
              <div
                key={runbook.name}
                className="rounded-2xl border border-white/5 bg-slate-950/40 p-4 text-sm text-slate-200"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-base font-semibold text-white">{runbook.name}</p>
                  <span className={`rounded-full border px-3 py-0.5 text-xs capitalize ${statusClass(runbook.stage)}`}>
                    {runbook.stage}
                  </span>
                </div>
                <p className="text-xs text-slate-400">Owner · {runbook.owner}</p>
                <p className="text-sm text-slate-300">ETA {runbook.eta}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </ShenoraShell>
  );
}
