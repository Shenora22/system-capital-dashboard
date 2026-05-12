# SC CORE - System Event Logger

System Capital needs a heartbeat before it expands. `SC CORE - System Event Logger` is the planned universal n8n workflow that will receive normalized operational events and later write them into the Notion **System Events** database.

This repository change is intentionally **read-only/demo-safe**:

- No live n8n workflow JSON is changed.
- No Notion API write is added.
- No production webhook path is changed.
- No Stripe payment or retry behavior is added.

## Target architecture

```text
Workflow A → SC CORE - System Event Logger → Notion System Events
```

Every workflow should eventually call one shared logger instead of creating one-off Notion write steps. That keeps event shape, error handling, and future alert routing stable.

## Standard System Event payload schema

| Field | Required | Type | Notes |
| --- | --- | --- | --- |
| `eventType` | Yes | string | Human-readable event category, such as `Lead Captured`, `Workflow Failed`, or `Payment Received`. |
| `workflowName` | Yes | string | Display name of the source workflow. |
| `workflowKey` | Yes | string | Stable slug for joins, filters, and dashboards. |
| `status` | Yes | string | Suggested values: `success`, `failed`, `warning`, `info`, `pending`. |
| `priority` | Yes | string | Suggested values: `low`, `normal`, `high`, `critical`. |
| `timestamp` | Yes | ISO-8601 string | Use the source event time when available; otherwise use the logger receive time. |
| `leadEmail` | No | string or null | Include only when the event is tied to a lead/client. |
| `clientName` | No | string or null | Human-readable lead/client name. |
| `paymentStatus` | No | string or null | Suggested values: `not_applicable`, `pending`, `paid`, `failed`, `refunded`. |
| `errorMessage` | No | string or null | Short operator-facing error label. |
| `errorDetails` | No | string or null | Detailed failure context; avoid secrets or raw credentials. |
| `sourceSystem` | Yes | string | Source platform, such as `n8n`, `Tally`, `Stripe`, or `AI Agent`. |
| `linkedWorkflow` | No | string or null | Usually `SC CORE - System Event Logger` once wired. |
| `notes` | No | string or null | Manual context, review notes, or safe diagnostic detail. |
| `aiSummary` | No | string or null | Optional concise AI/operator summary. |

TypeScript interfaces and demo fixtures live in [`logging/lib/system-events.ts`](./lib/system-events.ts). JSON examples live in [`logging/fixtures/system-events.json`](./fixtures/system-events.json).

## Example n8n call shape

Use an HTTP Request node from the source workflow to call the logger workflow only after manual review. The eventual request body should match the schema above:

```json
{
  "eventType": "Workflow Failed",
  "workflowName": "SC - Lead Intake CORE",
  "workflowKey": "lead-intake-core",
  "status": "failed",
  "priority": "high",
  "timestamp": "{{$now}}",
  "leadEmail": "{{$json.email || null}}",
  "clientName": "{{$json.name || null}}",
  "paymentStatus": "not_applicable",
  "errorMessage": "CRM create page step timed out",
  "errorDetails": "{{$json.errorDetails || null}}",
  "sourceSystem": "n8n",
  "linkedWorkflow": "SC CORE - System Event Logger",
  "notes": "Manual-review logger event. No payment action.",
  "aiSummary": "Lead intake failed and needs operator review."
}
```

## Manual review checklist before enabling writes

- [ ] Confirm the Notion **System Events** database exists and has reviewed properties for every payload field.
- [ ] Confirm no payload field will expose secrets, tokens, raw payment data, or private credentials.
- [ ] Create `SC CORE - System Event Logger` manually in n8n as a new workflow; do not edit live production workflows in place.
- [ ] Use a new logger webhook path, not an existing production lead-capture path.
- [ ] Add validation/normalization inside the logger before any Notion write node.
- [ ] Run the logger manually with the local fixture examples.
- [ ] Confirm Notion writes are correct in a test database or reviewed staging database first.
- [ ] Only after approval, add source workflow HTTP Request nodes one workflow at a time.
- [ ] Keep Stripe events read-only; do not add retry, capture, refund, checkout, or subscription mutation behavior.

