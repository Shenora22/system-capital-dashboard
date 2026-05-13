import { createSkyTraceEvent } from "@/lib/skytrace-workflow";
import type {
  OpenClawSkyTraceEventType,
  SkyTraceEvent,
  SkyTraceEventSeverity,
  SkyTraceEventSource,
  SkyTraceEventStatus,
  SkyTraceEventType,
} from "@/lib/skytrace-workflow";

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
