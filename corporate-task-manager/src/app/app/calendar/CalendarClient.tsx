// src/app/app/calendar/CalendarClient.tsx
"use client";

import React, { useState, useTransition, useEffect } from "react";
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
  Calendar as CalendarIcon,
  Cake,
  Sparkles
} from "lucide-react";
import { useRouter } from "next/navigation";
import { AudioConferenceModal } from "@/components/AudioConferenceModal";
import { Mic } from "lucide-react";

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

type BirthdayRecord = {
  id: string;
  fullName: string;
  birthDate: string;
  department: string;
};

interface CalendarClientProps {
  initialEvents: CalendarEvent[];
  isAdmin: boolean;
  currentUserId: string;
  users?: { id: string; name: string; initials: string }[];
  birthdays?: BirthdayRecord[];
}

// Список минут с шагом 5 минут
const MINUTE_STEPS = ["00", "05", "10", "15", "20", "25", "30", "35", "40", "45", "50", "55"];
// Часы сетки календаря с 07:00 до 23:00
const GRID_START_HOUR = 7;
const GRID_END_HOUR = 23;
const HOURS_LIST = Array.from({ length: GRID_END_HOUR - GRID_START_HOUR + 1 }, (_, i) => GRID_START_HOUR + i);
const HOUR_OPTIONS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
const CELL_HEIGHT = 64; // px на 1 час
const [isAudioRoomOpen, setIsAudioRoomOpen] = useState(false);
const [currentRoomName, setCurrentRoomName] = useState("general-room");
const [currentRoomTitle, setCurrentRoomTitle] = useState("Общая планерка");

