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
  parentTaskId?: string;
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
    parentTaskId,
  } = input;

  if (!title || !goalId || assigneeIds.length === 0) {
    throw new Error("Заполните обязательные поля и выберите исполнителей");
  }

  // ⚡ ОБЯЗАТЕЛЬНЫЙ СРОК ВЫПОЛНЕНИЯ (ПУНКТ 9)
  if (!deadline || !deadline.trim()) {
    throw new Error("У каждой задачи должен быть обязательно указан срок выполнения (дедлайн)!");
  }

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const deadlineDate = new Date(deadline);
  deadlineDate.setHours(23, 59, 59, 999);
  if (deadlineDate < startOfToday) {
    throw new Error("Дедлайн задачи не может быть в прошлом");
  }

  let parentTaskNumber: number | null = null;
  if (parentTaskId) {
    const parentTask = await prisma.task.findUnique({
      where: { id: parentTaskId },
      select: { taskNumber: true },
    });
    if (parentTask) {
      parentTaskNumber = parentTask.taskNumber;
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
            deadline: deadlineDate,
            intermediateControl,
            adminNotes,
            assignmentType: "INDIVIDUAL",
            isPriority,
            isRecurring: isRecurring || false,
            isPerspective: isPerspective || false,
            reminderDate: reminderDate ? new Date(reminderDate) : null,
            goalId,
            createdById: session.user.id,
            parentTaskId: parentTaskId || null,
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
            const extraNote = parentTaskNumber ? ` (повторно от задачи №${parentTaskNumber})` : "";
            await createNotification(
              userId,
              `Вам назначена индивидуальная задача: "${title}"${extraNote}.`,
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

  const task = await prisma.$transaction(async (tx) => {
    const newTask = await tx.task.create({
      data: {
        title,
        description,
        deadline: deadlineDate,
        intermediateControl,
        adminNotes,
        assignmentType,
        isPriority,
        isRecurring: isRecurring || false,
        isPerspective: isPerspective || false,
        reminderDate: reminderDate ? new Date(reminderDate) : null,
        goalId,
        createdById: session.user.id,
        parentTaskId: parentTaskId || null,
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
      const extraParentNote = parentTaskNumber ? ` (повторно от задачи №${parentTaskNumber})` : "";

      for (let index = 0; index < assigneeIds.length; index++) {
        const userId = assigneeIds[index];
        const isBlocked = assignmentType === "SEQUENTIAL" && index > 0;
        const personalInst = stepInstructions && stepInstructions[index] ? ` (Ваша часть: ${stepInstructions[index]})` : "";

        if (!isBlocked) {
          await createNotification(
            userId,
            `Вам назначена задача: "${title}"${extraParentNote}${personalInst}. Она доступна для выполнения.`,
            `/app/tasks?taskId=${task.id}`
          );
        } else {
          await createNotification(
            userId,
            `Вы добавлены в цепочку по задаче "${title}"${extraParentNote} (ожидает завершения предыдущего этапа).`,
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
      user: { select: { id: true, name: true, email: true } },
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

  if (wasCompleted && !isCompletedStatus && !isAdmin) {
    throw new Error("Только руководитель может вернуть выполненную задачу обратно в работу.");
  }

  const finalReport = reportText !== undefined ? reportText.trim() : (currentAssignment.reportText?.trim() || "");
  if (isCompletedStatus && currentAssignment.task.intermediateControl && !isAdmin && !finalReport) {
    throw new Error("Для задач с промежуточным контролем обязательно заполните текст отчета / обратной связи!");
  }

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

  if (isAdmin && wasCompleted && !isCompletedStatus) {
    try {
      const statusName = newStatusId === "status-in-progress" ? "Взял в работу" : "В очереди";
      await createNotification(
        currentAssignment.userId,
        `Руководитель вернул задачу "${taskTitle}" обратно в работу (статус: ${statusName}).`,
        `/app/tasks?taskId=${currentAssignment.taskId}`
      );
    } catch (err) {
      console.error("Ошибка отправки уведомления о возврате задачи в работу:", err);
    }
  }

  if (!isAdmin && reportText && reportText.trim()) {
    try {
      const admins = await prisma.user.findMany({ where: { role: "ADMIN" }, select: { id: true } });
      for (const admin of admins) {
        await createNotification(
          admin.id,
          `Сотрудник ${session.user.name} предоставил отчет по задаче "${taskTitle}": "${reportText.slice(0, 50)}..."`,
          `/app/tasks?taskId=${currentAssignment.taskId}`
        );
      }
    } catch (err) {
      console.error("Не удалось отправить отчет администраторам:", err);
    }
  }

  revalidatePath("/app/tasks");
}

export async function reopenTask(taskId: string, targetStatusId: string = "status-in-progress") {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    throw new Error("Только руководитель может возвращать задачи в работу");
  }

  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: { assignments: true },
  });

  if (!task) {
    throw new Error("Задача не найдена");
  }

  await prisma.$transaction(async (tx) => {
    for (const as of task.assignments) {
      await tx.taskAssignment.update({
        where: { id: as.id },
        data: {
          statusId: targetStatusId,
          completedAt: null,
          isBlocked: false,
        },
      });
    }
  });

  try {
    for (const as of task.assignments) {
      await createNotification(
        as.userId,
        `Руководитель вернул задачу "${task.title}" в активную работу.`,
        `/app/tasks?taskId=${task.id}`
      );
    }
  } catch (err) {
    console.error("Ошибка рассылки уведомлений о возобновлении задачи:", err);
  }

  revalidatePath("/app/tasks");
  return { success: true };
}

export async function createExtensionRequest(input: {
  taskId: string;
  requestedDeadline: string;
  reason: string;
}) {
  const session = await getServerSession(authOptions);
  if (!session) {
    throw new Error("Вы не авторизованы");
  }

  const { taskId, requestedDeadline, reason } = input;

  if (!taskId || !requestedDeadline || !reason.trim()) {
    throw new Error("Укажите желаемую дату дедлайна и причину переноса срока");
  }

  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: {
      assignments: true,
    },
  });

  if (!task) {
    throw new Error("Задача не найдена");
  }

  const isAssigned = task.assignments.some((as) => as.userId === session.user.id);
  const isAdmin = session.user.role === "ADMIN";

  if (!isAssigned && !isAdmin) {
    throw new Error("Вы не являетесь исполнителем этой задачи");
  }

  const existingPending = await prisma.extensionRequest.findFirst({
    where: {
      taskId,
      userId: session.user.id,
      status: "PENDING",
    },
  });

  if (existingPending) {
    throw new Error("У вас уже есть отправленный запрос на продление этой задачи, ожидающий решения руководителя.");
  }

  const newDeadlineDate = new Date(requestedDeadline);
  newDeadlineDate.setHours(23, 59, 59, 999);

  const request = await prisma.extensionRequest.create({
    data: {
      taskId,
      userId: session.user.id,
      requestedDeadline: newDeadlineDate,
      reason: reason.trim(),
      status: "PENDING",
    },
  });

  try {
    const admins = await prisma.user.findMany({
      where: { role: "ADMIN" },
      select: { id: true },
    });

    const formattedDate = newDeadlineDate.toLocaleDateString("ru-RU");

    for (const admin of admins) {
      await createNotification(
        admin.id,
        `Сотрудник ${session.user.name} запросил перенос срока по задаче «${task.title}» до ${formattedDate}. Причина: ${reason.trim().slice(0, 60)}...`,
        `/app/tasks?taskId=${taskId}`
      );
    }
  } catch (err) {
    console.error("Ошибка отправки уведомлений администраторам о переносе срока:", err);
  }

  revalidatePath("/app/tasks");
  return request;
}

export async function approveExtensionRequest(input: {
  requestId: string;
  approvedDeadline?: string;
}) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    throw new Error("Только руководитель может утверждать перенос срока");
  }

  const request = await prisma.extensionRequest.findUnique({
    where: { id: input.requestId },
    include: {
      task: true,
      user: true,
    },
  });

  if (!request) {
    throw new Error("Запрос на продление не найден");
  }

  if (request.status !== "PENDING") {
    throw new Error("Этот запрос уже был обработан ранее");
  }

  const targetDate = input.approvedDeadline
    ? new Date(input.approvedDeadline)
    : request.requestedDeadline || new Date();

  targetDate.setHours(23, 59, 59, 999);

  await prisma.$transaction(async (tx) => {
    await tx.extensionRequest.update({
      where: { id: request.id },
      data: { status: "APPROVED" },
    });

    await tx.task.update({
      where: { id: request.taskId },
      data: { deadline: targetDate },
    });
  });

  const formattedDate = targetDate.toLocaleDateString("ru-RU");

  try {
    await createNotification(
      request.userId,
      `Ваш запрос на перенос срока по задаче «${request.task.title}» одобрен руководителем. Новый срок: ${formattedDate}.`,
      `/app/tasks?taskId=${request.taskId}`
    );
  } catch (err) {
    console.error("Ошибка уведомления сотрудника об одобрении переноса:", err);
  }

  revalidatePath("/app/tasks");
  return { success: true };
}

export async function rejectExtensionRequest(input: {
  requestId: string;
  rejectionReason?: string;
}) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    throw new Error("Только руководитель может отклонять перенос срока");
  }

  const request = await prisma.extensionRequest.findUnique({
    where: { id: input.requestId },
    include: {
      task: true,
      user: true,
    },
  });

  if (!request) {
    throw new Error("Запрос на продление не найден");
  }

  if (request.status !== "PENDING") {
    throw new Error("Этот запрос уже был обработан ранее");
  }

  await prisma.extensionRequest.update({
    where: { id: request.id },
    data: { status: "REJECTED" },
  });

  const reasonComment = input.rejectionReason?.trim()
    ? ` Причина: ${input.rejectionReason.trim()}`
    : "";

  try {
    await createNotification(
      request.userId,
      `Ваш запрос на перенос срока по задаче «${request.task.title}» отклонен руководителем.${reasonComment}`,
      `/app/tasks?taskId=${request.taskId}`
    );
  } catch (err) {
    console.error("Ошибка уведомления сотрудника об отклонении переноса:", err);
  }

  revalidatePath("/app/tasks");
  return { success: true };
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
    include: {
      user: {
        select: { id: true, name: true, initials: true },
      },
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

  // ⚡ ОБЯЗАТЕЛЬНЫЙ СРОК ВЫПОЛНЕНИЯ (ПУНКТ 9)
  if (!deadline || !deadline.trim()) {
    throw new Error("У каждой задачи должен быть обязательно указан срок выполнения (дедлайн)!");
  }

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const deadlineDate = new Date(deadline);
  deadlineDate.setHours(23, 59, 59, 999);
  if (deadlineDate < startOfToday) {
    throw new Error("Дедлайн задачи не может быть в прошлом");
  }

  await prisma.$transaction(async (tx) => {
    await tx.task.update({
      where: { id: taskId },
      data: {
        title,
        description,
        deadline: deadlineDate,
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
        completedAt: prev ? prev.completedAt : null,
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