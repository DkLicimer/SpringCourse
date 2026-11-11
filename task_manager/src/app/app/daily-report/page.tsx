// src/app/app/daily-report/page.tsx
import React from "react";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { DailyReportClient } from "./DailyReportClient";
import { getDailyReportByDate, getPreviousDayReport } from "@/server/actions/dailyReports";

function getTodayDateStr(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default async function DailyReportPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const todayStr = getTodayDateStr();
  const isAdmin = session.user.role === "ADMIN";

  // Активные задачи текущего пользователя
  const activeAssignments = await prisma.taskAssignment.findMany({
    where: {
      userId: session.user.id,
      statusId: { not: "status-done" },
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

  const activeTasks = activeAssignments.map((as) => ({
    taskId: as.task.id,
    taskNumber: as.task.taskNumber,
    title: as.task.title,
    deadline: as.task.deadline ? as.task.deadline.toISOString() : null,
    goalTitle: as.task.goal.title,
    goalColor: as.task.goal.color,
  }));

  // Отчет за сегодня
  const currentReport = await getDailyReportByDate(todayStr, session.user.id);

  // Отчет за прошедший день
  const previousReport = await getPreviousDayReport(todayStr, session.user.id);

  // Для админа загружаем список сотрудников
  let employees: any[] = [];
  if (isAdmin) {
    employees = await prisma.user.findMany({
      where: { role: "EMPLOYEE" },
      select: { id: true, name: true, initials: true, department: true },
      orderBy: { name: "asc" },
    });
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <DailyReportClient
        todayStr={todayStr}
        currentUserId={session.user.id}
        isAdmin={isAdmin}
        activeTasks={activeTasks}
        initialCurrentReport={currentReport ? JSON.parse(JSON.stringify(currentReport)) : null}
        initialPreviousReport={previousReport ? JSON.parse(JSON.stringify(previousReport)) : null}
        employees={employees}
      />
    </div>
  );
}