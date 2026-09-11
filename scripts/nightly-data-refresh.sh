#!/bin/bash
# Nightly operations-data refresh — copies the Jobs History Master workbook
# from the company OneDrive into sources/operations/, runs the operations
# pipeline, and pushes the regenerated artifacts. A push deploys TEST only;
# production still goes through the "Promote to Production" button.
#
# Installed as a LaunchAgent (nz.co.petromac.data-refresh, 02:30 nightly) —
# see docs/ADMIN.md "Nightly auto-refresh" for how to pause/resume/inspect.
#
# Safety model: the job acts only when the workbook actually changed AND the
# repo is fully quiet — on main, clean tree, local == origin/main. Anything
# else logs a SKIP (and posts a macOS notification) and waits for the next
# night. It never pulls or rebases, and never stages anything beyond the
# three public/data/ artifacts. The hash of the last successfully synced
# workbook lives outside the repo, so a failed night retries the next one.
set -euo pipefail

REPO="/Users/rthatha/Projects/Petromac/Website"
SOURCE_XLSX="/Users/rthatha/Library/CloudStorage/OneDrive-PETROMACLtd/04.Marketing/Jobs History Master 2.0.xlsx"
STATE_DIR="$HOME/Library/Application Support/petromac-data-refresh"
STATE_FILE="$STATE_DIR/last-synced.md5"

log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*"; }
notify() { /usr/bin/osascript -e "display notification \"$1\" with title \"Petromac data refresh\"" >/dev/null 2>&1 || true; }
trap 'log "ERROR: refresh aborted (see lines above)"; notify "Refresh FAILED — see ~/Library/Logs/petromac-data-refresh.log"' ERR

# --- environment: launchd starts with a bare PATH ---------------------------
export PATH="$HOME/.pyenv/shims:/opt/homebrew/bin:/opt/homebrew/sbin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin"
# nvm.sh is not set -u/-e safe; relax while sourcing it to get node + pnpm.
if [ -s "$HOME/.nvm/nvm.sh" ]; then
  set +eu
  # shellcheck disable=SC1091
  . "$HOME/.nvm/nvm.sh"
  set -eu
fi
command -v pnpm >/dev/null || { log "ERROR: pnpm not on PATH"; notify "Failed: pnpm not found"; exit 1; }

mkdir -p "$STATE_DIR"
cd "$REPO"

# --- 1. source workbook present and stable (not mid-save / mid-sync) --------
if [ ! -r "$SOURCE_XLSX" ]; then
  log "SKIP: workbook not readable at $SOURCE_XLSX (renamed or OneDrive not synced?)"
  notify "Skipped: OneDrive workbook not found — was it renamed?"
  exit 0
fi
now=$(date +%s)
mtime=$(stat -f %m "$SOURCE_XLSX")
if [ $((now - mtime)) -lt 120 ]; then
  log "SKIP: workbook modified <2 min ago — possibly mid-save; retrying tomorrow"
  exit 0
fi

# --- 2. changed since the last successful sync? (md5 also hydrates OneDrive) -
hash=$(/sbin/md5 -q "$SOURCE_XLSX")
last=$(cat "$STATE_FILE" 2>/dev/null || echo none)
if [ "$hash" = "$last" ]; then
  log "No change (md5 $hash) — nothing to do"
  exit 0
fi
log "Workbook changed (was $last, now $hash) — refreshing"

# --- 3. repo must be quiet and in sync with origin ---------------------------
branch=$(git rev-parse --abbrev-ref HEAD)
if [ "$branch" != "main" ]; then
  log "SKIP: repo on branch '$branch', not main"
  notify "Skipped: repo not on main"
  exit 0
fi
if [ -n "$(git status --porcelain)" ]; then
  log "SKIP: working tree not clean — leaving your work untouched"
  notify "Skipped: uncommitted work in the repo"
  exit 0
fi
git fetch origin main --quiet
if [ "$(git rev-parse HEAD)" != "$(git rev-parse origin/main)" ]; then
  log "SKIP: local main differs from origin/main (ahead or behind)"
  notify "Skipped: repo out of sync with origin"
  exit 0
fi

# --- 4. copy in and run the pipeline -----------------------------------------
cp "$SOURCE_XLSX" "$REPO/sources/operations/"
log "Running pnpm run data:operations…"
pnpm run data:operations

# --- 5. commit + push only if the published artifacts actually changed -------
if [ -z "$(git status --porcelain -- public/data)" ]; then
  log "Pipeline produced identical artifacts — recording hash, no commit"
  echo "$hash" >"$STATE_FILE"
  exit 0
fi
stats=$(python3 -c "import json; s = json.load(open('public/data/operations_stats.json')); print(f\"{s['deployments']:,} deployments, {s['countries']} countries\")" 2>/dev/null || echo "stats unavailable")
git add public/data/operations_data.json public/data/operations_full.json public/data/operations_stats.json
git commit -m "data: nightly operations refresh from OneDrive ($stats)"
log "Pushing (pre-push gate: typecheck + lint + unit tests + build)…"
if git push; then
  echo "$hash" >"$STATE_FILE"
  log "DONE: pushed — test.petromac.co.nz redeploys with $stats"
  notify "Data refreshed on test ($stats). Promote when ready."
else
  log "ERROR: push failed — commit left local for manual attention"
  notify "Push FAILED — check petromac-data-refresh.log"
  exit 1
fi
