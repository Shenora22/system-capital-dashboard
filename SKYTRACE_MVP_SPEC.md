# SkyTrace MVP Technical Operating Specification

## Executive Summary — PARTIALLY IMPLEMENTED

SkyTrace is a drone operational workflow module layered onto System Capital OS. It is implemented as a Next.js dashboard route, local/demo API routes, mock mission data, workflow helper functions, and a System Event adapter.

SkyTrace is **not** a standalone platform, live autonomous flight system, production telemetry system, or defense/weapons platform.

Integrity warnings:

- **No production readiness is implied.** The current implementation is an MVP/demo workflow and local event simulator.
- **No real drone control is implemented.** Actions are staged for review and explicitly return that no live command was sent.
- **No live telemetry ingestion is implemented.** Fleet telemetry comes from mock in-repository data served through local API routes.
- **No production persistence is implemented for the dashboard workflow.** Mission workflow state and SkyTrace event logs live in React component state during the browser session.
- **No authentication, authorization, RBAC, or tenant isolation is implemented for SkyTrace routes.**

## Current Architecture — PARTIALLY IMPLEMENTED

SkyTrace currently consists of five local layers:

1. **Operator UI:** `/drone` renders mission workflow controls, a simulated map, fleet telemetry, mock alerts, recommendations, action log, and local event timeline.
2. **Workflow engine helpers:** `lib/skytrace-workflow.ts` defines event types, mission phases/statuses, preflight evaluation, telemetry threshold evaluation, event construction, and mission summary generation.
3. **Mission data helpers:** `lib/drone-mission.ts` defines the mock fleet, mock alerts, review-only automation actions, recommendations, and mission snapshot builder.
4. **API layer:** `app/api/drone/*` serves mock fleet data and stages review actions. `app/api/skytrace/*` validates local preflight, approval, and event payloads and returns normalized event objects.
5. **System Event adapter:** `lib/skytrace-api.ts` maps SkyTrace events into the existing System Capital `SystemEvent` shape, but the local routes return previews instead of persisting to a shared event ledger.

### A. Operator UI → Workflow Engine → Event Adapter → System Events

```text
Operator UI (/drone)
  → local React workflow handlers
  → lib/skytrace-workflow.ts event helpers
  → lib/skytrace-api.ts mapSkyTraceEventToSystemEvent()
  → SystemEvent preview shape
  → PLANNED: shared System Capital event ledger write
```

### B. Telemetry Feed → Threshold Evaluator → SkyTrace Event → UI Alert

```text
Mock fleet snapshot
  → /api/drone/fleet
  → /drone React state
  → evaluateTelemetryThresholds()
  → SkyTraceEvent[] appended to local event timeline
  → UI event cards / open critical incident count
```

### C. Approval Flow → Preflight → Approval Request → Mission Start → Incident Handling → Mission Summary

```text
Run preflight
  → runPreflightChecklist()
  → PENDING_APPROVAL or BLOCKED
  → operator Approve GO / Deny NO-GO
  → ACTIVE_MISSION when approved
  → telemetry threshold events during ACTIVE state
  → continue / delegate / resolve / abort operator controls
  → Generate AI summary button closes mission and appends local summary event
```

## Implemented Components — PARTIALLY IMPLEMENTED

### Workflow engine — IMPLEMENTED

Verified capabilities:

- Defines SkyTrace event sources: `telemetry`, `operator`, `system`, and `ai`.
- Defines event severities: `info`, `warn`, and `critical`.
- Defines event statuses: `open`, `acknowledged`, `resolved`, and `escalated`.
- Defines mission phases: `PRE_MISSION`, `ACTIVE_MISSION`, and `POST_MISSION`.
- Defines mission lifecycle statuses: `PREFLIGHT`, `PENDING_APPROVAL`, `ACTIVE`, `ABORTED`, `CLOSED`, and `BLOCKED`.
- Defines approval states: `PENDING_APPROVAL`, `APPROVED`, `DENIED`, `EXECUTED`, `BLOCKED`, and `ESCALATED`.
- Creates normalized `SkyTraceEvent` objects.
- Runs a preflight checklist and returns either `PENDING_APPROVAL` or `BLOCKED`.
- Evaluates mock telemetry thresholds and produces SkyTrace events.
- Generates a deterministic text mission summary from locally logged events.

### Drone mission data — MOCKED/LOCAL ONLY

