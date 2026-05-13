import type { DroneFleetUnit } from "@/lib/drone-mission";

export type SkyTraceEventSource = "telemetry" | "operator" | "system" | "ai";
export type SkyTraceEventSeverity = "info" | "warn" | "critical";
export type SkyTraceEventStatus =
  | "open"
  | "acknowledged"
  | "resolved"
  | "escalated";
export type MissionPhase = "PRE_MISSION" | "ACTIVE_MISSION" | "POST_MISSION";
export type MissionLifecycleStatus =
  | "PREFLIGHT"
  | "PENDING_APPROVAL"
  | "ACTIVE"
  | "ABORTED"
  | "CLOSED"
  | "BLOCKED";
export type ApprovalState =
  | "PENDING_APPROVAL"
  | "APPROVED"
  | "DENIED"
  | "EXECUTED"
  | "BLOCKED"
  | "ESCALATED";

export type OpenClawSkyTraceEventType =
  | "skytrace.mission.preflight_started"
  | "skytrace.mission.preflight_completed"
  | "skytrace.mission.preflight_failed"
  | "skytrace.mission.approval_requested"
  | "skytrace.mission.started"
  | "skytrace.mission.denied";

export type SkyTraceEventType =
  | OpenClawSkyTraceEventType
  | "preflight_check"
  | "mission_start"
  | "mission_end"
  | "telemetry_anomaly"
  | "geofence_breach"
  | "battery_warning"
  | "signal_loss"
  | "operator_override"
  | "incident_opened"
  | "incident_resolved"
  | "ai_summary_generated"
  | "approval_requested"
  | "approval_granted"
  | "approval_denied";

export type SkyTraceEvent = {
  eventId: string;
  missionId: string;
  timestamp: string;
  source: SkyTraceEventSource;
  type: SkyTraceEventType;
  severity: SkyTraceEventSeverity;
  payload: Record<string, unknown>;
  status: SkyTraceEventStatus;
  requiresApproval: boolean;
  approvedBy?: string;
  approvedAt?: string;
};

export type PreflightChecklistItem = {
  id: string;
  label: string;
  passed: boolean;
  detail: string;
};

export type ThresholdEvaluationOptions = {
  missionId: string;
  now?: string;
  missionStartedAt?: string;
  missionDurationLimitMinutes?: number;
  existingEventIds?: Set<string>;
};

export const skyTraceMissionId = "skytrace-demo-mission-001";
export const skyTraceOperator = "Ops Lead Vega";

export const initialPreflightChecklist: PreflightChecklistItem[] = [
  {
    id: "airframe",
    label: "Airframe + payload inspection",
    passed: true,
    detail: "Mock maintenance ledger is current for demo fleet.",
  },
  {
    id: "battery",
    label: "Launch battery reserve",
    passed: true,
    detail: "Primary launch asset is above minimum reserve.",
  },
  {
    id: "geofence",
    label: "Geofence + route review",
    passed: true,
    detail: "Demo airspace perimeter loaded in review-only mode.",
  },
  {
    id: "observer",
    label: "Human operator assigned",
    passed: true,
    detail: "Named operator must approve GO / NO-GO before start.",
  },
];

export function createSkyTraceEvent(
  input: Omit<SkyTraceEvent, "eventId"> & { eventId?: string },
): SkyTraceEvent {
  return {
    ...input,
    eventId:
      input.eventId ??
      `${input.missionId}-${input.type}-${Date.parse(input.timestamp)}-${Math.random().toString(36).slice(2, 7)}`,
  };
}

export function runPreflightChecklist(
  missionId: string,
  checklist: PreflightChecklistItem[] = initialPreflightChecklist,
  timestamp = new Date().toISOString(),
) {
  const failedItems = checklist.filter((item) => !item.passed);
  const passed = failedItems.length === 0;

  return {
    passed,
    approvalState: passed ? ("PENDING_APPROVAL" as ApprovalState) : ("BLOCKED" as ApprovalState),
    event: createSkyTraceEvent({
      eventId: `${missionId}-preflight-${passed ? "pass" : "fail"}`,
      missionId,
      timestamp,
      source: "system",
      type: "preflight_check",
      severity: passed ? "info" : "critical",
      payload: {
        checklist,
        failedItems: failedItems.map((item) => item.label),
        message: passed ? "Preflight checklist passed; operator approval requested." : "Preflight failed; mission start blocked.",
      },
      status: passed ? "acknowledged" : "open",
      requiresApproval: passed,
    }),
  };
}

