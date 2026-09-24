// src/app/app/tables/info-space/page.tsx
import React from "react";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { InfoSpaceClient } from "./InfoSpaceClient";
import { Lock, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default async function InfoSpacePage() {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/login");
  }

  const isAdmin = session.user.role === "ADMIN";

  // Считываем индивидуальные права сотрудника на таблицу "info_space"
  const access = await prisma.tableAccess.findUnique({
    where: {
      userId_tableName: {
        userId: session.user.id,
        tableName: "info_space",
      },
    },
  });

  const canRead = isAdmin || (access?.canRead ?? false);
  const canWrite = isAdmin || (access?.canWrite ?? false);

  // Если нет доступа на чтение, показываем заглушку "Доступ ограничен"
  if (!canRead) {
    return (
      <div className="max-w-md mx-auto mt-20 text-center space-y-4">
        <div className="inline-flex p-4 bg-red-50 text-red-500 rounded-full border border-red-100">
          <Lock className="h-10 w-10" />
        </div>
        <h2 className="text-xl font-bold text-slate-800">Доступ ограничен</h2>
        <p className="text-sm text-slate-500 leading-relaxed">
          У вашей учетной записи нет прав для просмотра этой таблицы. Обратитесь к руководителю за получением прав.
        </p>
        <div className="pt-2">
          <Link
            href="/app/tables"
            className="inline-flex items-center gap-1.5 text-sm font-bold text-blue-600 hover:text-blue-800 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Вернуться назад
          </Link>
        </div>
      </div>
    );
  }

  // Загружаем все записи из новой таблицы (сортируем по ФИО)
  const rows = await prisma.infoSpace.findMany({
    orderBy: { fullName: "asc" },
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <InfoSpaceClient
        initialRows={JSON.parse(JSON.stringify(rows))}
        canWrite={canWrite} // Пробрасываем права записи на клиент
      />
    </div>
  );
}