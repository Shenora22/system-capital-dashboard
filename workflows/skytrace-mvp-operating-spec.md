# SkyTrace MVP Operating Spec

## Executive Summary — PARTIALLY IMPLEMENTED

SkyTrace is a drone operational workflow module layered onto System Capital OS. It is implemented as a focused mission-control page at `/drone`, with a friendly `/skytrace` alias that redirects to `/drone`, and a main System Capital dashboard card that links into the module.

SkyTrace currently demonstrates a local/demo workflow for:

- mock fleet visibility,
- local preflight checklist evaluation,
- operator GO / NO-GO approval,
- simulated mission lifecycle state,
- local threshold evaluation against mock telemetry fields,
- local incident review actions,
- local event log generation,
- preview mapping from SkyTrace events into the shared System Events shape,
- persisted `POST /api/skytrace/events` records when Supabase server persistence and the `skytrace_events` table are configured.

Integrity warnings:

- SkyTrace is **not** a standalone platform.
- SkyTrace is **not** a live autonomous flight system.
- SkyTrace is **not** a production telemetry system.
- SkyTrace is **not** a real drone command pipeline.
- SkyTrace is **not** a defense, weapons, or military operations product.
- SkyTrace must not be described as production-ready until persistence, authentication, live telemetry ingestion, audit controls, and command-safety boundaries are implemented and reviewed.

## Current Architecture — PARTIALLY IMPLEMENTED

SkyTrace is composed of a Next.js UI route, local workflow helpers, mock mission data, local API routes, and a SystemEvent adapter preview.

```text
System Capital Dashboard (/dashboard)
  └─ SkyTrace module card → /drone

SkyTrace UI (/drone)
  ├─ reads mock fleet snapshot from /api/drone/fleet
  ├─ stages review-only recommendation actions through /api/drone/actions
  ├─ runs local workflow helpers in lib/skytrace-workflow.ts
  └─ stores mission state and SkyTrace events in React component state only

SkyTrace API preview routes (/api/skytrace/*)
  ├─ validate local JSON payloads
  ├─ emit local SkyTrace event objects
  ├─ persist /api/skytrace/events records through Supabase when configured
  └─ preview SystemEvent mapping without webhook dispatch
```

Status of major architectural areas:

| Area | Status | Verified behavior |
| --- | --- | --- |
| Main dashboard discoverability | IMPLEMENTED | Dashboard navigation and module card link to `/drone`. |
| Dedicated SkyTrace UI route | IMPLEMENTED | `/drone` renders the mission-control page. |
| Friendly route alias | IMPLEMENTED | `/skytrace` redirects to `/drone`; `/drone` remains canonical. |
| Fleet data source | MOCKED/LOCAL ONLY | `/api/drone/fleet` returns `getDroneMissionSnapshot()` backed by local fixtures. |
| Mission workflow engine | PARTIALLY IMPLEMENTED | Local TypeScript helpers and UI handlers model preflight, approval, active mission, incident handling, abort, close, and summary generation. |
| System Events integration | PARTIALLY IMPLEMENTED | SkyTrace events can be mapped into `SystemEvent`; `/api/skytrace/events` persists the normalized SkyTrace event plus SystemEvent preview when Supabase is configured. |
| Live telemetry ingestion | NOT IMPLEMENTED | No streaming, device, websocket, MQTT, vendor API, or database telemetry ingestion exists. |
| Live command dispatch | NOT IMPLEMENTED | Action APIs stage review records only and explicitly do not send drone commands. |
| Production persistence | PARTIALLY IMPLEMENTED | `POST /api/skytrace/events` writes to `skytrace_events`; UI events, logs, preflight, approval, and fleet APIs remain local/stateless. |

## Implemented Components — PARTIALLY IMPLEMENTED

### UI dashboard module — IMPLEMENTED

- `/dashboard` includes a SkyTrace navigation item and module card titled `SkyTrace Mission Control`.
- The card links to `/drone` and uses the status metric `Mission workflow live`.
- This makes SkyTrace discoverable as a vertical product module inside System Capital OS without making it a disconnected app.

### Dedicated mission-control page — IMPLEMENTED

- `/drone` renders the SkyTrace mission-control page.
- The page displays mission workflow controls, preflight checks, fleet telemetry fields, alerts, tactical map UI, recommendations, action logs, and event/report panels.
- The page calls `/api/drone/fleet` once on load, then uses local state for workflow events and mission lifecycle state.

