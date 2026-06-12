#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CONFIG_FILE="${ROOT_DIR}/ops/codon-vps.local.env"
APPLY=false

usage() {
  cat <<'EOF'
Usage:
  ops/sync-vps-git.sh --env ops/codon-vps.local.env --dry-run
  ops/sync-vps-git.sh --env ops/codon-vps.local.env --apply

This local script creates or updates a pull-only Git working copy on the VPS.
It does not change the active release symlinks or restart services.
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --env)
      CONFIG_FILE="${2:-}"
      shift 2
      ;;
    --apply)
      APPLY=true
      shift
      ;;
    --dry-run)
      APPLY=false
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown argument: $1" >&2
      usage >&2
      exit 2
      ;;
  esac
done

if [[ ! -f "$CONFIG_FILE" ]]; then
  echo "Config file not found: $CONFIG_FILE" >&2
  exit 1
fi

# shellcheck source=/dev/null
source "$CONFIG_FILE"

REMOTE_HOST="${REMOTE_HOST:-}"
REMOTE_USER="${REMOTE_USER:-root}"
SSH_PORT="${SSH_PORT:-22222}"
SSH_IDENTITY_FILE="${SSH_IDENTITY_FILE:-}"
APP_USER="${APP_USER:-codon}"
APP_ROOT="${APP_ROOT:-/opt/codon}"
SOURCE_REPO_DIR="${SOURCE_REPO_DIR:-${APP_ROOT}/repo}"
GIT_REMOTE_URL="${GIT_REMOTE_URL:-}"
GIT_BRANCH="${GIT_BRANCH:-main}"

if [[ -z "$GIT_REMOTE_URL" ]]; then
  GIT_REMOTE_URL="$(git -C "$ROOT_DIR" config --get remote.origin.url 2>/dev/null || true)"
fi

if [[ -z "$REMOTE_HOST" || "$REMOTE_HOST" == "your-server-ip-or-domain" ]]; then
  echo "Set REMOTE_HOST in $CONFIG_FILE." >&2
  exit 1
fi

if [[ -z "$GIT_REMOTE_URL" ]]; then
  echo "Set GIT_REMOTE_URL in $CONFIG_FILE or configure local git remote origin." >&2
  exit 1
fi

shell_quote() {
  printf "%q" "$1"
}

ssh_opts=(-p "$SSH_PORT" -o IdentitiesOnly=yes)
if [[ -n "$SSH_IDENTITY_FILE" ]]; then
  ssh_opts+=(-i "$SSH_IDENTITY_FILE")
fi

remote="${REMOTE_USER}@${REMOTE_HOST}"

if ! $APPLY; then
  cat <<EOF
Dry run only. Re-run with --apply to sync the VPS Git working copy.

Would connect to: ${remote}
SSH port: ${SSH_PORT}
Would sync:
  ${SOURCE_REPO_DIR}
Remote:
  ${GIT_REMOTE_URL}
Branch:
  ${GIT_BRANCH}
EOF
  exit 0
fi

remote_prefix="APP_USER=$(shell_quote "$APP_USER") SOURCE_REPO_DIR=$(shell_quote "$SOURCE_REPO_DIR") GIT_REMOTE_URL=$(shell_quote "$GIT_REMOTE_URL") GIT_BRANCH=$(shell_quote "$GIT_BRANCH")"

ssh "${ssh_opts[@]}" "$remote" "${remote_prefix} bash -s" <<'REMOTE_SCRIPT'
set -euo pipefail

if [[ "$(id -u)" -eq 0 ]]; then
  SUDO=()
else
  SUDO=(sudo)
fi

as_app() {
  if [[ "$(id -u)" -eq 0 ]]; then
    runuser -u "$APP_USER" -- "$@"
  else
    sudo -u "$APP_USER" "$@"
  fi
}

repo_parent="$(dirname "$SOURCE_REPO_DIR")"
"${SUDO[@]}" install -d -m 0755 -o "$APP_USER" -g "$APP_USER" "$repo_parent"

if [[ -d "$SOURCE_REPO_DIR/.git" ]]; then
  if [[ -n "$(as_app git -C "$SOURCE_REPO_DIR" status --porcelain --untracked-files=normal)" ]]; then
    echo "Refusing to update dirty VPS working copy: $SOURCE_REPO_DIR" >&2
    as_app git -C "$SOURCE_REPO_DIR" status --short
    exit 1
  fi

  as_app git -C "$SOURCE_REPO_DIR" remote set-url origin "$GIT_REMOTE_URL"
  as_app git -C "$SOURCE_REPO_DIR" fetch --prune origin
  if ! as_app git -C "$SOURCE_REPO_DIR" checkout "$GIT_BRANCH"; then
    as_app git -C "$SOURCE_REPO_DIR" checkout -b "$GIT_BRANCH" "origin/$GIT_BRANCH"
  fi
  as_app git -C "$SOURCE_REPO_DIR" pull --ff-only origin "$GIT_BRANCH"
else
  if [[ -e "$SOURCE_REPO_DIR" ]] && [[ -n "$(find "$SOURCE_REPO_DIR" -mindepth 1 -maxdepth 1 2>/dev/null | head -n 1)" ]]; then
    echo "Refusing to clone into non-empty non-git directory: $SOURCE_REPO_DIR" >&2
    exit 1
  fi

  as_app git clone --branch "$GIT_BRANCH" --single-branch "$GIT_REMOTE_URL" "$SOURCE_REPO_DIR"
fi

as_app git -C "$SOURCE_REPO_DIR" config pull.ff only
as_app git -C "$SOURCE_REPO_DIR" config remote.origin.url "$GIT_REMOTE_URL"
"${SUDO[@]}" git config --global --get-all safe.directory | grep -Fx "$SOURCE_REPO_DIR" >/dev/null 2>&1 || \
  "${SUDO[@]}" git config --global --add safe.directory "$SOURCE_REPO_DIR"

printf 'repo=%s\n' "$SOURCE_REPO_DIR"
printf 'remote_origin=\n'
as_app git -C "$SOURCE_REPO_DIR" remote -v
printf 'branch_status=\n'
as_app git -C "$SOURCE_REPO_DIR" status --short --branch
printf 'commit=%s\n' "$(as_app git -C "$SOURCE_REPO_DIR" rev-parse HEAD)"
REMOTE_SCRIPT
