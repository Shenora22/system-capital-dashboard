"use client";

import { useEffect, useMemo, useState } from "react";
import {
  getDroneMissionSnapshot,
  type AutomationActionType,
  type DroneAlert,
  type DroneFleetUnit,
  type DroneMissionSnapshot,
  type DroneRecommendation,
} from "@/lib/drone-mission";

type ActionLog = {
  id: string;
  message: string;
  createdAt: string;
};

type ActionResponse = {
  ok: boolean;
  message: string;
  audit?: {
    id: string;
    createdAt: string;
  };
};

const missionFallback = getDroneMissionSnapshot();

const severityStyles: Record<DroneAlert["severity"], string> = {
  critical: "border-red-400/60 bg-red-500/15 text-red-100",
  high: "border-orange-300/50 bg-orange-400/15 text-orange-100",
  medium: "border-yellow-300/40 bg-yellow-400/15 text-yellow-100",
  low: "border-sky-300/40 bg-sky-400/15 text-sky-100",
};

const priorityStyles: Record<DroneRecommendation["priority"], string> = {
  immediate: "bg-red-400 text-slate-950",
  elevated: "bg-amber-300 text-slate-950",
  watch: "bg-cyan-300 text-slate-950",
};

function formatTime(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
  }).format(new Date(value));
}

function getBatteryColor(value: number) {
  if (value < 25) return "bg-red-400";
  if (value < 50) return "bg-amber-300";
  return "bg-emerald-300";
}

function getMapPosition(drone: DroneFleetUnit) {
  const bounds = {
    minLng: -74.024,
    maxLng: -73.998,
    minLat: 40.704,
    maxLat: 40.72,
  };
  const x = ((drone.longitude - bounds.minLng) / (bounds.maxLng - bounds.minLng)) * 100;
  const y = 100 - ((drone.latitude - bounds.minLat) / (bounds.maxLat - bounds.minLat)) * 100;

  return {
    left: `${Math.min(92, Math.max(8, x))}%`,
    top: `${Math.min(88, Math.max(12, y))}%`,
  };
}

