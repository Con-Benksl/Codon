#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CONFIG_FILE="${ROOT_DIR}/ops/codon-vps.local.env"
APPLY=false
SKIP_BUILD=false

usage() {
  cat <<'EOF'
Usage:
  ops/deploy-vps.sh --env ops/codon-vps.local.env --apply
  ops/deploy-vps.sh --env ops/codon-vps.local.env --dry-run
  ops/deploy-vps.sh --env ops/codon-vps.local.env --apply --skip-build

This local script builds the frontend, packages the backend source and frontend
dist, uploads a release tarball, installs backend Python dependencies on the
VPS, flips current symlinks, restarts systemd, reloads Nginx, and checks /health.
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
    --skip-build)
      SKIP_BUILD=true
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
DOMAIN="${DOMAIN:-_}"
ENABLE_HTTPS="${ENABLE_HTTPS:-false}"
APP_NAME="${APP_NAME:-codon}"
APP_USER="${APP_USER:-codon}"
APP_ROOT="${APP_ROOT:-/opt/codon}"
FRONTEND_ROOT="${FRONTEND_ROOT:-/var/www/codon}"
BACKEND_PORT="${BACKEND_PORT:-8000}"
RUN_ALEMBIC="${RUN_ALEMBIC:-true}"
KEEP_RELEASES="${KEEP_RELEASES:-5}"
PIP_INDEX_URL="${PIP_INDEX_URL:-https://mirrors.aliyun.com/pypi/simple/}"
PIP_TRUSTED_HOST="${PIP_TRUSTED_HOST:-mirrors.aliyun.com}"
VITE_API_URL="${VITE_API_URL:-}"

bool_is_true() {
  case "$1" in
    true|TRUE|True|1|yes|YES|Yes) return 0 ;;
    *) return 1 ;;
  esac
}

shell_quote() {
  printf "%q" "$1"
}

derive_api_url() {
  if [[ -n "$VITE_API_URL" ]]; then
    printf '%s' "$VITE_API_URL"
  elif [[ "$DOMAIN" != "_" && -n "$DOMAIN" ]]; then
    if bool_is_true "$ENABLE_HTTPS"; then
      printf 'https://%s/api/v1' "$DOMAIN"
    else
      printf 'http://%s/api/v1' "$DOMAIN"
    fi
  else
    printf 'http://%s/api/v1' "$REMOTE_HOST"
  fi
}

if [[ -z "$REMOTE_HOST" || "$REMOTE_HOST" == "your-server-ip-or-domain" ]]; then
  echo "Set REMOTE_HOST in $CONFIG_FILE." >&2
  exit 1
fi

if ! [[ "$KEEP_RELEASES" =~ ^[0-9]+$ ]] || (( KEEP_RELEASES < 1 )); then
  echo "KEEP_RELEASES must be a positive integer." >&2
  exit 1
fi

api_url="$(derive_api_url)"
release_id="$(date +%Y%m%d%H%M%S)"
tmp_dir="${ROOT_DIR}/ops/.tmp"
stage_dir="${tmp_dir}/stage-${release_id}"
artifact="${tmp_dir}/codon-${release_id}.tar.gz"
remote_artifact="/tmp/codon-${release_id}.tar.gz"

git_remote_url="$(git -C "$ROOT_DIR" config --get remote.origin.url 2>/dev/null || true)"
git_branch="$(git -C "$ROOT_DIR" rev-parse --abbrev-ref HEAD 2>/dev/null || true)"
git_commit="$(git -C "$ROOT_DIR" rev-parse HEAD 2>/dev/null || true)"
git_dirty=false
if [[ -n "$(git -C "$ROOT_DIR" status --porcelain --untracked-files=normal 2>/dev/null || true)" ]]; then
  git_dirty=true
fi

ssh_opts=(-p "$SSH_PORT" -o IdentitiesOnly=yes)
scp_opts=(-P "$SSH_PORT" -o IdentitiesOnly=yes)
if [[ -n "$SSH_IDENTITY_FILE" ]]; then
  ssh_opts+=(-i "$SSH_IDENTITY_FILE")
  scp_opts+=(-i "$SSH_IDENTITY_FILE")
