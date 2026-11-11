// src/server/actions/generalChat.ts
"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function sendGeneralMessage(text: string) {
  const session = await getServerSession(authOptions);
  if (!session) {
    throw new Error("Вы не авторизованы");
  }

  if (!text || !text.trim()) {
    throw new Error("Сообщение не может быть пустым");
  }

  const message = await prisma.generalMessage.create({
    data: {
      userId: session.user.id,
      text: text.trim(),
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          initials: true,
          department: true,
          role: true,
        },
      },
    },
  });

  revalidatePath("/app/tasks");
  return message;
}

export async function getGeneralMessages() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return [];
  }

  // Загружаем последние 50 сообщений общего чата
  return await prisma.generalMessage.findMany({
    take: 50,
    orderBy: { createdAt: "asc" },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          initials: true,
          department: true,
          role: true,
        },
      },
    },
  });
}

export async function deleteGeneralMessage(messageId: string) {
  const session = await getServerSession(authOptions);
  if (!session) {
    throw new Error("Вы не авторизованы");
  }

  const message = await prisma.generalMessage.findUnique({
    where: { id: messageId },
  });

  if (!message) {
    throw new Error("Сообщение не найдено");
  }

  const isAdmin = session.user.role === "ADMIN";
  const isOwner = message.userId === session.user.id;

  if (!isAdmin && !isOwner) {
    throw new Error("У вас нет прав для удаления этого сообщения");
  }

  await prisma.generalMessage.delete({
    where: { id: messageId },
  });

  revalidatePath("/app/tasks");
}