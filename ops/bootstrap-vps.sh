#!/usr/bin/env bash
set -euo pipefail

CONFIG_FILE=""
APPLY=false

usage() {
  cat <<'EOF'
Usage:
  sudo bash ops/bootstrap-vps.sh --env /path/to/codon-vps.local.env --apply
  bash ops/bootstrap-vps.sh --env ops/codon-vps.env.example --dry-run

This script runs on the VPS. It hardens SSH/UFW, installs runtime packages,
creates the Codon service user, writes Nginx and systemd config, and optionally
requests a Let's Encrypt certificate.
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

if [[ -n "$CONFIG_FILE" ]]; then
  if [[ ! -f "$CONFIG_FILE" ]]; then
    echo "Config file not found: $CONFIG_FILE" >&2
    exit 1
  fi
  # shellcheck source=/dev/null
  source "$CONFIG_FILE"
fi

APP_NAME="${APP_NAME:-codon}"
APP_USER="${APP_USER:-codon}"
APP_ROOT="${APP_ROOT:-/opt/codon}"
FRONTEND_ROOT="${FRONTEND_ROOT:-/var/www/codon}"
BACKEND_PORT="${BACKEND_PORT:-8000}"
SSH_PORT="${SSH_PORT:-22222}"
BOOTSTRAP_SSH_PORT="${BOOTSTRAP_SSH_PORT:-22}"
DOMAIN="${DOMAIN:-_}"
ENABLE_HTTPS="${ENABLE_HTTPS:-false}"
LETSENCRYPT_EMAIL="${LETSENCRYPT_EMAIL:-}"
RESET_UFW_RULES="${RESET_UFW_RULES:-true}"
COPY_ROOT_AUTHORIZED_KEYS="${COPY_ROOT_AUTHORIZED_KEYS:-true}"
INSTALL_NODESOURCE="${INSTALL_NODESOURCE:-false}"
NODE_MAJOR="${NODE_MAJOR:-22}"
RUN_ALEMBIC="${RUN_ALEMBIC:-true}"

DATABASE_URL="${DATABASE_URL:-sqlite:////opt/codon/shared/codon.db}"
REDIS_URL="${REDIS_URL:-redis://127.0.0.1:6379/0}"
CELERY_BROKER_URL="${CELERY_BROKER_URL:-redis://127.0.0.1:6379/0}"
CELERY_RESULT_BACKEND="${CELERY_RESULT_BACKEND:-redis://127.0.0.1:6379/1}"
LLM_API_KEY="${LLM_API_KEY:-}"
LLM_BASE_URL="${LLM_BASE_URL:-https://api.openai.com/v1}"
LLM_MODEL="${LLM_MODEL:-gpt-4o}"
LLM_PROTEIN_EXPLANATIONS_ENABLED="${LLM_PROTEIN_EXPLANATIONS_ENABLED:-false}"
BACKEND_CORS_ORIGINS="${BACKEND_CORS_ORIGINS:-}"
BACKEND_SECRET_KEY="${BACKEND_SECRET_KEY:-}"

bool_is_true() {
  case "$1" in
    true|TRUE|True|1|yes|YES|Yes) return 0 ;;
    *) return 1 ;;
  esac
}

validate_port() {
  local name="$1"
  local value="$2"
  if ! [[ "$value" =~ ^[0-9]+$ ]] || (( value < 1 || value > 65535 )); then
    echo "$name must be a TCP port between 1 and 65535, got: $value" >&2
    exit 1
  fi
}

derive_cors_origins() {
  if [[ -n "$BACKEND_CORS_ORIGINS" ]]; then
    printf '%s' "$BACKEND_CORS_ORIGINS"
    return
  fi

  if [[ "$DOMAIN" == "_" || -z "$DOMAIN" ]]; then
    printf '["http://localhost:3000","http://127.0.0.1:3000"]'
  elif bool_is_true "$ENABLE_HTTPS"; then
    printf '["https://%s","http://%s"]' "$DOMAIN" "$DOMAIN"
  else
    printf '["http://%s"]' "$DOMAIN"
  fi
}

