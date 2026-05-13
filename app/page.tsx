import Link from "next/link";

import { PilotAccessForm } from "./components/PilotAccessForm";

const signalFlow = [
  "Inbound lead detected",
  "AI analyzes signal",
  "Urgency scored",
  "Workflow routed",
  "Response generated",
  "Operator notified",
];

const workflowStages = [
  "Lead Detected",
  "AI Analysis",
  "Urgency Scoring",
  "Workflow Routing",
  "Response Generation",
  "Operator Escalation",
];

const operationalMetrics = [
  {
    title: "Faster Response Times",
    description: "Shorten the gap between inbound signal and first qualified action.",
  },
  {
    title: "Reduced Missed Leads",
    description: "Keep high-value opportunities visible with routing and escalation logic.",
  },
  {
    title: "Operational Visibility",
    description: "Give operators a clear view of status, owners, bottlenecks, and next steps.",
  },
  {
    title: "Automated Routing",
    description: "Move work to the right person or workflow before momentum is lost.",
  },
];

const modules = [
  {
    title: "Lead Intelligence",
    description:
      "Qualify opportunities with structured context, source attribution, and fit signals before they enter the pipeline.",
    metric: "Fit + intent",
  },
  {
    title: "Workflow Routing",
    description:
      "Move each signal into the right lane with rules, AI classification, owner assignment, and priority logic.",
    metric: "Route in seconds",
  },
  {
    title: "AI Response Generation",
    description:
      "Draft precise replies, internal summaries, and next-step briefs that keep response quality consistent.",
    metric: "Drafted instantly",
  },
  {
    title: "Escalation Systems",
    description:
      "Surface high-risk or high-value events to the right operator with clean context and clear action paths.",
    metric: "No missed handoffs",
  },
  {
    title: "Command Dashboards",
    description:
      "Centralize operational visibility across intake, status, alerts, owners, and performance signals.",
    metric: "Live visibility",
  },
  {
    title: "Operational Alerts",
    description:
      "Trigger notifications from business-critical thresholds, delays, changes, and opportunity windows.",
    metric: "Always-on watch",
  },
];

const audiences = [
  "Security companies",
  "Agencies",
  "Consultants",
  "Service businesses",
  "Operations teams",
  "Infrastructure-focused companies",
];

const pilotSystems = [
  "Lead intelligence workflows",
  "Automated response systems",
  "Operational routing",
  "Escalation infrastructure",
  "AI-generated workflow actions",
  "Command dashboard integrations",
];