export function CalendarClient({
  initialEvents,
  isAdmin,
  currentUserId,
  users = [],
  birthdays = []
}: CalendarClientProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);

  const [type, setType] = useState<"FREE" | "GC" | "BUSY">("FREE");
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);
  const [dateVal, setDateVal] = useState("");
  
  // Раздельный выбор часов и минут (шаг 5 минут)
  const [startHour, setStartHour] = useState("10");
  const [startMinute, setStartMinute] = useState("00");
  const [endHour, setEndHour] = useState("11");
  const [endMinute, setEndMinute] = useState("00");

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

  const handleToday = () => {
    const today = new Date();
    setCurrentWeekStart(getMonday(today));
    const day = today.getDay();
    setSelectedDayIndex(day === 0 ? 6 : day - 1);
  };

  // Быстрое выставление длительности (+30м, +45м, +1ч, +1.5ч)
  const addDuration = (minutesToAdd: number) => {
    let totalMins = parseInt(startHour, 10) * 60 + parseInt(startMinute, 10) + minutesToAdd;
    let newH = Math.floor(totalMins / 60) % 24;
    let newM = totalMins % 60;
    // Округляем до ближайших 5 минут
    newM = Math.round(newM / 5) * 5;
    if (newM >= 60) {
      newH = (newH + 1) % 24;
      newM = 0;
    }
    setEndHour(String(newH).padStart(2, "0"));
    setEndMinute(String(newM).padStart(2, "0"));
  };

  // Клик по свободной ячейке в сетке для мгновенного бронирования
  const handleCellClick = (dayDate: Date, hour: number) => {
    setError(null);
    setEditingEvent(null);
    setType("FREE");
    setSelectedParticipants([]);
    setDateVal(dayDate.toISOString().split("T")[0]);
    setStartHour(String(hour).padStart(2, "0"));
    setStartMinute("00");
    setEndHour(String((hour + 1) % 24).padStart(2, "0"));
    setEndMinute("00");
    setTitleVal("");
    setDescVal("");
    setIsOpen(true);
  };

  const openCreateModal = () => {
    setError(null);
    setEditingEvent(null);
    setType("FREE");
    setSelectedParticipants([]);
    setDateVal(new Date().toISOString().split("T")[0]);
    setStartHour("10");
    setStartMinute("00");
    setEndHour("11");
    setEndMinute("00");
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
    setStartHour(String(start.getHours()).padStart(2, "0"));
    setStartMinute(String(Math.round(start.getMinutes() / 5) * 5 % 60).padStart(2, "0"));
    setEndHour(String(end.getHours()).padStart(2, "0"));
    setEndMinute(String(Math.round(end.getMinutes() / 5) * 5 % 60).padStart(2, "0"));
    setTitleVal(event.title);
    setDescVal(event.description || "");
    setIsOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const startTimeISO = `${dateVal}T${startHour}:${startMinute}:00`;
    const endTimeISO = `${dateVal}T${endHour}:${endMinute}:00`;

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
          className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-sm font-bold transition-all shadow-sm w-full md:w-auto cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          {isAdmin ? "Добавить событие / Блок" : "Забронировать встречу"}
        </button>

        <button
          onClick={() => {
            setCurrentRoomName(`meeting-${Date.now()}`);
            setCurrentRoomTitle("Оперативное совещание команды");
            setIsAudioRoomOpen(true);
          }}
          className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl text-sm font-bold transition-all shadow-sm cursor-pointer"
        >
          <Mic className="h-4 w-4" />
          Аудиосовещание
        </button> 
      </div>

      {/* Панель недели */}
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

      {/* Мобильный селектор дней */}
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

      {/* ГЛАВНАЯ СЕТКА КАЛЕНДАРЯ */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* ДЕСКТОПНАЯ СЕТКА */}
        <div className="hidden md:block overflow-x-auto">
          <div className="min-w-[900px] relative flex flex-col">
            {/* Шапка дней недели + Дни Рождения */}
            <div className="grid grid-cols-[70px_repeat(7,1fr)] border-b border-slate-200 bg-slate-50/70">
              <div className="p-2 border-r border-slate-200 flex items-center justify-center text-[10px] text-slate-400 font-bold uppercase">
                Время
              </div>
              {weekDays.map((day, idx) => {
                const dayDateStr = day.toISOString().split("T")[0];
                const isToday = dayDateStr === todayStr;

                // Поиск именинников в этот день
                const bDaysToday = birthdays.filter((b) => {
                  const bd = new Date(b.birthDate);
                  return bd.getDate() === day.getDate() && bd.getMonth() === day.getMonth();
                });

                return (
                  <div 
                    key={idx} 
                    className={`p-2.5 flex flex-col items-center justify-center border-r border-slate-200 last:border-0 ${
                      isToday ? "bg-blue-50/70" : ""
                    }`}
                  >
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                      {day.toLocaleString("ru-RU", { weekday: "short" })}
                    </span>
                    <span className={`text-base font-black mt-0.5 ${isToday ? "text-blue-600" : "text-slate-800"}`}>
                      {day.getDate()}
                    </span>

                    {/* 🎂 Плашка дня рождения */}
                    {bDaysToday.map((b) => (
                      <div
                        key={b.id}
                        className="mt-1 px-2 py-0.5 bg-pink-100 border border-pink-200 text-pink-800 rounded-md text-[9px] font-extrabold flex items-center gap-1 shadow-xs truncate max-w-full"
                        title={`День рождения: ${b.fullName} (${b.department})`}
                      >
                        <Cake className="h-2.5 w-2.5 text-pink-600 shrink-0" />
                        <span className="truncate">ДР: {b.fullName.split(" ")[0]}</span>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>

            {/* Сетка часов и ячеек */}
            <div className="relative grid grid-cols-[70px_repeat(7,1fr)]">
              {/* Колонка времени */}
              <div className="flex flex-col bg-slate-50/30 border-r border-slate-200 shrink-0">
                {HOURS_LIST.map((hour) => (
                  <div 
                    key={hour} 
                    className="h-16 border-b border-slate-100 pr-2.5 flex justify-end items-start pt-1.5 text-[11px] font-bold text-slate-400"
                  >
                    {`${String(hour).padStart(2, "0")}:00`}
                  </div>
                ))}
              </div>

              {/* 7 колонок дней */}
              {Array.from({ length: 7 }).map((_, colIdx) => {
                const columnDate = weekDays[colIdx];
                return (
                  <div key={colIdx} className="flex flex-col border-r border-slate-100 last:border-0 relative">
                    {/* Кликабельные часовые слоты */}
                    {HOURS_LIST.map((hour) => (
                      <div
                        key={hour}
                        onClick={() => handleCellClick(columnDate, hour)}
                        className="h-16 border-b border-slate-100 hover:bg-blue-50/30 transition-colors cursor-pointer group relative"
                        title={`Нажмите, чтобы забронировать на ${String(hour).padStart(2, "0")}:00`}
                      >
                        <span className="opacity-0 group-hover:opacity-100 text-[10px] text-blue-500 font-bold absolute top-1 left-1 bg-white/90 px-1 rounded shadow-xs">
                          + {hour}:00
                        </span>
                      </div>
                    ))}

                    {/* Отрисовка событий на этот день */}
                    {initialEvents
                      .filter((event) => {
                        const eventDate = new Date(event.startTime);
                        return eventDate.toDateString() === columnDate.toDateString();
                      })
                      .map((event) => {
                        const start = new Date(event.startTime);
                        const end = new Date(event.endTime);
                        
                        const startHourDec = start.getHours() + start.getMinutes() / 60;
                        const endHourDec = end.getHours() + end.getMinutes() / 60;
                        
                        // Безопасное ограничение в пределах видимой сетки
                        const clampedStart = Math.max(startHourDec, GRID_START_HOUR);
                        const clampedEnd = Math.min(endHourDec > startHourDec ? endHourDec : 24, GRID_END_HOUR + 1);

                        const topOffset = (clampedStart - GRID_START_HOUR) * CELL_HEIGHT;
                        const heightVal = Math.max((clampedEnd - clampedStart) * CELL_HEIGHT, 42);

                        const isBusy = event.type === "BUSY";
                        const isGc = event.type === "GC";
                        const isOwner = event.bookedById === currentUserId;

                        const displayTitle = (isBusy && !isAdmin) ? "Занято (Блок руководителя)" : event.title;
                        const displayDescription = (isBusy && !isAdmin) ? null : event.description;
                        const showBookedBy = !isBusy || isAdmin;

                        let bgBorderClass = "bg-emerald-50 border-emerald-400 text-emerald-950 hover:bg-emerald-100";
                        if (isBusy) {
                          bgBorderClass = "bg-red-50 border-red-400 text-red-950 hover:bg-red-100";
                        } else if (isGc) {
                          bgBorderClass = "bg-amber-50 border-amber-400 text-amber-950 hover:bg-amber-100";
                        }

                        return (
                          <div
                            key={event.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (isOwner || isAdmin) openEditModal(event);
                            }}
                            title={`${displayTitle}${displayDescription ? `\n${displayDescription}` : ""}\nВремя: ${start.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}-${end.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}`}
                            className={`absolute left-1 right-1 rounded-xl p-2 shadow-xs flex flex-col justify-between overflow-hidden border transition-all cursor-pointer hover:shadow-md z-10 ${bgBorderClass}`}
                            style={{ 
                              top: `${topOffset}px`, 
                              height: `${heightVal}px`,
                              minHeight: "42px" 
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
                                      className="text-slate-400 hover:text-blue-700 p-0.5 rounded transition-colors"
                                      title="Редактировать встречу"
                                    >
                                      <Pencil className="h-3 w-3" />
                                    </button>
                                    <button
                                      onClick={(e) => handleDelete(event.id, event.title, e)}
                                      className="text-slate-400 hover:text-red-700 p-0.5 rounded transition-colors"
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
                                <span className="truncate max-w-[80px] text-[8px] text-slate-400">👤 {event.bookedBy.name.split(" ")[0]}</span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <AudioConferenceModal
        isOpen={isAudioRoomOpen}
        onClose={() => setIsAudioRoomOpen(false)}
        roomName={currentRoomName}
        roomTitle={currentRoomTitle}
        users={users}
        goals={[]}
        currentUserId={currentUserId}
        isAdmin={isAdmin}
      />

      {/* ========================================================================= */}
      {/* 📋 МОДАЛЬНОЕ ОКНО С ЭРГОНОМИЧНЫМ ШАГОМ 5 МИНУТ И БЫСТРЫМИ КНОПКАМИ */}
      {/* ========================================================================= */}
      {isOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-slate-200 overflow-hidden">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-200 bg-slate-50">
              <h3 className="text-lg font-bold text-slate-800">
                {editingEvent ? "Редактировать встречу" : "Запланировать встречу"}
              </h3>
              <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4" autoComplete="off">
              {error && (
                <div className="rounded-xl bg-rose-50 p-3.5 text-xs text-rose-800 border border-rose-200 flex items-start gap-2.5">
                  <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <strong className="font-extrabold text-rose-950 block text-[10px] uppercase">Ошибка наложения:</strong>
                    <p className="leading-tight">{error}</p>
                  </div>
                </div>
              )}

              {isAdmin && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Режим события</label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setType("FREE")}
                      className={`px-2.5 py-2 rounded-xl border text-xs font-bold text-center cursor-pointer transition-all ${
                        type === "FREE"
                          ? "border-emerald-600 bg-emerald-50 text-emerald-700 shadow-sm"
                          : "border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      Свободно (Зеленый)
                    </button>
                    <button
                      type="button"
                      onClick={() => setType("GC")}
                      className={`px-2.5 py-2 rounded-xl border text-xs font-bold text-center cursor-pointer transition-all ${
                        type === "GC"
                          ? "border-amber-600 bg-amber-50 text-amber-700 shadow-sm"
                          : "border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      Главный Корпус (Желтый)
                    </button>
                    <button
                      type="button"
                      onClick={() => setType("BUSY")}
                      className={`px-2.5 py-2 rounded-xl border text-xs font-bold text-center cursor-pointer transition-all ${
                        type === "BUSY"
                          ? "border-red-600 bg-red-50 text-red-700 shadow-sm"
                          : "border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      Занято (Красный)
                    </button>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {type === "BUSY" ? "Причина блокировки времени" : "Тема встречи / Совещания"}
                </label>
                <input
                  type="text"
                  required
                  placeholder={type === "BUSY" ? "Выездное совещание в министерстве" : "Обсуждение проекта, согласование сметы"}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:border-blue-500 text-slate-800"
                  value={titleVal}
                  onChange={(e) => setTitleVal(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Дата встречи</label>
                <input
                  type="date"
                  required
                  min={todayStr}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:border-blue-500 text-slate-800 bg-white"
                  value={dateVal}
                  onChange={(e) => setDateVal(e.target.value)}
                />
              </div>

              {/* ⚡ ЭРГОНОМИЧНЫЙ ВЫБОР ВРЕМЕНИ С ШАГОМ 5 МИНУТ */}
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-200">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Начало</label>
                  <div className="flex gap-1">
                    <select
                      value={startHour}
                      onChange={(e) => setStartHour(e.target.value)}
                      className="flex-1 px-2 py-1.5 border border-slate-300 rounded-lg text-xs font-bold bg-white text-slate-800 focus:outline-none focus:border-blue-500"
                    >
                      {HOUR_OPTIONS.map((h) => (
                        <option key={h} value={h}>{h} ч</option>
                      ))}
                    </select>
                    <select
                      value={startMinute}
                      onChange={(e) => setStartMinute(e.target.value)}
                      className="flex-1 px-2 py-1.5 border border-slate-300 rounded-lg text-xs font-bold bg-white text-slate-800 focus:outline-none focus:border-blue-500"
                    >
                      {MINUTE_STEPS.map((m) => (
                        <option key={m} value={m}>{m} м</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Окончание</label>
                  <div className="flex gap-1">
                    <select
                      value={endHour}
                      onChange={(e) => setEndHour(e.target.value)}
                      className="flex-1 px-2 py-1.5 border border-slate-300 rounded-lg text-xs font-bold bg-white text-slate-800 focus:outline-none focus:border-blue-500"
                    >
                      {HOUR_OPTIONS.map((h) => (
                        <option key={h} value={h}>{h} ч</option>
                      ))}
                    </select>
                    <select
                      value={endMinute}
                      onChange={(e) => setEndMinute(e.target.value)}
                      className="flex-1 px-2 py-1.5 border border-slate-300 rounded-lg text-xs font-bold bg-white text-slate-800 focus:outline-none focus:border-blue-500"
                    >
                      {MINUTE_STEPS.map((m) => (
                        <option key={m} value={m}>{m} м</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Быстрые кнопки длительности */}
                <div className="col-span-2 pt-1 flex items-center justify-between gap-1 text-[10px] font-bold">
                  <span className="text-slate-400">Длительность:</span>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => addDuration(30)}
                      className="px-2 py-1 bg-white border border-slate-200 hover:bg-blue-50 hover:text-blue-700 rounded-md transition-colors cursor-pointer"
                    >
                      +30 мин
                    </button>
                    <button
                      type="button"
                      onClick={() => addDuration(45)}
                      className="px-2 py-1 bg-white border border-slate-200 hover:bg-blue-50 hover:text-blue-700 rounded-md transition-colors cursor-pointer"
                    >
                      +45 мин
                    </button>
                    <button
                      type="button"
                      onClick={() => addDuration(60)}
                      className="px-2 py-1 bg-white border border-slate-200 hover:bg-blue-50 hover:text-blue-700 rounded-md transition-colors cursor-pointer"
                    >
                      +1 час
                    </button>
                    <button
                      type="button"
                      onClick={() => addDuration(90)}
                      className="px-2 py-1 bg-white border border-slate-200 hover:bg-blue-50 hover:text-blue-700 rounded-md transition-colors cursor-pointer"
                    >
                      +1.5 ч
                    </button>
                  </div>
                </div>
              </div>

              {(type === "FREE" || type === "GC") && users.length > 0 && (
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                    <Users className="h-4 w-4 text-blue-500" /> Пригласить сотрудников
                  </label>
                  <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto p-2 border rounded-xl bg-slate-50">
                    {users.map((u) => {
                      const isSelected = selectedParticipants.includes(u.id);
                      return (
                        <button
                          key={u.id}
                          type="button"
                          onClick={() => toggleParticipant(u.id)}
                          className={`px-2.5 py-1 rounded-full text-[11px] font-bold border transition-all cursor-pointer ${
                            isSelected
                              ? "bg-blue-600 border-blue-600 text-white shadow-xs"
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
                <label className="block text-xs font-bold text-slate-700 mb-1">Повестка / Комментарий</label>
                <textarea
                  rows={2}
                  placeholder="Добавьте повестку встречи, ссылки на документы..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:outline-none focus:border-blue-500 text-slate-800"
                  value={descVal}
                  onChange={(e) => setDescVal(e.target.value)}
                />
              </div>

              <div className="flex gap-3 pt-2">
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
                  className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm disabled:bg-blue-400 cursor-pointer"
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