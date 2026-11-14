#!/usr/bin/env bash
# Восстановление БД из бэкапа:  bash deploy/restore.sh ~/backups/task_manager_db_2026-11-12_030000.dump
# ВНИМАНИЕ: текущие данные в базе будут заменены данными из бэкапа.
set -euo pipefail
DB_NAME="${DB_NAME:-task_manager_db}"; DB_USER="${DB_USER:-taskapp}"
FILE="${1:-}"
die() { echo -e "\033[1;31m[x] $*\033[0m" >&2; exit 1; }
[[ -f $FILE ]] || die "Использование: bash deploy/restore.sh /путь/к/бэкапу.dump"
pg_restore -l "$FILE" >/dev/null || die "Файл не является корректным бэкапом."

echo "Будет ПЕРЕЗАПИСАНА база '$DB_NAME' данными из: $FILE"
read -r -p "Для подтверждения введите имя базы ($DB_NAME): " a
[[ $a == "$DB_NAME" ]] || die "Отменено."

pm2 stop taskmanager 2>/dev/null || true
pg_restore -h 127.0.0.1 -U "$DB_USER" -d "$DB_NAME" --clean --if-exists --no-owner "$FILE"
pm2 start taskmanager 2>/dev/null || true
echo "Готово. Проверьте работу сайта."
