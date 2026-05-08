<<<<<<< HEAD
import SystemCapitalModulePlaceholder from "@/components/SystemCapitalModulePlaceholder";

export default function DeploymentPage() {
  return (
    <SystemCapitalModulePlaceholder
      title="Deployment Status"
      kicker="Deployment"
      description="A premium placeholder for production releases, environment readiness, rollback state, and launch gates across System Capital surfaces."
      metrics={[
        { label: "Production surfaces", value: "7" },
        { label: "Pending gates", value: "3" },
        { label: "Rollback plans", value: "Ready" },
      ]}
      focus={[
        "Track release stages from preview to production with owner, risk, and approval status.",
        "Add deployment checklists for Vercel, n8n workflows, Notion sources, and API secrets.",
        "Expose recent release events without leaking server-only credentials to the browser.",
      ]}
    />
=======
import Link from "next/link";
import ShenoraShell from "@/dashboard/components/ShenoraShell";

const environments = [
  { name: "Production", status: "Healthy", version: "scd-2026.05.07", checks: "8/8 passing" },
  { name: "Preview", status: "Ready", version: "dashboard-ops", checks: "7/8 passing" },
  { name: "Automation Runtime", status: "Blocked", version: "n8n-local", checks: "Needs env config" },
  { name: "Social Posting", status: "Review", version: "x-api-adapter", checks: "OAuth pending" },
];

const releaseTasks = [
  { task: "Verify Notion Agent Logs", owner: "Ops", state: "Ready", href: "/command-center" },
  { task: "Promote n8n webhook env vars", owner: "Automation", state: "Blocked", href: "/automation" },
  { task: "Review social posting credentials", owner: "Marketing", state: "Review", href: "/agents" },
  { task: "Confirm prompt governance pack", owner: "AI", state: "Queued", href: "/prompts" },
];

const statusClass = (status: string) => {
  if (status === "Healthy" || status === "Ready") return "border-emerald-300/30 bg-emerald-400/10 text-emerald-100";
  if (status === "Blocked") return "border-rose-300/30 bg-rose-400/10 text-rose-100";
  return "border-amber-300/30 bg-amber-400/10 text-amber-100";
};

export default function DeploymentPage() {
  return (
    <ShenoraShell
      current="deployment"
      title="Deployment"
      description="Release readiness, environment health, blockers, and operational promotion checklist."
    >
      <section className="grid gap-4 md:grid-cols-4">
        {environments.map((environment) => (
          <article key={environment.name} className="rounded-3xl border border-white/5 bg-slate-900/70 p-5">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">{environment.name}</p>
            <span className={`mt-4 inline-flex rounded-full border px-3 py-1 text-xs ${statusClass(environment.status)}`}>{environment.status}</span>
            <p className="mt-4 text-sm text-slate-300">{environment.version}</p>
            <p className="text-xs text-slate-500">{environment.checks}</p>
          </article>
        ))}
      </section>

      <section className="rounded-3xl border border-white/5 bg-slate-900/70 p-6">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-xl font-semibold text-white">Release checklist</h2>
          <Link href="/command-center" className="text-sm font-semibold text-cyan-300">Control release →</Link>
        </div>
        <div className="mt-5 space-y-3">
          {releaseTasks.map((task) => (
            <Link key={task.task} href={task.href} className="block rounded-2xl border border-white/5 bg-slate-950/40 p-4 transition hover:border-cyan-300/40">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-white">{task.task}</p>
                  <p className="text-sm text-slate-400">Owner · {task.owner}</p>
                </div>
                <span className={`rounded-full border px-3 py-1 text-xs ${statusClass(task.state)}`}>{task.state}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </ShenoraShell>
>>>>>>> origin/main
  );
}
