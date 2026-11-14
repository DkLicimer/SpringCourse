#!/usr/bin/env bash
# Первичная настройка ЧИСТОГО сервера Ubuntu (24.04 / 26.04), запускать от root.
#
#   bash setup-server.sh --domain example.ru --email you@mail.ru --ssh-key "ssh-ed25519 AAAA... ключ-С-ВАШЕГО-КОМПЬЮТЕРА"
#
# Что делает: пользователь deploy, firewall, fail2ban, автообновления безопасности,
# swap, Node 22 (официальный дистрибутив), pm2, PostgreSQL (только localhost),
# nginx с лимитами, HTTPS (Let's Encrypt), ежедневные бэкапы БД.
# Вход по паролю и под root скрипт НЕ отключает — это делает finish-setup.sh
# после того, как вы проверите вход под deploy (так нельзя случайно потерять доступ).
set -euo pipefail

DOMAIN=""; EMAIL=""; SSH_KEY=""
DEPLOY_USER="deploy"; DB_NAME="task_manager_db"; DB_USER="taskapp"

log()  { echo -e "\n\033[1;34m==> $*\033[0m"; }
warn() { echo -e "\033[1;33m[!] $*\033[0m"; }
die()  { echo -e "\033[1;31m[x] $*\033[0m" >&2; exit 1; }

while [[ $# -gt 0 ]]; do
  case "$1" in
    --domain)  DOMAIN="${2:-}"; shift 2 ;;
    --email)   EMAIL="${2:-}"; shift 2 ;;
    --ssh-key) SSH_KEY="${2:-}"; shift 2 ;;
    *) die "Неизвестный параметр: $1" ;;
  esac
done

[[ $EUID -eq 0 ]] || die "Запускайте от root."
[[ -n $DOMAIN && -n $EMAIL && -n $SSH_KEY ]] || die "Нужны параметры: --domain, --email, --ssh-key"
[[ $DOMAIN =~ ^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$ ]] || die "Некорректный домен."
[[ $SSH_KEY =~ ^(ssh-ed25519|ssh-rsa|ecdsa-sha2-nistp[0-9]+)\  ]] || die "--ssh-key должен быть публичным ключом (ssh-ed25519 AAAA...)."
# Защита от типичной ошибки: передан ключ самого сервера вместо ключа с вашего компьютера
if [[ -f /root/.ssh/id_ed25519.pub ]]; then
  SERVER_KEY_BODY="$(awk '{print $2}' /root/.ssh/id_ed25519.pub)"
  GIVEN_KEY_BODY="$(echo "$SSH_KEY" | awk '{print $2}')"
  [[ $SERVER_KEY_BODY != "$GIVEN_KEY_BODY" ]] || die "Это публичный ключ САМОГО СЕРВЕРА. Нужен ключ с вашего компьютера (Windows): Get-Content \$env:USERPROFILE\\.ssh\\id_ed25519.pub"
fi
. /etc/os-release
[[ ${ID:-} == ubuntu ]] || warn "Скрипт рассчитан на Ubuntu, у вас: ${PRETTY_NAME:-?}"
echo "Система: ${PRETTY_NAME:-?}"

HERE="$(cd "$(dirname "$0")" && pwd)"
[[ -d $HERE/nginx ]] || die "Рядом со скриптом должна лежать папка nginx/."
export DEBIAN_FRONTEND=noninteractive
export NEEDRESTART_MODE=a

log "Обновление системы и установка пакетов"
apt-get update -y
apt-get upgrade -y
apt-get install -y curl git ufw fail2ban python3-systemd unattended-upgrades cron xz-utils \
  nginx certbot python3-certbot-nginx postgresql openssl rsync ca-certificates gnupg

log "Пользователь $DEPLOY_USER и SSH-ключ"
if ! id "$DEPLOY_USER" &>/dev/null; then
  adduser --disabled-password --gecos "" "$DEPLOY_USER"
