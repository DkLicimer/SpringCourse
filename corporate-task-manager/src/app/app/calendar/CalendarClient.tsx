// src/app/app/calendar/CalendarClient.tsx
"use client";

import React, { useState, useTransition } from "react";
import { createCalendarEvent, deleteCalendarEvent } from "@/server/actions/calendar";
import { 
  Calendar, 
  Lock, 
  Plus, 
  Trash2, 
  Clock, 
  Users, 
  X, 
  AlertCircle 
} from "lucide-react";

type CalendarEvent = {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  type: "MEETING" | "BLOCKED";
  description: string | null;
  bookedById: string;
  bookedBy: { name: string; initials: string; email: string };
};

interface CalendarClientProps {
  initialEvents: CalendarEvent[];
  isAdmin: boolean;
  currentUserId: string;
}

export function CalendarClient({ initialEvents, isAdmin, currentUserId }: CalendarClientProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Форма
  const [type, setType] = useState<"MEETING" | "BLOCKED">("MEETING");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const formData = new FormData(e.currentTarget);
    const date = formData.get("date") as string;
    const startHour = formData.get("startTime") as string;
    const endHour = formData.get("endTime") as string;

    const startTimeISO = `${date}T${startHour}:00`;
    const endTimeISO = `${date}T${endHour}:00`;

    const input = {
      title: formData.get("title") as string,
      startTime: startTimeISO,
      endTime: endTimeISO,
      type,
      description: formData.get("description") as string,
    };

    startTransition(async () => {
      try {
        await createCalendarEvent(input);
        setIsOpen(false);
      } catch (err: any) {
        setError(err.message || "Ошибка бронирования");
      }
    });
  };

  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm(`Отменить встречу/событие "${title}"?`)) return;

    startTransition(async () => {
      try {
        await deleteCalendarEvent(id);
      } catch (err: any) {
        alert(err.message || "Ошибка отмены");
      }
    });
  };

  // Фильтруем прошедшие встречи и группируем актуальные
  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="space-y-6">
      {/* Шапка */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Календарь руководителя</h2>
          <p className="text-slate-500 text-sm">Сетка встреч, совещаний и бронирования рабочего времени</p>
        </div>

        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors shadow-sm w-full sm:w-auto"
        >
          <Plus className="h-4 w-4" />
          {isAdmin ? "Заблокировать время / Создать встречу" : "Забронировать встречу"}
        </button>
      </div>

      {/* Список встреч в хронологическом порядке */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="p-5 border-b border-slate-200 bg-slate-50">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-500" />
            Ближайшее расписание
          </h3>
        </div>

        <div className="divide-y divide-slate-100">
          {initialEvents.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-sm">Календарь руководителя свободен</div>
          ) : (
            initialEvents.map((event) => {
              const isOwner = event.bookedById === currentUserId;
              const start = new Date(event.startTime);
              const end = new Date(event.endTime);
              const isBlocked = event.type === "BLOCKED";

              return (
                <div
                  key={event.id}
                  className={`p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:bg-slate-50/50 transition-colors ${
                    isBlocked ? "bg-amber-50/20" : ""
                  }`}
                >
                  <div className="flex gap-4 items-start">
                    {/* Визуальная плашка даты/типа */}
                    <div className={`h-12 w-12 rounded-xl flex flex-col items-center justify-center font-bold text-xs ${
                      isBlocked ? "bg-amber-100 text-amber-800" : "bg-blue-100 text-blue-800"
                    }`}>
                      <span>{start.getDate()}</span>
                      <span className="text-[10px] uppercase font-semibold">
                        {start.toLocaleString("ru-RU", { month: "short" })}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-bold text-slate-900 text-base">{event.title}</h4>
                        {isBlocked ? (
                          <span className="inline-flex items-center gap-0.5 text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-bold">
                            <Lock className="h-3 w-3" /> Занят / Отпуск
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-0.5 text-[10px] bg-blue-50 text-blue-800 px-2 py-0.5 rounded-full font-bold">
                            <Users className="h-3 w-3" /> Совещание
                          </span>
                        )}
                      </div>

                      {event.description && <p className="text-sm text-slate-500">{event.description}</p>}

                      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 font-semibold pt-1">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          {start.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}
                          {" — "}
                          {end.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}
                        </span>
                        {!isBlocked && (
                          <span className="flex items-center gap-1">
                            👤 Заявитель: {event.bookedBy.name}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Кнопка отмены для владельца брони или админа */}
                  {(isOwner || isAdmin) && (
                    <button
                      onClick={() => handleDelete(event.id, event.title)}
                      disabled={isPending}
                      className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded-xl transition-colors shrink-0"
                      title="Отменить встречу"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* МОДАЛЬНОЕ ОКНО: БРОНИРОВАНИЕ / БЛОКИРОВКА СЛОТА */}
      {isOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl border border-slate-200">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-200">
              <h3 className="text-lg font-bold text-slate-800">Запланировать встречу</h3>
              <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && (
                <div className="rounded-lg bg-red-50 p-4 text-xs text-red-600 border border-red-100 flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <div>{error}</div>
                </div>
              )}

              {/* Выбор роли / типа события руководителем */}
              {isAdmin && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Тип события</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setType("MEETING")}
                      className={`px-3 py-2 rounded-lg border text-xs font-bold text-center ${
                        type === "MEETING"
                          ? "border-blue-600 bg-blue-50 text-blue-700"
                          : "border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      Создать встречу
                    </button>
                    <button
                      type="button"
                      onClick={() => setType("BLOCKED")}
                      className={`px-3 py-2 rounded-lg border text-xs font-bold text-center ${
                        type === "BLOCKED"
                          ? "border-amber-600 bg-amber-50 text-amber-700"
                          : "border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      Заблокировать время
                    </button>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {type === "BLOCKED" ? "Причина блокировки времени" : "Тема встречи / Совещания"}
                </label>
                <input
                  type="text"
                  name="title"
                  required
                  placeholder={type === "BLOCKED" ? "Личный отпуск / Выездное совещание" : "Обсуждение проекта Контент-плана"}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Дата</label>
                <input
                  type="date"
                  name="date"
                  required
                  min={today}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Начало</label>
                  <input
                    type="time"
                    name="startTime"
                    required
                    step="900" // Интервалы по 15 минут
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Окончание</label>
                  <input
                    type="time"
                    name="endTime"
                    required
                    step="900"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Комментарий (Опционально)</label>
                <textarea
                  name="description"
                  rows={2}
                  placeholder="Добавьте повестку встречи, ссылки на документы..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 text-slate-800"
                />
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
                  {type === "BLOCKED" ? "Заблокировать" : "Забронировать"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}