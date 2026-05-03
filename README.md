# System Capital AI Automation

A central repository for System Capital's automation assets: n8n workflows, AI prompts, operational docs, scripts, and shared configuration.

## Repository Structure

```text
.
├── app/                    # Next.js application
├── components/             # UI components
├── config/                 # Shared configuration templates and environment docs
├── docs/                   # Runbooks, SOPs, architecture notes
├── n8n/
│   └── workflows/          # Exported n8n workflow JSON files
├── prompts/                # Reusable LLM prompts and prompt packs
├── scripts/                # Utility scripts (seeders, migration helpers, backups)
└── ...
```

## What to Store Here

- **n8n workflows**: Exported JSON workflow definitions from n8n.
- **prompts**: Versioned prompt templates used by agents and automations.
- **docs**: Human-readable operating procedures and architecture notes.
- **scripts**: Automation helpers (setup, validation, migration, backup support).
- **config**: Non-secret config templates (never commit real secrets).

## Backup Workflow (Recommended)

Use this lightweight process to keep your automations recoverable and versioned:

1. **Export workflows from n8n** after any meaningful change.
2. **Save each workflow JSON** into `n8n/workflows/` using a stable naming convention, e.g.:
   - `lead-enrichment.workflow.json`
   - `weekly-report.workflow.json`
3. **Update related docs/prompts** if logic or AI behavior changed.
4. **Commit to Git** with a clear message (example: `chore(n8n): update weekly report workflow`).
5. **Push to GitHub** so the remote repository is your off-platform backup.

Optional hardening:
- Add a scheduled job in n8n that auto-exports workflows to a backup destination.
- Mirror this repo to a second remote for disaster recovery.

## How to Export n8n Workflows into This Repo

### Option A: From n8n UI (most common)

1. Open the workflow in n8n.
2. Click **...** (workflow menu) → **Download** / **Export**.
3. Save the `.json` file.
4. Move the file into `n8n/workflows/`.
5. Rename it to `<workflow-name>.workflow.json`.
6. Commit and push.

### Option B: CLI/Automation Export

If your n8n deployment supports CLI export in your environment, export workflows to a temp folder, then copy the files into `n8n/workflows/` and commit.

## Local Development (Web App)

```bash
npm install
npm run dev
```

Open <http://localhost:3000>.

## Security Notes

- Never commit API keys, tokens, or production credentials.
- Keep secrets in environment variables or your secret manager.
- If a secret is committed accidentally, rotate it immediately.

## Existing Utility Script

Seed SkyTrace demo drone data:

```bash
SUPABASE_URL="https://your-project.supabase.co" \
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key" \
npm run seed:skytrace
```

## Automated GitHub Backups for n8n Workflows

Use the backup helper script to create timestamped Git commits from `n8n/workflows/*.json`:

```bash
scripts/backup-n8n-workflows.sh
```

To push automatically to GitHub:

```bash
PUSH=1 scripts/backup-n8n-workflows.sh
```

For a full scheduled automation pattern, see `docs/n8n-backup-plan.md`.

