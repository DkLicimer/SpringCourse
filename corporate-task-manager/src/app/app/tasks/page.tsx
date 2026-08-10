// src/app/app/tasks/page.tsx
import React from "react";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { TasksClient } from "./TasksClient";
import { activeChats } from "@/lib/presence";

interface PageProps {
  searchParams: Promise<{ page?: string; taskId?: string }>;
}

// Помощник для вычисления границ отчетного периода
function getReportingPeriodDates(
  type: string,
  customStart: Date | null,
  customEnd: Date | null
): { start: Date; end: Date } {
  const now = new Date();
  let start = new Date();
  let end = new Date();

  if (type === "MONTH") {
    start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  } else if (type === "QUARTER") {
    const quarter = Math.floor(now.getMonth() / 3);
    start = new Date(now.getFullYear(), quarter * 3, 1, 0, 0, 0, 0);
    end = new Date(now.getFullYear(), (quarter + 1) * 3, 0, 23, 59, 59, 999);
  } else if (type === "CUSTOM" && customStart && customEnd) {
    start = new Date(customStart);
    end = new Date(customEnd);
  } else {
    // Дефолтный откат на текущий месяц
    start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  }

  return { start, end };
}

export default async function TasksPage(props: PageProps) {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/login");
  }

  const searchParams = await props.searchParams;
  const page = parseInt(searchParams.page || "1") || 1;
  const pageSize = 10;
  const skip = (page - 1) * pageSize;

  const taskId = searchParams.taskId;
  const isAdmin = session.user.role === "ADMIN";

  // Регистрируем присутствие в чате задачи
  if (session?.user?.id) {
    if (taskId) {
      activeChats.set(session.user.id, {
        taskId,
        lastActive: Date.now(),
      });
    } else {
      activeChats.delete(session.user.id);
    }
  }

  // Загружаем отчетный период текущего сотрудника и вычисляем KPI успеваемости
  const currentUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      reportingPeriodType: true,
      periodStartDate: true,
      periodEndDate: true,
    },
  });

  const period = getReportingPeriodDates(
    currentUser?.reportingPeriodType || "MONTH",
    currentUser?.periodStartDate || null,
    currentUser?.periodEndDate || null
  );

  // Считаем KPI сотрудника за его отчетный период
  // Учитываем все его назначенные задачи, которые были созданы ИЛИ дедлайн которых попадает в этот период
  const periodTasks = await prisma.task.findMany({
    where: {
      OR: [
        { createdAt: { gte: period.start, lte: period.end } },
        { deadline: { gte: period.start, lte: period.end } }
      ],
      assignments: {
        some: { userId: session.user.id }
      }
    },
    include: {
      assignments: {
        where: { userId: session.user.id }
      }
    }
  });

  const totalPeriodTasks = periodTasks.length;
  const completedPeriodTasks = periodTasks.filter(
    (t) => t.assignments[0]?.statusId === "status-done"
  ).length;

  const completionRate = totalPeriodTasks > 0 
    ? Math.round((completedPeriodTasks / totalPeriodTasks) * 100) 
    : 100;

  const currentUserPeriod = {
    type: currentUser?.reportingPeriodType || "MONTH",
    start: period.start.toISOString(),
    end: period.end.toISOString(),
    completionRate,
  };

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

  // Загружаем запросы на продление дедлайнов (только для руководителя)
  let extensionRequests: any[] = [];
  if (isAdmin) {
    extensionRequests = await prisma.extensionRequest.findMany({
      include: {
        task: { select: { title: true, deadline: true } },
        user: { select: { name: true, initials: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }

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
        currentUserPeriod={currentUserPeriod}
        extensionRequests={JSON.parse(JSON.stringify(extensionRequests))}
      />
    </div>
  );
}