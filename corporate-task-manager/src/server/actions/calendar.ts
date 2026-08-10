// src/server/actions/calendar.ts
"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { createNotification } from "./notifications";

interface CreateEventInput {
  title: string;
  startTime: string; // ISO-строчка даты и времени
  endTime: string;   // ISO-строчка даты и времени
  type: "FREE" | "GC" | "BUSY";
  description?: string;
}

export async function createCalendarEvent(input: CreateEventInput) {
  const session = await getServerSession(authOptions);
  if (!session) {
    throw new Error("Вы не авторизованы");
  }

  const { title, startTime, endTime, type, description } = input;

  if (!title || !startTime || !endTime) {
    throw new Error("Укажите тему встречи и выберите интервал времени");
  }

  const start = new Date(startTime);
  const end = new Date(endTime);

  if (start >= end) {
    throw new Error("Время окончания должно быть позже времени начала");
  }

  const isAdmin = session.user.role === "ADMIN";

  // Запрещаем сотрудникам создавать блокировки BUSY или назначать часы GC
  if ((type === "BUSY" || type === "GC") && !isAdmin) {
    throw new Error("Только руководитель может блокировать интервалы времени или устанавливать часы Главного корпуса");
  }

  // Защита от двойного бронирования (Double Booking Protection)
  const overlappingEvent = await prisma.calendarEvent.findFirst({
    where: {
      startTime: { lt: end },
      endTime: { gt: start },
    },
  });

  if (overlappingEvent) {
    throw new Error(
      "Этот интервал времени пересекается с уже существующей встречей или заблокированным временем руководителя"
    );
  }

  // Создаем событие в календаре
  const event = await prisma.calendarEvent.create({
    data: {
      title,
      startTime: start,
      endTime: end,
      type,
      description,
      bookedById: session.user.id,
    },
  });

  // Уведомление руководителя, если сотрудник забронировал встречу
  if (!isAdmin && (type === "FREE" || type === "GC")) {
    try {
      const admins = await prisma.user.findMany({
        where: { role: "ADMIN" },
        select: { id: true },
      });

      for (const admin of admins) {
        await createNotification(
          admin.id,
          `Сотрудник ${session.user.name} записался на встречу "${title}" на ${start.toLocaleString("ru-RU")}.`,
          `/app/calendar`
        );
      }
    } catch (err) {
      console.error("Не удалось отправить уведомление администраторам о встрече:", err);
    }
  }

  // ОТПРАВКА АВТОМАТИЧЕСКОГО ПИСЬМА НА ПОЧТУ СОТРУДНИКУ
  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { email: true, name: true }
    });

    if (user && user.email) {
      const { sendEmail } = await import("@/lib/mail");
      const appUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";

      let emailSubject = "Запись на встречу | Task Manager";
      let emailHtml = `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; max-width: 600px; border: 1px solid #e2e8f0; border-radius: 12px;">
          <h2 style="color: #2563eb; margin-bottom: 20px;">Подтверждение записи на встречу</h2>
          <p style="font-size: 14px;">Здравствуйте, <strong>${user.name}</strong>!</p>
          <p style="font-size: 14px; line-height: 1.6;">Вы успешно зафиксировали время в календаре руководителя:</p>
          <table style="width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 14px;">
            <tr>
              <td style="padding: 8px 0; border-b: 1px solid #f1f5f9; color: #64748b;">Тема:</td>
              <td style="padding: 8px 0; border-b: 1px solid #f1f5f9; font-weight: bold; color: #1e293b;">${title}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; border-b: 1px solid #f1f5f9; color: #64748b;">Дата и время:</td>
              <td style="padding: 8px 0; border-b: 1px solid #f1f5f9; font-weight: bold; color: #1e293b;">${start.toLocaleString("ru-RU")}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; border-b: 1px solid #f1f5f9; color: #64748b;">Режим работы:</td>
              <td style="padding: 8px 0; border-b: 1px solid #f1f5f9; font-weight: bold; color: #2563eb;">
                ${type === "GC" ? "Прием в Главном Корпусе (ГК)" : "Свободное время"}
              </td>
            </tr>
          </table>
          <p style="margin-top: 25px;"><a href="${appUrl}/app/calendar" style="background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Перейти к календарю</a></p>
        </div>
      `;

      sendEmail(user.email, emailSubject, `Вы записались на встречу: ${title}`, emailHtml).catch((err) => {
        console.error("Ошибка при асинхронной отправке email-подтверждения:", err);
      });
    }
  } catch (emailErr) {
    console.error("Не удалось инициировать отправку письма о встрече:", emailErr);
  }

  revalidatePath("/app/calendar");
  return event;
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