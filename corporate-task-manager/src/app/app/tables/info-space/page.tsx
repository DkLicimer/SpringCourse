// src/app/app/tables/info-space/page.tsx
import React from "react";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { InfoSpaceClient } from "./InfoSpaceClient";

export default async function InfoSpacePage() {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/login");
  }

  const isAdmin = session.user.role === "ADMIN";

  // Загружаем все записи из новой таблицы (сортируем по имени ФИО)
  const rows = await prisma.infoSpace.findMany({
    orderBy: { fullName: "asc" },
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <InfoSpaceClient
        initialRows={JSON.parse(JSON.stringify(rows))}
        isAdmin={isAdmin}
      />
    </div>
  );
}