fi
remote="${REMOTE_USER}@${REMOTE_HOST}"

if ! $APPLY; then
  cat <<EOF
Dry run only. Re-run with --apply to deploy.

Would build frontend with:
  VITE_API_URL=${api_url}
Would package:
  backend/ -> release backend source
  frontend/dist/ -> static frontend
Would upload to:
  ${remote}:${remote_artifact}
Would activate release:
  ${APP_ROOT}/releases/${release_id}
  ${FRONTEND_ROOT}/releases/${release_id}
Would restart:
  ${APP_NAME}-backend.service
Would verify:
  http://127.0.0.1:${BACKEND_PORT}/health on the VPS
EOF
  exit 0
fi

cleanup() {
  rm -rf "$stage_dir" "$artifact"
}
trap cleanup EXIT

mkdir -p "$stage_dir/backend" "$stage_dir/frontend-dist" "$tmp_dir"

if ! $SKIP_BUILD; then
  (cd "$ROOT_DIR/frontend" && npm ci && VITE_API_URL="$api_url" npm run build)
fi

if [[ ! -f "$ROOT_DIR/frontend/dist/index.html" ]]; then
  echo "frontend/dist/index.html not found. Run without --skip-build or build the frontend first." >&2
  exit 1
fi

if command -v python3 >/dev/null 2>&1; then
  (cd "$ROOT_DIR" && PYTHONDONTWRITEBYTECODE=1 python3 -m compileall -q backend/app)
fi

rsync -a --delete \
  --exclude '.DS_Store' \
  --exclude '.env' \
  --exclude '.pytest_cache' \
  --exclude '__pycache__' \
  --exclude '*.db' \
  --exclude '*.sqlite' \
  --exclude '*.sqlite3' \
  --exclude 'venv' \
  "$ROOT_DIR/backend/" "$stage_dir/backend/"

rsync -a --delete "$ROOT_DIR/frontend/dist/" "$stage_dir/frontend-dist/"
cat >"$stage_dir/.codon-release" <<EOF
release_id=${release_id}
deployed_at_utc=$(date -u +%Y-%m-%dT%H:%M:%SZ)
source_remote=${git_remote_url}
source_branch=${git_branch}
source_commit=${git_commit}
source_dirty=${git_dirty}
vite_api_url=${api_url}
EOF
if command -v xattr >/dev/null 2>&1; then
  xattr -cr "$stage_dir" 2>/dev/null || true
fi
COPYFILE_DISABLE=1 tar -C "$stage_dir" -czf "$artifact" .

scp "${scp_opts[@]}" "$artifact" "$remote:$remote_artifact"

remote_prefix="APP_NAME=$(shell_quote "$APP_NAME") APP_USER=$(shell_quote "$APP_USER") APP_ROOT=$(shell_quote "$APP_ROOT") FRONTEND_ROOT=$(shell_quote "$FRONTEND_ROOT") BACKEND_PORT=$(shell_quote "$BACKEND_PORT") RUN_ALEMBIC=$(shell_quote "$RUN_ALEMBIC") KEEP_RELEASES=$(shell_quote "$KEEP_RELEASES") PIP_INDEX_URL=$(shell_quote "$PIP_INDEX_URL") PIP_TRUSTED_HOST=$(shell_quote "$PIP_TRUSTED_HOST")"

ssh "${ssh_opts[@]}" "$remote" "${remote_prefix} bash -s -- $(shell_quote "$release_id") $(shell_quote "$remote_artifact")" <<'REMOTE_SCRIPT'
set -euo pipefail

