// src/app/app/calendar/page.tsx
import React from "react";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { CalendarClient } from "./CalendarClient";

export default async function CalendarPage() {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/login");
  }

  const isAdmin = session.user.role === "ADMIN";

  // Загружаем все события календаря вместе с забронировавшим и приглашенными участниками
  const events = await prisma.calendarEvent.findMany({
    orderBy: { startTime: "asc" },
    include: {
      bookedBy: {
        select: { name: true, initials: true, email: true },
      },
      participants: { // <-- Загружаем участников встреч
        select: { id: true, name: true, initials: true },
      },
    },
  });

  // Загружаем сотрудников для формы выбора участников на совещание
  const users = await prisma.user.findMany({
    where: { role: "EMPLOYEE" },
    orderBy: { name: "asc" },
    select: { id: true, name: true, initials: true }
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <CalendarClient
        initialEvents={JSON.parse(JSON.stringify(events))}
        isAdmin={isAdmin}
        currentUserId={session.user.id}
        users={JSON.parse(JSON.stringify(users))} // <-- Передаем на клиент
      />
    </div>
  );
}