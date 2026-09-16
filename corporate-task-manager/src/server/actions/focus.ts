// src/server/actions/focus.ts
"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function updateGlobalFocus(title: string, content: string) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    throw new Error("Только руководитель может изменять блок важных акцентов");
  }

  const updatedFocus = await prisma.globalFocus.upsert({
    where: { id: "current_focus" },
    update: {
      title: title.trim() || "Важное сейчас",
      content: content.trim(),
      updatedById: session.user.id,
    },
    create: {
      id: "current_focus",
      title: title.trim() || "Важное сейчас",
      content: content.trim(),
      updatedById: session.user.id,
    },
    include: {
      updatedBy: {
        select: { name: true },
      },
    },
  });

  revalidatePath("/app/tasks");
  return updatedFocus;
}