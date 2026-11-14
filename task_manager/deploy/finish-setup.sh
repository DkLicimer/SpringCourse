#!/usr/bin/env bash
# Завершение настройки (запускать от root ПОСЛЕ setup-server.sh):
#  1) переносит проект из /root/app к пользователю deploy (вместе с ключом доступа к GitHub);
#  2) после вашего подтверждения отключает вход по паролю и вход под root.
# Опция --no-lock: только перенос проекта, SSH не трогать.
set -euo pipefail
DEPLOY_USER="deploy"
log()  { echo -e "\n\033[1;34m==> $*\033[0m"; }
warn() { echo -e "\033[1;33m[!] $*\033[0m"; }
die()  { echo -e "\033[1;31m[x] $*\033[0m" >&2; exit 1; }

LOCK=1; for a in "$@"; do [[ $a == "--no-lock" ]] && LOCK=0; done
[[ $EUID -eq 0 ]] || die "Запускайте от root."
id "$DEPLOY_USER" &>/dev/null || die "Пользователя $DEPLOY_USER нет — сначала выполните setup-server.sh."
H=/home/$DEPLOY_USER

log "Ключ доступа к GitHub для пользователя $DEPLOY_USER"
install -d -m 700 -o "$DEPLOY_USER" -g "$DEPLOY_USER" $H/.ssh
if [[ -f /root/.ssh/id_ed25519 && ! -f $H/.ssh/id_ed25519 ]]; then
  cp /root/.ssh/id_ed25519 /root/.ssh/id_ed25519.pub $H/.ssh/
  [[ -f /root/.ssh/known_hosts ]] && cp /root/.ssh/known_hosts $H/.ssh/known_hosts
  chown "$DEPLOY_USER:$DEPLOY_USER" $H/.ssh/id_ed25519 $H/.ssh/id_ed25519.pub $H/.ssh/known_hosts 2>/dev/null || true
  chmod 600 $H/.ssh/id_ed25519
  echo "Ключ скопирован."
else
  echo "Ключ уже на месте или у root его нет — пропускаю."
fi

log "Проект"
if [[ -d /root/app/.git && ! -e $H/app ]]; then
  mv /root/app $H/app
  chown -R "$DEPLOY_USER:$DEPLOY_USER" $H/app
  echo "Проект перенесён в $H/app"
elif [[ -d $H/app ]]; then
  echo "$H/app уже существует — ничего не переношу."
else
  warn "Проект не найден в /root/app. Клонируйте его позже под пользователем $DEPLOY_USER: git clone git@github.com:АККАУНТ/РЕПОЗИТОРИЙ.git ~/app"
fi
# Секретный ключ GitHub больше не нужен у root
rm -f /root/.ssh/id_ed25519 /root/.ssh/id_ed25519.pub

if (( LOCK )); then
  log "Отключение входа по паролю и под root"
  AK=$H/.ssh/authorized_keys
  [[ -s $AK ]] || die "У $DEPLOY_USER нет SSH-ключа в authorized_keys — блокировать вход нельзя."
  echo "Если сейчас закрыть вход по паролю, зайти на сервер можно будет ТОЛЬКО по SSH-ключу."
  echo "(Запасной вариант на крайний случай: веб-консоль в панели Timeweb, вкладка «Консоль».)"
  read -r -p "Вы проверили, что 'ssh $DEPLOY_USER@IP' из ДРУГОГО окна заходит без пароля? Введите yes: " ans
  if [[ $ans == "yes" ]]; then
    cat > /etc/ssh/sshd_config.d/00-hardening.conf <<SSHD
PasswordAuthentication no
KbdInteractiveAuthentication no
PermitRootLogin no
PubkeyAuthentication yes
MaxAuthTries 3
LoginGraceTime 30
X11Forwarding no
SSHD
    sshd -t || die "Ошибка конфигурации sshd — удалите /etc/ssh/sshd_config.d/00-hardening.conf"
    systemctl reload ssh 2>/dev/null || systemctl reload sshd
    echo "Готово: вход по паролю и под root отключён."
  else
    warn "SSH не изменён. Когда проверите вход, запустите: bash $0"
  fi
fi

cat <<DONE

════════════════════════════════════════════════════════════
 Дальше работайте под пользователем $DEPLOY_USER:

     ssh $DEPLOY_USER@<IP-сервера>
     cd ~/app
     bash deploy/init-env.sh
     bash deploy/deploy.sh
     bash deploy/create-admin.sh email@домен.ru
════════════════════════════════════════════════════════════
DONE
