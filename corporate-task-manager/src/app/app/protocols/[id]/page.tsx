// src/app/app/protocols/[id]/page.tsx
import React from "react";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PrintProtocolButton } from "./PrintProtocolButton";

export default async function ProtocolDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const resolvedParams = await params;
  const protocol = await prisma.meetingProtocol.findUnique({
    where: { id: resolvedParams.id },
    include: {
      chairman: true,
      secretary: true,
      attendees: true,
      tasks: {
        include: {
          assignments: {
            include: { user: true },
          },
        },
      },
    },
  });

  if (!protocol) notFound();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Кнопки навигации и печати */}
      <div className="flex justify-between items-center print:hidden">
        <Link
          href="/app/protocols"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Назад к реестру протоколов
        </Link>
        <PrintProtocolButton />
      </div>

      {/* ОФИЦИАЛЬНЫЙ БЛАНК ПРОТОКОЛА */}
      <div className="bg-white p-8 md:p-12 rounded-3xl border border-slate-200 shadow-sm print:border-none print:shadow-none print:p-0 space-y-6 text-slate-900 font-serif">
        {/* Шапка организации */}
        <div className="text-center border-b-2 border-slate-900 pb-4 space-y-1">
          <div className="text-xs uppercase tracking-widest font-sans font-bold text-slate-600">
            Государственное бюджетное учреждение / Корпоративная система
          </div>
          <h1 className="text-xl font-bold uppercase tracking-wider font-sans">
            ПРОТОКОЛ СОВЕЩАНИЯ
          </h1>
          <div className="text-sm font-sans font-extrabold text-blue-800">
            № {protocol.protocolNumber}
          </div>
        </div>

        {/* Дата, время и место */}
        <div className="flex justify-between text-xs font-sans border-b pb-3 text-slate-700">
          <div><strong>Дата:</strong> {new Date(protocol.meetingDate).toLocaleDateString("ru-RU")}</div>
          <div><strong>Место:</strong> {protocol.location || "Онлайн-аудиокомната"}</div>
        </div>

        {/* Тема */}
        <div className="space-y-1">
          <div className="text-xs uppercase font-bold text-slate-500 font-sans">Тема совещания:</div>
          <div className="text-base font-bold">{protocol.title}</div>
        </div>

        {/* Руководство и состав */}
        <div className="space-y-2 text-sm bg-slate-50 p-4 rounded-xl print:bg-transparent print:p-0">
          <div><strong>Председатель:</strong> {protocol.chairman.name}</div>
          {protocol.secretary && <div><strong>Секретарь:</strong> {protocol.secretary.name}</div>}
          <div>
            <strong>Присутствовали ({protocol.attendees.length}):</strong>{" "}
            {protocol.attendees.map((a) => a.name).join(", ") || "Все участники"}
          </div>
        </div>

        {/* Повестка дня */}
        {protocol.agenda && (
          <div className="space-y-1.5">
            <h3 className="text-sm font-bold uppercase font-sans tracking-wide text-slate-800">
              Повестка дня:
            </h3>
            <p className="text-sm leading-relaxed whitespace-pre-line pl-4 border-l-2 border-slate-300">
              {protocol.agenda}
            </p>
          </div>
        )}

        {/* 1. Слушали */}
        {protocol.discussionText && (
          <div className="space-y-1.5">
            <h3 className="text-sm font-bold uppercase font-sans tracking-wide text-slate-800">
              1. СЛУШАЛИ:
            </h3>
            <p className="text-sm leading-relaxed whitespace-pre-line pl-4 border-l-2 border-slate-300">
              {protocol.discussionText}
            </p>
          </div>
        )}

        {/* 2. Постановили */}
        {protocol.decisionsText && (
          <div className="space-y-1.5">
            <h3 className="text-sm font-bold uppercase font-sans tracking-wide text-slate-800">
              2. ПОСТАНОВИЛИ:
            </h3>
            <p className="text-sm leading-relaxed whitespace-pre-line pl-4 border-l-2 border-slate-300">
              {protocol.decisionsText}
            </p>
          </div>
        )}

        {/* 3. Таблица выданных поручений */}
        {protocol.tasks.length > 0 && (
          <div className="space-y-2 pt-2">
            <h3 className="text-sm font-bold uppercase font-sans tracking-wide text-slate-800">
              3. ПЕРЕЧЕНЬ ПОРУЧЕНИЙ И ОТВЕТСТВЕННЫХ:
            </h3>
            <table className="min-w-full border border-slate-300 text-xs font-sans">
              <thead className="bg-slate-100">
                <tr>
                  <th className="border border-slate-300 p-2 text-left">№</th>
                  <th className="border border-slate-300 p-2 text-left">Суть поручения</th>
                  <th className="border border-slate-300 p-2 text-left">Ответственный исполнитель</th>
                  <th className="border border-slate-300 p-2 text-left">Срок исполнения</th>
                </tr>
              </thead>
              <tbody>
                {protocol.tasks.map((task, idx) => (
                  <tr key={task.id}>
                    <td className="border border-slate-300 p-2 font-bold text-center">{idx + 1}</td>
                    <td className="border border-slate-300 p-2 font-medium">{task.title}</td>
                    <td className="border border-slate-300 p-2">
                      {task.assignments.map((as) => as.user.name).join(", ")}
                    </td>
                    <td className="border border-slate-300 p-2 font-bold">
                      {task.deadline ? new Date(task.deadline).toLocaleDateString("ru-RU") : "Не установлен"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Подписи */}
        <div className="pt-8 grid grid-cols-2 gap-8 text-sm font-sans border-t border-slate-200">
          <div>
            <div className="font-bold">Председатель:</div>
            <div className="mt-6 border-b border-slate-400 w-48"></div>
            <div className="text-xs text-slate-500 mt-1">{protocol.chairman.name}</div>
          </div>
          <div>
            <div className="font-bold">Секретарь:</div>
            <div className="mt-6 border-b border-slate-400 w-48"></div>
            <div className="text-xs text-slate-500 mt-1">{protocol.secretary?.name || "—"}</div>
          </div>
        </div>
      </div>
    </div>
  );
}