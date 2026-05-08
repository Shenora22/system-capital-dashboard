import Link from "next/link";

type PlaceholderMetric = {
  label: string;
  value: string;
};

type Props = {
  title: string;
  kicker: string;
  description: string;
  metrics: PlaceholderMetric[];
  focus: string[];
};

export default function SystemCapitalModulePlaceholder({ title, kicker, description, metrics, focus }: Props) {
  return (
    <main className="min-h-screen overflow-hidden bg-[#020617] text-slate-50">
      <section className="relative min-h-screen px-6 py-8 sm:px-10 lg:px-14">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(34,211,238,0.18),transparent_30%),radial-gradient(circle_at_82%_18%,rgba(139,92,246,0.2),transparent_34%),linear-gradient(135deg,#020617_0%,#030711_55%,#070b18_100%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(148,163,184,0.045)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.045)_1px,transparent_1px)] bg-[size:52px_52px] [mask-image:linear-gradient(to_bottom,black,transparent_88%)]" />

        <div className="relative mx-auto grid max-w-7xl gap-6">
          <nav className="flex flex-wrap items-center justify-between gap-4 rounded-[2rem] border border-cyan-300/15 bg-slate-950/55 px-5 py-4 shadow-2xl shadow-black/30 backdrop-blur-2xl">
            <Link href="/dashboard" className="flex items-center gap-3 font-black tracking-[-0.04em] text-white">
              <span className="grid h-11 w-11 place-items-center rounded-2xl border border-cyan-300/40 bg-cyan-300/10 shadow-[0_0_32px_rgba(34,211,238,0.25)]">SC</span>
              <span>
                System Capital
                <span className="block font-mono text-xs uppercase tracking-[0.22em] text-cyan-300">Module Surface</span>
              </span>
            </Link>
            <Link href="/dashboard" className="rounded-full border border-cyan-300/30 bg-cyan-300/10 px-4 py-2 text-sm font-bold text-cyan-100 transition hover:border-cyan-200/70">
              Back to Dashboard
            </Link>
          </nav>

          <section className="grid gap-6 lg:grid-cols-[1.5fr_0.8fr]">
            <div className="rounded-[2.25rem] border border-cyan-300/15 bg-slate-900/55 p-8 shadow-2xl shadow-black/30 backdrop-blur-2xl sm:p-10">
              <p className="font-mono text-xs font-black uppercase tracking-[0.28em] text-cyan-300">{kicker}</p>
              <h1 className="mt-5 max-w-4xl text-5xl font-black leading-[0.9] tracking-[-0.075em] text-white sm:text-7xl">{title}</h1>
              <p className="mt-6 max-w-3xl text-base leading-8 text-slate-300 sm:text-lg">{description}</p>
            </div>

            <div className="grid gap-4">
              {metrics.map((metric) => (
                <div key={metric.label} className="rounded-[1.75rem] border border-white/10 bg-slate-900/55 p-6 shadow-xl shadow-black/20 backdrop-blur-2xl">
                  <p className="font-mono text-xs uppercase tracking-[0.24em] text-slate-400">{metric.label}</p>
                  <p className="mt-2 text-4xl font-black tracking-[-0.06em] text-white">{metric.value}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-[2.25rem] border border-white/10 bg-slate-900/55 p-6 shadow-2xl shadow-black/25 backdrop-blur-2xl sm:p-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-mono text-xs font-black uppercase tracking-[0.28em] text-cyan-300">Build Placeholder</p>
                <h2 className="mt-2 text-2xl font-bold text-white">Module roadmap</h2>
              </div>
              <span className="rounded-full border border-violet-300/30 bg-violet-400/10 px-4 py-2 text-sm font-bold text-violet-100">Ready for implementation</span>
            </div>
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              {focus.map((item) => (
                <article key={item} className="rounded-3xl border border-white/10 bg-slate-950/45 p-5 text-sm leading-7 text-slate-300">
                  {item}
                </article>
              ))}
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