fi
usermod -aG sudo "$DEPLOY_USER"
echo "$DEPLOY_USER ALL=(ALL) NOPASSWD:ALL" > /etc/sudoers.d/90-$DEPLOY_USER
chmod 440 /etc/sudoers.d/90-$DEPLOY_USER
install -d -m 700 -o "$DEPLOY_USER" -g "$DEPLOY_USER" /home/$DEPLOY_USER/.ssh
AK=/home/$DEPLOY_USER/.ssh/authorized_keys
touch "$AK"
grep -qxF "$SSH_KEY" "$AK" || echo "$SSH_KEY" >> "$AK"
chown "$DEPLOY_USER:$DEPLOY_USER" "$AK"; chmod 600 "$AK"
[[ -s $AK ]] || die "Не удалось записать SSH-ключ."

log "Swap 2 ГБ (нужен для сборки Next.js)"
if [[ -z "$(swapon --show --noheadings)" ]]; then
  fallocate -l 2G /swapfile && chmod 600 /swapfile && mkswap /swapfile && swapon /swapfile
  grep -q '^/swapfile' /etc/fstab || echo '/swapfile none swap sw 0 0' >> /etc/fstab
else
  echo "swap уже есть"
fi

log "Firewall (ufw): открыты только 22, 80, 443"
ufw default deny incoming
ufw default allow outgoing
ufw limit 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

log "fail2ban (защита SSH от перебора)"
cat > /etc/fail2ban/jail.local <<'F2B'
[DEFAULT]
bantime  = 1h
findtime = 10m
maxretry = 5

[sshd]
enabled = true
backend = systemd
F2B
systemctl enable --now fail2ban
systemctl restart fail2ban

log "Автоматические обновления безопасности"
cat > /etc/apt/apt.conf.d/20auto-upgrades <<'APT'
APT::Periodic::Update-Package-Lists "1";
APT::Periodic::Unattended-Upgrade "1";
APT::Periodic::AutocleanInterval "7";
APT
systemctl enable --now unattended-upgrades

log "Node.js 22 (официальный дистрибутив nodejs.org) и pm2"
NODE_MAJOR=0
command -v node &>/dev/null && NODE_MAJOR=$(node -p 'process.versions.node.split(".")[0]')
if (( NODE_MAJOR < 22 )); then
  case "$(uname -m)" in
    x86_64)  NARCH=x64 ;;
    aarch64) NARCH=arm64 ;;
    *) die "Неподдерживаемая архитектура: $(uname -m)" ;;
  esac
  NBASE="https://nodejs.org/dist/latest-v22.x"
  read -r NSHA NFILE < <(curl -fsSL "$NBASE/SHASUMS256.txt" | awk -v a="linux-${NARCH}.tar.xz" '$2 ~ a"$" {print $1, $2; exit}')
  [[ -n ${NFILE:-} && -n ${NSHA:-} ]] || die "Не удалось определить файл Node.js на nodejs.org"
  curl -fsSL "$NBASE/$NFILE" -o "/tmp/$NFILE"
  echo "$NSHA  /tmp/$NFILE" | sha256sum -c -
  tar -xJf "/tmp/$NFILE" -C /usr/local --strip-components=1
  rm -f "/tmp/$NFILE"
  hash -r
fi
echo "node $(node -v), npm $(npm -v)"
npm i -g pm2
env PATH="$PATH:/usr/local/bin:/usr/bin" pm2 startup systemd -u "$DEPLOY_USER" --hp "/home/$DEPLOY_USER" >/dev/null \
  || warn "pm2 startup не настроился — после первого запуска выполните: pm2 startup"

log "PostgreSQL (слушает ТОЛЬКО localhost)"
systemctl enable --now postgresql
PGCONF_DIR="$(ls -d /etc/postgresql/*/main | sort -V | tail -1)"
mkdir -p "$PGCONF_DIR/conf.d"
cat > "$PGCONF_DIR/conf.d/99-taskmanager.conf" <<'PGC'
listen_addresses = 'localhost'
password_encryption = scram-sha-256
PGC
systemctl restart postgresql
cd /tmp
if ! runuser -u postgres -- psql -tAc "SELECT 1 FROM pg_roles WHERE rolname='${DB_USER}'" | grep -q 1; then
  DB_PASS="$(openssl rand -hex 24)"
  runuser -u postgres -- psql -v ON_ERROR_STOP=1 -c "CREATE ROLE ${DB_USER} LOGIN PASSWORD '${DB_PASS}';"
  echo "127.0.0.1:5432:${DB_NAME}:${DB_USER}:${DB_PASS}" > /home/$DEPLOY_USER/.pgpass
  chmod 600 /home/$DEPLOY_USER/.pgpass
  echo "postgresql://${DB_USER}:${DB_PASS}@127.0.0.1:5432/${DB_NAME}" > /home/$DEPLOY_USER/db_url.txt
  chmod 600 /home/$DEPLOY_USER/db_url.txt
  chown "$DEPLOY_USER:$DEPLOY_USER" /home/$DEPLOY_USER/.pgpass /home/$DEPLOY_USER/db_url.txt
  echo "Роль ${DB_USER} создана. Строка подключения: /home/$DEPLOY_USER/db_url.txt"
