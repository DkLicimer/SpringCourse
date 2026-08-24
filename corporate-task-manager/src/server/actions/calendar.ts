// src/server/actions/calendar.ts
"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { createNotification } from "./notifications";

interface CreateEventInput {
  title: string;
  startTime: string; // "YYYY-MM-DDTHH:mm:ss"
  endTime: string;   // "YYYY-MM-DDTHH:mm:ss"
  type: "FREE" | "GC" | "BUSY";
  description?: string;
  participantIds?: string[];
}

interface UpdateEventInput extends CreateEventInput {
  id: string;
}

export async function createCalendarEvent(input: CreateEventInput) {
  const session = await getServerSession(authOptions);
  if (!session) {
    throw new Error("Вы не авторизованы");
  }

  const { title, startTime, endTime, type, description, participantIds } = input;

  if (!title || !startTime || !endTime) {
    throw new Error("Укажите тему встречи и выберите интервал времени");
  }

  const start = new Date(startTime);
  const end = new Date(endTime);

  if (start >= end) {
    throw new Error("Время окончания должно быть позже времени начала");
  }

  const isAdmin = session.user.role === "ADMIN";

  if ((type === "BUSY" || type === "GC") && !isAdmin) {
    throw new Error("Только руководитель может блокировать интервалы времени или устанавливать часы Главного корпуса");
  }

  const overlappingEvent = await prisma.calendarEvent.findFirst({
    where: {
      startTime: { lt: end },
      endTime: { gt: start },
      OR: [
        { type: "BUSY" }, 
        {
          bookedBy: {
            role: "EMPLOYEE" 
          }
        }
      ]
    },
  });

  if (overlappingEvent) {
    throw new Error(
      "Этот интервал времени пересекается с уже существующей встречей или заблокированным временем руководителя"
    );
  }

  const event = await prisma.calendarEvent.create({
    data: {
      title,
      startTime: start,
      endTime: end,
      type,
      description,
      bookedById: session.user.id,
      participants: participantIds && participantIds.length > 0 ? {
        connect: participantIds.map(id => ({ id }))
      } : undefined
    },
  });

  if (!isAdmin && (type === "FREE" || type === "GC")) {
    try {
      const admins = await prisma.user.findMany({
        where: { role: "ADMIN" },
        select: { id: true },
      });

      for (const admin of admins) {
        await createNotification(
          admin.id,
          `Сотрудник ${session.user.name} записался на встречу "${title}" на ${start.toLocaleString("ru-RU", { timeZone: "Europe/Moscow" })}.`,
          `/app/calendar`
        );
      }
    } catch (err) {
      console.error("Не удалось отправить уведомление администраторам о встрече:", err);
    }
  }

  if (participantIds && participantIds.length > 0) {
    try {
      const invitedUsers = await prisma.user.findMany({
        where: { id: { in: participantIds } },
        select: { id: true, name: true, email: true }
      });

      const { sendEmail } = await import("@/lib/mail");
      const appUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";

      for (const user of invitedUsers) {
        await createNotification(
          user.id,
          `Вам назначена задача: Принять участие во встрече «${title}» на ${start.toLocaleString("ru-RU", { timeZone: "Europe/Moscow" })}.`,
          `/app/calendar`
        );

        if (user.email) {
          const emailSubject = "Приглашение на встречу | Task Manager";
          const emailHtml = `
            <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; max-width: 600px; border: 1px solid #e2e8f0; border-radius: 12px;">
              <h2 style="color: #2563eb; margin-bottom: 20px;">Приглашение на встречу штата</h2>
              <p style="font-size: 14px;">Здравствуйте, <strong>${user.name}</strong>!</p>
              <p style="font-size: 14px; line-height: 1.6;">Руководитель пригласил вас принять участие в совещании:</p>
              <table style="width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 14px;">
                <tr>
                  <td style="padding: 8px 0; border-b: 1px solid #f1f5f9; color: #64748b;">Тема встречи:</td>
                  <td style="padding: 8px 0; border-b: 1px solid #f1f5f9; font-weight: bold; color: #1e293b;">${title}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; border-b: 1px solid #f1f5f9; color: #64748b;">Дата и время:</td>
                  <td style="padding: 8px 0; border-b: 1px solid #f1f5f9; font-weight: bold; color: #1e293b;">${start.toLocaleString("ru-RU", { timeZone: "Europe/Moscow" })}</td>
                </tr>
              </table>
              <p style="margin-top: 25px;"><a href="${appUrl}/app/calendar" style="background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Открыть Календарь</a></p>
            </div>
          `;
          sendEmail(user.email, emailSubject, `Приглашение на встречу: ${title}`, emailHtml).catch((err) => {
            console.error(`Ошибка при отправке письма приглашенному ${user.name}:`, err);
          });
        }
      }
    } catch (err) {
      console.error("Не удалось разослать уведомления приглашенным участникам встречи:", err);
    }
  }

  revalidatePath("/app/calendar");
  return event;
}

