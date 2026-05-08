# Integrations Subsystem

The integrations subsystem contains reusable clients, adapter notes, and integration-specific TODOs.

## Contents

- `supabase/client.ts` — shared Supabase browser/client bootstrap.
- `social/` — placeholder for X, LinkedIn, and future social adapters.
- `n8n/` — placeholder for n8n webhook and export clients.

## Boundaries

API routes in `app/api/` may call integrations, but long-lived clients, environment parsing, retries, and adapter contracts should live here.

## TODO

- TODO(integrations): Centralize n8n webhook URLs in typed environment config.
- TODO(integrations): Add social OAuth/token-refresh support for production posting.
- TODO(integrations): Move drone telemetry persistence behind Supabase repository functions.

## Tally Lead Webhook

Use `POST /api/tally-lead` as the server-side Tally lead capture endpoint so leads are written directly into Notion instead of depending only on Tally's native Notion mapping.

### Environment variables

Set these values wherever the Next.js app runs:

```bash
NOTION_TOKEN="secret_xxx"
NOTION_LEADS_DATABASE_ID="your-notion-leads-database-id"
```

The Notion integration connected to `NOTION_TOKEN` must have access to the leads database. The endpoint reads the database schema first, then writes matching properties for `Name`, `Email`, `Business`, `Package`, `Source`, and optional `Received At` when those properties exist.

### Tally setup

1. Deploy the app so it has a public HTTPS URL.
2. In Tally, open the lead form and go to **Integrations** → **Webhooks**.
3. Add a webhook with method `POST` and URL:

   ```text
   https://YOUR_DOMAIN.com/api/tally-lead
   ```

4. Submit a test form entry containing `name`, `email`, `business`, `package`, and `source` fields.
5. Confirm the response returns `success: true` and that a new page appears in the Notion leads database.
6. Check server output for `[Agent Logs]` entries confirming the lead was received. If Notion fails, the endpoint also prints `[TALLY LEAD FALLBACK LOCAL LOG]` with the normalized lead payload.
