// src/app/app/tasks/page.tsx
import React from "react";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { TasksClient } from "./TasksClient";
import { activeChats } from "@/lib/presence"; // ИМПОРТ КАРТЫ ПРИСУТСТВИЯ

interface PageProps {
  searchParams: Promise<{ page?: string; taskId?: string }>;
}

export default async function TasksPage(props: PageProps) {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/login");
  }

  const searchParams = await props.searchParams;
  const page = parseInt(searchParams.page || "1") || 1;
  const pageSize = 10; // По 10 задач на страницу
  const skip = (page - 1) * pageSize;

  const taskId = searchParams.taskId;
  const isAdmin = session.user.role === "ADMIN";

  // =========================================================================
  // ⚡ РЕГИСТРАЦИЯ ПРИСУТСТВИЯ ПОЛЬЗОВАТЕЛЯ В ЧАТЕ ЗАДАЧИ
  // =========================================================================
  if (session?.user?.id) {
    if (taskId) {
      activeChats.set(session.user.id, {
        taskId,
        lastActive: Date.now(),
      });
    } else {
      // Если пользователь закрыл чат и вернулся к списку — убираем его из активных
      activeChats.delete(session.user.id);
    }
  }

  // Загружаем все цели
  const goals = await prisma.goal.findMany({
    orderBy: { createdAt: "desc" },
  });

  // Загружаем сотрудников
  const users = await prisma.user.findMany({
    where: { role: "EMPLOYEE" },
    orderBy: { name: "asc" },
  });

  // Загружаем системные статусы
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

  // Загружаем конкретную задачу, если передан taskId
  let taskToOpen = null;
  if (taskId) {
    taskToOpen = await prisma.task.findUnique({
      where: { id: taskId },
      include: includeRelations,
    });
  }

  // Загружаем задачи с пагинацией и сортировкой по приоритету
  let tasks = [];
  let totalTasksCount = 0;

  const orderCondition = [
    { isPriority: "desc" as const },
    { deadline: "asc" as const },
    { createdAt: "desc" as const },
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
        taskToOpen={taskToOpen ? JSON.parse(JSON.stringify(taskToOpen)) : null}
      />
    </div>
  );
}