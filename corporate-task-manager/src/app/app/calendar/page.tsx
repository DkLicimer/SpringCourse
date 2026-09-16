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

  // 1. Загружаем события календаря
  const events = await prisma.calendarEvent.findMany({
    orderBy: { startTime: "asc" },
    include: {
      bookedBy: {
        select: { name: true, initials: true, email: true },
      },
      participants: {
        select: { id: true, name: true, initials: true },
      },
    },
  });

  // 2. Загружаем список сотрудников для выбора участников
  const users = await prisma.user.findMany({
    where: { role: "EMPLOYEE" },
    orderBy: { name: "asc" },
    select: { id: true, name: true, initials: true }
  });

  // 3. Безопасно загружаем дни рождения сотрудников
  let birthdays: any[] = [];
  try {
    birthdays = await prisma.socialPassport.findMany({
      where: {
        birthDate: { not: null }
      },
      select: {
        id: true,
        fullName: true,
        birthDate: true,
        department: true
      }
    });
  } catch (err) {
    console.error("Дни рождения пока недоступны:", err);
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <CalendarClient
        initialEvents={JSON.parse(JSON.stringify(events))}
        isAdmin={isAdmin}
        currentUserId={session.user.id}
        users={JSON.parse(JSON.stringify(users))}
        birthdays={JSON.parse(JSON.stringify(birthdays))}
      />
    </div>
  );
}