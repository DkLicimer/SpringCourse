// src/app/app/tasks/page.tsx
import React from "react";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { TasksClient } from "./TasksClient";
import { activeChats } from "@/lib/presence";

interface PageProps {
  searchParams: Promise<{
    page?: string;
    taskId?: string;
    tab?: string;           // "active" | "archive" | "perspective"
    filterPreset?: string;  // "all" | "urgent" | "overdue" | "priority" | "control"
    search?: string;        // Поисковая строка
    goalId?: string;        // Фильтр по Теме
    statusId?: string;      // Фильтр по статусу
    assigneeId?: string;    // Фильтр по исполнителю
    department?: string;    // Фильтр по отделу
    priorityOnly?: string;  // "true"
  }>;
}

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
  const pageSize = 20;
  const skip = (page - 1) * pageSize;

  const taskId = searchParams.taskId;
  
  // Вкладки: active (по умолчанию) | archive | perspective
  const currentTab = (searchParams.tab === "archive" || searchParams.tab === "perspective") 
    ? searchParams.tab 
    : "active";

  const filterPreset = searchParams.filterPreset || "all";
  const searchQuery = searchParams.search || "";
  const filterGoalId = searchParams.goalId || "all";
  const filterStatusId = searchParams.statusId || "all";
  const filterAssigneeId = searchParams.assigneeId || "all";
  const filterDepartment = searchParams.department || "all";
  const filterPriorityOnly = searchParams.priorityOnly === "true";

  const isAdmin = session.user.role === "ADMIN";

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

  // Проверка напоминаний для руководителя по перспективным задачам
  if (isAdmin) {
    try {
      const now = new Date();
      const tasksWithPendingReminders = await prisma.task.findMany({
        where: {
          isPerspective: true,
          reminderDate: { lte: now },
        },
      });

      for (const task of tasksWithPendingReminders) {
        const existingNotification = await prisma.notification.findFirst({
          where: {
            userId: session.user.id,
            text: { startsWith: `Напоминание по отложенной задаче: "${task.title}"` },
          },
        });

        if (!existingNotification) {
          await prisma.notification.create({
            data: {
              userId: session.user.id,
              text: `Напоминание по отложенной задаче: "${task.title}". Срок ожидания вышел, пора перевести её исполнителям!`,
              link: `/app/tasks?taskId=${task.id}`,
            },
          });
        }
      }
    } catch (err) {
      console.error("Ошибка при проверке напоминаний:", err);
    }
  }

  // Загрузка блока фокуса
  const globalFocus = await prisma.globalFocus.findUnique({
    where: { id: "current_focus" },
    include: {
      updatedBy: { select: { name: true } },
    },
  });

  // Расчет успеваемости сотрудника
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

  const goals = await prisma.goal.findMany({
    orderBy: { createdAt: "desc" },
  });

  // ⚡ В пул назначения задач включаем только сотрудников с isAssignable: true
  const users = await prisma.user.findMany({
    where: { 
      role: "EMPLOYEE",
      isAssignable: true,
    },
    select: { id: true, name: true, initials: true, department: true },
    orderBy: { name: "asc" },
  });

  const statuses = await prisma.taskStatus.findMany({
    orderBy: { position: "asc" },
  });

  let extensionRequests: any[] = [];
  if (isAdmin) {
    extensionRequests = await prisma.extensionRequest.findMany({
      include: {
        task: { select: { id: true, title: true, taskNumber: true, deadline: true } },
        user: { select: { id: true, name: true, initials: true, department: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  // --- ФОРМИРОВАНИЕ УСЛОВИЙ ВЫБОРКИ (WHERE) ---
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const endOfThreeDays = new Date(startOfToday);
  endOfThreeDays.setDate(startOfToday.getDate() + 3);
  endOfThreeDays.setHours(23, 59, 59, 999);

  const whereCondition: any = {
    isPerspective: currentTab === "perspective",
  };

  if (currentTab === "active") {
    whereCondition.assignments = {
      some: {
        statusId: { not: "status-done" },
        ...(isAdmin ? {} : { userId: session.user.id }),
      },
    };
  } else if (currentTab === "archive") {
    if (isAdmin) {
      whereCondition.assignments = {
        every: { statusId: "status-done" },
      };
    } else {
      whereCondition.assignments = {
        some: {
          userId: session.user.id,
          statusId: "status-done",
        },
      };
    }
  }

  // Быстрые пресеты фильтрации
  if (filterPreset === "urgent") {
    whereCondition.deadline = {
      gte: startOfToday,
      lte: endOfThreeDays,
    };
  } else if (filterPreset === "overdue") {
    whereCondition.deadline = { lt: startOfToday };
  } else if (filterPreset === "priority") {
    whereCondition.isPriority = true;
  } else if (filterPreset === "control") {
    whereCondition.intermediateControl = true;
  }

  if (filterPriorityOnly) {
    whereCondition.isPriority = true;
  }

  if (filterGoalId !== "all") {
    whereCondition.goalId = filterGoalId;
  }

  if (searchQuery.trim()) {
    const rawSearch = searchQuery.trim();
    const parsedNumber = parseInt(rawSearch.replace(/^[#№\s]+/, ""), 10);

    whereCondition.OR = [
      { title: { contains: rawSearch, mode: "insensitive" } },
      { description: { contains: rawSearch, mode: "insensitive" } },
      { adminNotes: { contains: rawSearch, mode: "insensitive" } },
      ...(!isNaN(parsedNumber) && parsedNumber > 0 ? [{ taskNumber: parsedNumber }] : []),
    ];
  }

  const assignmentSpecificFilters: any = {};
  if (!isAdmin && currentTab === "perspective") {
    assignmentSpecificFilters.userId = session.user.id;
  } else if (filterAssigneeId !== "all") {
    assignmentSpecificFilters.userId = filterAssigneeId;
  }

  if (filterDepartment !== "all") {
    assignmentSpecificFilters.user = { department: filterDepartment };
  }

  if (filterStatusId === "overdue") {
    whereCondition.deadline = { lt: startOfToday };
  } else if (filterStatusId !== "all") {
    assignmentSpecificFilters.statusId = filterStatusId;
  }

  if (Object.keys(assignmentSpecificFilters).length > 0) {
    whereCondition.assignments = {
      ...(whereCondition.assignments || {}),
      some: {
        ...(whereCondition.assignments?.some || {}),
        ...assignmentSpecificFilters,
      },
    };
  }

  // Связи
  const includeRelations = {
    goal: true,
    parentTask: {
      select: { id: true, taskNumber: true, title: true }
    },
    childTasks: {
      select: { id: true, taskNumber: true, title: true }
    },
    assignments: {
      include: {
        user: { select: { id: true, name: true, initials: true, department: true } },
        status: true,
      },
      orderBy: { sequenceOrder: "asc" as const },
    },
    comments: {
      include: {
        user: { select: { id: true, name: true, initials: true } },
      },
      orderBy: { createdAt: "asc" as const },
    },
    extensionRequests: {
      include: {
        user: { select: { id: true, name: true, initials: true } },
      },
      orderBy: { createdAt: "desc" as const },
    },
  };

  const totalTasksCount = await prisma.task.count({ where: whereCondition });

  const tasks = await prisma.task.findMany({
    where: whereCondition,
    skip,
    take: pageSize,
    orderBy: [
      { isPriority: "desc" as const },
      { deadline: "asc" as const },
      { createdAt: "desc" as const },
    ],
    include: includeRelations,
  });

  let taskToOpen = null;
  if (taskId) {
    taskToOpen = await prisma.task.findUnique({
      where: { id: taskId },
      include: includeRelations,
    });
  }

  const totalPages = Math.ceil(totalTasksCount / pageSize);

  const activeCount = await prisma.task.count({
    where: {
      isPerspective: false,
      assignments: {
        some: {
          statusId: { not: "status-done" },
          ...(isAdmin ? {} : { userId: session.user.id }),
        },
      },
    },
  });

  const archiveCount = await prisma.task.count({
    where: {
      isPerspective: false,
      ...(isAdmin ? {
        assignments: { every: { statusId: "status-done" } }
      } : {
        assignments: { some: { userId: session.user.id, statusId: "status-done" } }
      }),
    },
  });

  const perspectiveCount = isAdmin ? await prisma.task.count({
    where: { isPerspective: true },
  }) : 0;

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
        tabCounts={{
          active: activeCount,
          archive: archiveCount,
          perspective: perspectiveCount,
        }}
        currentFilters={{
          tab: currentTab,
          filterPreset,
          search: searchQuery,
          goalId: filterGoalId,
          statusId: filterStatusId,
          assigneeId: filterAssigneeId,
          department: filterDepartment,
          priorityOnly: filterPriorityOnly,
        }}
        globalFocus={globalFocus ? JSON.parse(JSON.stringify(globalFocus)) : null}
      />
    </div>
  );
}