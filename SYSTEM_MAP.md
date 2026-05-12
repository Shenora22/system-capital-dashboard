# System Capital Repository Map

This repository is organized around system responsibilities while preserving the existing Next.js routes under `app/`.

## Architecture Tree

```text
.
├── app/                         # Next.js App Router routes and API endpoints
│   ├── api/                     # HTTP boundaries for logs, waitlist, signals, and social tests
│   ├── dashboard/               # Route wrapper for dashboard subsystem
│   ├── agents/                  # Route wrapper for agents subsystem
│   ├── automation/              # Route wrapper for automation status UI
│   ├── brand-kit/               # Brand-kit route; uses marketing assets
│   └── ...                      # Existing routes preserved
├── dashboard/                   # Shared command workspace and shell components
├── agents/                      # Agent control-panel UI
├── automation/                  # Executable automation assets and support scripts
│   ├── n8n/workflows/           # Exported n8n JSON workflow backups
│   └── scripts/                 # Automation utility scripts
├── prompts/                     # Versioned LLM prompt library placeholder
├── memory/                      # Local fixtures and demo memory state
├── marketing/                   # Marketing components, content, campaigns, and brand notes
├── public/marketing/            # Publicly served marketing SVG assets
├── integrations/                # Reusable external-service clients and adapter placeholders
├── logging/                     # Log viewer UI and future log schema utilities
├── workflows/                   # Human-readable workflow specs and process maps
├── config/                      # Non-secret configuration templates placeholder
├── types/                       # Shared TypeScript declarations
└── next.config.ts               # Route-safe asset rewrites and Next.js config
```

## Subsystem Responsibilities

| Subsystem | Responsibility | Primary Files |
| --- | --- | --- |
| `app/` | Stable route/API boundary. Route paths remain unchanged. | `app/**/page.tsx`, `app/api/**/route.ts` |
| `dashboard/` | Command workspace shell, dashboard landing, System OS entry links, and Alora widget UI. | `dashboard/components/*.tsx` |
| `agents/` | Agent roster, action controls, and agent-specific interactive UI. | `agents/components/AgentsInteractive.tsx` |
| `automation/` | n8n exports, lead-capture workflow tooling, operational automation scripts, and backup runbooks. | `automation/n8n/workflows/*.json`, `automation/scripts/*` |
| `prompts/` | Future prompt packs, evaluation prompts, and agent prompt governance. | `prompts/README.md` |
| `memory/` | Local fixture memory until persistent memory/event stores are connected. | `memory/data/shenora.ts`, `memory/data/signals.json` |
| `marketing/` | Brand/content/campaign materials and lead-capture UI. | `marketing/components/EmailSignup.tsx`, `marketing/content/*.md` |
| `integrations/` | External-service adapters, n8n/Tally setup docs, payment-routing notes, and TODOs for production connectivity. | `integrations/supabase/client.ts`, `integrations/*/README.md` |
| `logging/` | Log display UI and future schema/diagnostics utilities. | `logging/components/AgentLogViewer.tsx` |
| `workflows/` | Human-readable workflow definitions separate from executable n8n JSON. | `workflows/README.md` |

## Route Preservation

All current app routes remain in `app/`, including `/dashboard`, `/operations`, `/agents`, `/automation`, `/signals`, `/deployment`, `/prompts`, `/brand-kit`, `/command-center`, `/drone`, and existing API routes. The route files now import implementation components/data from responsibility-based folders.

Static marketing assets were moved to `public/marketing/**`. Legacy asset URLs are preserved by `next.config.ts` rewrites:

- `/brand-kit/assets/:path*` → `/marketing/assets/brand-kit/:path*`
- `/carousels/system-capital/:path*` → `/marketing/carousels/system-capital/:path*`

## Moved Files

| Previous Location | New Location |
| --- | --- |
| `components/SystemCapitalDashboard.tsx` | `dashboard/components/SystemCapitalDashboard.tsx` |
| `components/ShenoraShell.tsx` | `dashboard/components/ShenoraShell.tsx` |
| `components/AskAloraWidget.tsx` | `dashboard/components/AskAloraWidget.tsx` |
| `components/AgentsInteractive.tsx` | `agents/components/AgentsInteractive.tsx` |
| `components/AgentLogViewer.tsx` | `logging/components/AgentLogViewer.tsx` |
| `components/emailsignup.tsx` | `marketing/components/EmailSignup.tsx` |
| `Data/shenora.ts` | `memory/data/shenora.ts` |
| `Data/signals.json` | `memory/data/signals.json` |
| `lib/supabase.ts` | `integrations/supabase/client.ts` |
| `n8n/workflows/*.json` | `automation/n8n/workflows/*.json` |
| `scripts/backup-n8n-workflows.sh` | `automation/scripts/backup-n8n-workflows.sh` |
| `scripts/seed-skytrace.mjs` | `automation/scripts/seed-skytrace.mjs` |
| `docs/n8n-backup-plan.md` | `automation/n8n/backup-plan.md` |
| `docs/system-capital-content-engine.md` | `marketing/content/system-capital-content-engine.md` |
| `public/brand-kit/assets/*.svg` | `public/marketing/assets/brand-kit/*.svg` |
| `public/carousels/system-capital/*.svg` | `public/marketing/carousels/system-capital/*.svg` |

## System OS Stabilization Backbone

The `/system-capital-os` route is the current Codex-side stabilization backbone for CRM, lead intake, workflow registry, workflow governance, AI agents registry, system event logging, payments, build rules, reports, and health. It uses local fixture arrays now so future live connectors can replace the data layer without redesigning the route. Details are tracked in [`OPERATING_BACKBONE.md`](./OPERATING_BACKBONE.md).

## Lead Capture Workflow Guarantees

- Canonical workflow JSON stays at `automation/n8n/workflows/lead-capture-alert-template-v2.json`.
- Validated production webhook path stays `system-capital-lead`.
- Export tooling stays available through `npm run export:n8n-lead-workflow`.
- Validation tooling stays available through `npm run validate:n8n-workflows`.
- Tally package selections continue to route Starter and Pro packages to Stripe payment links and Custom Build leads to the booking flow.

## Unresolved Issues

- n8n webhook calls still need a typed adapter boundary around the production `/webhook/system-capital-lead` endpoint.
- Social posting uses a bearer token path only; production OAuth and token refresh are still unfinished.
- Drone telemetry still creates a Supabase client directly in the page while schema and repository boundaries are finalized.
- Prompt packs are not yet extracted from inline UI/copy into versioned prompt files.
- Logging has UI for agent logs but no persisted event ledger yet.

## Recommended Next Implementation Priorities

1. Add typed environment configuration for n8n, Supabase, X/social APIs, and Mapbox.
2. Replace hard-coded webhook `fetch` calls with integration adapter functions.
3. Define persistent memory/event schemas in Supabase and migrate demo fixtures behind repository functions.
4. Create workflow spec files in `workflows/` for lead capture, signal generation, social posting, and founder daily brief.
5. Extract reusable prompts into `prompts/` and add prompt evaluation fixtures.
6. Add centralized logging schemas, API endpoints, and retention policy.
