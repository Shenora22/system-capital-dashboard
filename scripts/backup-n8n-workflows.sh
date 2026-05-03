#!/usr/bin/env bash
set -euo pipefail

# Backup all n8n workflow JSON files into Git with a timestamped commit.
# Usage:
#   scripts/backup-n8n-workflows.sh
#   PUSH=1 scripts/backup-n8n-workflows.sh
#   BRANCH=main PUSH=1 scripts/backup-n8n-workflows.sh

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
WORKFLOW_DIR="${WORKFLOW_DIR:-$REPO_ROOT/n8n/workflows}"
BRANCH="${BRANCH:-$(git -C "$REPO_ROOT" rev-parse --abbrev-ref HEAD)}"
TIMESTAMP="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
COMMIT_MSG="chore(n8n-backup): workflow snapshot ${TIMESTAMP}"
PUSH="${PUSH:-0}"

if [[ ! -d "$WORKFLOW_DIR" ]]; then
  echo "Workflow directory not found: $WORKFLOW_DIR" >&2
  exit 1
fi

if ! command -v git >/dev/null 2>&1; then
  echo "git is required but not found in PATH" >&2
  exit 1
fi

# Ensure there are workflow files to track.
if ! find "$WORKFLOW_DIR" -maxdepth 1 -type f -name '*.json' | grep -q .; then
  echo "No workflow JSON files found in $WORKFLOW_DIR"
  exit 0
fi

git -C "$REPO_ROOT" add "$WORKFLOW_DIR"

if git -C "$REPO_ROOT" diff --cached --quiet; then
  echo "No workflow changes detected. Backup skipped."
  exit 0
fi

git -C "$REPO_ROOT" commit -m "$COMMIT_MSG"
echo "Created backup commit: $COMMIT_MSG"

if [[ "$PUSH" == "1" ]]; then
  git -C "$REPO_ROOT" push origin "$BRANCH"
  echo "Pushed backup commit to origin/$BRANCH"
else
  echo "Push skipped (set PUSH=1 to push automatically)."
fi
