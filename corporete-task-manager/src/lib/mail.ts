// src/lib/mail.ts
import nodemailer from "nodemailer";

// Настройки SMTP берутся из .env файла
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.yandex.ru", // пример для Яндекса
  port: parseInt(process.env.SMTP_PORT || "465"),
  secure: process.env.SMTP_SECURE === "true", // true для порта 465, false для 587
  auth: {
    user: process.env.SMTP_USER || "your_login@yandex.ru",
    pass: process.env.SMTP_PASS || "your_app_password", // пароль приложения
  },
});

export async function sendEmail(to: string, subject: string, text: string, html?: string) {
  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || `"Task Manager" <${process.env.SMTP_USER}>`,
      to,
      subject,
      text,
      html: html || text.replace(/\n/g, "<br>"),
    });
    console.log(`Email успешно отправлен на адрес: ${to}`);
  } catch (error) {
    console.error("Ошибка при отправке Email:", error);
  }
}