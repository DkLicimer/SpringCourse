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
  isAdmin: boolean;
}

export function PostRequestClient({ initialRequests, isAdmin }: PostRequestClientProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

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
    if (!window.confirm(`Одобрить заявку "${topic}" и перенести её в Контент-план?`)) return;
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
        <span className="inline-flex items-center gap-1 text-xs bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full font-medium">
          <CheckCircle2 className="h-3 w-3" /> Одобрено (в плане)
        </span>
      );
    }
    if (status === "REJECTED") {
      return (
        <span className="inline-flex items-center gap-1 text-xs bg-rose-100 text-rose-800 px-2.5 py-0.5 rounded-full font-medium">
          <XCircle className="h-3 w-3" /> Отклонено
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-xs bg-amber-100 text-amber-800 px-2.5 py-0.5 rounded-full font-medium">
        <Clock className="h-3 w-3" /> На рассмотрении
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
          className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors shadow-sm w-full sm:w-auto"
        >
          <Send className="h-4 w-4" />
          Подать заявку на пост
        </button>
      </div>

      {/* Таблица заявок */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Автор</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Тема и Описание</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Площадка</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Желаемая дата</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Статус</th>
              {isAdmin && <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Действия</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white">
            {initialRequests.length === 0 ? (
              <tr>
                <td colSpan={isAdmin ? 6 : 5} className="px-6 py-8 text-center text-slate-400 text-sm">
                  Заявок пока нет
                </td>
              </tr>
            ) : (
              initialRequests.map((req) => (
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
                  {isAdmin && (
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      {req.status === "PENDING" ? (
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleApprove(req.id, req.topic)}
                            disabled={isPending}
                            className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-lg transition-colors"
                            title="Одобрить в контент-план"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleReject(req.id, req.topic)}
                            disabled={isPending}
                            className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition-colors"
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

      {/* МОДАЛЬНОЕ ОКНО: ФОРМА ЗАЯВКИ */}
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