// src/server/actions/tasks.ts
"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { createNotification } from "./notifications";

interface CreateTaskInput {
  title: string;
  description?: string;
  deadline?: string;
  intermediateControl: boolean;
  adminNotes?: string;
  assignmentType: "INDIVIDUAL" | "SIMULTANEOUS" | "SEQUENTIAL";
  goalId: string;
  assigneeIds: string[];
  isPriority: boolean;
}

export async function createGoal(title: string, color: string) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    throw new Error("Недостаточно прав");
  }

  if (!title || !color) {
    throw new Error("Укажите название цели и выберите цвет");
  }

  const goal = await prisma.goal.create({
    data: {
      title,
      color,
    },
  });

  revalidatePath("/app/tasks");
  return goal;
}

export async function createTask(input: CreateTaskInput) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    throw new Error("Недостаточно прав");
  }

  const {
    title,
    description,
    deadline,
    intermediateControl,
    adminNotes,
    assignmentType,
    goalId,
    assigneeIds,
    isPriority,
  } = input;

  if (!title || !goalId || assigneeIds.length === 0) {
    throw new Error("Заполните обязательные поля и выберите исполнителей");
  }

  const task = await prisma.$transaction(async (tx) => {
    const newTask = await tx.task.create({
      data: {
        title,
        description,
        deadline: deadline ? new Date(deadline) : null,
        intermediateControl,
        adminNotes,
        assignmentType,
        isPriority,
        goalId,
        createdById: session.user.id,
      },
    });

    const assignmentsData = assigneeIds.map((userId, index) => {
      let isBlocked = false;

      if (assignmentType === "SEQUENTIAL" && index > 0) {
        isBlocked = true;
      }

      return {
        taskId: newTask.id,
        userId,
        statusId: "status-todo",
        sequenceOrder: assignmentType === "SEQUENTIAL" ? index : 0,
        isBlocked,
      };
    });

    await tx.taskAssignment.createMany({
      data: assignmentsData,
    });

    return newTask;
  });

  try {
    for (let index = 0; index < assigneeIds.length; index++) {
      const userId = assigneeIds[index];
      const isBlocked = assignmentType === "SEQUENTIAL" && index > 0;

      if (!isBlocked) {
        await createNotification(
          userId,
          `Вам назначена новая задача: "${title}". Она уже доступна для выполнения.`,
          `/app/tasks?taskId=${task.id}` // УЛУЧШЕНО: Прямая ссылка на чат задачи
        );
      } else {
        await createNotification(
          userId,
          `Вы добавлены в последовательную цепочку по задаче "${title}" (задача временно заблокирована до вашей очереди).`,
          `/app/tasks?taskId=${task.id}` // УЛУЧШЕНО: Прямая ссылка на чат задачи
        );
      }
    }
  } catch (err) {
    console.error("Не удалось разослать уведомления о новой задаче:", err);
  }

  revalidatePath("/app/tasks");
  return task;
}

export async function updateAssignmentStatus(assignmentId: string, newStatusId: string) {
  const session = await getServerSession(authOptions);
  if (!session) {
    throw new Error("Вы не авторизованы");
  }

  const currentAssignment = await prisma.taskAssignment.findUnique({
    where: { id: assignmentId },
    include: {
      task: {
        include: {
          assignments: {
            orderBy: { sequenceOrder: "asc" },
          },
        },
      },
    },
  });

  if (!currentAssignment) {
    throw new Error("Назначение не найдено");
  }

  const isOwner = currentAssignment.userId === session.user.id;
  const isAdmin = session.user.role === "ADMIN";

  if (!isOwner && !isAdmin) {
    throw new Error("У вас нет прав для изменения статуса этой задачи");
  }

  if (currentAssignment.isBlocked && !isAdmin) {
    throw new Error("Задача заблокирована. Ожидайте выполнения предыдущего этапа");
  }

  const isCompletedStatus = newStatusId === "status-done";
  const wasCompleted = currentAssignment.statusId === "status-done";

  let nextAssigneeId: string | null = null;
  const taskTitle = currentAssignment.task.title;

  await prisma.$transaction(async (tx) => {
    await tx.taskAssignment.update({
      where: { id: assignmentId },
      data: {
        statusId: newStatusId,
        completedAt: isCompletedStatus ? new Date() : null,
      },
    });

    if (currentAssignment.task.assignmentType === "SEQUENTIAL") {
      const nextOrder = currentAssignment.sequenceOrder + 1;
      const nextAssignment = currentAssignment.task.assignments.find(
        (a) => a.sequenceOrder === nextOrder
      );

      if (nextAssignment) {
        if (isCompletedStatus && !wasCompleted) {
          await tx.taskAssignment.update({
            where: { id: nextAssignment.id },
            data: {
              isBlocked: false,
            },
          });
          nextAssigneeId = nextAssignment.userId;
        } 
        else if (!isCompletedStatus && wasCompleted) {
          if (nextAssignment.statusId !== "status-todo" && !isAdmin) {
            throw new Error(
              "Вы не можете отменить выполнение, так как следующий исполнитель в цепочке уже начал работу над своим этапом."
            );
          }

          await tx.taskAssignment.update({
            where: { id: nextAssignment.id },
            data: {
              isBlocked: true,
              statusId: "status-todo",
            },
          });
        }
      }
    }
  });

  if (nextAssigneeId) {
    try {
      await createNotification(
        nextAssigneeId,
        `Задача "${taskTitle}" разблокирована для вас. Предыдущий этап завершен, ваша очередь выполнять задачу!`,
        `/app/tasks?taskId=${currentAssignment.taskId}` // УЛУЧШЕНО: Прямая ссылка на чат задачи
      );
    } catch (err) {
      console.error("Не удалось разослать уведомление о разблокировке цепочки:", err);
    }
  }

  revalidatePath("/app/tasks");
}

