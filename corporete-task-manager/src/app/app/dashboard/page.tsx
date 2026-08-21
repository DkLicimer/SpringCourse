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

  // Загружаем сырые данные задач со всеми связями
  const tasks = await prisma.task.findMany({
    include: {
      goal: true,
      assignments: {
        include: {
          status: true,
        },
      },
    },
  });

  // Загружаем сырые данные сотрудников со всеми их назначениями
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

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Аналитика и отчетность</h2>
        <p className="text-slate-500 text-sm">Сводная статистика успеваемости сотрудников и выполнения целей</p>
      </div>

      <DashboardClient
        tasks={JSON.parse(JSON.stringify(tasks))}
        employees={JSON.parse(JSON.stringify(employees))}
      />
    </div>
  );
}