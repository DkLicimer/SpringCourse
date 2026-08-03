// src/app/app/tables/social-passport/SocialPassportClient.tsx
"use client";

import React, { useState, useTransition } from "react";
import { createSocialPassportRow, deleteSocialPassportRow } from "@/server/actions/tables";
import { Plus, Trash2, ArrowLeft, Search, Globe, X, User, PhoneCall, Briefcase } from "lucide-react";
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
  canWrite: boolean;
}

export function SocialPassportClient({ initialRows, canWrite }: SocialPassportClientProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Поиск по ФИО, должности или подразделению
  const filteredRows = initialRows.filter(
    (r) =>
      r.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.accountUrl.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.notes && r.notes.toLowerCase().includes(searchTerm.toLowerCase()))
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

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Удалить сотрудника "${name}" из штатного состава?`)) return;
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
          <h2 className="text-2xl font-bold text-slate-800">Состав коллектива</h2>
          <p className="text-slate-500 text-sm">Кадровая структура, ФИО и контакты внутренних сотрудников ДДМа</p>
        </div>

        {canWrite && (
          <button
            onClick={() => setIsOpen(true)}
            className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors shadow-sm w-full sm:w-auto cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Добавить сотрудника
          </button>
        )}
      </div>

      {/* Поиск */}
      <div className="relative max-w-md bg-white rounded-lg shadow-sm">
        <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
        <input
          type="text"
          placeholder="Поиск по ФИО, должности или отделу..."
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 text-slate-800"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* ========================================================================= */}
      {/* 💻 ДЕСКТОПНАЯ ВЕРСИЯ ТАБЛИЦЫ */}
      {/* ========================================================================= */}
      <div className="hidden md:block bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">ФИО сотрудника</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Подразделение (Отдел)</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Кабинет / Внутр. номер</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Должность и примечания</th>
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
                  <td className="px-6 py-4 whitespace-nowrap font-bold text-slate-900">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-slate-400" />
                      {row.accountUrl} {/* Отображаем accountUrl как ФИО */}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-slate-700 font-medium">
                    {row.department}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap font-bold text-slate-700">
                    <div className="flex items-center gap-1.5">
                      <PhoneCall className="h-4 w-4 text-slate-400" />
                      {row.followers === 0 ? "—" : row.followers} {/* Отображаем followers как внутренний номер */}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-500 max-w-xs truncate" title={row.notes || ""}>
                    <div className="flex items-center gap-1.5">
                      <Briefcase className="h-4 w-4 text-slate-400 shrink-0" />
                      <span className="truncate">{row.notes || "—"}</span>
                    </div>
                  </td>
                  {canWrite && (
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <button
                        onClick={() => handleDelete(row.id, row.accountUrl)}
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

      {/* ========================================================================= */}
      {/* 📱 МОБИЛЬНАЯ ВЕРСИЯ КАРТОЧЕК */}
      {/* ========================================================================= */}
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
                  <div className="font-bold text-slate-900 text-base leading-snug">{row.accountUrl}</div>
                  <div className="text-xs text-slate-500 mt-1 flex items-center gap-1 font-semibold">
                    <Briefcase className="h-3.5 w-3.5 text-slate-400" />
                    {row.notes || "Должность не указана"}
                  </div>
                </div>
                {canWrite && (
                  <button
                    onClick={() => handleDelete(row.id, row.accountUrl)}
                    disabled={isPending}
                    className="text-red-500 hover:text-red-700 p-1.5 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-slate-50 p-2 rounded-lg border border-slate-100 flex flex-col gap-0.5">
                  <span className="text-slate-400 font-medium text-[9px] uppercase">Подразделение</span>
                  <span className="font-semibold text-slate-800 truncate">{row.department}</span>
                </div>
                <div className="bg-slate-50 p-2 rounded-lg border border-slate-100 flex flex-col gap-0.5">
                  <span className="text-slate-400 font-medium text-[9px] uppercase">Кабинет / Номер</span>
                  <span className="font-bold text-slate-800 flex items-center gap-1">
                    <PhoneCall className="h-3.5 w-3.5 text-slate-400" /> {row.followers === 0 ? "—" : row.followers}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* МОДАЛЬНОЕ ОКНО */}
      {isOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl border border-slate-200">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-200">
              <h3 className="text-lg font-bold text-slate-800">Добавить сотрудника в состав</h3>
              <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">ФИО сотрудника</label>
                  <input
                    type="text"
                    name="accountUrl" // пишется в accountUrl
                    required
                    placeholder="Например, Сидорова Наталья Владимировна"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Подразделение (Отдел / Направление)</label>
                  <input
                    type="text"
                    name="department" // пишется в department
                    required
                    placeholder="Например, Художественный отдел"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Кабинет / Внутренний телефон (Цифры)</label>
                  <input
                    type="number"
                    name="followers" // пишется в followers
                    placeholder="Например, 104"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Должность и примечания</label>
                  <textarea
                    name="notes" // пишется в notes
                    rows={2}
                    placeholder="Педагог доп. образования, руководитель студии..."
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