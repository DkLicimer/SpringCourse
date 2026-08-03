// src/app/app/tables/post-request/PostRequestClient.tsx
"use client";

import React, { useState, useTransition } from "react";
import { 
  createPostRequest, 
  approvePostRequest, 
  rejectPostRequest 
} from "@/server/actions/tables";
import { 
  Send, 
  Check, 
  X, 
  ArrowLeft, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  XCircle 
} from "lucide-react";
import Link from "next/link";

type PostRequest = {
  id: string;
  topic: string;
  description: string;
  platform: string;
  requestedDate: string;
  status: string;
  createdAt: string;
  user: { name: string; initials: string; email: string };
};

interface PostRequestClientProps {
  initialRequests: PostRequest[];
  canManage: boolean; // Заменили isAdmin на canManage
}

export function PostRequestClient({ initialRequests, canManage }: PostRequestClientProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [filter, setFilter] = useState<"ALL" | "PENDING" | "ARCHIVED">("PENDING");

  const filteredRequests = initialRequests.filter((req) => {
    if (filter === "PENDING") return req.status === "PENDING";
    if (filter === "ARCHIVED") return req.status === "APPROVED" || req.status === "REJECTED";
    return true;
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      try {
        await createPostRequest(formData);
        setIsOpen(false);
      } catch (err: any) {
        setError(err.message || "Ошибка отправки заявки");
      }
    });
  };

  const handleApprove = async (id: string, topic: string) => {
    if (!window.confirm(`Одобрить заявку "${topic}"?`)) return;
    startTransition(async () => {
      try {
        await approvePostRequest(id);
      } catch (err: any) {
        alert(err.message || "Ошибка при одобрении");
      }
    });
  };

  const handleReject = async (id: string, topic: string) => {
    if (!window.confirm(`Отклонить заявку "${topic}"?`)) return;
    startTransition(async () => {
      try {
        await rejectPostRequest(id);
      } catch (err: any) {
        alert(err.message || "Ошибка при отклонении");
      }
    });
  };

  const renderStatusBadge = (status: string) => {
    if (status === "APPROVED") {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-100 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
          <CheckCircle2 className="h-3 w-3" /> Одобрено
        </span>
      );
    }
    if (status === "REJECTED") {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] bg-rose-100 text-rose-800 border border-rose-200 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
          <XCircle className="h-3 w-3" /> Отклонено
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-[10px] bg-amber-100 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
        <Clock className="h-3 w-3 animate-pulse" /> На рассмотрении
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Шапка */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-1">
          <Link
            href="/app/tables"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-slate-700 transition-colors mb-1"
          >
            <ArrowLeft className="h-3 w-3" /> Назад к таблицам
          </Link>
          <h2 className="text-2xl font-bold text-slate-800">Заявки на посты</h2>
          <p className="text-slate-500 text-sm">Предложите материал — при одобрении он автоматически попадет в контент-план</p>
        </div>

        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors shadow-sm w-full sm:w-auto cursor-pointer"
        >
          <Send className="h-4 w-4" />
          Подать заявку на пост
        </button>
      </div>

      {/* ФИЛЬТР-АРХИВ ЗАЯВОК (Вкладки) */}
      <div className="flex bg-slate-200/60 p-1 rounded-xl max-w-sm border border-slate-200 shadow-inner">
        {(["PENDING", "ARCHIVED", "ALL"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              filter === f 
                ? "bg-white text-blue-600 shadow-sm" 
                : "text-slate-600 hover:text-slate-800"
            }`}
          >
            {f === "PENDING" && "Новые"}
            {f === "ARCHIVED" && "Архив"}
            {f === "ALL" && "Все"}
          </button>
        ))}
      </div>

      {/* ========================================================================= */}
      {/* 💻 ДЕСКТОПНАЯ ВЕРСИЯ ТАБЛИЦЫ */}
      {/* ========================================================================= */}
      <div className="hidden md:block bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Автор</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Тема и Описание</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Площадка</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Желаемая дата</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Статус</th>
              {canManage && <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Действия</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white">
            {filteredRequests.length === 0 ? (
              <tr>
                <td colSpan={canManage ? 6 : 5} className="px-6 py-8 text-center text-slate-400 text-sm">
                  Заявок в этой категории нет
                </td>
              </tr>
            ) : (
              filteredRequests.map((req) => (
                <tr key={req.id} className="hover:bg-slate-50/50 transition-colors text-sm">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 rounded-full bg-slate-100 text-slate-700 font-bold items-center justify-center text-xs">
                        {req.user.initials}
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900">{req.user.name}</div>
                        <div className="text-xs text-slate-400">{new Date(req.createdAt).toLocaleDateString()}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-800">{req.topic}</div>
                    <div className="text-xs text-slate-500 mt-1 line-clamp-2">{req.description}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-xs bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md font-medium">
                      {req.platform}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-slate-600 font-medium">
                    <div className="flex items-center gap-1.5 text-xs">
                      <Calendar className="h-3.5 w-3.5 text-slate-400" />
                      {new Date(req.requestedDate).toLocaleDateString("ru-RU")}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {renderStatusBadge(req.status)}
                  </td>
                  {canManage && (
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      {req.status === "PENDING" ? (
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleApprove(req.id, req.topic)}
                            disabled={isPending}
                            className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-lg transition-colors cursor-pointer"
                            title="Одобрить в контент-план"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleReject(req.id, req.topic)}
                            disabled={isPending}
                            className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition-colors cursor-pointer"
                            title="Отклонить"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 italic">Обработано</span>
                      )}
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ========================================================================= */}
      {/* 📱 МОБИЛЬНАЯ ВЕРСИЯ КАРТОЧЕК */}
      {/* ========================================================================= */}
      <div className="block md:hidden space-y-4">
        {filteredRequests.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-sm bg-white rounded-xl border">
            Заявок в этой категории нет
          </div>
        ) : (
          filteredRequests.map((req) => (
            <div key={req.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
              <div className="flex justify-between items-start border-b border-slate-100 pb-2.5">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 rounded-full bg-slate-100 text-slate-700 font-bold items-center justify-center text-xs">
                    {req.user.initials}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-900 leading-snug">{req.user.name}</div>
                    <div className="text-[10px] text-slate-400 leading-none">Подано: {new Date(req.createdAt).toLocaleDateString()}</div>
                  </div>
                </div>
                <div>
                  {renderStatusBadge(req.status)}
                </div>
              </div>

              <div className="space-y-1">
                <div className="font-bold text-slate-950 text-sm leading-snug">{req.topic}</div>
                <div className="text-xs text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-100 italic leading-relaxed whitespace-pre-line">
                  {req.description}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                <div className="bg-slate-50 p-2 rounded-lg border border-slate-100 flex flex-col gap-0.5">
                  <span className="text-slate-400 font-medium text-[9px] uppercase">Площадка</span>
                  <span className="font-bold text-slate-800">{req.platform}</span>
                </div>
                <div className="bg-slate-50 p-2 rounded-lg border border-slate-100 flex flex-col gap-0.5">
                  <span className="text-slate-400 font-medium text-[9px] uppercase">Желаемая дата</span>
                  <span className="font-bold text-slate-800 flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5 text-slate-400" />
                    {new Date(req.requestedDate).toLocaleDateString("ru-RU")}
                  </span>
                </div>
              </div>

              {canManage && req.status === "PENDING" && (
                <div className="flex gap-2 pt-2 border-t border-slate-100">
                  <button
                    onClick={() => handleApprove(req.id, req.topic)}
                    disabled={isPending}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                  >
                    <Check className="h-4 w-4" /> Одобрить
                  </button>
                  <button
                    onClick={() => handleReject(req.id, req.topic)}
                    disabled={isPending}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                  >
                    <X className="h-4 w-4" /> Отклонить
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* МОДАЛЬНОЕ ОКНО */}
      {isOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl border border-slate-200">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-200">
              <h3 className="text-lg font-bold text-slate-800">Подать заявку на публикацию</h3>
              <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && (
                <div className="rounded-lg bg-red-50 p-4 text-xs text-red-600 border border-red-100">
                  {error}
                </div>
              )}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Тема публикации</label>
                  <input
                    type="text"
                    name="topic"
                    required
                    placeholder="Например, Анонс летнего конкурса"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Площадка</label>
                  <select
                    name="platform"
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:border-blue-500 text-slate-800"
                  >
                    <option value="VK">ВКонтакте (VK)</option>
                    <option value="Telegram">Telegram канал</option>
                    <option value="Дзен">Дзен</option>
                    <option value="Сайт">Официальный сайт</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Желаемая дата выхода</label>
                  <input
                    type="date"
                    name="requestedDate"
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Текст поста / Материалы</label>
                  <textarea
                    name="description"
                    rows={3}
                    required
                    placeholder="Опишите идею, прикрепите ссылки на картинки..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 text-slate-800"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-sm"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold disabled:bg-blue-400"
                >
                  Отправить
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}