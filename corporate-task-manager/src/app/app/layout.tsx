// src/app/app/layout.tsx
import React from "react";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { NotificationBell } from "@/components/NotificationBell";
import Link from "next/link";
import { 
  CheckSquare, 
  Calendar, 
  Table, 
  Users, 
  LogOut, 
  Bell, 
  User,
  LayoutDashboard
} from "lucide-react";
import { LogoutButton } from "@/components/LogoutButton";

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

  const isAdmin = session.user.role === "ADMIN";

  // Список пунктов меню
  const menuItems = [
    {
      title: "Задачи",
      href: "/app/tasks",
      icon: <CheckSquare className="h-5 w-5" />,
      roles: ["ADMIN", "EMPLOYEE"],
    },
    {
      title: "Календарь",
      href: "/app/calendar",
      icon: <Calendar className="h-5 w-5" />,
      roles: ["ADMIN", "EMPLOYEE"],
    },
    {
      title: "Таблицы",
      href: "/app/tables",
      icon: <Table className="h-5 w-5" />,
      roles: ["ADMIN", "EMPLOYEE"],
    },
    {
      title: "Сотрудники",
      href: "/app/employees",
      icon: <Users className="h-5 w-5" />,
      roles: ["ADMIN"], // Только для админа
    },
    {
      title: "Отчеты",
      href: "/app/dashboard",
      icon: <LayoutDashboard className="h-5 w-5" />,
      roles: ["ADMIN"], // Только для админа
    },
  ];

  const filteredMenuItems = menuItems.filter((item) =>
    item.roles.includes(session.user.role)
  );

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden">
      {/* Боковое меню (Sidebar) */}
      <aside className="hidden md:flex md:w-64 md:flex-col bg-slate-900 text-white">
        <div className="flex items-center justify-center h-16 border-b border-slate-800 px-4">
          <span className="text-lg font-bold tracking-wider text-blue-400">
            TASK MANAGER
          </span>
        </div>
        <div className="flex flex-col flex-1 overflow-y-auto px-4 py-4 space-y-1">
          <div className="text-xs text-slate-400 font-semibold px-3 uppercase tracking-wider mb-2">
            Меню {isAdmin ? "(Админ)" : "(Сотрудник)"}
          </div>
          {filteredMenuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition-colors text-sm font-medium"
            >
              {item.icon}
              {item.title}
            </Link>
          ))}
        </div>
        {/* Кнопка Выхода */}
        <div className="p-4 border-t border-slate-800">
          <LogoutButton />
        </div>
      </aside>

      {/* Основная контентная область */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Шапка (Header) */}
        <header className="flex items-center justify-between h-16 bg-white border-b border-slate-200 px-6 z-10">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-semibold text-slate-800">
              Рабочее пространство
            </h1>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Колокольчик уведомлений */}
            <NotificationBell />

            {/* Профиль пользователя */}
            <div className="flex items-center gap-3 border-l border-slate-200 pl-4">
              <div className="flex flex-col text-right">
                <span className="text-sm font-medium text-slate-700">
                  {session.user.name}
                </span>
                <span className="text-xs text-slate-400 uppercase font-bold tracking-wider">
                  {isAdmin ? "Руководитель" : "Сотрудник"}
                </span>
              </div>
              <div className="flex items-center justify-center h-10 w-10 rounded-full bg-blue-100 text-blue-700 font-bold text-sm tracking-wider">
                {session.user.initials}
              </div>
            </div>
          </div>
        </header>

        {/* Контент страницы */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}