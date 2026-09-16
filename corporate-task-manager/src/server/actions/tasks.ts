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
  isRecurring?: boolean; 
  isPerspective?: boolean; 
  reminderDate?: string;    
  stepInstructions?: string[];
  createSeparateCopies?: boolean;
}

export async function createGoal(title: string, color: string) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    throw new Error("Недостаточно прав");
  }

  if (!title || !color) {
    throw new Error("Укажите название темы и выберите цвет");
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
    isRecurring,
    isPerspective,
    reminderDate,
    stepInstructions,
    createSeparateCopies,
  } = input;

  if (!title || !goalId || assigneeIds.length === 0) {
    throw new Error("Заполните обязательные поля и выберите исполнителей");
  }

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  if (deadline) {
    const deadlineDate = new Date(deadline);
    deadlineDate.setHours(23, 59, 59, 999);
    if (deadlineDate < startOfToday) {
      throw new Error("Дедлайн задачи не может быть в прошлом");
    }
  }

  // Режим «Задача для всех» (создание персональной копии каждому)
  if (assignmentType === "INDIVIDUAL" && createSeparateCopies && assigneeIds.length > 1) {
    await prisma.$transaction(async (tx) => {
      for (let i = 0; i < assigneeIds.length; i++) {
        const userId = assigneeIds[i];
        const personalInstruction = stepInstructions ? stepInstructions[i] || null : null;

        const individualTask = await tx.task.create({
          data: {
            title,
            description,
            deadline: deadline ? new Date(deadline) : null,
            intermediateControl,
            adminNotes,
            assignmentType: "INDIVIDUAL",
            isPriority,
            isRecurring: isRecurring || false,
            isPerspective: isPerspective || false,
            reminderDate: reminderDate ? new Date(reminderDate) : null,
            goalId,
            createdById: session.user.id,
          },
        });

        await tx.taskAssignment.create({
          data: {
            taskId: individualTask.id,
            userId,
            statusId: "status-todo",
            sequenceOrder: 0,
            isBlocked: false,
            stepInstruction: personalInstruction,
          },
        });

        if (!isPerspective) {
          try {
            await createNotification(
              userId,
              `Вам назначена индивидуальная задача: "${title}".`,
              `/app/tasks?taskId=${individualTask.id}`
            );
          } catch (err) {
            console.error("Ошибка отправки уведомления:", err);
          }
        }
      }
    });

    revalidatePath("/app/tasks");
    return;
  }

  // Создание одиночной, параллельной или последовательной задачи
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
        isRecurring: isRecurring || false,
        isPerspective: isPerspective || false,
        reminderDate: reminderDate ? new Date(reminderDate) : null,
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
        stepInstruction: stepInstructions ? stepInstructions[index] || null : null,
      };
    });

    await tx.taskAssignment.createMany({
      data: assignmentsData,
    });

    return newTask;
  });

  if (!isPerspective) {
    try {
      for (let index = 0; index < assigneeIds.length; index++) {
        const userId = assigneeIds[index];
        const isBlocked = assignmentType === "SEQUENTIAL" && index > 0;
        const personalInst = stepInstructions && stepInstructions[index] ? ` (Ваша часть: ${stepInstructions[index]})` : "";

        if (!isBlocked) {
          await createNotification(
            userId,
            `Вам назначена задача: "${title}"${personalInst}. Она доступна для выполнения.`,
            `/app/tasks?taskId=${task.id}`
          );
        } else {
          await createNotification(
            userId,
            `Вы добавлены в цепочку по задаче "${title}" (ожидает завершения предыдущего этапа).`,
            `/app/tasks?taskId=${task.id}`
          );
        }
      }
    } catch (err) {
      console.error("Не удалось разослать уведомления о новой задаче:", err);
    }
  }

  revalidatePath("/app/tasks");
  return task;
}

export async function updateAssignmentStatus(assignmentId: string, newStatusId: string, reportText?: string) {
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
        reportText: reportText !== undefined ? reportText.trim() : currentAssignment.reportText,
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
        } else if (!isCompletedStatus && wasCompleted) {
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
        `/app/tasks?taskId=${currentAssignment.taskId}`
      );
    } catch (err) {
      console.error("Не удалось разослать уведомление о разблокировке цепочки:", err);
    }
  }

  if (reportText && reportText.trim()) {
    try {
      const admins = await prisma.user.findMany({ where: { role: "ADMIN" }, select: { id: true } });
      for (const admin of admins) {
        await createNotification(
          admin.id,
          `Сотрудник ${session.user.name} предоставил отчет/обратную связь по задаче "${taskTitle}": "${reportText.slice(0, 50)}..."`,
          `/app/tasks?taskId=${currentAssignment.taskId}`
        );
      }
    } catch (err) {
      console.error("Не удалось отправить отчет администраторам:", err);
    }
  }

  revalidatePath("/app/tasks");
}

