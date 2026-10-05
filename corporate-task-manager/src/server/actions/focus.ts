// src/server/actions/focus.ts
"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

interface UpdateFocusInput {
  focusWeek?: string;      // 1. Фокус недели
  staffAttention?: string; // 2. Внимание штата
  importantNow?: string;   // 3. Важное сейчас
}

export async function updateGlobalFocus(input: UpdateFocusInput) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    throw new Error("Только руководитель может изменять блок важных акцентов");
  }

  const { focusWeek = "", staffAttention = "", importantNow = "" } = input;

  const updatedFocus = await prisma.globalFocus.upsert({
    where: { id: "current_focus" },
    update: {
      focusWeek: focusWeek.trim(),
      staffAttention: staffAttention.trim(),
      importantNow: importantNow.trim(),
      updatedById: session.user.id,
    },
    create: {
      id: "current_focus",
      focusWeek: focusWeek.trim(),
      staffAttention: staffAttention.trim(),
      importantNow: importantNow.trim(),
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