// src/app/api/tasks/urgent/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getChitaStartOfDay } from "@/lib/date";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const startOfToday = getChitaStartOfDay();
  const endOfThreeDays = new Date(startOfToday.getTime() + 4 * 24 * 60 * 60 * 1000 - 1);

  const isAdmin = session.user.role === "ADMIN";

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

  if (!isAdmin) {
    whereCondition.assignments.some.userId = session.user.id;
  }

  try {
    const tasks = await prisma.task.findMany({
      where: whereCondition,
      orderBy: [
        { isPriority: "desc" },
        { deadline: "asc" },
      ],
      take: 5,
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