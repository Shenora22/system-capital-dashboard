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
import {
  createSkyTraceEvent,
  evaluateTelemetryThresholds,
  generateMissionSummary,
  initialPreflightChecklist,
  runPreflightChecklist,
  skyTraceMissionId,
  skyTraceOperator,
  type ApprovalState,
  type MissionLifecycleStatus,
  type MissionPhase,
  type PreflightChecklistItem,
  type SkyTraceEvent,
  type SkyTraceEventSeverity,
} from "@/lib/skytrace-workflow";

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
const missionDurationLimitMinutes = 45;

const workflowPhaseLabels: Record<MissionPhase, string> = {
  PRE_MISSION: "Pre-mission",
  ACTIVE_MISSION: "Active mission",
  POST_MISSION: "Post-mission",
};

const approvalStyles: Record<ApprovalState, string> = {
  PENDING_APPROVAL: "border-amber-300/45 bg-amber-300/10 text-amber-100",
  APPROVED: "border-emerald-300/45 bg-emerald-300/10 text-emerald-100",
  DENIED: "border-red-300/45 bg-red-400/10 text-red-100",
  EXECUTED: "border-cyan-300/45 bg-cyan-300/10 text-cyan-100",
  BLOCKED: "border-red-400/60 bg-red-500/15 text-red-100",
  ESCALATED: "border-fuchsia-300/45 bg-fuchsia-300/10 text-fuchsia-100",
};

const eventSeverityStyles: Record<SkyTraceEventSeverity, string> = {
  info: "border-cyan-300/25 bg-cyan-300/10 text-cyan-100",
  warn: "border-amber-300/45 bg-amber-300/10 text-amber-100",
  critical: "border-red-400/60 bg-red-500/15 text-red-100",
};

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

function getMapPoint(drone: DroneFleetUnit) {
  const bounds = {
    minLng: -74.024,
    maxLng: -73.998,
    minLat: 40.704,
    maxLat: 40.72,
  };
  const x = ((drone.longitude - bounds.minLng) / (bounds.maxLng - bounds.minLng)) * 100;
  const y = 100 - ((drone.latitude - bounds.minLat) / (bounds.maxLat - bounds.minLat)) * 100;

  return {
    x: Math.min(92, Math.max(8, x)),
    y: Math.min(88, Math.max(12, y)),
  };
}

function getMapPosition(drone: DroneFleetUnit) {
  const point = getMapPoint(drone);

  return {
    left: `${point.x}%`,
    top: `${point.y}%`,
  };
}