// ⚡ НОВОЕ: РЕДАКТИРОВАНИЕ ВСТРЕЧИ В КАЛЕНДАРЕ
export async function updateCalendarEvent(input: UpdateEventInput) {
  const session = await getServerSession(authOptions);
  if (!session) {
    throw new Error("Вы не авторизованы");
  }

  const { id, title, startTime, endTime, type, description, participantIds } = input;

  if (!id || !title || !startTime || !endTime) {
    throw new Error("Заполните обязательные поля встречи");
  }

  const start = new Date(startTime);
  const end = new Date(endTime);

  if (start >= end) {
    throw new Error("Время окончания должно быть позже времени начала");
  }

  const event = await prisma.calendarEvent.findUnique({
    where: { id },
  });

  if (!event) {
    throw new Error("Событие не найдено");
  }

  const isAdmin = session.user.role === "ADMIN";
  const isOwner = event.bookedById === session.user.id;

  if (!isAdmin && !isOwner) {
    throw new Error("У вас нет прав для изменения этой встречи");
  }

  if ((type === "BUSY" || type === "GC") && !isAdmin) {
    throw new Error("Только руководитель может блокировать интервалы времени или устанавливать часы Главного корпуса");
  }

  // Проверяем наложение на другие события, исключая текущее редактируемое событие
  const overlappingEvent = await prisma.calendarEvent.findFirst({
    where: {
      id: { not: id },
      startTime: { lt: end },
      endTime: { gt: start },
      OR: [
        { type: "BUSY" },
        {
          bookedBy: {
            role: "EMPLOYEE"
          }
        }
      ]
    },
  });

  if (overlappingEvent) {
    throw new Error(
      "Этот интервал времени пересекается с уже существующей встречей или заблокированным временем руководителя"
    );
  }

  const updatedEvent = await prisma.calendarEvent.update({
    where: { id },
    data: {
      title,
      startTime: start,
      endTime: end,
      type,
      description,
      participants: participantIds ? {
        set: participantIds.map(userId => ({ id: userId }))
      } : undefined
    },
  });

  revalidatePath("/app/calendar");
  return updatedEvent;
}

export async function deleteCalendarEvent(eventId: string) {
  const session = await getServerSession(authOptions);
  if (!session) {
    throw new Error("Вы не авторизованы");
  }

  const event = await prisma.calendarEvent.findUnique({
    where: { id: eventId },
  });

  if (!event) {
    throw new Error("Событие не найдено");
  }

  const isAdmin = session.user.role === "ADMIN";
  const isOwner = event.bookedById === session.user.id;

  if (!isOwner && !isAdmin) {
    throw new Error("У вас нет прав для удаления этой встречи");
  }

  await prisma.calendarEvent.delete({
    where: { id: eventId },
  });

  revalidatePath("/app/calendar");
}