const commandStats = [
  { label: "Signal status", value: "Live" },
  { label: "Routing mode", value: "AI + rules" },
  { label: "Operator queue", value: "Prioritized" },
];

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#030712] text-slate-50">
      <div className="pointer-events-none fixed inset-0 opacity-80">
        <div className="absolute left-1/2 top-0 h-[34rem] w-[34rem] -translate-x-1/2 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="absolute right-0 top-1/3 h-96 w-96 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(148,163,184,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.04)_1px,transparent_1px)] bg-[size:72px_72px]" />
      </div>

      <div className="relative mx-auto flex max-w-7xl flex-col gap-24 px-6 py-8 sm:px-8 lg:px-10">
        <header className="flex items-center justify-between border-b border-white/10 pb-6">
          <Link href="/" className="group flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-2xl border border-cyan-300/20 bg-white/[0.06] shadow-[0_0_40px_rgba(34,211,238,0.14)] transition group-hover:border-cyan-300/50">
              <span className="h-2.5 w-2.5 rounded-full bg-cyan-200 shadow-[0_0_18px_rgba(165,243,252,0.9)]" />
            </span>
            <span>
              <span className="block text-sm font-semibold uppercase tracking-[0.34em] text-white">
                System Capital
              </span>
              <span className="block text-xs text-slate-500">Operational intelligence systems</span>
            </span>
          </Link>
          <Link
            href="/command-center"
            className="hidden rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-cyan-300/40 hover:bg-cyan-300/10 sm:inline-flex"
          >
            Command Center
          </Link>
        </header>

        <section className="grid items-center gap-12 pt-4 lg:grid-cols-[1.02fr_0.98fr]">
          <div className="space-y-8">
            <div className="inline-flex rounded-full border border-cyan-300/20 bg-cyan-300/[0.06] px-4 py-2 text-xs font-medium uppercase tracking-[0.28em] text-cyan-100">
              AI-native operations infrastructure
            </div>
            <div className="space-y-5">
              <h1 className="max-w-4xl text-5xl font-semibold tracking-[-0.04em] text-white sm:text-6xl lg:text-7xl">
                Operational Intelligence for Modern Businesses
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-slate-300 sm:text-xl">
                System Capital builds AI-native workflows that analyze signals, route
                opportunities, automate responses, and improve operational execution.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/lead/next-step"
                className="rounded-2xl bg-cyan-100 px-6 py-3 text-center text-base font-semibold text-slate-950 shadow-[0_0_35px_rgba(165,243,252,0.22)] transition hover:-translate-y-0.5 hover:bg-white"
              >
                Request Demo
              </Link>
              <Link
                href="/command-center"
                className="rounded-2xl border border-white/12 bg-white/[0.04] px-6 py-3 text-center text-base font-semibold text-white backdrop-blur transition hover:-translate-y-0.5 hover:border-emerald-300/40 hover:bg-emerald-300/10"
              >
                Open Command Center
              </Link>
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-white/[0.045] p-4 shadow-2xl shadow-cyan-950/30 backdrop-blur-xl">
            <div className="rounded-[1.5rem] border border-white/10 bg-slate-950/70 p-5">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Mission Control</p>
                  <h2 className="mt-2 text-xl font-semibold text-white">Opportunity routing layer</h2>
                </div>
                <span className="rounded-full border border-emerald-300/30 bg-emerald-300/10 px-3 py-1 text-xs font-medium text-emerald-100">
                  Online
                </span>
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                {commandStats.map((item) => (
                  <div key={item.label} className="rounded-2xl border border-white/8 bg-white/[0.04] p-3">
                    <p className="text-[0.68rem] uppercase tracking-[0.2em] text-slate-500">{item.label}</p>
                    <p className="mt-2 text-sm font-semibold text-slate-100">{item.value}</p>
                  </div>
                ))}
              </div>
              <div className="mt-5 space-y-3">
                {signalFlow.slice(0, 4).map((step, index) => (
                  <div key={step} className="flex items-center gap-3 rounded-2xl border border-white/8 bg-slate-900/70 p-3">
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-cyan-300/10 text-xs font-semibold text-cyan-100">
                      0{index + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-slate-100">{step}</p>
                      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/5">
                        <div className="h-full rounded-full bg-gradient-to-r from-cyan-200 to-emerald-300" style={{ width: `${54 + index * 12}%` }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-[2rem] border border-white/10 bg-white/[0.045] p-5 shadow-2xl shadow-cyan-950/20 backdrop-blur-xl md:p-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.32em] text-cyan-100/70">Workflow Visualization</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-white sm:text-4xl">
                The operating path from lead signal to escalation.
              </h2>
            </div>
            <p className="max-w-xl text-sm leading-6 text-slate-400">
              A concise view of how System Capital turns fragmented intake into structured operational action.
            </p>
          </div>
          <div className="mt-8 grid gap-3 lg:grid-cols-6">
            {workflowStages.map((stage, index) => (
              <div key={stage} className="relative rounded-3xl border border-white/10 bg-slate-950/55 p-4 transition hover:-translate-y-1 hover:border-cyan-300/35 hover:bg-cyan-300/[0.06]">
                <div className="flex items-center justify-between gap-3 lg:block">
                  <span className="grid h-10 w-10 place-items-center rounded-2xl border border-cyan-300/20 bg-cyan-300/10 text-xs font-semibold text-cyan-100 shadow-[0_0_25px_rgba(103,232,249,0.12)]">
                    0{index + 1}
                  </span>
                  <span className="h-2 w-2 rounded-full bg-emerald-300 shadow-[0_0_20px_rgba(110,231,183,0.75)] motion-safe:animate-pulse" />
                </div>
                <p className="mt-5 text-sm font-semibold text-white">{stage}</p>
                {index < workflowStages.length - 1 ? (
                  <div className="absolute -bottom-5 left-1/2 grid h-6 w-6 -translate-x-1/2 place-items-center text-cyan-100/70 lg:-right-4 lg:bottom-auto lg:left-auto lg:top-1/2 lg:-translate-y-1/2 lg:translate-x-0">
                    <span className="text-lg leading-none lg:hidden">↓</span>
                    <span className="hidden text-lg leading-none lg:inline">→</span>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.32em] text-cyan-100/70">Signal Layer</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-white sm:text-4xl">
                From inbound signal to operator action.
              </h2>
            </div>
            <p className="max-w-xl text-sm leading-6 text-slate-400">
              A calm routing system for the moments when speed, context, and execution quality matter.
            </p>
          </div>
          <div className="grid gap-3 md:grid-cols-6">
            {signalFlow.map((step, index) => (
              <div key={step} className="group relative rounded-3xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur transition hover:-translate-y-1 hover:border-cyan-300/35 hover:bg-cyan-300/[0.07]">
                <p className="text-xs font-semibold text-cyan-100">0{index + 1}</p>
                <p className="mt-8 text-sm font-medium leading-6 text-slate-100">{step}</p>
                {index < signalFlow.length - 1 && (
                  <span className="absolute -right-2 top-1/2 hidden h-px w-4 bg-cyan-200/40 md:block" />
                )}
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-8">
          <div className="max-w-3xl">
            <p className="text-sm uppercase tracking-[0.32em] text-cyan-100/70">Operational Modules</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-white sm:text-4xl">
              Infrastructure blocks for AI-native business workflows.
            </h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {modules.map((module) => (
              <article key={module.title} className="rounded-[1.75rem] border border-white/10 bg-slate-900/55 p-6 backdrop-blur transition hover:-translate-y-1 hover:border-emerald-300/35 hover:bg-slate-900/80">
                <p className="text-xs font-medium uppercase tracking-[0.25em] text-emerald-100/70">{module.metric}</p>
                <h3 className="mt-5 text-xl font-semibold text-white">{module.title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-400">{module.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="grid gap-10 rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 backdrop-blur md:grid-cols-[0.8fr_1.2fr] md:p-8">
          <div>
            <p className="text-sm uppercase tracking-[0.32em] text-cyan-100/70">Who it&apos;s for</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-white">
              Built for teams where operations are the product.
            </h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {audiences.map((audience) => (
              <div key={audience} className="rounded-2xl border border-white/10 bg-slate-950/45 px-4 py-4 text-sm font-medium text-slate-200">
                {audience}
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-[2rem] border border-white/10 bg-slate-900/50 p-6 backdrop-blur md:p-8">
          <div className="grid gap-8 lg:grid-cols-[0.82fr_1.18fr]">
            <div>
              <p className="text-sm uppercase tracking-[0.32em] text-cyan-100/70">Response Speed / Operational Pain</p>
              <h2 className="mt-4 text-3xl font-semibold tracking-[-0.03em] text-white sm:text-4xl">
                Slow response times create operational risk.
              </h2>
            </div>
            <div className="rounded-[1.75rem] border border-cyan-300/15 bg-cyan-300/[0.055] p-6">
              <p className="text-lg leading-8 text-slate-200">
                Most businesses lose opportunities because workflows are fragmented, response times are delayed, and operational visibility is limited.
              </p>
              <p className="mt-5 text-lg leading-8 text-slate-300">
                System Capital creates AI-native operational systems that improve responsiveness, routing, escalation handling, and workflow coordination.
              </p>
            </div>
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {operationalMetrics.map((metric) => (
              <article key={metric.title} className="rounded-3xl border border-white/10 bg-slate-950/50 p-5 transition hover:-translate-y-1 hover:border-emerald-300/35 hover:bg-slate-950/75">
                <div className="mb-5 h-1.5 w-12 rounded-full bg-gradient-to-r from-cyan-200 to-emerald-300" />
                <h3 className="text-base font-semibold text-white">{metric.title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-400">{metric.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="grid gap-6 rounded-[2rem] border border-white/10 bg-slate-950/55 p-6 shadow-2xl shadow-cyan-950/20 backdrop-blur md:grid-cols-[1fr_0.85fr] md:p-8">
          <div className="space-y-6">
            <div>
              <p className="text-sm uppercase tracking-[0.32em] text-cyan-100/70">Pilot Engagements</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-white sm:text-4xl">
                Limited pilot deployments for AI-native operational workflows.
              </h2>
            </div>
            <p className="max-w-2xl text-base leading-7 text-slate-300">
              System Capital currently works with a limited number of pilot partners to
              deploy AI-native operational workflows customized to each organization’s
              operational environment.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              {pilotSystems.map((system) => (
                <div key={system} className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-medium text-slate-200">
                  {system}
                </div>
              ))}
            </div>
          </div>

          <aside className="rounded-[1.75rem] border border-cyan-300/20 bg-cyan-300/[0.06] p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-100/70">Starting at</p>
            <p className="mt-4 text-4xl font-semibold tracking-[-0.04em] text-white">
              $500 – $2,500+
            </p>
            <p className="mt-4 text-sm leading-6 text-slate-300">
              Pricing depends on workflow complexity, integration requirements, and
              operational scope. Each deployment is scoped around the systems that create
              the fastest operational lift.
            </p>
            <a
              href="#pilot-intake"
              className="mt-6 inline-flex w-full justify-center rounded-2xl bg-cyan-100 px-6 py-3 text-base font-semibold text-slate-950 shadow-[0_0_35px_rgba(165,243,252,0.22)] transition hover:-translate-y-0.5 hover:bg-white"
            >
              Request Pilot Access
            </a>
          </aside>

          <div id="pilot-intake" className="md:col-span-2">
            <PilotAccessForm />
          </div>
        </section>

        <section className="mb-8 rounded-[2.25rem] border border-white/10 bg-gradient-to-br from-white/[0.08] to-cyan-300/[0.06] p-8 text-center shadow-2xl shadow-cyan-950/20 backdrop-blur md:p-12">
          <p className="text-sm uppercase tracking-[0.32em] text-cyan-100/70">Deploy the operating layer</p>
          <h2 className="mx-auto mt-4 max-w-3xl text-4xl font-semibold tracking-[-0.04em] text-white sm:text-5xl">
            Build faster operational systems.
          </h2>
          <a
            href="#pilot-intake"
            className="mt-8 inline-flex rounded-2xl bg-cyan-100 px-7 py-3 text-base font-semibold text-slate-950 shadow-[0_0_35px_rgba(165,243,252,0.22)] transition hover:-translate-y-0.5 hover:bg-white"
          >
            Request Pilot Access
          </a>
        </section>
      </div>
    </main>
  );
}
