// src/app/app/tables/info-space/InfoSpaceClient.tsx
"use client";

import React, { useState, useTransition } from "react";
import { createInfoSpaceRow, deleteInfoSpaceRow } from "@/server/actions/tables";
import { Plus, Trash2, ArrowLeft, Search, Mail, User, X } from "lucide-react";
import Link from "next/link";

type InfoRow = {
  id: string;
  fullName: string;
  email: string;
  notes: string | null;
};

interface InfoSpaceClientProps {
  initialRows: InfoRow[];
  isAdmin: boolean;
}

export function InfoSpaceClient({ initialRows, isAdmin }: InfoSpaceClientProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const filteredRows = initialRows.filter(
    (r) =>
      r.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.notes && r.notes.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      try {
        await createInfoSpaceRow(formData);
        setIsOpen(false);
      } catch (err: any) {
        setError(err.message || "Ошибка добавления записи");
      }
    });
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Вы уверены, что хотите удалить запись "${name}" из ИНФОпространства?`)) {
      return;
    }

    startTransition(async () => {
      try {
        await deleteInfoSpaceRow(id);
      } catch (err: any) {
        alert(err.message || "Ошибка при удалении");
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
          <h2 className="text-2xl font-bold text-slate-800">ИНФОпространство</h2>
          <p className="text-slate-500 text-sm">Общий реестр информационных ресурсов, почтовых адресов и учетных записей</p>
        </div>

        {isAdmin && (
          <button
            onClick={() => setIsOpen(true)}
            className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors shadow-sm w-full sm:w-auto cursor-pointer"
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
          placeholder="Поиск по ФИО, почте, примечанию..."
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 text-slate-800 placeholder-slate-400"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* 💻 ДЕСКТОПНАЯ ВЕРСИЯ ТАБЛИЦЫ С УЛУЧШЕННОЙ ПРОКРУТКОЙ */}
      <div className="hidden md:block bg-white rounded-xl border border-slate-200 overflow-x-auto shadow-sm">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">ФИО сотрудника</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Электронный адрес</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Примечание</th>
              {isAdmin && <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Действия</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white">
            {filteredRows.length === 0 ? (
              <tr>
                <td colSpan={isAdmin ? 4 : 3} className="px-6 py-8 text-center text-slate-400 text-sm">
                  Записи не найдены
                </td>
              </tr>
            ) : (
              filteredRows.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50/50 transition-colors text-sm">
                  <td className="px-6 py-4 whitespace-nowrap font-bold text-slate-900">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-slate-400" />
                      {row.fullName}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap font-semibold text-slate-700">
                    <div className="flex items-center gap-1.5">
                      <Mail className="h-4 w-4 text-slate-400" />
                      <a href={`mailto:${row.email}`} className="hover:underline">{row.email}</a>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-500 max-w-xs truncate" title={row.notes || ""}>
                    {row.notes || "—"}
                  </td>
                  {isAdmin && (
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <button
                        onClick={() => handleDelete(row.id, row.fullName)}
                        disabled={isPending}
                        className="text-red-500 hover:text-red-700 p-1.5 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
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

      {/* 📱 МОБИЛЬНАЯ ВЕРСИЯ */}
      <div className="block md:hidden space-y-4">
        {filteredRows.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-sm bg-white rounded-xl border">
            Записи не найдены
          </div>
        ) : (
          filteredRows.map((row) => (
            <div key={row.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
              <div className="flex justify-between items-start border-b border-slate-100 pb-2.5">
                <div>
                  <div className="font-bold text-slate-900 text-base leading-snug">{row.fullName}</div>
                  <div className="text-xs text-slate-500 mt-1 flex items-center gap-1 font-semibold">
                    <Mail className="h-3.5 w-3.5 text-slate-400" />
                    <a href={`mailto:${row.email}`} className="hover:underline">{row.email}</a>
                  </div>
                </div>
                {isAdmin && (
                  <button
                    onClick={() => handleDelete(row.id, row.fullName)}
                    disabled={isPending}
                    className="text-red-500 hover:text-red-700 p-1.5 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>

              {row.notes && (
                <div className="text-xs text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-100 italic leading-relaxed">
                  {row.notes}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* МОДАЛЬНОЕ ОКНО СОЗДАНИЯ */}
      {isOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl border border-slate-200">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-200">
              <h3 className="text-lg font-bold text-slate-800">Добавить запись в ИНФОпространство</h3>
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
                  <label className="block text-xs font-semibold text-slate-700 mb-1">ФИО сотрудника</label>
                  <input
                    type="text"
                    name="fullName"
                    required
                    placeholder="Например, Смирнова Александра Денисовна"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Электронный адрес (Email)</label>
                  <input
                    type="email"
                    name="email"
                    required
                    placeholder="smirnova@company.com"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Примечание (Опционально)</label>
                  <textarea
                    name="notes"
                    rows={3}
                    placeholder="Логин Skype, корпоративный Telegram, внутренний ID..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 text-slate-800"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-sm cursor-pointer"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold disabled:bg-blue-400 cursor-pointer"
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