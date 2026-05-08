"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { missionControlRoadmap, type RoadmapChecklistItem } from "@/memory/data/mission-control-roadmap";

const STORAGE_KEY = "system-capital:mission-control-checklist";

const sidebarLinks = [
  { label: "Current Phase", href: "#current-phase" },
  { label: "Daily Focus", href: "#daily-focus" },
  { label: "Revenue", href: "#revenue-priorities" },
  { label: "Critical Tasks", href: "#critical-tasks" },
  { label: "Blockers", href: "#blockers" },
  { label: "AI Automation", href: "#automation-progress" },
  { label: "Drone Roadmap", href: "#drone-roadmap" },
  { label: "Do Not Build", href: "#do-not-build" },
];

const appLinks = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Command Center", href: "/command-center" },
  { label: "Automation", href: "/automation" },
  { label: "Agents", href: "/agents" },
];

const allChecklistItems = [
  ...missionControlRoadmap.criticalTasks,
  ...missionControlRoadmap.blockers,
  ...missionControlRoadmap.completedWins,
  ...missionControlRoadmap.droneRoadmap,
];

function defaultCheckedState() {
  return Object.fromEntries(allChecklistItems.map((item) => [item.id, item.status === "done"]));
}

function toneForPriority(priority: RoadmapChecklistItem["priority"]) {
  switch (priority) {
    case "critical":
      return "border-rose-300/30 bg-rose-400/10 text-rose-100";
    case "high":
      return "border-amber-300/30 bg-amber-400/10 text-amber-100";
    default:
      return "border-cyan-300/30 bg-cyan-400/10 text-cyan-100";
  }
}

