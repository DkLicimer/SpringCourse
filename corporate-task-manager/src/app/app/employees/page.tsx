// src/app/app/employees/page.tsx
import React from "react";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { EmployeesClient } from "./EmployeesClient";

export default async function EmployeesPage() {
  const session = await getServerSession(authOptions);

  // Безопасность: только Администратор может просматривать эту страницу
  if (!session || session.user.role !== "ADMIN") {
    redirect("/app");
  }

  // Загружаем список всех пользователей без passwordHash, чтобы исключить утечку на клиент
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      email: true,
      name: true,
      initials: true,
      role: true,
      department: true,
      reportingPeriodType: true,
      periodStartDate: true,
      periodEndDate: true,
      tableAccesses: true,
    }
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Управление сотрудниками</h2>
          <p className="text-slate-500 text-sm">Создание сотрудников и распределение прав на таблицы</p>
        </div>
      </div>

      {/* Передаем безопасный список пользователей и ID текущего администратора */}
      <EmployeesClient 
        initialUsers={JSON.parse(JSON.stringify(users))} 
        currentUserId={session.user.id} 
      />
    </div>
  );
}