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