### Friendly alias — IMPLEMENTED

- `/skytrace` redirects to `/drone`.
- `/drone` remains the canonical route for the current MVP.

### Workflow helpers — PARTIALLY IMPLEMENTED

`lib/skytrace-workflow.ts` implements:

- shared SkyTrace event, severity, source, status, phase, lifecycle, and approval-state TypeScript unions,
- `createSkyTraceEvent()`,
- `runPreflightChecklist()`,
- `evaluateTelemetryThresholds()`,
- `generateMissionSummary()`.

These helpers are deterministic except for fallback event IDs that include `Math.random()` when no explicit `eventId` is supplied.

### Mock mission data — MOCKED/LOCAL ONLY

`lib/drone-mission.ts` implements:

- local drone, alert, recommendation, and automation action types,
- `mockFleet`,
- `mockAlerts`,
- review-only `automationActions`,
- `buildDroneRecommendations()`,
- `getDroneMissionSnapshot()`.

### API routes — PARTIALLY IMPLEMENTED

Implemented local Next.js API routes:

- `GET /api/drone/fleet`
- `POST /api/drone/actions`
- `POST /api/skytrace/preflight/submit`
- `POST /api/skytrace/approval/respond`
- `POST /api/skytrace/events`

These routes validate or normalize local JSON and return local responses. They do not persist, authenticate, queue, retry, dispatch commands, or call production n8n workflows.

## Workflow Lifecycle — PARTIALLY IMPLEMENTED

### Verified state values

The workflow code defines these state unions:

| State group | Values | Status |
| --- | --- | --- |
| `MissionPhase` | `PRE_MISSION`, `ACTIVE_MISSION`, `POST_MISSION` | IMPLEMENTED in UI state and workflow types. |
| `MissionLifecycleStatus` | `PREFLIGHT`, `PENDING_APPROVAL`, `ACTIVE`, `ABORTED`, `CLOSED`, `BLOCKED` | IMPLEMENTED in UI state and workflow types. |
| `ApprovalState` | `PENDING_APPROVAL`, `APPROVED`, `DENIED`, `EXECUTED`, `BLOCKED`, `ESCALATED` | IMPLEMENTED in UI state and workflow types. |
| API mission status | `PENDING_APPROVAL`, `BLOCKED`, `STARTED`, `DENIED` | IMPLEMENTED in API helper return types. |

### Verified UI lifecycle transitions

| Trigger | From observed state | To observed state | Events emitted | Status |
| --- | --- | --- | --- | --- |
| Initial render | none | phase `PRE_MISSION`, lifecycle `PREFLIGHT`, approval `PENDING_APPROVAL` | initial action log only | IMPLEMENTED |
| `Run preflight` with all checks passed | `PREFLIGHT` | lifecycle `PENDING_APPROVAL`, approval `PENDING_APPROVAL` | `preflight_check`, `approval_requested` | IMPLEMENTED |
| `Run preflight` with a failed check | `PREFLIGHT` | lifecycle `BLOCKED`, approval `BLOCKED` | `preflight_check` | IMPLEMENTED |
| `Toggle preflight fail` | any local preflight state | lifecycle reset to `PREFLIGHT`, approval reset to `PENDING_APPROVAL` | no SkyTrace event | IMPLEMENTED |
| `Approve GO` | not `BLOCKED`; button disabled unless lifecycle is `PENDING_APPROVAL` | phase `ACTIVE_MISSION`, lifecycle `ACTIVE`, approval `APPROVED` | `approval_granted`, `mission_start` | IMPLEMENTED |
| `Deny NO-GO` | any UI state where button is usable | lifecycle `BLOCKED`, approval `DENIED` | `approval_denied` | IMPLEMENTED |
| Active telemetry interval | phase `ACTIVE_MISSION` and lifecycle `ACTIVE` | state unchanged unless threshold events are added | threshold-generated events | IMPLEMENTED with mock fleet data |
| `Continue incident` | open critical event exists; button disabled otherwise | approval `EXECUTED` | `approval_granted` | IMPLEMENTED |
| `Delegate` | open critical event exists; button disabled otherwise | approval `ESCALATED` | `operator_override` | IMPLEMENTED |
| `Abort mission` | button disabled unless phase is `ACTIVE_MISSION` | phase `POST_MISSION`, lifecycle `ABORTED`, approval `ESCALATED` | `operator_override`, `mission_end` | IMPLEMENTED |
| `Resolve incident` | open critical event exists; button disabled otherwise | approval `EXECUTED`; open critical events marked resolved | `incident_resolved` | IMPLEMENTED |
| `Close + summarize` | UI action | phase `POST_MISSION`, lifecycle `CLOSED`, approval `EXECUTED` | `mission_end`, `ai_summary_generated` | IMPLEMENTED |

