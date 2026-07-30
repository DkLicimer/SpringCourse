// src/components/AppShell.tsx
"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  CheckSquare, 
  Calendar, 
  Table, 
  Users, 
  LayoutDashboard, 
  Menu, 
  X 
} from "lucide-react";
import { LogoutButton } from "@/components/LogoutButton";
import { NotificationBell } from "@/components/NotificationBell";

interface AppShellProps {
  children: React.ReactNode;
  sessionUser: {
    name?: string | null;
    email?: string | null;
    role: string;
    initials: string;
  };
}

export function AppShell({ children, sessionUser }: AppShellProps) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const pathname = usePathname();
  const isAdmin = sessionUser.role === "ADMIN";

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
      roles: ["ADMIN"],
    },
    {
      title: "Отчеты",
      href: "/app/dashboard",
      icon: <LayoutDashboard className="h-5 w-5" />,
      roles: ["ADMIN"],
    },
  ];

  const filteredMenuItems = menuItems.filter((item) =>
    item.roles.includes(sessionUser.role)
  );

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden">
      {/* 1. ДЕСКТОПНЫЙ САЙДБАР (Отображается на экранах от md и больше) */}
      <aside className="hidden md:flex md:w-64 md:flex-col bg-slate-900 text-white shrink-0">
        <div className="flex items-center justify-center h-16 border-b border-slate-800 px-4">
          <span className="text-lg font-bold tracking-wider text-blue-400">
            TASK MANAGER
          </span>
        </div>
        <div className="flex flex-col flex-1 overflow-y-auto px-4 py-4 space-y-1">
          <div className="text-xs text-slate-400 font-semibold px-3 uppercase tracking-wider mb-2">
            Меню {isAdmin ? "(Админ)" : "(Сотрудник)"}
          </div>
          {filteredMenuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm font-medium ${
                  isActive 
                    ? "bg-blue-600 text-white" 
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }`}
              >
                {item.icon}
                {item.title}
              </Link>
            );
          })}
        </div>
        <div className="p-4 border-t border-slate-800">
          <LogoutButton />
        </div>
      </aside>

      {/* 2. МОБИЛЬНЫЙ САЙДБАР (DRAWER) с затемнением фона */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden flex">
          {/* Затемнение */}
          <div 
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={() => setIsMobileOpen(false)}
          />
          
          {/* Контент выдвижного меню */}
          <aside className="relative flex flex-col w-64 max-w-xs bg-slate-900 text-white h-full z-50">
            <div className="flex items-center justify-between h-16 px-4 border-b border-slate-800">
              <span className="text-lg font-bold tracking-wider text-blue-400">
                TASK MANAGER
              </span>
              <button 
                onClick={() => setIsMobileOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="flex flex-col flex-1 overflow-y-auto px-4 py-4 space-y-1">
              {filteredMenuItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsMobileOpen(false)} // Закрываем при переходе
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm font-medium ${
                      isActive 
                        ? "bg-blue-600 text-white" 
                        : "text-slate-300 hover:bg-slate-800 hover:text-white"
                    }`}
                  >
                    {item.icon}
                    {item.title}
                  </Link>
                );
              })}
            </div>
            <div className="p-4 border-t border-slate-800">
              <LogoutButton />
            </div>
          </aside>
        </div>
      )}

      {/* Основная контентная область */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Шапка (Header) */}
        <header className="flex items-center justify-between h-16 bg-white border-b border-slate-200 px-4 md:px-6 z-10 print:hidden">
          <div className="flex items-center gap-3">
            {/* Кнопка-гамбургер для мобильных */}
            <button
              onClick={() => setIsMobileOpen(true)}
              className="md:hidden p-2 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <Menu className="h-6 w-6" />
            </button>
            <h1 className="text-sm md:text-lg font-semibold text-slate-800">
              Рабочее пространство
            </h1>
          </div>
          
          <div className="flex items-center gap-3 md:gap-4">
            <NotificationBell />

            <div className="flex items-center gap-2 md:gap-3 border-l border-slate-200 pl-3 md:pl-4">
              <div className="flex flex-col text-right">
                <span className="text-xs md:text-sm font-medium text-slate-700">
                  {sessionUser.name}
                </span>
                <span className="text-[10px] md:text-xs text-slate-400 uppercase font-bold tracking-wider">
                  {isAdmin ? "Руководитель" : "Сотрудник"}
                </span>
              </div>
              <div className="flex items-center justify-center h-8 w-8 md:h-10 md:w-10 rounded-full bg-blue-100 text-blue-700 font-bold text-xs md:text-sm tracking-wider">
                {sessionUser.initials}
              </div>
            </div>
          </div>
        </header>

        {/* Контент страницы */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 print:p-0">
          {children}
        </main>
      </div>
    </div>
  );
}