export default function DronePage() {
  const [snapshot, setSnapshot] = useState<DroneMissionSnapshot>(missionFallback);
  const [selectedDroneId, setSelectedDroneId] = useState(missionFallback.fleet[0]?.id ?? "");
  const [actionLogs, setActionLogs] = useState<ActionLog[]>([
    {
      id: "demo-log-1",
      message: "Mission snapshot loaded from mock fleet data.",
      createdAt: missionFallback.generatedAt,
    },
  ]);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingActionId, setPendingActionId] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadFleet() {
      try {
        const response = await fetch("/api/drone/fleet", { cache: "no-store" });
        if (!response.ok) return;

        const data = (await response.json()) as DroneMissionSnapshot;
        if (isMounted) {
          setSnapshot(data);
          setSelectedDroneId((current) => current || data.fleet[0]?.id || "");
          setActionLogs((current) => [
            {
              id: `fleet-refresh-${Date.now()}`,
              message: `Fleet API refreshed ${data.fleet.length} drones and ${data.alerts.length} alerts.`,
              createdAt: data.generatedAt,
            },
            ...current.slice(0, 4),
          ]);
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadFleet();

    return () => {
      isMounted = false;
    };
  }, []);

  const selectedDrone = useMemo(
    () => snapshot.fleet.find((drone) => drone.id === selectedDroneId) ?? snapshot.fleet[0],
    [selectedDroneId, snapshot.fleet],
  );

  const activeAlerts = snapshot.alerts.filter(
    (alert) => alert.severity === "critical" || alert.severity === "high",
  ).length;
  const averageBattery = Math.round(
    snapshot.fleet.reduce((total, drone) => total + drone.batteryPct, 0) / snapshot.fleet.length,
  );
  const averageSignal = Math.round(
    snapshot.fleet.reduce((total, drone) => total + drone.signalPct, 0) / snapshot.fleet.length,
  );

  async function stageAction(recommendation: DroneRecommendation) {
    setPendingActionId(recommendation.id);

    try {
      const response = await fetch("/api/drone/actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          droneId: recommendation.droneId,
          action: recommendation.action satisfies AutomationActionType,
          recommendationId: recommendation.id,
        }),
      });
      const result = (await response.json()) as ActionResponse;

      setActionLogs((current) => [
        {
          id: result.audit?.id ?? `action-${Date.now()}`,
          message: result.message,
          createdAt: result.audit?.createdAt ?? new Date().toISOString(),
        },
        ...current.slice(0, 5),
      ]);
    } finally {
      setPendingActionId(null);
    }
  }

  return (
    <main data-pitch-capture="dashboard" className="min-h-screen overflow-hidden bg-[#04070d] text-slate-100">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.22),transparent_32%),radial-gradient(circle_at_80%_10%,rgba(249,115,22,0.16),transparent_28%),linear-gradient(180deg,#08111f_0%,#04070d_60%)]" />

      <section className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-5 py-6 sm:px-8 lg:px-10">
        <header data-pitch-capture="hero" className="rounded-[2rem] border border-cyan-300/15 bg-white/[0.04] p-6 shadow-2xl shadow-cyan-950/30 backdrop-blur">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="mb-3 inline-flex rounded-full border border-cyan-300/25 bg-cyan-300/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.32em] text-cyan-200">
                SkyTrace Mission Control
              </p>
              <h1 className="max-w-3xl text-4xl font-black tracking-tight text-white sm:text-5xl">
                Demo-ready drone intelligence for System Capital.
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300">
                Mock fleet telemetry, live-style alerts, AI recommendations, and review-only automation actions in one pitch-ready operations view.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-4 text-sm text-slate-300">
              <div className="font-semibold text-white">{snapshot.missionName}</div>
              <div>{snapshot.commandPost}</div>
              <div>{snapshot.operatingArea}</div>
              <div className="mt-2 text-xs text-cyan-200">
                {isLoading ? "Syncing fleet API…" : `Updated ${formatTime(snapshot.generatedAt)}`}
              </div>
            </div>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-4">
          {[
            ["Fleet online", snapshot.fleet.length, "active drones"],
            ["Priority alerts", activeAlerts, "high / critical"],
            ["Avg battery", `${averageBattery}%`, "fleet reserve"],
            ["Avg signal", `${averageSignal}%`, "telemetry health"],
          ].map(([label, value, helper]) => (
            <div key={label} className="rounded-3xl border border-white/10 bg-white/[0.045] p-5 backdrop-blur">
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-slate-400">{label}</p>
              <div className="mt-3 text-3xl font-black text-white">{value}</div>
              <p className="mt-1 text-sm text-slate-400">{helper}</p>
            </div>
          ))}
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.45fr_0.9fr]">
          <div data-pitch-capture="map" className="rounded-[2rem] border border-cyan-300/15 bg-slate-950/75 p-5 shadow-2xl shadow-slate-950/50">
            <div className="mb-4 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-black text-white">Tactical airspace map</h2>
                <p className="text-sm text-slate-400">CSS mission map fallback keeps the demo working without paid map APIs.</p>
              </div>
              <span className="rounded-full bg-emerald-300/15 px-3 py-1 text-xs font-bold text-emerald-200">REVIEW MODE</span>
            </div>

            <div className="relative h-[520px] overflow-hidden rounded-[1.5rem] border border-cyan-300/10 bg-[#07111f]">
              <div className="absolute inset-0 bg-[linear-gradient(rgba(103,232,249,0.07)_1px,transparent_1px),linear-gradient(90deg,rgba(103,232,249,0.07)_1px,transparent_1px)] bg-[size:48px_48px]" />
              <div className="absolute left-[14%] top-[18%] h-[66%] w-[72%] rounded-full border border-cyan-200/10" />
              <div className="absolute left-[23%] top-[28%] h-[46%] w-[54%] rounded-full border border-cyan-200/10" />
              <div className="absolute bottom-8 left-8 rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-xs text-slate-300 backdrop-blur">
                <div className="font-bold text-white">Lower Manhattan perimeter</div>
                <div>Simulated GPS layer • No external map token required</div>
              </div>

              {snapshot.fleet.map((drone) => {
                const position = getMapPosition(drone);
                const isSelected = selectedDrone?.id === drone.id;
                const hasAlert = snapshot.alerts.some((alert) => alert.droneId === drone.id);

                return (
                  <button
                    key={drone.id}
                    onClick={() => setSelectedDroneId(drone.id)}
                    className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full border p-1 transition hover:scale-110 ${
                      isSelected ? "border-cyan-200 bg-cyan-300/30 shadow-[0_0_35px_rgba(103,232,249,0.55)]" : "border-white/20 bg-slate-900/80"
                    }`}
                    style={position}
                    aria-label={`Select ${drone.name}`}
                  >
                    <span className={`block h-5 w-5 rounded-full ${hasAlert ? "bg-red-400" : "bg-cyan-300"}`} />
                    <span className="absolute left-7 top-1/2 -translate-y-1/2 whitespace-nowrap rounded-lg border border-white/10 bg-black/60 px-2 py-1 text-xs font-bold text-white">
                      {drone.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <aside data-pitch-capture="automation" className="flex flex-col gap-4">
            <div className="rounded-[2rem] border border-white/10 bg-white/[0.045] p-5">
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-cyan-200">Selected asset</p>
              {selectedDrone && (
                <div className="mt-4 space-y-4">
                  <div>
                    <h2 className="text-3xl font-black text-white">{selectedDrone.name}</h2>
                    <p className="text-sm text-slate-400">{selectedDrone.model}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <Metric label="Status" value={selectedDrone.status} />
                    <Metric label="Zone" value={selectedDrone.zone} />
                    <Metric label="Altitude" value={`${selectedDrone.altitudeFt} ft`} />
                    <Metric label="Speed" value={`${selectedDrone.speedMph} mph`} />
                    <Metric label="Payload" value={selectedDrone.payload} />
                    <Metric label="Last ping" value={formatTime(selectedDrone.lastPing)} />
                  </div>
                  <HealthBar label="Battery" value={selectedDrone.batteryPct} />
                  <HealthBar label="Signal" value={selectedDrone.signalPct} />
                </div>
              )}
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-white/[0.045] p-5">
              <h2 className="text-lg font-black text-white">Automation action log</h2>
              <div className="mt-4 space-y-3">
                {actionLogs.map((log) => (
                  <div key={log.id} className="rounded-2xl border border-white/10 bg-slate-950/70 p-3 text-sm text-slate-300">
                    <div className="text-xs font-bold text-cyan-200">{formatTime(log.createdAt)}</div>
                    <div>{log.message}</div>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
          <Panel title="AI recommendations" helper="All actions are staged for review only; no live commands are sent." captureName="recommendations">
            <div className="space-y-3">
              {snapshot.recommendations.map((recommendation) => {
                const drone = snapshot.fleet.find((unit) => unit.id === recommendation.droneId);

                return (
                  <article key={recommendation.id} className="rounded-2xl border border-white/10 bg-slate-950/65 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <span className={`rounded-full px-2.5 py-1 text-xs font-black uppercase ${priorityStyles[recommendation.priority]}`}>
                          {recommendation.priority}
                        </span>
                        <h3 className="mt-3 text-lg font-black text-white">{recommendation.title}</h3>
                        <p className="mt-2 text-sm leading-6 text-slate-300">{recommendation.rationale}</p>
                        <p className="mt-2 text-xs font-bold text-slate-500">Asset: {drone?.name ?? recommendation.droneId}</p>
                      </div>
                      <button
                        onClick={() => stageAction(recommendation)}
                        disabled={pendingActionId === recommendation.id}
                        className="rounded-xl border border-cyan-200/20 bg-cyan-300 px-4 py-2 text-sm font-black text-slate-950 transition hover:bg-cyan-200 disabled:cursor-wait disabled:opacity-60"
                      >
                        {pendingActionId === recommendation.id ? "Staging…" : "Stage action"}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          </Panel>

          <Panel title="Alert review queue" helper="Severity, confidence, and field details for the operator review loop." captureName="alerts">
            <div className="space-y-3">
              {snapshot.alerts.map((alert) => {
                const drone = snapshot.fleet.find((unit) => unit.id === alert.droneId);

                return (
                  <article key={alert.id} className={`rounded-2xl border p-4 ${severityStyles[alert.severity]}`}>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-xs font-black uppercase tracking-[0.18em]">{alert.severity}</span>
                      <span className="rounded-full bg-black/25 px-2 py-1 text-xs font-bold">{alert.confidence}% confidence</span>
                    </div>
                    <h3 className="mt-3 text-lg font-black text-white">{alert.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-200">{alert.detail}</p>
                    <div className="mt-3 text-xs font-bold text-slate-300">
                      {drone?.name ?? alert.droneId} • {formatTime(alert.createdAt)}
                    </div>
                  </article>
                );
              })}
            </div>
          </Panel>
        </section>

        <Panel title="Fleet telemetry" helper="Mock data is structured to match the fleet API and future Supabase ingestion." captureName="telemetry">
          <div className="overflow-hidden rounded-2xl border border-white/10">
            <table className="w-full min-w-[760px] border-collapse text-left text-sm">
              <thead className="bg-white/[0.06] text-xs uppercase tracking-[0.18em] text-slate-400">
                <tr>
                  <th className="px-4 py-3">Drone</th>
                  <th className="px-4 py-3">Mission</th>
                  <th className="px-4 py-3">Operator</th>
                  <th className="px-4 py-3">Battery</th>
                  <th className="px-4 py-3">Signal</th>
                  <th className="px-4 py-3">Coordinates</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {snapshot.fleet.map((drone) => (
                  <tr key={drone.id} className="bg-slate-950/45 text-slate-200">
                    <td className="px-4 py-4">
                      <button onClick={() => setSelectedDroneId(drone.id)} className="font-black text-white hover:text-cyan-200">
                        {drone.name}
                      </button>
                      <div className="text-xs text-slate-500">{drone.status}</div>
                    </td>
                    <td className="px-4 py-4">{drone.mission}</td>
                    <td className="px-4 py-4">{drone.operator}</td>
                    <td className="px-4 py-4">{drone.batteryPct}%</td>
                    <td className="px-4 py-4">{drone.signalPct}%</td>
                    <td className="px-4 py-4 font-mono text-xs text-slate-400">
                      {drone.latitude.toFixed(4)}, {drone.longitude.toFixed(4)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </section>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/65 p-3">
      <div className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">{label}</div>
      <div className="mt-1 font-bold capitalize text-white">{value}</div>
    </div>
  );
}

function HealthBar({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-sm">
        <span className="font-bold text-slate-300">{label}</span>
        <span className="font-black text-white">{value}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-white/10">
        <div className={`h-full rounded-full ${getBatteryColor(value)}`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function Panel({ title, helper, children, captureName }: { title: string; helper: string; children: React.ReactNode; captureName?: string }) {
  return (
    <section data-pitch-capture={captureName} className="rounded-[2rem] border border-white/10 bg-white/[0.045] p-5 backdrop-blur">
      <div className="mb-4">
        <h2 className="text-xl font-black text-white">{title}</h2>
        <p className="mt-1 text-sm text-slate-400">{helper}</p>
      </div>
      {children}
    </section>
  );
}
