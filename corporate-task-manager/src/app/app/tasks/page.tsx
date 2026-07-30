// src/app/app/tasks/page.tsx
import React from "react";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { TasksClient } from "./TasksClient";

export default async function TasksPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  const isAdmin = session.user.role === "ADMIN";

  // 1. Загружаем все цели
  const goals = await prisma.goal.findMany({
    orderBy: { createdAt: "desc" },
  });

  // 2. Загружаем сотрудников
  const users = await prisma.user.findMany({
    where: { role: "EMPLOYEE" },
    orderBy: { name: "asc" },
  });

  // 3. Загружаем системные статусы
  const statuses = await prisma.taskStatus.findMany({
    orderBy: { position: "asc" },
  });

  // 4. Загружаем задачи в зависимости от роли (с комментариями!)
  let tasks = [];

  const includeRelations = {
    goal: true,
    assignments: {
      include: {
        user: true,
        status: true,
      },
      orderBy: { sequenceOrder: "asc" },
    },
    // Подгружаем чат комментариев и информацию об авторе
    comments: {
      include: {
        user: {
          select: { name: true, initials: true },
        },
      },
      orderBy: { createdAt: "asc" as const }, // От старых к новым
    },
  };

  if (isAdmin) {
    tasks = await prisma.task.findMany({
      orderBy: { createdAt: "desc" },
      include: includeRelations,
    });
  } else {
    tasks = await prisma.task.findMany({
      where: {
        assignments: {
          some: {
            userId: session.user.id,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      include: includeRelations,
    });
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <TasksClient
        initialTasks={JSON.parse(JSON.stringify(tasks))}
        goals={JSON.parse(JSON.stringify(goals))}
        users={JSON.parse(JSON.stringify(users))}
        statuses={JSON.parse(JSON.stringify(statuses))}
        currentUserId={session.user.id}
        isAdmin={isAdmin}
      />
    </div>
  );
}