# Memory Subsystem

The memory subsystem contains local data fixtures and seed state used by dashboards before persistent stores are wired in.

## Contents

- `data/shenora.ts` — agent roster, workflow status, activity log, and signal feed fixtures.
- `data/signals.json` — static signal sample payload.

## Boundaries

Memory is safe for demo data and deterministic UI state. Production event ledgers and vector memory should be implemented behind `integrations/` clients.

## TODO

- TODO(integrations): Replace local memory fixtures with Supabase-backed event and agent state tables.
