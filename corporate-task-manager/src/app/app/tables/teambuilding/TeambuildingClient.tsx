// src/app/app/tables/teambuilding/TeambuildingClient.tsx
"use client";

import React, { useState, useTransition } from "react";
import { createTeambuildingRow, deleteTeambuildingRow } from "@/server/actions/tables";
import { Plus, Trash2, ArrowLeft, Search, Calendar, Landmark, Users, X } from "lucide-react";
import Link from "next/link";

type TeamRow = {
  id: string;
  eventName: string;
  date: string;
  budget: number;
  participantsCount: number;
  notes: string | null;
};

interface TeambuildingClientProps {
  initialRows: TeamRow[];
  canWrite: boolean;
}

export function TeambuildingClient({ initialRows, canWrite }: TeambuildingClientProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const filteredRows = initialRows.filter((r) =>
    r.eventName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      try {
        await createTeambuildingRow(formData);
        setIsOpen(false);
      } catch (err: any) {
        alert(err.message || "Ошибка добавления");
      }
    });
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Удалить мероприятие "${name}"?`)) return;
    startTransition(async () => {
      try {
        await deleteTeambuildingRow(id);
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
          <h2 className="text-2xl font-bold text-slate-800">Командообразование</h2>
          <p className="text-slate-500 text-sm">Реестр плановых корпоративных мероприятий и сметных расходов</p>
        </div>

        {canWrite && (
          <button
            onClick={() => setIsOpen(true)}
            className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors shadow-sm w-full sm:w-auto"
          >
            <Plus className="h-4 w-4" />
            Добавить мероприятие
          </button>
        )}
      </div>

      {/* Поиск */}
      <div className="relative max-w-md bg-white rounded-lg shadow-sm">
        <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
        <input
          type="text"
          placeholder="Поиск по названию мероприятия..."
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
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Дата проведения</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Мероприятие</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Кол-во участников</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Бюджет (руб.)</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Примечания</th>
              {canWrite && <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Действия</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white">
            {filteredRows.length === 0 ? (
              <tr>
                <td colSpan={canWrite ? 6 : 5} className="px-6 py-8 text-center text-slate-400 text-sm">
                  Записи не найдены
                </td>
              </tr>
            ) : (
              filteredRows.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50/50 transition-colors text-sm">
                  <td className="px-6 py-4 whitespace-nowrap font-medium text-slate-700">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-4 w-4 text-slate-400" />
                      {new Date(row.date).toLocaleDateString("ru-RU")}
                    </div>
                  </td>
                  <td className="px-6 py-4 font-bold text-slate-900">{row.eventName}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-slate-700 font-semibold">
                    <span className="inline-flex items-center gap-1">
                      <Users className="h-4 w-4 text-slate-400" /> {row.participantsCount} чел.
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap font-bold text-slate-800">
                    <span className="inline-flex items-center gap-1">
                      <Landmark className="h-4 w-4 text-slate-400" />
                      {row.budget.toLocaleString("ru-RU", { minimumFractionDigits: 2 })}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-500 max-w-xs truncate" title={row.notes || ""}>
                    {row.notes || "—"}
                  </td>
                  {canWrite && (
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <button
                        onClick={() => handleDelete(row.id, row.eventName)}
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
              <h3 className="text-lg font-bold text-slate-800">Запланировать мероприятие</h3>
              <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Название мероприятия</label>
                  <input
                    type="text"
                    name="eventName"
                    required
                    placeholder="Например, Осенний пейнтбол"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 text-slate-800"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Кол-во участников</label>
                    <input
                      type="number"
                      name="participantsCount"
                      placeholder="0"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Бюджет (руб.)</label>
                    <input
                      type="number"
                      step="0.01"
                      name="budget"
                      placeholder="0.00"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 text-slate-800"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Дата проведения</label>
                  <input
                    type="date"
                    name="date"
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Примечания (Опционально)</label>
                  <textarea
                    name="notes"
                    rows={2}
                    placeholder="Локация, ответственный за трансфер..."
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
                  Запланировать
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}