else
  warn "Роль ${DB_USER} уже существует — пароль не менялся."
fi
if ! runuser -u postgres -- psql -tAc "SELECT 1 FROM pg_database WHERE datname='${DB_NAME}'" | grep -q 1; then
  runuser -u postgres -- createdb -O "${DB_USER}" "${DB_NAME}"
fi
if ss -tln | awk '$4 ~ /:5432$/ {print $4}' | grep -vE '^(127\.0\.0\.1|\[::1\]):5432$' | grep -q .; then
  die "PostgreSQL слушает не только localhost! Проверьте: ss -tlnp | grep 5432"
fi
echo "PostgreSQL слушает только localhost ✔"
echo "$DOMAIN" > /home/$DEPLOY_USER/.domain
chown "$DEPLOY_USER:$DEPLOY_USER" /home/$DEPLOY_USER/.domain

log "nginx"
install -m 644 "$HERE/nginx/limits.conf"         /etc/nginx/conf.d/taskmanager-limits.conf
install -m 644 "$HERE/nginx/default-server.conf" /etc/nginx/conf.d/00-default-server.conf
install -m 644 "$HERE/nginx/proxy_app.conf"      /etc/nginx/proxy_app.conf
sed "s/__DOMAIN__/${DOMAIN}/g" "$HERE/nginx/taskmanager.conf" > /etc/nginx/sites-available/taskmanager
ln -sf /etc/nginx/sites-available/taskmanager /etc/nginx/sites-enabled/taskmanager
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl enable --now nginx
systemctl reload nginx

log "Ежедневный бэкап БД (03:00)"
install -m 755 "$HERE/backup.sh" /usr/local/bin/taskmanager-backup
install -d -m 700 -o "$DEPLOY_USER" -g "$DEPLOY_USER" /home/$DEPLOY_USER/backups
cat > /etc/cron.d/taskmanager-backup <<CRON
0 3 * * * $DEPLOY_USER /usr/local/bin/taskmanager-backup >> /home/$DEPLOY_USER/backups/backup.log 2>&1
CRON
chmod 644 /etc/cron.d/taskmanager-backup
systemctl enable --now cron 2>/dev/null || true

log "HTTPS (Let's Encrypt)"
if certbot --nginx -d "$DOMAIN" -m "$EMAIL" --agree-tos --no-eff-email --non-interactive --redirect; then
  echo "HTTPS настроен, автопродление включено."
else
  warn "Сертификат не выпущен. Проверьте, что A-запись домена указывает на этот сервер (nslookup $DOMAIN 8.8.8.8), и повторите:"
  warn "  certbot --nginx -d $DOMAIN -m $EMAIL --agree-tos --redirect"
fi

[[ -f /var/run/reboot-required ]] && warn "Система просит перезагрузку (обновлено ядро). Сделайте её после finish-setup.sh: reboot"

cat <<DONE

════════════════════════════════════════════════════════════
 Сервер настроен. Вход по паролю и под root ПОКА РАБОТАЕТ.

 ДАЛЬШЕ:
 1) Откройте НОВОЕ окно PowerShell на вашем компьютере и проверьте вход по ключу:
        ssh $DEPLOY_USER@<IP-сервера>
    Он должен пустить БЕЗ запроса пароля.
 2) Вернитесь в это окно (root) и выполните:
        bash $HERE/finish-setup.sh
    Он перенесёт проект к пользователю $DEPLOY_USER и (после вашего подтверждения)
    отключит вход по паролю и под root.
════════════════════════════════════════════════════════════
DONE
