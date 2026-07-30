// src/app/app/dashboard/DashboardClient.tsx
"use client";

import React, { useTransition } from "react";
import { 
  FileSpreadsheet, 
  TrendingUp, 
  AlertTriangle, 
  Activity, 
  Users,
  Clock 
} from "lucide-react";

type EmployeeStat = {
  id: string;
  name: string;
  initials: string;
  email: string;
  total: number;
  completed: number;
  active: number;
  blocked: number;
  overdue: number;
  completionRate: number;
};

interface DashboardClientProps {
  totalTasks: number;
  overdueCount: number;
  urgentCount: number;
  employeeStats: EmployeeStat[];
}

export function DashboardClient({
  totalTasks,
  overdueCount,
  urgentCount,
  employeeStats,
}: DashboardClientProps) {
  const [isPending, startTransition] = useTransition();

  // Общий процент завершения задач по компании
  const totalAssignments = employeeStats.reduce((sum, emp) => sum + emp.total, 0);
  const totalCompleted = employeeStats.reduce((sum, emp) => sum + emp.completed, 0);
  const companyCompletionRate = totalAssignments > 0 ? Math.round((totalCompleted / totalAssignments) * 100) : 0;

  // Функция для экспорта данных в CSV (формат Excel)
  const handleExportCSV = () => {
    startTransition(() => {
      // Заголовки таблицы в файле
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

      // Формируем строки данных
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

      // Добавляем BOM-символ Юникода (\uFEFF) для корректного открытия кириллицы в Excel
      const csvContent = 
        "\uFEFF" + 
        [headers.join(";"), ...rows.map((r) => r.join(";"))].join("\n");

      // Создаем виртуальную ссылку для скачивания файла в браузере
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      
      const date = new Date().toLocaleDateString("ru-RU").replace(/\./g, "-");
      link.setAttribute("href", url);
      link.setAttribute("download", `Otchet_po_sotrudnikam_${date}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });
  };

  return (
    <div className="space-y-6">
      {/* Сетка карточек метрик (KPI) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Карточка 1: Процент завершения */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <TrendingUp className="h-6 w-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-800">{companyCompletionRate}%</div>
            <div className="text-xs text-slate-500 font-semibold mt-0.5">Успеваемость компании</div>
          </div>
        </div>

        {/* Карточка 2: Всего задач */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-slate-50 text-slate-600 rounded-xl">
            <Activity className="h-6 w-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-800">{totalTasks}</div>
            <div className="text-xs text-slate-500 font-semibold mt-0.5">Всего задач в работе</div>
          </div>
        </div>

        {/* Карточка 3: Просрочено */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-red-50 text-red-600 rounded-xl">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-800">{overdueCount}</div>
            <div className="text-xs text-slate-500 font-semibold mt-0.5">Просроченных задач</div>
          </div>
        </div>

        {/* Карточка 4: Срочные */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <Clock className="h-6 w-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-800">{urgentCount}</div>
            <div className="text-xs text-slate-500 font-semibold mt-0.5">Срочные (дедлайн $\le$ 3 дн.)</div>
          </div>
        </div>
      </div>

      {/* Таблица эффективности сотрудников */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="p-5 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-500" />
            Успеваемость сотрудников
          </h3>
          
          <button
            onClick={handleExportCSV}
            disabled={isPending}
            className="flex items-center gap-2 border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg text-xs font-bold transition-colors shadow-sm cursor-pointer disabled:bg-slate-50"
          >
            <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
            {isPending ? "Экспорт..." : "Экспорт отчета в Excel"}
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
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
            <tbody className="divide-y divide-slate-200 bg-white">
              {employeeStats.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-400 text-sm">
                    Сотрудники для анализа отсутствуют
                  </td>
                </tr>
              ) : (
                employeeStats.map((emp) => (
                  <tr key={emp.id} className="hover:bg-slate-50/50 transition-colors text-sm">
                    {/* ФИО */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 rounded-full bg-slate-100 text-slate-700 font-bold items-center justify-center text-xs">
                          {emp.initials}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900">{emp.name}</div>
                          <div className="text-xs text-slate-400">{emp.email}</div>
                        </div>
                      </div>
                    </td>

                    {/* Всего задач */}
                    <td className="px-6 py-4 whitespace-nowrap text-slate-700 font-semibold">
                      {emp.total}
                    </td>

                    {/* Выполнено */}
                    <td className="px-6 py-4 whitespace-nowrap font-bold text-emerald-600">
                      {emp.completed}
                    </td>

                    {/* Просрочено */}
                    <td className="px-6 py-4 whitespace-nowrap font-bold text-red-500">
                      {emp.overdue > 0 ? emp.overdue : "—"}
                    </td>

                    {/* В работе */}
                    <td className="px-6 py-4 whitespace-nowrap text-slate-600">
                      <div className="flex flex-col text-xs gap-0.5">
                        <span>{emp.active} активных</span>
                        {emp.blocked > 0 && (
                          <span className="text-red-500 font-semibold">{emp.blocked} заблокировано</span>
                        )}
                      </div>
                    </td>

                    {/* Прогресс-бар эффективности */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-24 bg-slate-100 rounded-full h-2 overflow-hidden">
                          <div 
                            className="bg-blue-600 h-2 rounded-full transition-all"
                            style={{ width: `${emp.completionRate}%` }}
                          />
                        </div>
                        <span className="font-bold text-slate-800 text-xs">{emp.completionRate}%</span>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}