export async function submitTaskReport(assignmentId: string, reportText: string) {
  const session = await getServerSession(authOptions);
  if (!session) {
    throw new Error("Вы не авторизованы");
  }

  const assignment = await prisma.taskAssignment.findUnique({
    where: { id: assignmentId },
    include: { task: true },
  });

  if (!assignment) {
    throw new Error("Назначение не найдено");
  }

  if (assignment.userId !== session.user.id && session.user.role !== "ADMIN") {
    throw new Error("Недостаточно прав");
  }

  await prisma.taskAssignment.update({
    where: { id: assignmentId },
    data: { reportText: reportText.trim() },
  });

  try {
    const admins = await prisma.user.findMany({ where: { role: "ADMIN" }, select: { id: true } });
    for (const admin of admins) {
      await createNotification(
        admin.id,
        `${session.user.name} отправил обратную связь по задаче "${assignment.task.title}".`,
        `/app/tasks?taskId=${assignment.taskId}`
      );
    }
  } catch (err) {
    console.error("Ошибка уведомления:", err);
  }

  revalidatePath("/app/tasks");
}

export async function updateGoal(id: string, title: string, color: string) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    throw new Error("Недостаточно прав");
  }

  if (!title || !color) {
    throw new Error("Заполните название темы и выберите цвет");
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
    throw new Error("Тема не найдена");
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
        `${session.user.name} оставил комментарий в задаче "${task.title}": "${text.slice(0, 40)}..."`,
        `/app/tasks?taskId=${task.id}`
      );
    }
  } catch (err) {
    console.error("Не удалось разослать уведомления о комментарии:", err);
  }

  revalidatePath("/app/tasks");
  return comment;
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
    isRecurring,
    isPerspective,
    reminderDate,
    goalId,
    assigneeIds,
    stepInstructions,
  } = input;

  if (!title || !goalId || assigneeIds.length === 0) {
    throw new Error("Заполните обязательные поля и выберите исполнителей");
  }

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  if (deadline) {
    const deadlineDate = new Date(deadline);
    deadlineDate.setHours(23, 59, 59, 999);
    if (deadlineDate < startOfToday) {
      throw new Error("Дедлайн задачи не может быть в прошлом");
    }
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
        isRecurring: isRecurring || false,
        isPerspective: isPerspective || false,
        reminderDate: reminderDate ? new Date(reminderDate) : null,
        goalId,
      },
    });

    const oldAssignments = await tx.taskAssignment.findMany({
      where: { taskId },
    });

    await tx.taskAssignment.deleteMany({
      where: { taskId },
    });

    const assignmentsData = assigneeIds.map((userId, index) => {
      let isBlocked = false;
      if (assignmentType === "SEQUENTIAL" && index > 0) {
        isBlocked = true;
      }

      const prev = oldAssignments.find((a) => a.userId === userId);

      return {
        taskId,
        userId,
        statusId: prev ? prev.statusId : "status-todo",
        sequenceOrder: assignmentType === "SEQUENTIAL" ? index : 0,
        isBlocked,
        stepInstruction: stepInstructions ? stepInstructions[index] || null : null,
        reportText: prev ? prev.reportText : null,
      };
    });

    await tx.taskAssignment.createMany({
      data: assignmentsData,
    });
  });

  revalidatePath("/app/tasks");
}

export async function deleteTask(taskId: string) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    throw new Error("Недостаточно прав");
  }

  await prisma.task.delete({
    where: { id: taskId },
  });

  revalidatePath("/app/tasks");
}

export async function activateTask(taskId: string) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    throw new Error("Недостаточно прав");
  }

  const task = await prisma.task.update({
    where: { id: taskId },
    data: {
      isPerspective: false,
      reminderDate: null,
    },
    include: {
      assignments: true,
    },
  });

  try {
    for (const as of task.assignments) {
      await createNotification(
        as.userId,
        `Задача на перспективу "${task.title}" активирована руководителем и доступна для выполнения!`,
        `/app/tasks?taskId=${task.id}`
      );
    }
  } catch (err) {
    console.error("Не удалось отправить уведомления при активации задачи:", err);
  }

  revalidatePath("/app/tasks");
  return task;
}