Verified capabilities:

- Defines a static mock fleet of four drones.
- Defines static mock alerts.
- Defines review-only automation actions: `stage_return_home`, `notify_operator`, and `create_review_ticket`.
- Generates recommendations from local data based on low battery, low signal, and high/critical mock alerts.
- Builds a mission snapshot named `System Capital SkyTrace Demo`.

### Operator dashboard — PARTIALLY IMPLEMENTED

Verified capabilities:

- Loads mock fleet data from `/api/drone/fleet`.
- Displays mission status, approval state, preflight checklist, local event timeline, mock map markers, mock alerts, and mock telemetry table.
- Provides local workflow controls for preflight, approval/denial, incident continuation, incident delegation, incident resolution, mission abort, preflight failure injection, and mission summary generation.
- Runs threshold evaluation on an interval only while the mission phase is `ACTIVE_MISSION` and the mission status is `ACTIVE`.
- Stages recommendation actions through `/api/drone/actions` and logs the returned review-only audit entry locally.

Not implemented:

- Production command dispatch.
- Real-time websocket infrastructure.
- Persistent event storage.
- Authenticated operator identity.

## Workflow Lifecycle — PARTIALLY IMPLEMENTED

### Verified state vocabulary

SkyTrace uses two related lifecycle concepts:

- **MissionPhase:** `PRE_MISSION`, `ACTIVE_MISSION`, `POST_MISSION`.
- **MissionLifecycleStatus:** `PREFLIGHT`, `PENDING_APPROVAL`, `ACTIVE`, `ABORTED`, `CLOSED`, `BLOCKED`.

The user-requested state set is represented in code as follows:

| Requested state | Verified code representation | Status |
| --- | --- | --- |
| `PRE_MISSION` | `MissionPhase` | IMPLEMENTED |
| `ACTIVE_MISSION` | `MissionPhase` | IMPLEMENTED |
| `POST_MISSION` | `MissionPhase` | IMPLEMENTED |
| `PENDING_APPROVAL` | `MissionLifecycleStatus` and `ApprovalState` | IMPLEMENTED |
| `ACTIVE` | `MissionLifecycleStatus` | IMPLEMENTED |
| `ABORTED` | `MissionLifecycleStatus` | IMPLEMENTED |
| `CLOSED` | `MissionLifecycleStatus` | IMPLEMENTED |
| `BLOCKED` | `MissionLifecycleStatus` and `ApprovalState` | IMPLEMENTED |

### Allowed transitions verified in UI code

| Trigger | From | To | Approval behavior | Events emitted locally |
| --- | --- | --- | --- | --- |
| Initial page state | none | `PRE_MISSION` + `PREFLIGHT` + `PENDING_APPROVAL` | Approval not yet requested | none |
| Run preflight, all items pass | `PREFLIGHT` | `PENDING_APPROVAL` | Mission start approval required | `preflight_check`, `approval_requested` |
| Run preflight, any item fails | `PREFLIGHT` | `BLOCKED` | Start blocked | `preflight_check` |
| Toggle preflight fail | any demo state | `PREFLIGHT` + `PENDING_APPROVAL` | Resets local demo state for another preflight attempt | none |
| Approve GO | `PENDING_APPROVAL` | `ACTIVE_MISSION` + `ACTIVE` + `APPROVED` | Operator approval recorded locally | `approval_granted`, `mission_start` |
| Deny NO-GO | any UI state | `BLOCKED` + `DENIED` | Operator denial recorded locally | `approval_denied` |
| Continue incident | open critical event present | approval state `EXECUTED` | Records operator approval to continue; no drone command sent | `approval_granted` |
| Delegate incident | open critical event present | approval state `ESCALATED` | Records operator delegation | `operator_override` |
| Abort mission | `ACTIVE_MISSION` | `POST_MISSION` + `ABORTED` + `ESCALATED` | Operator abort recorded; no command pipeline | `operator_override`, `mission_end` |
| Resolve incident | open critical event present | approval state `EXECUTED` | Marks open critical local events resolved | `incident_resolved` |
| Generate AI summary | any UI state | `POST_MISSION` + `CLOSED` + `EXECUTED` | No approval requirement | `mission_end`, `ai_summary_generated` |

### Approval-required paths

