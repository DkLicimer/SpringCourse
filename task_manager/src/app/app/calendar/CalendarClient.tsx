// src/app/app/calendar/CalendarClient.tsx
"use client";

import React, { useState, useTransition, useMemo } from "react";
import { 
  createCalendarEvent, 
  updateCalendarEvent, 
  deleteCalendarEvent 
} from "@/server/actions/calendar";
import { 
  Plus, 
  Trash2, 
  Clock, 
  X, 
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Users,
  Calendar as CalendarIcon,
  Cake,
  Mic,
  ArrowRight,
  BookOpen,
  CalendarDays,
  ListTodo,
  FileText,
  Flame,
  Radio,
  Filter,
  CheckCircle2
} from "lucide-react";
import { useRouter } from "next/navigation";
import { AudioConferenceModal } from "@/components/AudioConferenceModal";
import Link from "next/link";

export type CalendarEvent = {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  type: "FREE" | "GC" | "BUSY";
  description: string | null;
  bookedById: string;
  bookedBy: { id: string; name: string; initials: string; email: string; role?: string };
  participants?: { id: string; name: string; initials: string }[];
  protocol?: { id: string; protocolNumber: string } | null;
};

export type BirthdayRecord = {
  id: string;
  fullName: string;
  birthDate: string;
  department: string;
  user?: { id?: string; role?: string } | null;
};

export type TaskDeadlineItem = {
  id: string;
  taskNumber?: number;
  title: string;
  deadline: string;
  isPriority?: boolean;
  goal: { title: string; color: string };
  assignments: {
    userId?: string;
    user: { id: string; name: string; initials: string };
    status: { id: string; name: string; color?: string | null };
  }[];
};

interface CalendarClientProps {
  initialEvents: CalendarEvent[];
  tasksWithDeadlines?: TaskDeadlineItem[];
  isAdmin: boolean;
  currentUserId: string;
  users?: { id: string; name: string; initials: string }[];
  birthdays?: BirthdayRecord[];
  goals?: { id: string; title: string; color: string }[];
}

const CHITA_TZ = "Asia/Chita";

export interface ChitaDateInfo {
  year: number;
  month: number;
  day: number;
  dayOfWeek: number;
  hour: number;
  minute: number;
  dateStr: string;
  timeStr: string;
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

export function createChitaIso(dateStr: string, hourStr: string, minuteStr: string): string {
  return `${dateStr}T${hourStr.padStart(2, "0")}:${minuteStr.padStart(2, "0")}:00+09:00`;
}

const MONTH_NAMES_NOMINATIVE = [
  "Январь", "Февраль", "Март", "Апрель", "Май", "Июнь",
  "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"
];

const WEEKDAY_NAMES = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

export function CalendarClient({
  initialEvents,
  tasksWithDeadlines = [],
  isAdmin,
  currentUserId,
  users = [],
  birthdays = [],
  goals = []
}: CalendarClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const todayChita = useMemo(() => getChitaDateInfo(new Date()), []);
  const todayStr = todayChita.dateStr;

  // Виды отображения: "MONTH" (Месяц), "WEEK" (Неделя), "LIST" (Список)
  const [viewMode, setViewMode] = useState<"MONTH" | "WEEK" | "LIST">("MONTH");

  // Текущий отображаемый месяц и год
  const [viewYear, setViewYear] = useState<number>(todayChita.year);
  const [viewMonth, setViewMonth] = useState<number>(todayChita.month);

  // Фильтр категорий (радио-кнопки): "ALL" | "BIRTHDAYS" | "MONITORING"
  const [categoryFilter, setCategoryFilter] = useState<"ALL" | "BIRTHDAYS" | "MONITORING">("ALL");

  // Чекбокс «Только мои встречи и поручения»
  const [onlyMyItems, setOnlyMyItems] = useState(false);

  // Модальное окно деталей дня
  const [selectedDayModal, setSelectedDayModal] = useState<{
    dateStr: string;
    dayFormatted: string;
    events: CalendarEvent[];
    tasks: TaskDeadlineItem[];
    birthdays: BirthdayRecord[];
  } | null>(null);

  // Модальные окна встреч и аудиокомнаты
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [isAudioRoomOpen, setIsAudioRoomOpen] = useState(false);
  const [currentRoomName, setCurrentRoomName] = useState("general-team-room");
  const [currentRoomTitle, setCurrentRoomTitle] = useState("Общая планерка команды");
  const [currentCalendarEventId, setCurrentCalendarEventId] = useState<string | undefined>(undefined);

  // Поля формы встречи
  const [type, setType] = useState<"FREE" | "GC" | "BUSY">("FREE");
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);
  const [formDate, setFormDate] = useState(todayStr);
  const [startHour, setStartHour] = useState("10");
  const [startMinute, setStartMinute] = useState("00");
  const [endHour, setEndHour] = useState("11");
  const [endMinute, setEndMinute] = useState("00");
  const [titleVal, setTitleVal] = useState("");
  const [descVal, setDescVal] = useState("");

