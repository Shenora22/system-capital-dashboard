# System Capital AI Automation

System Capital is a Next.js command dashboard plus automation repository for agents, n8n workflows, AI prompts, operational memory, marketing assets, integrations, logs, and workflow specs.

For the full architecture overview, see [`SYSTEM_MAP.md`](./SYSTEM_MAP.md).

## Clean Architecture Layout

```text
.
├── app/                         # Stable Next.js routes and API boundaries
├── dashboard/                   # Command dashboard shell and UI surfaces
├── agents/                      # Agent roster/control UI
├── automation/                  # n8n exports, backup plans, and utility scripts
├── prompts/                     # Versioned prompt library placeholder
├── memory/                      # Local fixtures and demo state
├── marketing/                   # Brand/content/campaign hierarchy and marketing components
├── public/marketing/            # Public marketing assets served by Next.js
├── integrations/                # External-service clients and adapter placeholders
├── logging/                     # Log viewer UI and future logging schemas
├── workflows/                   # Human-readable workflow/process specs
├── config/                      # Non-secret config templates
└── types/                       # Shared declarations
```

## Route Compatibility

Existing routes remain in `app/` and should not be moved unless a route migration plan is created. Implementation code lives in subsystem folders and route files import it.

Marketing assets were moved under `public/marketing/`. Legacy public asset URLs remain available through Next.js rewrites in `next.config.ts`.

## Local Development

```bash
npm install
npm run dev
```

Open <http://localhost:3000>.

## Build

```bash
npm run build
```

## Tally Lead Capture, Payment Routing, and n8n Workflow

Tally posts production form submissions to the Next.js API route at `app/api/tally-lead/route.ts`. That route normalizes Tally fields, preserves package selection, assigns the correct payment next step, and forwards accepted `FORM_RESPONSE` leads to the n8n production webhook. Starter and Pro packages route to Stripe payment links, while Custom Build routes to a booking link.

The validated n8n webhook path is:

```text
system-capital-lead
```

Do not replace this with a `/webhook-test/` URL in production. The app composes the production path as `/webhook/system-capital-lead` when `N8N_BASE_URL` is provided, or validates `N8N_LEAD_WEBHOOK_URL` if an explicit webhook URL is configured.

The canonical lead-capture n8n workflow lives at:

```text
automation/n8n/workflows/lead-capture-alert-template-v2.json
```

A convenience copy for manual import is exported to:

```text
exports/lead-capture-alert-template-v2.json
```

To refresh the import copy from the source workflow, run:

```bash
npm run export:n8n-lead-workflow
```

To find the workflow in VS Code when the Explorer is focused on `app/automation/page.tsx`:

1. Open the repo root folder, not only the `app/` folder: `/workspace/system-capital-dashboard`.
2. In Explorer, expand `automation` → `n8n` → `workflows`.
3. Select `lead-capture-alert-template-v2.json`.
4. If Explorer is hard to navigate, press `Cmd+P` / `Ctrl+P`, paste `automation/n8n/workflows/lead-capture-alert-template-v2.json`, and press Enter.

To import into n8n:

1. Open n8n.
2. Create a new workflow or open the workflow import menu.
3. Choose import from file.
4. Select `exports/lead-capture-alert-template-v2.json` if you already ran the export command, or select the source file at `automation/n8n/workflows/lead-capture-alert-template-v2.json`.
5. After import, configure the placeholder Notion and Telegram credentials, confirm the webhook path is `system-capital-lead`, then activate/publish the workflow.

When manually importing, choose this exact file: `exports/lead-capture-alert-template-v2.json`.

Validate the checked-in n8n workflow JSON files with:

```bash
npm run validate:n8n-workflows
```

The export and validation scripts are intentionally kept in `package.json` so operators can refresh the importable workflow copy and verify the checked-in JSON before publishing changes.

## n8n Workflow Backups

Export workflows into `automation/n8n/workflows/` using stable names such as:

- `lead-enrichment.workflow.json`
- `weekly-report.workflow.json`

Create a timestamped Git snapshot with:

```bash
npm run backup:n8n
```

or directly:

```bash
automation/scripts/backup-n8n-workflows.sh
```

For scheduled backup guidance, see [`automation/n8n/backup-plan.md`](./automation/n8n/backup-plan.md).

## SkyTrace Seed Utility

```bash
SUPABASE_URL="https://your-project.supabase.co" \
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key" \
npm run seed:skytrace
```

## Security Notes

- Never commit API keys, tokens, or production credentials.
- Keep secrets in environment variables or a secret manager.
- If a secret is committed accidentally, rotate it immediately.