print_plan() {
  cat <<EOF
Dry run only. Re-run with --apply on the VPS to make changes.

Planned changes:
- Install packages: nginx, ufw, fail2ban, redis, Python venv tooling, build tools, Node/npm.
- Create service user: ${APP_USER}
- Create app directories:
  - ${APP_ROOT}
  - ${FRONTEND_ROOT}
  - /etc/${APP_NAME}
  - /var/log/${APP_NAME}
- Configure SSH:
  - Port ${SSH_PORT}
  - PasswordAuthentication no
  - KbdInteractiveAuthentication no
  - PermitRootLogin prohibit-password
- Configure UFW:
  - default deny incoming
  - allow ${SSH_PORT}/tcp, 80/tcp, 443/tcp
  - temporarily keep bootstrap SSH port ${BOOTSTRAP_SSH_PORT}/tcp when it differs from ${SSH_PORT}
  - reset existing UFW rules: ${RESET_UFW_RULES}
- Configure Nginx reverse proxy and static frontend for server_name: ${DOMAIN}
- Configure systemd service: ${APP_NAME}-backend.service
- Write backend env file: /etc/${APP_NAME}/${APP_NAME}.env
- Enable optional HTTPS via certbot: ${ENABLE_HTTPS}
EOF
}

if ! $APPLY; then
  print_plan
  exit 0
fi

if [[ "$(id -u)" -ne 0 ]]; then
  echo "Run this script as root, for example: sudo bash $0 --env <config> --apply" >&2
  exit 1
fi

validate_port SSH_PORT "$SSH_PORT"
validate_port BACKEND_PORT "$BACKEND_PORT"

if [[ "$SSH_PORT" == "80" || "$SSH_PORT" == "443" || "$SSH_PORT" == "$BACKEND_PORT" ]]; then
  echo "SSH_PORT must not conflict with 80, 443, or BACKEND_PORT." >&2
  exit 1
fi

if bool_is_true "$ENABLE_HTTPS"; then
  if [[ "$DOMAIN" == "_" || -z "$DOMAIN" || -z "$LETSENCRYPT_EMAIL" ]]; then
    echo "ENABLE_HTTPS=true requires DOMAIN and LETSENCRYPT_EMAIL." >&2
    exit 1
  fi
fi

if [[ ! -s /root/.ssh/authorized_keys && ! -s "/home/${APP_USER}/.ssh/authorized_keys" ]]; then
  echo "No SSH authorized_keys found for root or ${APP_USER}. Refusing to disable password login." >&2
  exit 1
fi

export DEBIAN_FRONTEND=noninteractive
apt-get update
apt-get install -y --no-install-recommends \
  ca-certificates \
  curl \
  fail2ban \
  git \
  gnupg \
  lsb-release \
  nginx \
  npm \
  nodejs \
  openssl \
  pkg-config \
  python3 \
  python3-dev \
  python3-pip \
  python3-venv \
  redis-server \
  rsync \
  tar \
  ufw \
  build-essential

if bool_is_true "$INSTALL_NODESOURCE"; then
  curl -fsSL "https://deb.nodesource.com/setup_${NODE_MAJOR}.x" -o /tmp/nodesource_setup.sh
  bash /tmp/nodesource_setup.sh
  apt-get install -y nodejs
fi

node_major="$(node -p "Number(process.versions.node.split('.')[0])" 2>/dev/null || echo 0)"
if (( node_major < 18 )); then
  echo "Node.js 18+ is required. Set INSTALL_NODESOURCE=true or install Node.js manually." >&2
  exit 1
fi

if ! getent group "$APP_USER" >/dev/null 2>&1; then
  groupadd --system "$APP_USER"
fi

if ! id "$APP_USER" >/dev/null 2>&1; then
  useradd --system --create-home --gid "$APP_USER" --shell /usr/sbin/nologin "$APP_USER"
