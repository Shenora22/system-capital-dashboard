# Logging Subsystem

The logging subsystem owns UI and future utilities for viewing operational activity, agent logs, workflow traces, and integration diagnostics.

## Contents

- `components/AgentLogViewer.tsx` — modal log viewer used by the agents control panel.
- `lib/system-events.ts` — shared System Event types, demo-safe fixtures, and dashboard metrics helpers.
- `fixtures/system-events.json` — local JSON examples for the future universal logger payload.
- `system-event-logger.md` — runbook for the planned `SC CORE - System Event Logger` n8n workflow.

## Boundaries

Logging components should render normalized log entries. Collection, retention, and alerting adapters should live in `integrations/` or `automation/` depending on their runtime.

## TODO

- TODO(logging): Route reviewed System Events through the universal logger after Notion schema approval.
