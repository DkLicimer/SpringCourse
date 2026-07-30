// src/app/app/layout.tsx
import React from "react";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { AppShell } from "@/components/AppShell";
import { UrgentTasksWidget } from "@/components/UrgentTasksWidget";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  // Если не авторизован — отправляем на вход
  if (!session) {
    redirect("/login");
  }

  // Передаем детей и данные сессии в интерактивную оболочку
  return (
    <AppShell sessionUser={session.user}>
      {children}
    </AppShell>
  );
}