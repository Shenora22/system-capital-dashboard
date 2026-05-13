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
    approvalState: passed
      ? ("PENDING_APPROVAL" as ApprovalState)
      : ("BLOCKED" as ApprovalState),
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
        message: passed
          ? "Preflight checklist passed; operator approval requested."
          : "Preflight failed; mission start blocked.",
      },
      status: passed ? "acknowledged" : "open",
      requiresApproval: passed,
    }),
  };
}

export function evaluateTelemetryThresholds(
  fleet: DroneFleetUnit[],
  options: ThresholdEvaluationOptions,
): SkyTraceEvent[] {
  const now = options.now ?? new Date().toISOString();
  const nowMs = Date.parse(now);
  const existingEventIds = options.existingEventIds ?? new Set<string>();
  const events: SkyTraceEvent[] = [];

  const addEvent = (event: SkyTraceEvent) => {
    if (!existingEventIds.has(event.eventId)) events.push(event);
  };

  const addApprovalRequest = (
    eventId: string,
    timestamp: string,
    payload: Record<string, unknown>,
  ) => {
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
    const secondsSincePing = Math.max(
      0,
      Math.round((nowMs - Date.parse(drone.lastPing)) / 1000),
    );
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
          payload: {
            ...payloadBase,
            batteryPct: drone.batteryPct,
            message:
              "Battery below 10%; operator approval required before continuing.",
          },
          status: "open",
          requiresApproval: true,
        }),
      );
      addApprovalRequest(
        `${options.missionId}-${drone.id}-battery-approval-requested`,
        now,
        {
          ...payloadBase,
          approvalFor: "battery_warning",
          message:
            "Approval requested: continue, abort, or delegate after critical battery warning.",
        },
      );
    } else if (drone.batteryPct < 20) {
      addEvent(
        createSkyTraceEvent({
          eventId: `${options.missionId}-${drone.id}-battery-warn`,
          missionId: options.missionId,
          timestamp: now,
          source: "telemetry",
          type: "battery_warning",
          severity: "warn",
          payload: {
            ...payloadBase,
            batteryPct: drone.batteryPct,
            message: "Battery below 20%; WARN auto-logged.",
          },
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
          payload: {
            ...payloadBase,
            rssiDbm,
            message: "RSSI below -85 dBm; WARN auto-logged.",
          },
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
          payload: {
            ...payloadBase,
            secondsSincePing,
            trigger: "no_ping_gt_5s",
            message: "No ping for more than 5 seconds; incident opened.",
          },
          status: "open",
          requiresApproval: true,
        }),
      );
      addApprovalRequest(
        `${options.missionId}-${drone.id}-no-ping-approval-requested`,
        now,
        {
          ...payloadBase,
          approvalFor: "incident_opened",
          message:
            "Approval requested: continue, abort, or delegate no-ping incident.",
        },
      );
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
          payload: {
            ...payloadBase,
            latitude: drone.latitude,
            longitude: drone.longitude,
            message: "Geofence breach detected; operator approval required.",
          },
          status: "open",
          requiresApproval: true,
        }),
      );
      addApprovalRequest(
        `${options.missionId}-${drone.id}-geofence-approval-requested`,
        now,
        {
          ...payloadBase,
          approvalFor: "geofence_breach",
          message:
            "Approval requested: continue, abort, or delegate geofence breach.",
        },
      );
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
          payload: {
            ...payloadBase,
            speedMph: drone.speedMph,
            message: "Speed anomaly above demo envelope; WARN auto-logged.",
          },
          status: "acknowledged",
          requiresApproval: false,
        }),
      );
    }
  });

  if (options.missionStartedAt && options.missionDurationLimitMinutes) {
    const minutesElapsed =
      (nowMs - Date.parse(options.missionStartedAt)) / 60_000;
    if (minutesElapsed > options.missionDurationLimitMinutes) {
      addEvent(
        createSkyTraceEvent({
          eventId: `${options.missionId}-duration-warn`,
          missionId: options.missionId,
          timestamp: now,
          source: "system",
          type: "telemetry_anomaly",
          severity: "warn",
          payload: {
            minutesElapsed: Math.round(minutesElapsed),
            limitMinutes: options.missionDurationLimitMinutes,
            message: "Mission duration exceeded; operator notified.",
          },
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

export type SkyTraceApiMissionStatus =
  | "PENDING_APPROVAL"
  | "BLOCKED"
  | "STARTED"
  | "DENIED";
export type SkyTraceCheckStatus = "passed" | "failed" | "blocked";
export type SkyTraceCheckSeverity = "info" | "warn" | "critical";
export type SkyTraceApprovalDecision = "approved" | "denied";

export type SkyTraceApiChecklistItem = {
  id: string;
  label: string;
  status: SkyTraceCheckStatus;
  severity: SkyTraceCheckSeverity;
};

export type SkyTraceMissionProfile = {
  maxDuration: number;
  geofenceRadius: number;
  maxAltitude: number;
  environment: string;
};

export type SkyTracePreflightSubmitRequest = {
  missionId: string;
  droneId: string;
  operatorId: string;
  missionProfile: SkyTraceMissionProfile;
  checks: SkyTraceApiChecklistItem[];
};

export type SkyTraceApprovalRespondRequest = {
  approvalId: string;
  missionId: string;
  decision: SkyTraceApprovalDecision;
  operatorId: string;
  timestamp?: string;
  reason?: string;
};

export type SkyTraceLocalEventRequest = {
  missionId: string;
  type: SkyTraceEventType;
  source: SkyTraceEventSource;
  severity: SkyTraceEventSeverity;
  payload: Record<string, unknown>;
  timestamp?: string;
  status?: SkyTraceEventStatus;
  requiresApproval?: boolean;
  approvedBy?: string;
  approvedAt?: string;
};

export type ValidationResult<T> =
  | { ok: true; data: T }
  | { ok: false; errors: string[] };

export type SkyTracePreflightSubmitResult = {
  approvalId?: string;
  missionId: string;
  status: Extract<SkyTraceApiMissionStatus, "PENDING_APPROVAL" | "BLOCKED">;
  blockers?: string[];
  events: SkyTraceEvent[];
};

export type SkyTraceApprovalRespondResult = {
  approvalId: string;
  missionId: string;
  status: Extract<SkyTraceApiMissionStatus, "STARTED" | "DENIED">;
  events: SkyTraceEvent[];
};

const openClawEventLabels: Record<OpenClawSkyTraceEventType, string> = {
  "skytrace.mission.preflight_started": "Preflight started",
  "skytrace.mission.preflight_completed": "Preflight completed",
  "skytrace.mission.preflight_failed": "Preflight failed",
  "skytrace.mission.approval_requested": "Approval requested",
  "skytrace.mission.started": "Mission started",
  "skytrace.mission.denied": "Mission denied",
};

const skyTraceApiEventTypes: SkyTraceEventType[] = [
  "skytrace.mission.preflight_started",
  "skytrace.mission.preflight_completed",
  "skytrace.mission.preflight_failed",
  "skytrace.mission.approval_requested",
  "skytrace.mission.started",
  "skytrace.mission.denied",
  "preflight_check",
  "mission_start",
  "mission_end",
  "telemetry_anomaly",
  "geofence_breach",
  "battery_warning",
  "signal_loss",
  "operator_override",
  "incident_opened",
  "incident_resolved",
  "ai_summary_generated",
  "approval_requested",
  "approval_granted",
  "approval_denied",
];

const skyTraceEventSources: SkyTraceEventSource[] = [
  "telemetry",
  "operator",
  "system",
  "ai",
];
const skyTraceEventSeverities: SkyTraceEventSeverity[] = [
  "info",
  "warn",
  "critical",
];
const skyTraceEventStatuses: SkyTraceEventStatus[] = [
  "open",
  "acknowledged",
  "resolved",
  "escalated",
];
const checkStatuses: SkyTraceCheckStatus[] = ["passed", "failed", "blocked"];
const checkSeverities: SkyTraceCheckSeverity[] = ["info", "warn", "critical"];

export function validateSkyTracePreflightSubmit(
  input: unknown,
): ValidationResult<SkyTracePreflightSubmitRequest> {
  const errors: string[] = [];
  const payload = asRecord(input);

  const missionId = readString(payload, "missionId", errors);
  const droneId = readString(payload, "droneId", errors);
  const operatorId = readString(payload, "operatorId", errors);
  const missionProfile = asRecord(payload.missionProfile);
  const checks = Array.isArray(payload.checks) ? payload.checks : [];

  const profile: SkyTraceMissionProfile = {
    maxDuration: readNumber(missionProfile, "maxDuration", errors),
    geofenceRadius: readNumber(missionProfile, "geofenceRadius", errors),
    maxAltitude: readNumber(missionProfile, "maxAltitude", errors),
    environment: readString(missionProfile, "environment", errors),
  };

  if (!Array.isArray(payload.checks) || checks.length === 0) {
    errors.push("checks must be a non-empty array.");
  }

  const parsedChecks = checks.map((item, index) => {
    const check = asRecord(item);
    const status = readEnum(
      check,
      "status",
      checkStatuses,
      errors,
      `checks[${index}].status`,
    );
    const severity = readEnum(
      check,
      "severity",
      checkSeverities,
      errors,
      `checks[${index}].severity`,
    );

    return {
      id: readString(check, "id", errors, `checks[${index}].id`),
      label: readString(check, "label", errors, `checks[${index}].label`),
      status: status ?? "failed",
      severity: severity ?? "critical",
    } satisfies SkyTraceApiChecklistItem;
  });

  if (errors.length > 0) return { ok: false, errors };

  return {
    ok: true,
    data: {
      missionId,
      droneId,
      operatorId,
      missionProfile: profile,
      checks: parsedChecks,
    },
  };
}

export function submitSkyTracePreflight(
  payload: SkyTracePreflightSubmitRequest,
  timestamp = new Date().toISOString(),
): SkyTracePreflightSubmitResult {
  const blockers = getSkyTracePreflightBlockers(payload.checks);
  const status: SkyTracePreflightSubmitResult["status"] =
    blockers.length > 0 ? "BLOCKED" : "PENDING_APPROVAL";
  const approvalId =
    status === "PENDING_APPROVAL"
      ? createSkyTraceApprovalId(payload.missionId)
      : undefined;

  const basePayload = {
    droneId: payload.droneId,
    operatorId: payload.operatorId,
    missionProfile: payload.missionProfile,
  };

  const events = [
    createOpenClawSkyTraceEvent({
      missionId: payload.missionId,
      type: "skytrace.mission.preflight_started",
      timestamp,
      severity: "info",
      payload: {
        ...basePayload,
        message: "Preflight checklist submitted for local demo validation.",
      },
      status: "acknowledged",
    }),
    createOpenClawSkyTraceEvent({
      missionId: payload.missionId,
      type: "skytrace.mission.preflight_completed",
      timestamp,
      severity: status === "BLOCKED" ? "critical" : "info",
      payload: {
        ...basePayload,
        checks: payload.checks,
        blockerCount: blockers.length,
        message: "Preflight checklist validation completed.",
      },
      status: status === "BLOCKED" ? "open" : "acknowledged",
    }),
  ];

  if (status === "PENDING_APPROVAL") {
    events.push(
      createOpenClawSkyTraceEvent({
        missionId: payload.missionId,
        type: "skytrace.mission.approval_requested",
        timestamp,
        severity: "info",
        payload: {
          ...basePayload,
          approvalId,
          message: "Mission is ready for operator GO / NO-GO approval.",
        },
        status: "open",
        requiresApproval: true,
      }),
    );
  } else {
    events.push(
      createOpenClawSkyTraceEvent({
        missionId: payload.missionId,
        type: "skytrace.mission.preflight_failed",
        timestamp,
        severity: "critical",
        payload: {
          ...basePayload,
          blockers,
          message: "Mission start blocked by mock preflight validation.",
        },
        status: "open",
      }),
    );
  }

  return {
    approvalId,
    missionId: payload.missionId,
    status,
    blockers: blockers.length > 0 ? blockers : undefined,
    events,
  };
}

export function validateSkyTraceApprovalRespond(
  input: unknown,
): ValidationResult<SkyTraceApprovalRespondRequest> {
  const errors: string[] = [];
  const payload = asRecord(input);
  const decision = readEnum(
    payload,
    "decision",
    ["approved", "denied"],
    errors,
  );
  const timestamp =
    payload.timestamp === undefined
      ? undefined
      : readOptionalIsoTimestamp(payload, "timestamp", errors);
  const reason =
    payload.reason === undefined
      ? undefined
      : readString(payload, "reason", errors);

  const data = {
    approvalId: readString(payload, "approvalId", errors),
    missionId: readString(payload, "missionId", errors),
    decision: decision ?? "denied",
    operatorId: readString(payload, "operatorId", errors),
    timestamp,
    reason,
  } satisfies SkyTraceApprovalRespondRequest;

  if (errors.length > 0) return { ok: false, errors };
  return { ok: true, data };
}

export function respondToSkyTraceApproval(
  payload: SkyTraceApprovalRespondRequest,
  fallbackTimestamp = new Date().toISOString(),
): SkyTraceApprovalRespondResult {
  const timestamp = payload.timestamp ?? fallbackTimestamp;

  if (payload.decision === "approved") {
    return {
      approvalId: payload.approvalId,
      missionId: payload.missionId,
      status: "STARTED",
      events: [
        createOpenClawSkyTraceEvent({
          missionId: payload.missionId,
          type: "skytrace.mission.started",
          timestamp,
          severity: "info",
          payload: {
            approvalId: payload.approvalId,
            approvedBy: payload.operatorId,
            approvedAt: timestamp,
            message:
              "Operator approved mission start. Demo mode only; no drone command was sent.",
          },
          status: "resolved",
          approvedBy: payload.operatorId,
          approvedAt: timestamp,
        }),
      ],
    };
  }

  return {
    approvalId: payload.approvalId,
    missionId: payload.missionId,
    status: "DENIED",
    events: [
      createOpenClawSkyTraceEvent({
        missionId: payload.missionId,
        type: "skytrace.mission.denied",
        timestamp,
        severity: "critical",
        payload: {
          approvalId: payload.approvalId,
          deniedBy: payload.operatorId,
          deniedAt: timestamp,
          reason: payload.reason ?? "Operator denied mission start.",
          message:
            "Operator denied mission start. Mission remains local/demo-safe and blocked.",
        },
        status: "resolved",
        approvedBy: payload.operatorId,
        approvedAt: timestamp,
      }),
    ],
  };
}

export function validateSkyTraceLocalEvent(
  input: unknown,
): ValidationResult<SkyTraceLocalEventRequest> {
  const errors: string[] = [];
  const payload = asRecord(input);
  const timestamp =
    payload.timestamp === undefined
      ? undefined
      : readOptionalIsoTimestamp(payload, "timestamp", errors);
  const status =
    payload.status === undefined
      ? undefined
      : readEnum(payload, "status", skyTraceEventStatuses, errors);
  const requiresApproval =
    payload.requiresApproval === undefined
      ? undefined
      : readBoolean(payload, "requiresApproval", errors);
  const eventPayload = asRecord(payload.payload);

  if (!isRecord(payload.payload)) {
    errors.push("payload must be an object.");
  }

  const data = {
    missionId: readString(payload, "missionId", errors),
    type:
      readEnum(payload, "type", skyTraceApiEventTypes, errors) ??
      "telemetry_anomaly",
    source:
      readEnum(payload, "source", skyTraceEventSources, errors) ?? "system",
    severity:
      readEnum(payload, "severity", skyTraceEventSeverities, errors) ?? "info",
    payload: eventPayload,
    timestamp,
    status,
    requiresApproval,
    approvedBy:
      payload.approvedBy === undefined
        ? undefined
        : readString(payload, "approvedBy", errors),
    approvedAt:
      payload.approvedAt === undefined
        ? undefined
        : readOptionalIsoTimestamp(payload, "approvedAt", errors),
  } satisfies SkyTraceLocalEventRequest;

  if (errors.length > 0) return { ok: false, errors };
  return { ok: true, data };
}

export function normalizeSkyTraceLocalEvent(
  payload: SkyTraceLocalEventRequest,
  fallbackTimestamp = new Date().toISOString(),
): SkyTraceEvent {
  return createSkyTraceEvent({
    missionId: payload.missionId,
    timestamp: payload.timestamp ?? fallbackTimestamp,
    source: payload.source,
    type: payload.type,
    severity: payload.severity,
    payload: payload.payload,
    status:
      payload.status ?? (payload.requiresApproval ? "open" : "acknowledged"),
    requiresApproval: payload.requiresApproval ?? false,
    approvedBy: payload.approvedBy,
    approvedAt: payload.approvedAt,
  });
}

function createOpenClawSkyTraceEvent(input: {
  missionId: string;
  type: OpenClawSkyTraceEventType;
  timestamp: string;
  severity: SkyTraceEventSeverity;
  payload: Record<string, unknown>;
  status?: SkyTraceEventStatus;
  requiresApproval?: boolean;
  approvedBy?: string;
  approvedAt?: string;
}) {
  const label = openClawEventLabels[input.type];

  return createSkyTraceEvent({
    eventId: `${input.missionId}-${input.type}-${Date.parse(input.timestamp)}`,
    missionId: input.missionId,
    timestamp: input.timestamp,
    source: "system",
    type: input.type,
    severity: input.severity,
    payload: { eventName: input.type, label, ...input.payload },
    status: input.status ?? (input.requiresApproval ? "open" : "acknowledged"),
    requiresApproval: input.requiresApproval ?? false,
    approvedBy: input.approvedBy,
    approvedAt: input.approvedAt,
  });
}

function createSkyTraceApprovalId(missionId: string) {
  return `apr_${missionId.replace(/[^a-zA-Z0-9]+/g, "_").replace(/^_+|_+$/g, "") || "demo"}`;
}

function getSkyTracePreflightBlockers(checks: SkyTraceApiChecklistItem[]) {
  return checks
    .filter((check) => check.status !== "passed")
    .map((check) => `${check.label} (${check.severity})`);
}

function asRecord(value: unknown): Record<string, unknown> {
  return isRecord(value) ? value : {};
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readString(
  record: Record<string, unknown>,
  key: string,
  errors: string[],
  label = key,
) {
  const value = record[key];
  if (typeof value === "string" && value.trim().length > 0) return value.trim();
  errors.push(`${label} is required and must be a non-empty string.`);
  return "";
}

function readNumber(
  record: Record<string, unknown>,
  key: string,
  errors: string[],
) {
  const value = record[key];
  if (typeof value === "number" && Number.isFinite(value) && value > 0)
    return value;
  errors.push(`${key} is required and must be a positive number.`);
  return 0;
}

function readBoolean(
  record: Record<string, unknown>,
  key: string,
  errors: string[],
) {
  const value = record[key];
  if (typeof value === "boolean") return value;
  errors.push(`${key} must be a boolean when provided.`);
  return false;
}

function readEnum<T extends string>(
  record: Record<string, unknown>,
  key: string,
  values: readonly T[],
  errors: string[],
  label = key,
): T | undefined {
  const value = record[key];
  if (typeof value === "string" && values.includes(value as T))
    return value as T;
  errors.push(`${label} must be one of: ${values.join(", ")}.`);
  return undefined;
}

function readOptionalIsoTimestamp(
  record: Record<string, unknown>,
  key: string,
  errors: string[],
) {
  const value = readString(record, key, errors);
  if (value && Number.isNaN(Date.parse(value))) {
    errors.push(`${key} must be a valid ISO timestamp.`);
  }

  return value;
}
