// src/server/actions/notifications.ts
"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

// Универсальная функция создания уведомления + отправки письма
export async function createNotification(userId: string, text: string, link?: string) {
  try {
    // 1. Записываем в базу данных
    await prisma.notification.create({
      data: {
        userId,
        text,
        link,
      },
    });

    // 2. Ищем email пользователя для отправки письма
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });

    if (user && user.email) {
      const { sendEmail } = await import("@/lib/mail");
      const appUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
      
      const emailHtml = `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
          <h2 style="color: #2563eb;">Новое уведомление в Task Manager</h2>
          <p style="font-size: 14px; line-height: 1.6;">${text}</p>
          ${link ? `<p style="margin-top: 20px;"><a href="${appUrl}${link}" style="background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 8px; font-weight: bold;">Перейти в приложение</a></p>` : ""}
        </div>
      `;

      // Отправляем асинхронное письмо
      sendEmail(user.email, "Уведомление | Task Manager", text, emailHtml).catch((err) => {
        console.error("Ошибка асинхронной отправки почты в фоне:", err);
      });
    }
  } catch (error) {
    console.error("Ошибка при создании уведомления:", error);
  }
}

// Получить последние 20 уведомлений текущего пользователя
export async function getMyNotifications() {
  const session = await getServerSession(authOptions);
  if (!session) return [];

  return await prisma.notification.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
}

// Отметить одно уведомление как прочитанное
export async function markAsRead(id: string) {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error("Вы не авторизованы");

  await prisma.notification.update({
    where: { id },
    data: { isRead: true },
  });

  revalidatePath("/app");
}

// Отметить все как прочитанные
export async function markAllAsRead() {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error("Вы не авторизованы");

  await prisma.notification.updateMany({
    where: { userId: session.user.id, isRead: false },
    data: { isRead: true },
  });

  revalidatePath("/app");
}