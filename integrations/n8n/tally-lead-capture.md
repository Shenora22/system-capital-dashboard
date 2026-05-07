# Tally Lead Capture + Payment Flow Production Setup

Use a single reliable production path while keeping Tally as the intake form:

```text
Tally FORM_RESPONSE webhook → Next.js /api/tally-lead → n8n production webhook → Notion CRM / Leads
Tally post-submit redirect → /lead/next-step → Stripe Payment Link or custom booking link
Stripe/n8n confirmation → Notion CRM status/payment status update
```

Do **not** rely on Tally's native Notion mapping as the primary CRM path. It can remain disabled or secondary only; the production source of truth is webhook → n8n/API → Notion.

## 1. Tally intake fields

Keep Tally as the form experience and include these fields in the intake:

- `name`
- `email`
- `business`
- `package`
- `budget`
- `need`
- `source`

Recommended package choices:

- `Starter System` — $49 Stripe Payment Link
- `Pro Follow-Up System` — $149 Stripe Payment Link
- `Custom Build` — booking link

## 2. Post-submit redirect

Configure Tally's thank-you/redirect behavior to send users to the dashboard next-step page after submission:

```text
https://<your-dashboard-domain>/lead/next-step?package=<tally-package-answer>
```

The next-step route reads the package query string and immediately redirects the user to the matching configured Stripe Payment Link or booking URL. If a real URL has not been configured yet, it shows a safe placeholder page and keeps payment status messaging at `Pending`.

## 3. Payment and booking link environment

Set the server-side variables for API/n8n payloads and, if the Next.js page should render clickable public links at build/runtime, set the matching `NEXT_PUBLIC_` variables too:

```bash
STRIPE_PAYMENT_LINK_STARTER=[PASTE STRIPE LINK]
STRIPE_PAYMENT_LINK_PRO=[PASTE STRIPE LINK]
CUSTOM_BUILD_BOOKING_LINK=BOOKING_LINK_PLACEHOLDER_CUSTOM_BUILD

NEXT_PUBLIC_STRIPE_PAYMENT_LINK_STARTER=[PASTE STRIPE LINK]
NEXT_PUBLIC_STRIPE_PAYMENT_LINK_PRO=[PASTE STRIPE LINK]
NEXT_PUBLIC_CUSTOM_BUILD_BOOKING_LINK=BOOKING_LINK_PLACEHOLDER_CUSTOM_BUILD
```

The code also carries explicit fallback placeholders (`PASTE_STRIPE_LINK_STARTER_SYSTEM_49`, `PASTE_STRIPE_LINK_PRO_FOLLOW_UP_SYSTEM_149`, and `BOOKING_LINK_PLACEHOLDER_CUSTOM_BUILD`) so the flow is visible before production URLs are pasted in. Payment status should remain `Pending` until Stripe and/or n8n confirms the payment. For the custom package, n8n can move the CRM status to `Booked` after the booking event confirms.

## 4. n8n workflow

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

## 5. Next.js API environment

Configure one of these environment options for the dashboard API:

```bash
N8N_LEAD_WEBHOOK_URL=https://<your-n8n-host>/webhook/system-capital-lead
```

or:

```bash
N8N_BASE_URL=https://<your-n8n-host>
```

The API refuses `/webhook-test/` URLs and requires the final path to be `/webhook/system-capital-lead`.

## 6. Notion CRM / Leads

In n8n, configure the `Write Notion CRM Lead` node with:

- A Notion credential that can create pages in the CRM database.
- `NOTION_LEADS_DATABASE_ID` set to the CRM / Leads database ID.
- Database properties matching the workflow fields:
  - `Name` (title)
  - `Email` (email)
  - `Business` (text)
  - `Package` (select)
  - `Budget` (text)
  - `Need` (text)
  - `Source` (select)
  - `Status` (select)
  - `Payment Status` (select)
  - `Payment Next Step` (select)
  - `Payment Link` (url)
  - `Payment Amount` (number)
  - `Received At` (date)
  - `Lead ID` (text)
  - `Tally Response ID` (text)

Use these `Status` select options in the dashboard/CRM:

- `New Lead`
- `Payment Pending`
- `Paid`
- `Booked`
- `Follow-Up Needed`

Use `Pending` as the initial `Payment Status` option until a Stripe/n8n confirmation changes it.

## 7. Lead alert

Configure the `Send Lead Alert` node with Telegram credentials and set:

```bash
LEAD_ALERT_CHAT_ID=<your-chat-id>
```

If a different alert channel is preferred, replace this node while keeping it after `Write Notion CRM Lead` and before `Respond Success`.

## 8. Exact URL to put in Tally

Point the Tally webhook to the deployed dashboard API, not directly to Notion:

```text
https://<your-dashboard-domain>/api/tally-lead
```

Tally should send `FORM_RESPONSE` payloads. The API and n8n workflow normalize these fields:

- `name`
- `email`
- `business`
- `package`
- `budget`
- `need`
- `source`

## 9. Stripe/n8n confirmation handoff

Create a separate Stripe Payment Link / checkout confirmation workflow in n8n that updates the Notion CRM record by `Lead ID`, `Tally Response ID`, or email:

- Successful Starter or Pro payment → set `Status` to `Paid` and `Payment Status` to `Paid`.
- Custom booking confirmation → set `Status` to `Booked`.
- No payment or no booking after the follow-up window → set `Status` to `Follow-Up Needed`.

## 10. Smoke test

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
        { "key": "package", "label": "Select Package", "value": "Pro Follow-Up System" },
        { "key": "budget", "label": "Budget", "value": "$500-$1,000" },
        { "key": "need", "label": "Need", "value": "Automated payment and booking follow-up" },
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
