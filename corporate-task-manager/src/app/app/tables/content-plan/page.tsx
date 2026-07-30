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

  // Загружаем контент-план вместе с авторами
  const planRows = await prisma.contentPlan.findMany({
    orderBy: { publishDate: "asc" },
    include: {
      author: {
        select: { name: true, initials: true },
      },
    },
  });

  const isAdmin = session.user.role === "ADMIN";

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <ContentPlanClient
        initialRows={JSON.parse(JSON.stringify(planRows))}
        isAdmin={isAdmin}
      />
    </div>
  );
}