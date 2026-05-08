import ShenoraShell from "@/dashboard/components/ShenoraShell";

const operationLanes = [
  { label: "Agent orchestration", value: "98.4%", detail: "Live automation uptime", accentClass: "bg-emerald-400/60" },
  { label: "Workflow queue", value: "42", detail: "n8n/OpenClaw runs tracked", accentClass: "bg-cyan-400/60" },
  { label: "Open decisions", value: "9", detail: "Awaiting founder review", accentClass: "bg-amber-400/60" },
];

const runbook = [
  "Confirm morning signal sweep and liquidity posture.",
  "Review agent escalations before external publishing.",
  "Approve automation changes after test-run evidence is attached.",
];

export default function OperationsPage() {
  return (
    <ShenoraShell
      current="operations"
      title="Operations"
      description="Monitor active command lanes, automation throughput, and decision queues."
    >
      <section className="grid gap-6 lg:grid-cols-3">
        {operationLanes.map((lane) => (
          <article key={lane.label} className="rounded-3xl border border-white/5 bg-slate-900/70 p-6">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">{lane.label}</p>
            <strong className="mt-4 block text-4xl text-white">{lane.value}</strong>
            <p className="mt-2 text-sm text-slate-400">{lane.detail}</p>
            <div className={`mt-5 h-1.5 rounded-full ${lane.accentClass}`} />
          </article>
        ))}
      </section>

      <section className="rounded-3xl border border-white/5 bg-slate-900/70 p-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Operator Runbook</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">Today&apos;s control loop</h2>
          </div>
          <span className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-200">
            In control
          </span>
        </div>
        <div className="mt-6 grid gap-3">
          {runbook.map((item, index) => (
            <div key={item} className="rounded-2xl border border-white/5 bg-slate-950/40 p-4 text-sm text-slate-300">
              <span className="mr-3 text-emerald-300">0{index + 1}</span>
              {item}
            </div>
          ))}
        </div>
      </section>
    </ShenoraShell>
  );
}