### Approval-required paths

Approval is represented locally through event fields and UI state only.

- Passed preflight requires operator approval before mission start.
- Critical battery threshold events require approval and emit a paired `approval_requested` event.
- No-ping incidents require approval and emit a paired `approval_requested` event.
- Geofence breaches require approval and emit a paired `approval_requested` event.
- Warning-level signal, battery, speed, and duration events do not require approval.

### Incident escalation behavior

- Critical telemetry events remain open unless resolved through the UI.
- `Continue incident` records an operator `approval_granted` event but does not change mission phase or send commands.
- `Delegate` records an `operator_override` event with status `escalated`.
- `Abort mission` records an `operator_override` and a `mission_end`, moves the UI to `POST_MISSION`, and marks lifecycle `ABORTED`.
- `Resolve incident` marks existing open critical events as `resolved` in local state and emits an `incident_resolved` event.

### Mission summary generation

`generateMissionSummary()` creates a local text summary from current local events. It counts:

- total events,
- critical events,
- warning events,
- `approval_granted` events,
- resolved or `incident_resolved` events.

The generated summary explicitly states that all actions remained simulated and no live drone commands were sent.

## Event System — PARTIALLY IMPLEMENTED

### SkyTrace event envelope

All SkyTrace events use this implemented envelope:

| Field | Status | Notes |
| --- | --- | --- |
| `eventId` | IMPLEMENTED | Explicit IDs are used in many UI/API paths; fallback IDs include mission, type, timestamp, and random suffix. |
| `missionId` | IMPLEMENTED | Required for all events. |
| `timestamp` | IMPLEMENTED | ISO timestamps are validated in API paths when supplied. |
| `source` | IMPLEMENTED | `telemetry`, `operator`, `system`, or `ai`. |
| `type` | IMPLEMENTED | Union of verified SkyTrace event types listed below. |
| `severity` | IMPLEMENTED | `info`, `warn`, or `critical`. |
| `payload` | IMPLEMENTED | Free-form object; field-level payload schemas are not enforced beyond object validation in the local events API. |
| `status` | IMPLEMENTED | `open`, `acknowledged`, `resolved`, or `escalated`. |
| `requiresApproval` | IMPLEMENTED | Boolean flag; local/UI only. |
| `approvedBy` | PARTIALLY IMPLEMENTED | Optional local metadata. |
| `approvedAt` | PARTIALLY IMPLEMENTED | Optional local metadata. |

### SystemEvent mapping behavior

`mapSkyTraceEventToSystemEvent()` converts a SkyTrace event into the shared `SystemEvent` shape:

- `id` = SkyTrace `eventId`
- `eventType` = SkyTrace `type`
- `workflowName` = `SkyTrace Mission Readiness`
- `workflowKey` = `SKYTRACE:<missionId>`
- `status` = mapped from SkyTrace status/severity
- `priority` = mapped from SkyTrace severity/approval requirement
- `timestamp` = SkyTrace `timestamp`
- `sourceSystem` = `SkyTrace <source>`
- `notes` = `payload.message`, `payload.summary`, or fallback text
- `errorMessage` = notes only when severity is `critical`
- `aiSummary` = `payload.summary` when present

SystemEvent mapping status: **PARTIALLY IMPLEMENTED**. The adapter returns a preview object; no shared ledger write is implemented for SkyTrace.

### Verified event taxonomy

