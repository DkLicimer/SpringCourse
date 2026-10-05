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
    return parts[0].slice(0, 3).toUpperCase();
  }
  return "СОТР";
}

export async function createEmployee(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    throw new Error("Недостаточно прав");
  }

  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  
  // Инициалы / сокращения (до 5 символов)
  const initialsRaw = formData.get("initials") as string;
  const initials = initialsRaw && initialsRaw.trim().length > 0 
    ? initialsRaw.trim().slice(0, 5).toUpperCase() 
    : generateInitials(name);

  // Подразделение сотрудника
  const department = (formData.get("department") as string) || "Основное подразделение";

  // Отчетный период
  const reportingPeriodType = (formData.get("reportingPeriodType") as string) || "MONTH";
  const periodStartDateRaw = formData.get("periodStartDate") as string;
  const periodEndDateRaw = formData.get("periodEndDate") as string;

  const periodStartDate = periodStartDateRaw ? new Date(periodStartDateRaw) : null;
  const periodEndDate = periodEndDateRaw ? new Date(periodEndDateRaw) : null;

  // Права доступа к таблицам
  const canReadSocial = formData.get("canReadSocial") === "true";
  const canWriteSocial = formData.get("canWriteSocial") === "true";
  const canReadTeam = formData.get("canReadTeam") === "true";
  const canWriteTeam = formData.get("canWriteTeam") === "true";
  const canReadContent = formData.get("canReadContent") === "true";
  const canWriteContent = formData.get("canWriteContent") === "true";
  const canReadPost = formData.get("canReadPost") === "true";
  const canWritePost = formData.get("canWritePost") === "true";
  const canReadInfo = formData.get("canReadInfo") === "true";
  const canWriteInfo = formData.get("canWriteInfo") === "true";

  if (!name || !email || !password) {
    throw new Error("ФИО, Email и Пароль обязательны для заполнения");
  }

  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    throw new Error("Пользователь с таким Email уже зарегистрирован");
  }

  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.$transaction(async (tx) => {
    // 1. Создаем пользователя
    const newUser = await tx.user.create({
      data: {
        email,
        name,
        passwordHash,
        initials,
        role: "EMPLOYEE",
        department,
        reportingPeriodType,
        periodStartDate,
        periodEndDate,
      },
    });

    // 2. Создаем права доступа
    await tx.tableAccess.createMany({
      data: [
        { userId: newUser.id, tableName: "social_passport", canRead: canReadSocial, canWrite: canWriteSocial },
        { userId: newUser.id, tableName: "teambuilding", canRead: canReadTeam, canWrite: canWriteTeam },
        { userId: newUser.id, tableName: "content_plan", canRead: canReadContent, canWrite: canWriteContent },
        { userId: newUser.id, tableName: "post_request", canRead: canReadPost, canWrite: canWritePost },
        { userId: newUser.id, tableName: "info_space", canRead: canReadInfo, canWrite: canWriteInfo },
      ],
    });

    // ⚡ 3. АВТО-СИНХРОНИЗАЦИЯ: Автоматически создаем запись в «Составе коллектива»
    await tx.socialPassport.create({
      data: {
        userId: newUser.id,
        fullName: name,
        department,
        accountUrl: name,
        notes: "",
      },
    });
  });

  revalidatePath("/app/employees");
  revalidatePath("/app/tables/social-passport");
}

export async function deleteEmployee(userId: string) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    throw new Error("Недостаточно прав");
  }

  if (session.user.id === userId) {
    throw new Error("Вы не можете удалить свою собственную учетную запись");
  }

  await prisma.$transaction(async (tx) => {
    // ⚡ АВТО-СИНХРОНИЗАЦИЯ: Удаляем связанную запись из «Состава коллектива»
    await tx.socialPassport.deleteMany({
      where: { userId },
    });

    await tx.user.delete({
      where: { id: userId },
    });
  });

  revalidatePath("/app/employees");
  revalidatePath("/app/tables/social-passport");
}

export async function updateEmployee(userId: string, formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    throw new Error("Недостаточно прав");
  }

  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  
  // Инициалы / сокращения (до 5 символов)
  const initialsRaw = formData.get("initials") as string;

  // Подразделение сотрудника
  const department = (formData.get("department") as string) || "Основное подразделение";

  // Отчетный период
  const reportingPeriodType = (formData.get("reportingPeriodType") as string) || "MONTH";
  const periodStartDateRaw = formData.get("periodStartDate") as string;
  const periodEndDateRaw = formData.get("periodEndDate") as string;

  const periodStartDate = periodStartDateRaw ? new Date(periodStartDateRaw) : null;
  const periodEndDate = periodEndDateRaw ? new Date(periodEndDateRaw) : null;

  const canReadSocial = formData.get("canReadSocial") === "true";
  const canWriteSocial = formData.get("canWriteSocial") === "true";
  const canReadTeam = formData.get("canReadTeam") === "true";
  const canWriteTeam = formData.get("canWriteTeam") === "true";
  const canReadContent = formData.get("canReadContent") === "true";
  const canWriteContent = formData.get("canWriteContent") === "true";
  const canReadPost = formData.get("canReadPost") === "true";
  const canWritePost = formData.get("canWritePost") === "true";
  const canReadInfo = formData.get("canReadInfo") === "true";
  const canWriteInfo = formData.get("canWriteInfo") === "true";

  if (!name || !email) {
    throw new Error("ФИО и Email обязательны для заполнения");
  }

  await prisma.$transaction(async (tx) => {
    const updateData: any = { 
      name, 
      email,
      department,
      reportingPeriodType,
      periodStartDate,
      periodEndDate,
    };
    
    if (initialsRaw && initialsRaw.trim().length > 0) {
      updateData.initials = initialsRaw.trim().slice(0, 5).toUpperCase();
    } else {
      updateData.initials = generateInitials(name);
    }

    if (password && password.trim().length > 0) {
      updateData.passwordHash = await bcrypt.hash(password, 10);
    }

    await tx.user.update({
      where: { id: userId },
      data: updateData,
    });

    // ⚡ АВТО-СИНХРОНИЗАЦИЯ: Обновляем ФИО и отдел в «Составе коллектива»
    const existingPassport = await tx.socialPassport.findFirst({ where: { userId } });
    if (existingPassport) {
      await tx.socialPassport.update({
        where: { id: existingPassport.id },
        data: {
          fullName: name,
          department,
          accountUrl: name,
        },
      });
    } else {
      await tx.socialPassport.create({
        data: {
          userId,
          fullName: name,
          department,
          accountUrl: name,
        },
      });
    }

    // Обновляем права
    const tables = [
      { name: "social_passport", r: canReadSocial, w: canWriteSocial },
      { name: "teambuilding", r: canReadTeam, w: canWriteTeam },
      { name: "content_plan", r: canReadContent, w: canWriteContent },
      { name: "post_request", r: canReadPost, w: canWritePost },
      { name: "info_space", r: canReadInfo, w: canWriteInfo },
    ];

    for (const t of tables) {
      await tx.tableAccess.upsert({
        where: { userId_tableName: { userId, tableName: t.name } },
        update: { canRead: t.r, canWrite: t.w },
        create: { userId, tableName: t.name, canRead: t.r, canWrite: t.w },
      });
    }
  });

  revalidatePath("/app/employees");
  revalidatePath("/app/tables/social-passport");
}