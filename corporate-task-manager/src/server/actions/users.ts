// src/server/actions/users.ts
"use server";

import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

// Автоматическая генерация инициалов
function generateInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  if (parts.length === 1 && parts[0].length > 0) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return "СП";
}

export async function createEmployee(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    throw new Error("Недостаточно прав");
  }

  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  
  // Права доступа
  const canReadSocial = formData.get("canReadSocial") === "true";
  const canWriteSocial = formData.get("canWriteSocial") === "true";
  const canReadTeam = formData.get("canReadTeam") === "true";
  const canWriteTeam = formData.get("canWriteTeam") === "true";
  const canReadContent = formData.get("canReadContent") === "true";
  const canWriteContent = formData.get("canWriteContent") === "true";
  const canReadPost = formData.get("canReadPost") === "true";
  const canWritePost = formData.get("canWritePost") === "true";

  if (!name || !email || !password) {
    throw new Error("Все поля обязательны для заполнения");
  }

  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    throw new Error("Пользователь с таким Email уже зарегистрирован");
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const initials = generateInitials(name);

  await prisma.$transaction(async (tx) => {
    const newUser = await tx.user.create({
      data: {
        email,
        name,
        passwordHash,
        initials,
        role: "EMPLOYEE",
      },
    });

    // Создаем записи о правах доступа для каждой таблицы
    await tx.tableAccess.create({
      data: { userId: newUser.id, tableName: "social_passport", canRead: canReadSocial, canWrite: canWriteSocial },
    });

    await tx.tableAccess.create({
      data: { userId: newUser.id, tableName: "teambuilding", canRead: canReadTeam, canWrite: canWriteTeam },
    });

    await tx.tableAccess.create({
      data: { userId: newUser.id, tableName: "content_plan", canRead: canReadContent, canWrite: canWriteContent },
    });

    await tx.tableAccess.create({
      data: { userId: newUser.id, tableName: "post_request", canRead: canReadPost, canWrite: canWritePost },
    });
  });

  revalidatePath("/app/employees");
}

export async function deleteEmployee(userId: string) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    throw new Error("Недостаточно прав");
  }

  if (session.user.id === userId) {
    throw new Error("Вы не можете удалить свою собственную учетную запись");
  }

  await prisma.user.delete({
    where: { id: userId },
  });

  revalidatePath("/app/employees");
}

export async function updateEmployee(userId: string, formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    throw new Error("Недостаточно прав");
  }

  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  
  const canReadSocial = formData.get("canReadSocial") === "true";
  const canWriteSocial = formData.get("canWriteSocial") === "true";
  const canReadTeam = formData.get("canReadTeam") === "true";
  const canWriteTeam = formData.get("canWriteTeam") === "true";
  const canReadContent = formData.get("canReadContent") === "true";
  const canWriteContent = formData.get("canWriteContent") === "true";
  const canReadPost = formData.get("canReadPost") === "true";
  const canWritePost = formData.get("canWritePost") === "true";

  if (!name || !email) {
    throw new Error("ФИО и Email обязательны для заполнения");
  }

  await prisma.$transaction(async (tx) => {
    const updateData: any = { name, email };
    
    if (password && password.trim().length > 0) {
      updateData.passwordHash = await bcrypt.hash(password, 10);
    }

    await tx.user.update({
      where: { id: userId },
      data: updateData,
    });

    // Обновляем права (upsert) для четырех таблиц
    await tx.tableAccess.upsert({
      where: { userId_tableName: { userId, tableName: "social_passport" } },
      update: { canRead: canReadSocial, canWrite: canWriteSocial },
      create: { userId, tableName: "social_passport", canRead: canReadSocial, canWrite: canWriteSocial }
    });

    await tx.tableAccess.upsert({
      where: { userId_tableName: { userId, tableName: "teambuilding" } },
      update: { canRead: canReadTeam, canWrite: canWriteTeam },
      create: { userId, tableName: "teambuilding", canRead: canReadTeam, canWrite: canWriteTeam }
    });

    await tx.tableAccess.upsert({
      where: { userId_tableName: { userId, tableName: "content_plan" } },
      update: { canRead: canReadContent, canWrite: canWriteContent },
      create: { userId, tableName: "content_plan", canRead: canReadContent, canWrite: canWriteContent }
    });

    await tx.tableAccess.upsert({
      where: { userId_tableName: { userId, tableName: "post_request" } },
      update: { canRead: canReadPost, canWrite: canWritePost },
      create: { userId, tableName: "post_request", canRead: canReadPost, canWrite: canWritePost }
    });
  });

  revalidatePath("/app/employees");
}