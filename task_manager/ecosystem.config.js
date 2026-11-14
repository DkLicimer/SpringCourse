// ecosystem.config.js — запуск через pm2
// ВАЖНО: один процесс (fork). Комнаты совещаний, присутствие в чатах и счётчики
// попыток входа хранятся в памяти процесса — кластерный режим их сломает.
module.exports = {
  apps: [
    {
      name: "taskmanager",
      cwd: __dirname,
      script: "node_modules/next/dist/bin/next",
      args: "start -H 127.0.0.1 -p 3000", // слушаем только localhost, наружу — через nginx
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      max_memory_restart: "900M",
      time: true,
      env: { NODE_ENV: "production" },
    },
  ],
};