export async function updateGoal(id: string, title: string, color: string) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    throw new Error("Недостаточно прав");
  }

  if (!title || !color) {
    throw new Error("Заполните название цели и выберите цвет");
  }

  await prisma.goal.update({
    where: { id },
    data: {
      title,
      color,
    },
  });

  revalidatePath("/app/tasks");
}

export async function deleteGoal(id: string) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    throw new Error("Недостаточно прав");
  }

  const goal = await prisma.goal.findUnique({
    where: { id },
  });

  if (!goal) {
    throw new Error("Цель не найдена");
  }

  if (goal.isTemplate) {
    throw new Error("Нельзя удалить системный шаблон 'Текучка'");
  }

  await prisma.goal.delete({
    where: { id },
  });

  revalidatePath("/app/tasks");
}

export async function addComment(taskId: string, text: string) {
  const session = await getServerSession(authOptions);
  if (!session) {
    throw new Error("Вы не авторизованы");
  }

  if (!text || !text.trim()) {
    throw new Error("Комментарий не может быть пустым");
  }

  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: { assignments: true },
  });

  if (!task) {
    throw new Error("Задача не найдена");
  }

  const isAdmin = session.user.role === "ADMIN";
  const isCreator = task.createdById === session.user.id;
  const isAssigned = task.assignments.some((as) => as.userId === session.user.id);

  if (!isAdmin && !isCreator && !isAssigned) {
    throw new Error("У вас нет доступа к чату этой задачи");
  }

  const comment = await prisma.comment.create({
    data: {
      taskId,
      userId: session.user.id,
      text: text.trim(),
    },
  });

  try {
    const recipients = new Set<string>();
    if (task.createdById !== session.user.id) {
      recipients.add(task.createdById);
    }
    task.assignments.forEach((as) => {
      if (as.userId !== session.user.id) {
        recipients.add(as.userId);
      }
    });

    for (const userId of recipients) {
      await createNotification(
        userId,
        `${session.user.name} оставил новый комментарий в задаче "${task.title}": "${text.slice(0, 40)}..."`,
        `/app/tasks?taskId=${task.id}` // УЛУЧШЕНО: Ведет прямо в открытый чат задачи
      );
    }
  } catch (err) {
    console.error("Не удалось разослать уведомления о новом комментарии:", err);
  }

  revalidatePath("/app/tasks");
  return comment;
}

export async function createTaskStatus(name: string, color: string) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    throw new Error("Недостаточно прав");
  }

  if (!name || !color) {
    throw new Error("Укажите название статуса и цвет");
  }

  const maxStatus = await prisma.taskStatus.findFirst({
    orderBy: { position: "desc" },
  });
  const nextPosition = maxStatus ? maxStatus.position + 1 : 1;

  const status = await prisma.taskStatus.create({
    data: {
      name,
      color,
      isDefault: false,
      position: nextPosition,
    },
  });

  revalidatePath("/app/tasks");
  return status;
}

export async function deleteTaskStatus(id: string) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    throw new Error("Недостаточно прав");
  }

  const status = await prisma.taskStatus.findUnique({
    where: { id },
  });

  if (!status) {
    throw new Error("Статус не найден");
  }

  if (status.isDefault) {
    throw new Error("Системные статусы по умолчанию удалять нельзя");
  }

  const isUsed = await prisma.taskAssignment.count({
    where: { statusId: id },
  });

  if (isUsed > 0) {
    throw new Error(
      "Этот статус сейчас используется в задачах. Переведите все зависимые задачи на другие статусы перед его удалением"
    );
  }

  await prisma.taskStatus.delete({
    where: { id },
  });

  revalidatePath("/app/tasks");
}

export async function updateTask(taskId: string, input: CreateTaskInput) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    throw new Error("Недостаточно прав");
  }

  const {
    title,
    description,
    deadline,
    intermediateControl,
    adminNotes,
    assignmentType,
    isPriority,
    goalId,
    assigneeIds,
  } = input;

  if (!title || !goalId || assigneeIds.length === 0) {
    throw new Error("Заполните обязательные поля и выберите исполнителей");
  }

  await prisma.$transaction(async (tx) => {
    await tx.task.update({
      where: { id: taskId },
      data: {
        title,
        description,
        deadline: deadline ? new Date(deadline) : null,
        intermediateControl,
        adminNotes,
        assignmentType,
        isPriority,
        goalId,
      },
    });

    await tx.taskAssignment.deleteMany({
      where: { taskId },
    });

    const assignmentsData = assigneeIds.map((userId, index) => {
      let isBlocked = false;
      if (assignmentType === "SEQUENTIAL" && index > 0) {
        isBlocked = true;
      }

      return {
        taskId,
        userId,
        statusId: "status-todo",
        sequenceOrder: assignmentType === "SEQUENTIAL" ? index : 0,
        isBlocked,
      };
    });

    await tx.taskAssignment.createMany({
      data: assignmentsData,
    });
  });

  revalidatePath("/app/tasks");
}