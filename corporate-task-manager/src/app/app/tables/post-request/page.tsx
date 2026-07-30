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

  // Загружаем все заявки на публикации вместе с информацией об авторе
  const requests = await prisma.postRequest.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      user: {
        select: { name: true, initials: true, email: true },
      },
    },
  });

  const isAdmin = session.user.role === "ADMIN";

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <PostRequestClient
        initialRequests={JSON.parse(JSON.stringify(requests))}
        isAdmin={isAdmin}
      />
    </div>
  );
}