// src/app/app/tables/teambuilding/TeambuildingClient.tsx
"use client";

import React, { useState, useTransition } from "react";
import { 
  createTeambuildingRow, 
  updateTeambuildingRow, 
  deleteTeambuildingRow, 
  sendTeambuildingEmailBlast 
} from "@/server/actions/tables";
import { 
  Plus, 
  Trash2, 
  Pencil, 
  Mail, 
  ArrowLeft, 
  Search, 
  Calendar, 
  Landmark, 
  Users, 
  X, 
  CheckCircle2, 
  AlertCircle 
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

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
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [editingRow, setEditingRow] = useState<TeamRow | null>(null);
  const [isPending, startTransition] = useTransition();

  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const filteredRows = initialRows.filter((r) =>
    r.eventName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenCreate = () => {
    setEditingRow(null);
    setIsOpen(true);
  };

  const handleOpenEdit = (row: TeamRow) => {
    setEditingRow(row);
    setIsOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      try {
        if (editingRow) {
          await updateTeambuildingRow(editingRow.id, formData);
          showToast("Мероприятие успешно обновлено!", "success");
        } else {
          await createTeambuildingRow(formData);
          showToast("Мероприятие успешно добавлено!", "success");
        }
        setIsOpen(false);
        router.refresh();
      } catch (err: any) {
        showToast(err.message || "Ошибка сохранения", "error");
      }
    });
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Удалить мероприятие "${name}"?`)) return;
    startTransition(async () => {
      try {
        await deleteTeambuildingRow(id);
        showToast("Мероприятие удалено", "success");
        router.refresh();
      } catch (err: any) {
        showToast(err.message || "Ошибка удаления", "error");
      }
    });
  };

  const handleEmailBlast = async (id: string, name: string) => {
    if (!window.confirm(`Отправить приглашение и оповещение на почту ВСЕМ сотрудникам по мероприятию «${name}»?`)) {
      return;
    }

    startTransition(async () => {
      try {
        await sendTeambuildingEmailBlast(id);
        showToast(`Оповещение по «${name}» успешно разослано всем сотрудникам!`, "success");
      } catch (err: any) {
        showToast(err.message || "Ошибка отправки рассылки", "error");
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Toast уведомления */}
      {toast && (
        <div className={`fixed bottom-6 left-6 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl shadow-2xl border text-xs font-semibold animate-slide-up ${
          toast.type === "success" 
            ? "bg-emerald-50 border-emerald-200 text-emerald-800" 
            : "bg-rose-50 border-rose-200 text-rose-800"
        }`}>
          {toast.type === "success" ? (
            <CheckCircle2 className="h-4.5 w-4.5 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="h-4.5 w-4.5 text-rose-600 shrink-0" />
          )}
          <span>{toast.message}</span>
          <button onClick={() => setToast(null)} className="ml-2 text-slate-400 hover:text-slate-600 cursor-pointer">
            <X className="h-3 w-3" />
          </button>
        </div>
      )}

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
          <p className="text-slate-500 text-sm">Реестр плановых корпоративных мероприятий, сметных расходов и оповещений</p>
        </div>

        {canWrite && (
          <button
            onClick={handleOpenCreate}
            className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-sm font-bold transition-all shadow-xs w-full sm:w-auto cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Добавить мероприятие
          </button>
        )}
      </div>

      {/* Поиск */}
      <div className="relative max-w-md bg-white rounded-xl shadow-xs">
        <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
        <input
          type="text"
          placeholder="Поиск по названию мероприятия..."
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-blue-500 text-slate-800"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* ДЕСКТОПНАЯ ТАБЛИЦА */}
      <div className="hidden md:block bg-white rounded-2xl border border-slate-200 overflow-x-auto shadow-xs">
        <table className="min-w-full divide-y divide-slate-200 text-xs">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3.5 text-left font-bold text-slate-500 uppercase tracking-wider">Дата проведения</th>
              <th className="px-6 py-3.5 text-left font-bold text-slate-500 uppercase tracking-wider">Мероприятие</th>
              <th className="px-6 py-3.5 text-left font-bold text-slate-500 uppercase tracking-wider">Кол-во участников</th>
              <th className="px-6 py-3.5 text-left font-bold text-slate-500 uppercase tracking-wider">Бюджет (руб.)</th>
              <th className="px-6 py-3.5 text-left font-bold text-slate-500 uppercase tracking-wider">Примечания</th>
              {canWrite && <th className="px-6 py-3.5 text-right font-bold text-slate-500 uppercase tracking-wider">Действия</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {filteredRows.length === 0 ? (
              <tr>
                <td colSpan={canWrite ? 6 : 5} className="px-6 py-10 text-center text-slate-400 text-xs italic">
                  Записи не найдены
                </td>
              </tr>
            ) : (
              filteredRows.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap font-semibold text-slate-700">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-4 w-4 text-slate-400" />
                      {new Date(row.date).toLocaleDateString("ru-RU")}
                    </div>
                  </td>
                  <td className="px-6 py-4 font-bold text-slate-900 text-sm">{row.eventName}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-slate-700 font-semibold">
                    <span className="inline-flex items-center gap-1">
                      <Users className="h-4 w-4 text-slate-400" /> {row.participantsCount} чел.
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap font-bold text-slate-800">
                    <span className="inline-flex items-center gap-1">
                      <Landmark className="h-4 w-4 text-slate-400" />
                      {row.budget.toLocaleString("ru-RU", { minimumFractionDigits: 2 })} ₽
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-500 max-w-xs truncate" title={row.notes || ""}>
                    {row.notes || "—"}
                  </td>
                  {canWrite && (
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-1">
                        {/* ⚡ КНОПКА РАССЫЛКИ НА EMAIL */}
                        <button
                          onClick={() => handleEmailBlast(row.id, row.eventName)}
                          disabled={isPending}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                          title="Оповестить всех сотрудников по Email и в портале"
                        >
                          <Mail className="h-4 w-4 text-blue-500" />
                        </button>
                        {/* ⚡ КНОПКА РЕДАКТИРОВАНИЯ */}
                        <button
                          onClick={() => handleOpenEdit(row)}
                          disabled={isPending}
                          className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                          title="Редактировать"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        {/* КНОПКА УДАЛЕНИЯ */}
                        <button
                          onClick={() => handleDelete(row.id, row.eventName)}
                          disabled={isPending}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Удалить"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* МОБИЛЬНАЯ ВЕРСИЯ */}
      <div className="block md:hidden space-y-3">
        {filteredRows.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs bg-white rounded-2xl border">
            Записи не найдены
          </div>
        ) : (
          filteredRows.map((row) => (
            <div key={row.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex justify-between items-start border-b border-slate-100 pb-2.5">
                <div>
                  <div className="font-bold text-slate-900 text-sm leading-snug">{row.eventName}</div>
                  <div className="text-xs text-slate-400 mt-1 flex items-center gap-1 font-semibold">
                    <Calendar className="h-3.5 w-3.5" />
                    {new Date(row.date).toLocaleDateString("ru-RU")}
                  </div>
                </div>
                {canWrite && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleEmailBlast(row.id, row.eventName)}
                      disabled={isPending}
                      className="text-blue-500 hover:text-blue-700 p-1.5 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                      title="Оповестить всех"
                    >
                      <Mail className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleOpenEdit(row)}
                      disabled={isPending}
                      className="text-slate-500 hover:text-slate-800 p-1.5 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(row.id, row.eventName)}
                      disabled={isPending}
                      className="text-red-500 hover:text-red-700 p-1.5 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-slate-50 p-2 rounded-xl border border-slate-100 flex flex-col gap-0.5">
                  <span className="text-slate-400 font-bold text-[9px] uppercase">Участники</span>
                  <span className="font-bold text-slate-800 flex items-center gap-1">
                    <Users className="h-3.5 w-3.5 text-slate-400" /> {row.participantsCount} чел.
                  </span>
                </div>
                <div className="bg-slate-50 p-2 rounded-xl border border-slate-100 flex flex-col gap-0.5">
                  <span className="text-slate-400 font-bold text-[9px] uppercase">Бюджет</span>
                  <span className="font-bold text-slate-800 flex items-center gap-1">
                    <Landmark className="h-3.5 w-3.5 text-slate-400" /> {row.budget.toLocaleString("ru-RU")} ₽
                  </span>
                </div>
              </div>

              {row.notes && (
                <div className="text-xs text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-100 italic leading-relaxed">
                  {row.notes}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* МОДАЛЬНОЕ ОКНО СОЗДАНИЯ / РЕДАКТИРОВАНИЯ */}
      {isOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-slate-200 overflow-hidden">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-200 bg-slate-50">
              <h3 className="text-lg font-bold text-slate-800">
                {editingRow ? `Редактировать: ${editingRow.eventName}` : "Запланировать мероприятие"}
              </h3>
              <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form key={editingRow?.id || "new-team"} onSubmit={handleSubmit} className="p-6 space-y-4" autoComplete="off">
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Название мероприятия *</label>
                  <input
                    type="text"
                    name="eventName"
                    required
                    defaultValue={editingRow?.eventName || ""}
                    placeholder="Например, Осенний выезд на пейнтбол"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:border-blue-500 text-slate-800"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Кол-во участников</label>
                    <input
                      type="number"
                      name="participantsCount"
                      defaultValue={editingRow?.participantsCount || 0}
                      placeholder="0"
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:border-blue-500 text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Бюджет (руб.)</label>
                    <input
                      type="number"
                      step="0.01"
                      name="budget"
                      defaultValue={editingRow?.budget || 0}
                      placeholder="0.00"
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:border-blue-500 text-slate-800"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Дата проведения *</label>
                  <input
                    type="date"
                    name="date"
                    required
                    defaultValue={editingRow?.date ? editingRow.date.split("T")[0] : ""}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:border-blue-500 text-slate-800 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Примечания / Локация</label>
                  <textarea
                    name="notes"
                    rows={2}
                    defaultValue={editingRow?.notes || ""}
                    placeholder="Локация, ответственный за трансфер, сбор в 10:00..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:outline-none focus:border-blue-500 text-slate-800"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="flex-1 px-4 py-2.5 border border-slate-300 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs disabled:bg-blue-400 cursor-pointer"
                >
                  {isPending ? "Сохранение..." : editingRow ? "Сохранить изменения" : "Запланировать"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}