# n8n Integration Adapter

Reusable n8n webhook clients, workflow export helpers, and environment validation belong here. The production lead-capture integration is active and should keep using the validated webhook path `system-capital-lead`.

## Production lead capture

See [`tally-lead-capture.md`](./tally-lead-capture.md) for the Tally → `/api/tally-lead` → n8n production webhook → Notion CRM / Leads setup. The checked-in workflow source is:

```text
automation/n8n/workflows/lead-capture-alert-template-v2.json
```

The import-friendly export copy is generated at:

```text
exports/lead-capture-alert-template-v2.json
```

## Required npm scripts

Run these from the repository root when editing or publishing the lead workflow:

```bash
npm run export:n8n-lead-workflow
npm run validate:n8n-workflows
```

`export:n8n-lead-workflow` copies the canonical workflow JSON to `exports/` for manual n8n import. `validate:n8n-workflows` parses every workflow JSON file, rejects duplicate keys, confirms the lead workflow exists, checks that the webhook path remains `system-capital-lead`, and verifies the success response body.

## Payment routing

The Tally API route maps package selections before forwarding leads to n8n:

- Starter System → Stripe payment link (`STRIPE_PAYMENT_LINK_STARTER`)
- Pro Follow-Up System → Stripe payment link (`STRIPE_PAYMENT_LINK_PRO`)
- Custom Build → booking link (`CUSTOM_BUILD_BOOKING_LINK`)
- Unknown package → manual follow-up / booking fallback

## TODO

- TODO(integrations): Replace direct webhook calls in route handlers with typed n8n adapter functions once the adapter boundary is finalized.
