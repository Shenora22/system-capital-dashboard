# Tally Lead Capture Production Setup

Use a single reliable production path:

```text
Tally FORM_RESPONSE webhook → Next.js /api/tally-lead → n8n production webhook → Notion CRM / Leads → lead alert → n8n execution log
```

Do **not** rely on Tally's native Notion mapping as the primary CRM path. It can remain disabled or secondary only; the production source of truth is webhook → n8n/API → Notion.

## 1. n8n workflow

Import or update `automation/n8n/workflows/lead-capture-alert-template-v2.json`.

Required production settings:

- Workflow must be **active/published** in n8n.
- Webhook node path must be exactly:

```text
system-capital-lead
```

- The production webhook URL must use `/webhook/`, not `/webhook-test/`:

```text
https://<your-n8n-host>/webhook/system-capital-lead
```

The test URL only works while n8n is actively listening for test events in the editor. It is not reliable for production Tally submissions.

## 2. Next.js API environment

Configure one of these environment options for the dashboard API:

```bash
N8N_LEAD_WEBHOOK_URL=https://<your-n8n-host>/webhook/system-capital-lead
```

or:

```bash
N8N_BASE_URL=https://<your-n8n-host>
```

The API refuses `/webhook-test/` URLs and requires the final path to be `/webhook/system-capital-lead`.

## 3. Notion CRM / Leads

In n8n, configure the `Write Notion CRM Lead` node with:

- A Notion credential that can create pages in the CRM database.
- `NOTION_LEADS_DATABASE_ID` set to the CRM / Leads database ID.
- Database properties matching the workflow fields:
  - `Name` (title)
  - `Email` (email)
  - `Business` (text)
  - `Package` (select)
  - `Source` (select)
  - `Status` (select)
  - `Received At` (date)
  - `Lead ID` (text)
  - `Tally Response ID` (text)

## 4. Lead alert

Configure the `Send Lead Alert` node with Telegram credentials and set:

```bash
LEAD_ALERT_CHAT_ID=<your-chat-id>
```

If a different alert channel is preferred, replace this node while keeping it after `Write Notion CRM Lead` and before `Respond Success`.

## 5. Exact URL to put in Tally

Point the Tally webhook to the deployed dashboard API, not directly to Notion:

```text
https://<your-dashboard-domain>/api/tally-lead
```

Tally should send `FORM_RESPONSE` payloads. The API and n8n workflow normalize these fields:

- `name`
- `email`
- `business`
- `package`
- `source`

## 6. Smoke test

With the Next.js app running locally, run:

```bash
npm run test:tally-lead
```

Equivalent curl dry-run test:

```bash
curl -i -X POST 'http://localhost:3000/api/tally-lead?dryRun=1' \
  -H 'Content-Type: application/json' \
  -d '{
    "eventType": "FORM_RESPONSE",
    "data": {
      "formId": "system-capital-intake",
      "formName": "System Capital Lead Capture",
      "responseId": "manual-test-001",
      "fields": [
        { "key": "name", "label": "Name", "value": "Test Lead" },
        { "key": "email", "label": "Email", "value": "test.lead@example.com" },
        { "key": "business", "label": "Business", "value": "Example Co" },
        { "key": "package", "label": "Select Package", "value": "Pro" },
        { "key": "source", "label": "Source", "value": "Tally smoke test" }
      ]
    }
  }'
```

Expected response:

```json
{
  "success": true,
  "message": "Lead captured successfully"
}
```

Remove `?dryRun=1` only when `N8N_LEAD_WEBHOOK_URL` or `N8N_BASE_URL` is configured and the n8n workflow is active.
