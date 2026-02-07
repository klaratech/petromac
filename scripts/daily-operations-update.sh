#!/usr/bin/env bash
set -euo pipefail

REPO_DIR="/Users/rthatha/Projects/Petromac/Website"
LOG_FILE="$HOME/Library/Logs/petromac-data-update.log"
DATA_FILE="public/data/operations_data.json"
EMAIL_LOG_FILE="data/email-log.jsonl"

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

# Check if the operations data file or email log changed
FILES_TO_COMMIT=""

if ! git diff --quiet "$DATA_FILE" 2>/dev/null; then
  FILES_TO_COMMIT="$DATA_FILE"
fi

if [ -f "$EMAIL_LOG_FILE" ] && ! git diff --quiet "$EMAIL_LOG_FILE" 2>/dev/null; then
  FILES_TO_COMMIT="$FILES_TO_COMMIT $EMAIL_LOG_FILE"
fi

# Also check for untracked email log file
if [ -f "$EMAIL_LOG_FILE" ] && ! git ls-files --error-unmatch "$EMAIL_LOG_FILE" >/dev/null 2>&1; then
  FILES_TO_COMMIT="$FILES_TO_COMMIT $EMAIL_LOG_FILE"
fi

if [ -z "$FILES_TO_COMMIT" ]; then
  log "No changes to commit. Nothing to do."
  log "=== Daily operations update finished (no changes) ==="
  exit 0
fi

# Commit and push
log "Changes detected in:$FILES_TO_COMMIT. Committing..."
git add $FILES_TO_COMMIT
git commit -m "chore: update operations data (automated daily)" >> "$LOG_FILE" 2>&1
log "Pushing to remote..."
git push >> "$LOG_FILE" 2>&1

log "=== Daily operations update finished (pushed) ==="
