<<<<<<< HEAD
import MissionControlRoadmap from "@/components/MissionControlRoadmap";

export default function OperationsPage() {
  return <MissionControlRoadmap />;
=======
import Link from "next/link";
import ShenoraShell from "@/dashboard/components/ShenoraShell";
import { agentRoster, workflowStatuses, signalFeed } from "@/memory/data/shenora";

const incidentQueue = [
  { name: "Monitoring Agent liquidity drift", priority: "High", owner: "Ops", status: "Escalated", href: "/agents" },
  { name: "Compliance attest workflow", priority: "Medium", owner: "Legal", status: "Blocked", href: "/automation" },
  { name: "Signal brief review", priority: "Normal", owner: "Research", status: "Ready", href: "/signals" },
];

const operatingLanes = [
  { lane: "Agents", value: agentRoster.length, detail: `${agentRoster.filter((agent) => agent.status === "running").length} running`, href: "/agents" },
  { lane: "Automations", value: workflowStatuses.length, detail: `${workflowStatuses.filter((workflow) => workflow.status === "blocked").length} blocked`, href: "/automation" },
  { lane: "Signals", value: signalFeed.length, detail: `${signalFeed[0]?.confidence ?? 0}% top confidence`, href: "/signals" },
  { lane: "Deployment", value: 4, detail: "2 staged releases", href: "/deployment" },
];

const statusClass = (status: string) => {
  if (["Escalated", "Blocked"].includes(status)) return "border-rose-300/30 bg-rose-400/10 text-rose-100";
  if (status === "Ready") return "border-emerald-300/30 bg-emerald-400/10 text-emerald-100";
  return "border-cyan-300/30 bg-cyan-400/10 text-cyan-100";
};

export default function OperationsPage() {
  return (
    <ShenoraShell
      current="operations"
      title="Operations"
      description="Operational control lane for owners, incidents, execution queues, and cross-module handoffs."
    >
      <section className="grid gap-4 md:grid-cols-4">
        {operatingLanes.map((lane) => (
          <Link key={lane.lane} href={lane.href} className="rounded-3xl border border-white/5 bg-slate-900/70 p-5 transition hover:border-cyan-300/40 hover:bg-cyan-300/10">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">{lane.lane}</p>
            <p className="mt-3 text-4xl font-semibold text-white">{lane.value}</p>
            <p className="mt-2 text-sm text-slate-400">{lane.detail}</p>
          </Link>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
        <div className="rounded-3xl border border-white/5 bg-slate-900/70 p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-white">Active operations queue</h2>
            <Link href="/command-center" className="text-sm font-semibold text-cyan-300">Open command center →</Link>
          </div>
          <div className="mt-5 space-y-3">
            {incidentQueue.map((item) => (
              <Link key={item.name} href={item.href} className="block rounded-2xl border border-white/5 bg-slate-950/40 p-4 transition hover:border-white/20">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-white">{item.name}</p>
                    <p className="text-sm text-slate-400">Owner · {item.owner} · Priority {item.priority}</p>
                  </div>
                  <span className={`rounded-full border px-3 py-1 text-xs ${statusClass(item.status)}`}>{item.status}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-white/5 bg-slate-900/70 p-6">
          <h2 className="text-xl font-semibold text-white">Operating instructions</h2>
          <div className="mt-5 space-y-4 text-sm text-slate-300">
            <p>1. Review escalated logs in Command Center.</p>
            <p>2. Open owning module and resolve blocker.</p>
            <p>3. Update workflow or agent owner before release.</p>
            <p>4. Promote clean runs into deployment after signal review.</p>
          </div>
        </div>
      </section>
    </ShenoraShell>
  );
>>>>>>> origin/main
}