- Passing preflight returns `PENDING_APPROVAL` and emits a `preflight_check` event with `requiresApproval: true`.
- The UI adds a mission-start `approval_requested` event when preflight passes.
- Critical battery warnings below 10%, no-ping incidents over five seconds, and geofence breaches emit critical events that require approval plus separate `approval_requested` events.
- Warn-level telemetry events do not require approval.

### Incident escalation behavior

Incident handling is local/demo only:

- No ping over five seconds opens an `incident_opened` event with severity `critical`, status `open`, and `requiresApproval: true`.
- Geofence breach and critical battery warnings produce critical open events requiring approval.
- The UI counts open critical events by filtering local `skyTraceEvents`.
- `Delegate` records an `operator_override` event with status `escalated`.
- `Abort mission` moves the mission to `POST_MISSION`/`ABORTED`, sets approval state to `ESCALATED`, emits an `operator_override`, and emits `mission_end` with `outcome: aborted`.
- `Resolve incident` mutates open critical local events to `resolved` and appends `incident_resolved`.

### Mission summary generation

Mission summary generation is implemented as a deterministic local function, despite the UI label calling it an AI summary. The function counts total events, critical events, warn events, approval grants, and resolved markers, then returns text that explicitly says all actions were simulated and no live drone commands were sent.

## Event System — PARTIALLY IMPLEMENTED

### SkyTrace event shape — IMPLEMENTED

All SkyTrace events use this shape:

```ts
{
  eventId: string;
  missionId: string;
  timestamp: string;
  source: "telemetry" | "operator" | "system" | "ai";
  type: SkyTraceEventType;
  severity: "info" | "warn" | "critical";
  payload: Record<string, unknown>;
  status: "open" | "acknowledged" | "resolved" | "escalated";
  requiresApproval: boolean;
  approvedBy?: string;
  approvedAt?: string;
}
```

### Formal event taxonomy — PARTIALLY IMPLEMENTED

The table below includes verified event types accepted by code. Emission notes distinguish events emitted by current helpers/UI/API from types that are accepted by validators but not generated in the current dashboard flow.

| Event type | Verified source(s) | Severity | Approval requirement | Payload shape / fields observed | SystemEvent mapping behavior | Status |
| --- | --- | --- | --- | --- | --- | --- |
| `preflight_check` | `system` | `info` on pass, `critical` on fail | `true` on pass, `false` on fail | `checklist`, `failedItems`, `message` | `eventType` copied; `sourceSystem` = `SkyTrace system`; critical maps to Failed/Critical | IMPLEMENTED |
| `approval_requested` | `system` | `info` for mission start; `critical` for critical threshold approvals | `true` | `action` or `approvalFor`, context fields, `message` | pending/open events map by severity/approval to Pending/High or Failed/Critical | IMPLEMENTED |
| `approval_granted` | `operator` | `info` | `false` after approval | `action`, `decision` or incident context, `message` | resolved maps to Success; priority Normal unless approval flag/severity raises it | IMPLEMENTED |
| `approval_denied` | `operator` | `critical` | `false` | `action`, `decision`, `message` | critical maps to Failed/Critical and sets `errorMessage` | IMPLEMENTED |
| `mission_start` | `system` | `info` | `false` | `message` | acknowledged maps to Success/Normal | IMPLEMENTED |
| `mission_end` | `system` | `info` on close, `warn` on abort | `false` | `outcome`, `message` | resolved maps to Success; warn acknowledged maps to Success/High because acknowledged takes precedence for status | IMPLEMENTED |
| `battery_warning` | `telemetry` | `critical` below 10%, `warn` below 20% | `true` below 10%; `false` below 20% | `droneId`, `droneName`, `zone`, `operator`, `batteryPct`, `message` | critical maps to Failed/Critical; warn acknowledged maps to Success/High | IMPLEMENTED |
| `signal_loss` | `telemetry` | `warn` when RSSI < -85 dBm | `false` | `droneId`, `droneName`, `zone`, `operator`, `rssiDbm`, `message` | acknowledged maps to Success; priority High | IMPLEMENTED |
| `incident_opened` | `telemetry` | `critical` when no ping > 5s | `true` | `droneId`, `droneName`, `zone`, `operator`, `secondsSincePing`, `trigger`, `message` | critical maps to Failed/Critical and sets `errorMessage` | IMPLEMENTED |
| `geofence_breach` | `telemetry` | `critical` | `true` | `droneId`, `droneName`, `zone`, `operator`, `latitude`, `longitude`, `message` | critical maps to Failed/Critical and sets `errorMessage` | IMPLEMENTED |
| `telemetry_anomaly` | `telemetry` for speed, `system` for duration | `warn` | `false` | speed event: drone context and `speedMph`; duration event: `minutesElapsed`, `limitMinutes`, `message` | warn acknowledged maps to Success/High | IMPLEMENTED |
| `operator_override` | `operator` | `warn` for delegate, `critical` for abort | `false` | `action`, critical count or `message`, `approvedBy`, `approvedAt` | escalated/critical maps to Failed; warn escalated maps to Failed/High | IMPLEMENTED |
| `incident_resolved` | `operator` | `info` | `false` | `resolvedEvents`, `message`, `approvedBy`, `approvedAt` | resolved maps to Success/Normal | IMPLEMENTED |
| `ai_summary_generated` | `ai` | `info` | `false` | `summary` | maps payload `summary` into `aiSummary` | IMPLEMENTED (deterministic/local text) |
| `skytrace.mission.preflight_started` | `system` | `info` | `false` | `eventName`, `label`, `droneId`, `operatorId`, `missionProfile`, `message` | maps like any SkyTrace event; route returns preview only | IMPLEMENTED in API helper |
| `skytrace.mission.preflight_completed` | `system` | `info` or `critical` | `false` | `eventName`, `label`, `checks`, `blockerCount`, `message` | critical maps Failed/Critical | IMPLEMENTED in API helper |
| `skytrace.mission.preflight_failed` | `system` | `critical` | `false` | `eventName`, `label`, `blockers`, `message` | critical maps Failed/Critical | IMPLEMENTED in API helper |
| `skytrace.mission.approval_requested` | `system` | `info` | `true` | `eventName`, `label`, `approvalId`, mission context, `message` | open approval maps Pending/High | IMPLEMENTED in API helper |
| `skytrace.mission.started` | `system` | `info` | `false` | `eventName`, `label`, `approvalId`, `approvedBy`, `approvedAt`, `message` | resolved maps Success/Normal | IMPLEMENTED in API helper |
| `skytrace.mission.denied` | `system` | `critical` | `false` | `eventName`, `label`, `approvalId`, `deniedBy`, `deniedAt`, `reason`, `message` | critical/resolved currently maps Success/Critical because resolved takes precedence in status mapper | IMPLEMENTED in API helper |

