// src/app/api/tasks/urgent/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const endOfThreeDays = new Date();
  endOfThreeDays.setDate(startOfToday.getDate() + 3);
  endOfThreeDays.setHours(23, 59, 59, 999);

  const isAdmin = session.user.role === "ADMIN";

  // Базовые условия поиска: задачи, дедлайн которых прошел ИЛИ наступит в ближайшие 3 дня
  // И которые не переведены в статус "Исполнено" (status-done)
  const whereCondition: any = {
    deadline: {
      lte: endOfThreeDays,
    },
    assignments: {
      some: {
        statusId: { not: "status-done" },
      },
    },
  };

  // Если это обычный сотрудник, показываем только ЕГО срочные задачи
  if (!isAdmin) {
    whereCondition.assignments.some.userId = session.user.id;
  }

  try {
    const tasks = await prisma.task.findMany({
      where: whereCondition,
      orderBy: [
        { isPriority: "desc" }, // Сначала приоритетные
        { deadline: "asc" },    // По времени дедлайна
      ],
      take: 5, // Не перегружаем виджет, максимум 5 задач
      include: {
        goal: true,
      },
    });

    const formatted = tasks.map(t => ({
      id: t.id,
      title: t.title,
      deadline: t.deadline,
      isPriority: t.isPriority,
      goalTitle: t.goal.title,
      goalColor: t.goal.color,
    }));

    return NextResponse.json(formatted);
  } catch (err) {
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}