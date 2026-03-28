import ShenoraShell from "@/components/ShenoraShell";

const timeline = [
  { time: "14:52", title: "Growth Agent synced venture leads", scope: "System Capital", type: "agent" },
  { time: "14:49", title: "Monitoring Agent flag routed to Ops", scope: "Network", type: "alert" },
  { time: "14:45", title: "Energy drill armed", scope: "System Capital", type: "runbook" },
  { time: "14:41", title: "Pulse Social scheduled FOMC clip", scope: "Pulse", type: "content" },
  { time: "14:36", title: "Atlas Research memo updated", scope: "Atlas", type: "research" },
];

const audits = [
  { actor: "OpsBot", action: "Cleared paused workflow 214", time: "14:33", result: "Success" },
  { actor: "Dasir", action: "Approved runbook Energy drill", time: "14:20", result: "Approved" },
  { actor: "Clara", action: "Edited Asia pre-brief", time: "14:12", result: "Saved" },
  { actor: "Growth Agent", action: "Updated outbound copy", time: "14:05", result: "Deployed" },
];

const typeClass = (type: string) => {
  switch (type) {
    case "agent":
      return "border-emerald-400/40 text-emerald-200";
    case "alert":
      return "border-rose-400/40 text-rose-200";
    case "runbook":
      return "border-cyan-400/40 text-cyan-200";
    case "content":
      return "border-amber-400/40 text-amber-200";
    case "research":
      return "border-purple-400/40 text-purple-200";
    default:
      return "border-white/20 text-slate-200";
  }
};

export default function ActivityPage() {
  return (
    <ShenoraShell
      current="activity"
      title="Activity"
      description="Unified log of everything happening across Shenora Network."
    >
      <section className="rounded-3xl border border-white/5 bg-slate-900/70 p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">Live Timeline</h2>
          <span className="text-xs text-slate-400">Rolling 2h</span>
        </div>
        <div className="mt-4 space-y-3">
          {timeline.map((event) => (
            <div
              key={event.title}
              className="flex flex-col gap-1 rounded-2xl border border-white/5 bg-slate-950/40 p-4 text-sm text-slate-200"
            >
              <div className="flex items-center justify-between">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">{event.time}</p>
                <span className={`rounded-full border px-3 py-0.5 text-xs capitalize ${typeClass(event.type)}`}>
                  {event.type}
                </span>
              </div>
              <p className="text-base font-semibold text-white">{event.title}</p>
              <p className="text-xs text-slate-400">{event.scope}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-white/5 bg-slate-900/70 p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">Audit Trail</h2>
          <span className="text-xs text-slate-400">Last 4 changes</span>
        </div>
        <div className="mt-4 space-y-3">
          {audits.map((audit) => (
            <div key={`${audit.actor}-${audit.time}`} className="rounded-2xl border border-white/5 bg-slate-950/40 p-4 text-sm text-slate-200">
              <div className="flex items-center justify-between">
                <p className="text-base font-semibold text-white">{audit.actor}</p>
                <span className="text-xs text-slate-400">{audit.time}</span>
              </div>
              <p className="text-sm text-slate-300">{audit.action}</p>
              <p className="text-xs text-slate-500">{audit.result}</p>
            </div>
          ))}
        </div>
      </section>
    </ShenoraShell>
  );
}
