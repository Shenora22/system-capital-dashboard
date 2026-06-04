# Automation Subsystem

The automation subsystem stores executable automation artifacts and scripts that maintain them.

## Contents

- `n8n/workflows/` — exported n8n workflow JSON files.
- `n8n/backup-plan.md` — backup and scheduling runbook.
- `scripts/backup-n8n-workflows.sh` — timestamped Git snapshot helper.
- `scripts/seed-skytrace.mjs` — Supabase seed utility for SkyTrace demo drone data.

## Workflows

| Workflow | File | Purpose |
| --- | --- | --- |
| `System Capital - Lead Capture Production` | `n8n/workflows/lead-capture-alert-template-v2.json` | Lead intake webhook, Notion CRM write, and Telegram lead alert. |
| `SC - SkyTrace Telegram Alert` | `n8n/workflows/skytrace-telegram-alert.workflow.json` | Reacts to inserted SkyTrace events that require approval or are critical, then sends a Telegram operations alert. |
| `System Capital Signals` | `n8n/workflows/system-capital-signals.workflow.json` | Demo signals payload webhook. |

## Boundaries

Automation files should be portable and non-secret. Keep credentials in environment variables or platform secret stores.

SkyTrace automation must stay downstream of `public.skytrace_events`; do not change the SkyTrace UI, mission workflow logic, or persistence layer to make notification routing work.

## TODO

- TODO(integrations): Add environment-driven n8n host configuration and workflow export automation.