| Event type | Status | Emitted by verified code | Typical severity | Source | Approval requirement | Verified payload shape | SystemEvent mapping |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `preflight_check` | IMPLEMENTED | `runPreflightChecklist()` and `/drone` `Run preflight` | `info` on pass, `critical` on fail | `system` | pass: `true`; fail: `false` | `{ checklist, failedItems, message }` | maps type/status/priority; critical failures set `errorMessage`. |
| `mission_start` | IMPLEMENTED | `/drone` `Approve GO` | `info` | `system` | `false` | `{ message }` plus approval metadata on event | maps as normal SystemEvent. |
| `mission_end` | IMPLEMENTED | `/drone` abort and close flows | `warn` on abort, `info` on close | `system` | `false` | `{ outcome, message }` | maps warning abort to High priority; close to Normal. |
| `telemetry_anomaly` | IMPLEMENTED | threshold evaluator for speed and mission duration | `warn` | `telemetry` for speed, `system` for duration | `false` | speed: `{ droneId, droneName, zone, operator, speedMph, message }`; duration: `{ minutesElapsed, limitMinutes, message }` | maps to `Warning`/`High`. |
| `geofence_breach` | IMPLEMENTED | threshold evaluator when `geofenceStatus === "breached"` | `critical` | `telemetry` | `true` | `{ droneId, droneName, zone, operator, latitude, longitude, message }` | maps to `Failed`/`Critical` with `errorMessage`. |
| `battery_warning` | IMPLEMENTED | threshold evaluator for battery under 20% or 10% | `warn` or `critical` | `telemetry` | critical under 10%: `true`; warn under 20%: `false` | `{ droneId, droneName, zone, operator, batteryPct, message }` | maps warn to `Warning`/`High`; critical to `Failed`/`Critical`. |
| `signal_loss` | IMPLEMENTED | threshold evaluator when RSSI is below `-85` dBm | `warn` | `telemetry` | `false` | `{ droneId, droneName, zone, operator, rssiDbm, message }` | maps to `Warning`/`High`. |
| `operator_override` | IMPLEMENTED | `/drone` delegate and abort flows | `warn` or `critical` | `operator` | `false` | delegate: `{ action, openCriticalEvents, message }`; abort: `{ action, message }` | escalated or critical events map to `Failed`; warning escalations map to `Failed` because status is `escalated`. |
| `incident_opened` | IMPLEMENTED | threshold evaluator when no ping is greater than 5 seconds | `critical` | `telemetry` | `true` | `{ droneId, droneName, zone, operator, secondsSincePing, trigger, message }` | maps to `Failed`/`Critical` with `errorMessage`. |
| `incident_resolved` | IMPLEMENTED | `/drone` `Resolve incident` | `info` | `operator` | `false` | `{ resolvedEvents, message }` | maps to `Success`/`Normal`. |
| `ai_summary_generated` | IMPLEMENTED | `/drone` `Close + summarize` | `info` | `ai` | `false` | `{ summary }` | maps `summary` into `notes` and `aiSummary`. |
| `approval_requested` | IMPLEMENTED | preflight pass and threshold critical paths | `info` in UI preflight, `critical` in threshold helper | `system` | `true` | preflight: `{ action, message }`; threshold: `{ droneId, droneName, zone, operator, approvalFor, message }` | maps info approval requests to High priority because approval is required; critical requests map to Failed/Critical. |
| `approval_granted` | IMPLEMENTED | `/drone` mission start and continue flows | `info` | `operator` | `false` | `{ action, decision?, openCriticalEvents?, message }` | maps to Success/Normal. |
| `approval_denied` | IMPLEMENTED | `/drone` NO-GO flow | `critical` | `operator` | `false` | `{ action, decision, message }` | maps to Failed/Critical with `errorMessage`. |
| `skytrace.mission.preflight_started` | IMPLEMENTED | `POST /api/skytrace/preflight/submit` helper | `info` | `system` | `false` | `{ eventName, label, droneId, operatorId, missionProfile, message }` | maps as normal SystemEvent. |
| `skytrace.mission.preflight_completed` | IMPLEMENTED | `POST /api/skytrace/preflight/submit` helper | `info` or `critical` | `system` | `false` | `{ eventName, label, droneId, operatorId, missionProfile, checks, blockerCount, message }` | maps critical blocked completion to Failed/Critical. |
| `skytrace.mission.preflight_failed` | IMPLEMENTED | blocked `POST /api/skytrace/preflight/submit` helper path | `critical` | `system` | `false` | `{ eventName, label, droneId, operatorId, missionProfile, blockers, message }` | maps to Failed/Critical. |
| `skytrace.mission.approval_requested` | IMPLEMENTED | pass `POST /api/skytrace/preflight/submit` helper path | `info` | `system` | `true` | `{ eventName, label, droneId, operatorId, missionProfile, approvalId, message }` | maps to High priority due to approval requirement. |
| `skytrace.mission.started` | IMPLEMENTED | approved `POST /api/skytrace/approval/respond` helper path | `info` | `system` | `false` | `{ eventName, label, approvalId, approvedBy, approvedAt, message }` | maps to Success/Normal. |
| `skytrace.mission.denied` | IMPLEMENTED | denied `POST /api/skytrace/approval/respond` helper path | `critical` | `system` | `false` | `{ eventName, label, approvalId, deniedBy, deniedAt, reason, message }` | maps to Failed/Critical. |

