# n8n → GitHub Backup Plan

This plan snapshots exported n8n workflow JSON files from `n8n/workflows/` and commits them with a UTC timestamp.

## 1) Repository Convention

- Store all exported workflows in: `n8n/workflows/*.json`
- Keep stable file names: `<workflow-name>.workflow.json`

## 2) Backup Command

Run manually:

```bash
scripts/backup-n8n-workflows.sh
```

Run and push automatically:

```bash
PUSH=1 scripts/backup-n8n-workflows.sh
```

## 3) Suggested n8n Scheduling Workflow

1. **Cron node**: run every hour/day.
2. **Execute Command node**: run export command in your n8n host environment to refresh JSON files in `n8n/workflows/`.
3. **Execute Command node**: run
   `PUSH=1 /path/to/repo/scripts/backup-n8n-workflows.sh`
4. **IF node**: branch on command exit status.
5. **Slack/Email node**: send success or failure notification.

## 4) Commit Format

The script creates commits like:

`chore(n8n-backup): workflow snapshot 2026-05-03T00:00:00Z`

## 5) Operational Notes

- Ensure the runtime user has GitHub push access.
- Protect main branch with required checks if needed.
- Keep GitHub token/SSH key outside this repo and rotate regularly.
