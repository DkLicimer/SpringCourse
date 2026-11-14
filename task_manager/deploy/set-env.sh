#!/usr/bin/env bash
# Меняет одну группу настроек в .env, не трогая остальное (перед этим делает копию .env.bak.*).
#   bash deploy/set-env.sh smtp      — почта; после сохранения приложение перезапускается
#   bash deploy/set-env.sh livekit   — LiveKit; после сохранения выполняется пересборка
#                                      (NEXT_PUBLIC_LIVEKIT_URL вшивается в код при сборке)
set -euo pipefail
APP_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$APP_DIR"

warn() { echo -e "\033[1;33m[!] $*\033[0m"; }
die()  { echo -e "\033[1;31m[x] $*\033[0m" >&2; exit 1; }

MODE="${1:-}"
[[ $MODE == "smtp" || $MODE == "livekit" ]] || die "Использование: bash deploy/set-env.sh smtp|livekit"
[[ -f .env ]] || die "Нет .env — сначала bash deploy/init-env.sh"

# Next.js раскрывает \$ как $; без экранирования символ $ в значении был бы потерян
esc() { printf '%s' "$1" | sed 's/\$/\\$/g'; }
check() {
  local v
  for v in "$@"; do
    [[ $v != *'"'* && $v != *$'\n'* && $v != *'\'* ]] || die "Значения не должны содержать \" \\ и переводы строк."
  done
}
# replace_block 'regex-имён-переменных' < новые-строки : удаляет старые строки и дописывает новые
replace_block() {
  local re="$1" tmp
  umask 077
  cp .env ".env.bak.$(date +%s)"
  tmp="$(mktemp ./.env.tmp.XXXXXX)"
  grep -Ev "$re" .env > "$tmp" || true
  [[ -z "$(tail -c1 "$tmp")" ]] || echo >> "$tmp"
  cat >> "$tmp"
  mv "$tmp" .env
  chmod 600 .env
}

if [[ $MODE == "smtp" ]]; then
  echo "Настройки SMTP (для внешнего сервиса логин часто НЕ совпадает с адресом отправителя)."
  read -r -p "SMTP_HOST [smtp.timeweb.ru]: " H; H="${H:-smtp.timeweb.ru}"
  read -r -p "SMTP_PORT (465 = SSL, 587 = STARTTLS) [465]: " P; P="${P:-465}"
  read -r -p "Логин SMTP (SMTP_USER) [notification@ddm-team.ru]: " U; U="${U:-notification@ddm-team.ru}"
  read -rs -p "Пароль SMTP: " PW; echo
  DEF_FROM=""; [[ $U == *@* ]] && DEF_FROM="$U"
  read -r -p "Адрес отправителя (From)${DEF_FROM:+ [$DEF_FROM]}: " F; F="${F:-$DEF_FROM}"
  [[ -n $PW ]] || die "Пароль не введён."
  [[ $P =~ ^[0-9]+$ ]] || die "Порт должен быть числом."
  [[ $F =~ ^[^[:space:]@\"\'\<\>]+@[^[:space:]@\"\'\<\>]+\.[^[:space:]@\"\'\<\>]+$ ]] || die "Укажите корректный адрес отправителя, например notification@ddm-team.ru (домен должен быть подтверждён в почтовом сервисе)."
  check "$H" "$U" "$PW"
  SECURE="true"; [[ $P == "465" ]] || SECURE="false"
  replace_block '^(SMTP_HOST|SMTP_PORT|SMTP_SECURE|SMTP_USER|SMTP_PASS|SMTP_FROM)=' <<ENV
SMTP_HOST="$(esc "$H")"
SMTP_PORT="$P"
SMTP_SECURE="$SECURE"
SMTP_USER="$(esc "$U")"
SMTP_PASS="$(esc "$PW")"
SMTP_FROM='"Task Manager" <$F>'
ENV
  echo "✔ Настройки почты сохранены."
  if command -v pm2 &>/dev/null; then
    pm2 restart taskmanager --update-env >/dev/null && echo "✔ Приложение перезапущено."
  else
    warn "pm2 не найден — перезапустите приложение вручную."
  fi
  echo
  echo "Проверка отправки:  node deploy/test-mail.js ваш-адрес@gmail.com"
else
  read -r -p "LIVEKIT_URL (wss://xxx.livekit.cloud): " URL
  [[ $URL =~ ^wss://[A-Za-z0-9.-]+$ ]] || die "Адрес должен выглядеть как wss://имя-проекта.livekit.cloud"
  read -r -p "LIVEKIT_API_KEY: " KEY
  read -rs -p "LIVEKIT_API_SECRET: " SECRET; echo
  [[ -n $KEY && -n $SECRET ]] || die "Ключ и секрет обязательны."
  check "$URL" "$KEY" "$SECRET"
  replace_block '^(LIVEKIT_URL|NEXT_PUBLIC_LIVEKIT_URL|LIVEKIT_API_KEY|LIVEKIT_API_SECRET)=' <<ENV
LIVEKIT_URL="$URL"
NEXT_PUBLIC_LIVEKIT_URL="$URL"
LIVEKIT_API_KEY="$(esc "$KEY")"
LIVEKIT_API_SECRET="$(esc "$SECRET")"
ENV
  echo "✔ Настройки LiveKit сохранены. Запускаю пересборку (несколько минут)..."
  bash "$APP_DIR/deploy/deploy.sh" --no-pull
fi
