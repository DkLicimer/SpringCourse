// src/server/actions/archive.ts
"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export interface DeleteYearArchiveInput {
  year: number;
  confirmationPhrase: string; // Пользователь должен ввести "УДАЛИТЬ [ГОД]"
}

export async function deleteYearArchiveData(input: DeleteYearArchiveInput) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    throw new Error("Только руководитель имеет право производить удаление архивных данных");
  }

  const { year, confirmationPhrase } = input;
  const currentYear = new Date().getFullYear();

  if (year >= currentYear) {
    throw new Error(`Нельзя удалять данные за текущий (${currentYear}) или будущие годы. Допускается только удаление завершённых прошлых лет.`);
  }

  const expectedPhrase = `УДАЛИТЬ ${year}`;
  if (confirmationPhrase?.trim() !== expectedPhrase) {
    throw new Error(`Неверная фраза подтверждения. Для подтверждения введите строго: «${expectedPhrase}»`);
  }

  const startDate = new Date(Date.UTC(year, 0, 1, 0, 0, 0, 0));
  const endDate = new Date(Date.UTC(year, 11, 31, 23, 59, 59, 999));

  // Выполняем удаление данных за выбранный период в транзакции
  const stats = await prisma.$transaction(async (tx) => {
    // 1. Ежедневные отчеты
    const deletedReports = await tx.dailyReport.deleteMany({
      where: {
        reportDate: { gte: startDate, lte: endDate },
      },
    });

    // 2. Находим задачи за период
    const tasksInYear = await tx.task.findMany({
      where: {
        createdAt: { gte: startDate, lte: endDate },
      },
      select: { id: true },
    });

    const taskIds = tasksInYear.map((t) => t.id);

    // Удаляем связанные сущности задач (каскад/вручную для надёжности)
    if (taskIds.length > 0) {
      await tx.comment.deleteMany({ where: { taskId: { in: taskIds } } });
      await tx.extensionRequest.deleteMany({ where: { taskId: { in: taskIds } } });
      await tx.taskAssignment.deleteMany({ where: { taskId: { in: taskIds } } });
      await tx.task.deleteMany({ where: { id: { in: taskIds } } });
    }

    // 3. Протоколы совещаний за период
    const deletedProtocols = await tx.meetingProtocol.deleteMany({
      where: {
        meetingDate: { gte: startDate, lte: endDate },
      },
    });

    return {
      deletedTasksCount: taskIds.length,
      deletedReportsCount: deletedReports.count,
      deletedProtocolsCount: deletedProtocols.count,
    };
  });

  revalidatePath("/app/dashboard");
  revalidatePath("/app/tasks");
  revalidatePath("/app/daily-report");
  revalidatePath("/app/protocols");

  return {
    success: true,
    message: `Данные за ${year} год успешно очищены. Удалено задач: ${stats.deletedTasksCount}, отчетов за день: ${stats.deletedReportsCount}, протоколов: ${stats.deletedProtocolsCount}.`,
  };
}