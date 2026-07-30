// src/app/app/tables/content-plan/ContentPlanClient.tsx
"use client";

import React, { useState, useTransition } from "react";
import { createContentPlanRow, deleteContentPlanRow } from "@/server/actions/tables";
import { Plus, Trash2, ArrowLeft, Calendar, Search, X } from "lucide-react";
import Link from "next/link";

type ContentPlanRow = {
  id: string;
  topic: string;
  platform: string;
  publishDate: string;
  status: string;
  notes: string | null;
  author: { name: string; initials: string } | null;
};

interface ContentPlanClientProps {
  initialRows: ContentPlanRow[];
  isAdmin: boolean;
}

export function ContentPlanClient({ initialRows, isAdmin }: ContentPlanClientProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const filteredRows = initialRows.filter(
    (r) =>
      r.topic.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.platform.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.status.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      try {
        await createContentPlanRow(formData);
        setIsOpen(false);
      } catch (err: any) {
        alert(err.message || "Ошибка добавления строки");
      }
    });
  };

  const handleDelete = async (id: string, topic: string) => {
    if (!window.confirm(`Удалить публикацию "${topic}" из контент-плана?`)) return;
    startTransition(async () => {
      try {
        await deleteContentPlanRow(id);
      } catch (err: any) {
        alert(err.message || "Ошибка удаления");
      }
    });
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
          <h2 className="text-2xl font-bold text-slate-800">Контент-план публикаций</h2>
          <p className="text-slate-500 text-sm">График выхода материалов по всем площадкам организации</p>
        </div>

        {isAdmin && (
          <button
            onClick={() => setIsOpen(true)}
            className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors shadow-sm w-full sm:w-auto"
          >
            <Plus className="h-4 w-4" />
            Добавить публикацию
          </button>
        )}
      </div>

      {/* Поиск */}
      <div className="relative max-w-md bg-white rounded-lg shadow-sm">
        <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
        <input
          type="text"
          placeholder="Поиск по теме, площадке, статусу..."
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 text-slate-800"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Таблица контент-плана */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Дата выхода</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Тема публикации</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Площадка</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Статус</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Автор / Заявитель</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Примечания</th>
              {isAdmin && <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Действия</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white">
            {filteredRows.length === 0 ? (
              <tr>
                <td colSpan={isAdmin ? 7 : 6} className="px-6 py-8 text-center text-slate-400 text-sm">
                  Публикации не найдены
                </td>
              </tr>
            ) : (
              filteredRows.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50/50 transition-colors text-sm">
                  <td className="px-6 py-4 whitespace-nowrap font-medium text-slate-700">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-4 w-4 text-slate-400" />
                      {new Date(row.publishDate).toLocaleDateString("ru-RU")}
                    </div>
                  </td>
                  <td className="px-6 py-4 font-bold text-slate-900">{row.topic}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-xs bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md font-medium">
                      {row.platform}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${
                      row.status === "Опубликовано" ? "bg-emerald-100 text-emerald-800" : "bg-blue-100 text-blue-800"
                    }`}>
                      {row.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-slate-600">
                    {row.author ? row.author.name : "—"}
                  </td>
                  <td className="px-6 py-4 text-slate-500 max-w-xs truncate" title={row.notes || ""}>
                    {row.notes || "—"}
                  </td>
                  {isAdmin && (
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <button
                        onClick={() => handleDelete(row.id, row.topic)}
                        disabled={isPending}
                        className="text-red-500 hover:text-red-700 p-1.5 hover:bg-red-50 rounded-lg transition-colors"
                        title="Удалить"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* МОДАЛЬНОЕ ОКНО: ДОБАВЛЕНИЕ СТРОКИ */}
      {isOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl border border-slate-200">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-200">
              <h3 className="text-lg font-bold text-slate-800">Добавить пост в Контент-план</h3>
              <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Тема публикации</label>
                  <input
                    type="text"
                    name="topic"
                    required
                    placeholder="Например, Обзор нового функционала"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 text-slate-800"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Площадка</label>
                    <select
                      name="platform"
                      required
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:border-blue-500 text-slate-800"
                    >
                      <option value="VK">ВКонтакте</option>
                      <option value="Telegram">Telegram</option>
                      <option value="Дзен">Дзен</option>
                      <option value="Сайт">Сайт</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Статус</label>
                    <select
                      name="status"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:border-blue-500 text-slate-800"
                    >
                      <option value="Черновик">Черновик</option>
                      <option value="В работе">В работе</option>
                      <option value="Опубликовано">Опубликовано</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Дата публикации</label>
                  <input
                    type="date"
                    name="publishDate"
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Примечания / Текст</label>
                  <textarea
                    name="notes"
                    rows={2}
                    placeholder="Детали поста, хештеги и ссылки..."
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
                  Добавить
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}