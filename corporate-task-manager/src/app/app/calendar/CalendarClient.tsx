// src/app/app/calendar/CalendarClient.tsx
"use client";

import React, { useState, useTransition } from "react";
import { createCalendarEvent, updateCalendarEvent, deleteCalendarEvent } from "@/server/actions/calendar";
import { 
  Plus, 
  Trash2, 
  Pencil, 
  Clock, 
  X, 
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Users,
  Calendar as CalendarIcon
} from "lucide-react";
import { useRouter } from "next/navigation";

type CalendarEvent = {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  type: "FREE" | "GC" | "BUSY";
  description: string | null;
  bookedById: string;
  bookedBy: { name: string; initials: string; email: string };
  participants?: { id: string; name: string; initials: string }[];
};

interface CalendarClientProps {
  initialEvents: CalendarEvent[];
  isAdmin: boolean;
  currentUserId: string;
  users?: { id: string; name: string; initials: string }[];
}

export function CalendarClient({ initialEvents, isAdmin, currentUserId, users = [] }: CalendarClientProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);

  const [type, setType] = useState<"FREE" | "GC" | "BUSY">("FREE");
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);
  const [dateVal, setDateVal] = useState("");
  const [startTimeVal, setStartTimeVal] = useState("10:00");
  const [endTimeVal, setEndTimeVal] = useState("11:00");
  const [titleVal, setTitleVal] = useState("");
  const [descVal, setDescVal] = useState("");

  const getMonday = (d: Date) => {
    const date = new Date(d);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(date.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    return monday;
  };

  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() => getMonday(new Date()));

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(currentWeekStart);
    d.setDate(currentWeekStart.getDate() + i);
    return d;
  });

  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(() => {
    const today = new Date().getDay();
    return today === 0 ? 6 : today - 1;
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

  // ⚡ КНОПКА «СЕГОДНЯ» ДЛЯ БЫСТРОГО ВОЗВРАТА
  const handleToday = () => {
    const today = new Date();
    setCurrentWeekStart(getMonday(today));
    const day = today.getDay();
    setSelectedDayIndex(day === 0 ? 6 : day - 1);
  };

  const hours = Array.from({ length: 13 }, (_, i) => 8 + i);
  const cellHeight = 64; 

  const openCreateModal = () => {
    setError(null);
    setEditingEvent(null);
    setType("FREE");
    setSelectedParticipants([]);
    setDateVal(new Date().toISOString().split("T")[0]);
    setStartTimeVal("10:00");
    setEndTimeVal("11:00");
    setTitleVal("");
    setDescVal("");
    setIsOpen(true);
  };

  const openEditModal = (event: CalendarEvent) => {
    setError(null);
    setEditingEvent(event);
    setType(event.type);
    setSelectedParticipants(event.participants ? event.participants.map(p => p.id) : []);

    const start = new Date(event.startTime);
    const end = new Date(event.endTime);

    setDateVal(start.toISOString().split("T")[0]);
    setStartTimeVal(start.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" }));
    setEndTimeVal(end.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" }));
    setTitleVal(event.title);
    setDescVal(event.description || "");
    setIsOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const startTimeISO = `${dateVal}T${startTimeVal}:00`;
    const endTimeISO = `${dateVal}T${endTimeVal}:00`;

    startTransition(async () => {
      try {
        if (editingEvent) {
          await updateCalendarEvent({
            id: editingEvent.id,
            title: titleVal,
            startTime: startTimeISO,
            endTime: endTimeISO,
            type,
            description: descVal,
            participantIds: selectedParticipants,
          });
        } else {
          await createCalendarEvent({
            title: titleVal,
            startTime: startTimeISO,
            endTime: endTimeISO,
            type,
            description: descVal,
            participantIds: selectedParticipants,
          });
        }
        setIsOpen(false);
        router.refresh();
      } catch (err: any) {
        setError(err.message || "Ошибка сохранения события");
      }
    });
  };

  const handleDelete = async (id: string, title: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm(`Отменить встречу "${title}"?`)) return;

    startTransition(async () => {
      try {
        await deleteCalendarEvent(id);
        if (editingEvent?.id === id) setIsOpen(false);
        router.refresh();
      } catch (err: any) {
        alert(err.message || "Ошибка отмены");
      }
    });
  };

  const toggleParticipant = (userId: string) => {
    setSelectedParticipants((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const todayStr = new Date().toISOString().split("T")[0];

  return (
    <div className="space-y-6">
      {/* Шапка */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Календарь руководителя</h2>
          <p className="text-slate-500 text-sm">Сетка встреч, совещаний и бронирования рабочего времени</p>
        </div>

        <button
          onClick={openCreateModal}
          className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors shadow-sm w-full md:w-auto cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          {isAdmin ? "Добавить событие / Блок" : "Забронировать встречу"}
        </button>
      </div>

      {/* Панель недели с кнопкой «Сегодня» */}
      <div className="flex flex-wrap items-center justify-between bg-slate-900 text-white px-4 sm:px-6 py-3.5 rounded-2xl shadow-md gap-3">
        <div className="flex items-center gap-3">
          <CalendarIcon className="h-4.5 w-4.5 text-blue-400 shrink-0" />
          <h3 className="text-xs sm:text-sm font-bold tracking-wide">Расписание недели</h3>
          <button
            onClick={handleToday}
            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-blue-400 hover:text-blue-300 rounded-lg text-xs font-bold transition-all border border-slate-700 cursor-pointer"
          >
            Сегодня
          </button>
        </div>
        
        <div className="flex items-center gap-2 sm:gap-3">
          <button 
            onClick={handlePrevWeek}
            className="p-1.5 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            title="Предыдущая неделя"
          >
            <ChevronLeft className="h-4.5 w-4.5" />
          </button>
          <span className="font-bold text-xs sm:text-sm tracking-wide min-w-[130px] text-center">{weekLabel}</span>
          <button 
            onClick={handleNextWeek}
            className="p-1.5 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            title="Следующая неделя"
          >
            <ChevronRight className="h-4.5 w-4.5" />
          </button>
        </div>
      </div>

      {/* Мобильные дни */}
      <div className="grid grid-cols-7 gap-1 bg-slate-200/60 p-1 rounded-xl border border-slate-200 md:hidden shadow-inner">
        {weekDays.map((day, idx) => {
          const isSelected = selectedDayIndex === idx;
          const isToday = day.toISOString().split("T")[0] === todayStr;
          return (
            <button
              key={idx}
              type="button"
              onClick={() => setSelectedDayIndex(idx)}
              className={`flex flex-col items-center py-2 rounded-lg transition-all cursor-pointer ${
                isSelected
                  ? "bg-blue-600 text-white shadow-sm font-bold scale-[1.03]"
                  : isToday
                  ? "bg-blue-50 text-blue-700 font-bold border border-blue-200"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <span className="text-[9px] uppercase leading-none font-bold tracking-wider">
                {day.toLocaleString("ru-RU", { weekday: "short" })}
              </span>
              <span className="text-sm font-bold mt-1">{day.getDate()}</span>
            </button>
          );
        })}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Мобильная сетка */}
        <div className="md:hidden relative grid grid-cols-[65px_1fr]">
          <div className="flex flex-col bg-slate-50/50 border-r border-slate-200 shrink-0">
            {hours.map((hour) => (
              <div 
                key={hour} 
                className="h-16 border-b border-slate-100 pr-2 flex justify-end items-start pt-1.5 text-[10px] font-bold text-slate-400"
              >
                {`${hour}:00`}
              </div>
            ))}
          </div>

          <div className="flex flex-col relative">
            {hours.map((hour) => (
              <div key={hour} className="h-16 border-b border-slate-100" />
            ))}

            {initialEvents
              .filter((event) => {
                const eventDate = new Date(event.startTime);
                const columnDate = weekDays[selectedDayIndex];
                return eventDate.toDateString() === columnDate.toDateString();
              })
              .map((event) => {
                const start = new Date(event.startTime);
                const end = new Date(event.endTime);
                
                const startMins = start.getHours() * 60 + start.getMinutes();
                const gridStartMins = 8 * 60;
                
                const topOffset = ((startMins - gridStartMins) / 60) * cellHeight;
                const durationMins = Math.max((end.getTime() - start.getTime()) / (1000 * 60), 30);
                const heightVal = Math.max((durationMins / 60) * cellHeight, 48);

                const isBusy = event.type === "BUSY";
                const isGc = event.type === "GC";
                const isOwner = event.bookedById === currentUserId;

                const displayTitle = (isBusy && !isAdmin) ? "Занято" : event.title;
                const displayDescription = (isBusy && !isAdmin) ? null : event.description;
                const showBookedBy = !isBusy || isAdmin;

                let bgBorderClass = "bg-emerald-50 border-emerald-400 text-emerald-950 hover:bg-emerald-100/70";
                if (isBusy) {
                  bgBorderClass = "bg-red-50 border-red-400 text-red-900 hover:bg-red-100/70";
                } else if (isGc) {
                  bgBorderClass = "bg-amber-50 border-amber-400 text-amber-950 hover:bg-amber-100/70";
                }

                return (
                  <div
                    key={event.id}
                    onClick={() => {
                      if (isOwner || isAdmin) openEditModal(event);
                    }}
                    title={`${displayTitle}${displayDescription ? `\n${displayDescription}` : ""}\nВремя: ${start.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}-${end.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}`}
                    className={`absolute left-1.5 right-1.5 rounded-xl p-2 shadow-sm flex flex-col justify-between overflow-hidden border cursor-pointer transition-all ${bgBorderClass}`}
                    style={{ 
                      top: `${topOffset}px`, 
                      height: `${heightVal}px`,
                      minHeight: "48px" 
                    }}
                  >
                    <div className="space-y-0.5 min-w-0">
                      <div className="flex justify-between items-start gap-1">
                        <h4 className="font-bold text-[11px] leading-tight line-clamp-1 truncate">
                          {displayTitle}
                        </h4>
                        {(isOwner || isAdmin) && (
                          <span className="text-slate-400 hover:text-slate-700 shrink-0">
                            <Pencil className="h-2.5 w-2.5" />
                          </span>
                        )}
                      </div>
                      {displayDescription && (
                        <p className="text-[9px] text-slate-500 line-clamp-1 leading-none truncate">
                          {displayDescription}
                        </p>
                      )}
                    </div>
                    
                    <div className="flex justify-between items-center text-[9px] font-bold text-slate-500 mt-0.5 pt-0.5 border-t border-black/5">
                      <span className="flex items-center gap-0.5 whitespace-nowrap">
                        <Clock className="h-2.5 w-2.5 shrink-0" />
                        {start.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}
                        {"-"}
                        {end.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                      {showBookedBy && (
                        <span className="truncate max-w-[70px] text-[8px] text-slate-400">👤 {event.bookedBy.name.split(" ")[0]}</span>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        {/* Десктопная сетка */}
        <div className="hidden md:block overflow-x-auto">
          <div className="min-w-[850px] relative flex flex-col">
            <div className="grid grid-cols-[80px_repeat(7,1fr)] border-b border-slate-200 bg-slate-50/50">
              <div className="h-12 border-r border-slate-200" />
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

            <div className="relative grid grid-cols-[80px_repeat(7,1fr)]">
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

              {Array.from({ length: 7 }).map((_, colIdx) => (
                <div key={colIdx} className="flex flex-col border-r border-slate-100 last:border-0 relative">
                  {hours.map((hour) => (
                    <div key={hour} className="h-16 border-b border-slate-100" />
                  ))}

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
                      const gridStartMins = 8 * 60;
                      
                      const topOffset = ((startMins - gridStartMins) / 60) * cellHeight;
                      const durationMins = Math.max((end.getTime() - start.getTime()) / (1000 * 60), 30);
                      const heightVal = Math.max((durationMins / 60) * cellHeight, 48);

                      const isBusy = event.type === "BUSY";
                      const isGc = event.type === "GC";
                      const isOwner = event.bookedById === currentUserId;

                      const displayTitle = (isBusy && !isAdmin) ? "Занято" : event.title;
                      const displayDescription = (isBusy && !isAdmin) ? null : event.description;
                      const showBookedBy = !isBusy || isAdmin;

                      let bgBorderClass = "bg-emerald-50 border-emerald-400 text-emerald-950 hover:bg-emerald-100/70";
                      if (isBusy) {
                        bgBorderClass = "bg-red-50 border-red-400 text-red-900 hover:bg-red-100/70";
                      } else if (isGc) {
                        bgBorderClass = "bg-amber-50 border-amber-400 text-amber-950 hover:bg-amber-100/70";
                      }

                      return (
                        <div
                          key={event.id}
                          onClick={() => {
                            if (isOwner || isAdmin) openEditModal(event);
                          }}
                          title={`${displayTitle}${displayDescription ? `\n${displayDescription}` : ""}\nВремя: ${start.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}-${end.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}`}
                          className={`absolute left-1 right-1 rounded-xl p-2 shadow-sm flex flex-col justify-between overflow-hidden border transition-all cursor-pointer hover:shadow-md ${bgBorderClass}`}
                          style={{ 
                            top: `${topOffset}px`, 
                            height: `${heightVal}px`,
                            minHeight: "48px" 
                          }}
                        >
                          <div className="space-y-0.5 min-w-0">
                            <div className="flex justify-between items-start gap-1">
                              <h4 className="font-bold text-[11px] leading-tight line-clamp-1 truncate">
                                {displayTitle}
                              </h4>
                              {(isOwner || isAdmin) && (
                                <div className="flex items-center gap-1 shrink-0">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      openEditModal(event);
                                    }}
                                    className="text-slate-500 hover:text-blue-700 p-0.5 rounded transition-colors"
                                    title="Редактировать встречу"
                                  >
                                    <Pencil className="h-3 w-3" />
                                  </button>
                                  <button
                                    onClick={(e) => handleDelete(event.id, event.title, e)}
                                    className="text-red-500 hover:text-red-800 p-0.5 rounded transition-colors"
                                    title="Отменить встречу"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </button>
                                </div>
                              )}
                            </div>
                            {displayDescription && (
                              <p className="text-[9px] text-slate-500 line-clamp-1 leading-none truncate">
                                {displayDescription}
                              </p>
                            )}
                          </div>
                          
                          <div className="flex justify-between items-center text-[9px] font-bold text-slate-500 mt-0.5 pt-0.5 border-t border-black/5">
                            <span className="flex items-center gap-0.5 whitespace-nowrap">
                              <Clock className="h-2.5 w-2.5 shrink-0" />
                              {start.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}
                              {"-"}
                              {end.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}
                            </span>
                            {showBookedBy && (
                              <span className="truncate max-w-[70px] text-[8px] text-slate-400">👤 {event.bookedBy.name.split(" ")[0]}</span>
                            )}
                          </div>

                          {event.participants && event.participants.length > 0 && (
                            <div className="flex -space-x-1 overflow-hidden mt-1 self-start">
                              {event.participants.map((p) => (
                                <div
                                  key={p.id}
                                  className="inline-block h-4.5 w-4.5 rounded-full ring-1 ring-white bg-blue-100 text-blue-800 font-bold flex items-center justify-center text-[7px]"
                                  title={`Приглашен: ${p.name}`}
                                >
                                  {p.initials}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* МОДАЛЬНОЕ ОКНО СОЗДАНИЯ / РЕДАКТИРОВАНИЯ */}
      {isOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl border border-slate-200">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-200">
              <h3 className="text-lg font-bold text-slate-800">
                {editingEvent ? "Редактировать встречу" : "Запланировать встречу"}
              </h3>
              <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && (
                <div className="rounded-xl bg-rose-50 p-4 text-xs text-rose-800 border border-rose-200 flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <strong className="font-extrabold text-rose-950 block text-[10px] uppercase tracking-wider">Ошибка наложения!</strong>
                    <p className="leading-relaxed font-medium">{error}</p>
                  </div>
                </div>
              )}

              {isAdmin && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Режим события</label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setType("FREE")}
                      className={`px-3 py-2 rounded-lg border text-xs font-bold text-center cursor-pointer ${
                        type === "FREE"
                          ? "border-emerald-600 bg-emerald-50 text-emerald-700"
                          : "border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      Свободно (Зеленый)
                    </button>
                    <button
                      type="button"
                      onClick={() => setType("GC")}
                      className={`px-3 py-2 rounded-lg border text-xs font-bold text-center cursor-pointer ${
                        type === "GC"
                          ? "border-amber-600 bg-amber-50 text-amber-700"
                          : "border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      Главный Корпус (Желтый)
                    </button>
                    <button
                      type="button"
                      onClick={() => setType("BUSY")}
                      className={`px-3 py-2 rounded-lg border text-xs font-bold text-center cursor-pointer ${
                        type === "BUSY"
                          ? "border-red-600 bg-red-50 text-red-700"
                          : "border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      Занято (Красный)
                    </button>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {type === "BUSY" ? "Причина блокировки времени" : "Тема встречи / Совещания"}
                </label>
                <input
                  type="text"
                  required
                  placeholder={type === "BUSY" ? "Личный отпуск" : "Обсуждение проекта"}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 text-slate-800"
                  value={titleVal}
                  onChange={(e) => setTitleVal(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Дата</label>
                <input
                  type="date"
                  required
                  min={todayStr}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 text-slate-800"
                  value={dateVal}
                  onChange={(e) => setDateVal(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Начало</label>
                  <input
                    type="time"
                    required
                    step="300"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 text-slate-800"
                    value={startTimeVal}
                    onChange={(e) => setStartTimeVal(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Окончание</label>
                  <input
                    type="time"
                    required
                    step="300"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 text-slate-800"
                    value={endTimeVal}
                    onChange={(e) => setEndTimeVal(e.target.value)}
                  />
                </div>
              </div>

              {(type === "FREE" || type === "GC") && users.length > 0 && (
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                    <Users className="h-4 w-4 text-blue-500" /> Пригласить сотрудников
                  </label>
                  <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-2 border rounded-lg bg-slate-50">
                    {users.map((u) => {
                      const isSelected = selectedParticipants.includes(u.id);
                      return (
                        <button
                          key={u.id}
                          type="button"
                          onClick={() => toggleParticipant(u.id)}
                          className={`px-2 py-1 rounded-full text-[10px] font-semibold border transition-all cursor-pointer ${
                            isSelected
                              ? "bg-blue-600 border-blue-600 text-white shadow-sm"
                              : "bg-white border-slate-200 text-slate-700 hover:bg-slate-100"
                          }`}
                        >
                          {u.name.split(" ")[0]} {u.name.split(" ")[1]?.[0] || ""}.
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Повестка / Комментарий</label>
                <textarea
                  rows={2}
                  placeholder="Добавьте повестку встречи..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 text-slate-800"
                  value={descVal}
                  onChange={(e) => setDescVal(e.target.value)}
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
                  {editingEvent ? "Сохранить изменения" : type === "BUSY" ? "Заблокировать" : "Забронировать"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}