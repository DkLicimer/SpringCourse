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
  ArrowRight,
  BookOpen,
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
  bookedBy: { id: string; name: string; initials: string; email: string; role?: string };
  participants?: { id: string; name: string; initials: string }[];
};

export type BirthdayRecord = {
  id: string;
  fullName: string;
  birthDate: string;
  department: string;
  user?: { role?: string } | null;
};

export type TaskDeadlineItem = {
  id: string;
  taskNumber?: number;
  title: string;
  deadline: string;
  goal: { title: string; color: string };
  assignments: {
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

  // Текущий отображаемый месяц и год
  const [viewYear, setViewYear] = useState<number>(todayChita.year);
  const [viewMonth, setViewMonth] = useState<number>(todayChita.month);

  // Фильтр радио-кнопок из Скриншота 1: "ALL" | "BIRTHDAYS" | "MONITORING"
  const [categoryFilter, setCategoryFilter] = useState<"ALL" | "BIRTHDAYS" | "MONITORING">("ALL");

  // Модальное окно деталей дня (Скриншот 2)
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

  // Проверка наличия событий в конкретный день (для зелёного кружка)
  const daysWithDataMap = useMemo(() => {
    const map = new Map<string, { eventsCount: number; tasksCount: number; birthdaysCount: number }>();

    // 1. События
    if (categoryFilter === "ALL" || categoryFilter === "MONITORING") {
      initialEvents.forEach((ev) => {
        const dStr = getChitaDateInfo(ev.startTime).dateStr;
        const cur = map.get(dStr) || { eventsCount: 0, tasksCount: 0, birthdaysCount: 0 };
        cur.eventsCount++;
        map.set(dStr, cur);
      });

      // Задачи/Мониторинги
      tasksWithDeadlines.forEach((task) => {
        if (!task.deadline) return;
        const dStr = getChitaDateInfo(task.deadline).dateStr;
        const cur = map.get(dStr) || { eventsCount: 0, tasksCount: 0, birthdaysCount: 0 };
        cur.tasksCount++;
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
          const cur = map.get(dStr) || { eventsCount: 0, tasksCount: 0, birthdaysCount: 0 };
          cur.birthdaysCount++;
          map.set(dStr, cur);
        }
      });
    }

    return map;
  }, [initialEvents, tasksWithDeadlines, birthdays, viewYear, viewMonth, categoryFilter]);

  // Клик по числу месяца -> открыть модальное окно деталей дня (Скриншот 2)
  const handleDayClick = (dayNumber: number) => {
    const pad = (n: number) => String(n).padStart(2, "0");
    const dStr = `${viewYear}-${pad(viewMonth)}-${pad(dayNumber)}`;
    const dayFormatted = `${pad(dayNumber)}.${pad(viewMonth)}.${viewYear}`;

    const dayEvents = initialEvents.filter((ev) => getChitaDateInfo(ev.startTime).dateStr === dStr);
    const dayTasks = tasksWithDeadlines.filter((t) => t.deadline && getChitaDateInfo(t.deadline).dateStr === dStr);
    const dayBirthdays = birthdays.filter((b) => {
      const bInfo = getChitaDateInfo(b.birthDate);
      return bInfo.day === dayNumber && bInfo.month === viewMonth;
    });

    setSelectedDayModal({
      dateStr: dStr,
      dayFormatted,
      events: dayEvents,
      tasks: dayTasks,
      birthdays: dayBirthdays,
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
    const dayOfWeek = firstDayDate.getDay(); // 0 = Sun, 1 = Mon ...
    const leadingEmpty = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Смещение для ПН = 0

    const daysInMonth = new Date(viewYear, viewMonth, 0).getDate();
    return { leadingEmpty, daysInMonth };
  }, [viewYear, viewMonth]);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Верхняя панель действий */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Часовой пояс:</span>
          <span className="px-2.5 py-1 bg-blue-50 text-blue-700 font-extrabold rounded-lg text-xs border border-blue-200 flex items-center gap-1">
            <Clock className="h-3 w-3" /> Чита (UTC+9)
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={joinGeneralTeamRoom}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            <Mic className="h-4 w-4" />
            <span>Общая планерка</span>
          </button>

          <button
            onClick={() => openCreateModal()}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Запланировать встречу</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 📅 ВИД КАЛЕНДАРЯ В СТИЛЕ СКРИНШОТА 1 */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden max-w-xl mx-auto">
        {/* Синяя шапка со скриншота 1 */}
        <div className="bg-[#2d5fb9] text-white px-5 py-3.5 flex items-center justify-between">
          <h2 className="text-base font-bold tracking-wide">Календарь</h2>
          <CalendarIcon className="h-5 w-5 opacity-90" />
        </div>

        <div className="p-5 space-y-4">
          {/* Навигация: Стрелочка влево, Месяц Год, Стрелочка вправо */}
          <div className="flex items-center justify-between px-2">
            <button
              onClick={handlePrevMonth}
              className="p-1.5 text-slate-700 hover:text-black hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              title="Предыдущий месяц"
            >
              <ChevronLeft className="h-5 w-5 stroke-[2.5]" />
            </button>

            <span className="font-bold text-slate-800 text-sm tracking-wide">
              {MONTH_NAMES_NOMINATIVE[viewMonth - 1]} {viewYear}
            </span>

            <button
              onClick={handleNextMonth}
              className="p-1.5 text-slate-700 hover:text-black hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              title="Следующий месяц"
            >
              <ChevronRight className="h-5 w-5 stroke-[2.5]" />
            </button>
          </div>

          {/* Дни недели: Пн, Вт, Ср, Чт, Пт, Сб, Вс */}
          <div className="grid grid-cols-7 text-center text-xs font-bold text-slate-700 border-b border-slate-200 pb-2">
            {WEEKDAY_NAMES.map((wd) => (
              <div key={wd}>{wd}</div>
            ))}
          </div>

          {/* Сетка чисел месяца */}
          <div className="grid grid-cols-7 gap-y-2 text-center text-xs">
            {/* Пустые ячейки смещения */}
            {Array.from({ length: calendarCells.leadingEmpty }).map((_, i) => (
              <div key={`empty-${i}`} className="h-9 w-9 mx-auto" />
            ))}

            {/* Дни месяца */}
            {Array.from({ length: calendarCells.daysInMonth }, (_, i) => i + 1).map((dayNum) => {
              const pad = (n: number) => String(n).padStart(2, "0");
              const dStr = `${viewYear}-${pad(viewMonth)}-${pad(dayNum)}`;
              const dayData = daysWithDataMap.get(dStr);
              
              // ⚡ ЗЕЛЕНЫЙ КРУЖОК со скриншота, если в этот день есть задачи / события / мониторинги
              const hasItems = dayData && (dayData.eventsCount > 0 || dayData.tasksCount > 0 || dayData.birthdaysCount > 0);

              return (
                <div key={dayNum} className="flex items-center justify-center">
                  <button
                    onClick={() => handleDayClick(dayNum)}
                    className={`h-8 w-8 rounded-full flex items-center justify-center font-semibold transition-all cursor-pointer select-none text-xs ${
                      hasItems
                        ? "bg-[#2ca953] text-white font-black shadow-xs hover:scale-110 ring-2 ring-emerald-300/40"
                        : "text-slate-700 hover:bg-slate-100"
                    }`}
                    title={hasItems ? `События на ${dayNum}.${viewMonth}.${viewYear}` : `День ${dayNum}`}
                  >
                    {dayNum}
                  </button>
                </div>
              );
            })}
          </div>

          {/* 🔘 БЛОК ФИЛЬТРОВ СО СКРИНШОТА 1 */}
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

      {/* ========================================================================= */}
      {/* 📋 МОДАЛЬНОЕ ОКНО ДЕТАЛЕЙ ДНЯ (В ТОЧНОСТИ КАК НА СКРИНШОТЕ 2) */}
      {/* ========================================================================= */}
      {selectedDayModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[88vh]">
            {/* Заголовок со скриншота 2 */}
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
                const assigneeName = task.assignments[0]?.user?.name || "Исполнитель";
                const statusName = task.assignments[0]?.status?.name || "В очереди";

                return (
                  <div key={task.id} className="space-y-1.5 pb-2 border-b border-slate-100 last:border-0">
                    {/* Название со значком блокнота */}
                    <div className="flex items-start gap-2 font-bold text-slate-900 text-xs sm:text-sm leading-snug">
                      <BookOpen className="h-4 w-4 text-slate-800 shrink-0 mt-0.5" />
                      <span>{task.title}</span>
                    </div>

                    {/* Бейджи со скриншота 2 */}
                    <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-bold">
                      <span className="bg-[#1b75bb] text-white px-2.5 py-0.5 rounded shadow-2xs">
                        {task.taskNumber ? `Поручение № ${task.taskNumber}` : `Задача № ${task.id.slice(0, 4)}`}
                      </span>

                      <span className="bg-[#3aa3d8] text-white px-2.5 py-0.5 rounded shadow-2xs">
                        {selectedDayModal.dayFormatted}
                      </span>

                      <span className="bg-[#2ca953] text-white px-2.5 py-0.5 rounded shadow-2xs">
                        {statusName === "Исполнено" ? "Исполнено" : "Запущен"}
                      </span>

                      <button
                        onClick={() => router.push(`/app/tasks?taskId=${task.id}`)}
                        className="text-[#1b75bb] hover:text-[#0b4e82] p-0.5 cursor-pointer ml-1"
                        title="Перейти к задаче"
                      >
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              })}

              {/* 3. События календаря (Совещания, встречи, Главный корпус) */}
              {selectedDayModal.events.map((ev) => {
                const s = getChitaDateInfo(ev.startTime);
                const e = getChitaDateInfo(ev.endTime);

                return (
                  <div key={ev.id} className="space-y-1.5 pb-2 border-b border-slate-100 last:border-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2 font-bold text-slate-900 text-xs sm:text-sm leading-snug">
                        <BookOpen className="h-4 w-4 text-slate-800 shrink-0 mt-0.5" />
                        <div>
                          <span>{ev.title}</span>
                          {ev.description && (
                            <p className="text-[11px] text-slate-500 font-normal mt-0.5">{ev.description}</p>
                          )}
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

            {/* Кнопка «ЗАКРЫТЬ» со скриншота 2 */}
            <div className="px-6 py-3 border-t border-slate-100 bg-slate-50/50 flex justify-end">
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