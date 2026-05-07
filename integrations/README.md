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