function getRouteTrail(drone: DroneFleetUnit) {
  const point = getMapPoint(drone);
  const radians = ((drone.heading + 180) * Math.PI) / 180;
  const trailLength = 10;
  const startX = Math.min(94, Math.max(6, point.x + Math.sin(radians) * trailLength));
  const startY = Math.min(90, Math.max(10, point.y - Math.cos(radians) * trailLength));

  return {
    x1: `${startX}%`,
    y1: `${startY}%`,
    x2: `${point.x}%`,
    y2: `${point.y}%`,
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
  const [missionPhase, setMissionPhase] = useState<MissionPhase>("PRE_MISSION");
  const [missionStatus, setMissionStatus] = useState<MissionLifecycleStatus>("PREFLIGHT");
  const [approvalState, setApprovalState] = useState<ApprovalState>("PENDING_APPROVAL");
  const [preflightChecklist, setPreflightChecklist] = useState<PreflightChecklistItem[]>(initialPreflightChecklist);
  const [skyTraceEvents, setSkyTraceEvents] = useState<SkyTraceEvent[]>([]);
  const [missionStartedAt, setMissionStartedAt] = useState<string | null>(null);
  const [missionClosedAt, setMissionClosedAt] = useState<string | null>(null);
  const [missionSummary, setMissionSummary] = useState("");

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
  const openCriticalEvents = skyTraceEvents.filter(
    (event) => event.severity === "critical" && event.status !== "resolved",
  );
  const reportReadyEvents = skyTraceEvents.slice(0, 12);

  function appendSkyTraceEvents(events: SkyTraceEvent[]) {
    setSkyTraceEvents((current) => {
      const seen = new Set(current.map((event) => event.eventId));
      const nextEvents = events.filter((event) => !seen.has(event.eventId));
      return [...nextEvents, ...current].sort(
        (left, right) => new Date(right.timestamp).getTime() - new Date(left.timestamp).getTime(),
      );
    });
  }

  function logWorkflowMessage(message: string, createdAt = new Date().toISOString()) {
    setActionLogs((current) => [
      {
        id: `workflow-${Date.now()}`,
        message,
        createdAt,
      },
      ...current.slice(0, 5),
    ]);
  }

  function triggerPreflight() {
    const timestamp = new Date().toISOString();
    const result = runPreflightChecklist(skyTraceMissionId, preflightChecklist, timestamp);
    setApprovalState(result.approvalState);
    setMissionStatus(result.passed ? "PENDING_APPROVAL" : "BLOCKED");
    appendSkyTraceEvents([
      result.event,
      ...(result.passed
        ? [
            createSkyTraceEvent({
              eventId: `${skyTraceMissionId}-mission-start-approval-requested`,
              missionId: skyTraceMissionId,
              timestamp,
              source: "system",
              type: "approval_requested",
              severity: "info",
              payload: { action: "mission_start", message: "Human GO / NO-GO approval requested." },
              status: "open",
              requiresApproval: true,
            }),
          ]
        : []),
    ]);
    logWorkflowMessage(result.passed ? "Preflight passed. GO / NO-GO approval requested." : "Preflight failed. Mission start is blocked.", timestamp);
  }

  function togglePreflightFailure() {
    setPreflightChecklist((current) =>
      current.map((item) =>
        item.id === "geofence"
          ? {
              ...item,
              passed: !item.passed,
              detail: item.passed
                ? "Demo failure injected: geofence route is missing operator signoff."
                : "Demo airspace perimeter loaded in review-only mode.",
            }
          : item,
      ),
    );
    setMissionStatus("PREFLIGHT");
    setApprovalState("PENDING_APPROVAL");
  }

  function approveMissionStart() {
    if (missionStatus === "BLOCKED") return;

    const timestamp = new Date().toISOString();
    setMissionPhase("ACTIVE_MISSION");
    setMissionStatus("ACTIVE");
    setApprovalState("APPROVED");
    setMissionStartedAt(timestamp);
    appendSkyTraceEvents([
      createSkyTraceEvent({
        eventId: `${skyTraceMissionId}-approval-start`,
        missionId: skyTraceMissionId,
        timestamp,
        source: "operator",
        type: "approval_granted",
        severity: "info",
        payload: { action: "mission_start", decision: "GO", message: "Operator approved mission start." },
        status: "resolved",
        requiresApproval: false,
        approvedBy: skyTraceOperator,
        approvedAt: timestamp,
      }),
      createSkyTraceEvent({
        eventId: `${skyTraceMissionId}-mission-start`,
        missionId: skyTraceMissionId,
        timestamp,
        source: "system",
        type: "mission_start",
        severity: "info",
        payload: { message: "Mission started in simulated review mode. Telemetry loop active." },
        status: "acknowledged",
        requiresApproval: false,
        approvedBy: skyTraceOperator,
        approvedAt: timestamp,
      }),
    ]);
    logWorkflowMessage("Operator approved GO. Simulated mission started; telemetry checks are active.", timestamp);
  }

  function denyMissionStart() {
    const timestamp = new Date().toISOString();
    setMissionStatus("BLOCKED");
    setApprovalState("DENIED");
    appendSkyTraceEvents([
      createSkyTraceEvent({
        eventId: `${skyTraceMissionId}-approval-denied-start`,
        missionId: skyTraceMissionId,
        timestamp,
        source: "operator",
        type: "approval_denied",
        severity: "critical",
        payload: { action: "mission_start", decision: "NO-GO", message: "Operator denied mission start." },
        status: "resolved",
        requiresApproval: false,
        approvedBy: skyTraceOperator,
        approvedAt: timestamp,
      }),
    ]);
    logWorkflowMessage("Operator selected NO-GO. Mission start blocked.", timestamp);
  }

  function continueAfterCriticalIncident() {
    const timestamp = new Date().toISOString();
    setApprovalState("EXECUTED");
    appendSkyTraceEvents([
      createSkyTraceEvent({
        eventId: `${skyTraceMissionId}-continue-${Date.now()}`,
        missionId: skyTraceMissionId,
        timestamp,
        source: "operator",
        type: "approval_granted",
        severity: "info",
        payload: { action: "continue", openCriticalEvents: openCriticalEvents.length, message: "Operator approved continue after critical incident review." },
        status: "resolved",
        requiresApproval: false,
        approvedBy: skyTraceOperator,
        approvedAt: timestamp,
      }),
    ]);
    logWorkflowMessage("Continue approved after critical incident review. No drone command was sent.", timestamp);
  }

  function delegateIncident() {
    const timestamp = new Date().toISOString();
    setApprovalState("ESCALATED");
    appendSkyTraceEvents([
      createSkyTraceEvent({
        eventId: `${skyTraceMissionId}-delegate-${Date.now()}`,
        missionId: skyTraceMissionId,
        timestamp,
        source: "operator",
        type: "operator_override",
        severity: "warn",
        payload: { action: "delegate", openCriticalEvents: openCriticalEvents.length, message: "Operator delegated critical incident to field team for review." },
        status: "escalated",
        requiresApproval: false,
        approvedBy: skyTraceOperator,
        approvedAt: timestamp,
      }),
    ]);
    logWorkflowMessage("Incident delegated to field team. No live drone command was sent.", timestamp);
  }

  function abortMission() {
    const timestamp = new Date().toISOString();
    setMissionPhase("POST_MISSION");
    setMissionStatus("ABORTED");
    setApprovalState("ESCALATED");
    setMissionClosedAt(timestamp);
    appendSkyTraceEvents([
      createSkyTraceEvent({
        eventId: `${skyTraceMissionId}-operator-abort`,
        missionId: skyTraceMissionId,
        timestamp,
        source: "operator",
        type: "operator_override",
        severity: "critical",
        payload: { action: "abort", message: "Operator aborted the simulated mission; escalation record created." },
        status: "escalated",
        requiresApproval: false,
        approvedBy: skyTraceOperator,
        approvedAt: timestamp,
      }),
      createSkyTraceEvent({
        eventId: `${skyTraceMissionId}-mission-end-abort`,
        missionId: skyTraceMissionId,
        timestamp,
        source: "system",
        type: "mission_end",
        severity: "warn",
        payload: { outcome: "aborted", message: "Mission closed after operator abort." },
        status: "acknowledged",
        requiresApproval: false,
      }),
    ]);
    logWorkflowMessage("Mission aborted and moved to post-mission review. Simulated only.", timestamp);
  }

  function resolveIncident() {
    const timestamp = new Date().toISOString();
    setApprovalState("EXECUTED");
    setSkyTraceEvents((current) =>
      current.map((event) =>
        event.severity === "critical" && event.status !== "resolved"
          ? { ...event, status: "resolved", approvedBy: skyTraceOperator, approvedAt: timestamp }
          : event,
      ),
    );
    appendSkyTraceEvents([
      createSkyTraceEvent({
        eventId: `${skyTraceMissionId}-incident-resolved-${Date.now()}`,
        missionId: skyTraceMissionId,
        timestamp,
        source: "operator",
        type: "incident_resolved",
        severity: "info",
        payload: { resolvedEvents: openCriticalEvents.length, message: "Operator resolved open critical incident records." },
        status: "resolved",
        requiresApproval: false,
        approvedBy: skyTraceOperator,
        approvedAt: timestamp,
      }),
    ]);
    logWorkflowMessage("Open critical incident records marked resolved.", timestamp);
  }

  function closeMissionAndSummarize() {
    const timestamp = new Date().toISOString();
    const summary = generateMissionSummary(skyTraceEvents, skyTraceMissionId);
    setMissionPhase("POST_MISSION");
    setMissionStatus("CLOSED");
    setApprovalState("EXECUTED");
    setMissionClosedAt(timestamp);
    setMissionSummary(summary);
    appendSkyTraceEvents([
      createSkyTraceEvent({
        eventId: `${skyTraceMissionId}-mission-end`,
        missionId: skyTraceMissionId,
        timestamp,
        source: "system",
        type: "mission_end",
        severity: "info",
        payload: { outcome: "closed", message: "Mission closed by operator." },
        status: "resolved",
        requiresApproval: false,
      }),
      createSkyTraceEvent({
        eventId: `${skyTraceMissionId}-ai-summary`,
        missionId: skyTraceMissionId,
        timestamp,
        source: "ai",
        type: "ai_summary_generated",
        severity: "info",
        payload: { summary },
        status: "resolved",
        requiresApproval: false,
      }),
    ]);
    logWorkflowMessage("AI mission summary generated and report-ready log stored locally.", timestamp);
  }

  useEffect(() => {
    if (missionPhase !== "ACTIVE_MISSION" || missionStatus !== "ACTIVE") return;

    const intervalId = window.setInterval(() => {
      setSkyTraceEvents((current) => {
        const existingEventIds = new Set(current.map((event) => event.eventId));
        const thresholdEvents = evaluateTelemetryThresholds(snapshot.fleet, {
          missionId: skyTraceMissionId,
          now: new Date().toISOString(),
          missionStartedAt: missionStartedAt ?? undefined,
          missionDurationLimitMinutes,
          existingEventIds,
        });

        if (thresholdEvents.length === 0) return current;

        return [...thresholdEvents, ...current].sort(
          (left, right) => new Date(right.timestamp).getTime() - new Date(left.timestamp).getTime(),
        );
      });
    }, 2200);

    return () => window.clearInterval(intervalId);
  }, [missionPhase, missionStartedAt, missionStatus, snapshot.fleet]);

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
                AI Mission Control for Autonomous Drone Operations
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300">
                Run fleets. Detect issues. Automate decisions in real time. SkyTrace remains demo-safe while its mission events preview the shared System Events observability contract.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-4 text-sm text-slate-300">
              <div className="font-semibold text-white">{snapshot.missionName}</div>
              <div>{snapshot.commandPost}</div>
              <div>{snapshot.operatingArea}</div>
              <div className="mt-2 text-xs text-cyan-200">
                {isLoading ? "Syncing fleet API…" : `Updated ${formatTime(snapshot.generatedAt)}`}
              </div>
              <div className="mt-2 text-xs text-slate-400">
                System Events adapter: local preview only · no production webhook commands
              </div>
            </div>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-4">
          {[
            ["Fleet", snapshot.fleet.length, "online"],
            ["Alerts", activeAlerts, "priority"],
            ["Battery", `${averageBattery}%`, "average"],
            ["Signal", `${averageSignal}%`, "average"],
          ].map(([label, value, helper]) => (
            <div key={label} className="rounded-3xl border border-white/10 bg-white/[0.045] p-5 backdrop-blur">
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-slate-400">{label}</p>
              <div className="mt-3 text-3xl font-black text-white">{value}</div>
              <p className="mt-1 text-sm text-slate-400">{helper}</p>
            </div>
          ))}
        </section>

        <section data-pitch-capture="workflow" className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <Panel title="Mission workflow" helper="Sellable SkyTrace workflow: preflight, approvals, incident handling, and post-mission report log." captureName="mission-workflow">
            <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
              <div className="space-y-4">
                <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-cyan-300/15 px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-cyan-100">
                      {workflowPhaseLabels[missionPhase]}
                    </span>
                    <span className={`rounded-full border px-3 py-1 text-xs font-black uppercase tracking-[0.16em] ${approvalStyles[approvalState]}`}>
                      {approvalState.replaceAll("_", " ")}
                    </span>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                    <Metric label="Mission" value={missionStatus.toLowerCase()} />
                    <Metric label="Incidents" value={`${openCriticalEvents.length} open`} />
                    <Metric label="Started" value={missionStartedAt ? formatTime(missionStartedAt) : "not started"} />
                    <Metric label="Closed" value={missionClosedAt ? formatTime(missionClosedAt) : "open"} />
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-slate-950/65 p-4">
                  <h3 className="text-sm font-black uppercase tracking-[0.18em] text-slate-300">Preflight checklist</h3>
                  <div className="mt-3 space-y-2">
                    {preflightChecklist.map((item) => (
                      <div key={item.id} className="rounded-xl border border-white/10 bg-white/[0.035] p-3 text-sm">
                        <div className="flex items-center justify-between gap-3">
                          <span className="font-bold text-white">{item.label}</span>
                          <span className={item.passed ? "text-emerald-200" : "text-red-200"}>{item.passed ? "PASS" : "FAIL"}</span>
                        </div>
                        <p className="mt-1 text-xs leading-5 text-slate-400">{item.detail}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  <WorkflowButton label="Run preflight" onClick={triggerPreflight} />
                  <WorkflowButton label="Approve GO" onClick={approveMissionStart} disabled={missionStatus !== "PENDING_APPROVAL"} />
                  <WorkflowButton label="Deny NO-GO" onClick={denyMissionStart} tone="danger" />
                  <WorkflowButton label="Continue incident" onClick={continueAfterCriticalIncident} disabled={openCriticalEvents.length === 0} />
                  <WorkflowButton label="Abort mission" onClick={abortMission} tone="danger" disabled={missionPhase !== "ACTIVE_MISSION"} />
                  <WorkflowButton label="Delegate" onClick={delegateIncident} disabled={openCriticalEvents.length === 0} />
                  <WorkflowButton label="Resolve incident" onClick={resolveIncident} disabled={openCriticalEvents.length === 0} />
                  <button
                    onClick={togglePreflightFailure}
                    className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-black text-slate-200 transition hover:border-amber-200/40 hover:text-amber-100 sm:col-span-1"
                  >
                    Toggle preflight fail
                  </button>
                  <button
                    onClick={closeMissionAndSummarize}
                    className="rounded-xl border border-cyan-200/20 bg-cyan-300 px-3 py-2 text-xs font-black text-slate-950 transition hover:bg-cyan-200 sm:col-span-2"
                  >
                    Generate AI summary
                  </button>
                </div>

                <div className="rounded-2xl border border-white/10 bg-slate-950/65 p-4">
                  <h3 className="text-sm font-black uppercase tracking-[0.18em] text-slate-300">Operational rules</h3>
                  <div className="mt-3 grid gap-2 text-xs leading-5 text-slate-400 sm:grid-cols-2">
                    <div>Battery &lt;20% logs WARN; &lt;10% requires approval.</div>
                    <div>RSSI &lt;-85 dBm logs WARN.</div>
                    <div>No ping &gt;5s opens a CRITICAL incident.</div>
                    <div>Geofence breach requires operator approval.</div>
                    <div>Speed anomaly auto-logs WARN.</div>
                    <div>Preflight fail blocks start.</div>
                  </div>
                </div>

                {missionSummary && (
                  <div className="rounded-2xl border border-emerald-300/25 bg-emerald-300/10 p-4 text-sm leading-6 text-emerald-50">
                    <div className="text-xs font-black uppercase tracking-[0.18em] text-emerald-200">AI mission summary</div>
                    <p className="mt-2">{missionSummary}</p>
                  </div>
                )}
              </div>
            </div>
          </Panel>

          <Panel title="System event timeline" helper="Local mock event log for report-ready incident history." captureName="event-log">
            <div className="max-h-[560px] space-y-3 overflow-auto pr-1">
              {reportReadyEvents.length === 0 ? (
                <div className="rounded-2xl border border-white/10 bg-slate-950/65 p-4 text-sm text-slate-400">
                  Run preflight to seed the SkyTrace event log. All events are local mock records.
                </div>
              ) : (
                reportReadyEvents.map((event) => (
                  <article key={event.eventId} className={`rounded-2xl border p-4 ${eventSeverityStyles[event.severity]}`}>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-xs font-black uppercase tracking-[0.16em]">{event.type.replaceAll("_", " ")}</span>
                      <span className="rounded-full bg-black/25 px-2 py-1 text-xs font-bold">{event.status}</span>
                    </div>
                    <div className="mt-2 text-sm leading-6 text-slate-100">
                      {typeof event.payload.message === "string" ? event.payload.message : typeof event.payload.summary === "string" ? event.payload.summary : event.eventId}
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2 text-xs font-bold text-slate-300">
                      <span>{formatTime(event.timestamp)}</span>
                      <span>• {event.source}</span>
                      <span>• approval {event.requiresApproval ? "required" : "not required"}</span>
                      {event.approvedBy && <span>• {event.approvedBy}</span>}
                    </div>
                  </article>
                ))
              )}
            </div>
          </Panel>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.45fr_0.9fr]">
          <div data-pitch-capture="map" className="rounded-[2rem] border border-cyan-300/15 bg-slate-950/75 p-5 shadow-2xl shadow-slate-950/50">
            <div className="mb-4 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-black text-white">Tactical airspace map</h2>
                <p className="text-sm text-slate-400">Simulated airspace, routes, and fleet status.</p>
              </div>
              <span className="rounded-full bg-emerald-300/15 px-3 py-1 text-xs font-bold text-emerald-200">REVIEW MODE</span>
            </div>

            <div className="relative h-[520px] overflow-hidden rounded-[1.5rem] border border-cyan-300/10 bg-[#07111f] shadow-inner shadow-cyan-950/30">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_52%_45%,rgba(103,232,249,0.12),transparent_34%),linear-gradient(rgba(103,232,249,0.075)_1px,transparent_1px),linear-gradient(90deg,rgba(103,232,249,0.075)_1px,transparent_1px)] bg-[size:100%_100%,48px_48px,48px_48px] drone-map-grid" />
              <div className="absolute left-[14%] top-[18%] h-[66%] w-[72%] rounded-full border border-cyan-200/12" />
              <div className="absolute left-[23%] top-[28%] h-[46%] w-[54%] rounded-full border border-cyan-200/12" />
              <div className="absolute left-1/2 top-1/2 h-[78%] w-[78%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[conic-gradient(from_0deg,transparent_0deg,rgba(103,232,249,0.12)_18deg,transparent_45deg)] drone-radar-sweep" />
              <svg className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden="true">
                {snapshot.fleet.map((drone) => {
                  const trail = getRouteTrail(drone);
                  const hasAlert = snapshot.alerts.some((alert) => alert.droneId === drone.id);

                  return (
                    <line
                      key={`${drone.id}-trail`}
                      x1={trail.x1}
                      y1={trail.y1}
                      x2={trail.x2}
                      y2={trail.y2}
                      stroke={hasAlert ? "rgba(248,113,113,0.34)" : "rgba(103,232,249,0.32)"}
                      strokeWidth="1.5"
                      strokeDasharray="5 7"
                    />
                  );
                })}
              </svg>
              <div className="absolute bottom-8 left-8 rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-xs text-slate-300 backdrop-blur">
                <div className="font-bold text-white">Lower Manhattan perimeter</div>
                <div>Simulated GPS • Review-only controls</div>
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
                      isSelected
                        ? "border-cyan-100 bg-cyan-300/35 shadow-[0_0_18px_rgba(103,232,249,0.85),0_0_52px_rgba(103,232,249,0.46)] drone-active-marker"
                        : "border-white/20 bg-slate-900/80 shadow-[0_0_18px_rgba(15,23,42,0.65)]"
                    }`}
                    style={position}
                    aria-label={`Select ${drone.name}`}
                  >
                    {isSelected && <span className="absolute left-1/2 top-1/2 h-14 w-14 -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan-200/35 drone-active-radius" />}
                    <span className={`relative z-10 block h-5 w-5 rounded-full ${hasAlert ? "bg-red-400 shadow-[0_0_22px_rgba(248,113,113,0.75)]" : "bg-cyan-300 shadow-[0_0_22px_rgba(103,232,249,0.72)]"}`} />
                    <span className="absolute left-7 top-1/2 z-20 -translate-y-1/2 whitespace-nowrap rounded-lg border border-white/10 bg-black/60 px-2 py-1 text-xs font-bold text-white shadow-lg shadow-black/30">
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
              <h2 className="text-lg font-black text-white">Action log</h2>
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
          <Panel title="AI recommendations" helper="Review-only staging. No live commands are sent." captureName="recommendations">
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
                        <p className="mt-2 text-xs font-bold text-slate-500">{drone?.name ?? recommendation.droneId}</p>
                      </div>
                      <button
                        onClick={() => stageAction(recommendation)}
                        disabled={pendingActionId === recommendation.id}
                        className="rounded-xl border border-cyan-200/20 bg-cyan-300 px-4 py-2 text-sm font-black text-slate-950 transition hover:bg-cyan-200 disabled:cursor-wait disabled:opacity-60"
                      >
                        {pendingActionId === recommendation.id ? "Staging…" : "Stage"}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          </Panel>

          <Panel title="Alerts" helper="Severity, confidence, and operator context." captureName="alerts">
            <div className="space-y-3">
              {snapshot.alerts.map((alert) => {
                const drone = snapshot.fleet.find((unit) => unit.id === alert.droneId);

                return (
                  <article key={alert.id} className={`rounded-2xl border p-4 ${severityStyles[alert.severity]}`}>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-xs font-black uppercase tracking-[0.18em]">{alert.severity}</span>
                      <span className="rounded-full bg-black/25 px-2 py-1 text-xs font-bold">{alert.confidence}%</span>
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

        <Panel title="Fleet telemetry" helper="Mock API data for demo-safe ingestion." captureName="telemetry">
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

function WorkflowButton({
  label,
  onClick,
  disabled = false,
  tone = "primary",
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  tone?: "primary" | "danger";
}) {
  const toneClass =
    tone === "danger"
      ? "border-red-300/25 bg-red-400/15 text-red-100 hover:border-red-200/50"
      : "border-cyan-200/20 bg-white/[0.06] text-cyan-100 hover:border-cyan-200/50";

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`rounded-xl border px-3 py-2 text-xs font-black transition disabled:cursor-not-allowed disabled:opacity-40 ${toneClass}`}
    >
      {label}
    </button>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/65 p-3.5">
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
    <section data-pitch-capture={captureName} className="rounded-[2rem] border border-white/10 bg-white/[0.045] p-5 shadow-xl shadow-slate-950/25 backdrop-blur">
      <div className="mb-4">
        <h2 className="text-xl font-black text-white">{title}</h2>
        <p className="mt-1 text-sm text-slate-400">{helper}</p>
      </div>
      {children}
    </section>
  );
}
