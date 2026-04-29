import ShenoraShell from "@/components/ShenoraShell";
import { signalFeed } from "@/Data/shenora";

const regimes = [
  {
    label: "System Capital",
    posture: "Risk-On",
    confidence: 77,
    horizon: "72h",
    note: "Liquidity impulse + tighter spreads",
  },
  {
    label: "Atlas Research",
    posture: "Neutral",
    confidence: 61,
    horizon: "1w",
    note: "Author network still calibrating",
  },
  {
    label: "Pulse Social",
    posture: "Watch",
    confidence: 55,
    horizon: "Daily",
    note: "Awaiting engagement data",
  },
];

const backlog = [
  { label: "Energy vol tracker", status: "Ready", owner: "System Capital" },
  { label: "CTA sentiment sweep", status: "Running", owner: "Atlas" },
  { label: "Audience lift", status: "Queued", owner: "Pulse" },
];

const statusClass = (status: string) => {
  switch (status.toLowerCase()) {
    case "risk-on":
      return "text-emerald-200 border-emerald-400/30 bg-emerald-500/10";
    case "neutral":
      return "text-cyan-200 border-cyan-400/30 bg-cyan-500/10";
    case "watch":
      return "text-amber-200 border-amber-300/30 bg-amber-500/10";
    case "ready":
      return "text-emerald-200 border-emerald-400/30 bg-emerald-500/10";
    case "running":
      return "text-cyan-200 border-cyan-400/30 bg-cyan-500/10";
    case "queued":
      return "text-amber-200 border-amber-300/30 bg-amber-500/10";
    default:
      return "text-slate-200 border-white/15 bg-slate-900/60";
  }
};

export default function SignalsPage() {
  return (
    <ShenoraShell
      current="signals"
      title="Signals"
      description="Track sentiment, regimes, and feed health across Shenora Network."
    >
      <section className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="rounded-3xl border border-white/5 bg-slate-900/70 p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-white">Live Feed</h2>
            <span className="text-xs text-slate-400">Terminal stream</span>
          </div>
          <div className="mt-4 space-y-3">
            {signalFeed.map((signal, index) => (
              <article
                key={`${signal.category}-${index}`}
                className="rounded-2xl border border-white/5 bg-slate-950/40 p-4"
              >
                <div className="flex flex-wrap items-center justify-between text-xs text-slate-500">
                  <div className="flex items-center gap-2">
                    <span className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] uppercase tracking-wider">
                      {signal.category}
                    </span>
                    <span>{signal.timestamp}</span>
                  </div>
                  <span className="text-emerald-300 text-sm font-semibold">{signal.confidence}%</span>
                </div>
                <p className="mt-2 text-base font-semibold text-white">{signal.headline}</p>
                <p className="text-sm text-slate-300">{signal.detail}</p>
              </article>
            ))}
          </div>
        </div>
        <div className="space-y-6">
          <div className="rounded-3xl border border-white/5 bg-slate-900/70 p-6">
            <h2 className="text-xl font-semibold text-white">Regime Snapshot</h2>
            <div className="mt-4 space-y-3">
              {regimes.map((regime) => (
                <div key={regime.label} className="rounded-2xl border border-white/5 bg-slate-950/40 p-4">
                  <div className="flex items-center justify-between text-sm text-slate-200">
                    <p className="font-semibold text-white">{regime.label}</p>
                    <span className={`rounded-full border px-3 py-0.5 text-xs ${statusClass(regime.posture)}`}>
                      {regime.posture}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">Confidence {regime.confidence}% · Horizon {regime.horizon}</p>
                  <p className="mt-1 text-sm text-slate-300">{regime.note}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-3xl border border-white/5 bg-slate-900/70 p-6">
            <h2 className="text-xl font-semibold text-white">Signal Backlog</h2>
            <div className="mt-4 space-y-3">
              {backlog.map((entry) => (
                <div key={entry.label} className="rounded-2xl border border-white/5 bg-slate-950/40 p-4 text-sm text-slate-200">
                  <div className="flex items-center justify-between">
                    <p className="text-base font-semibold text-white">{entry.label}</p>
                    <span className={`rounded-full border px-3 py-0.5 text-xs ${statusClass(entry.status)}`}>
                      {entry.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">Owner · {entry.owner}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </ShenoraShell>
  );
}
