// src/app/app/tables/content-plan/page.tsx
import React from "react";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ContentPlanClient } from "./ContentPlanClient";

export default async function ContentPlanPage() {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/login");
  }

  const isAdmin = session.user.role === "ADMIN";

  // Считываем индивидуальные права доступа сотрудника к таблице контент-плана
  const access = await prisma.tableAccess.findUnique({
    where: {
      userId_tableName: {
        userId: session.user.id,
        tableName: "content_plan",
      },
    },
  });

  const canRead = isAdmin || (access?.canRead ?? false);
  const canWrite = isAdmin || (access?.canWrite ?? false);

  if (!canRead) {
    redirect("/app/tables"); // Перенаправляем, если нет доступа на чтение
  }

  // Загружаем контент-план вместе с авторами
  const planRows = await prisma.contentPlan.findMany({
    orderBy: { publishDate: "asc" },
    include: {
      author: {
        select: { name: true, initials: true },
      },
    },
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <ContentPlanClient
        initialRows={JSON.parse(JSON.stringify(planRows))}
        canWrite={canWrite} // Пробрасываем права записи на клиент
      />
    </div>
  );
}