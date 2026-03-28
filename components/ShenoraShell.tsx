import Link from "next/link";
import AskAloraWidget from "./AskAloraWidget";

const navItems = [
  { label: "Overview", href: "/overview", key: "overview" },
  { label: "Projects", href: "/projects", key: "projects" },
  { label: "Agents", href: "/agents", key: "agents" },
  { label: "Automation", href: "/automation", key: "automation" },
  { label: "Signals", href: "/signals", key: "signals" },
  { label: "Activity", href: "/activity", key: "activity" },
  { label: "Settings", href: "/settings", key: "settings" },
];

export default function ShenoraShell({
  children,
  current,
  title,
  description,
}: {
  children: React.ReactNode;
  current: string;
  title: string;
  description?: string;
}) {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <div className="mx-auto flex max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:px-10">
        <aside className="hidden w-64 flex-shrink-0 flex-col rounded-3xl border border-white/5 bg-slate-950/60 p-6 shadow-2xl shadow-slate-900/80 md:flex">
          <div>
            <p className="text-[11px] uppercase tracking-[0.6em] text-slate-500">Shenora</p>
            <p className="mt-1 text-lg font-semibold text-white">Network</p>
            <p className="text-xs text-slate-500">AI Ops OS</p>
          </div>
          <nav className="mt-8 flex flex-col gap-1 text-sm">
            {navItems.map((item) => {
              const isActive = item.key === current;
              return (
                <Link
                  key={item.key}
                  href={item.href}
                  className={`rounded-2xl border px-4 py-2 font-medium transition ${
                    isActive
                      ? "border-emerald-400/40 bg-emerald-500/10 text-white"
                      : "border-white/5 text-slate-300 hover:border-white/20 hover:text-white"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="mt-auto rounded-2xl border border-white/5 bg-slate-900/60 p-4 text-xs text-slate-400">
            <p>Network posture</p>
            <p className="text-base font-semibold text-emerald-300">Green</p>
            <p className="text-[11px] text-slate-500">Updated 5 min ago</p>
          </div>
        </aside>
        <section className="flex-1 space-y-8">
          <header className="rounded-3xl border border-white/5 bg-slate-900/70 px-6 py-6 shadow-xl shadow-slate-900/60">
            <p className="text-[11px] uppercase tracking-[0.5em] text-slate-500">Shenora Network</p>
            <h1 className="text-3xl font-semibold text-white">{title}</h1>
            {description && <p className="mt-2 text-sm text-slate-400">{description}</p>}
          </header>
          {children}
        </section>
      </div>
      <AskAloraWidget />
    </main>
  );
}
