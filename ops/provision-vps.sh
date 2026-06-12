#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONFIG_FILE="${SCRIPT_DIR}/codon-vps.local.env"
APPLY=false

usage() {
  cat <<'EOF'
Usage:
  ops/provision-vps.sh --env ops/codon-vps.local.env --apply
  ops/provision-vps.sh --env ops/codon-vps.env.example --dry-run

This local script uploads ops/bootstrap-vps.sh and the config file to the VPS,
then runs the remote bootstrap script. Use BOOTSTRAP_SSH_PORT for the current
SSH port and SSH_PORT for the hardened port that will be configured.
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
BOOTSTRAP_SSH_PORT="${BOOTSTRAP_SSH_PORT:-22}"
SSH_PORT="${SSH_PORT:-22222}"
SSH_IDENTITY_FILE="${SSH_IDENTITY_FILE:-}"

if [[ -z "$REMOTE_HOST" || "$REMOTE_HOST" == "your-server-ip-or-domain" ]]; then
  echo "Set REMOTE_HOST in $CONFIG_FILE." >&2
  exit 1
fi

ssh_opts=(-p "$BOOTSTRAP_SSH_PORT" -o IdentitiesOnly=yes)
scp_opts=(-P "$BOOTSTRAP_SSH_PORT" -o IdentitiesOnly=yes)
if [[ -n "$SSH_IDENTITY_FILE" ]]; then
  ssh_opts+=(-i "$SSH_IDENTITY_FILE")
  scp_opts+=(-i "$SSH_IDENTITY_FILE")
fi

remote="${REMOTE_USER}@${REMOTE_HOST}"
remote_tmp="/tmp/codon-bootstrap-$(date +%Y%m%d%H%M%S)"

if ! $APPLY; then
  cat <<EOF
Dry run only. Re-run with --apply to provision the VPS.

Would connect to: ${remote}
Current SSH port: ${BOOTSTRAP_SSH_PORT}
Hardened SSH port to configure: ${SSH_PORT}
Would upload:
- ${SCRIPT_DIR}/bootstrap-vps.sh
- ${CONFIG_FILE}
Would run on VPS:
- sudo/root bash ${remote_tmp}/bootstrap-vps.sh --env ${remote_tmp}/codon-vps.env --apply
EOF
  exit 0
fi

if [[ ! -f "${SCRIPT_DIR}/bootstrap-vps.sh" ]]; then
  echo "Missing ${SCRIPT_DIR}/bootstrap-vps.sh" >&2
  exit 1
fi

ssh "${ssh_opts[@]}" "$remote" "mkdir -p '$remote_tmp'"
scp "${scp_opts[@]}" "${SCRIPT_DIR}/bootstrap-vps.sh" "$CONFIG_FILE" "$remote:${remote_tmp}/"
ssh "${ssh_opts[@]}" "$remote" "mv '${remote_tmp}/$(basename "$CONFIG_FILE")' '${remote_tmp}/codon-vps.env' && chmod +x '${remote_tmp}/bootstrap-vps.sh'"

if [[ "$REMOTE_USER" == "root" ]]; then
  ssh "${ssh_opts[@]}" "$remote" "bash '${remote_tmp}/bootstrap-vps.sh' --env '${remote_tmp}/codon-vps.env' --apply; rm -rf '${remote_tmp}'"
else
  ssh "${ssh_opts[@]}" "$remote" "sudo bash '${remote_tmp}/bootstrap-vps.sh' --env '${remote_tmp}/codon-vps.env' --apply; rm -rf '${remote_tmp}'"
fi

cat <<EOF
Provisioning finished.

Before running deploy, verify a fresh SSH login on the hardened port:
  ssh -p ${SSH_PORT} ${REMOTE_USER}@${REMOTE_HOST}
EOF
