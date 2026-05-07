# Agents Subsystem

The agents subsystem owns interactive agent roster, agent status, and agent action UI.

## Contents

- `components/AgentsInteractive.tsx` — client-side `/agents` control panel and social posting test surface.

## Boundaries

Agent UI may consume memory fixtures and logging components. Runtime adapters for OpenClaw, n8n, or future agent execution engines should be added under `integrations/` and invoked through API routes.

## TODO

- TODO(integrations): Connect agent actions to the real agent runtime instead of local mock execution.
