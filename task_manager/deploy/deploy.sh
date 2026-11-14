#!/usr/bin/env bash
# Первый запуск И последующие обновления:  bash deploy/deploy.sh   (опция --no-pull — не делать git pull)
# Порядок: проверки → git pull → бэкап БД → зависимости → миграции → сборка → (пере)запуск pm2.
set -euo pipefail
APP_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$APP_DIR"

log()  { echo -e "\n\033[1;34m==> $*\033[0m"; }
warn() { echo -e "\033[1;33m[!] $*\033[0m"; }
die()  { echo -e "\033[1;31m[x] $*\033[0m" >&2; exit 1; }

PULL=1; for a in "$@"; do [[ $a == "--no-pull" ]] && PULL=0; done

log "Проверки безопасности"
[[ -f package.json && -f prisma.config.ts ]] || die "Запускайте из проекта (нет package.json / prisma.config.ts в $APP_DIR)."
[[ -f .env ]] || die "Нет .env — выполните: bash deploy/init-env.sh"
if git rev-parse --is-inside-work-tree &>/dev/null && git ls-files --error-unmatch .env &>/dev/null; then
  die ".env добавлен в git! Удалите: git rm --cached .env, добавьте в .gitignore и СМЕНИТЕ все пароли."
fi
[[ ! -e src/app/api/livekit/diag ]] || die "Найден src/app/api/livekit/diag — небезопасный маршрут. Удалите папку (git rm -r) и закоммитьте."
[[ ! -e prisma/seed.js ]] || die "Найден prisma/seed.js — он СТИРАЕТ все данные. Удалите (git rm prisma/seed.js) и закоммитьте."
[[ ! -e prisma/create-deputy-admin.js ]] || die "Найден prisma/create-deputy-admin.js — создаёт второго админа с известным паролем. Удалите и закоммитьте."
! grep -qE 'console\.log.*DATABASE_URL' src/lib/prisma.ts || die "src/lib/prisma.ts пишет DATABASE_URL в лог — замените файлом из комплекта."
grep -q '"livekit-server-sdk"' package.json || die "В package.json нет livekit-server-sdk — используйте package.json из комплекта."
grep -q 'MAX_FAILS_PER_ACCOUNT_IP' src/lib/auth.ts || warn "В src/lib/auth.ts нет защиты от перебора паролей (файл из комплекта не применён)."
grep -rqs 'CREATE TYPE "ProtocolStatus"' prisma/migrations || die "В prisma/migrations нет миграции 20261113000000_sync_schema. Без неё на сервере создастся неполная база. Скопируйте её из комплекта, закоммитьте и сделайте git push."
NODE_MAJOR=$(node -p 'process.versions.node.split(".")[0]')
(( NODE_MAJOR >= 22 )) || die "Нужен Node 22+, сейчас $(node -v)."

if (( PULL )) && git rev-parse --is-inside-work-tree &>/dev/null; then
  log "git pull"
  git pull --ff-only
fi

log "Резервная копия БД перед обновлением"
if command -v taskmanager-backup &>/dev/null; then
  taskmanager-backup || warn "Бэкап не удался (на самом первом запуске это нормально)."
else
  warn "taskmanager-backup не найден — бэкап пропущен."
fi

log "Зависимости"
npm ci --no-audit --no-fund || { warn "npm ci не прошёл (package-lock не совпадает) — пробую npm install"; npm install --no-audit --no-fund; }

log "Prisma: generate + миграции (данные не удаляются)"
npx prisma generate
npx prisma migrate deploy

log "Сборка"
npm run build

log "Запуск через pm2"
pm2 startOrReload ecosystem.config.js --update-env
pm2 save
pm2 install pm2-logrotate >/dev/null 2>&1 || true

log "Проверка, что приложение отвечает"
for i in $(seq 1 30); do
  code=$(curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:3000/login || true)
  if [[ $code == "200" ]]; then echo "OK (HTTP 200) ✔"; exit 0; fi
  sleep 1
done
warn "Приложение не ответило за 30 секунд. Смотрите: pm2 logs taskmanager --lines 80"
exit 1
