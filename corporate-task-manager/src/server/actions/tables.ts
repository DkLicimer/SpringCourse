// src/server/actions/tables.ts
"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

// Проверка прав доступа сотрудника к таблицам в реальном времени
async function verifyAccess(tableName: string, action: "read" | "write"): Promise<boolean> {
  const session = await getServerSession(authOptions);
  if (!session) return false;

  // Администратор всегда имеет полный доступ ко всему
  if (session.user.role === "ADMIN") return true;

  const access = await prisma.tableAccess.findUnique({
    where: {
      userId_tableName: {
        userId: session.user.id,
        tableName,
      },
    },
  });

  if (!access) return false;

  return action === "write" ? access.canWrite : access.canRead;
}

// =========================================================================
// 1. СПРАВОЧНИК КОНТАКТОВ
// =========================================================================

export async function createContact(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    throw new Error("Только администратор может добавлять контакты");
  }

  const fullName = formData.get("fullName") as string;
  const department = formData.get("department") as string;
  const position = formData.get("position") as string;
  const phone = formData.get("phone") as string;
  const email = formData.get("email") as string;
  const notes = formData.get("notes") as string;

  if (!fullName || !department || !position) {
    throw new Error("ФИО, подразделение и должность обязательны для заполнения");
  }

  await prisma.contact.create({
    data: { fullName, department, position, phone, email, notes },
  });

  revalidatePath("/app/tables/contacts");
}

export async function deleteContact(id: string) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    throw new Error("Только администратор может удалять контакты");
  }

  await prisma.contact.delete({ where: { id } });
  revalidatePath("/app/tables/contacts");
}

// =========================================================================
// 2. ЗАЯВКИ НА ПОСТЫ И КОНТЕНТ-ПЛАН (С ПРОВЕРКОЙ ПРАВ canWrite)
// =========================================================================

// Отправка сотрудником формы заявки на пост
export async function createPostRequest(formData: FormData) {
  const hasAccess = await verifyAccess("post_request", "write");
  if (!hasAccess) throw new Error("У вас нет прав для подачи заявок на публикации");

  const session = await getServerSession(authOptions);
  if (!session) throw new Error("Вы не авторизованы");

  const topic = formData.get("topic") as string;
  const description = formData.get("description") as string;
  const platform = formData.get("platform") as string;
  const requestedDate = formData.get("requestedDate") as string;

  if (!topic || !description || !platform || !requestedDate) {
    throw new Error("Заполните все поля заявки");
  }

  await prisma.postRequest.create({
    data: {
      topic,
      description,
      platform,
      requestedDate: new Date(requestedDate),
      userId: session.user.id,
    },
  });

  revalidatePath("/app/tables/post-request");
}

// Одобрение заявки (требует прав на запись в контент-план)
export async function approvePostRequest(requestId: string) {
  const hasAccess = await verifyAccess("content_plan", "write");
  if (!hasAccess) throw new Error("У вас нет прав на одобрение и перенос заявок в Контент-План");

  const request = await prisma.postRequest.findUnique({
    where: { id: requestId },
  });

  if (!request) throw new Error("Заявка не найдена");
  if (request.status !== "PENDING") throw new Error("Заявка уже обработана");

  await prisma.$transaction(async (tx) => {
    await tx.contentPlan.create({
      data: {
        topic: request.topic,
        platform: request.platform,
        publishDate: request.requestedDate,
        status: "Черновик",
        authorId: request.userId,
        notes: request.description,
      },
    });

    await tx.postRequest.update({
      where: { id: requestId },
      data: { status: "APPROVED" },
    });
  });

  revalidatePath("/app/tables/post-request");
  revalidatePath("/app/tables/content-plan");
}

// Отклонение заявки на пост (требует прав на запись в контент-план)
export async function rejectPostRequest(requestId: string) {
  const hasAccess = await verifyAccess("content_plan", "write");
  if (!hasAccess) throw new Error("У вас нет прав на отклонение заявок");

  await prisma.postRequest.update({
    where: { id: requestId },
    data: { status: "REJECTED" },
  });

  revalidatePath("/app/tables/post-request");
}

// Удаление строки контент-плана (требует прав на запись в контент-план)
export async function deleteContentPlanRow(id: string) {
  const hasAccess = await verifyAccess("content_plan", "write");
  if (!hasAccess) throw new Error("У вас нет прав на удаление записей из Контент-Плана");

  await prisma.contentPlan.delete({ where: { id } });
  revalidatePath("/app/tables/content-plan");
}

