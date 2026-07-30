// src/app/app/tables/social-passport/SocialPassportClient.tsx
"use client";

import React, { useState, useTransition } from "react";
import { createSocialPassportRow, deleteSocialPassportRow } from "@/server/actions/tables";
import { Plus, Trash2, ArrowLeft, Search, Globe, X } from "lucide-react";
import Link from "next/link";

type SocialRow = {
  id: string;
  department: string;
  accountUrl: string;
  followers: number;
  notes: string | null;
};

interface SocialPassportClientProps {
  initialRows: SocialRow[];
  canWrite: boolean; // Ограничение на запись
}

export function SocialPassportClient({ initialRows, canWrite }: SocialPassportClientProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const filteredRows = initialRows.filter(
    (r) =>
      r.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.accountUrl.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      try {
        await createSocialPassportRow(formData);
        setIsOpen(false);
      } catch (err: any) {
        alert(err.message || "Ошибка добавления");
      }
    });
  };

  const handleDelete = async (id: string, dept: string) => {
    if (!window.confirm(`Удалить строку для "${dept}"?`)) return;
    startTransition(async () => {
      try {
        await deleteSocialPassportRow(id);
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
          <h2 className="text-2xl font-bold text-slate-800">Социальный паспорт</h2>
          <p className="text-slate-500 text-sm">Сводка официальных аккаунтов и площадок подразделений</p>
        </div>

        {canWrite && (
          <button
            onClick={() => setIsOpen(true)}
            className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors shadow-sm w-full sm:w-auto"
          >
            <Plus className="h-4 w-4" />
            Добавить запись
          </button>
        )}
      </div>

      {/* Поиск */}
      <div className="relative max-w-md bg-white rounded-lg shadow-sm">
        <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
        <input
          type="text"
          placeholder="Поиск по отделу или адресу ресурса..."
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 text-slate-800"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Таблица */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Подразделение (Отдел)</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Ссылка на аккаунт / Ресурс</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Количество подписчиков</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Примечания</th>
              {canWrite && <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Действия</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white">
            {filteredRows.length === 0 ? (
              <tr>
                <td colSpan={canWrite ? 5 : 4} className="px-6 py-8 text-center text-slate-400 text-sm">
                  Записи не найдены
                </td>
              </tr>
            ) : (
              filteredRows.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50/50 transition-colors text-sm">
                  <td className="px-6 py-4 whitespace-nowrap font-bold text-slate-900">{row.department}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-blue-600 font-medium">
                    <a
                      href={row.accountUrl.startsWith("http") ? row.accountUrl : `https://${row.accountUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 hover:underline"
                    >
                      <Globe className="h-3.5 w-3.5 text-slate-400" />
                      {row.accountUrl}
                    </a>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap font-bold text-slate-700">
                    {row.followers.toLocaleString("ru-RU")}
                  </td>
                  <td className="px-6 py-4 text-slate-500 max-w-xs truncate" title={row.notes || ""}>
                    {row.notes || "—"}
                  </td>
                  {canWrite && (
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <button
                        onClick={() => handleDelete(row.id, row.department)}
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

      {/* МОДАЛЬНОЕ ОКНО */}
      {isOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl border border-slate-200">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-200">
              <h3 className="text-lg font-bold text-slate-800">Добавить запись в Соц паспорт</h3>
              <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Подразделение (Отдел)</label>
                  <input
                    type="text"
                    name="department"
                    required
                    placeholder="Отдел информационных технологий"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Ссылка на аккаунт</label>
                  <input
                    type="text"
                    name="accountUrl"
                    required
                    placeholder="vk.com/my_department"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Количество подписчиков</label>
                  <input
                    type="number"
                    name="followers"
                    placeholder="0"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Примечания (Опционально)</label>
                  <textarea
                    name="notes"
                    rows={2}
                    placeholder="Ответственный модератор, статус верификации..."
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