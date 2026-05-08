import ShenoraShell from "@/dashboard/components/ShenoraShell";
import { agentRoster, networkActivityFeed, workflowStatuses } from "@/memory/data/shenora";

const commandMetrics = [
  { label: "Active agents", value: agentRoster.filter((agent) => agent.status === "running").length.toString(), detail: "Running now" },
  { label: "Workflow lanes", value: workflowStatuses.length.toString(), detail: "Tracked automations" },
  { label: "Open signals", value: "187", detail: "Macro + ops inputs" },
  { label: "Lead flow", value: "Pending", detail: "Tally → n8n → Notion" },
];

export default function CommandCenterPage() {
  return (
    <ShenoraShell
      current="command-center"
      title="Command Center"
      description="Unified command surface for agents, workflows, signals, and lead/payment routing."
    >
      <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {commandMetrics.map((metric) => (
          <article key={metric.label} className="rounded-3xl border border-white/5 bg-slate-900/70 p-6">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">{metric.label}</p>
            <p className="mt-3 text-3xl font-semibold text-white">{metric.value}</p>
            <p className="mt-1 text-sm text-slate-400">{metric.detail}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-3xl border border-white/5 bg-slate-900/70 p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-white">Mission Feed</h2>
            <span className="text-xs text-emerald-300">Live</span>
          </div>
          <div className="mt-4 space-y-3">
            {networkActivityFeed.map((item) => (
              <div key={`${item.time}-${item.title}`} className="rounded-2xl border border-white/5 bg-slate-950/40 p-4">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">{item.time}</p>
                <p className="mt-1 text-base font-semibold text-white">{item.title}</p>
                <p className="text-sm text-slate-300">{item.detail}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-white/5 bg-slate-900/70 p-6">
          <h2 className="text-xl font-semibold text-white">Workflow Control</h2>
          <div className="mt-4 space-y-3">
            {workflowStatuses.slice(0, 4).map((workflow) => (
              <div key={workflow.name} className="rounded-2xl border border-white/5 bg-slate-950/40 p-4 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold text-white">{workflow.name}</p>
                  <span className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-0.5 text-xs text-emerald-200">
                    {workflow.status}
                  </span>
                </div>
                <p className="mt-1 text-slate-400">{workflow.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </ShenoraShell>
  );
}
