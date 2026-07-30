// src/app/app/calendar/CalendarClient.tsx
"use client";

import React, { useState, useTransition } from "react";
import { createCalendarEvent, deleteCalendarEvent } from "@/server/actions/calendar";
import { 
  Lock, 
  Plus, 
  Trash2, 
  Clock, 
  Users, 
  X, 
  AlertCircle,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { useRouter } from "next/navigation";

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
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [type, setType] = useState<"MEETING" | "BLOCKED">("MEETING");

  // ВЫЧИСЛЕНИЕ ТЕКУЩЕЙ НЕДЕЛИ (Пункт 11)
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() => {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // подстраиваем понедельник
    const monday = new Date(d.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    return monday;
  });

  // Получаем массив из 7 дней выбранной недели
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(currentWeekStart);
    d.setDate(currentWeekStart.getDate() + i);
    return d;
  });

  const startDay = weekDays[0];
  const endDay = weekDays[6];
  const monthName = endDay.toLocaleString("ru-RU", { month: "long" });
  const weekLabel = `${startDay.getDate()} – ${endDay.getDate()} ${monthName.charAt(0).toUpperCase() + monthName.slice(1)}`;

  const handlePrevWeek = () => {
    setCurrentWeekStart((prev) => {
      const d = new Date(prev);
      d.setDate(prev.getDate() - 7);
      return d;
    });
  };

  const handleNextWeek = () => {
    setCurrentWeekStart((prev) => {
      const d = new Date(prev);
      d.setDate(prev.getDate() + 7);
      return d;
    });
  };

  // Временная шкала: с 08:00 до 21:00
  const hours = Array.from({ length: 14 }, (_, i) => 8 + i);
  const cellHeight = 64; // Высота ячейки 1 часа в пикселях (h-16)

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
        router.refresh();
      } catch (err: any) {
        setError(err.message || "Ошибка бронирования");
      }
    });
  };

  const handleDelete = async (id: string, title: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Предотвращаем конфликты кликов на сетке
    if (!window.confirm(`Отменить встречу "${title}"?`)) return;

    startTransition(async () => {
      try {
        await deleteCalendarEvent(id);
        router.refresh();
      } catch (err: any) {
        alert(err.message || "Ошибка отмены");
      }
    });
  };

  const todayStr = new Date().toISOString().split("T")[0];

  return (
    <div className="space-y-6">
      {/* Шапка календаря */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Календарь руководителя</h2>
          <p className="text-slate-500 text-sm">Сетка встреч, совещаний и бронирования рабочего времени</p>
        </div>

        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors shadow-sm w-full md:w-auto cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          {isAdmin ? "Блокировка / Встреча" : "Забронировать встречу"}
        </button>
      </div>

      {/* Панель переключения недель (по скриншоту) */}
      <div className="flex items-center justify-between bg-slate-900 text-white px-6 py-4 rounded-2xl shadow-md">
        <h3 className="text-xl font-bold tracking-tight">Дата и время</h3>
        
        <div className="flex items-center gap-4">
          <button 
            onClick={handlePrevWeek}
            className="p-1.5 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <span className="font-bold text-sm tracking-wide">{weekLabel}</span>
          <button 
            onClick={handleNextWeek}
            className="p-1.5 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* ВИЗУАЛЬНАЯ СЕТКА-РАСПИСАНИЕ (Пункт 11) */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <div className="min-w-[850px] relative flex flex-col">
            
            {/* Строка заголовков дней недели */}
            <div className="grid grid-cols-[80px_repeat(7,1fr)] border-b border-slate-200 bg-slate-50/50">
              <div className="h-12 border-r border-slate-200" /> {/* Угол */}
              {weekDays.map((day, idx) => {
                const isToday = day.toISOString().split("T")[0] === todayStr;
                return (
                  <div 
                    key={idx} 
                    className={`h-12 flex flex-col items-center justify-center border-r border-slate-200 last:border-0 ${
                      isToday ? "bg-blue-50/50" : ""
                    }`}
                  >
                    <span className="text-[10px] uppercase font-bold text-slate-400">
                      {day.toLocaleString("ru-RU", { weekday: "short" })}
                    </span>
                    <span className={`text-sm font-bold mt-0.5 ${isToday ? "text-blue-600" : "text-slate-800"}`}>
                      {day.getDate()}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Тело сетки (часы и слоты) */}
            <div className="relative grid grid-cols-[80px_repeat(7,1fr)]">
              {/* Левая шкала часов */}
              <div className="flex flex-col bg-slate-50/30 border-r border-slate-200 shrink-0">
                {hours.map((hour) => (
                  <div 
                    key={hour} 
                    className="h-16 border-b border-slate-100 pr-3 flex justify-end items-start pt-1.5 text-[11px] font-bold text-slate-400"
                  >
                    {`${hour}:00`}
                  </div>
                ))}
              </div>

              {/* Фоновые ячейки сетки */}
              {Array.from({ length: 7 }).map((_, colIdx) => (
                <div key={colIdx} className="flex flex-col border-r border-slate-100 last:border-0 relative">
                  {hours.map((hour) => (
                    <div key={hour} className="h-16 border-b border-slate-100" />
                  ))}

                  {/* Рендерим события абсолютно поверх колонок */}
                  {initialEvents
                    .filter((event) => {
                      const eventDate = new Date(event.startTime);
                      const columnDate = weekDays[colIdx];
                      return eventDate.toDateString() === columnDate.toDateString();
                    })
                    .map((event) => {
                      const start = new Date(event.startTime);
                      const end = new Date(event.endTime);
                      
                      const startMins = start.getHours() * 60 + start.getMinutes();
                      const gridStartMins = 8 * 60; // Шкала начинается с 08:00
                      
                      // Расчет абсолютных координат
                      const topOffset = ((startMins - gridStartMins) / 60) * cellHeight;
                      const durationMins = (end.getTime() - start.getTime()) / (1000 * 60);
                      const heightVal = (durationMins / 60) * cellHeight;

                      const isBlocked = event.type === "BLOCKED";
                      const isOwner = event.bookedById === currentUserId;

                      return (
                        <div
                          key={event.id}
                          className={`absolute left-1 right-1 rounded-xl p-2.5 shadow-sm flex flex-col justify-between overflow-hidden border transition-all hover:shadow-md ${
                            isBlocked 
                              ? "bg-amber-500/10 border-amber-500 text-amber-900" 
                              : "bg-blue-600/10 border-blue-600 text-blue-900"
                          }`}
                          style={{ 
                            top: `${topOffset}px`, 
                            height: `${heightVal}px`,
                            minHeight: "45px" 
                          }}
                        >
                          <div className="space-y-0.5">
                            <div className="flex justify-between items-start gap-1">
                              <h4 className="font-bold text-[11px] leading-tight line-clamp-2">
                                {event.title}
                              </h4>
                              {(isOwner || isAdmin) && (
                                <button
                                  onClick={(e) => handleDelete(event.id, event.title, e)}
                                  className="text-red-600 hover:text-red-800 p-0.5 hover:bg-white/50 rounded transition-colors cursor-pointer shrink-0"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              )}
                            </div>
                            {event.description && (
                              <p className="text-[10px] text-slate-500 line-clamp-1 leading-relaxed">
                                {event.description}
                              </p>
                            )}
                          </div>
                          
                          <div className="flex justify-between items-center text-[9px] font-bold text-slate-400 mt-1">
                            <span className="flex items-center gap-0.5">
                              <Clock className="h-2.5 w-2.5" />
                              {start.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}
                              {"-"}
                              {end.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}
                            </span>
                            {!isBlocked && (
                              <span className="truncate max-w-[80px]">👤 {event.bookedBy.name.split(" ")[0]}</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>
              ))}
            </div>

          </div>
        </div>
      </div>

      {/* МОДАЛЬНОЕ ОКНО */}
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

              {isAdmin && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Тип события</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setType("MEETING")}
                      className={`px-3 py-2 rounded-lg border text-xs font-bold text-center cursor-pointer ${
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
                      className={`px-3 py-2 rounded-lg border text-xs font-bold text-center cursor-pointer ${
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
                  min={todayStr}
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
                    step="900"
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
                  className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-sm cursor-pointer"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold disabled:bg-blue-400 cursor-pointer"
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