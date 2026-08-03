// src/app/app/tables/post-request/page.tsx
import React from "react";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PostRequestClient } from "./PostRequestClient";

export default async function PostRequestPage() {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/login");
  }

  const isAdmin = session.user.role === "ADMIN";

  // Ищем права доступа сотрудника на запись в Контент-план
  const access = await prisma.tableAccess.findUnique({
    where: {
      userId_tableName: {
        userId: session.user.id,
        tableName: "content_plan",
      },
    },
  });

  // Управлять заявками может админ ИЛИ сотрудник с правами записи в контент-план
  const canManage = isAdmin || (access?.canWrite ?? false);

  // Загружаем все заявки на публикации вместе с информацией об авторе
  const requests = await prisma.postRequest.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      user: {
        select: { name: true, initials: true, email: true },
      },
    },
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <PostRequestClient
        initialRequests={JSON.parse(JSON.stringify(requests))}
        canManage={canManage} // Передаем обобщенное право
      />
    </div>
  );
}