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
  Printer 
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

  const now = new Date();
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const endOfThreeDays = new Date(startOfToday);
  endOfThreeDays.setDate(startOfToday.getDate() + 3);
  endOfThreeDays.setHours(23, 59, 59, 999);

  // Фильтр проверки принадлежности даты выбранному периоду
  const isDateInPeriod = (dateStr: string) => {
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

  // 1. Фильтруем список задач по периоду
  const filteredTasks = tasks.filter((t) => isDateInPeriod(t.createdAt));

  // 2. Рассчитываем глобальные KPI по отфильтрованным задачам
  const totalTasks = filteredTasks.length;

  const overdueCount = filteredTasks.filter((task) => {
    if (!task.deadline) return false;
    const taskDeadline = new Date(task.deadline);
    const isOverdue = taskDeadline < startOfToday;
    const isNotFinished = task.assignments.some((as) => as.statusId !== "status-done");
    return isOverdue && isNotFinished;
  }).length;

  const urgentCount = filteredTasks.filter((task) => {
    if (!task.deadline) return false;
    const taskDeadline = new Date(task.deadline);
    const isUpcoming = taskDeadline >= startOfToday && taskDeadline <= endOfThreeDays;
    const isNotFinished = task.assignments.some((as) => as.statusId !== "status-done");
    return isUpcoming && isNotFinished;
  }).length;

  // 3. Рассчитываем детальную статистику по сотрудникам за выбранный период
  const employeeStats = employees.map((emp) => {
    // Оставляем только те назначения сотрудника, чьи задачи были созданы в выбранном периоде
    const periodAssignments = emp.assignments.filter((as) => isDateInPeriod(as.task.id ? tasks.find(t => t.id === as.task.id)?.createdAt || "" : ""));
    
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

  const totalAssignments = employeeStats.reduce((sum, emp) => sum + emp.total, 0);
  const totalCompleted = employeeStats.reduce((sum, emp) => sum + emp.completed, 0);
  const companyCompletionRate = totalAssignments > 0 ? Math.round((totalCompleted / totalAssignments) * 100) : 0;

  const handleExportCSV = () => {
    startTransition(() => {
      const headers = [
        "ФИО сотрудника",
        "Email",
        "Всего задач",
        "Выполнено",
        "Активно",
        "Просрочено",
        "Заблокировано (в цепочке)",
        "Процент выполнения (%)"
      ];

      const rows = employeeStats.map((emp) => [
        `"${emp.name}"`,
        emp.email,
        emp.total,
        emp.completed,
        emp.active,
        emp.overdue,
        emp.blocked,
        `${emp.completionRate}%`
      ]);

      const csvContent = 
        "\uFEFF" + 
        [headers.join(";"), ...rows.map((r) => r.join(";"))].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      
      const date = new Date().toLocaleDateString("ru-RU").replace(/\./g, "-");
      link.setAttribute("href", url);
      link.setAttribute("download", `Otchet_${period}_${date}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });
  };

  return (
    <div className="space-y-6">
      {/* 
        Специальный блок, который будет виден ТОЛЬКО ПРИ ПЕЧАТИ (в браузере он скрыт hidden print:block)
      */}
      <div className="hidden print:block border-b border-slate-300 pb-4 mb-6">
        <h1 className="text-2xl font-bold text-slate-900">ОТЧЕТ ОБ ЭФФЕКТИВНОСТИ СОТРУДНИКОВ</h1>
        <p className="text-sm text-slate-500 mt-1">
          Период: {period === "all" ? "Весь период" : period === "month" ? "Текущий месяц" : "Текущий квартал"} | Дата генерации: {new Date().toLocaleDateString("ru-RU")}
        </p>
      </div>

      {/* Селектор периодов (Пункт 10) */}
      <div className="flex bg-slate-200/60 p-1 rounded-xl max-w-sm border border-slate-200 print:hidden">
        {(["all", "month", "quarter"] as const).map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
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

      {/* Сетка карточек метрик (KPI) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 print:grid-cols-4">
        {/* Карточка 1: Процент завершения */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4 print:border-slate-300 print:shadow-none">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl print:bg-slate-100 print:text-slate-800">
            <TrendingUp className="h-6 w-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-800">{companyCompletionRate}%</div>
            <div className="text-xs text-slate-500 font-semibold mt-0.5">Успеваемость компании</div>
          </div>
        </div>

        {/* Карточка 2: Всего задач */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4 print:border-slate-300 print:shadow-none">
          <div className="p-3 bg-slate-50 text-slate-600 rounded-xl print:bg-slate-100 print:text-slate-800">
            <Activity className="h-6 w-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-800">{totalTasks}</div>
            <div className="text-xs text-slate-500 font-semibold mt-0.5">Всего задач в работе</div>
          </div>
        </div>

        {/* Карточка 3: Просрочено */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4 print:border-slate-300 print:shadow-none">
          <div className="p-3 bg-red-50 text-red-600 rounded-xl print:bg-slate-100 print:text-slate-800">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-800">{overdueCount}</div>
            <div className="text-xs text-slate-500 font-semibold mt-0.5">Просроченных задач</div>
          </div>
        </div>

        {/* Карточка 4: Срочные */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4 print:border-slate-300 print:shadow-none">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl print:bg-slate-100 print:text-slate-800">
            <Clock className="h-6 w-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-800">{urgentCount}</div>
            <div className="text-xs text-slate-500 font-semibold mt-0.5">Срочные (дедлайн $\le$ 3 дн.)</div>
          </div>
        </div>
      </div>

      {/* Таблица эффективности сотрудников */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm print:border-slate-300 print:shadow-none">
        <div className="p-5 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 print:hidden">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-500" />
            Успеваемость сотрудников
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
      </div>
    </div>
  );
}