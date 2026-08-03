// src/app/app/dashboard/DashboardClient.tsx
"use client";

import React, { useState, useTransition } from "react";
import { 
  FileSpreadsheet, 
  TrendingUp, 
  AlertTriangle, 
  Activity, 
  Users,
  Clock,
  Printer,
  CheckCircle2,
  Lock,
  UserCheck
} from "lucide-react";

type Goal = { title: string; color: string };

type Assignment = {
  id: string;
  userId: string;
  statusId: string;
  isBlocked: boolean;
};

type Task = {
  id: string;
  title: string;
  createdAt: string;
  deadline: string | null;
  goal: Goal;
  assignments: Assignment[];
};

type Employee = {
  id: string;
  name: string;
  initials: string;
  email: string;
  assignments: {
    id: string;
    statusId: string;
    isBlocked: boolean;
    task: { id: string; title: string; deadline: string | null };
  }[];
};

interface DashboardClientProps {
  tasks: Task[];
  employees: Employee[];
}

export function DashboardClient({ tasks, employees }: DashboardClientProps) {
  const [isPending, startTransition] = useTransition();
  const [period, setPeriod] = useState<"all" | "month" | "quarter">("all");
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>("all");

  const now = new Date();
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const endOfThreeDays = new Date(startOfToday);
  endOfThreeDays.setDate(startOfToday.getDate() + 3);
  endOfThreeDays.setHours(23, 59, 59, 999);

  // Фильтр проверки принадлежности даты выбранному периоду
  const isDateInPeriod = (dateStr: string) => {
    if (!dateStr) return false;
    const date = new Date(dateStr);
    if (period === "all") return true;

    if (period === "month") {
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    }

    if (period === "quarter") {
      const currentQuarter = Math.floor(now.getMonth() / 3);
      const taskQuarter = Math.floor(date.getMonth() / 3);
      return taskQuarter === currentQuarter && date.getFullYear() === now.getFullYear();
    }

    return true;
  };

  // Ищем данные выбранного сотрудника (если выбран не "all")
  const currentEmployee = selectedEmployeeId !== "all" 
    ? employees.find(e => e.id === selectedEmployeeId) 
    : null;

  // =========================================================================
  // РАСЧЕТ ПОКАЗАТЕЛЕЙ (KPI)
  // =========================================================================
  let companyCompletionRate = 0;
  let totalTasksCount = 0;
  let overdueTasksCount = 0;
  let urgentTasksCount = 0;

  // Вспомогательные переменные для личного отчета сотрудника
  let personalActiveCount = 0;
  let personalCompletedCount = 0;
  let personalBlockedCount = 0;

  // Списки задач сотрудника для отображения на экране
  let personalTasksList: {
    id: string;
    title: string;
    deadline: string | null;
    statusName: string;
    statusColor: string;
    isBlocked: boolean;
    isOverdue: boolean;
  }[] = [];

  if (currentEmployee) {
    // 1. Расчеты для конкретного выбранного сотрудника
    const periodAssignments = currentEmployee.assignments.filter((as) => {
      const taskObj = tasks.find(t => t.id === as.task.id);
      return taskObj ? isDateInPeriod(taskObj.createdAt) : false;
    });

    totalTasksCount = periodAssignments.length;
    personalCompletedCount = periodAssignments.filter((as) => as.statusId === "status-done").length;
    personalActiveCount = periodAssignments.filter((as) => as.statusId !== "status-done" && !as.isBlocked).length;
    personalBlockedCount = periodAssignments.filter((as) => as.isBlocked).length;

    // Считаем личные просроченные задачи
    overdueTasksCount = periodAssignments.filter((as) => {
      if (as.statusId === "status-done" || !as.task.deadline) return false;
      return new Date(as.task.deadline) < startOfToday;
    }).length;

    // Считаем личные горящие задачи
    urgentTasksCount = periodAssignments.filter((as) => {
      if (as.statusId === "status-done" || !as.task.deadline) return false;
      const dl = new Date(as.task.deadline);
      return dl >= startOfToday && dl <= endOfThreeDays;
    }).length;

    companyCompletionRate = totalTasksCount > 0 ? Math.round((personalCompletedCount / totalTasksCount) * 100) : 0;

    // Формируем детальный список задач сотрудника
    personalTasksList = periodAssignments.map(as => {
      const isOverdue = as.statusId !== "status-done" && as.task.deadline && new Date(as.task.deadline) < startOfToday ? true : false;
      let statusName = "В очереди";
      let statusColor = "#64748b";
      if (as.statusId === "status-in-progress") {
        statusName = "В работе";
        statusColor = "#3b82f6";
      } else if (as.statusId === "status-done") {
        statusName = "Исполнено";
        statusColor = "#10b981";
      }

      return {
        id: as.task.id,
        title: as.task.title,
        deadline: as.task.deadline,
        statusName,
        statusColor,
        isBlocked: as.isBlocked,
        isOverdue,
      };
    });
  } else {
    // 2. Расчеты в целом по организации (Все сотрудники)
    const filteredTasks = tasks.filter((t) => isDateInPeriod(t.createdAt));
    totalTasksCount = filteredTasks.length;

    overdueTasksCount = filteredTasks.filter((task) => {
      if (!task.deadline) return false;
      const isOverdue = new Date(task.deadline) < startOfToday;
      const isNotFinished = task.assignments.some((as) => as.statusId !== "status-done");
      return isOverdue && isNotFinished;
    }).length;

    urgentTasksCount = filteredTasks.filter((task) => {
      if (!task.deadline) return false;
      const dl = new Date(task.deadline);
      const isUpcoming = dl >= startOfToday && dl <= endOfThreeDays;
      const isNotFinished = task.assignments.some((as) => as.statusId !== "status-done");
      return isUpcoming && isNotFinished;
    }).length;

    // Расчет успеваемости по всем сотрудникам
    let totalAssignments = 0;
    let totalCompleted = 0;

    employees.forEach((emp) => {
      const periodAssignments = emp.assignments.filter((as) => {
        const taskObj = tasks.find(t => t.id === as.task.id);
        return taskObj ? isDateInPeriod(taskObj.createdAt) : false;
      });
      totalAssignments += periodAssignments.length;
      totalCompleted += periodAssignments.filter((as) => as.statusId === "status-done").length;
    });

    companyCompletionRate = totalAssignments > 0 ? Math.round((totalCompleted / totalAssignments) * 100) : 0;
  }

  // Расчет детальной статистики сотрудников для общей таблицы
  const employeeStats = employees.map((emp) => {
    const periodAssignments = emp.assignments.filter((as) => {
      const taskObj = tasks.find(t => t.id === as.task.id);
      return taskObj ? isDateInPeriod(taskObj.createdAt) : false;
    });
    
    const total = periodAssignments.length;
    const completed = periodAssignments.filter((as) => as.statusId === "status-done").length;
    const active = periodAssignments.filter((as) => as.statusId !== "status-done" && !as.isBlocked).length;
    const blocked = periodAssignments.filter((as) => as.isBlocked).length;

    const overdue = periodAssignments.filter((as) => {
      if (as.statusId === "status-done" || !as.task.deadline) return false;
      return new Date(as.task.deadline) < startOfToday;
    }).length;

    const rate = total > 0 ? Math.round((completed / total) * 100) : 0;

    return {
      id: emp.id,
      name: emp.name,
      initials: emp.initials,
      email: emp.email,
      total,
      completed,
      active,
      blocked,
      overdue,
      completionRate: rate,
    };
  });

  // =========================================================================
  // ЭКСПОРТ В CSV
  // =========================================================================
  const handleExportCSV = () => {
    startTransition(() => {
      let headers: string[] = [];
      let csvRows: any[][] = [];
      let filename = "";

      const dateStr = new Date().toLocaleDateString("ru-RU").replace(/\./g, "-");

      if (currentEmployee) {
        // Экспортируем детальный отчет по одному сотруднику
        filename = `Otchet_${currentEmployee.name.replace(/\s+/g, "_")}_${period}_${dateStr}.csv`;
        headers = ["Название задачи", "Дедлайн", "Статус", "Просрочена (Да/Нет)", "Заблокирована в цепочке"];
        csvRows = personalTasksList.map(task => [
          `"${task.title}"`,
          task.deadline ? new Date(task.deadline).toLocaleDateString("ru-RU") : "Нет срока",
          task.statusName,
          task.isOverdue ? "Да" : "Нет",
          task.isBlocked ? "Да" : "Нет"
        ]);
      } else {
        // Экспортируем общую таблицу сотрудников
        filename = `Otchet_Kompanii_${period}_${dateStr}.csv`;
        headers = [
          "ФИО сотрудника",
          "Email",
          "Всего задач",
          "Выполнено",
          "Активно",
          "Просрочено",
          "Заблокировано (в цепочке)",
          "Процент выполнения (%)"
        ];
        csvRows = employeeStats.map((emp) => [
          `"${emp.name}"`,
          emp.email,
          emp.total,
          emp.completed,
          emp.active,
          emp.overdue,
          emp.blocked,
          `${emp.completionRate}%`
        ]);
      }

      const csvContent = "\uFEFF" + [headers.join(";"), ...csvRows.map((r) => r.join(";"))].join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      
      link.setAttribute("href", url);
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });
  };

  return (
    <div className="space-y-6">
      {/* 🖨️ ШАПКА ДЛЯ ВЕРСИИ ПЕЧАТИ (Скрыта на экране, видна при печати) */}
      <div className="hidden print:block border-b border-slate-300 pb-4 mb-6">
        <h1 className="text-2xl font-bold text-slate-900 uppercase">
          {currentEmployee ? `Отчет об эффективности сотрудника: ${currentEmployee.name}` : "Общий отчет по эффективности компании"}
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Период: {period === "all" ? "Весь период" : period === "month" ? "Текущий месяц" : "Текущий квартал"} | Дата генерации: {new Date().toLocaleDateString("ru-RU")}
        </p>
      </div>

      {/* ПАНЕЛЬ СЕЛЕКТОРОВ И ФИЛЬТРОВ */}
      <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between print:hidden">
        {/* Выбор периода */}
        <div className="flex bg-slate-200/60 p-1 rounded-xl max-w-xs border border-slate-200">
          {(["all", "month", "quarter"] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                period === p 
                  ? "bg-white text-blue-600 shadow-sm" 
                  : "text-slate-600 hover:text-slate-800"
              }`}
            >
              {p === "all" && "Весь период"}
              {p === "month" && "Месяц"}
              {p === "quarter" && "Квартал"}
            </button>
          ))}
        </div>

        {/* Выбор сотрудника (Интерактивный селектор) */}
        <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-sm max-w-sm">
          <Users className="h-4 w-4 text-slate-400 shrink-0" />
          <select
            value={selectedEmployeeId}
            onChange={(e) => setSelectedEmployeeId(e.target.value)}
            className="text-xs font-bold bg-white text-slate-700 focus:outline-none cursor-pointer"
          >
            <option value="all">Все сотрудники (Сводный отчет)</option>
            {employees.map(emp => (
              <option key={emp.id} value={emp.id}>
                {emp.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* СЕТКА С КАРТОЧКАМИ МЕТРИК (KPI) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 print:grid-cols-4">
        {/* Карточка 1: Процент завершения (Эффективность) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4 print:border-slate-300 print:shadow-none">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl print:bg-slate-100 print:text-slate-800">
            <TrendingUp className="h-6 w-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-800">{companyCompletionRate}%</div>
            <div className="text-xs text-slate-500 font-semibold mt-0.5">
              {currentEmployee ? "Личная успеваемость" : "Успеваемость компании"}
            </div>
          </div>
        </div>

        {/* Карточка 2: Всего задач в работе */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4 print:border-slate-300 print:shadow-none">
          <div className="p-3 bg-slate-50 text-slate-600 rounded-xl print:bg-slate-100 print:text-slate-800">
            <Activity className="h-6 w-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-800">{totalTasksCount}</div>
            <div className="text-xs text-slate-500 font-semibold mt-0.5">
              {currentEmployee ? "Всего личных задач" : "Всего задач в работе"}
            </div>
          </div>
        </div>

        {/* Карточка 3: Просрочено */}
        <div className={`p-5 rounded-2xl border shadow-sm flex items-center gap-4 print:border-slate-300 print:shadow-none ${
          overdueTasksCount > 0 ? "bg-red-50/20 border-red-200" : "bg-white border-slate-200"
        }`}>
          <div className={`p-3 rounded-xl ${
            overdueTasksCount > 0 ? "bg-red-100 text-red-600" : "bg-slate-50 text-slate-400"
          }`}>
            <AlertTriangle className="h-6 w-6" />
          </div>
          <div>
            <div className={`text-2xl font-black ${overdueTasksCount > 0 ? "text-red-600" : "text-slate-800"}`}>
              {overdueTasksCount}
            </div>
            <div className="text-xs text-slate-500 font-semibold mt-0.5">Просрочено задач</div>
          </div>
        </div>

        {/* Карточка 4: Срочные (дедлайн до 3 дней) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4 print:border-slate-300 print:shadow-none">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl print:bg-slate-100 print:text-slate-800">
            <Clock className="h-6 w-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-800">{urgentTasksCount}</div>
            <div className="text-xs text-slate-500 font-semibold mt-0.5">Горящих (дедлайн $\le$ 3 дн.)</div>
          </div>
        </div>
      </div>

      {/* ОТОБРАЖЕНИЕ РЕЗУЛЬТАТОВ (ДЕТАЛЬНАЯ ЧАСТЬ) */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm print:border-slate-300 print:shadow-none">
        
        {/* Заголовок блока с кнопками экспорта */}
        <div className="p-5 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 print:hidden">
          <h3 className="font-bold text-slate-800 flex items-center gap-2 text-sm sm:text-base">
            {currentEmployee ? (
              <>
                <UserCheck className="h-5 w-5 text-blue-500" />
                Детальный отчет: {currentEmployee.name}
              </>
            ) : (
              <>
                <Users className="h-5 w-5 text-blue-500" />
                Успеваемость всех сотрудников
              </>
            )}
          </h3>
          
          <div className="flex gap-2 w-full sm:w-auto">
            <button
              onClick={() => window.print()}
              className="flex-1 flex items-center justify-center gap-2 border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg text-xs font-bold transition-colors shadow-sm cursor-pointer"
            >
              <Printer className="h-4 w-4 text-blue-600" />
              Печать в PDF
            </button>
            <button
              onClick={handleExportCSV}
              disabled={isPending}
              className="flex-1 flex items-center justify-center gap-2 border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg text-xs font-bold transition-colors shadow-sm cursor-pointer disabled:bg-slate-50"
            >
              <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
              {isPending ? "Экспорт..." : "Экспорт в Excel"}
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* СИТУАЦИЯ 1: ОТОБРАЖЕНИЕ ЛИЧНОГО СПИСКА ЗАДАЧ СОТРУДНИКА */}
        {/* ========================================================================= */}
        {currentEmployee ? (
          <div className="p-6 space-y-4">
            {/* Сводный блок аналитики внутри отчета */}
            <div className="grid grid-cols-3 gap-3 max-w-md text-xs border border-slate-100 rounded-xl p-3 bg-slate-50/50 print:border-slate-300">
              <div className="flex flex-col gap-0.5">
                <span className="text-slate-400 font-medium">Активных:</span>
                <span className="font-bold text-slate-800">{personalActiveCount}</span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-slate-400 font-medium">Выполнено:</span>
                <span className="font-bold text-emerald-600">{personalCompletedCount}</span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-slate-400 font-medium">Заблокировано:</span>
                <span className="font-bold text-amber-600">{personalBlockedCount}</span>
              </div>
            </div>

            <div className="overflow-x-auto print:overflow-visible">
              <table className="min-w-full divide-y divide-slate-200 text-xs sm:text-sm print:divide-slate-300">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-3 text-left font-semibold text-slate-500 uppercase tracking-wider">Задача</th>
                    <th className="px-6 py-3 text-left font-semibold text-slate-500 uppercase tracking-wider">Дедлайн</th>
                    <th className="px-6 py-3 text-left font-semibold text-slate-500 uppercase tracking-wider">Статус</th>
                    <th className="px-6 py-3 text-left font-semibold text-slate-500 uppercase tracking-wider">Состояние</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white print:divide-slate-300">
                  {personalTasksList.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-slate-400 italic">
                        Задач за выбранный период не найдено
                      </td>
                    </tr>
                  ) : (
                    personalTasksList.map((task) => (
                      <tr key={task.id} className="hover:bg-slate-50/30 transition-colors">
                        <td className="px-6 py-4 font-semibold text-slate-900 leading-snug">
                          {task.title}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-slate-700">
                          {task.deadline ? new Date(task.deadline).toLocaleDateString("ru-RU") : "—"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span 
                            className="px-2.5 py-0.5 rounded-full font-bold text-[10px] text-white"
                            style={{ backgroundColor: task.statusColor }}
                          >
                            {task.statusName}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {task.isOverdue ? (
                            <span className="text-red-600 font-bold uppercase text-[10px] flex items-center gap-1">
                              <AlertTriangle className="h-3 w-3" /> Просрочена
                            </span>
                          ) : task.isBlocked ? (
                            <span className="text-amber-600 font-bold uppercase text-[10px] flex items-center gap-1">
                              <Lock className="h-3 w-3" /> Заблокирована
                            </span>
                          ) : task.statusName === "Исполнено" ? (
                            <span className="text-emerald-600 font-bold uppercase text-[10px] flex items-center gap-1">
                              <CheckCircle2 className="h-3 w-3" /> Успешно завершена
                            </span>
                          ) : (
                            <span className="text-blue-600 font-bold uppercase text-[10px] flex items-center gap-1">
                              Активна
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        ) : (
          
          // =========================================================================
          // СИТУАЦИЯ 2: ОБЩАЯ СВОДНАЯ ТАБЛИЦА ВСЕХ СОТРУДНИКОВ
          // =========================================================================
          <div className="overflow-x-auto print:overflow-visible">
            <table className="min-w-full divide-y divide-slate-200 print:divide-slate-300">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Имя сотрудника</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Всего задач</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Выполнено</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Просрочено</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">В работе</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Эффективность</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white print:divide-slate-300">
                {employeeStats.map((emp) => (
                  <tr key={emp.id} className="hover:bg-slate-50/50 transition-colors text-sm">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 rounded-full bg-slate-100 text-slate-700 font-bold items-center justify-center text-xs print:border print:border-slate-300">
                          {emp.initials}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900">{emp.name}</div>
                          <div className="text-xs text-slate-400 print:hidden">{emp.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-slate-700 font-semibold">
                      {emp.total}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-bold text-emerald-600">
                      {emp.completed}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-bold text-red-500">
                      {emp.overdue > 0 ? emp.overdue : "—"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-slate-600">
                      <div className="flex flex-col text-xs gap-0.5">
                        <span>{emp.active} активных</span>
                        {emp.blocked > 0 && (
                          <span className="text-red-500 font-semibold">{emp.blocked} заблокировано</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-24 bg-slate-100 rounded-full h-2 overflow-hidden print:hidden">
                          <div 
                            className="bg-blue-600 h-2 rounded-full transition-all"
                            style={{ width: `${emp.completionRate}%` }}
                          />
                        </div>
                        <span className="font-bold text-slate-800 text-xs">{emp.completionRate}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}