## Telemetry Logic — MOCKED/LOCAL ONLY

Telemetry ingestion is **NOT IMPLEMENTED**. The current threshold evaluator reads static/mock fleet objects from local state.

Implemented threshold rules:

| Rule | Emitted event | Severity | Approval | Status |
| --- | --- | --- | --- | --- |
| `batteryPct < 10` | `battery_warning` plus `approval_requested` | `critical` | `true` | IMPLEMENTED |
| `batteryPct < 20` and not below 10 | `battery_warning` | `warn` | `false` | IMPLEMENTED |
| RSSI below `-85` dBm | `signal_loss` | `warn` | `false` | IMPLEMENTED |
| last ping older than 5 seconds | `incident_opened` plus `approval_requested` | `critical` | `true` | IMPLEMENTED |
| `geofenceStatus === "breached"` | `geofence_breach` plus `approval_requested` | `critical` | `true` | IMPLEMENTED |
| `speedMph > 32` | `telemetry_anomaly` | `warn` | `false` | IMPLEMENTED |
| active mission duration exceeds configured limit | `telemetry_anomaly` | `warn` | `false` | IMPLEMENTED |

Runtime behavior:

- The UI evaluates thresholds every 2.2 seconds only when phase is `ACTIVE_MISSION` and lifecycle status is `ACTIVE`.
- Duplicate event IDs are filtered against the current in-memory event list.
- The fleet data remains the same mock snapshot unless the page is reloaded or API code changes.

## Approval Engine — PARTIALLY IMPLEMENTED

The approval engine is local and review-only.

Implemented:

- Preflight pass creates a pending approval state.
- Operator GO creates `approval_granted` and `mission_start` events and starts the simulated mission.
- Operator NO-GO creates `approval_denied` and blocks mission start.
- Critical incident controls can continue, delegate, abort, or resolve local incident records.
- API helper `respondToSkyTraceApproval()` accepts `approved` or `denied` decisions and emits local events.

Not implemented:

- Authentication of approver identity.
- Role-based approval policy.
- Persistent approval records.
- Idempotency keys.
- External operator callback integration.
- Real command unlock or dispatch after approval.

## API Layer — PARTIALLY IMPLEMENTED

### `GET /api/drone/fleet` — MOCKED/LOCAL ONLY

Returns `getDroneMissionSnapshot(new Date().toISOString())` from local mock data.

### `POST /api/drone/actions` — MOCKED/LOCAL ONLY

Accepts a local `droneId`, `action`, and optional `recommendationId`. If valid, returns `status: "staged_for_review"` and an audit object. The response message explicitly says no live command was sent.

### `POST /api/skytrace/preflight/submit` — PARTIALLY IMPLEMENTED

Validates a payload containing `missionId`, `droneId`, `operatorId`, `missionProfile`, and non-empty checklist `checks`. It returns:

- `PENDING_APPROVAL` with `approvalId` when all checks pass,
- `BLOCKED` with blockers when any check is failed or blocked,
- local SkyTrace events for the preflight path.

### `POST /api/skytrace/approval/respond` — PARTIALLY IMPLEMENTED

Validates approval response payloads and returns local events for:

- approved → `STARTED` and `skytrace.mission.started`,
- denied → `DENIED` and `skytrace.mission.denied`.

### `POST /api/skytrace/events` — PARTIALLY IMPLEMENTED

Validates a local SkyTrace event request, normalizes it into a SkyTrace event, maps it to a `systemEventPreview`, and persists the normalized event through Supabase into `skytrace_events` when server persistence is configured.

Required minimal table contract:

