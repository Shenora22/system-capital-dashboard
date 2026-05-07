# Automation Subsystem

The automation subsystem stores executable automation artifacts and scripts that maintain them.

## Contents

- `n8n/workflows/` — exported n8n workflow JSON files.
- `n8n/backup-plan.md` — backup and scheduling runbook.
- `scripts/backup-n8n-workflows.sh` — timestamped Git snapshot helper.
- `scripts/seed-skytrace.mjs` — Supabase seed utility for SkyTrace demo drone data.

## Boundaries

Automation files should be portable and non-secret. Keep credentials in environment variables or platform secret stores.

## TODO

- TODO(integrations): Add environment-driven n8n host configuration and workflow export automation.