fi

install -d -m 0755 -o "$APP_USER" -g "$APP_USER" "$APP_ROOT" "$APP_ROOT/releases" "$APP_ROOT/shared"
install -d -m 0755 -o www-data -g www-data "$FRONTEND_ROOT" "$FRONTEND_ROOT/releases"
install -d -m 0750 -o root -g "$APP_USER" "/etc/${APP_NAME}"
install -d -m 0755 -o "$APP_USER" -g "$APP_USER" "/var/log/${APP_NAME}"
install -d -m 0755 -o "$APP_USER" -g "$APP_USER" "$APP_ROOT/shared/uploads"

if bool_is_true "$COPY_ROOT_AUTHORIZED_KEYS" && [[ -s /root/.ssh/authorized_keys ]]; then
  install -d -m 0700 -o "$APP_USER" -g "$APP_USER" "/home/${APP_USER}/.ssh"
  install -m 0600 -o "$APP_USER" -g "$APP_USER" /root/.ssh/authorized_keys "/home/${APP_USER}/.ssh/authorized_keys"
fi

if [[ -z "$BACKEND_SECRET_KEY" ]]; then
  BACKEND_SECRET_KEY="$(openssl rand -hex 32)"
fi

auth_cookie_secure=false
auth_cookie_samesite=lax
if bool_is_true "$ENABLE_HTTPS"; then
  auth_cookie_secure=true
  auth_cookie_samesite=none
fi

cors_origins="$(derive_cors_origins)"

cat >"/etc/${APP_NAME}/${APP_NAME}.env" <<EOF
APP_NAME=CodonBackend
VERSION=1.0.0
DEBUG=false
DATABASE_URL=${DATABASE_URL}
DB_CONNECT_TIMEOUT_SECONDS=10
REDIS_URL=${REDIS_URL}
SECRET_KEY=${BACKEND_SECRET_KEY}
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
AUTH_COOKIE_NAME=access_token
AUTH_COOKIE_MAX_AGE_DAYS=30
AUTH_COOKIE_SECURE=${auth_cookie_secure}
AUTH_COOKIE_SAMESITE=${auth_cookie_samesite}
ARTIFACT_STORAGE_DIR=${APP_ROOT}/shared/uploads
MAX_UPLOAD_BYTES=10485760
VIEW_SCHEMA_VERSION=2026-03-24
CELERY_BROKER_URL=${CELERY_BROKER_URL}
CELERY_RESULT_BACKEND=${CELERY_RESULT_BACKEND}
LLM_API_KEY=${LLM_API_KEY}
LLM_BASE_URL=${LLM_BASE_URL}
LLM_MODEL=${LLM_MODEL}
LLM_MAX_TOKENS=4096
LLM_TEMPERATURE=0.3
LLM_PROTEIN_EXPLANATIONS_ENABLED=${LLM_PROTEIN_EXPLANATIONS_ENABLED}
CORS_ORIGINS='${cors_origins}'
CORS_ORIGIN_REGEX=
PORT=${BACKEND_PORT}
EOF
chown root:"$APP_USER" "/etc/${APP_NAME}/${APP_NAME}.env"
chmod 0640 "/etc/${APP_NAME}/${APP_NAME}.env"

cat >"/etc/ssh/sshd_config.d/99-${APP_NAME}-hardening.conf" <<EOF
Port ${SSH_PORT}
PubkeyAuthentication yes
PasswordAuthentication no
KbdInteractiveAuthentication no
ChallengeResponseAuthentication no
PermitEmptyPasswords no
PermitRootLogin prohibit-password
X11Forwarding no
MaxAuthTries 3
ClientAliveInterval 300
ClientAliveCountMax 2
EOF
sshd -t
if systemctl list-unit-files ssh.socket >/dev/null 2>&1; then
  install -d -m 0755 /etc/systemd/system/ssh.socket.d
  cat >"/etc/systemd/system/ssh.socket.d/99-${APP_NAME}-port.conf" <<EOF
