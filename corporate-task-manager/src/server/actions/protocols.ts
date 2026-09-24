// src/server/actions/protocols.ts
"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { createNotification } from "./notifications";

export async function generateProtocolNumber(): Promise<string> {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const prefix = `ПР-${year}/${month}-`;

  const countThisMonth = await prisma.meetingProtocol.count({
    where: {
      protocolNumber: { startsWith: prefix },
    },
  });

  const nextIndex = String(countThisMonth + 1).padStart(3, "0");
  return `${prefix}${nextIndex}`;
}

export interface ProtocolDraftTask {
  title: string;
  description?: string;
  deadline?: string;
  goalId: string;
  assigneeIds: string[];
  isPriority?: boolean;
  intermediateControl?: boolean;
}

export interface SaveProtocolInput {
  calendarEventId?: string;
  title: string;
  meetingDate?: string;
  startTime?: string;
  endTime?: string;
  location?: string;
  secretaryId?: string;
  agenda?: string;
  discussionText?: string;
  decisionsText?: string;
  attendeeIds: string[];
  tasksToCreate?: ProtocolDraftTask[];
  status?: "DRAFT" | "SIGNED";
}

export async function saveMeetingProtocol(input: SaveProtocolInput) {
  const session = await getServerSession(authOptions);
  if (!session) {
    throw new Error("Вы не авторизованы");
  }

  const {
    calendarEventId,
    title,
    meetingDate,
    startTime,
    endTime,
    location = "Онлайн-аудиокомната",
    secretaryId,
    agenda,
    discussionText,
    decisionsText,
    attendeeIds,
    tasksToCreate = [],
    status = "SIGNED",
  } = input;

  if (!title || !title.trim()) {
    throw new Error("Укажите тему совещания");
  }

  const protocolNumber = await generateProtocolNumber();
  const mDate = meetingDate ? new Date(meetingDate) : new Date();
  const sTime = startTime ? new Date(startTime) : new Date();
  const eTime = endTime ? new Date(endTime) : new Date();

  // Создание протокола и задач в единой транзакции
  const createdProtocol = await prisma.$transaction(async (tx) => {
    // 1. Создаем протокол
    const protocol = await tx.meetingProtocol.create({
      data: {
        protocolNumber,
        title: title.trim(),
        meetingDate: mDate,
        startTime: sTime,
        endTime: eTime,
        location,
        calendarEventId: calendarEventId || null,
        chairmanId: session.user.id,
        secretaryId: secretaryId || null,
        agenda: agenda ? agenda.trim() : null,
        discussionText: discussionText ? discussionText.trim() : null,
        decisionsText: decisionsText ? decisionsText.trim() : null,
        status,
        attendees: attendeeIds && attendeeIds.length > 0 ? {
          connect: attendeeIds.map((id) => ({ id })),
        } : undefined,
      },
    });

    // 2. Создаем задачи, назначенные в ходе совещания
    for (const draft of tasksToCreate) {
      if (!draft.title || !draft.goalId || !draft.assigneeIds || draft.assigneeIds.length === 0) {
        continue;
      }

      const newTask = await tx.task.create({
        data: {
          title: draft.title.trim(),
          description: draft.description ? draft.description.trim() : `Поручение по итогам совещания № ${protocolNumber}`,
          deadline: draft.deadline ? new Date(draft.deadline) : null,
          isPriority: draft.isPriority || false,
          intermediateControl: draft.intermediateControl || false,
          assignmentType: draft.assigneeIds.length > 1 ? "SIMULTANEOUS" : "INDIVIDUAL",
          goalId: draft.goalId,
          createdById: session.user.id,
          protocolId: protocol.id,
        },
      });

      const assignmentsData = draft.assigneeIds.map((userId) => ({
        taskId: newTask.id,
        userId,
        statusId: "status-todo",
        sequenceOrder: 0,
        isBlocked: false,
      }));

      await tx.taskAssignment.createMany({
        data: assignmentsData,
      });
    }

    return protocol;
  });

  // 3. Рассылка уведомлений участникам
  try {
    const notifyUserIds = Array.from(new Set([...attendeeIds, ...tasksToCreate.flatMap((t) => t.assigneeIds)]));
    for (const uId of notifyUserIds) {
      if (uId !== session.user.id) {
        await createNotification(
          uId,
          `Опубликован утвержденный протокол совещания № ${protocolNumber}: «${title}». Вам назначены поручения.`,
          `/app/protocols/${createdProtocol.id}`
        );
      }
    }
  } catch (err) {
    console.error("Ошибка рассылки уведомлений протокола:", err);
  }

  revalidatePath("/app/protocols");
  revalidatePath("/app/tasks");
  return createdProtocol;
}

export async function deleteMeetingProtocol(id: string) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    throw new Error("Только руководитель может удалять протоколы");
  }

  await prisma.meetingProtocol.delete({
    where: { id },
  });

  revalidatePath("/app/protocols");
}

export async function sendProtocolEmailBlast(protocolId: string) {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error("Вы не авторизованы");

  const protocol = await prisma.meetingProtocol.findUnique({
    where: { id: protocolId },
    include: {
      chairman: true,
      secretary: true,
      attendees: true,
      tasks: {
        include: {
          assignments: {
            include: { user: true },
          },
        },
      },
    },
  });

  if (!protocol) throw new Error("Протокол не найден");

  const { sendEmail } = await import("@/lib/mail");
  const appUrl = process.env.NEXTAUTH_URL || "https://ddm-team.ru";

  const recipients = protocol.attendees.map((a) => a.email).filter(Boolean);

  for (const email of recipients) {
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; padding: 24px; color: #1e293b; max-width: 650px; border: 1px solid #e2e8f0; border-radius: 12px;">
        <h2 style="color: #2563eb; margin-bottom: 8px;">Протокол совещания ${protocol.protocolNumber}</h2>
        <p style="font-size: 15px; font-weight: bold; margin-top: 0;">Тема: ${protocol.title}</p>
        <p style="font-size: 13px; color: #64748b;">Дата проведения: ${new Date(protocol.meetingDate).toLocaleDateString("ru-RU")}</p>
        
        <div style="margin: 20px 0; padding: 15px; background-color: #f8fafc; border-left: 4px solid #3b82f6; border-radius: 6px;">
          <h4 style="margin: 0 0 8px 0; color: #0f172a;">Решения / Постановили:</h4>
          <p style="font-size: 13px; margin: 0; line-height: 1.5; white-space: pre-line;">${protocol.decisionsText || "Не указаны"}</p>
        </div>

        <p style="margin-top: 25px;">
          <a href="${appUrl}/app/protocols/${protocol.id}" style="background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Открыть полный протокол на портале</a>
        </p>
      </div>
    `;

    await sendEmail(
      email,
      `Протокол совещания ${protocol.protocolNumber} | «${protocol.title}»`,
      `Протокол совещания ${protocol.protocolNumber}: ${protocol.title}`,
      emailHtml
    );
  }
}