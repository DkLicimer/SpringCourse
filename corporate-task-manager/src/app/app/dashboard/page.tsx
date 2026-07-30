// src/app/app/dashboard/page.tsx
import React from "react";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { DashboardClient } from "./DashboardClient";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  // Безопасность: доступ только для администратора
  if (!session || session.user.role !== "ADMIN") {
    redirect("/app");
  }

  const now = new Date();
  const threeDaysFromNow = new Date();
  threeDaysFromNow.setDate(now.getDate() + 3);

  // 1. Извлекаем все задачи
  const allTasks = await prisma.task.findMany({
    include: {
      assignments: {
        include: {
          status: true,
        },
      },
    },
  });

  // 2. Рассчитываем метрики задач
  const totalTasks = allTasks.length;
  
  // Просроченные задачи: дедлайн прошел, и хотя бы одно назначение НЕ выполнено
  const overdueTasksCount = allTasks.filter((task) => {
    if (!task.deadline) return false;
    const isOverdue = new Date(task.deadline) < now;
    const isNotFinished = task.assignments.some((as) => as.statusId !== "status-done");
    return isOverdue && isNotFinished;
  }).length;

  // Срочные задачи: дедлайн в ближайшие 3 дня, и они не выполнены
  const urgentTasksCount = allTasks.filter((task) => {
    if (!task.deadline) return false;
    const taskDeadline = new Date(task.deadline);
    const isUpcoming = taskDeadline >= now && taskDeadline <= threeDaysFromNow;
    const isNotFinished = task.assignments.some((as) => as.statusId !== "status-done");
    return isUpcoming && isNotFinished;
  }).length;

  // 3. Загружаем сотрудников для сводной таблицы эффективности
  const employees = await prisma.user.findMany({
    where: { role: "EMPLOYEE" },
    include: {
      assignments: {
        include: {
          task: true,
          status: true,
        },
      },
    },
  });

  // Рассчитываем детальную статистику по каждому сотруднику
  const employeeStats = employees.map((emp) => {
    const total = emp.assignments.length;
    const completed = emp.assignments.filter((as) => as.statusId === "status-done").length;
    const active = emp.assignments.filter((as) => as.statusId !== "status-done" && !as.isBlocked).length;
    const blocked = emp.assignments.filter((as) => as.isBlocked).length;

    // Считаем просроченные задачи для конкретного сотрудника
    const overdue = emp.assignments.filter((as) => {
      if (as.statusId === "status-done" || !as.task.deadline) return false;
      return new Date(as.task.deadline) < now;
    }).length;

    const rate = total > 0 ? Math.round((completed / total) * 100) : 0;

    return {
      id: emp.id,
      name: emp.name,
      initials: emp.initials,
      email: emp.email,
      total,
      completed,
      active,
      blocked,
      overdue,
      completionRate: rate,
    };
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Аналитика и отчетность</h2>
        <p className="text-slate-500 text-sm">Сводная статистика успеваемости сотрудников и выполнения целей</p>
      </div>

      <DashboardClient
        totalTasks={totalTasks}
        overdueCount={overdueTasksCount}
        urgentCount={urgentTasksCount}
        employeeStats={employeeStats}
      />
    </div>
  );
}