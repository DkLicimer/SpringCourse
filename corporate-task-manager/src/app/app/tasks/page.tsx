// src/app/app/tasks/page.tsx
import React from "react";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { TasksClient } from "./TasksClient";

interface PageProps {
  searchParams: Promise<{ page?: string }>;
}

export default async function TasksPage(props: PageProps) {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/login");
  }

  const searchParams = await props.searchParams; // Извлекаем параметры страницы
  const page = parseInt(searchParams.page || "1") || 1;
  const pageSize = 10; // По 10 задач на страницу
  const skip = (page - 1) * pageSize;

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

  // Общие связи для выборки задач
  const includeRelations = {
    goal: true,
    assignments: {
      include: {
        user: true,
        status: true,
      },
      orderBy: { sequenceOrder: "asc" as const },
    },
    comments: {
      include: {
        user: {
          select: { name: true, initials: true },
        },
      },
      orderBy: { createdAt: "asc" as const },
    },
  };

  // 4. Загружаем задачи с пагинацией и сортировкой по приоритету (isPriority: "desc")
  let tasks = [];
  let totalTasksCount = 0;

  const orderCondition = [
    { isPriority: "desc" as const }, // Приоритетные задачи в самом верху
    { deadline: "asc" as const },    // Затем по приближению дедлайна
    { createdAt: "desc" as const },  // Затем новые сверху
  ];

  if (isAdmin) {
    totalTasksCount = await prisma.task.count();
    tasks = await prisma.task.findMany({
      skip,
      take: pageSize,
      orderBy: orderCondition,
      include: includeRelations,
    });
  } else {
    totalTasksCount = await prisma.task.count({
      where: {
        assignments: {
          some: { userId: session.user.id },
        },
      },
    });
    tasks = await prisma.task.findMany({
      where: {
        assignments: {
          some: { userId: session.user.id },
        },
      },
      skip,
      take: pageSize,
      orderBy: orderCondition,
      include: includeRelations,
    });
  }

  const totalPages = Math.ceil(totalTasksCount / pageSize);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <TasksClient
        initialTasks={JSON.parse(JSON.stringify(tasks))}
        goals={JSON.parse(JSON.stringify(goals))}
        users={JSON.parse(JSON.stringify(users))}
        statuses={JSON.parse(JSON.stringify(statuses))}
        currentUserId={session.user.id}
        isAdmin={isAdmin}
        currentPage={page}
        totalPages={totalPages}
      />
    </div>
  );
}