[Socket]
ListenStream=
ListenStream=0.0.0.0:${SSH_PORT}
ListenStream=[::]:${SSH_PORT}
EOF
  systemctl daemon-reload
  systemctl restart ssh.socket
fi
systemctl reload ssh || systemctl reload sshd

cat >"/etc/fail2ban/jail.d/${APP_NAME}-sshd.local" <<EOF
[sshd]
enabled = true
port = ${SSH_PORT}
maxretry = 5
findtime = 10m
bantime = 1h
EOF
systemctl enable --now fail2ban
systemctl restart fail2ban

if bool_is_true "$RESET_UFW_RULES"; then
  ufw --force reset
fi
ufw default deny incoming
ufw default allow outgoing
ufw allow "${SSH_PORT}/tcp" comment "Codon SSH"
if [[ "$BOOTSTRAP_SSH_PORT" != "$SSH_PORT" ]]; then
  ufw allow "${BOOTSTRAP_SSH_PORT}/tcp" comment "Temporary bootstrap SSH"
fi
ufw allow 80/tcp comment "HTTP"
ufw allow 443/tcp comment "HTTPS"
ufw --force enable

cat >"/etc/nginx/sites-available/${APP_NAME}.conf" <<EOF
server {
    listen 80;
    server_name ${DOMAIN};

    root ${FRONTEND_ROOT}/current;
    index index.html;
    client_max_body_size 20m;

    add_header X-Content-Type-Options nosniff always;
    add_header X-Frame-Options SAMEORIGIN always;
    add_header Referrer-Policy strict-origin-when-cross-origin always;

    location /api/ {
        proxy_pass http://127.0.0.1:${BACKEND_PORT};
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_read_timeout 180s;
    }

    location /health {
        proxy_pass http://127.0.0.1:${BACKEND_PORT}/health;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    location /api/docs {
        proxy_pass http://127.0.0.1:${BACKEND_PORT}/api/docs;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    location /api/redoc {
        proxy_pass http://127.0.0.1:${BACKEND_PORT}/api/redoc;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    location / {
        try_files \$uri \$uri/ /index.html;
    }
}
EOF
ln -sfn "/etc/nginx/sites-available/${APP_NAME}.conf" "/etc/nginx/sites-enabled/${APP_NAME}.conf"
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl enable --now nginx
systemctl reload nginx

cat >"/etc/systemd/system/${APP_NAME}-backend.service" <<EOF
[Unit]
Description=Codon FastAPI backend
After=network.target redis-server.service
Wants=redis-server.service

[Service]
Type=simple
User=${APP_USER}
Group=${APP_USER}
WorkingDirectory=${APP_ROOT}/current/backend
EnvironmentFile=/etc/${APP_NAME}/${APP_NAME}.env
ExecStart=${APP_ROOT}/current/backend/.venv/bin/python -m uvicorn app.main:app --host 127.0.0.1 --port ${BACKEND_PORT}
Restart=on-failure
RestartSec=5
NoNewPrivileges=true
PrivateTmp=true
ProtectHome=true
ReadWritePaths=${APP_ROOT} /var/log/${APP_NAME}

[Install]
WantedBy=multi-user.target
EOF
systemctl daemon-reload
systemctl enable "${APP_NAME}-backend.service"
systemctl enable --now redis-server

if bool_is_true "$ENABLE_HTTPS"; then
  apt-get install -y --no-install-recommends certbot python3-certbot-nginx
  certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos -m "$LETSENCRYPT_EMAIL" --redirect
fi

cat <<EOF
Bootstrap complete.

Important:
- Open a new terminal and verify SSH before closing this session:
  ssh -p ${SSH_PORT} <user>@<host>
- Backend service is installed but will stay inactive until the first deploy creates:
  ${APP_ROOT}/current/backend/.venv
- Current firewall:
EOF
ufw status verbose
