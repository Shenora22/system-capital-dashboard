import ShenoraShell from "@/dashboard/components/ShenoraShell";

const roadmap = [
  {
    horizon: "Now",
    title: "Navigation recovery",
    status: "Shipping",
    detail: "Restore durable access to roadmap and mission-control surfaces from every dashboard module.",
  },
  {
    horizon: "Next",
    title: "Agent telemetry depth",
    status: "In progress",
    detail: "Add richer health, owner, and escalation context to the agent registry and activity stream.",
  },
  {
    horizon: "Soon",
    title: "Workflow release gates",
    status: "Planned",
    detail: "Connect automation deployments to test evidence, approvals, and rollback notes.",
  },
];

const milestones = [
  "Single sidebar across mission modules",
  "Dashboard cards route only to live pages",
  "Build and localhost route verification before release",
];

export default function RoadmapPage() {
  return (
    <ShenoraShell
      current="roadmap"
      title="Roadmap"
      description="Track near-term System Capital OS priorities and release confidence."
    >
      <section className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-4">
          {roadmap.map((item) => (
            <article key={item.title} className="rounded-3xl border border-white/5 bg-slate-900/70 p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs uppercase tracking-[0.35em] text-slate-500">{item.horizon}</p>
                <span className="rounded-full border border-cyan-400/30 bg-cyan-500/10 px-3 py-1 text-xs font-medium text-cyan-200">
                  {item.status}
                </span>
              </div>
              <h2 className="mt-4 text-2xl font-semibold text-white">{item.title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-400">{item.detail}</p>
            </article>
          ))}
        </div>

        <aside className="rounded-3xl border border-white/5 bg-slate-900/70 p-6">
          <p className="text-xs uppercase tracking-[0.35em] text-slate-500">Release checks</p>
          <h2 className="mt-3 text-xl font-semibold text-white">Definition of done</h2>
          <div className="mt-5 space-y-3">
            {milestones.map((milestone) => (
              <div key={milestone} className="rounded-2xl border border-white/5 bg-slate-950/40 p-4 text-sm text-slate-300">
                <span className="mr-2 text-emerald-300">✓</span>
                {milestone}
              </div>
            ))}
          </div>
        </aside>
      </section>
    </ShenoraShell>
  );
}
