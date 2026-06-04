# SkyTrace Telegram Alert Workflow

This is the first sellable SkyTrace automation path:

```text
SkyTrace UI
  -> POST /api/skytrace/events
  -> Supabase public.skytrace_events
  -> n8n Postgres Trigger on INSERT
  -> eligibility guard
  -> Telegram alert
  -> delivery status log/output
```

The workflow does not change the SkyTrace UI, mission workflow logic, or Supabase persistence layer. It adds an n8n automation that reacts after a row already exists in `public.skytrace_events`.

## Exact Architecture

Source table:

```text
public.skytrace_events
```

Trigger:

```text
n8n Postgres Trigger
Event: INSERT
Schema: public
Table: skytrace_events
```

n8n creates the database trigger/procedure when the workflow is activated and removes it when the workflow is deactivated. The Postgres credential used by n8n must be able to create and execute the trigger/procedure on `public.skytrace_events`.

Eligibility:

```text
requires_approval = true
OR severity = critical
```

Delivery:

```text
Telegram node
Chat: SKYTRACE_ALERT_CHAT_ID, with LEAD_ALERT_CHAT_ID fallback
```

Operational logging:

```text
n8n execution output
console marker: [SKYTRACE_TELEGRAM_DELIVERY]
console marker for ignored rows: [SKYTRACE_TELEGRAM_SKIPPED]
```

## Files

Canonical workflow:

```text
automation/n8n/workflows/skytrace-telegram-alert.workflow.json
```

Setup runbook:

```text
integrations/n8n/skytrace-telegram-alert.md
```

Validation:

```text
automation/scripts/validate-n8n-workflows.mjs
```

## n8n Workflow Design

Workflow name:

```text
SC - SkyTrace Telegram Alert
```

Node sequence:

1. `SkyTrace Event Inserted`
   - Type: Postgres Trigger
   - Watches `public.skytrace_events`
   - Fires on `INSERT`
2. `Read Inserted Row`
   - Normalizes `requires_approval`
   - Normalizes `severity`
   - Adds `skytrace_alert_eligible`
3. `Requires Approval Or Critical?`
   - Sends only actionable events to Telegram
   - Skips non-actionable events with a delivery status of `skipped`
4. `Format Operational Alert`
   - Builds a plain-text operations message
   - Includes mission, event, severity, status, source, timestamp, event id, and payload context when present
5. `Send SkyTrace Telegram Alert`
   - Sends the formatted alert to Telegram
   - Uses `continueOnFail` so delivery failures still produce a status record
6. `Log Notification Delivery Result`
   - Logs `[SKYTRACE_TELEGRAM_DELIVERY]`
   - Returns `sent` or `failed`
7. `Return Delivery Status`
   - Emits the final delivery status object for execution review

## Required Environment Variables

Set these in the n8n environment or instance variables before activation:

```bash
SKYTRACE_ALERT_CHAT_ID=<telegram-chat-id-for-skytrace-alerts>
```

Optional fallback already used by the lead workflow:

```bash
LEAD_ALERT_CHAT_ID=<existing-system-capital-alert-chat-id>
```

Recommended n8n Postgres credential inputs:

```bash
SUPABASE_DB_HOST=db.<project-ref>.supabase.co
SUPABASE_DB_PORT=5432
SUPABASE_DB_NAME=postgres
SUPABASE_DB_USER=<postgres-or-dedicated-listener-user>
SUPABASE_DB_PASSWORD=<database-password>
```

The Telegram credential should reuse the existing System Capital Telegram bot where possible. If a separate SkyTrace bot is needed, create a new n8n Telegram credential and select it in the Telegram node after import.

## Credential Permissions

The Postgres Trigger node needs more than read access. The n8n Postgres credential must have:

```text
CONNECT on the database
USAGE on schema public
SELECT on public.skytrace_events
TRIGGER on public.skytrace_events
CREATE on schema public
```

Using the primary Supabase database user is the fastest production smoke-test path. A dedicated listener role is safer for long-term operation, but this PR intentionally does not add or migrate database roles.

## Import Procedure

1. Open n8n.
2. Import `automation/n8n/workflows/skytrace-telegram-alert.workflow.json`.
3. Open `SkyTrace Event Inserted`.
4. Attach the Supabase Postgres credential.
5. Open `Send SkyTrace Telegram Alert`.
6. Attach the existing Telegram credential.
7. Confirm `SKYTRACE_ALERT_CHAT_ID` is set, or confirm `LEAD_ALERT_CHAT_ID` should be used as fallback.
8. Execute a manual test with the workflow inactive first.
9. Activate the workflow after the test passes.

## Test Procedure

### 1. Validate the workflow JSON

```bash
npm run validate:n8n-workflows
```

Expected:

```text
Validated 3 n8n workflow JSON file(s) with no duplicate keys.
```

### 2. Import and bind credentials

Import the workflow into n8n, then connect:

```text
System Capital Supabase Postgres
Telegram account
```

### 3. Test a qualifying insert

Insert or generate a SkyTrace row with either:

```text
requires_approval = true
```

or:

```text
severity = critical
```

Expected n8n path:

```text
SkyTrace Event Inserted
-> Read Inserted Row
-> Requires Approval Or Critical?
-> Format Operational Alert
-> Send SkyTrace Telegram Alert
-> Log Notification Delivery Result
-> Return Delivery Status
```

Expected final output:

```json
{
  "ok": true,
  "delivery_status": "sent",
  "channel": "telegram"
}
```

### 4. Test a non-actionable insert

Insert or generate a SkyTrace row with:

```text
requires_approval = false
severity = info
```

Expected final output:

```json
{
  "ok": true,
  "delivery_status": "skipped"
}
```

### 5. Confirm production behavior

Run SkyTrace `Run preflight` from production. For preflight rows that require approval, confirm:

```text
public.skytrace_events row appears
n8n execution starts
Telegram receives the alert
Return Delivery Status reports sent
```

## Rollback

Deactivate the n8n workflow. The Postgres Trigger node removes its database trigger/procedure when deactivated.

No application rollback is required because this workflow does not modify SkyTrace UI, mission logic, or persistence code.
