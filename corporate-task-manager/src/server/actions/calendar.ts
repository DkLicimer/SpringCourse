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
  type: "MEETING" | "BLOCKED";
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

  if (type === "BLOCKED" && !isAdmin) {
    throw new Error("Только руководитель может блокировать интервалы времени");
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

  // Если обычный сотрудник забронировал встречу, уведомляем Администраторов (руководителей)
  if (type === "MEETING") {
    try {
      const admins = await prisma.user.findMany({
        where: { role: "ADMIN" },
        select: { id: true },
      });

      for (const admin of admins) {
        await createNotification(
          admin.id,
          `Сотрудник ${session.user.name} забронировал встречу "${title}" на ${start.toLocaleString("ru-RU")}.`,
          `/app/calendar`
        );
      }
    } catch (err) {
      console.error("Не удалось разослать уведомления о новой встрече администраторам:", err);
    }
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