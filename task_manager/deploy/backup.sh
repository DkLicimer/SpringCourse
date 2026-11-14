#!/usr/bin/env bash
# Резервная копия БД. Запускается cron-ом ежедневно в 03:00 и перед каждым deploy.
# Пароль берётся из ~/.pgpass. Хранится 14 дней.
# Копия за пределы сервера: задайте RCLONE_REMOTE (например "s3timeweb:my-bucket/taskmanager"),
# предварительно настроив rclone (rclone config).
set -euo pipefail
DB_NAME="${DB_NAME:-task_manager_db}"
DB_USER="${DB_USER:-taskapp}"
DIR="${BACKUP_DIR:-$HOME/backups}"
KEEP_DAYS="${KEEP_DAYS:-14}"

umask 077
mkdir -p "$DIR"
FILE="$DIR/${DB_NAME}_$(date +%F_%H%M%S).dump"

pg_dump -h 127.0.0.1 -U "$DB_USER" -Fc "$DB_NAME" > "$FILE"
pg_restore -l "$FILE" > /dev/null          # проверка, что архив читается
find "$DIR" -type f -name '*.dump' -mtime +"$KEEP_DAYS" -delete

if [[ -n ${RCLONE_REMOTE:-} ]] && command -v rclone &>/dev/null; then
  rclone copy "$FILE" "$RCLONE_REMOTE" && echo "Скопировано в $RCLONE_REMOTE"
fi
echo "$(date '+%F %T') OK: $FILE ($(du -h "$FILE" | cut -f1))"
