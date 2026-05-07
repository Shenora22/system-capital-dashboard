# Tally Lead Capture + Payment Flow Production Setup

Use a single reliable production path while keeping Tally as the intake form:

```text
Tally FORM_RESPONSE webhook → Next.js /api/tally-lead → n8n production webhook → Notion CRM / Leads
Tally post-submit redirect → /lead/next-step → Stripe Payment Link or custom booking link
Stripe/n8n confirmation → Notion CRM status/payment status update
```

Do **not** rely on Tally's native Notion mapping as the primary CRM path. It can remain disabled or secondary only; the production source of truth is webhook → n8n/API → Notion.

## 1. Tally intake fields

Keep Tally as the form experience and include these fields in the production intake form:

| Tally field label | Stable key / alias | Required | Notes |
| --- | --- | --- | --- |
| Name | `name` | Yes | Maps to Notion `Name`. |
| Email | `email` | Yes | Maps to Notion `Email`; API rejects leads without email. |
| Business | `business` | Recommended | Maps to Notion `Business`. |
| Need | `need` | Recommended | Maps to Notion `Need`. |
| Budget | `budget` | Recommended | Maps to Notion `Budget`. |
| Source | `source` | Recommended | Maps to Notion `Source`; defaults to Tally form name when blank. |
| Package | `package` | Yes | Single-select package selector used for payment routing and Notion `Package`. |

Configure the Tally `Package` field as a required single-select/dropdown with exactly these choices:

- `Starter System ($49)`
- `Pro Follow-Up System ($149)`
- `Custom Build`

The API and n8n normalizer canonicalize `Starter System ($49)` to `Starter System` and `Pro Follow-Up System ($149)` to `Pro Follow-Up System` before storing the value in Notion.

## 2. Post-submit redirect

Configure Tally's thank-you/redirect behavior to send users to the dashboard next-step page after submission:

```text
https://<your-dashboard-domain>/lead/next-step?package=<tally-package-answer>
```

The next-step route reads the package query string and immediately redirects the user to the matching configured Stripe Payment Link or booking URL. If an environment override is invalid, it shows a safe configuration page and keeps payment status messaging at `Pending`.

## 3. Payment and booking link environment

Set the server-side variables for API/n8n payloads and, if the Next.js page should render clickable public links at build/runtime, set the matching `NEXT_PUBLIC_` variables too:

```bash
STRIPE_PAYMENT_LINK_STARTER=https://buy.stripe.com/...
STRIPE_PAYMENT_LINK_PRO=https://buy.stripe.com/...
CUSTOM_BUILD_BOOKING_LINK=https://cal.com/your-booking-link

NEXT_PUBLIC_STRIPE_PAYMENT_LINK_STARTER=https://buy.stripe.com/...
NEXT_PUBLIC_STRIPE_PAYMENT_LINK_PRO=https://buy.stripe.com/...
NEXT_PUBLIC_CUSTOM_BUILD_BOOKING_LINK=https://cal.com/your-booking-link
```

The code carries these production URLs as defaults, while the environment variables above can override them per deployment. Payment status should remain `Pending` until Stripe and/or n8n confirms the payment. For the custom package, n8n can move the CRM status to `Booked` after the booking event confirms.

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
  - `Need` (text)
  - `Budget` (text)
  - `Source` (select)
  - `Package` (select)
  - `Payment Status` (select)
  - `Lead Status` (select)
  - `Payment Next Step` (select)
  - `Payment Link` (url)
  - `Payment Amount` (number)
  - `Received At` (date)
  - `Lead ID` (text)
  - `Tally Response ID` (text)

Use these `Lead Status` select options in the dashboard/CRM:

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

- Successful Starter or Pro payment → set `Lead Status` to `Paid` and `Payment Status` to `Paid`.
- Custom booking confirmation → set `Lead Status` to `Booked`.
- No payment or no booking after the follow-up window → set `Lead Status` to `Follow-Up Needed`.

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
        { "key": "package", "label": "Package", "value": "Pro Follow-Up System ($149)" },
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

## 11. Production Tally verification

After publishing the Tally form, verify the public form and routing with:

```bash
TALLY_PUBLIC_FORM_URL=https://tally.so/r/<form-id> \
TALLY_LEAD_BASE_URL=https://<your-dashboard-domain> \
npm run test:tally-production-flow
```

The verification script checks that the live public Tally form HTML contains all three package choices (`Starter System ($49)`, `Pro Follow-Up System ($149)`, and `Custom Build`) and that `/lead/next-step` redirects each package to the expected production Stripe or booking URL. If `TALLY_PUBLIC_FORM_URL` is omitted, the script still verifies dashboard payment routing but reports the live Tally form check as skipped.
