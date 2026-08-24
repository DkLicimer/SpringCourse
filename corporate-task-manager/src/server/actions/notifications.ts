// src/server/actions/notifications.ts
"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { activeChats } from "@/lib/presence";

export async function createNotification(userId: string, text: string, link?: string) {
  try {
    let linkTaskId: string | null = null;
    
    if (link && link.includes("taskId=")) {
      const urlParamsString = link.split("?")[1];
      if (urlParamsString) {
        const params = new URLSearchParams(urlParamsString);
        linkTaskId = params.get("taskId");
      }
    }

    if (linkTaskId) {
      const presence = activeChats.get(userId);
      if (
        presence && 
        presence.taskId === linkTaskId && 
        (Date.now() - presence.lastActive) < 10000
      ) {
        return; 
      }
    }

    // 1. Сохраняем уведомление в БД
    await prisma.notification.create({
      data: {
        userId,
        text,
        link,
      },
    });

    // 2. Ищем данные пользователя для отправки красивого email
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, name: true },
    });

    if (user && user.email) {
      const { sendEmail } = await import("@/lib/mail");
      const appUrl = process.env.NEXTAUTH_URL || "https://ddm-team.ru";
      
      const emailHtml = `
        <!DOCTYPE html>
        <html lang="ru">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Уведомление</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; color: #1e293b;">
          <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; padding: 30px 10px;">
            <tr>
              <td align="center">
                <table width="100%" max-width="600" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
                  <!-- Шапка -->
                  <tr>
                    <td style="background-color: #0f172a; padding: 24px 30px; text-align: left;">
                      <span style="color: #60a5fa; font-weight: 800; font-size: 18px; letter-spacing: 1px;">TASK MANAGER</span>
                      <span style="color: #94a3b8; font-size: 12px; margin-left: 10px;">| Корпоративный портал</span>
                    </td>
                  </tr>
                  
                  <!-- Тело письма -->
                  <tr>
                    <td style="padding: 30px;">
                      <h2 style="color: #0f172a; font-size: 20px; font-weight: 700; margin-top: 0; margin-bottom: 16px;">Здравствуйте, ${user.name}!</h2>
                      <div style="background-color: #f1f5f9; border-left: 4px solid #2563eb; padding: 16px 20px; border-radius: 8px; margin-bottom: 24px;">
                        <p style="font-size: 15px; line-height: 1.6; margin: 0; color: #334155;">${text}</p>
                      </div>
                      
                      ${link ? `
                      <table border="0" cellspacing="0" cellpadding="0" style="margin-top: 24px; margin-bottom: 10px;">
                        <tr>
                          <td align="center" style="border-radius: 10px; background-color: #2563eb;">
                            <a href="${appUrl}${link}" target="_blank" style="font-size: 14px; font-weight: bold; color: #ffffff; text-decoration: none; padding: 12px 28px; display: inline-block;">Открыть задачу на портале</a>
                          </td>
                        </tr>
                      </table>
                      ` : ""}
                    </td>
                  </tr>
                  
                  <!-- Подвал -->
                  <tr>
                    <td style="background-color: #f8fafc; padding: 20px 30px; border-top: 1px solid #e2e8f0; text-align: center;">
                      <p style="font-size: 12px; color: #64748b; margin: 0; line-height: 1.5;">
                        Вы получили это автоматическое уведомление, так как зарегистрированы в корпоративной системе управления задачами <strong>ddm-team.ru</strong>.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `;

      sendEmail(
        user.email,
        "Новое уведомление по задаче | Task Manager",
        `Здравствуйте, ${user.name}!\n\n${text}\n\nПерейти: ${appUrl}${link || ""}`,
        emailHtml
      ).catch((err) => {
        console.error("Ошибка отправки email:", err);
      });
    }
  } catch (error) {
    console.error("Ошибка при создании уведомления:", error);
  }
}

export async function getMyNotifications() {
  const session = await getServerSession(authOptions);
  if (!session) return [];

  return await prisma.notification.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
}

export async function markAsRead(id: string) {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error("Вы не авторизованы");

  await prisma.notification.update({
    where: { id },
    data: { isRead: true },
  });

  revalidatePath("/app");
}

export async function markAllAsRead() {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error("Вы не авторизованы");

  await prisma.notification.updateMany({
    where: { userId: session.user.id, isRead: false },
    data: { isRead: true },
  });

  revalidatePath("/app");
}