// Прямое добавление публикации в Контент-план (требует прав на запись в контент-план)
export async function createContentPlanRow(formData: FormData) {
  const hasAccess = await verifyAccess("content_plan", "write");
  if (!hasAccess) throw new Error("У вас нет прав для прямого добавления записей в Контент-План");

  const session = await getServerSession(authOptions);
  if (!session) throw new Error("Вы не авторизованы");

  const topic = formData.get("topic") as string;
  const platform = formData.get("platform") as string;
  const publishDate = formData.get("publishDate") as string;
  const status = (formData.get("status") as string) || "Черновик";
  const notes = formData.get("notes") as string;
  
  // Новое: считываем и сохраняем медиаматериалы
  const mediaMaterial = formData.get("mediaMaterial") as string || null;

  if (!topic || !platform || !publishDate) {
    throw new Error("Тема, площадка и дата обязательны для заполнения");
  }

  await prisma.contentPlan.create({
    data: {
      topic,
      platform,
      publishDate: new Date(publishDate),
      status,
      authorId: session.user.id,
      notes,
      mediaMaterial, // <-- Сохраняем медиаматериал в БД
    },
  });

  revalidatePath("/app/tables/content-plan");
}

// =========================================================================
// 3. ТАБЛИЦА «СОСТАВ КОЛЛЕКТИВА» (С ПРОВЕРКОЙ ПРАВ canWrite)
// =========================================================================

export async function createSocialPassportRow(formData: FormData) {
  const hasAccess = await verifyAccess("social_passport", "write");
  if (!hasAccess) throw new Error("У вас нет прав для добавления данных в эту таблицу");

  const department = formData.get("department") as string;
  const accountUrl = formData.get("accountUrl") as string;
  const followers = parseInt(formData.get("followers") as string) || 0;
  const notes = formData.get("notes") as string;

  if (!department || !accountUrl) {
    throw new Error("Подразделение и ФИО обязательны");
  }

  await prisma.socialPassport.create({
    data: { department, accountUrl, followers, notes },
  });

  revalidatePath("/app/tables/social-passport");
}

export async function deleteSocialPassportRow(id: string) {
  const hasAccess = await verifyAccess("social_passport", "write");
  if (!hasAccess) throw new Error("У вас нет прав для удаления данных из этой таблицы");

  await prisma.socialPassport.delete({ where: { id } });
  revalidatePath("/app/tables/social-passport");
}

// =========================================================================
// 4. ТАБЛИЦА «КОМАНДООБРАЗОВАНИЕ» (С ПРОВЕРКОЙ ПРАВ canWrite)
// =========================================================================

export async function createTeambuildingRow(formData: FormData) {
  const hasAccess = await verifyAccess("teambuilding", "write");
  if (!hasAccess) throw new Error("У вас нет прав для добавления данных в эту таблицу");

  const eventName = formData.get("eventName") as string;
  const date = formData.get("date") as string;
  const budget = parseFloat(formData.get("budget") as string) || 0.0;
  const participantsCount = parseInt(formData.get("participantsCount") as string) || 0;
  const notes = formData.get("notes") as string;

  if (!eventName || !date) {
    throw new Error("Название мероприятия и дата обязательны");
  }

  await prisma.teambuilding.create({
    data: {
      eventName,
      date: new Date(date),
      budget,
      participantsCount,
      notes,
    },
  });

  revalidatePath("/app/tables/teambuilding");
}

export async function deleteTeambuildingRow(id: string) {
  const hasAccess = await verifyAccess("teambuilding", "write");
  if (!hasAccess) throw new Error("У вас нет прав для удаления данных из этой таблицы");

  await prisma.teambuilding.delete({ where: { id } });
  revalidatePath("/app/tables/teambuilding");
}

// =========================================================================
// 5. ТАБЛИЦА «ИНФОПРОСТРАНСТВО» (Доступна всем на чтение, запись только админу)
// =========================================================================

export async function createInfoSpaceRow(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    throw new Error("Только администратор может добавлять записи в ИНФОпространство");
  }

  const fullName = formData.get("fullName") as string;
  const email = formData.get("email") as string;
  const notes = formData.get("notes") as string;

  if (!fullName || !email) {
    throw new Error("ФИО и электронный адрес обязательны для заполнения");
  }

  await prisma.infoSpace.create({
    data: { fullName, email, notes },
  });

  revalidatePath("/app/tables/info-space");
}

export async function deleteInfoSpaceRow(id: string) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    throw new Error("Только администратор может удалять записи");
  }

  await prisma.infoSpace.delete({ where: { id } });
  revalidatePath("/app/tables/info-space");
}