## Telemetry Logic — MOCKED/LOCAL ONLY

Telemetry threshold evaluation is implemented against local `DroneFleetUnit[]` data only. There is no live telemetry ingestion, websocket, streaming consumer, queue, or external feed adapter.

Verified thresholds:

- Battery `< 10%`: emits `battery_warning`, severity `critical`, `requiresApproval: true`, plus a critical `approval_requested` event.
- Battery `< 20%`: emits `battery_warning`, severity `warn`, `requiresApproval: false`.
- RSSI `< -85 dBm`: emits `signal_loss`, severity `warn`, `requiresApproval: false`.
- Last ping age `> 5 seconds`: emits `incident_opened`, severity `critical`, `requiresApproval: true`, plus critical `approval_requested`.
- `geofenceStatus === "breached"`: emits `geofence_breach`, severity `critical`, `requiresApproval: true`, plus critical `approval_requested`.
- Speed `> 32 mph`: emits `telemetry_anomaly`, severity `warn`, `requiresApproval: false`.
- Mission duration greater than configured limit: emits `telemetry_anomaly`, severity `warn`, `requiresApproval: false`.

Duplicate suppression is local and best-effort: the evaluator receives existing event IDs and skips newly generated events whose IDs already exist.

## Approval Engine — PARTIALLY IMPLEMENTED

The approval engine is implemented as local state transitions and helper functions, not as a production approval service.

Implemented:

- Preflight pass creates a pending approval state.
- Preflight fail blocks mission start.
- UI approval starts simulated mission and records `approval_granted` plus `mission_start`.
- UI denial blocks mission start and records `approval_denied`.
- API helper `submitSkyTracePreflight()` returns `PENDING_APPROVAL` with an `approvalId` when checks pass, or `BLOCKED` with blocker labels when checks fail.
- API helper `respondToSkyTraceApproval()` returns `STARTED` plus `skytrace.mission.started` for approval, or `DENIED` plus `skytrace.mission.denied` for denial.

Not implemented:

