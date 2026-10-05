// src/app/app/page.tsx
import React from "react";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export default async function AppPage() {
  const session = await getServerSession(authOptions);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm">
        <h2 className="text-2xl font-bold text-slate-800">
          Добро пожаловать, {session?.user?.name}! 👋
        </h2>
        <p className="text-slate-600 mt-2">
          Вы вошли в корпоративный таск-менеджер под ролью{" "}
          <strong className="text-blue-600">
            {session?.user?.role === "ADMIN" ? "Администратор" : "Сотрудник"}
          </strong>.
        </p>
        <p className="text-slate-500 text-sm mt-4">
          Используйте левое меню, чтобы перейти к задачам, календарю встреч или интерактивным таблицам.
        </p>
      </div>
    </div>
  );
}