RELEASE_ID="$1"
REMOTE_ARTIFACT="$2"
RELEASE_DIR="${APP_ROOT}/releases/${RELEASE_ID}"
FRONTEND_RELEASE_DIR="${FRONTEND_ROOT}/releases/${RELEASE_ID}"
ENV_FILE="/etc/${APP_NAME}/${APP_NAME}.env"
SERVICE_NAME="${APP_NAME}-backend.service"
PIP_INDEX_URL="${PIP_INDEX_URL:-}"
PIP_TRUSTED_HOST="${PIP_TRUSTED_HOST:-}"

bool_is_true() {
  case "$1" in
    true|TRUE|True|1|yes|YES|Yes) return 0 ;;
    *) return 1 ;;
  esac
}

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

pip_install() {
  local python_bin="$1"
  shift
  local pip_args=()
  if [[ -n "$PIP_INDEX_URL" ]]; then
    pip_args+=(-i "$PIP_INDEX_URL")
  fi
  if [[ -n "$PIP_TRUSTED_HOST" ]]; then
    pip_args+=(--trusted-host "$PIP_TRUSTED_HOST")
  fi
  as_app "$python_bin" -m pip install "${pip_args[@]}" "$@"
}

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Missing $ENV_FILE. Run ops/provision-vps.sh first." >&2
  exit 1
fi

"${SUDO[@]}" mkdir -p "$RELEASE_DIR" "$FRONTEND_RELEASE_DIR" "${APP_ROOT}/shared" "${FRONTEND_ROOT}/releases"
"${SUDO[@]}" tar -xzf "$REMOTE_ARTIFACT" -C "$RELEASE_DIR"
"${SUDO[@]}" rsync -a --delete "$RELEASE_DIR/frontend-dist/" "$FRONTEND_RELEASE_DIR/"
"${SUDO[@]}" chown -R "${APP_USER}:${APP_USER}" "$RELEASE_DIR" "${APP_ROOT}/shared"
"${SUDO[@]}" chown -R www-data:www-data "$FRONTEND_RELEASE_DIR"

as_app python3 -m venv "$RELEASE_DIR/backend/.venv"
pip_install "$RELEASE_DIR/backend/.venv/bin/python" --upgrade pip setuptools wheel
pip_install "$RELEASE_DIR/backend/.venv/bin/python" -r "$RELEASE_DIR/backend/requirements.txt"

"${SUDO[@]}" ln -sfn "$RELEASE_DIR" "${APP_ROOT}/current"
"${SUDO[@]}" ln -sfn "$FRONTEND_RELEASE_DIR" "${FRONTEND_ROOT}/current"

if bool_is_true "$RUN_ALEMBIC"; then
  as_app bash -lc "set -a; source '$ENV_FILE'; set +a; cd '${APP_ROOT}/current/backend'; .venv/bin/python -m alembic upgrade head"
fi

"${SUDO[@]}" systemctl daemon-reload
"${SUDO[@]}" systemctl restart "$SERVICE_NAME"
"${SUDO[@]}" nginx -t
"${SUDO[@]}" systemctl reload nginx

sleep 2
curl -fsS "http://127.0.0.1:${BACKEND_PORT}/health"
echo
"${SUDO[@]}" systemctl --no-pager --full status "$SERVICE_NAME" | sed -n '1,18p'

"${SUDO[@]}" rm -f "$REMOTE_ARTIFACT"

mapfile -t old_app_releases < <(ls -1dt "${APP_ROOT}/releases"/* 2>/dev/null | tail -n +"$((KEEP_RELEASES + 1))" || true)
if (( ${#old_app_releases[@]} > 0 )); then
  "${SUDO[@]}" rm -rf "${old_app_releases[@]}"
fi

mapfile -t old_frontend_releases < <(ls -1dt "${FRONTEND_ROOT}/releases"/* 2>/dev/null | tail -n +"$((KEEP_RELEASES + 1))" || true)
if (( ${#old_frontend_releases[@]} > 0 )); then
  "${SUDO[@]}" rm -rf "${old_frontend_releases[@]}"
fi
REMOTE_SCRIPT

cat <<EOF
Deploy complete.

Release: ${release_id}
API URL baked into frontend: ${api_url}
EOF