- Persistent approval records.
- Operator identity verification.
- Expiring approvals.
- Multi-operator review.
- Idempotency keys.
- Audit ledger persistence.
- Real command execution after approval.

## API Layer — PARTIALLY IMPLEMENTED

### `/api/drone/fleet` — MOCKED/LOCAL ONLY

- Method: `GET`.
- Returns `getDroneMissionSnapshot(new Date().toISOString())`.
- Uses static mock fleet, alerts, recommendations, and automation action definitions from `lib/drone-mission.ts`.

### `/api/drone/actions` — MOCKED/LOCAL ONLY

- Method: `POST`.
- Accepts `droneId`, `action`, and optional `recommendationId`.
- Validates only by checking the supplied drone/action exists in local arrays.
- Returns `status: "staged_for_review"` and a local audit object.
- Response message explicitly says no live command was sent.

### `/api/skytrace/preflight/submit` — PARTIALLY IMPLEMENTED

- Method: `POST`.
- Validates required fields using custom parser functions.
- Returns `400` with `INVALID_PAYLOAD` on malformed input.
- Returns preflight lifecycle result and generated SkyTrace events.
- Future n8n/System Event/Airtable/Telegram mapping is commented but not implemented.

### `/api/skytrace/approval/respond` — PARTIALLY IMPLEMENTED

- Method: `POST`.
- Validates approval response payload using custom parser functions.
- Returns started or denied result and generated SkyTrace events.
- Future n8n/System Event/Airtable/dashboard-sync mapping is commented but not implemented.

### `/api/skytrace/events` — PARTIALLY IMPLEMENTED

- Method: `POST`.
- Validates and normalizes a local SkyTrace event payload.
- Returns the normalized event and `systemEventPreview`.
- Does not write to the shared event ledger, Airtable, n8n, or any persistent store.

## Demo Constraints — MOCKED/LOCAL ONLY

These constraints are operational guardrails for the current MVP:

- **No real drone control.** All mission controls are UI state changes or local event records.
- **No live telemetry ingestion.** The dashboard reads mock fleet data from local helpers through `/api/drone/fleet`.
- **No production persistence.** The dashboard workflow event log and mission state are stored in React state only. The seed utility can upsert demo rows into Supabase when manually run with credentials, but the dashboard does not use that as a runtime persistence layer.
- **No real-world dispatch.** Review actions are staged only and return “No live command was sent.”
- **No external command execution.** The UI and local APIs do not call drone SDKs, flight controllers, dispatch systems, or command pipelines.
- **Local/mock APIs only for SkyTrace runtime.** API routes generate local JSON responses.
- **Simulated fleet data.** Fleet units, coordinates, alerts, and recommendations are fixtures in `lib/drone-mission.ts`.
- **Review/staging recommendations only.** Recommendations set `reviewRequired: true` and can only be staged for review.
- **No autonomous execution claims.** Threshold events and recommendations do not execute drone commands.

## Known Technical Debt — PARTIALLY IMPLEMENTED

Observed technical debt in the repository:

- UI copy still includes over-scoped product language such as “AI Mission Control for Autonomous Drone Operations,” while the implementation is local/demo-only.
- UI workflow state is tightly coupled to local React state and local mock API responses.
- SkyTrace runtime has no persistence layer for mission state, event history, approvals, or action audit records.
- API validation is hand-rolled and route-local; no shared schema library, versioned contracts, or OpenAPI specification is present.
- SkyTrace API routes have no authentication or authorization checks.
- No idempotency keys or durable duplicate prevention are implemented; duplicate suppression is only an in-memory event ID check.
- No queue, retry, dead-letter, or async handoff infrastructure is implemented for event dispatch.
- System Event mapping returns previews but does not append to a shared event ledger.
- Demo telemetry, operational rules, event generation, and UI actions are mixed in the `/drone` client component.
- No integration tests for SkyTrace routes/workflow helpers are present in the audited files.
- The Supabase seed utility writes demo rows to `drone_latest_location`, but the dashboard currently uses local mock mission data instead of a repository-backed persistence boundary.
- The `skytrace.mission.denied` API helper returns a critical event with `status: "resolved"`; the System Event status mapper treats resolved events as `Success`, which can understate denial severity in status displays.

## Immediate Priorities — PLANNED

Recommended next steps based on the current implementation state:

