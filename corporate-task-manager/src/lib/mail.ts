// src/lib/mail.ts
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.beget.com",
  port: parseInt(process.env.SMTP_PORT || "465"),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER || "notification@ddm-team.ru",
    pass: process.env.SMTP_PASS,
  },
});

export async function sendEmail(to: string, subject: string, text: string, html?: string) {
  try {
    const fromAddress = process.env.SMTP_FROM || `"Task Manager" <${process.env.SMTP_USER}>`;
    
    await transporter.sendMail({
      from: fromAddress,
      to,
      subject,
      text,
      html: html || text.replace(/\n/g, "<br>"),
      headers: {
        "X-Entity-Ref-Type": "transactional",
        "X-Auto-Response-Suppress": "OOF, AutoReply",
      },
    });
    console.log(`Email успешно отправлен на адрес: ${to}`);
  } catch (error) {
    console.error("Ошибка при отправке Email:", error);
  }
}