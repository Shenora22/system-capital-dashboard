import ShenoraShell from "@/components/ShenoraShell";

const projects = [
  {
    name: "System Capital",
    status: "Active",
    owner: "Macro Ops",
    scope: "Market intelligence",
    summary: "Command Center + signal engine",
    milestones: ["Energy drill", "Credit sync", "APAC brief"],
  },
  {
    name: "Atlas Research",
    status: "Design",
    owner: "Research",
    scope: "Deep dives",
    summary: "Author network + publishing",
    milestones: ["Author onboarding", "Topic graph"],
  },
  {
    name: "Pulse Social",
    status: "Pilot",
    owner: "Growth",
    scope: "Audience graph",
    summary: "Clips + newsletter syndication",
    milestones: ["LinkedIn pilot", "YT Shorts"],
  },
  {
    name: "Ops Mesh",
    status: "Planning",
    owner: "Ops",
    scope: "Automation fabric",
    summary: "Unified workflow state",
    milestones: ["Runbook merge", "SLA telemetry"],
  },
];

const statusClass = (status: string) => {
  switch (status.toLowerCase()) {
    case "active":
      return "text-emerald-200 border-emerald-400/30 bg-emerald-500/10";
    case "design":
      return "text-cyan-200 border-cyan-400/30 bg-cyan-500/10";
    case "pilot":
      return "text-amber-200 border-amber-300/30 bg-amber-500/10";
    case "planning":
      return "text-slate-200 border-white/20 bg-slate-900/50";
    default:
      return "text-slate-200 border-white/15 bg-slate-900/60";
  }
};

const backlog = [
  { title: "Portfolio Copilot", owner: "Advisory", status: "Scoping" },
  { title: "Partner API", owner: "Platform", status: "Feasibility" },
  { title: "Comms Studio", owner: "Growth", status: "Intake" },
];

export default function ProjectsPage() {
  return (
    <ShenoraShell
      current="projects"
      title="Projects"
      description="Track every initiative running inside Shenora Network."
    >
      <section className="grid gap-4 md:grid-cols-2">
        {projects.map((project) => (
          <article
            key={project.name}
            className="rounded-3xl border border-white/5 bg-slate-900/70 p-5"
          >
            <div className="flex items-center justify-between text-xs uppercase tracking-wide text-slate-500">
              <span>{project.name}</span>
              <span className={`rounded-full border px-3 py-0.5 text-[11px] ${statusClass(project.status)}`}>
                {project.status}
              </span>
            </div>
            <p className="mt-2 text-base font-semibold text-white">{project.scope}</p>
            <p className="text-sm text-slate-300">{project.summary}</p>
            <p className="mt-3 text-xs text-slate-500">Owner · {project.owner}</p>
            <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-200">
              {project.milestones.map((milestone) => (
                <span
                  key={milestone}
                  className="rounded-full border border-white/10 px-3 py-0.5"
                >
                  {milestone}
                </span>
              ))}
            </div>
          </article>
        ))}
      </section>

      <section className="rounded-3xl border border-white/5 bg-slate-900/70 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-semibold text-white">Backlog</h2>
          <span className="text-xs text-slate-400">Next up</span>
        </div>
        <div className="mt-4 space-y-3">
          {backlog.map((item) => (
            <div
              key={item.title}
              className="rounded-2xl border border-white/5 bg-slate-950/40 p-4 text-sm text-slate-200"
            >
              <div className="flex items-center justify-between">
                <p className="text-base font-semibold text-white">{item.title}</p>
                <span className="text-xs text-slate-400">{item.status}</span>
              </div>
              <p className="text-xs text-slate-400">Owner · {item.owner}</p>
            </div>
          ))}
        </div>
      </section>
    </ShenoraShell>
  );
}
