import ShenoraShell from "@/dashboard/components/ShenoraShell";

const missions = [
  { name: "Tally → Payment Flow", owner: "Ops", status: "Live", next: "Verify production package selector" },
  { name: "Notion Agent Logs", owner: "Agents", status: "Live", next: "Monitor /api/logs health" },
  { name: "Macro Signal Watch", owner: "Research", status: "Running", next: "Refresh regime note" },
  { name: "Automation Backup", owner: "n8n", status: "Scheduled", next: "Nightly workflow export" },
];

export default function MissionControlPage() {
  return (
    <ShenoraShell current="mission-control" title="Mission Control" description="Priority mission board for operating workflows, agent telemetry, and lead routing.">
      <section className="rounded-3xl border border-white/5 bg-slate-900/70 p-6">
        <div className="grid gap-4">
          {missions.map((mission) => (
            <article key={mission.name} className="rounded-2xl border border-white/5 bg-slate-950/40 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-white">{mission.name}</h2>
                  <p className="text-sm text-slate-400">Owner · {mission.owner}</p>
                </div>
                <span className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-200">{mission.status}</span>
              </div>
              <p className="mt-3 text-sm text-slate-300">Next action: {mission.next}</p>
            </article>
          ))}
        </div>
      </section>
    </ShenoraShell>
  );
}
