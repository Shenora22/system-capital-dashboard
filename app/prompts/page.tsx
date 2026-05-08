import Link from "next/link";
import ShenoraShell from "@/dashboard/components/ShenoraShell";

const promptPacks = [
  { name: "Agent Operator Policy", owner: "AI Ops", version: "v0.4", status: "Draft", use: "Agent guardrails and command interpretation" },
  { name: "Workflow Builder Spec", owner: "Automation", version: "v1.9", status: "Active", use: "Convert SOPs into n8n-ready execution steps" },
  { name: "Market Signal Explainer", owner: "Research", version: "v1.2", status: "Active", use: "Summarize liquidity, credit, energy, and macro shifts" },
  { name: "Brand Voice Pack", owner: "Marketing", version: "v0.8", status: "Review", use: "Generate premium System Capital campaign copy" },
];

const evaluations = [
  { test: "No hallucinated integrations", result: "Passing", detail: "Requires TODO markers for unfinished adapters" },
  { test: "Operator action clarity", result: "Passing", detail: "Every output must include owner, action, and next step" },
  { test: "Brand tone", result: "Review", detail: "Marketing copy needs campaign-specific examples" },
];

const statusClass = (status: string) => {
  if (status === "Active" || status === "Passing") return "border-emerald-300/30 bg-emerald-400/10 text-emerald-100";
  if (status === "Review") return "border-amber-300/30 bg-amber-400/10 text-amber-100";
  return "border-cyan-300/30 bg-cyan-400/10 text-cyan-100";
};

export default function PromptsPage() {
  return (
    <ShenoraShell
      current="prompts"
      title="Prompts"
      description="Prompt packs, evaluation coverage, ownership, and governance controls for System Capital agents."
    >
      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-3xl border border-white/5 bg-slate-900/70 p-5">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Prompt packs</p>
          <p className="mt-3 text-4xl font-semibold text-white">{promptPacks.length}</p>
        </div>
        <div className="rounded-3xl border border-white/5 bg-slate-900/70 p-5">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Evaluations</p>
          <p className="mt-3 text-4xl font-semibold text-white">{evaluations.length}</p>
        </div>
        <Link href="/command-center" className="rounded-3xl border border-cyan-300/20 bg-cyan-300/10 p-5 transition hover:border-cyan-200/60">
          <p className="text-xs uppercase tracking-[0.3em] text-cyan-200">Control</p>
          <p className="mt-3 text-2xl font-semibold text-white">Open Command Center →</p>
        </Link>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.35fr_0.65fr]">
        <div className="rounded-3xl border border-white/5 bg-slate-900/70 p-6">
          <h2 className="text-xl font-semibold text-white">Prompt library</h2>
          <div className="mt-5 space-y-3">
            {promptPacks.map((pack) => (
              <article key={pack.name} className="rounded-2xl border border-white/5 bg-slate-950/40 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-white">{pack.name}</p>
                    <p className="text-sm text-slate-400">{pack.owner} · {pack.version}</p>
                  </div>
                  <span className={`rounded-full border px-3 py-1 text-xs ${statusClass(pack.status)}`}>{pack.status}</span>
                </div>
                <p className="mt-3 text-sm text-slate-300">{pack.use}</p>
              </article>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-white/5 bg-slate-900/70 p-6">
          <h2 className="text-xl font-semibold text-white">Evaluations</h2>
          <div className="mt-5 space-y-3">
            {evaluations.map((evaluation) => (
              <article key={evaluation.test} className="rounded-2xl border border-white/5 bg-slate-950/40 p-4">
                <span className={`rounded-full border px-3 py-1 text-xs ${statusClass(evaluation.result)}`}>{evaluation.result}</span>
                <p className="mt-3 font-semibold text-white">{evaluation.test}</p>
                <p className="text-sm text-slate-400">{evaluation.detail}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </ShenoraShell>
  );
}