  // Возврат к сегодняшней дате
  const handleGoToToday = () => {
    setViewYear(todayChita.year);
    setViewMonth(todayChita.month);
  };

  // Навигация по месяцам
  const handlePrevMonth = () => {
    if (viewMonth === 1) {
      setViewMonth(12);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 12) {
      setViewMonth(1);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  // Фильтрация событий с учетом чекбокса "Только мои"
  const filteredEvents = useMemo(() => {
    return initialEvents.filter((ev) => {
      if (!onlyMyItems) return true;
      const isBooker = ev.bookedById === currentUserId;
      const isParticipant = ev.participants?.some((p) => p.id === currentUserId);
      return isBooker || isParticipant;
    });
  }, [initialEvents, onlyMyItems, currentUserId]);

  // Фильтрация задач с учетом чекбокса "Только мои"
  const filteredTasks = useMemo(() => {
    return tasksWithDeadlines.filter((t) => {
      if (!onlyMyItems) return true;
      return t.assignments?.some((as) => as.user?.id === currentUserId || as.userId === currentUserId);
    });
  }, [tasksWithDeadlines, onlyMyItems, currentUserId]);

  // Баннер-напоминание о предстоящей встрече (в пределах 45 минут)
  const upcomingEventNow = useMemo(() => {
    const now = new Date();
    const fortyFiveMinsLater = new Date(now.getTime() + 45 * 60 * 1000);

    return filteredEvents.find((ev) => {
      const start = new Date(ev.startTime);
      const end = new Date(ev.endTime);
      return (
        ev.type !== "BUSY" &&
        ((start >= now && start <= fortyFiveMinsLater) || (now >= start && now <= end))
      );
    });
  }, [filteredEvents]);

  // Карта событий по дням для цветных индикаторов в сетке месяца
  const daysWithDataMap = useMemo(() => {
    const map = new Map<string, { events: CalendarEvent[]; tasks: TaskDeadlineItem[]; birthdays: BirthdayRecord[] }>();

    // 1. События
    if (categoryFilter === "ALL" || categoryFilter === "MONITORING") {
      filteredEvents.forEach((ev) => {
        const dStr = getChitaDateInfo(ev.startTime).dateStr;
        const cur = map.get(dStr) || { events: [], tasks: [], birthdays: [] };
        cur.events.push(ev);
        map.set(dStr, cur);
      });

      // Задачи
      filteredTasks.forEach((task) => {
        if (!task.deadline) return;
        const dStr = getChitaDateInfo(task.deadline).dateStr;
        const cur = map.get(dStr) || { events: [], tasks: [], birthdays: [] };
        cur.tasks.push(task);
        map.set(dStr, cur);
      });
    }

    // 2. Дни рождения
    if (categoryFilter === "ALL" || categoryFilter === "BIRTHDAYS") {
      birthdays.forEach((b) => {
        if (!b.birthDate) return;
        const bInfo = getChitaDateInfo(b.birthDate);
        if (bInfo.month === viewMonth) {
          const dStr = `${viewYear}-${String(viewMonth).padStart(2, "0")}-${String(bInfo.day).padStart(2, "0")}`;
          const cur = map.get(dStr) || { events: [], tasks: [], birthdays: [] };
          cur.birthdays.push(b);
          map.set(dStr, cur);
        }
      });
    }

    return map;
  }, [filteredEvents, filteredTasks, birthdays, viewYear, viewMonth, categoryFilter]);

  // Клик по числу месяца -> открыть модальное окно деталей дня
  const handleDayClick = (dayNumber: number) => {
    const pad = (n: number) => String(n).padStart(2, "0");
    const dStr = `${viewYear}-${pad(viewMonth)}-${pad(dayNumber)}`;
    const dayFormatted = `${pad(dayNumber)}.${pad(viewMonth)}.${viewYear}`;

    const dayData = daysWithDataMap.get(dStr) || { events: [], tasks: [], birthdays: [] };

    setSelectedDayModal({
      dateStr: dStr,
      dayFormatted,
      events: dayData.events,
      tasks: dayData.tasks,
      birthdays: dayData.birthdays,
    });
  };

  const openCreateModal = (datePrefill?: string) => {
    setError(null);
    setEditingEvent(null);
    setType("FREE");
    setSelectedParticipants([]);
    setFormDate(datePrefill || todayStr);
    setStartHour("10");
    setStartMinute("00");
    setEndHour("11");
    setEndMinute("00");
    setTitleVal("");
    setDescVal("");
    setIsEditModalOpen(true);
  };

  const joinGeneralTeamRoom = () => {
    setCurrentRoomName("general-team-room");
    setCurrentRoomTitle("Общая планерка команды");
    setCurrentCalendarEventId(undefined);
    setIsAudioRoomOpen(true);
  };

  const joinEventRoom = (event: CalendarEvent) => {
    setCurrentRoomName(`event-${event.id}`);
    setCurrentRoomTitle(`Совещание: ${event.title}`);
    setCurrentCalendarEventId(event.id);
    setIsAudioRoomOpen(true);
  };

  const handleSubmitEvent = async (e: React.FormEvent<HTMLFormElement>) => {
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
        setError(err.message || "Ошибка сохранения встречи");
      }
    });
  };

  const handleDeleteEvent = async (id: string, title: string) => {
    if (!window.confirm(`Отменить встречу «${title}»?`)) return;

    startTransition(async () => {
      try {
        await deleteCalendarEvent(id);
        if (selectedDayModal) {
          setSelectedDayModal((prev) => prev ? {
            ...prev,
            events: prev.events.filter((e) => e.id !== id),
          } : null);
        }
        router.refresh();
      } catch (err: any) {
        alert(err.message || "Ошибка отмены встречи");
      }
    });
  };

  // Построение сетки текущего месяца (Пн..Вс)
  const calendarCells = useMemo(() => {
    const firstDayDate = new Date(`${viewYear}-${String(viewMonth).padStart(2, "0")}-01T12:00:00+09:00`);
    const dayOfWeek = firstDayDate.getDay();
    const leadingEmpty = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const daysInMonth = new Date(viewYear, viewMonth, 0).getDate();
    return { leadingEmpty, daysInMonth };
  }, [viewYear, viewMonth]);

  // Дни текущей недели для недельного таймлайна (Пн..Вс)
  const currentWeekDays = useMemo(() => {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(today.setDate(diff));

    return Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const info = getChitaDateInfo(d);
      return {
        dateStr: info.dateStr,
        dayNumber: info.day,
        weekday: WEEKDAY_NAMES[i],
        formatted: `${String(info.day).padStart(2, "0")}.${String(info.month).padStart(2, "0")}`,
        isToday: info.dateStr === todayStr,
      };
    });
  }, [todayStr]);

  // Список ближайших событий для режима "LIST"
  const upcomingListItems = useMemo(() => {
    const list: {
      id: string;
      dateStr: string;
      timeStr?: string;
      title: string;
      category: "EVENT" | "TASK" | "BIRTHDAY";
      badgeText: string;
      badgeColor: string;
      rawObj: any;
    }[] = [];

    filteredEvents.forEach((ev) => {
      const info = getChitaDateInfo(ev.startTime);
      list.push({
        id: `ev-${ev.id}`,
        dateStr: info.dateStr,
        timeStr: info.timeStr,
        title: ev.title,
        category: "EVENT",
        badgeText: ev.type === "BUSY" ? "Занято" : ev.type === "GC" ? "Главный корпус" : "Совещание",
        badgeColor: ev.type === "BUSY" ? "#e11d48" : ev.type === "GC" ? "#d97706" : "#2563eb",
        rawObj: ev,
      });
    });

    filteredTasks.forEach((task) => {
      if (!task.deadline) return;
      const info = getChitaDateInfo(task.deadline);
      list.push({
        id: `task-${task.id}`,
        dateStr: info.dateStr,
        timeStr: "Дедлайн",
        title: task.title,
        category: "TASK",
        badgeText: task.taskNumber ? `№ ${task.taskNumber}` : "Поручение",
        badgeColor: task.goal.color || "#0284c7",
        rawObj: task,
      });
    });

    birthdays.forEach((b) => {
      if (!b.birthDate) return;
      const bInfo = getChitaDateInfo(b.birthDate);
      const dStr = `${todayChita.year}-${String(bInfo.month).padStart(2, "0")}-${String(bInfo.day).padStart(2, "0")}`;
      list.push({
        id: `bday-${b.id}`,
        dateStr: dStr,
        timeStr: "Праздник",
        title: `День рождения: ${b.fullName}`,
        category: "BIRTHDAY",
        badgeText: b.department || "Штат",
        badgeColor: "#db2777",
        rawObj: b,
      });
    });

    return list
      .filter((item) => item.dateStr >= todayStr)
      .sort((a, b) => a.dateStr.localeCompare(b.dateStr))
      .slice(0, 15);
  }, [filteredEvents, filteredTasks, birthdays, todayStr, todayChita.year]);

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      {/* ⚡ ПЛАВАЮЩИЙ БАННЕР ПРЕДСТОЯЩЕЙ ВСТРЕЧИ */}
      {upcomingEventNow && (
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white rounded-2xl p-4 shadow-md flex items-center justify-between gap-4 animate-slide-up border border-blue-400/40">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/20 rounded-xl backdrop-blur-xs shrink-0">
              <Radio className="h-5 w-5 text-white animate-pulse" />
            </div>
            <div>
              <div className="text-[10px] font-extrabold uppercase tracking-wider text-blue-200 flex items-center gap-1.5">
                <span>Скоро начнется онлайн-встреча</span>
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
              </div>
              <h4 className="font-extrabold text-sm text-white line-clamp-1">{upcomingEventNow.title}</h4>
              <p className="text-[11px] text-blue-100 flex items-center gap-1 mt-0.5">
                <Clock className="h-3 w-3" />
                Чита: {getChitaDateInfo(upcomingEventNow.startTime).timeStr} – {getChitaDateInfo(upcomingEventNow.endTime).timeStr}
              </p>
            </div>
          </div>

          <button
            onClick={() => joinEventRoom(upcomingEventNow)}
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-black transition-all shadow-sm flex items-center gap-1.5 shrink-0 cursor-pointer hover:scale-105 active:scale-95"
          >
            <Mic className="h-4 w-4" />
            <span>Войти</span>
          </button>
        </div>
      )}

      {/* Верхняя панель управления */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Пояс:</span>
          <span className="px-2.5 py-1 bg-blue-50 text-blue-700 font-extrabold rounded-lg text-xs border border-blue-200 flex items-center gap-1">
            <Clock className="h-3 w-3" /> Чита (UTC+9)
          </span>

          {/* Переключатель вида */}
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold ml-1">
            <button
              onClick={() => setViewMode("MONTH")}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                viewMode === "MONTH" ? "bg-white text-blue-600 shadow-xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <CalendarIcon className="h-3.5 w-3.5" />
              <span>Месяц</span>
            </button>
            <button
              onClick={() => setViewMode("WEEK")}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                viewMode === "WEEK" ? "bg-white text-blue-600 shadow-xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <CalendarDays className="h-3.5 w-3.5" />
              <span>Неделя</span>
            </button>
            <button
              onClick={() => setViewMode("LIST")}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                viewMode === "LIST" ? "bg-white text-blue-600 shadow-xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <ListTodo className="h-3.5 w-3.5" />
              <span>Список</span>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Чекбокс «Только мои» */}
          <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={onlyMyItems}
              onChange={(e) => setOnlyMyItems(e.target.checked)}
              className="h-3.5 w-3.5 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
            />
            <Filter className="h-3.5 w-3.5 text-slate-400" />
            <span>Только мои</span>
          </label>

          <button
            onClick={joinGeneralTeamRoom}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            <Mic className="h-3.5 w-3.5" />
            <span>Планерка</span>
          </button>

          <button
            onClick={() => openCreateModal()}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Встреча</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 📅 РЕЖИМ 1: МЕСЯЦ (В СТИЛЕ СКРИНШОТА 1 С МАРКЕРАМИ) */}
      {/* ========================================================================= */}
      {viewMode === "MONTH" && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden max-w-xl mx-auto">
          {/* Синяя шапка */}
          <div className="bg-[#2d5fb9] text-white px-5 py-3.5 flex items-center justify-between">
            <h2 className="text-base font-bold tracking-wide">Календарь</h2>
            <CalendarIcon className="h-5 w-5 opacity-90" />
          </div>

          <div className="p-5 space-y-4">
            {/* Навигация с кнопкой «Сегодня» */}
            <div className="flex items-center justify-between px-2">
              <button
                onClick={handlePrevMonth}
                className="p-1.5 text-slate-700 hover:text-black hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                title="Предыдущий месяц"
              >
                <ChevronLeft className="h-5 w-5 stroke-[2.5]" />
              </button>

              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-800 text-sm tracking-wide">
                  {MONTH_NAMES_NOMINATIVE[viewMonth - 1]} {viewYear}
                </span>
                {(viewMonth !== todayChita.month || viewYear !== todayChita.year) && (
                  <button
                    onClick={handleGoToToday}
                    className="px-2 py-0.5 bg-blue-50 text-blue-700 hover:bg-blue-100 text-[10px] font-extrabold rounded-md border border-blue-200 transition-colors cursor-pointer"
                  >
                    Сегодня
                  </button>
                )}
              </div>

              <button
                onClick={handleNextMonth}
                className="p-1.5 text-slate-700 hover:text-black hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                title="Следующий месяц"
              >
                <ChevronRight className="h-5 w-5 stroke-[2.5]" />
              </button>
            </div>

            {/* Дни недели */}
            <div className="grid grid-cols-7 text-center text-xs font-bold text-slate-700 border-b border-slate-200 pb-2">
              {WEEKDAY_NAMES.map((wd) => (
                <div key={wd}>{wd}</div>
              ))}
            </div>

            {/* Сетка чисел месяца */}
            <div className="grid grid-cols-7 gap-y-2.5 text-center text-xs">
              {/* Пустые ячейки смещения */}
              {Array.from({ length: calendarCells.leadingEmpty }).map((_, i) => (
                <div key={`empty-${i}`} className="h-10 w-10 mx-auto" />
              ))}

              {/* Дни месяца */}
              {Array.from({ length: calendarCells.daysInMonth }, (_, i) => i + 1).map((dayNum) => {
                const pad = (n: number) => String(n).padStart(2, "0");
                const dStr = `${viewYear}-${pad(viewMonth)}-${pad(dayNum)}`;
                const dayData = daysWithDataMap.get(dStr);
                const isToday = dStr === todayStr;

                const hasBirthdays = dayData && dayData.birthdays.length > 0;
                const hasEvents = dayData && dayData.events.length > 0;
                const hasTasks = dayData && dayData.tasks.length > 0;
                const hasItems = hasBirthdays || hasEvents || hasTasks;

                return (
                  <div key={dayNum} className="flex flex-col items-center justify-center">
                    <button
                      onClick={() => handleDayClick(dayNum)}
                      className={`h-8 w-8 rounded-full flex items-center justify-center font-semibold transition-all cursor-pointer select-none text-xs relative ${
                        hasItems
                          ? "bg-[#2ca953] text-white font-black shadow-xs hover:scale-110 ring-2 ring-emerald-300/40"
                          : "text-slate-700 hover:bg-slate-100"
                      } ${isToday ? "ring-2 ring-blue-600 ring-offset-2 font-black" : ""}`}
                      title={hasItems ? `События на ${dayNum}.${viewMonth}.${viewYear}` : `День ${dayNum}`}
                    >
                      {dayNum}
                    </button>

                    {/* ⚡ ЦВЕТНЫЕ МИНИ-ИНДИКАТОРЫ ПОД ЧИСЛОМ */}
                    <div className="flex items-center gap-0.5 mt-0.5 h-1.5">
                      {hasBirthdays && (
                        <span className="h-1 w-1 rounded-full bg-pink-500" title="День рождения" />
                      )}
                      {hasEvents && (
                        <span className="h-1 w-1 rounded-full bg-blue-500" title="Встреча / Совещание" />
                      )}
                      {hasTasks && (
                        <span className="h-1 w-1 rounded-full bg-amber-500" title="Дедлайн поручения" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 🔘 БЛОК ФИЛЬТРОВ ИЗ СКРИНШОТА 1 */}
            <div className="pt-4 border-t border-slate-200 space-y-2 text-xs font-medium text-slate-800">
              <label className="flex items-center gap-2 cursor-pointer select-none hover:text-blue-700">
                <input
                  type="radio"
                  name="categoryFilter"
                  checked={categoryFilter === "ALL"}
                  onChange={() => setCategoryFilter("ALL")}
                  className="h-4 w-4 text-[#2d5fb9] border-slate-300 focus:ring-[#2d5fb9] cursor-pointer"
                />
                <span>Выбрать всё</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer select-none hover:text-blue-700">
                <input
                  type="radio"
                  name="categoryFilter"
                  checked={categoryFilter === "BIRTHDAYS"}
                  onChange={() => setCategoryFilter("BIRTHDAYS")}
                  className="h-4 w-4 text-[#2d5fb9] border-slate-300 focus:ring-[#2d5fb9] cursor-pointer"
                />
                <span>День рождения руководителя / сотрудников</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer select-none hover:text-blue-700">
                <input
                  type="radio"
                  name="categoryFilter"
                  checked={categoryFilter === "MONITORING"}
                  onChange={() => setCategoryFilter("MONITORING")}
                  className="h-4 w-4 text-[#2d5fb9] border-slate-300 focus:ring-[#2d5fb9] cursor-pointer"
                />
                <span>Мониторинги / Встречи</span>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ⏱️ РЕЖИМ 2: НЕДЕЛЬНЫЙ ТАЙМЛАЙН ПО ЧАСАМ */}
      {/* ========================================================================= */}
      {viewMode === "WEEK" && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden p-5 space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-1.5">
              <CalendarDays className="h-4 w-4 text-blue-600" />
              <span>Расписание текущей недели (Чита, UTC+9)</span>
            </h3>
            <span className="text-xs text-slate-400 font-bold">08:00 – 20:00</span>
          </div>

          <div className="grid grid-cols-7 gap-2">
            {currentWeekDays.map((day) => {
              const dayEvents = filteredEvents.filter((ev) => getChitaDateInfo(ev.startTime).dateStr === day.dateStr);
              const dayTasks = filteredTasks.filter((t) => t.deadline && getChitaDateInfo(t.deadline).dateStr === day.dateStr);
              const dayBirthdays = birthdays.filter((b) => {
                const bInfo = getChitaDateInfo(b.birthDate);
                const bDateStr = `${todayChita.year}-${String(bInfo.month).padStart(2, "0")}-${String(bInfo.day).padStart(2, "0")}`;
                return bDateStr === day.dateStr;
              });

              return (
                <div
                  key={day.dateStr}
                  onClick={() => {
                    setSelectedDayModal({
                      dateStr: day.dateStr,
                      dayFormatted: `${String(day.dayNumber).padStart(2, "0")}.${day.formatted.split(".")[1]}.${viewYear}`,
                      events: dayEvents,
                      tasks: dayTasks,
                      birthdays: dayBirthdays,
                    });
                  }}
                  className={`flex flex-col rounded-2xl border p-2.5 min-h-[300px] cursor-pointer transition-all hover:shadow-md ${
                    day.isToday ? "bg-blue-50/40 border-blue-300 ring-2 ring-blue-500/20" : "bg-slate-50/50 border-slate-200 hover:bg-white"
                  }`}
                >
                  <div className="text-center border-b pb-1.5 mb-2">
                    <span className="text-[10px] font-black uppercase text-slate-400 block">{day.weekday}</span>
                    <span className={`text-xs font-black rounded-full px-2 py-0.5 inline-block ${day.isToday ? "bg-blue-600 text-white" : "text-slate-800"}`}>
                      {day.formatted}
                    </span>
                  </div>

                  <div className="space-y-1.5 flex-1 overflow-y-auto">
                    {dayBirthdays.map((b) => (
                      <div key={b.id} className="p-1.5 rounded-lg bg-pink-100 text-pink-900 text-[10px] font-bold truncate flex items-center gap-1" title={b.fullName}>
                        <Cake className="h-3 w-3 text-pink-600 shrink-0" />
                        <span className="truncate">{b.fullName.split(" ")[0]}</span>
                      </div>
                    ))}

                    {dayEvents.map((ev) => {
                      const s = getChitaDateInfo(ev.startTime);
                      return (
                        <div
                          key={ev.id}
                          className={`p-1.5 rounded-lg text-[10px] font-bold border truncate ${
                            ev.type === "BUSY"
                              ? "bg-rose-50 border-rose-200 text-rose-800"
                              : ev.type === "GC"
                              ? "bg-amber-50 border-amber-200 text-amber-800"
                              : "bg-blue-50 border-blue-200 text-blue-800"
                          }`}
                          title={`${s.timeStr}: ${ev.title}`}
                        >
                          <span className="block text-[9px] font-extrabold opacity-75">{s.timeStr}</span>
                          <span className="truncate block">{ev.title}</span>
                        </div>
                      );
                    })}

                    {dayTasks.map((t) => (
                      <div key={t.id} className="p-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] font-bold truncate" title={t.title}>
                        <span className="block text-[9px] text-emerald-600">Срок</span>
                        <span className="truncate block">{t.title}</span>
                      </div>
                    ))}

                    {dayEvents.length === 0 && dayTasks.length === 0 && dayBirthdays.length === 0 && (
                      <span className="text-[10px] text-slate-300 italic block text-center pt-8">Свободно</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 📋 РЕЖИМ 3: СПИСОК БЛИЖАЙШИХ СОБЫТИЙ */}
      {/* ========================================================================= */}
      {viewMode === "LIST" && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 space-y-3">
          <div className="flex items-center justify-between border-b pb-3">
            <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-1.5">
              <ListTodo className="h-4 w-4 text-blue-600" />
              <span>Ближайшие дела и мероприятия (Чита)</span>
            </h3>
            <span className="text-xs text-slate-400 font-bold">{upcomingListItems.length} событий</span>
          </div>

          <div className="divide-y divide-slate-100">
            {upcomingListItems.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 italic">
                Впереди пока нет запланированных событий
              </div>
            ) : (
              upcomingListItems.map((item) => (
                <div key={item.id} className="py-3 flex items-center justify-between gap-3 text-xs hover:bg-slate-50/60 px-2 rounded-xl transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="text-center font-bold min-w-[70px]">
                      <span className="text-[10px] text-slate-400 block">{item.timeStr}</span>
                      <span className="text-slate-800 text-xs">{item.dateStr.split("-").reverse().slice(0, 2).join(".")}</span>
                    </div>

                    <div className="space-y-0.5">
                      <div className="font-bold text-slate-900 text-xs sm:text-sm">{item.title}</div>
                      <span
                        className="px-2 py-0.5 rounded text-[9px] font-black text-white inline-block"
                        style={{ backgroundColor: item.badgeColor }}
                      >
                        {item.badgeText}
                      </span>
                    </div>
                  </div>

                  <div>
                    {item.category === "EVENT" && item.rawObj.type !== "BUSY" && (
                      <button
                        onClick={() => joinEventRoom(item.rawObj)}
                        className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg font-bold flex items-center gap-1 cursor-pointer"
                        title="Подключиться к аудиокомнате"
                      >
                        <Mic className="h-3.5 w-3.5 text-emerald-600" />
                        <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    )}
                    {item.category === "TASK" && (
                      <button
                        onClick={() => router.push(`/app/tasks?taskId=${item.rawObj.id}`)}
                        className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold cursor-pointer"
                        title="Открыть задачу"
                      >
                        <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 📋 МОДАЛЬНОЕ ОКНО ДЕТАЛЕЙ ДНЯ (В ТОЧНОСТИ ПО ВАШИМ СКРИНШОТАМ) */}
      {/* ========================================================================= */}
      {selectedDayModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[88vh]">
            {/* Заголовок со скриншота */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-900 font-black text-base sm:text-lg">
                <CalendarIcon className="h-5 w-5 text-slate-700" />
                <span>Календарь {selectedDayModal.dayFormatted}</span>
              </div>
              <button
                onClick={() => setSelectedDayModal(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Список карточек на выбранный день */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {selectedDayModal.events.length === 0 && 
               selectedDayModal.tasks.length === 0 && 
               selectedDayModal.birthdays.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400 italic">
                  На этот день событий и задач не запланировано.
                </div>
              ) : null}

              {/* 1. Дни рождения */}
              {selectedDayModal.birthdays.map((b) => (
                <div
                  key={b.id}
                  className="space-y-1.5 p-3 rounded-2xl bg-pink-50/60 border border-pink-200"
                >
                  <div className="flex items-center gap-2 font-bold text-slate-900 text-xs sm:text-sm">
                    <Cake className="h-4 w-4 text-pink-600 shrink-0" />
                    <span>День рождения: {b.fullName}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold">
                    <span className="bg-[#1b75bb] text-white px-2.5 py-0.5 rounded">
                      {b.department || "Штат"}
                    </span>
                    <span className="bg-[#3aa3d8] text-white px-2.5 py-0.5 rounded">
                      {selectedDayModal.dayFormatted}
                    </span>
                    <span className="bg-[#2ca953] text-white px-2.5 py-0.5 rounded font-black">
                      Праздник 🎉
                    </span>
                  </div>
                </div>
              ))}

              {/* 2. Задачи / Мониторинги */}
              {selectedDayModal.tasks.map((task) => {
                const assignee = task.assignments[0]?.user;
                const statusName = task.assignments[0]?.status?.name || "В очереди";
                const isDone = statusName === "Исполнено";

                return (
                  <div key={task.id} className="space-y-2 pb-3 border-b border-slate-100 last:border-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2 font-bold text-slate-900 text-xs sm:text-sm leading-snug">
                        <BookOpen className="h-4 w-4 text-slate-800 shrink-0 mt-0.5" />
                        <div>
                          <span>{task.title}</span>
                          {assignee && (
                            <span className="text-[11px] text-slate-400 font-normal block mt-0.5">
                              👤 Ответственный: <strong className="text-slate-700">{assignee.name}</strong>
                            </span>
                          )}
                        </div>
                      </div>

                      {task.isPriority && (
                        <span className="text-[9px] bg-red-100 text-red-700 border border-red-200 px-2 py-0.5 rounded-full font-bold uppercase flex items-center gap-0.5">
                          <Flame className="h-3 w-3 text-red-600" /> Срочно
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-bold">
                      <span className="bg-[#1b75bb] text-white px-2.5 py-0.5 rounded shadow-2xs">
                        {task.taskNumber ? `Поручение № ${task.taskNumber}` : `Задача № ${task.id.slice(0, 4)}`}
                      </span>

                      <span className="bg-[#3aa3d8] text-white px-2.5 py-0.5 rounded shadow-2xs">
                        {selectedDayModal.dayFormatted}
                      </span>

                      <span className={`px-2.5 py-0.5 rounded shadow-2xs text-white ${isDone ? "bg-[#2ca953]" : "bg-blue-600"}`}>
                        {statusName}
                      </span>

                      <button
                        onClick={() => router.push(`/app/tasks?taskId=${task.id}`)}
                        className="text-[#1b75bb] hover:text-[#0b4e82] p-0.5 cursor-pointer ml-1 flex items-center gap-0.5"
                        title="Перейти к задаче"
                      >
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              })}

              {/* 3. События календаря */}
              {selectedDayModal.events.map((ev) => {
                const s = getChitaDateInfo(ev.startTime);
                const e = getChitaDateInfo(ev.endTime);

                return (
                  <div key={ev.id} className="space-y-2 pb-3 border-b border-slate-100 last:border-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2 font-bold text-slate-900 text-xs sm:text-sm leading-snug">
                        <BookOpen className="h-4 w-4 text-slate-800 shrink-0 mt-0.5" />
                        <div>
                          <span>{ev.title}</span>
                          {ev.description && (
                            <p className="text-[11px] text-slate-500 font-normal mt-0.5">{ev.description}</p>
                          )}
                          <div className="text-[10px] text-slate-400 font-medium mt-0.5">
                            Организатор: {ev.bookedBy.name}
                          </div>
                        </div>
                      </div>

                      {(ev.bookedById === currentUserId || isAdmin) && (
                        <button
                          onClick={() => handleDeleteEvent(ev.id, ev.title)}
                          className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                          title="Отменить"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-bold">
                      <span className="bg-[#1b75bb] text-white px-2.5 py-0.5 rounded shadow-2xs">
                        {ev.type === "BUSY" ? "Занято" : ev.type === "GC" ? "Главный корпус" : `Встреча (${s.timeStr} – ${e.timeStr})`}
                      </span>

                      <span className="bg-[#3aa3d8] text-white px-2.5 py-0.5 rounded shadow-2xs">
                        {selectedDayModal.dayFormatted}
                      </span>

                      <span className="bg-[#2ca953] text-white px-2.5 py-0.5 rounded shadow-2xs">
                        Запланировано
                      </span>

                      {/* Связка с протоколом */}
                      {ev.protocol && (
                        <Link
                          href={`/app/protocols/${ev.protocol.id}`}
                          className="bg-indigo-600 text-white px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 hover:bg-indigo-700"
                        >
                          <FileText className="h-3 w-3" />
                          <span>Протокол № {ev.protocol.protocolNumber}</span>
                        </Link>
                      )}

                      {ev.type !== "BUSY" && (
                        <button
                          onClick={() => joinEventRoom(ev)}
                          className="text-[#1b75bb] hover:text-[#0b4e82] p-0.5 cursor-pointer ml-1 flex items-center gap-0.5"
                          title="Войти в аудиокомнату"
                        >
                          <Mic className="h-3.5 w-3.5 text-emerald-600" />
                          <ArrowRight className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Кнопки в подвале модалки дня */}
            <div className="px-6 py-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
              {/* ⚡ КНОПКА «+ НАЗНАЧИТЬ ВСТРЕЧУ НА ЭТОТ ДЕНЬ» */}
              <button
                onClick={() => {
                  const targetDate = selectedDayModal.dateStr;
                  setSelectedDayModal(null);
                  openCreateModal(targetDate);
                }}
                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Запланировать на этот день</span>
              </button>

              <button
                onClick={() => setSelectedDayModal(null)}
                className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-black uppercase tracking-wider transition-colors cursor-pointer"
              >
                ЗАКРЫТЬ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* МОДАЛЬНОЕ ОКНО СОЗДАНИЯ / РЕДАКТИРОВАНИЯ ВСТРЕЧИ */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-200 bg-slate-50">
              <h3 className="text-base font-bold text-slate-800">
                {editingEvent ? "Редактировать встречу" : "Запланировать встречу (Чита)"}
              </h3>
              <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitEvent} className="p-6 space-y-4" autoComplete="off">
              {error && (
                <div className="rounded-xl bg-rose-50 p-3 text-xs text-rose-800 border border-rose-200 flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{error}</span>
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
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-blue-500 text-slate-800"
                  value={titleVal}
                  onChange={(e) => setTitleVal(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Дата встречи (Чита)</label>
                <input
                  type="date"
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-blue-500 text-slate-800 bg-white"
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-200">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Время начала</label>
                  <div className="flex gap-1">
                    <input
                      type="number"
                      min="0"
                      max="23"
                      value={startHour}
                      onChange={(e) => setStartHour(e.target.value)}
                      className="w-1/2 p-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-center"
                    />
                    <input
                      type="number"
                      min="0"
                      max="59"
                      step="15"
                      value={startMinute}
                      onChange={(e) => setStartMinute(e.target.value)}
                      className="w-1/2 p-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-center"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Время окончания</label>
                  <div className="flex gap-1">
                    <input
                      type="number"
                      min="0"
                      max="23"
                      value={endHour}
                      onChange={(e) => setEndHour(e.target.value)}
                      className="w-1/2 p-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-center"
                    />
                    <input
                      type="number"
                      min="0"
                      max="59"
                      step="15"
                      value={endMinute}
                      onChange={(e) => setEndMinute(e.target.value)}
                      className="w-1/2 p-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-center"
                    />
                  </div>
                </div>
              </div>

              {/* Выбор участников */}
              {type !== "BUSY" && users.length > 0 && (
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">Пригласить участников</label>
                  <div className="max-h-28 overflow-y-auto border border-slate-200 rounded-xl p-2 bg-slate-50 space-y-1">
                    {users.map((u) => {
                      const isChecked = selectedParticipants.includes(u.id);
                      return (
                        <label key={u.id} className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer p-1 rounded-md hover:bg-white">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {
                              setSelectedParticipants((prev) =>
                                isChecked ? prev.filter((id) => id !== u.id) : [...prev, u.id]
                              );
                            }}
                            className="h-3.5 w-3.5 text-blue-600 rounded border-slate-300"
                          />
                          <span>{u.name}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Повестка / Заметки</label>
                <textarea
                  rows={2}
                  placeholder="Вопросы для обсуждения..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:outline-none focus:border-blue-500 text-slate-800"
                  value={descVal}
                  onChange={(e) => setDescVal(e.target.value)}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
                >
                  {isPending ? "Сохранение..." : "Сохранить"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Аудиокомната LiveKit */}
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