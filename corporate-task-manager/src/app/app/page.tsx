// src/app/app/tables/page.tsx
import React from "react";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import Link from "next/link";
import { 
  Contact, 
  FileText, 
  Send, 
  Globe, 
  Users, 
  Lock, 
  ArrowRight 
} from "lucide-react";

export default async function TablesHubPage() {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const isAdmin = session.user.role === "ADMIN";

  // Загружаем права пользователя на все защищенные таблицы
  const userAccesses = await prisma.tableAccess.findMany({
    where: { userId: session.user.id }
  });

  // Проверяем доступ на чтение
  const canReadSocial = isAdmin || userAccesses.find(a => a.tableName === "social_passport")?.canRead || false;
  const canReadTeam = isAdmin || userAccesses.find(a => a.tableName === "teambuilding")?.canRead || false;
  const canReadContent = isAdmin || userAccesses.find(a => a.tableName === "content_plan")?.canRead || false;
  const canReadPost = isAdmin || userAccesses.find(a => a.tableName === "post_request")?.canRead || false;

  const tables = [
    {
      id: "contacts",
      title: "Справочник контактов",
      description: "Общая телефонная книга сотрудников, отделов и должностей компании.",
      icon: <Contact className="h-8 w-8 text-blue-500" />,
      href: "/app/tables/contacts",
      hasAccess: true, // Доступно всем
    },
    {
      id: "content-plan",
      title: "Контент-план",
      description: "Календарь публикаций по всем площадкам организации.",
      icon: <FileText className="h-8 w-8 text-emerald-500" />,
      href: "/app/tables/content-plan",
      hasAccess: canReadContent,
    },
    {
      id: "post-request",
      title: "Заявка на пост",
      description: "Форма отправки материалов на публикацию в контент-план.",
      icon: <Send className="h-8 w-8 text-indigo-500" />,
      href: "/app/tables/post-request",
      hasAccess: canReadPost,
    },
    {
      id: "social-passport", // оставляем id для роутинга
      title: "Состав коллектива", // Переименовано!
      description: "Кадровая структура, ФИО, должности и внутренние контакты сотрудников вашего ДДМа.",
      icon: <Globe className="h-8 w-8 text-teal-500" />,
      href: "/app/tables/social-passport",
      hasAccess: canReadSocial,
    },
    {
      id: "teambuilding",
      title: "Командообразование",
      description: "План корпоративных мероприятий, сметы расходов и составы участников.",
      icon: <Users className="h-8 w-8 text-purple-500" />,
      href: "/app/tables/teambuilding",
      hasAccess: canReadTeam,
    },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Интерактивные таблицы</h2>
        <p className="text-slate-500 text-sm">Выберите таблицу для просмотра или внесения записей</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {tables.map((table) => (
          <div 
            key={table.id}
            className={`bg-white rounded-2xl border p-6 flex flex-col justify-between shadow-sm hover:shadow-md transition-all ${
              !table.hasAccess ? "opacity-60 border-slate-200" : "border-slate-200"
            }`}
          >
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <div className="p-3 bg-slate-50 rounded-xl">
                  {table.icon}
                </div>
                {!table.hasAccess && (
                  <span className="flex items-center gap-1 text-xs font-bold text-red-600 bg-red-50 border border-red-200 px-2.5 py-1 rounded-full">
                    <Lock className="h-3 w-3" /> Ограничено
                  </span>
                )}
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800">{table.title}</h3>
                <p className="text-sm text-slate-500 mt-2 leading-relaxed">{table.description}</p>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 flex justify-end">
              {table.hasAccess ? (
                <Link
                  href={table.href}
                  className="flex items-center gap-1 text-sm font-bold text-blue-600 hover:text-blue-800 transition-colors"
                >
                  Открыть таблицу <ArrowRight className="h-4 w-4" />
                </Link>
              ) : (
                <span className="text-xs text-slate-400 italic">Запросите доступ у администратора</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}