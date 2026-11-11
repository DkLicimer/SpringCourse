// src/server/actions/dailyReports.ts
"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { Prisma } from "@prisma/client";

export interface TaskReportEntry {
  taskId: string;
  taskNumber?: number;
  taskTitle: string;
  comment: string;
}

export interface SaveDailyReportInput {
  dateStr: string; // YYYY-MM-DD
  generalComment?: string;
  taskEntries: TaskReportEntry[];
}

// ⚡ Сохранение отчета сотрудника за день
export async function saveDailyReport(input: SaveDailyReportInput) {
  const session = await getServerSession(authOptions);
  if (!session) {
    throw new Error("Вы не авторизованы");
  }

  const { dateStr, generalComment, taskEntries } = input;

  if (!dateStr) {
    throw new Error("Не указана дата отчета");
  }

  // Фильтруем пустые записи
  const validTaskEntries = (taskEntries || []).filter(
    (t) => t.taskId && t.comment && t.comment.trim().length > 0
  );

  const reportDate = new Date(`${dateStr}T12:00:00+09:00`);

  const report = await prisma.dailyReport.upsert({
    where: {
      userId_dateStr: {
        userId: session.user.id,
        dateStr,
      },
    },
    update: {
      generalComment: generalComment ? generalComment.trim() : "",
      tasksData: validTaskEntries as unknown as Prisma.InputJsonValue,
      reportDate,
    },
    create: {
      userId: session.user.id,
      dateStr,
      reportDate,
      generalComment: generalComment ? generalComment.trim() : "",
      tasksData: validTaskEntries as unknown as Prisma.InputJsonValue,
    },
  });

  revalidatePath("/app/daily-report");
  return report;
}

// Получение отчета за конкретную дату
export async function getDailyReportByDate(dateStr: string, targetUserId?: string) {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const isAdmin = session.user.role === "ADMIN";
  const userId = (isAdmin && targetUserId) ? targetUserId : session.user.id;

  return await prisma.dailyReport.findUnique({
    where: {
      userId_dateStr: {
        userId,
        dateStr,
      },
    },
    include: {
      user: {
        select: { id: true, name: true, initials: true, department: true },
      },
    },
  });
}

// ⚡ Получение отчета за предшествующий рабочий день
export async function getPreviousDayReport(currentDateStr: string, targetUserId?: string) {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const isAdmin = session.user.role === "ADMIN";
  const userId = (isAdmin && targetUserId) ? targetUserId : session.user.id;

  // Ищем последний отчет, сданный ранее текущей даты
  return await prisma.dailyReport.findFirst({
    where: {
      userId,
      dateStr: { lt: currentDateStr },
    },
    orderBy: {
      dateStr: "desc",
    },
    include: {
      user: {
        select: { id: true, name: true, initials: true, department: true },
      },
    },
  });
}

// Получение списка активных задач сотрудника для выбора в отчете
export async function getMyActiveTasksForReport() {
  const session = await getServerSession(authOptions);
  if (!session) return [];

  const assignments = await prisma.taskAssignment.findMany({
    where: {
      userId: session.user.id,
      statusId: { not: "status-done" }, // Только неисполненные
      isBlocked: false,
    },
    include: {
      task: {
        select: {
          id: true,
          taskNumber: true,
          title: true,
          deadline: true,
          goal: { select: { title: true, color: true } },
        },
      },
    },
    orderBy: [
      { task: { isPriority: "desc" } },
      { task: { deadline: "asc" } },
    ],
  });

  return assignments.map((as) => ({
    assignmentId: as.id,
    taskId: as.task.id,
    taskNumber: as.task.taskNumber,
    title: as.task.title,
    deadline: as.task.deadline ? as.task.deadline.toISOString() : null,
    goalTitle: as.task.goal.title,
    goalColor: as.task.goal.color,
  }));
}