1. Replace over-scoped UI language with explicit “simulated / review-only / no live command” copy.
2. Add tests for `runPreflightChecklist()`, `evaluateTelemetryThresholds()`, `generateMissionSummary()`, SkyTrace API validators, and System Event mapping.
3. Add a typed repository boundary for missions, events, approvals, and action audit records before introducing persistence.
4. Add authentication/authorization before exposing SkyTrace routes outside local demo usage.
5. Add idempotency keys for preflight submissions, approval responses, action staging, and local event ingestion.
6. Decide whether SkyTrace events should be written into the existing System Capital event ledger and implement that write path explicitly.
7. Separate demo fixtures from operational workflow logic.
8. Define contract tests for the API payload shapes documented here.

## Future Integration Points — PLANNED

These are placeholders or comments in the codebase, not implemented runtime integrations:

- Shared System Capital event ledger writes for `SystemEvent` records.
- Airtable mission/event upsert.
- n8n handoff for Telegram, dashboard sync, and audit workflows.
- Supabase repository-backed mission and telemetry persistence.
- Typed environment configuration for external service URLs and credentials.
- Dashboard sync after approval and event ingestion.

## What Is Intentionally Not Built — NOT IMPLEMENTED

The current SkyTrace MVP does not include:

- Authentication.
- Multi-tenant isolation.
- Production command pipeline.
- Live n8n orchestration for SkyTrace.
- Persistence guarantees.
- Fleet management backend.
- FAA/compliance engine.
- Real-time websocket infrastructure.
- Role-based access control.
- Drone SDK integration.
- Autonomous flight control.
- External dispatch execution.
- Production telemetry ingestion.

## Current File Structure — IMPLEMENTED

Verified SkyTrace-relevant files:

```text
app/
  drone/
    page.tsx                         # Operator dashboard UI and local workflow state
  api/
    drone/
      actions/
        route.ts                     # Review-only action staging endpoint
      fleet/
        route.ts                     # Mock mission snapshot endpoint
    skytrace/
      approval/
        respond/
          route.ts                   # Local approval response endpoint
      events/
        route.ts                     # Local event normalization + SystemEvent preview endpoint
      preflight/
        submit/
          route.ts                   # Local preflight submission endpoint
lib/
  drone-mission.ts                   # Mock fleet, alerts, recommendations, mission snapshot
  skytrace-api.ts                    # API validators, OpenClaw event helpers, SystemEvent adapter
  skytrace-workflow.ts               # Workflow types, preflight, telemetry thresholds, summary
  system-events.ts                   # System Capital event type and existing lead-intake fixtures
automation/
  scripts/
    seed-skytrace.mjs                # Optional Supabase demo seed utility, not dashboard runtime
```

## MVP Positioning Summary — PARTIALLY IMPLEMENTED

### SkyTrace MVP Current State

The SkyTrace MVP successfully demonstrates:

- A drone operational workflow module layered into System Capital OS.
- A local operator dashboard with mission workflow controls.
- Preflight gating into pending approval or blocked states.
- Human GO/NO-GO start approval in local UI state.
- Threshold-based event generation from mock fleet telemetry.
- Local incident handling actions: continue, delegate, resolve, abort.
- Review-only recommendation staging with local audit response.
- Mapping of SkyTrace event objects into the existing `SystemEvent` shape as a preview.
- Deterministic mission summary generation from local event history.

What is simulated:

- Fleet telemetry, coordinates, alerts, recommendations, map markers, and action audit records.
- Mission lifecycle state, event history, and approvals.
- AI summary labeling in the UI; the current implementation uses deterministic local text generation.

What operational behaviors are real in code:

- Type definitions, event construction, preflight evaluation, threshold evaluation, local duplicate suppression, mission summary text generation, request validation, API JSON responses, and System Event preview mapping.

What integrations are placeholders:

- System Event persistence, Airtable writes, n8n handoffs, Telegram alerts, dashboard sync, Supabase runtime repository reads/writes, websocket telemetry, and production command dispatch.

System Capital infrastructure dependencies:

- Next.js App Router for UI and API routes.
- System Capital `SystemEvent` type shape for event adapter previews.
- Existing repo conventions for automation scripts and optional Supabase demo seeding.

The document now reflects SkyTrace as an implementation-backed MVP spec: useful for demoing workflow logic, event taxonomy, and System Capital OS layering, while explicitly excluding production readiness, live control, live telemetry, autonomous execution, and external dispatch.
