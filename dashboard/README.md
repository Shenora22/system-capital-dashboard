# Dashboard Subsystem

The dashboard subsystem contains reusable Next.js UI surfaces for the System Capital command workspace.

## Contents

- `components/SystemCapitalDashboard.tsx` — main `/dashboard` experience.
- `components/ShenoraShell.tsx` — shared shell used by operating pages such as `/agents`, `/signals`, `/automation`, `/projects`, `/activity`, and `/settings`.
- `components/AskAloraWidget.tsx` — client-side assistant widget backed by local memory fixtures.

## Boundaries

Dashboard components may read from `memory/` and render workflow, signal, and agent summaries. They should not own production integration clients; those belong in `integrations/`.