function ProgressBar({ value, label }: { value: number; label?: string }) {
  return (
    <div aria-label={label} className="mt-4">
      <div className="flex items-center justify-between text-xs font-bold uppercase tracking-[0.22em] text-slate-400">
        <span>{label ?? "Progress"}</span>
        <span className="text-cyan-200">{value}%</span>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-950/80 ring-1 ring-white/10">
        <div
          className="h-full rounded-full bg-gradient-to-r from-cyan-300 via-sky-400 to-violet-400 shadow-[0_0_24px_rgba(34,211,238,0.5)]"
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

function ChecklistGroup({
  title,
  kicker,
  items,
  checked,
  onToggle,
  sectionId,
}: {
  title: string;
  kicker: string;
  items: RoadmapChecklistItem[];
  checked: Record<string, boolean>;
  onToggle: (id: string) => void;
  sectionId?: string;
}) {
  const completeCount = items.filter((item) => checked[item.id]).length;
  const progress = Math.round((completeCount / items.length) * 100);

  return (
    <section className="mc-panel" id={sectionId ?? title.toLowerCase().replaceAll(" ", "-")}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="mc-kicker">{kicker}</p>
          <h2 className="mt-2 text-2xl font-black tracking-[-0.04em] text-white">{title}</h2>
        </div>
        <span className="rounded-full border border-cyan-300/25 bg-cyan-300/10 px-3 py-1 text-xs font-bold text-cyan-100">
          {completeCount}/{items.length} complete
        </span>
      </div>
      <ProgressBar value={progress} label="Checklist" />
      <div className="mt-5 grid gap-3">
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onToggle(item.id)}
            className="group grid grid-cols-[auto_1fr] gap-4 rounded-3xl border border-white/10 bg-slate-950/45 p-4 text-left transition hover:-translate-y-0.5 hover:border-cyan-300/45 hover:bg-slate-900/80"
          >
            <span
              className={`mt-1 grid h-6 w-6 place-items-center rounded-lg border transition ${
                checked[item.id]
                  ? "border-emerald-300/60 bg-emerald-400/25 text-emerald-100"
                  : "border-white/20 bg-slate-900 text-transparent group-hover:text-slate-500"
              }`}
              aria-hidden="true"
            >
              ✓
            </span>
            <span>
              <span className={`block font-semibold ${checked[item.id] ? "text-slate-400 line-through" : "text-white"}`}>{item.label}</span>
              <span className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-400">
                <span>Owner · {item.owner}</span>
                <span className={`rounded-full border px-2 py-0.5 font-bold uppercase tracking-[0.14em] ${toneForPriority(item.priority)}`}>
                  {item.priority}
                </span>
              </span>
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}

export default function MissionControlRoadmap() {
  const [checked, setChecked] = useState<Record<string, boolean>>(() => defaultCheckedState());

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (!saved) return;

    try {
      window.setTimeout(() => setChecked({ ...defaultCheckedState(), ...JSON.parse(saved) }), 0);
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(checked));
  }, [checked]);

  const aggregateProgress = useMemo(() => {
    const completeCount = allChecklistItems.filter((item) => checked[item.id]).length;
    return Math.round((completeCount / allChecklistItems.length) * 100);
  }, [checked]);

  const toggleItem = (id: string) => {
    setChecked((current) => ({ ...current, [id]: !current[id] }));
  };

  return (
    <main className="mc-shell">
      <aside className="mc-sidebar" aria-label="Mission Control navigation">
        <Link className="mc-brand" href="/dashboard">
          <span className="mc-brand-mark">SC</span>
          <span>
            Mission Control
            <strong>Roadmap</strong>
          </span>
        </Link>

        <nav className="grid gap-2" aria-label="Roadmap sections">
          {sidebarLinks.map((link) => (
            <a className="mc-nav-link" href={link.href} key={link.href}>{link.label}</a>
          ))}
        </nav>

        <div className="mc-sidebar-card">
          <p className="mc-kicker">Core App Links</p>
          <div className="mt-4 grid gap-2">
            {appLinks.map((link) => (
              <Link className="mc-app-link" href={link.href} key={link.href}>{link.label}</Link>
            ))}
          </div>
        </div>
      </aside>

      <section className="mc-content">
        <section className="mc-hero mc-panel" id="current-phase">
          <div>
            <p className="mc-kicker">{missionControlRoadmap.currentPhase.label} · Current Phase</p>
            <h1>{missionControlRoadmap.currentPhase.title}</h1>
            <p>{missionControlRoadmap.currentPhase.summary}</p>
            <div className="mt-7 grid gap-3 sm:grid-cols-4">
              {appLinks.map((link) => (
                <Link className="mc-hero-link" href={link.href} key={link.href}>{link.label}</Link>
              ))}
            </div>
          </div>
          <div className="mc-phase-card">
            <span>Mission Progress</span>
            <strong>{aggregateProgress}%</strong>
            <ProgressBar value={aggregateProgress} label="Roadmap" />
            <p>{missionControlRoadmap.currentPhase.checkpoint}</p>
          </div>
        </section>

        <section className="grid gap-5 lg:grid-cols-[1.1fr_1fr]" id="daily-focus">
          <div className="mc-panel">
            <p className="mc-kicker">Daily Focus</p>
            <h2 className="mt-2 text-2xl font-black tracking-[-0.04em] text-white">What matters today</h2>
            <div className="mt-5 grid gap-3">
              {missionControlRoadmap.dailyFocus.map((focus, index) => (
                <article className="rounded-3xl border border-white/10 bg-slate-950/45 p-4" key={focus}>
                  <span className="text-xs font-black uppercase tracking-[0.24em] text-cyan-300">0{index + 1}</span>
                  <p className="mt-2 text-sm leading-7 text-slate-200">{focus}</p>
                </article>
              ))}
            </div>
          </div>

          <div className="mc-panel" id="revenue-priorities">
            <p className="mc-kicker">Revenue Priorities</p>
            <h2 className="mt-2 text-2xl font-black tracking-[-0.04em] text-white">Revenue before scope</h2>
            <div className="mt-5 grid gap-3">
              {missionControlRoadmap.revenuePriorities.map((priority) => (
                <article className="rounded-3xl border border-emerald-300/15 bg-emerald-400/10 p-4" key={priority.label}>
                  <div className="flex items-center justify-between gap-4">
                    <strong className="text-white">{priority.label}</strong>
                    <span className="text-2xl font-black tracking-[-0.05em] text-emerald-100">{priority.value}</span>
                  </div>
                  <p className="mt-2 text-sm leading-7 text-emerald-50/75">{priority.detail}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="grid gap-5 xl:grid-cols-2">
          <ChecklistGroup title="Critical Tasks" kicker="Execution" items={missionControlRoadmap.criticalTasks} checked={checked} onToggle={toggleItem} />
          <ChecklistGroup title="Blockers" kicker="Constraints" items={missionControlRoadmap.blockers} checked={checked} onToggle={toggleItem} />
        </section>

        <ChecklistGroup title="Completed Wins" kicker="Momentum" items={missionControlRoadmap.completedWins} checked={checked} onToggle={toggleItem} />

        <section className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]" id="automation-progress">
          <div className="mc-panel">
            <p className="mc-kicker">AI Automation Progress</p>
            <h2 className="mt-2 text-2xl font-black tracking-[-0.04em] text-white">Automation tracks</h2>
            <div className="mt-5 grid gap-5">
              {missionControlRoadmap.automationProgress.map((track) => (
                <article className="rounded-3xl border border-white/10 bg-slate-950/45 p-4" key={track.label}>
                  <div className="flex items-start justify-between gap-3">
                    <strong className="text-white">{track.label}</strong>
                    <span className="font-mono text-sm font-bold text-cyan-200">{track.progress}%</span>
                  </div>
                  <ProgressBar value={track.progress} label={track.label} />
                  <p className="mt-3 text-sm leading-7 text-slate-400">{track.detail}</p>
                </article>
              ))}
            </div>
          </div>

          <div className="mc-panel">
            <p className="mc-kicker">Roadmap Phase Cards</p>
            <h2 className="mt-2 text-2xl font-black tracking-[-0.04em] text-white">Build sequence</h2>
            <div className="mt-5 grid gap-4">
              {missionControlRoadmap.roadmapPhases.map((phase) => (
                <article className="rounded-3xl border border-white/10 bg-slate-950/45 p-5" data-status={phase.status} key={phase.id}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <span className="mc-kicker">{phase.timeline}</span>
                      <h3 className="mt-1 text-xl font-black tracking-[-0.04em] text-white">{phase.name}</h3>
                    </div>
                    <span className="rounded-full border border-cyan-300/25 bg-cyan-300/10 px-3 py-1 text-xs font-bold capitalize text-cyan-100">{phase.status}</span>
                  </div>
                  <p className="mt-3 text-sm leading-7 text-slate-300">{phase.objective}</p>
                  <ProgressBar value={phase.progress} label="Phase" />
                  <div className="mt-4 flex flex-wrap gap-2">
                    {phase.deliverables.map((deliverable) => (
                      <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300" key={deliverable}>{deliverable}</span>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="grid gap-5 lg:grid-cols-[1fr_0.9fr]">
          <ChecklistGroup title="Drone App Roadmap" kicker="Expansion" sectionId="drone-roadmap" items={missionControlRoadmap.droneRoadmap} checked={checked} onToggle={toggleItem} />

          <section className="mc-panel border-rose-300/20" id="do-not-build">
            <p className="mc-kicker text-rose-200">Do Not Build Yet</p>
            <h2 className="mt-2 text-2xl font-black tracking-[-0.04em] text-white">Distraction firewall</h2>
            <p className="mt-3 text-sm leading-7 text-slate-400">
              These ideas stay parked until the current phase proves usage, revenue motion, and operating cadence.
            </p>
            <div className="mt-5 grid gap-3">
              {missionControlRoadmap.doNotBuildYet.map((item) => (
                <article className="rounded-3xl border border-rose-300/15 bg-rose-400/10 p-4 text-sm leading-7 text-rose-50/80" key={item}>
                  {item}
                </article>
              ))}
            </div>
          </section>
        </section>
      </section>

      <style jsx>{`
        .mc-shell {
          min-height: 100vh;
          display: grid;
          grid-template-columns: 280px minmax(0, 1fr);
          background:
            radial-gradient(circle at 18% 14%, rgba(34, 211, 238, 0.18), transparent 30%),
            radial-gradient(circle at 78% 22%, rgba(139, 92, 246, 0.2), transparent 34%),
            linear-gradient(135deg, #020617 0%, #030711 52%, #070b18 100%);
          color: #f8fafc;
          overflow-x: hidden;
        }

        .mc-shell::before {
          content: "";
          position: fixed;
          inset: 0;
          pointer-events: none;
          background-image:
            linear-gradient(rgba(148, 163, 184, 0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(148, 163, 184, 0.04) 1px, transparent 1px);
          background-size: 52px 52px;
          mask-image: linear-gradient(to bottom, black, transparent 88%);
        }

        .mc-sidebar {
          position: fixed;
          inset: 0 auto 0 0;
          z-index: 10;
          width: 280px;
          display: flex;
          flex-direction: column;
          gap: 22px;
          border-right: 1px solid rgba(125, 211, 252, 0.18);
          background: rgba(2, 6, 23, 0.78);
          padding: 26px;
          backdrop-filter: blur(24px);
          box-shadow: 20px 0 80px rgba(0, 0, 0, 0.28);
        }

        .mc-brand,
        .mc-nav-link,
        .mc-app-link,
        .mc-hero-link {
          color: inherit;
          text-decoration: none;
        }

        .mc-brand {
          display: flex;
          align-items: center;
          gap: 14px;
          font-weight: 900;
          letter-spacing: -0.04em;
        }

        .mc-brand strong {
          display: block;
          color: #22d3ee;
          font-size: 0.78rem;
          letter-spacing: 0.18em;
          text-transform: uppercase;
        }

        .mc-brand-mark {
          display: grid;
          place-items: center;
          width: 48px;
          height: 48px;
          border: 1px solid rgba(34, 211, 238, 0.44);
          border-radius: 16px;
          background: linear-gradient(145deg, rgba(34, 211, 238, 0.2), rgba(139, 92, 246, 0.18));
          box-shadow: 0 0 34px rgba(34, 211, 238, 0.28);
        }

        .mc-nav-link,
        .mc-app-link,
        .mc-sidebar-card,
        .mc-panel {
          border: 1px solid rgba(125, 211, 252, 0.18);
          background: linear-gradient(145deg, rgba(15, 23, 42, 0.72), rgba(15, 23, 42, 0.38));
          backdrop-filter: blur(22px);
        }

        .mc-nav-link,
        .mc-app-link {
          border-color: transparent;
          border-radius: 16px;
          color: #94a3b8;
          padding: 11px 13px;
          transition: transform 180ms ease, border-color 180ms ease, box-shadow 180ms ease, color 180ms ease, background 180ms ease;
        }

        .mc-nav-link:hover,
        .mc-app-link:hover,
        .mc-hero-link:hover {
          transform: translateX(4px) scale(1.02);
          border-color: rgba(34, 211, 238, 0.72);
          background: rgba(34, 211, 238, 0.1);
          box-shadow: 0 0 24px rgba(34, 211, 238, 0.2);
          color: #f8fafc;
        }

        .mc-sidebar-card {
          margin-top: auto;
          border-radius: 26px;
          padding: 18px;
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.08);
        }

        .mc-content {
          position: relative;
          z-index: 1;
          grid-column: 2;
          display: grid;
          gap: 22px;
          padding: 28px;
        }

        .mc-panel {
          position: relative;
          overflow: hidden;
          border-radius: 30px;
          padding: 24px;
          box-shadow: 0 24px 80px rgba(0, 0, 0, 0.34), inset 0 1px 0 rgba(255, 255, 255, 0.08);
        }

        .mc-panel::after {
          content: "";
          position: absolute;
          inset: 0;
          pointer-events: none;
          background: linear-gradient(120deg, rgba(34, 211, 238, 0.1), transparent 36%, rgba(139, 92, 246, 0.1));
          opacity: 0.7;
        }

        .mc-panel > * {
          position: relative;
          z-index: 1;
        }

        .mc-kicker {
          color: #22d3ee;
          font-family: var(--font-geist-mono), ui-monospace, SFMono-Regular, Menlo, monospace;
          font-size: 0.72rem;
          font-weight: 900;
          letter-spacing: 0.2em;
          text-transform: uppercase;
        }

        .mc-hero {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 320px;
          gap: 26px;
          align-items: end;
          min-height: 430px;
          padding: 38px;
        }

        .mc-hero h1 {
          max-width: 920px;
          margin: 14px 0 0;
          font-size: clamp(3rem, 6vw, 6.2rem);
          line-height: 0.9;
          letter-spacing: -0.075em;
        }

        .mc-hero p:not(.mc-kicker),
        .mc-phase-card p {
          max-width: 780px;
          margin: 22px 0 0;
          color: #94a3b8;
          font-size: 1.04rem;
          line-height: 1.7;
        }

        .mc-hero-link {
          border: 1px solid rgba(34, 211, 238, 0.34);
          border-radius: 999px;
          background: rgba(34, 211, 238, 0.1);
          color: #bae6fd;
          padding: 10px 13px;
          text-align: center;
          font-size: 0.78rem;
          font-weight: 900;
          transition: transform 180ms ease, border-color 180ms ease, box-shadow 180ms ease, color 180ms ease, background 180ms ease;
        }

        .mc-phase-card {
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 26px;
          background: rgba(2, 6, 23, 0.44);
          padding: 20px;
        }

        .mc-phase-card span {
          color: #94a3b8;
          font-size: 0.78rem;
        }

        .mc-phase-card strong {
          display: block;
          margin-top: 5px;
          font-size: 4rem;
          letter-spacing: -0.08em;
        }

        @media (max-width: 980px) {
          .mc-shell {
            display: block;
          }

          .mc-sidebar {
            position: relative;
            width: auto;
            inset: auto;
          }

          .mc-content {
            padding: 18px;
          }

          .mc-hero {
            grid-template-columns: 1fr;
            min-height: auto;
            padding: 28px;
          }
        }
      `}</style>
    </main>
  );
}
