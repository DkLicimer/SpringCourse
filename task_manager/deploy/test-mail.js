// Проверка отправки почты с ТЕМИ ЖЕ настройками, что использует приложение (.env).
//   cd ~/app && node deploy/test-mail.js получатель@example.com
const { loadEnvConfig } = require("@next/env");
loadEnvConfig(process.cwd());
const nodemailer = require("nodemailer");

const to = process.argv[2];
if (!to || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
  console.error("Использование: node deploy/test-mail.js получатель@example.com");
  process.exit(1);
}

const host = process.env.SMTP_HOST;
const port = Number(process.env.SMTP_PORT || 465);
const user = process.env.SMTP_USER;
const pass = process.env.SMTP_PASS;
if (!host || !user || !pass) {
  console.error("В .env не заданы SMTP_HOST / SMTP_USER / SMTP_PASS. Выполните: bash deploy/set-env.sh smtp");
  process.exit(1);
}

const transporter = nodemailer.createTransport({
  host,
  port,
  secure: process.env.SMTP_SECURE === "true",
  auth: { user, pass },
  connectionTimeout: 10000,
  greetingTimeout: 10000,
  socketTimeout: 15000,
});

(async () => {
  console.log(`Сервер: ${host}:${port}, ящик: ${user}`);
  try {
    await transporter.verify();
    console.log("✔ Подключение и вход выполнены.");
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || `"Task Manager" <${user}>`,
      to,
      subject: "Проверка почты Task Manager",
      text: "Если вы читаете это письмо, отправка уведомлений из приложения настроена правильно.",
    });
    console.log("✔ Письмо отправлено:", info.response || info.messageId);
    console.log("Проверьте ящик получателя, в том числе папку «Спам».");
  } catch (e) {
    console.error("✖ Ошибка:", e.code || "", e.message);
    if (["ETIMEDOUT", "ECONNREFUSED", "ESOCKET", "ECONNECTION"].includes(e.code)) {
      console.error("→ Сервер не может подключиться к почтовому серверу: скорее всего, исходящие SMTP-порты закрыты (нужно открыть у провайдера сервера).");
    } else if (e.code === "EAUTH") {
      console.error("→ Неверный логин или пароль ящика (логин — полный адрес).");
    }
    process.exit(1);
  }
})();
