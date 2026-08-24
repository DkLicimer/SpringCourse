// src/app/app/tables/social-passport/SocialPassportClient.tsx
"use client";

import React, { useState, useTransition } from "react";
import { createSocialPassportRow, deleteSocialPassportRow } from "@/server/actions/tables";
import { Plus, Trash2, ArrowLeft, Search, X, User, PhoneCall, Briefcase } from "lucide-react";
import Link from "next/link";

// 1. ИСХОДНЫЙ ТИП ИЗ СХЕМЫ БАЗЫ ДАННЫХ (с неудобными названиями)
type SocialRow = {
  id: string;
  department: string;
  accountUrl: string; // В БД пишется ФИО
  followers: number;  // В БД пишется Номер кабинета
  notes: string | null; // В БД пишутся Должность и примечания
};

// 2. СЕМАНТИЧЕСКИЙ СТРУКТУРИРОВАННЫЙ ИНТЕРФЕЙС ДЛЯ БЕЗОПАСНОЙ РАЗРАБОТКИ (UI-to-DB Adapter)
interface MappedSocialRow {
  id: string;
  department: string;     // Отдел / Подразделение
  fullName: string;       // Соответствует "accountUrl" в БД
  cabinetOrPhone: number; // Соответствует "followers" в БД
  position: string | null;// Соответствует "notes" в БД
}

interface SocialPassportClientProps {
  initialRows: SocialRow[];
  canWrite: boolean;
}

export function SocialPassportClient({ initialRows, canWrite }: SocialPassportClientProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Преобразуем (мапируем) массив из базы в человекочитаемый UI-формат
  const mappedRows: MappedSocialRow[] = initialRows.map((row) => ({
    id: row.id,
    department: row.department,
    fullName: row.accountUrl,       // Мапинг accountUrl -> fullName
    cabinetOrPhone: row.followers,  // Мапинг followers -> cabinetOrPhone
    position: row.notes,            // Мапинг notes -> position
  }));

  // Фильтрация по адаптированным семантическим полям
  const filteredRows = mappedRows.filter(
    (r) =>
      r.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.position && r.position.toLowerCase().includes(searchTerm.toLowerCase()))
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

      {/* 💻 ДЕСКТОПНАЯ ВЕРСИЯ ТАБЛИЦЫ С ПРОКРУТКОЙ */}
        <div className="hidden md:block bg-white rounded-xl border border-slate-200 overflow-x-auto shadow-sm">  <table className="min-w-full divide-y divide-slate-200">
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
                      {row.fullName} {/* Мапированная переменная */}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-slate-700 font-medium">
                    {row.department}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap font-bold text-slate-700">
                    <div className="flex items-center gap-1.5">
                      <PhoneCall className="h-4 w-4 text-slate-400" />
                      {row.cabinetOrPhone === 0 ? "—" : row.cabinetOrPhone} {/* Мапированная переменная */}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-500 max-w-xs truncate" title={row.position || ""}>
                    <div className="flex items-center gap-1.5">
                      <Briefcase className="h-4 w-4 text-slate-400 shrink-0" />
                      <span className="truncate">{row.position || "—"}</span> {/* Мапированная переменная */}
                    </div>
                  </td>
                  {canWrite && (
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

      {/* 📱 МОБИЛЬНАЯ ВЕРСИЯ КАРТОЧЕК */}
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
                    <Briefcase className="h-3.5 w-3.5 text-slate-400" />
                    {row.position || "Должность не указана"}
                  </div>
                </div>
                {canWrite && (
                  <button
                    onClick={() => handleDelete(row.id, row.fullName)}
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
                    <PhoneCall className="h-3.5 w-3.5 text-slate-400" /> {row.cabinetOrPhone === 0 ? "—" : row.cabinetOrPhone}
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
            {/* Форма отправляет данные со старыми именами атрибутов name, чтобы API сервера (Server Action) сработало без изменений */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">ФИО сотрудника</label>
                  <input
                    type="text"
                    name="accountUrl" // пишется в БД как accountUrl
                    required
                    placeholder="Например, Сидорова Наталья Владимировна"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Подразделение (Отдел / Направление)</label>
                  <input
                    type="text"
                    name="department" // пишется в БД как department
                    required
                    placeholder="Например, Художественный отдел"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Кабинет / Внутренний телефон (Цифры)</label>
                  <input
                    type="number"
                    name="followers" // пишется в БД как followers
                    placeholder="Например, 104"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Должность и примечания</label>
                  <textarea
                    name="notes" // пишется в БД как notes
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