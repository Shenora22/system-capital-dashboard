# Logging Subsystem

The logging subsystem owns UI and future utilities for viewing operational activity, agent logs, workflow traces, and integration diagnostics.

## Contents

- `components/AgentLogViewer.tsx` — modal log viewer used by the agents control panel.

## Boundaries

Logging components should render normalized log entries. Collection, retention, and alerting adapters should live in `integrations/` or `automation/` depending on their runtime.

## TODO

- TODO(logging): Add a shared log entry schema and route API-backed logs through this subsystem.
