#!/usr/bin/env bash
# Создаёт .env (права 600) с автоматически сгенерированным NEXTAUTH_SECRET и DATABASE_URL.
# Запускать под deploy из любого места:  bash deploy/init-env.sh
set -euo pipefail
APP_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$APP_DIR"

die() { echo -e "\033[1;31m[x] $*\033[0m" >&2; exit 1; }
[[ -f $HOME/db_url.txt ]] || die "Нет ~/db_url.txt — сначала выполните setup-server.sh."

if [[ -f .env ]]; then
  read -r -p ".env уже существует. Перезаписать? [y/N] " a
  [[ ${a:-N} =~ ^[yY]$ ]] || { echo "Отменено."; exit 0; }
  cp .env ".env.bak.$(date +%s)"
fi

DEF_DOMAIN="$(cat "$HOME/.domain" 2>/dev/null || true)"
read -r -p "Домен [${DEF_DOMAIN}]: " DOMAIN; DOMAIN="${DOMAIN:-$DEF_DOMAIN}"
[[ -n $DOMAIN ]] || die "Домен обязателен."

echo; echo "LiveKit Cloud (cloud.livekit.io → Settings → Keys). Пусто = звонки отключены."
read -r -p "LIVEKIT_URL (wss://xxx.livekit.cloud): " LK_URL
LK_KEY=""; LK_SECRET=""
if [[ -n $LK_URL ]]; then
  read -r -p "LIVEKIT_API_KEY: " LK_KEY
  read -rs -p "LIVEKIT_API_SECRET: " LK_SECRET; echo
fi

echo; echo "Почта (SMTP)"
read -r -p "SMTP_HOST [smtp.beget.com]: " SMTP_HOST; SMTP_HOST="${SMTP_HOST:-smtp.beget.com}"
read -r -p "SMTP_PORT [465]: " SMTP_PORT; SMTP_PORT="${SMTP_PORT:-465}"
read -r -p "SMTP_USER [notification@ddm-team.ru]: " SMTP_USER; SMTP_USER="${SMTP_USER:-notification@ddm-team.ru}"
read -rs -p "SMTP_PASS: " SMTP_PASS; echo
SMTP_SECURE="true"; [[ $SMTP_PORT == "465" ]] || SMTP_SECURE="false"

for v in "$DOMAIN" "$LK_URL" "$LK_KEY" "$LK_SECRET" "$SMTP_HOST" "$SMTP_USER" "$SMTP_PASS"; do
  [[ $v != *'"'* && $v != *$'\n'* && $v != *'\'* ]] || die "Значения не должны содержать \" \\ и переводы строк."
done
# Next.js раскрывает \$ как $; без экранирования символ $ в пароле был бы потерян
esc() { printf '%s' "$1" | sed 's/\$/\\$/g'; }

umask 077
{
  echo "DATABASE_URL=\"$(cat "$HOME/db_url.txt")\""
  echo
  echo "NEXTAUTH_URL=\"https://${DOMAIN}\""
  echo "NEXTAUTH_SECRET=\"$(openssl rand -base64 32)\""
  echo
  echo "LIVEKIT_URL=\"$(esc "$LK_URL")\""
  echo "NEXT_PUBLIC_LIVEKIT_URL=\"$(esc "$LK_URL")\""
  echo "LIVEKIT_API_KEY=\"$(esc "$LK_KEY")\""
  echo "LIVEKIT_API_SECRET=\"$(esc "$LK_SECRET")\""
  echo
  echo "SMTP_HOST=\"$(esc "$SMTP_HOST")\""
  echo "SMTP_PORT=\"${SMTP_PORT}\""
  echo "SMTP_SECURE=\"${SMTP_SECURE}\""
  echo "SMTP_USER=\"$(esc "$SMTP_USER")\""
  echo "SMTP_PASS=\"$(esc "$SMTP_PASS")\""
} > .env
chmod 600 .env
echo -e "\n✔ .env создан ($APP_DIR/.env, права 600). Следующий шаг: bash deploy/deploy.sh"
