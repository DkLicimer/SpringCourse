// src/app/app/daily-report/DailyReportClient.tsx
"use client";

import React, { useState, useTransition, useEffect } from "react";
import { 
  CalendarCheck, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  FileText, 
  Check, 
  Printer, 
  ChevronDown, 
  ChevronUp, 
  AlertCircle, 
  X, 
  Briefcase, 
  History, 
  Sparkles, 
  Users 
} from "lucide-react";
import { 
  saveDailyReport, 
  getDailyReportByDate, 
  getPreviousDayReport,
  TaskReportEntry 
} from "@/server/actions/dailyReports";

interface ActiveTaskItem {
  taskId: string;
  taskNumber?: number;
  title: string;
  deadline: string | null;
  goalTitle: string;
  goalColor: string;
}

interface DailyReportClientProps {
  todayStr: string;
  currentUserId: string;
  isAdmin: boolean;
  activeTasks: ActiveTaskItem[];
  initialCurrentReport: any | null;
  initialPreviousReport: any | null;
  employees: any[];
}

export function DailyReportClient({
  todayStr,
  currentUserId,
  isAdmin,
  activeTasks,
  initialCurrentReport,
  initialPreviousReport,
  employees,
}: DailyReportClientProps) {
  const [isPending, startTransition] = useTransition();
  const [selectedDateStr, setSelectedDateStr] = useState(todayStr);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(currentUserId);

  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);
  const showToast = (message: string, type: "success" | "error" | "info" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Состояние текущего отчета
  const [currentReport, setCurrentReport] = useState<any | null>(initialCurrentReport);
  const [previousReport, setPreviousReport] = useState<any | null>(initialPreviousReport);
  const [isPreviousCollapsed, setIsPreviousCollapsed] = useState(false);

  // Поля ввода отчета
  const [generalComment, setGeneralComment] = useState(initialCurrentReport?.generalComment || "");
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>(() => {
    if (initialCurrentReport?.tasksData && Array.isArray(initialCurrentReport.tasksData)) {
      return initialCurrentReport.tasksData.map((t: any) => t.taskId);
    }
    return [];
  });
  const [taskComments, setTaskComments] = useState<Record<string, string>>(() => {
    if (initialCurrentReport?.tasksData && Array.isArray(initialCurrentReport.tasksData)) {
      const dict: Record<string, string> = {};
      initialCurrentReport.tasksData.forEach((t: any) => {
        dict[t.taskId] = t.comment || "";
      });
      return dict;
    }
    return {};
  });

  // Загрузка отчета при смене даты или сотрудника
  const loadReportsForDateAndUser = async (dStr: string, uId: string) => {
    startTransition(async () => {
      try {
        const cur = await getDailyReportByDate(dStr, uId);
        const prev = await getPreviousDayReport(dStr, uId);

        setCurrentReport(cur);
        setPreviousReport(prev);

        setGeneralComment(cur?.generalComment || "");
        if (cur?.tasksData && Array.isArray(cur.tasksData)) {
          setSelectedTaskIds(cur.tasksData.map((t: any) => t.taskId));
          const dict: Record<string, string> = {};
          cur.tasksData.forEach((t: any) => {
            dict[t.taskId] = t.comment || "";
          });
          setTaskComments(dict);
        } else {
          setSelectedTaskIds([]);
          setTaskComments({});
        }
      } catch (err: any) {
        showToast(err.message || "Ошибка загрузки отчета", "error");
      }
    });
  };

  const handleDateChange = (newDateStr: string) => {
    setSelectedDateStr(newDateStr);
    loadReportsForDateAndUser(newDateStr, selectedEmployeeId);
  };

  const handleEmployeeChange = (newEmpId: string) => {
    setSelectedEmployeeId(newEmpId);
    loadReportsForDateAndUser(selectedDateStr, newEmpId);
  };

  const toggleTaskSelection = (taskId: string) => {
    setSelectedTaskIds((prev) =>
      prev.includes(taskId) ? prev.filter((id) => id !== taskId) : [...prev, taskId]
    );
  };

  const handleTaskCommentChange = (taskId: string, comment: string) => {
    setTaskComments((prev) => ({ ...prev, [taskId]: comment }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const taskEntries: TaskReportEntry[] = selectedTaskIds.map((taskId) => {
      const taskObj = activeTasks.find((t) => t.taskId === taskId);
      return {
        taskId,
        taskNumber: taskObj?.taskNumber,
        taskTitle: taskObj?.title || "Задача",
        comment: taskComments[taskId]?.trim() || "",
      };
    });

    startTransition(async () => {
      try {
        const saved = await saveDailyReport({
          dateStr: selectedDateStr,
          generalComment: generalComment.trim(),
          taskEntries,
        });

        setCurrentReport(saved);
        showToast("Отчет за рабочий день успешно сохранен!", "success");
      } catch (err: any) {
        showToast(err.message || "Ошибка сохранения отчета", "error");
      }
    });
  };

  const isViewingOthers = isAdmin && selectedEmployeeId !== currentUserId;

  return (
    <div className="space-y-6">
      {/* Toast */}
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

      {/* Верхняя шапка */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs print:border-none print:p-0">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-blue-600 text-white rounded-2xl shadow-xs">
              <CalendarCheck className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Отчет за рабочий день
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 font-medium">
                Фиксация результатов за день и архив предыдущего рабочего дня
              </p>
            </div>
          </div>
        </div>

        {/* Селектор даты и сотрудника (для админа) */}
        <div className="flex flex-wrap items-center gap-2.5 print:hidden w-full sm:w-auto">
          {isAdmin && (
            <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700">
              <Users className="h-4 w-4 text-slate-400" />
              <select
                value={selectedEmployeeId}
                onChange={(e) => handleEmployeeChange(e.target.value)}
                className="bg-transparent focus:outline-none cursor-pointer"
              >
                <option value={currentUserId}>Мой личный отчет</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name} {emp.department ? `(${emp.department})` : ""}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700">
            <Calendar className="h-4 w-4 text-blue-600" />
            <input
              type="date"
              value={selectedDateStr}
              onChange={(e) => handleDateChange(e.target.value)}
              className="bg-transparent focus:outline-none cursor-pointer"
            />
          </div>

          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            <Printer className="h-4 w-4 text-blue-600" />
            <span className="hidden sm:inline">Печать</span>
          </button>
        </div>
      </div>

      {/* ⚡ 1. ОКНО С ОТЧЕТОМ ЗА ПРОШЕДШИЙ ДЕНЬ (ПУНКТ 10) */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-3xl border border-slate-800 shadow-sm overflow-hidden transition-all">
        <div className="px-6 py-4 flex items-center justify-between border-b border-white/10 bg-white/[0.02]">
          <div className="flex items-center gap-2">
            <History className="h-4 w-4 text-blue-400" />
            <span className="font-extrabold text-xs uppercase tracking-wider text-blue-200">
              Отчет за прошедший рабочий день
            </span>
            {previousReport && (
              <span className="text-[11px] font-bold text-blue-400 bg-white/10 px-2.5 py-0.5 rounded-full">
                {new Date(previousReport.reportDate).toLocaleDateString("ru-RU", { day: "numeric", month: "long" })} ({previousReport.dateStr})
              </span>
            )}
          </div>

          <button
            onClick={() => setIsPreviousCollapsed(!isPreviousCollapsed)}
            className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
            title={isPreviousCollapsed ? "Развернуть" : "Свернуть"}
          >
            {isPreviousCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
          </button>
        </div>

        {!isPreviousCollapsed && (
          <div className="p-6 space-y-4">
            {!previousReport ? (
              <p className="text-xs text-slate-400 italic">
                Отчетов за предшествующие дни пока не зафиксировано.
              </p>
            ) : (
              <div className="space-y-4">
                {previousReport.generalComment && (
                  <div className="bg-white/5 border border-white/10 p-3.5 rounded-2xl space-y-1">
                    <span className="text-[10px] uppercase font-bold text-blue-300 block">Общий итог дня:</span>
                    <p className="text-xs text-slate-200 whitespace-pre-line leading-relaxed">
                      {previousReport.generalComment}
                    </p>
                  </div>
                )}

                {previousReport.tasksData && Array.isArray(previousReport.tasksData) && previousReport.tasksData.length > 0 ? (
                  <div className="space-y-2">
                    <span className="text-[10px] uppercase font-bold text-blue-300 block">
                      Задачи, над которыми велась работа ({previousReport.tasksData.length}):
                    </span>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {previousReport.tasksData.map((t: any, idx: number) => (
                        <div key={idx} className="bg-white/5 border border-white/10 p-3 rounded-2xl text-xs space-y-1">
                          <div className="flex items-center gap-1.5">
                            {t.taskNumber && (
                              <span className="px-1.5 py-0.5 rounded bg-blue-600 text-white font-black text-[9px]">
                                №{t.taskNumber}
                              </span>
                            )}
                            <span className="font-bold text-slate-100 truncate">{t.taskTitle}</span>
                          </div>
                          <p className="text-slate-300 italic whitespace-pre-line leading-relaxed pl-2 border-l-2 border-blue-500/50">
                            «{t.comment}»
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">
                    Задачи в отчете за прошлый день не были отмечены.
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ⚡ 2. ФОРМА ОТЧЕТА ЗА ТЕКУЩИЙ ВЫБРАННЫЙ ДЕНЬ */}
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" />
              <span>Отчет за {selectedDateStr === todayStr ? "сегодня" : selectedDateStr}</span>
              {currentReport && (
                <span className="text-[10px] bg-emerald-100 text-emerald-800 border border-emerald-200 px-2.5 py-0.5 rounded-full font-bold uppercase flex items-center gap-1">
                  <Check className="h-3 w-3" /> Сохранен
                </span>
              )}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Отметьте задачи, над которыми работали в течение дня, и опишите ключевые результаты
            </p>
          </div>

          {currentReport && (
            <span className="text-[11px] text-slate-400 font-medium">
              Обновлено: {new Date(currentReport.updatedAt).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}
            </span>
          )}
        </div>

        {/* Выбор активных задач сотрудника */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Briefcase className="h-4 w-4 text-blue-600" />
              <span>1. Активные задачи в работе ({selectedTaskIds.length} выбрано)</span>
            </label>
            <span className="text-[10px] text-slate-400">
              Поставьте галочку напротив задач, по которым был прогресс
            </span>
          </div>

          {activeTasks.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-400 italic bg-slate-50 rounded-2xl border border-slate-200">
              В данный момент у вас нет активных задач в очереди.
            </div>
          ) : (
            <div className="space-y-3">
              {activeTasks.map((task) => {
                const isSelected = selectedTaskIds.includes(task.taskId);

                return (
                  <div
                    key={task.taskId}
                    className={`rounded-2xl border transition-all p-4 space-y-2.5 ${
                      isSelected
                        ? "bg-blue-50/40 border-blue-300 shadow-xs"
                        : "bg-slate-50/60 border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <label className="flex items-center justify-between gap-3 cursor-pointer">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          disabled={isViewingOthers}
                          onChange={() => toggleTaskSelection(task.taskId)}
                          className="h-4 w-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500 cursor-pointer"
                        />
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            {task.taskNumber && (
                              <span className="px-2 py-0.5 bg-slate-900 text-white rounded text-[10px] font-black">
                                №{task.taskNumber}
                              </span>
                            )}
                            <span 
                              className="px-2 py-0.5 rounded text-[9px] font-bold text-white"
                              style={{ backgroundColor: task.goalColor }}
                            >
                              {task.goalTitle}
                            </span>
                          </div>
                          <span className="text-xs font-bold text-slate-900 block leading-snug">{task.title}</span>
                        </div>
                      </div>

                      {task.deadline && (
                        <span className="text-[10px] text-slate-400 whitespace-nowrap flex items-center gap-1 font-medium">
                          <Clock className="h-3 w-3" /> Срок: {new Date(task.deadline).toLocaleDateString("ru-RU")}
                        </span>
                      )}
                    </label>

                    {/* Поле комментария по выбранной задаче */}
                    {isSelected && (
                      <div className="pt-2 border-t border-blue-200/60 animate-fade-in space-y-1">
                        <label className="text-[10px] font-bold text-blue-900 flex items-center gap-1 uppercase">
                          <Sparkles className="h-3 w-3 text-blue-600" />
                          Что было сделано по этой задаче за день? *
                        </label>
                        <textarea
                          rows={2}
                          required
                          disabled={isViewingOthers}
                          placeholder="Опишите результат: написан текст, согласована смета, отправлен макет..."
                          value={taskComments[task.taskId] || ""}
                          onChange={(e) => handleTaskCommentChange(task.taskId, e.target.value)}
                          className="w-full px-3 py-2 border border-blue-300 rounded-xl text-xs focus:outline-none focus:border-blue-500 text-slate-800 bg-white leading-relaxed"
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Общий комментарий за рабочий день */}
        <div className="space-y-2">
          <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <FileText className="h-4 w-4 text-blue-600" />
            <span>2. Общие итоги дня / Внеплановые дела</span>
          </label>
          <textarea
            rows={4}
            disabled={isViewingOthers}
            placeholder="Опишите общие результаты за день, внеплановые звонки, встречи, трудности или планы на завтра..."
            value={generalComment}
            onChange={(e) => setGeneralComment(e.target.value)}
            className="w-full px-4 py-3 border border-slate-300 rounded-2xl text-xs sm:text-sm focus:outline-none focus:border-blue-500 text-slate-800 bg-slate-50 focus:bg-white leading-relaxed"
          />
        </div>

        {!isViewingOthers && (
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isPending}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs sm:text-sm font-bold transition-all shadow-md disabled:bg-blue-300 cursor-pointer flex items-center gap-2"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>{isPending ? "Сохранение отчета..." : "Сохранить отчет за день"}</span>
            </button>
          </div>
        )}
      </form>
    </div>
  );
}