## Exact n8n wiring steps for later

These steps are intentionally deferred until Notion schema and the logger workflow are manually reviewed.

### 1. Create the universal logger workflow

1. In n8n, create a new workflow named `SC CORE - System Event Logger`.
2. Add a Webhook Trigger node with a new non-production path reserved for logger intake.
3. Add a Set/Edit Fields node that maps all standard payload fields.
4. Add validation logic that defaults missing optional values to `null` and rejects missing required values.
5. Add a Notion Create Page node targeting the reviewed **System Events** database.
6. Add a Respond to Webhook node returning a small success/failure result.
7. Keep the workflow disabled until fixture tests pass and manual review is complete.

### 2. Wire `SC - Lead Intake CORE` success event

1. Open a duplicate or reviewed edit session for `SC - Lead Intake CORE`.
2. After the final successful lead-intake step, add an HTTP Request node named `Log System Event - Lead Intake Success`.
3. Set method to `POST` and URL to the reviewed logger webhook URL.
4. Send a JSON body with `eventType: "Workflow Success"`, `workflowName: "SC - Lead Intake CORE"`, `workflowKey: "lead-intake-core"`, `status: "success"`, `priority: "normal"`, and safe lead fields.
5. Execute manually with a test lead.
6. Confirm the logger receives the event and Notion creates one System Events row.

### 3. Wire `SC - Lead Intake CORE` failure event

1. Add an Error Trigger or workflow-level failure branch in the reviewed lead-intake workflow.
2. Add an HTTP Request node named `Log System Event - Lead Intake Failure`.
3. Set method to `POST` and URL to the reviewed logger webhook URL.
4. Send `eventType: "Workflow Failed"`, `status: "failed"`, `priority: "high"`, and sanitized error details.
5. Test with a controlled failure, not live customer data.
6. Confirm the failure is visible in the System Events dashboard section.

### 4. Wire Stripe payment success event

1. Use an existing read-only Stripe event source or a reviewed Stripe webhook workflow; do not add payment writes.
2. Add an HTTP Request node named `Log System Event - Payment Received`.
3. Send `eventType: "Payment Received"`, `sourceSystem: "Stripe"`, `paymentStatus: "paid"`, and the safe client/lead reference.
4. Do not include raw card data, secret keys, payment method details, or write/capture/refund actions.
5. Confirm one Notion System Events row appears.

### 5. Wire Stripe payment failure event

1. Use the reviewed read-only Stripe failure event source.
2. Add an HTTP Request node named `Log System Event - Payment Failed`.
3. Send `eventType: "Payment Failed"`, `status: "failed"`, `priority: "high"`, `paymentStatus: "failed"`, and a sanitized decline reason.
4. Do not trigger retries or payment collection from this logger path.
5. Confirm dashboard payment-event and failed-event counts update after the event lands.

### 6. Wire AI agent action event

1. In the reviewed agent workflow, add an HTTP Request node named `Log System Event - Agent Action` after the action completes.
2. Send `eventType: "Agent Action"`, `sourceSystem: "AI Agent"`, `status: "info"`, and an `aiSummary`.
3. Avoid logging sensitive prompts, API keys, private client content, or raw chain-of-thought.
4. Confirm the event appears as a recent event.

## Do not touch yet

- Do not modify live n8n workflow JSON exports.
- Do not modify Notion directly from this scaffold.
- Do not change the production `system-capital-lead` webhook path.
- Do not add Stripe write, retry, capture, refund, checkout, or payment-link mutation behavior.
- Do not wire source workflows until the Notion schema and logger workflow are reviewed.
- Do not expand automation until the heartbeat is stable.