```sql
create table if not exists skytrace_events (
  event_id text primary key,
  mission_id text not null,
  event_type text not null,
  source text not null,
  severity text not null,
  status text not null,
  requires_approval boolean not null default false,
  approved_by text,
  approved_at timestamptz,
  event_timestamp timestamptz not null,
  payload jsonb not null,
  system_event_preview jsonb not null,
  created_at timestamptz not null default now()
);

alter table skytrace_events enable row level security;

create index if not exists skytrace_events_mission_time_idx
  on skytrace_events (mission_id, event_timestamp desc);
```

The route requires `SKYTRACE_INGEST_API_KEY`; callers must send the same value in the `x-skytrace-api-key` header before validation or persistence runs. It also uses `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`, following the existing server-side Supabase seed pattern. If Supabase env vars or the table are missing, validation still runs after ingest authorization and the route returns a persistence-specific error instead of claiming success.

RLS is enabled on `skytrace_events`; no broad public policies are defined. Service-role writes remain available through the server route. This is still not live telemetry ingestion: it only persists explicitly posted SkyTrace event payloads.

## Architecture Flow Diagrams — PARTIALLY IMPLEMENTED

### A. Operator UI → Workflow Engine → Event Adapter → System Events

```text
Operator UI (/drone)
  → local UI handlers
  → lib/skytrace-workflow.ts helpers
  → SkyTraceEvent objects in React state
  → lib/skytrace-api.ts mapSkyTraceEventToSystemEvent()
  → SystemEvent preview object
  → NOT IMPLEMENTED: shared ledger persistence / production n8n write
```

### B. Telemetry Feed → Threshold Evaluator → SkyTrace Event → UI Alert

```text
Mock fleet snapshot (/api/drone/fleet)
  → React state snapshot.fleet
  → evaluateTelemetryThresholds(snapshot.fleet, options)
  → SkyTraceEvent[]
  → in-memory event timeline/report panel
  → NOT IMPLEMENTED: live telemetry source, streaming alerts, durable alert store
```

### C. Approval Flow → Preflight → Approval Request → Mission Start → Incident Handling → Mission Summary

```text
Run preflight
  → runPreflightChecklist()
  → pass: PENDING_APPROVAL + approval_requested
  → fail: BLOCKED + critical preflight_check

Operator GO
  → approval_granted
  → mission_start
  → ACTIVE_MISSION threshold loop

Critical threshold event
  → incident/breach/battery event
  → approval_requested
  → operator chooses continue, delegate, abort, or resolve

Close mission
  → mission_end
  → generateMissionSummary()
  → ai_summary_generated local event
```

## Demo Constraints — MOCKED/LOCAL ONLY

SkyTrace MVP is demo/local only.

Hard constraints:

- No real drone control is implemented.
- No live telemetry ingestion is implemented.
- Only `POST /api/skytrace/events` persistence is implemented; UI mission state, preflight responses, approvals, fleet data, and action logs remain local/stateless.
- No real-world dispatch is implemented.
- No external command execution is implemented.
- No production n8n/webhook behavior is changed by SkyTrace.
- Local/mock APIs only.
- Fleet data is simulated through local fixtures.
- Recommendations are review/staging records only.
- Approval actions alter local UI/API event state only.
- System Events integration is an adapter preview only; no shared ledger write is implemented.

## What Is Intentionally Not Built — NOT IMPLEMENTED

The following are intentionally not built in the current MVP:

- authentication,
- multi-tenant isolation,
- production command pipeline,
- live n8n orchestration,
- persistence guarantees,
- fleet management backend,
- FAA/compliance engine,
- real-time websocket infrastructure,
- role-based access control,
- real telemetry device adapters,
- vendor drone SDK integration,
- durable audit store,
- queue/retry handling,
- incident assignment workflow,
- operator notification delivery.

## Known Technical Debt — PARTIALLY IMPLEMENTED

Observed technical debt from the current codebase:

- UI workflow state is stored in React component state only; there is no persistence layer.
- The mission-control UI is tightly coupled to mock fleet APIs and local helper functions.
- Event payloads are free-form objects; only the envelope is validated in the local events API.
- API validation is hand-written; there is no shared JSON Schema, OpenAPI contract, or runtime schema library.
- There is no authentication or authorization boundary around SkyTrace UI/API routes.
- There are no idempotency guarantees for API submissions or UI events.
- Fallback event IDs can include `Math.random()`, which complicates deterministic replay.
- Duplicate prevention is local to the UI event list and based on event IDs only.
- There is no queue, retry, dead-letter, or outbox mechanism.
- There are no dedicated integration tests for SkyTrace workflows or API routes.
- Demo telemetry, mission workflow, and UI rendering are mixed in one large client component.
- The local API routes are stateless and do not enforce lifecycle transition rules across requests.

