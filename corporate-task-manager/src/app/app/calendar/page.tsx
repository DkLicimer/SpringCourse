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

  // 1. Загружаем события календаря (совещания, бронирования, Главный корпус)
  const events = await prisma.calendarEvent.findMany({
    orderBy: { startTime: "asc" },
    include: {
      bookedBy: {
        select: { id: true, name: true, initials: true, email: true, role: true },
      },
      participants: {
        select: { id: true, name: true, initials: true },
      },
    },
  });

  // 2. Загружаем активные задачи с дедлайнами (мониторинги / поручения)
  const tasksWithDeadlines = await prisma.task.findMany({
    where: {
      deadline: { not: null },
      ...(isAdmin ? {} : { assignments: { some: { userId: session.user.id } } })
    },
    include: {
      goal: { select: { title: true, color: true } },
      assignments: {
        include: {
          user: { select: { id: true, name: true, initials: true } },
          status: { select: { id: true, name: true, color: true } }
        }
      }
    },
    orderBy: { deadline: "asc" }
  });

  // 3. Загружаем список сотрудников для выбора участников
  const users = await prisma.user.findMany({
    where: { role: "EMPLOYEE", isAssignable: true },
    orderBy: { name: "asc" },
    select: { id: true, name: true, initials: true }
  });

  // 4. Загружаем темы/цели
  const goals = await prisma.goal.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, title: true, color: true }
  });

  // 5. Безопасно загружаем дни рождения сотрудников и руководителя
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
        department: true,
        user: { select: { role: true } }
      }
    });
  } catch (err) {
    console.error("Дни рождения пока недоступны:", err);
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <CalendarClient
        initialEvents={JSON.parse(JSON.stringify(events))}
        tasksWithDeadlines={JSON.parse(JSON.stringify(tasksWithDeadlines))}
        isAdmin={isAdmin}
        currentUserId={session.user.id}
        users={JSON.parse(JSON.stringify(users))}
        birthdays={JSON.parse(JSON.stringify(birthdays))}
        goals={JSON.parse(JSON.stringify(goals))}
      />
    </div>
  );
}