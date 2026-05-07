import ShenoraShell from "@/dashboard/components/ShenoraShell";

const roadmapItems = [
  { title: "Lead payment confirmation", phase: "Now", detail: "Stripe/n8n confirmation updates Payment Status and Lead Status in Notion." },
  { title: "Agent log persistence", phase: "Now", detail: "Notion-backed /api/logs endpoint remains the agent telemetry source." },
  { title: "Mission dashboard", phase: "Next", detail: "Prioritized operator queue for missions, roadblocks, and release readiness." },
  { title: "Signal automation", phase: "Next", detail: "Automated signal routing from System Capital regimes into runbooks and alerts." },
];

export default function RoadmapPage() {
  return (
    <ShenoraShell current="roadmap" title="Roadmap" description="Delivery path for System Capital command surfaces and automation lanes.">
      <section className="grid gap-4 md:grid-cols-2">
        {roadmapItems.map((item) => (
          <article key={item.title} className="rounded-3xl border border-white/5 bg-slate-900/70 p-6">
            <span className="rounded-full border border-cyan-400/30 bg-cyan-500/10 px-3 py-1 text-xs text-cyan-200">{item.phase}</span>
            <h2 className="mt-4 text-xl font-semibold text-white">{item.title}</h2>
            <p className="mt-2 text-sm text-slate-300">{item.detail}</p>
          </article>
        ))}
      </section>
    </ShenoraShell>
  );
}
