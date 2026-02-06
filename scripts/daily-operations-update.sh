#!/usr/bin/env bash
set -euo pipefail

REPO_DIR="/Users/rthatha/Projects/Petromac/Website"
LOG_FILE="$HOME/Library/Logs/petromac-data-update.log"
DATA_FILE="public/data/operations_data.json"

log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" | tee -a "$LOG_FILE"
}

cd "$REPO_DIR"

log "=== Daily operations update started ==="

# Pull latest changes (fast-forward only to avoid merge conflicts)
log "Pulling latest changes..."
if ! git pull --ff-only >> "$LOG_FILE" 2>&1; then
  log "ERROR: git pull --ff-only failed. Manual intervention required."
  exit 1
fi

# Run operations-only data pipeline
log "Running pnpm data:operations..."
if ! pnpm data:operations >> "$LOG_FILE" 2>&1; then
  log "ERROR: pnpm data:operations failed."
  exit 1
fi

# Check if the operations data file changed
if git diff --quiet "$DATA_FILE"; then
  log "No changes to $DATA_FILE. Nothing to commit."
  log "=== Daily operations update finished (no changes) ==="
  exit 0
fi

# Commit and push
log "Changes detected in $DATA_FILE. Committing..."
git add "$DATA_FILE"
git commit -m "chore: update operations data (automated daily)" >> "$LOG_FILE" 2>&1
log "Pushing to remote..."
git push >> "$LOG_FILE" 2>&1

log "=== Daily operations update finished (pushed) ==="
