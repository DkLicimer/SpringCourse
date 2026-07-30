// src/server/actions/users.ts
"use server";

import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

// Автоматическая генерация инициалов (например, "Иван Иванов" -> "ИИ")
function generateInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  if (parts.length === 1 && parts[0].length > 0) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return "СП"; // Сотрудник По умолчанию
}

export async function createEmployee(formData: FormData) {
  // Проверка прав (только ADMIN может создавать сотрудников)
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    throw new Error("Недостаточно прав");
  }

  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  
  // Чтение настроек прав для интерактивных таблиц
  const canReadSocial = formData.get("canReadSocial") === "true";
  const canWriteSocial = formData.get("canWriteSocial") === "true";
  const canReadTeam = formData.get("canReadTeam") === "true";
  const canWriteTeam = formData.get("canWriteTeam") === "true";

  if (!name || !email || !password) {
    throw new Error("Все поля обязательны для заполнения");
  }

  // Проверка, существует ли уже такой email
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    throw new Error("Пользователь с таким Email уже зарегистрирован");
  }

  // Хешируем пароль и генерируем инициалы
  const passwordHash = await bcrypt.hash(password, 10);
  const initials = generateInitials(name);

  // Создаем пользователя и его права доступа в одной транзакции
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

    // Создаем записи о правах доступа для "social_passport"
    await tx.tableAccess.create({
      data: {
        userId: newUser.id,
        tableName: "social_passport",
        canRead: canReadSocial,
        canWrite: canWriteSocial,
      },
    });

    // Создаем записи о правах доступа для "teambuilding"
    await tx.tableAccess.create({
      data: {
        userId: newUser.id,
        tableName: "teambuilding",
        canRead: canReadTeam,
        canWrite: canWriteTeam,
      },
    });
  });

  // Сбрасываем кэш страницы, чтобы новые данные сразу отобразились
  revalidatePath("/app/employees");
}
// Добавьте этот экспорт в конец src/server/actions/users.ts

export async function deleteEmployee(userId: string) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    throw new Error("Недостаточно прав");
  }

  // Защита: нельзя удалить самого себя
  if (session.user.id === userId) {
    throw new Error("Вы не можете удалить свою собственную учетную запись");
  }

  // Удаляем пользователя (связанные записи TableAccess удалятся каскадно)
  await prisma.user.delete({
    where: { id: userId },
  });

  revalidatePath("/app/employees");
}

// Добавьте эту функцию в самый конец файла src/server/actions/users.ts

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

  if (!name || !email) {
    throw new Error("ФИО и Email обязательны для заполнения");
  }

  await prisma.$transaction(async (tx) => {
    // 1. Формируем объект обновления данных пользователя
    const updateData: any = { name, email };
    
    // Если администратор указал новый пароль — хешируем и обновляем его
    if (password && password.trim().length > 0) {
      updateData.passwordHash = await bcrypt.hash(password, 10);
    }

    await tx.user.update({
      where: { id: userId },
      data: updateData,
    });

    // 2. Обновляем (или создаем, если не было) права доступа к таблице Соц паспорт
    await tx.tableAccess.upsert({
      where: {
        userId_tableName: { userId, tableName: "social_passport" }
      },
      update: { canRead: canReadSocial, canWrite: canWriteSocial },
      create: {
        userId,
        tableName: "social_passport",
        canRead: canReadSocial,
        canWrite: canWriteSocial
      }
    });

    // 3. Обновляем права к таблице Командообразование
    await tx.tableAccess.upsert({
      where: {
        userId_tableName: { userId, tableName: "teambuilding" }
      },
      update: { canRead: canReadTeam, canWrite: canWriteTeam },
      create: {
        userId,
        tableName: "teambuilding",
        canRead: canReadTeam,
        canWrite: canWriteTeam
      }
    });
  });

  revalidatePath("/app/employees");
}