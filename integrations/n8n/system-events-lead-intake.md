# System Events wiring for SC - Lead Intake CORE

This document prepares the first safe operational loop in System Capital OS:

```text
Lead Intake → System Events → Dashboard / Command Center
```

The integration is intentionally staged. It defines the event contract, n8n node placement, and manual review checklist without changing the production n8n webhook path, writing directly to live Notion during development, changing Stripe behavior, rebuilding the dashboard, or replacing existing routes.

## Scope

Workflow: `SC - Lead Intake CORE`  
Workflow key: `SC CORE`  
Source system: `n8n`  
Destination: Notion `System Events` database after manual review confirms schema and credentials.

## Proposed System Events payload contract

Use this payload for the success event emitted after the Notion CRM lead is created:

```json
{
  "eventType": "Lead Captured",
  "workflowName": "SC - Lead Intake CORE",
  "workflowKey": "SC CORE",
  "status": "Success",
  "priority": "Normal",
  "timestamp": "{{now}}",
  "leadEmail": "{{ $json.email }}",
  "clientName": "{{ $json.name }}",
  "sourceSystem": "n8n",
  "notes": "Lead successfully captured and written to CRM",
  "aiSummary": "New lead captured through the lead intake workflow."
}
```

Supported fields:

| Field | Required | Notes |
| --- | --- | --- |
| `id` | Not from n8n | Created by Notion or dashboard storage layer. |
| `eventType` | Yes | Examples: `Lead Captured`, `Lead Validation Passed`, `Lead Validation Failed`, `CRM Write Success`, `Telegram Alert Sent`, `Workflow Failed`. |
| `workflowName` | Yes | Must be `SC - Lead Intake CORE` for this loop. |
| `workflowKey` | Yes | Must be `SC CORE` for dashboard grouping. |
| `status` | Yes | Recommended Notion options: `Success`, `Failed`, `Warning`, `Pending`. |
| `priority` | Yes | Recommended Notion options: `Low`, `Normal`, `High`, `Critical`. |
| `timestamp` | Yes | Use n8n `{{now}}` or an ISO timestamp. |
| `leadEmail` | Optional | Use when available. Do not fabricate. |
| `clientName` | Optional | Use when available. |
| `sourceSystem` | Yes | Use `n8n`. |
| `notes` | Optional | Human-readable operational detail. |
| `errorMessage` | Failure only | Required for validation, CRM write, or workflow failure branches. |
| `aiSummary` | Optional | One-sentence operator summary for dashboard display. |

## Exact n8n wiring steps

1. Keep the existing production webhook trigger path unchanged.
2. After the current validation step, add a small event payload Set/Edit Fields node named `Build System Event - Validation Passed`.
3. Route that node only from the validation success branch and emit a `Lead Validation Passed` event.
4. On the validation failure branch, add `Build System Event - Validation Failed` with `status: "Failed"`, `priority: "High"`, and an `errorMessage` that names the missing or invalid field.
5. After the existing Notion CRM create/update node succeeds, add `Build System Event - CRM Write Success`.
6. Immediately after the CRM success node, emit the required `Lead Captured` success event using the proposed payload contract above.
7. If the Notion CRM write node fails, route the error branch to `Build System Event - CRM Write Failed` with `eventType: "Workflow Failed"`, `status: "Failed"`, `priority: "Critical"`, and the Notion node error in `errorMessage`.
8. After the existing Telegram alert node succeeds, add `Build System Event - Telegram Alert Sent` with `status: "Success"` and `priority: "Normal"`.
9. Send each built payload into the reviewed System Events write mechanism only after manual review is complete. Preferred production target is a Notion Create Database Page node pointed at the System Events database, not the CRM database.
10. Keep event emission modular by placing each payload builder beside the branch it observes. Do not merge event writes into the core lead transformation logic.
11. Test with one non-production sample payload first and confirm the dashboard can display the event shape before enabling production traffic.

## Event emission map

| Workflow moment | Event type | Status | Priority | Required notes |
| --- | --- | --- | --- | --- |
| Required fields pass validation | `Lead Validation Passed` | `Success` | `Normal` | Include lead email and client name when available. |
| Required fields fail validation | `Lead Validation Failed` | `Failed` | `High` | Include specific validation error in `errorMessage`. |
| Notion CRM lead is created | `CRM Write Success` | `Success` | `Normal` | Include the CRM write result or page id if safe. |
| Lead is fully captured after CRM write | `Lead Captured` | `Success` | `Normal` | Use the proposed payload contract. |
| CRM write fails | `Workflow Failed` | `Failed` | `Critical` | Include Notion error message and stop downstream success notifications. |
| Telegram alert sends | `Telegram Alert Sent` | `Success` | `Normal` | Confirm operator notification was delivered. |
| Any unhandled workflow error occurs | `Workflow Failed` | `Failed` | `Critical` | Include failing node name and error details. |

## Manual review checklist

Before connecting this to live System Events storage, confirm:

- [ ] Notion System Events database schema exists and includes every payload field or an intentional mapping for each field.
- [ ] n8n credentials can access the Notion System Events database.
- [ ] Workflow registry entry exists for `SC - Lead Intake CORE` with workflow key `SC CORE`.
- [ ] Event statuses match Notion select/status options: `Success`, `Failed`, `Warning`, `Pending`.
- [ ] Event priorities match Notion select options: `Low`, `Normal`, `High`, `Critical`.
- [ ] Production n8n webhook path has not changed.
- [ ] CRM database writes still target only the existing CRM database.
- [ ] Stripe nodes, credentials, products, prices, and payment flows remain untouched.
- [ ] Test event uses non-production lead data before any live lead is emitted.

## What should not be touched yet

- Production n8n webhook path or webhook method.
- Live Notion databases until schema, permissions, and event options are manually reviewed.
- Stripe behavior, payment links, products, prices, or checkout routing.
- Dashboard route structure or existing module routes.
- Core lead intake transformation logic beyond adding adjacent event payload builders.
- Any automation outside `SC - Lead Intake CORE`.

## Stabilize before expanding

This loop should prove that one workflow can produce trustworthy, observable System Events. After Lead Intake emits clean events and the dashboard displays them reliably, additional workflows can adopt the same contract.
