// src/app/app/calendar/CalendarClient.tsx
"use client";

import React, { useState, useEffect, useTransition, useMemo } from "react";
import { 
  createCalendarEvent, 
  updateCalendarEvent, 
  deleteCalendarEvent 
} from "@/server/actions/calendar";
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
  Mic,
  Eye,
  Check,
  MapPin,
  CalendarDays,
  List,
  Sparkles
} from "lucide-react";
import { useRouter } from "next/navigation";
import { AudioConferenceModal } from "@/components/AudioConferenceModal";

export type CalendarEvent = {
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

export type BirthdayRecord = {
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
  goals?: { id: string; title: string; color: string }[];
}

// =========================================================================
// 🕒 НАДЕЖНЫЕ ХЕЛПЕРЫ ДЛЯ ЧАСОВОГО ПОЯСА ЧИТЫ (UTC+9)
// =========================================================================
const CHITA_TZ = "Asia/Chita";

export interface ChitaDateInfo {
  year: number;
  month: number; // 1-12
  day: number;
  dayOfWeek: number; // 0 (Sun) - 6 (Sat)
  hour: number;
  minute: number;
  dateStr: string; // YYYY-MM-DD
  timeStr: string; // HH:mm
}

export function getChitaDateInfo(dateInput: Date | string | number): ChitaDateInfo {
  const d = typeof dateInput === "object" ? dateInput : new Date(dateInput);
  
  const formatter = new Intl.DateTimeFormat("en-GB", {
    timeZone: CHITA_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  const parts = formatter.formatToParts(d);
  let year = 2026, month = 1, day = 1, hour = 0, minute = 0;
  for (const p of parts) {
    if (p.type === "year") year = parseInt(p.value, 10);
    if (p.type === "month") month = parseInt(p.value, 10);
    if (p.type === "day") day = parseInt(p.value, 10);
    if (p.type === "hour") hour = parseInt(p.value, 10);
    if (p.type === "minute") minute = parseInt(p.value, 10);
  }
  if (hour === 24) hour = 0;

  const pad = (n: number) => String(n).padStart(2, "0");
  const dateStr = `${year}-${pad(month)}-${pad(day)}`;
  const timeStr = `${pad(hour)}:${pad(minute)}`;
  const dayOfWeek = new Date(`${dateStr}T12:00:00+09:00`).getDay();

  return { year, month, day, dayOfWeek, hour, minute, dateStr, timeStr };
}

// Создание ISO строки с точным смещением Читы +09:00
export function createChitaIso(dateStr: string, hourStr: string, minuteStr: string): string {
  return `${dateStr}T${hourStr.padStart(2, "0")}:${minuteStr.padStart(2, "0")}:00+09:00`;
}

// Понедельник текущей недели в Чите
export function getChitaMonday(dateStr: string): string {
  const dt = new Date(`${dateStr}T12:00:00+09:00`);
  const day = dt.getDay();
  const diff = (day === 0 ? -6 : 1) - day;
  dt.setDate(dt.getDate() + diff);
  return getChitaDateInfo(dt).dateStr;
}

// Прибавление дней к дате в формате YYYY-MM-DD
export function addDaysToChitaDate(dateStr: string, days: number): string {
  const dt = new Date(`${dateStr}T12:00:00+09:00`);
  dt.setDate(dt.getDate() + days);
  return getChitaDateInfo(dt).dateStr;
}

const MONTH_NAMES_GENITIVE = [
  "января", "февраля", "марта", "апреля", "мая", "июня",
  "июля", "августа", "сентября", "октября", "ноября", "декабря"
];

const MONTH_NAMES_NOMINATIVE = [
  "Январь", "Февраль", "Март", "Апрель", "Май", "Июнь",
  "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"
];

const WEEKDAY_NAMES_SHORT = ["ПН", "ВТ", "СР", "ЧТ", "ПТ", "СБ", "ВС"];

const MINUTE_STEPS = ["00", "15", "30", "45"];
const GRID_START_HOUR = 8;
const GRID_END_HOUR = 21;
const HOURS_LIST = Array.from({ length: GRID_END_HOUR - GRID_START_HOUR + 1 }, (_, i) => GRID_START_HOUR + i);
const HOUR_OPTIONS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
const CELL_HEIGHT = 64;

export function CalendarClient({
  initialEvents,
  isAdmin,
  currentUserId,
  users = [],
  birthdays = [],
  goals = []
}: CalendarClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Текущая дата в Чите
  const todayChita = useMemo(() => getChitaDateInfo(new Date()), []);
  const todayStr = todayChita.dateStr;

  // Режим просмотра: "week" | "day" | "month" | "agenda"
  const [viewMode, setViewMode] = useState<"week" | "day" | "month" | "agenda">("week");

  // Фильтр типов: "ALL" | "FREE" | "GC" | "BUSY"
  const [filterType, setFilterType] = useState<"ALL" | "FREE" | "GC" | "BUSY">("ALL");

  // Текущая опорная дата (YYYY-MM-DD)
  const [currentDateStr, setCurrentDateStr] = useState<string>(todayStr);

  // Начало недели (понедельник) для отображаемой даты
  const weekStartStr = useMemo(() => getChitaMonday(currentDateStr), [currentDateStr]);

  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const dStr = addDaysToChitaDate(weekStartStr, i);
      const info = getChitaDateInfo(new Date(`${dStr}T12:00:00+09:00`));
      return { dateStr: dStr, info };
    });
  }, [weekStartStr]);

  // Красная линия текущего времени (обновляется раз в минуту)
  const [nowMinuteOffset, setNowMinuteOffset] = useState<number | null>(null);

  useEffect(() => {
    const updateNow = () => {
      const info = getChitaDateInfo(new Date());
      if (info.hour >= GRID_START_HOUR && info.hour <= GRID_END_HOUR) {
        const minutesFromStart = (info.hour - GRID_START_HOUR) * 60 + info.minute;
        setNowMinuteOffset((minutesFromStart / 60) * CELL_HEIGHT);
      } else {
        setNowMinuteOffset(null);
      }
    };
    updateNow();
    const interval = setInterval(updateNow, 60000);
    return () => clearInterval(interval);
  }, []);

  // Аудиоконференция LiveKit
  const [isAudioRoomOpen, setIsAudioRoomOpen] = useState(false);
  const [currentRoomName, setCurrentRoomName] = useState("general-team-room");
  const [currentRoomTitle, setCurrentRoomTitle] = useState("Общая планерка команды");
  const [currentCalendarEventId, setCurrentCalendarEventId] = useState<string | undefined>(undefined);

  // Модальные окна
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);

  // Поля формы создания / редактирования
  const [type, setType] = useState<"FREE" | "GC" | "BUSY">("FREE");
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);
  const [formDate, setFormDate] = useState(todayStr);
  const [startHour, setStartHour] = useState("10");
  const [startMinute, setStartMinute] = useState("00");
  const [endHour, setEndHour] = useState("11");
  const [endMinute, setEndMinute] = useState("00");
  const [titleVal, setTitleVal] = useState("");
  const [descVal, setDescVal] = useState("");

  // Вычисление длительности в минутах для подсказки
  const durationMinutes = useMemo(() => {
    const startM = parseInt(startHour, 10) * 60 + parseInt(startMinute, 10);
    const endM = parseInt(endHour, 10) * 60 + parseInt(endMinute, 10);
    return endM > startM ? endM - startM : 0;
  }, [startHour, startMinute, endHour, endMinute]);

  const setDuration = (minutesToAdd: number) => {
    const startM = parseInt(startHour, 10) * 60 + parseInt(startMinute, 10);
    const newEndM = startM + minutesToAdd;
    let newH = Math.floor(newEndM / 60) % 24;
    let newM = newEndM % 60;
    newM = Math.round(newM / 15) * 15;
    if (newM >= 60) {
      newH = (newH + 1) % 24;
      newM = 0;
    }
    setEndHour(String(newH).padStart(2, "0"));
    setEndMinute(String(newM).padStart(2, "0"));
  };

  // Навигация
  const handlePrev = () => {
    if (viewMode === "day") {
      setCurrentDateStr(addDaysToChitaDate(currentDateStr, -1));
    } else if (viewMode === "month") {
      const cur = getChitaDateInfo(new Date(`${currentDateStr}T12:00:00+09:00`));
      const prevM = new Date(Date.UTC(cur.year, cur.month - 2, 1, 12));
      setCurrentDateStr(getChitaDateInfo(prevM).dateStr);
    } else {
      setCurrentDateStr(addDaysToChitaDate(currentDateStr, -7));
    }
  };

  const handleNext = () => {
    if (viewMode === "day") {
      setCurrentDateStr(addDaysToChitaDate(currentDateStr, 1));
    } else if (viewMode === "month") {
      const cur = getChitaDateInfo(new Date(`${currentDateStr}T12:00:00+09:00`));
      const nextM = new Date(Date.UTC(cur.year, cur.month, 1, 12));
      setCurrentDateStr(getChitaDateInfo(nextM).dateStr);
    } else {
      setCurrentDateStr(addDaysToChitaDate(currentDateStr, 7));
    }
  };

  const handleToday = () => {
    setCurrentDateStr(todayStr);
  };

  // Заголовок периода
  const formattedHeaderPeriod = useMemo(() => {
    if (viewMode === "day") {
      const info = getChitaDateInfo(new Date(`${currentDateStr}T12:00:00+09:00`));
      return `${info.day} ${MONTH_NAMES_GENITIVE[info.month - 1]} ${info.year} г.`;
    }
    if (viewMode === "month") {
      const info = getChitaDateInfo(new Date(`${currentDateStr}T12:00:00+09:00`));
      return `${MONTH_NAMES_NOMINATIVE[info.month - 1]} ${info.year} г.`;
    }
    const startInfo = weekDays[0].info;
    const endInfo = weekDays[6].info;
    if (startInfo.month === endInfo.month) {
      return `${startInfo.day} – ${endInfo.day} ${MONTH_NAMES_GENITIVE[endInfo.month - 1]} ${endInfo.year} г.`;
    }
    return `${startInfo.day} ${MONTH_NAMES_GENITIVE[startInfo.month - 1]} – ${endInfo.day} ${MONTH_NAMES_GENITIVE[endInfo.month - 1]} ${endInfo.year} г.`;
  }, [viewMode, currentDateStr, weekDays]);

  // Фильтрация событий
  const filteredEvents = useMemo(() => {
    if (filterType === "ALL") return initialEvents;
    return initialEvents.filter(e => e.type === filterType);
  }, [initialEvents, filterType]);

  // Открытие модалки создания с готовыми временем и датой
  const openCreateModal = (datePrefill?: string, hourPrefill?: number) => {
    setError(null);
    setEditingEvent(null);
    setType("FREE");
    setSelectedParticipants([]);
    setFormDate(datePrefill || currentDateStr);

    const h = hourPrefill !== undefined ? hourPrefill : 10;
    setStartHour(String(h).padStart(2, "0"));
    setStartMinute("00");
    setEndHour(String((h + 1) % 24).padStart(2, "0"));
    setEndMinute("00");

    setTitleVal("");
    setDescVal("");
    setIsEditModalOpen(true);
  };

  const openEditModal = (event: CalendarEvent, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setError(null);
    setEditingEvent(event);
    setType(event.type);
    setSelectedParticipants(event.participants ? event.participants.map(p => p.id) : []);

    const sInfo = getChitaDateInfo(event.startTime);
    const eInfo = getChitaDateInfo(event.endTime);

    setFormDate(sInfo.dateStr);
    setStartHour(String(sInfo.hour).padStart(2, "0"));
    setStartMinute(String(Math.round(sInfo.minute / 15) * 15 % 60).padStart(2, "0"));
    setEndHour(String(eInfo.hour).padStart(2, "0"));
    setEndMinute(String(Math.round(eInfo.minute / 15) * 15 % 60).padStart(2, "0"));
    setTitleVal(event.title);
    setDescVal(event.description || "");

    setIsViewModalOpen(false);
    setIsEditModalOpen(true);
  };

  const openViewModal = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setIsViewModalOpen(true);
  };

  // Запуск аудиокомнаты
  const joinGeneralTeamRoom = () => {
    setCurrentRoomName("general-team-room");
    setCurrentRoomTitle("Общая планерка команды");
    setCurrentCalendarEventId(undefined);
    setIsAudioRoomOpen(true);
  };

  const joinEventRoom = (event: CalendarEvent, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCurrentRoomName(`event-${event.id}`);
    setCurrentRoomTitle(`Совещание: ${event.title}`);
    setCurrentCalendarEventId(event.id);
    setIsAudioRoomOpen(true);
  };

  // Отправка формы сохранения встречи
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const startTimeISO = createChitaIso(formDate, startHour, startMinute);
    const endTimeISO = createChitaIso(formDate, endHour, endMinute);

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
        setIsEditModalOpen(false);
        router.refresh();
      } catch (err: any) {
        setError(err.message || "Ошибка сохранения события");
      }
    });
  };

  const handleDelete = async (id: string, title: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!window.confirm(`Отменить встречу «${title}»?`)) return;

    startTransition(async () => {
      try {
        await deleteCalendarEvent(id);
        setIsViewModalOpen(false);
        setIsEditModalOpen(false);
        router.refresh();
      } catch (err: any) {
        alert(err.message || "Ошибка отмены встречи");
      }
    });
  };

  const toggleParticipant = (userId: string) => {
    setSelectedParticipants((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  return (
    <div className="space-y-5">
      {/* 🧭 ВЕРХНЯЯ ШАПКА КАЛЕНДАРЯ */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">Календарь руководителя</h2>
            <span className="hidden sm:inline-flex items-center gap-1 text-[11px] bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-0.5 rounded-full font-bold">
              <Clock className="h-3 w-3 text-blue-600" /> Чита (UTC+9)
            </span>
          </div>
          <p className="text-slate-500 text-xs">
            Официальное расписание встреч, совещаний и приёмных часов Главного корпуса
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
          {/* Режимы отображения */}
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold">
            <button
              onClick={() => setViewMode("week")}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                viewMode === "week" ? "bg-white text-blue-600 shadow-xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <CalendarIcon className="h-3.5 w-3.5" /> Неделя
            </button>
            <button
              onClick={() => setViewMode("day")}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                viewMode === "day" ? "bg-white text-blue-600 shadow-xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <CalendarDays className="h-3.5 w-3.5" /> День
            </button>
            <button
              onClick={() => setViewMode("month")}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                viewMode === "month" ? "bg-white text-blue-600 shadow-xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Месяц
            </button>
            <button
              onClick={() => setViewMode("agenda")}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                viewMode === "agenda" ? "bg-white text-blue-600 shadow-xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <List className="h-3.5 w-3.5" /> Список
            </button>
          </div>

          {/* Кнопка входа в общую планерку команды */}
          <button
            onClick={joinGeneralTeamRoom}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
            title="Войти в защищенную аудиокомнату для планерок"
          >
            <Mic className="h-4 w-4" />
            <span>Общая планерка</span>
          </button>

          {/* Запланировать встречу */}
          <button
            onClick={() => openCreateModal()}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>{isAdmin ? "Запланировать встречу" : "Забронировать встречу"}</span>
          </button>
        </div>
      </div>

      {/* 📅 ПАНЕЛЬ НАВИГАЦИИ И БЫСТРЫХ ФИЛЬТРОВ */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900 text-white p-3.5 rounded-2xl shadow-sm">
        <div className="flex items-center gap-2">
          <button
            onClick={handleToday}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-blue-400 rounded-xl text-xs font-bold transition-all border border-slate-700 cursor-pointer"
          >
            Сегодня
          </button>
          <div className="flex items-center">
            <button 
              onClick={handlePrev}
              className="p-1.5 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg transition-colors cursor-pointer"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button 
              onClick={handleNext}
              className="p-1.5 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg transition-colors cursor-pointer"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          <span className="font-extrabold text-sm sm:text-base tracking-wide text-slate-100 ml-1">
            {formattedHeaderPeriod}
          </span>
        </div>

        {/* Быстрые фильтры типов событий */}
        <div className="flex items-center gap-1.5 text-xs">
          <button
            onClick={() => setFilterType("ALL")}
            className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
              filterType === "ALL" ? "bg-white text-slate-900 shadow-xs" : "text-slate-400 hover:text-white"
            }`}
          >
            Все
          </button>
          <button
            onClick={() => setFilterType("FREE")}
            className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1 ${
              filterType === "FREE" ? "bg-emerald-500 text-white shadow-xs" : "text-emerald-400 hover:text-emerald-300"
            }`}
          >
            <span className="h-2 w-2 rounded-full bg-emerald-400" /> Встречи
          </button>
          <button
            onClick={() => setFilterType("GC")}
            className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1 ${
              filterType === "GC" ? "bg-amber-500 text-slate-950 shadow-xs" : "text-amber-400 hover:text-amber-300"
            }`}
          >
            <span className="h-2 w-2 rounded-full bg-amber-400" /> Главный корпус
          </button>
          <button
            onClick={() => setFilterType("BUSY")}
            className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1 ${
              filterType === "BUSY" ? "bg-rose-500 text-white shadow-xs" : "text-rose-400 hover:text-rose-300"
            }`}
          >
            <span className="h-2 w-2 rounded-full bg-rose-400" /> Занято
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. РЕЖИМ: НЕДЕЛЯ (ДЕСКТОП И СЕТКА) */}
      {/* ========================================================================= */}
      {viewMode === "week" && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <div className="min-w-[850px] relative flex flex-col">
              {/* Шапка 7 дней недели */}
              <div className="grid grid-cols-[65px_repeat(7,1fr)] border-b border-slate-200 bg-slate-50/80">
                <div className="p-3 border-r border-slate-200 flex items-center justify-center text-[10px] text-slate-400 font-bold uppercase">
                  Чита
                </div>
                {weekDays.map(({ dateStr, info }, idx) => {
                  const isToday = dateStr === todayStr;
                  const bDaysToday = birthdays.filter((b) => {
                    const bInfo = getChitaDateInfo(b.birthDate);
                    return bInfo.day === info.day && bInfo.month === info.month;
                  });

                  return (
                    <div 
                      key={idx} 
                      className={`p-2.5 flex flex-col items-center justify-center border-r border-slate-200 last:border-0 ${
                        isToday ? "bg-blue-50/70" : ""
                      }`}
                    >
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                        {WEEKDAY_NAMES_SHORT[idx]}
                      </span>
                      <span className={`text-base font-black mt-0.5 ${isToday ? "text-blue-600 font-black" : "text-slate-800"}`}>
                        {info.day}
                      </span>

                      {/* Дни рождения */}
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

              {/* Сетка часов и событий */}
              <div className="relative grid grid-cols-[65px_repeat(7,1fr)]">
                {/* Колонка времени */}
                <div className="flex flex-col bg-slate-50/40 border-r border-slate-200 shrink-0">
                  {HOURS_LIST.map((hour) => (
                    <div 
                      key={hour} 
                      className="h-16 border-b border-slate-100 pr-2 flex justify-end items-start pt-1.5 text-[11px] font-bold text-slate-400"
                    >
                      {`${String(hour).padStart(2, "0")}:00`}
                    </div>
                  ))}
                </div>

                {/* 7 колонок дней */}
                {weekDays.map(({ dateStr }, colIdx) => {
                  const isTodayCol = dateStr === todayStr;

                  const eventsThisDay = filteredEvents.filter((event) => {
                    const eventDate = getChitaDateInfo(event.startTime).dateStr;
                    return eventDate === dateStr;
                  });

                  return (
                    <div key={colIdx} className="flex flex-col border-r border-slate-100 last:border-0 relative">
                      {/* Красная линия текущего времени (только для сегодняшнего дня) */}
                      {isTodayCol && nowMinuteOffset !== null && (
                        <div 
                          className="absolute left-0 right-0 z-20 flex items-center pointer-events-none"
                          style={{ top: `${nowMinuteOffset}px` }}
                        >
                          <span className="h-2.5 w-2.5 rounded-full bg-red-500 -ml-1.5 shadow-sm" />
                          <div className="flex-1 border-t-2 border-red-500" />
                        </div>
                      )}

                      {/* Пустые ячейки для клика */}
                      {HOURS_LIST.map((hour) => (
                        <div
                          key={hour}
                          onClick={() => openCreateModal(dateStr, hour)}
                          className="h-16 border-b border-slate-100 hover:bg-blue-50/40 transition-colors cursor-pointer group relative"
                          title={`Запланировать на ${String(hour).padStart(2, "0")}:00`}
                        >
                          <span className="opacity-0 group-hover:opacity-100 text-[10px] text-blue-600 font-bold absolute top-1 left-1 bg-white/95 px-1 rounded shadow-xs z-10">
                            + {hour}:00
                          </span>
                        </div>
                      ))}

                      {/* Карточки встреч */}
                      {eventsThisDay.map((event) => {
                        const sInfo = getChitaDateInfo(event.startTime);
                        const eInfo = getChitaDateInfo(event.endTime);

                        const startHourDec = sInfo.hour + sInfo.minute / 60;
                        const endHourDec = eInfo.hour + eInfo.minute / 60;

                        const clampedStart = Math.max(startHourDec, GRID_START_HOUR);
                        const clampedEnd = Math.min(endHourDec > startHourDec ? endHourDec : 24, GRID_END_HOUR + 1);

                        const topOffset = (clampedStart - GRID_START_HOUR) * CELL_HEIGHT;
                        const heightVal = Math.max((clampedEnd - clampedStart) * CELL_HEIGHT, 44);

                        const isBusy = event.type === "BUSY";
                        const isGc = event.type === "GC";
                        const isOwner = event.bookedById === currentUserId;

                        const displayTitle = (isBusy && !isAdmin) ? "Занято (Блок руководителя)" : event.title;
                        const displayDescription = (isBusy && !isAdmin) ? null : event.description;
                        const showBookedBy = !isBusy || isAdmin;

                        let styleClasses = "bg-emerald-50 border-emerald-400 text-emerald-950 hover:bg-emerald-100/90";
                        if (isBusy) {
                          styleClasses = "bg-rose-50 border-rose-400 text-rose-950 hover:bg-rose-100/90";
                        } else if (isGc) {
                          styleClasses = "bg-amber-50 border-amber-400 text-amber-950 hover:bg-amber-100/90";
                        }

                        return (
                          <div
                            key={event.id}
                            onClick={() => openViewModal(event)}
                            className={`absolute left-1 right-1 rounded-xl p-2 shadow-xs flex flex-col justify-between overflow-hidden border transition-all cursor-pointer hover:shadow-md z-10 ${styleClasses}`}
                            style={{ 
                              top: `${topOffset}px`, 
                              height: `${heightVal}px`,
                              minHeight: "44px" 
                            }}
                          >
                            <div className="space-y-0.5 min-w-0">
                              <div className="flex justify-between items-start gap-1">
                                <h4 className="font-bold text-[11px] leading-tight line-clamp-1 truncate" title={displayTitle}>
                                  {displayTitle}
                                </h4>

                                <div className="flex items-center gap-1 shrink-0">
                                  {/* Вход в аудиокомнату */}
                                  {!isBusy && (
                                    <button
                                      onClick={(e) => joinEventRoom(event, e)}
                                      className="p-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-all shadow-xs cursor-pointer"
                                      title="Войти в аудиокомнату этой встречи"
                                    >
                                      <Mic className="h-3 w-3" />
                                    </button>
                                  )}

                                  {(isOwner || isAdmin) && (
                                    <button
                                      onClick={(e) => openEditModal(event, e)}
                                      className="p-1 text-slate-400 hover:text-blue-600 hover:bg-white/60 rounded transition-colors"
                                      title="Редактировать"
                                    >
                                      <Pencil className="h-3 w-3" />
                                    </button>
                                  )}
                                </div>
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
                                {sInfo.timeStr} – {eInfo.timeStr}
                              </span>
                              {showBookedBy && (
                                <span className="truncate max-w-[80px] text-[8px] text-slate-400">
                                  👤 {event.bookedBy.name.split(" ")[0]}
                                </span>
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
      )}

      {/* ========================================================================= */}
      {/* 2. РЕЖИМ: ДЕНЬ (УДОБНО НА ТЕЛЕФОНЕ И ПЛАНШЕТЕ) */}
      {/* ========================================================================= */}
      {viewMode === "day" && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 sm:p-6 space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-lg font-bold text-slate-800">
                {formattedHeaderPeriod}
              </h3>
              <p className="text-xs text-slate-400">Почасовой график встреч руководителя на день</p>
            </div>
            <button
              onClick={() => openCreateModal(currentDateStr)}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1"
            >
              <Plus className="h-3.5 w-3.5" /> Добавить
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {HOURS_LIST.map((hour) => {
              const hourEvents = filteredEvents.filter((e) => {
                const sInfo = getChitaDateInfo(e.startTime);
                return sInfo.dateStr === currentDateStr && sInfo.hour === hour;
              });

              return (
                <div key={hour} className="py-2.5 flex items-start gap-4 hover:bg-slate-50/50 rounded-xl transition-colors">
                  <div className="w-14 text-xs font-bold text-slate-400 pt-1 shrink-0">
                    {String(hour).padStart(2, "0")}:00
                  </div>
                  <div className="flex-1 space-y-2">
                    {hourEvents.length === 0 ? (
                      <div 
                        onClick={() => openCreateModal(currentDateStr, hour)}
                        className="text-xs text-slate-300 italic py-1 cursor-pointer hover:text-blue-500"
                      >
                        + Свободное время, нажмите для записи
                      </div>
                    ) : (
                      hourEvents.map((event) => {
                        const sInfo = getChitaDateInfo(event.startTime);
                        const eInfo = getChitaDateInfo(event.endTime);
                        return (
                          <div
                            key={event.id}
                            onClick={() => openViewModal(event)}
                            className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-3 cursor-pointer hover:shadow-xs transition-all"
                          >
                            <div>
                              <div className="font-bold text-slate-900 text-sm">{event.title}</div>
                              <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                                <span className="flex items-center gap-1 font-semibold text-slate-600">
                                  <Clock className="h-3 w-3" /> {sInfo.timeStr} – {eInfo.timeStr}
                                </span>
                                <span>• 👤 {event.bookedBy.name}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5">
                              {event.type !== "BUSY" && (
                                <button
                                  onClick={(e) => joinEventRoom(event, e)}
                                  className="p-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold cursor-pointer"
                                >
                                  <Mic className="h-3.5 w-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. РЕЖИМ: МЕСЯЦ (НАГЛЯДНЫЙ ОБЗОР ВСЕХ ДНЕЙ) */}
      {/* ========================================================================= */}
      {viewMode === "month" && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 overflow-hidden">
          <div className="grid grid-cols-7 border-b border-slate-200 pb-2 text-center text-xs font-bold text-slate-400 uppercase tracking-wider">
            {WEEKDAY_NAMES_SHORT.map((wd) => (
              <div key={wd}>{wd}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1 pt-2">
            {(() => {
              const curInfo = getChitaDateInfo(new Date(`${currentDateStr}T12:00:00+09:00`));
              const firstDayOfMonth = new Date(`${curInfo.year}-${String(curInfo.month).padStart(2, "0")}-01T12:00:00+09:00`);
              const firstDayOfWeek = firstDayOfMonth.getDay();
              const leadingOffset = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;

              const daysInMonth = new Date(curInfo.year, curInfo.month, 0).getDate();

              const cells = [];
              for (let i = 0; i < leadingOffset; i++) {
                cells.push(<div key={`empty-${i}`} className="min-h-[80px] bg-slate-50/30 rounded-xl" />);
              }

              for (let d = 1; d <= daysInMonth; d++) {
                const dayStr = `${curInfo.year}-${String(curInfo.month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
                const isToday = dayStr === todayStr;

                const dayEvents = filteredEvents.filter(e => getChitaDateInfo(e.startTime).dateStr === dayStr);
                const dayBirthdays = birthdays.filter(b => {
                  const bInfo = getChitaDateInfo(b.birthDate);
                  return bInfo.day === d && bInfo.month === curInfo.month;
                });

                cells.push(
                  <div
                    key={d}
                    onClick={() => {
                      setCurrentDateStr(dayStr);
                      setViewMode("day");
                    }}
                    className={`min-h-[85px] p-1.5 border rounded-xl flex flex-col justify-between cursor-pointer transition-all hover:bg-blue-50/40 ${
                      isToday ? "bg-blue-50/70 border-blue-400 shadow-xs" : "bg-white border-slate-100"
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className={`text-xs font-black ${isToday ? "text-blue-600" : "text-slate-700"}`}>
                        {d}
                      </span>
                      {dayBirthdays.length > 0 && (
                        <span title={`День рождения: ${dayBirthdays[0].fullName}`}>
                          <Cake className="h-3 w-3 text-pink-500" />
                        </span>
                      )}
                    </div>

                    <div className="space-y-1 mt-1 overflow-hidden">
                      {dayEvents.slice(0, 2).map((ev) => (
                        <div
                          key={ev.id}
                          className="px-1.5 py-0.5 rounded text-[9px] font-bold truncate bg-slate-100 text-slate-800 border"
                        >
                          {ev.title}
                        </div>
                      ))}
                      {dayEvents.length > 2 && (
                        <div className="text-[9px] text-blue-600 font-extrabold pl-1">
                          +{dayEvents.length - 2} еще
                        </div>
                      )}
                    </div>
                  </div>
                );
              }

              return cells;
            })()}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. РЕЖИМ: СПИСОК / АДЖЕНДА (ПОВЕСТКА) */}
      {/* ========================================================================= */}
      {viewMode === "agenda" && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 sm:p-6 space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <h3 className="text-lg font-bold text-slate-800">Повестка совещаний и встреч</h3>
            <span className="text-xs text-slate-400">Всего записей: {filteredEvents.length}</span>
          </div>

          <div className="space-y-3">
            {filteredEvents.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs italic">Запланированных встреч нет</div>
            ) : (
              filteredEvents.map((event) => {
                const sInfo = getChitaDateInfo(event.startTime);
                const eInfo = getChitaDateInfo(event.endTime);

                return (
                  <div
                    key={event.id}
                    onClick={() => openViewModal(event)}
                    className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 cursor-pointer hover:shadow-sm transition-all"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                          event.type === "BUSY" ? "bg-rose-100 text-rose-800" : event.type === "GC" ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"
                        }`}>
                          {event.type === "BUSY" ? "Занято" : event.type === "GC" ? "Главный корпус" : "Встреча"}
                        </span>
                        <span className="text-xs font-bold text-blue-600 flex items-center gap-1">
                          <CalendarIcon className="h-3 w-3" />
                          {sInfo.day} {MONTH_NAMES_GENITIVE[sInfo.month - 1]} ({sInfo.timeStr} – {eInfo.timeStr})
                        </span>
                      </div>
                      <h4 className="font-bold text-slate-900 text-sm leading-snug">{event.title}</h4>
                      {event.description && (
                        <p className="text-xs text-slate-500 line-clamp-1">{event.description}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end pt-2 sm:pt-0">
                      {event.type !== "BUSY" && (
                        <button
                          onClick={(e) => joinEventRoom(event, e)}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                        >
                          <Mic className="h-3.5 w-3.5" /> В комнату
                        </button>
                      )}
                      {(event.bookedById === currentUserId || isAdmin) && (
                        <button
                          onClick={(e) => openEditModal(event, e)}
                          className="p-2 hover:bg-slate-200 text-slate-600 rounded-xl transition-colors cursor-pointer"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 🔍 МОДАЛЬНОЕ ОКНО ДЕТАЛЕЙ ВСТРЕЧИ (ДЛЯ ВСЕХ СОТРУДНИКОВ) */}
      {/* ========================================================================= */}
      {isViewModalOpen && selectedEvent && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
              <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-black uppercase tracking-wider ${
                selectedEvent.type === "BUSY" 
                  ? "bg-rose-100 text-rose-800 border border-rose-200" 
                  : selectedEvent.type === "GC" 
                  ? "bg-amber-100 text-amber-800 border border-amber-200" 
                  : "bg-emerald-100 text-emerald-800 border border-emerald-200"
              }`}>
                {selectedEvent.type === "BUSY" ? "Заблокировано руководителем" : selectedEvent.type === "GC" ? "Главный корпус" : "Совещание"}
              </span>
              <button onClick={() => setIsViewModalOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <h3 className="text-xl font-black text-slate-900 leading-snug">
                  {selectedEvent.type === "BUSY" && !isAdmin ? "Занято (Блок руководителя)" : selectedEvent.title}
                </h3>
                <div className="flex items-center gap-1.5 text-xs text-blue-700 font-bold mt-1">
                  <Clock className="h-4 w-4" />
                  {(() => {
                    const s = getChitaDateInfo(selectedEvent.startTime);
                    const e = getChitaDateInfo(selectedEvent.endTime);
                    return `${s.day} ${MONTH_NAMES_GENITIVE[s.month - 1]} ${s.year} г. • ${s.timeStr} – ${e.timeStr} (Чита, UTC+9)`;
                  })()}
                </div>
              </div>

              {selectedEvent.description && (
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 leading-relaxed whitespace-pre-line">
                  <strong className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Повестка / Комментарий:</strong>
                  {selectedEvent.description}
                </div>
              )}

              <div className="border-t border-slate-100 pt-3 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400 font-medium">Организатор:</span>
                  <span className="font-bold text-slate-800">{selectedEvent.bookedBy.name}</span>
                </div>

                {selectedEvent.participants && selectedEvent.participants.length > 0 && (
                  <div className="space-y-1 pt-1">
                    <span className="text-slate-400 font-medium text-xs block">Приглашенные участники:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedEvent.participants.map(p => (
                        <span key={p.id} className="text-[11px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-lg font-semibold">
                          👤 {p.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Кнопка запуска аудиокомнаты */}
              {selectedEvent.type !== "BUSY" && (
                <button
                  onClick={() => {
                    setIsViewModalOpen(false);
                    joinEventRoom(selectedEvent);
                  }}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Mic className="h-4 w-4" /> Войти в аудиокомнату совещания
                </button>
              )}

              {/* Действия владельца / админа */}
              {(selectedEvent.bookedById === currentUserId || isAdmin) && (
                <div className="flex gap-2 pt-2 border-t border-slate-100">
                  <button
                    onClick={() => openEditModal(selectedEvent)}
                    className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Pencil className="h-3.5 w-3.5" /> Редактировать
                  </button>
                  <button
                    onClick={(e) => handleDelete(selectedEvent.id, selectedEvent.title, e)}
                    className="flex-1 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Отменить встречу
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ✍️ МОДАЛЬНОЕ ОКНО СОЗДАНИЯ И РЕДАКТИРОВАНИЯ ВСТРЕЧИ */}
      {/* ========================================================================= */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-200 bg-slate-50">
              <h3 className="text-lg font-bold text-slate-800">
                {editingEvent ? "Редактировать встречу" : "Запланировать встречу (Чита)"}
              </h3>
              <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4" autoComplete="off">
              {error && (
                <div className="rounded-xl bg-rose-50 p-3.5 text-xs text-rose-800 border border-rose-200 flex items-start gap-2.5">
                  <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <strong className="font-extrabold text-rose-950 block text-[10px] uppercase">Ошибка:</strong>
                    <p className="leading-tight">{error}</p>
                  </div>
                </div>
              )}

              {isAdmin && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Режим слота</label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setType("FREE")}
                      className={`px-2 py-2 rounded-xl border text-xs font-bold text-center cursor-pointer transition-all ${
                        type === "FREE"
                          ? "border-emerald-600 bg-emerald-50 text-emerald-700 shadow-xs"
                          : "border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      Встреча
                    </button>
                    <button
                      type="button"
                      onClick={() => setType("GC")}
                      className={`px-2 py-2 rounded-xl border text-xs font-bold text-center cursor-pointer transition-all ${
                        type === "GC"
                          ? "border-amber-600 bg-amber-50 text-amber-700 shadow-xs"
                          : "border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      Главный корпус
                    </button>
                    <button
                      type="button"
                      onClick={() => setType("BUSY")}
                      className={`px-2 py-2 rounded-xl border text-xs font-bold text-center cursor-pointer transition-all ${
                        type === "BUSY"
                          ? "border-rose-600 bg-rose-50 text-rose-700 shadow-xs"
                          : "border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      Занято
                    </button>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {type === "BUSY" ? "Причина блокировки времени" : "Тема встречи / Совещания *"}
                </label>
                <input
                  type="text"
                  required
                  placeholder={type === "BUSY" ? "Личные дела, выездное совещание" : "Обсуждение проекта, согласование сметы..."}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:border-blue-500 text-slate-800"
                  value={titleVal}
                  onChange={(e) => setTitleVal(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Дата встречи (Чита)</label>
                <input
                  type="date"
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:border-blue-500 text-slate-800 bg-white"
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                />
              </div>

              {/* Блок выбора времени и быстрого шага длительности */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2.5">
                <div className="grid grid-cols-2 gap-3">
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
                </div>

                {/* Кнопки быстрой длительности */}
                <div className="pt-1 flex flex-wrap items-center justify-between gap-1 text-[10px] font-bold">
                  <span className="text-slate-500">
                    Длительность: <strong className="text-blue-600">{durationMinutes} мин.</strong>
                  </span>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => setDuration(15)}
                      className="px-2 py-1 bg-white border border-slate-200 hover:bg-blue-50 hover:text-blue-700 rounded-md transition-colors cursor-pointer"
                    >
                      15м
                    </button>
                    <button
                      type="button"
                      onClick={() => setDuration(30)}
                      className="px-2 py-1 bg-white border border-slate-200 hover:bg-blue-50 hover:text-blue-700 rounded-md transition-colors cursor-pointer"
                    >
                      30м
                    </button>
                    <button
                      type="button"
                      onClick={() => setDuration(45)}
                      className="px-2 py-1 bg-white border border-slate-200 hover:bg-blue-50 hover:text-blue-700 rounded-md transition-colors cursor-pointer"
                    >
                      45м
                    </button>
                    <button
                      type="button"
                      onClick={() => setDuration(60)}
                      className="px-2 py-1 bg-white border border-slate-200 hover:bg-blue-50 hover:text-blue-700 rounded-md transition-colors cursor-pointer"
                    >
                      1ч
                    </button>
                    <button
                      type="button"
                      onClick={() => setDuration(90)}
                      className="px-2 py-1 bg-white border border-slate-200 hover:bg-blue-50 hover:text-blue-700 rounded-md transition-colors cursor-pointer"
                    >
                      1.5ч
                    </button>
                  </div>
                </div>
              </div>

              {/* Выбор участников */}
              {(type === "FREE" || type === "GC") && users.length > 0 && (
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                    <Users className="h-4 w-4 text-blue-500" /> Пригласить сотрудников на встречу
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
                          {u.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Повестка дня / Заметки</label>
                <textarea
                  rows={2}
                  placeholder="Добавьте краткие вопросы для обсуждения..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:outline-none focus:border-blue-500 text-slate-800"
                  value={descVal}
                  onChange={(e) => setDescVal(e.target.value)}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="flex-1 px-4 py-2.5 border border-slate-300 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm disabled:bg-blue-400 cursor-pointer"
                >
                  {isPending ? "Сохранение..." : editingEvent ? "Сохранить изменения" : "Запланировать"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Модальное окно аудиоконференции LiveKit */}
      <AudioConferenceModal
        isOpen={isAudioRoomOpen}
        onClose={() => setIsAudioRoomOpen(false)}
        roomName={currentRoomName}
        roomTitle={currentRoomTitle}
        calendarEventId={currentCalendarEventId}
        users={users}
        goals={goals}
        currentUserId={currentUserId}
        isAdmin={isAdmin}
      />
    </div>
  );
}