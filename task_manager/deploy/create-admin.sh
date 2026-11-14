#!/usr/bin/env bash
# Создаёт единственного администратора: Сидоренко Наталья Леонидовна.
#   bash deploy/create-admin.sh natalia@domain.ru            — создать
#   bash deploy/create-admin.sh natalia@domain.ru --reset    — сменить пароль существующему
set -euo pipefail
APP_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$APP_DIR"
die() { echo -e "\033[1;31m[x] $*\033[0m" >&2; exit 1; }

EMAIL="${1:-}"
[[ $EMAIL =~ ^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$ ]] || die "Использование: bash deploy/create-admin.sh email@domain.ru [--reset]"
RESET=0; [[ ${2:-} == "--reset" ]] && RESET=1
[[ -f .env ]] || die "Нет .env."

read -rs -p "Пароль администратора (от 12 символов): " P1; echo
read -rs -p "Повторите пароль: " P2; echo
[[ $P1 == "$P2" ]] || die "Пароли не совпадают."
(( ${#P1} >= 12 )) || die "Пароль короче 12 символов."

ADMIN_EMAIL="$EMAIL" ADMIN_PASSWORD="$P1" FORCE_RESET="$RESET" node prisma/seed-production.js
unset P1 P2