## Immediate Priorities — PLANNED

These priorities are not implemented yet and should remain planned until code exists:

1. Add dedicated tests for `runPreflightChecklist()`, `evaluateTelemetryThresholds()`, `generateMissionSummary()`, and SkyTrace API validation helpers.
2. Split the `/drone` client component into smaller workflow, event-log, fleet, and map components without changing behavior.
3. Define a durable SkyTrace event storage contract before adding persistence.
4. Add explicit idempotency keys for API-driven preflight, approval, and event submission flows.
5. Add authentication and role checks before any non-demo environment is considered.
6. Add a formal JSON schema or runtime schema validator for SkyTrace event payloads.
7. Keep any future n8n integration behind a manually reviewed, non-production path until System Events logging is approved.

## Future Integration Points — PLANNED

Future integrations are placeholders only:

- System Events write path for persisting mapped SkyTrace events.
- Reviewed n8n handoff for operator notifications and dashboard sync.
- Durable event/audit database.
- Real telemetry adapter behind a controlled ingestion boundary.
- Operator identity and role policy.
- Incident assignment and resolution workflow.
- Long-running mission replay/report export.

None of these are implemented in the current MVP.

## Current File Structure — IMPLEMENTED

Verified SkyTrace-related files in this repo:

```text
app/
  dashboard/page.tsx                         # main dashboard route using SystemCapitalDashboard
  drone/page.tsx                             # SkyTrace mission-control UI
  skytrace/page.tsx                          # alias redirect to /drone
  api/
    drone/
      actions/route.ts                       # review-only action staging API
      fleet/route.ts                         # mock fleet snapshot API
    skytrace/
      approval/respond/route.ts              # local approval response API
      events/route.ts                        # local event normalization + SystemEvent preview API
      preflight/submit/route.ts              # local preflight submission API

dashboard/
  components/SystemCapitalDashboard.tsx      # main dashboard nav/card includes SkyTrace module

lib/
  drone-mission.ts                           # mock fleet, alerts, recommendations, snapshot builder
  skytrace-api.ts                            # local SkyTrace API validators, event helpers, SystemEvent adapter
  skytrace-workflow.ts                       # workflow state types, preflight, threshold evaluator, summary helper
  system-events.ts                           # shared SystemEvent type and lead-intake fixtures/helpers

automation/
  scripts/seed-skytrace.mjs                  # Supabase seed utility for demo drone rows; not used by /drone runtime
```

## SkyTrace MVP Current State

SkyTrace MVP successfully demonstrates:

- a System Capital OS product module entry point from the main dashboard,
- a focused `/drone` mission-control UI,
- local preflight checklist evaluation,
- human GO / NO-GO approval flow,
- simulated mission activation and closure,
- local threshold evaluation against mock fleet fields,
- local critical incident handling controls,
- local event timeline generation,
- a local mission summary,
- a preview adapter from SkyTrace events to the shared System Events shape.

What is simulated:

- drone fleet data,
- alert data,
- recommendation data,
- telemetry threshold inputs,
- action staging/audit records,
- approval identity,
- mission event persistence,
- System Events write path.

Operational behaviors that are real in code:

- type-level workflow states,
- local UI state transitions,
- local preflight pass/fail logic,
- local API payload validation,
- local threshold event generation,
- local duplicate filtering by event ID,
- local SystemEvent preview mapping,
- local action staging response with no command dispatch.

Placeholder integrations:

- n8n handoff,
- System Events persistence,
- Airtable or reporting store,
- operator notification delivery,
- live telemetry ingestion,
- real drone command pipeline.

System Capital infrastructure dependencies:

- Next.js App Router routes,
- System Capital dashboard navigation/module card,
- shared `SystemEvent` type from `lib/system-events.ts`,
- local dashboard and API conventions already used in the repo.

Final integrity statement: **SkyTrace is currently an implementation-backed MVP demo module inside System Capital OS. It is not production-ready, not autonomous, not live-connected to drones, and not connected to production command or telemetry infrastructure.**
