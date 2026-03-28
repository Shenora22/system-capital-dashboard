import Link from "next/link";
const quickSignals = [
  { label: "Rates", value: "Watching Fed path" },
  { label: "Liquidity", value: "Conditions stable" },
  { label: "Credit", value: "Spreads mixed" },
];
const highlights = [
  {
    title: "Signal Engine",
    description: "Track macro, liquidity, and risk conditions in one place.",
    href: "/signal-engine",
  },
  {
    title: "Command Center",
    description: "Central dashboard for Alora’s market workflow and decisions.",
    href: "/command-center",
  },
  {
    title: "Ask Alora",
    description: "Quick intervention chat for questions, analysis, and actions.",
    href: "/ask-alora",
  },
];
  export default function Home() {
return (
<main className="min-h-screen bg-slate-950 text-slate-50">
<div className="mx-auto flex max-w-6xl flex-col gap-10 px-6 py-16">
{/* Hero */}
<section className="space-y-6">
<p className="text-xs uppercase tracking-[0.5em] text-slate-500">System Capital</p>
<h1 className="text-4xl font-semibold text-white sm:text-5xl">
Macro Command Center for Intelligent Capital
</h1>
<p className="max-w-3xl text-lg text-slate-300">
Alora ingests geopolitics, central banks, liquidity, credit, and energy to produce an
always-on risk posture. Navigate markets with a living signal stack instead of static
research decks.
</p>
<div className="flex flex-wrap gap-4">
<Link
href="/command-center"
className="rounded-2xl border border-white/10 bg-white/5 px-6 py-3 text-base font-semibold text-white transition hover:border-emerald-400/50 hover:bg-emerald-500/20"
>
Enter Command Center
</Link>
<Link
href="/command-center#ask-alora"
className="rounded-2xl border border-white/5 px-6 py-3 text-base text-slate-200 transition hover:border-white/30"
>
Ask Alora
</Link>
</div>
</section>

{/* Quick signals */}
<section className="grid gap-4 sm:grid-cols-3">
{quickSignals.map((item) => (
<div
key={item.label}
className="rounded-2xl border border-white/5 bg-slate-900/70 p-4 text-sm text-slate-300"
>      <p className="text-xs uppercase tracking-wide text-slate-500">
        {item.label}
      </p>
      <p className="mt-2 text-2xl font-semibold text-white">
  {item.value}
</p>
       
</div>
))}
</section>

{/* Highlights */}
<section className="rounded-3xl border border-white/5 bg-slate-900/60 p-6">
<div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
<div>
<p className="text-sm uppercase tracking-[0.3em] text-slate-500">Capabilities</p>
<h2 className="text-3xl font-semibold text-white">Glass Dashboard Modules</h2>
<p className="mt-2 max-w-2xl text-slate-300">
Every module sits on a glass panel with dark mode by default. The same components
power `/command-center`, so this landing shows exactly what you get inside.
</p>
</div>
<Link
href="/command-center"
className="self-start rounded-full border border-emerald-400/40 px-4 py-2 text-sm font-medium text-emerald-200 transition hover:bg-emerald-500/10"
>
View Dashboard
</Link>
</div>

<div className="mt-8 grid gap-4 md:grid-cols-3">
{highlights.map((item) => (
<Link
key={item.title}
href={item.href}
className="rounded-2xl border border-white/5 bg-slate-950/40 p-5 transition hover:border-emerald-400/30"
>
<p className="text-sm uppercase tracking-wide text-slate-500">{item.title}</p>
<p className="mt-3 text-base text-slate-200">{item.description}</p>
</Link>
))}
</div>
</section>
</div>
</main>
);
}