export function evaluateTelemetryThresholds(fleet: DroneFleetUnit[], options: ThresholdEvaluationOptions): SkyTraceEvent[] {
  const now = options.now ?? new Date().toISOString();
  const nowMs = Date.parse(now);
  const existingEventIds = options.existingEventIds ?? new Set<string>();
  const events: SkyTraceEvent[] = [];

  const addEvent = (event: SkyTraceEvent) => {
    if (!existingEventIds.has(event.eventId)) events.push(event);
  };

  const addApprovalRequest = (eventId: string, timestamp: string, payload: Record<string, unknown>) => {
    addEvent(
      createSkyTraceEvent({
        eventId,
        missionId: options.missionId,
        timestamp,
        source: "system",
        type: "approval_requested",
        severity: "critical",
        payload,
        status: "open",
        requiresApproval: true,
      }),
    );
  };

  fleet.forEach((drone) => {
    const rssiDbm = drone.rssiDbm ?? signalPctToRssiDbm(drone.signalPct);
    const secondsSincePing = Math.max(0, Math.round((nowMs - Date.parse(drone.lastPing)) / 1000));
    const payloadBase = {
      droneId: drone.id,
      droneName: drone.name,
      zone: drone.zone,
      operator: drone.operator,
    };

    if (drone.batteryPct < 10) {
      addEvent(
        createSkyTraceEvent({
          eventId: `${options.missionId}-${drone.id}-battery-critical`,
          missionId: options.missionId,
          timestamp: now,
          source: "telemetry",
          type: "battery_warning",
          severity: "critical",
          payload: { ...payloadBase, batteryPct: drone.batteryPct, message: "Battery below 10%; operator approval required before continuing." },
          status: "open",
          requiresApproval: true,
        }),
      );
      addApprovalRequest(`${options.missionId}-${drone.id}-battery-approval-requested`, now, {
        ...payloadBase,
        approvalFor: "battery_warning",
        message: "Approval requested: continue, abort, or delegate after critical battery warning.",
      });
    } else if (drone.batteryPct < 20) {
      addEvent(
        createSkyTraceEvent({
          eventId: `${options.missionId}-${drone.id}-battery-warn`,
          missionId: options.missionId,
          timestamp: now,
          source: "telemetry",
          type: "battery_warning",
          severity: "warn",
          payload: { ...payloadBase, batteryPct: drone.batteryPct, message: "Battery below 20%; WARN auto-logged." },
          status: "acknowledged",
          requiresApproval: false,
        }),
      );
    }

    if (rssiDbm < -85) {
      addEvent(
        createSkyTraceEvent({
          eventId: `${options.missionId}-${drone.id}-rssi-warn`,
          missionId: options.missionId,
          timestamp: now,
          source: "telemetry",
          type: "signal_loss",
          severity: "warn",
          payload: { ...payloadBase, rssiDbm, message: "RSSI below -85 dBm; WARN auto-logged." },
          status: "acknowledged",
          requiresApproval: false,
        }),
      );
    }

    if (secondsSincePing > 5) {
      addEvent(
        createSkyTraceEvent({
          eventId: `${options.missionId}-${drone.id}-no-ping-critical`,
          missionId: options.missionId,
          timestamp: now,
          source: "telemetry",
          type: "incident_opened",
          severity: "critical",
          payload: { ...payloadBase, secondsSincePing, trigger: "no_ping_gt_5s", message: "No ping for more than 5 seconds; incident opened." },
          status: "open",
          requiresApproval: true,
        }),
      );
      addApprovalRequest(`${options.missionId}-${drone.id}-no-ping-approval-requested`, now, {
        ...payloadBase,
        approvalFor: "incident_opened",
        message: "Approval requested: continue, abort, or delegate no-ping incident.",
      });
    }

    if (drone.geofenceStatus === "breached") {
      addEvent(
        createSkyTraceEvent({
          eventId: `${options.missionId}-${drone.id}-geofence-critical`,
          missionId: options.missionId,
          timestamp: now,
          source: "telemetry",
          type: "geofence_breach",
          severity: "critical",
          payload: { ...payloadBase, latitude: drone.latitude, longitude: drone.longitude, message: "Geofence breach detected; operator approval required." },
          status: "open",
          requiresApproval: true,
        }),
      );
      addApprovalRequest(`${options.missionId}-${drone.id}-geofence-approval-requested`, now, {
        ...payloadBase,
        approvalFor: "geofence_breach",
        message: "Approval requested: continue, abort, or delegate geofence breach.",
      });
    }

    if (drone.speedMph > 32) {
      addEvent(
        createSkyTraceEvent({
          eventId: `${options.missionId}-${drone.id}-speed-warn`,
          missionId: options.missionId,
          timestamp: now,
          source: "telemetry",
          type: "telemetry_anomaly",
          severity: "warn",
          payload: { ...payloadBase, speedMph: drone.speedMph, message: "Speed anomaly above demo envelope; WARN auto-logged." },
          status: "acknowledged",
          requiresApproval: false,
        }),
      );
    }
  });

  if (options.missionStartedAt && options.missionDurationLimitMinutes) {
    const minutesElapsed = (nowMs - Date.parse(options.missionStartedAt)) / 60_000;
    if (minutesElapsed > options.missionDurationLimitMinutes) {
      addEvent(
        createSkyTraceEvent({
          eventId: `${options.missionId}-duration-warn`,
          missionId: options.missionId,
          timestamp: now,
          source: "system",
          type: "telemetry_anomaly",
          severity: "warn",
          payload: { minutesElapsed: Math.round(minutesElapsed), limitMinutes: options.missionDurationLimitMinutes, message: "Mission duration exceeded; operator notified." },
          status: "acknowledged",
          requiresApproval: false,
        }),
      );
    }
  }

  return events;
}

export function generateMissionSummary(
  events: SkyTraceEvent[],
  missionId = skyTraceMissionId,
) {
  const criticalCount = events.filter(
    (event) => event.severity === "critical",
  ).length;
  const warnCount = events.filter((event) => event.severity === "warn").length;
  const approvals = events.filter(
    (event) => event.type === "approval_granted",
  ).length;
  const resolved = events.filter(
    (event) =>
      event.status === "resolved" || event.type === "incident_resolved",
  ).length;

  return `SkyTrace demo mission ${missionId} closed with ${events.length} logged events: ${criticalCount} critical, ${warnCount} warn, ${approvals} approval grant(s), and ${resolved} resolved incident marker(s). All actions remained simulated; no live drone commands were sent.`;
}

function signalPctToRssiDbm(signalPct: number) {
  return Math.round(-100 + signalPct * 0.5);
}
