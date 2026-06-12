# Codon VPS Operations

These scripts provide a self-hosted VPS path for Codon. They do not replace the
current Vercel + Render + Supabase production path documented in the project
memory. They are for a single Ubuntu VPS with Nginx in front of a systemd-managed
FastAPI backend.

## Files

- `codon-vps.env.example`: configuration template. Copy it to
  `codon-vps.local.env`; the local file is ignored by git.
- `provision-vps.sh`: local one-click operations wrapper. It uploads and runs
  `bootstrap-vps.sh` on the VPS.
- `bootstrap-vps.sh`: remote bootstrap script. It hardens SSH/UFW, installs
  packages, writes Nginx/systemd config, and prepares the Codon directories.
- `deploy-vps.sh`: local deployment script. It builds, packages, uploads,
  activates a release, restarts the backend, reloads Nginx, and checks `/health`.
- `sync-vps-git.sh`: local Git sync helper. It creates or fast-forwards a
  pull-only Git working copy on the VPS, separate from active release symlinks.

## First-Time Provision

```bash
cp ops/codon-vps.env.example ops/codon-vps.local.env
$EDITOR ops/codon-vps.local.env
ops/provision-vps.sh --env ops/codon-vps.local.env --dry-run
ops/provision-vps.sh --env ops/codon-vps.local.env --apply
```

Important fields:

- `BOOTSTRAP_SSH_PORT`: the current SSH port before hardening, usually `22`.
- `SSH_PORT`: the custom SSH port kept after hardening.
- `REMOTE_HOST`: VPS IP or domain.
- `SSH_IDENTITY_FILE`: private key path on this Mac.
- `DOMAIN`: public domain. Use a real domain if `ENABLE_HTTPS=true`.
- `PIP_INDEX_URL`: Python package index used on the VPS during backend install.
  The default example uses Aliyun's PyPI mirror for faster installs on Alibaba
  Cloud.

After provisioning, open a new terminal and verify SSH on the hardened port
before closing the old session:

```bash
ssh -p "$SSH_PORT" "$REMOTE_USER@$REMOTE_HOST"
```

## Deploy

```bash
ops/deploy-vps.sh --env ops/codon-vps.local.env --dry-run
ops/deploy-vps.sh --env ops/codon-vps.local.env --apply
```

The deploy script:

- runs `npm ci` and `npm run build` in `frontend/`
- sets `VITE_API_URL` for the production bundle
- packages `backend/` while excluding local envs, DB files, `venv`, and caches
- installs backend dependencies in a per-release Python venv on the VPS, using
  `PIP_INDEX_URL` and `PIP_TRUSTED_HOST` when configured
- flips `current` symlinks for backend and frontend
- restarts `codon-backend.service`
- verifies `http://127.0.0.1:8000/health` from the VPS
- writes `.codon-release` metadata into the backend release directory

## VPS Git Working Copy

The runtime directories are immutable timestamped releases:

- `/opt/codon/current`
- `/var/www/codon/current`

Do not run `git pull` inside those release directories. For server-side version
inspection and emergency source review, sync the public GitHub repository into a
separate pull-only working copy:

```bash
ops/sync-vps-git.sh --env ops/codon-vps.local.env --dry-run
ops/sync-vps-git.sh --env ops/codon-vps.local.env --apply
```

By default this uses:

- remote: `https://github.com/Con-Benksl/Codon.git`
- branch: `main`
- VPS path: `/opt/codon/repo`

The VPS does not need or store a GitHub write credential for this public HTTPS
remote. Normal deployments should still use `ops/deploy-vps.sh`; the Git working
copy is for version tracking, audit, and controlled pull-only sync.

## Rollback

On the VPS, list releases:

```bash
ls -1dt /opt/codon/releases/*
ls -1dt /var/www/codon/releases/*
```

Switch both symlinks to the same previous release timestamp, then restart:

```bash
sudo ln -sfn /opt/codon/releases/<timestamp> /opt/codon/current
sudo ln -sfn /var/www/codon/releases/<timestamp> /var/www/codon/current
sudo systemctl restart codon-backend.service
sudo nginx -t && sudo systemctl reload nginx
curl -fsS http://127.0.0.1:8000/health
```

## Security Notes

- `bootstrap-vps.sh` refuses to disable password login unless it finds at least
  one `authorized_keys` file for `root` or the Codon service user.
- UFW is reset by default and then only allows the custom SSH port, `80/tcp`,
  and `443/tcp`. Set `RESET_UFW_RULES=false` only if this VPS intentionally runs
  other public services.
- When the bootstrap SSH port differs from the hardened SSH port, keep the old
  SSH session open until a new login on `SSH_PORT` succeeds. Then remove the old
  port from UFW if it was temporarily kept for safety.
- `PermitRootLogin prohibit-password` keeps root key login available while
  blocking root password login.
- Backend secrets live in `/etc/codon/codon.env` on the VPS with mode `0640`.
