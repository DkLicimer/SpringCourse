// src/components/UrgentTasksWidget.tsx
"use client";

import React, { useState, useEffect } from "react";
import { getMyNotifications } from "@/server/actions/notifications"; // Переиспользуем опрос для обновления или сделаем легкий fetch
import { AlertCircle, Clock, X, ChevronUp, ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";

type UrgentTask = {
  id: string;
  title: string;
  deadline: string | null;
  isPriority: boolean;
  goalTitle: string;
  goalColor: string;
};

export function UrgentTasksWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [urgentTasks, setUrgentTasks] = useState<UrgentTask[]>([]);
  const router = useRouter();

  // Загружаем срочные задачи в реальном времени
  const fetchUrgentTasks = async () => {
    try {
      // Чтобы не писать отдельный сложный роут, сделаем быстрый запрос к специальному API (или подгрузим)
      const res = await fetch("/api/tasks/urgent");
      if (res.ok) {
        const data = await res.json();
        setUrgentTasks(data);
      }
    } catch (err) {
      console.error("Ошибка загрузки срочных задач:", err);
    }
  };

  useEffect(() => {
    fetchUrgentTasks();
    const interval = setInterval(fetchUrgentTasks, 45000); // Опрашиваем раз в 45 сек
    return () => clearInterval(interval);
  }, []);

  if (urgentTasks.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-40 max-w-sm w-80 bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden print:hidden">
      {/* Шапка виджета */}
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="px-4 py-3 bg-red-600 text-white flex justify-between items-center cursor-pointer select-none"
      >
        <div className="flex items-center gap-2">
          <AlertCircle className="h-4 w-4 animate-pulse" />
          <span className="font-bold text-xs uppercase tracking-wider">Горящие задачи ({urgentTasks.length})</span>
        </div>
        <button className="text-white hover:text-red-200 transition-colors">
          {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
        </button>
      </div>

      {/* Список задач */}
      {isOpen && (
        <div className="p-4 space-y-3 divide-y divide-slate-100 max-h-60 overflow-y-auto">
          {urgentTasks.map((task, idx) => (
            <div 
              key={task.id} 
              onClick={() => { router.push("/app/tasks"); }}
              className={`text-xs space-y-1.5 cursor-pointer hover:bg-slate-50 p-2 rounded-lg transition-colors ${idx > 0 ? "pt-3" : ""}`}
            >
              <div className="flex justify-between items-center">
                <span 
                  className="px-2 py-0.5 rounded-full text-[9px] font-semibold text-white"
                  style={{ backgroundColor: task.goalColor }}
                >
                  {task.goalTitle}
                </span>
                {task.isPriority && (
                  <span className="text-red-600 font-bold uppercase text-[9px]">Приоритет!</span>
                )}
              </div>
              <h5 className="font-bold text-slate-800 line-clamp-1">{task.title}</h5>
              {task.deadline && (
                <div className="text-[10px] text-slate-400 flex items-center gap-1">
                  <Clock className="h-3 w-3" /> Дедлайн: {new Date(task.deadline).toLocaleDateString("ru-RU")}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}