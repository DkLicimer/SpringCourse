// src/components/UrgentTasksWidget.tsx
"use client";

import React, { useState, useEffect } from "react";
import { Flame, Clock, X } from "lucide-react";
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

  const fetchUrgentTasks = async () => {
    try {
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
    const interval = setInterval(fetchUrgentTasks, 45000);
    return () => clearInterval(interval);
  }, []);

  if (urgentTasks.length === 0) return null;

  return (
    <>
      {/* Невидимая подложка для закрытия поповера при клике в любое место экрана */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-30 bg-transparent" 
          onClick={() => setIsOpen(false)} 
        />
      )}

      <div className="fixed bottom-6 right-6 z-40 print:hidden flex flex-col items-end gap-3">
        {/* 📋 ВСПЛЫВАЮЩЕЕ ОКНО СО СПИСКОМ ГОРЯЩИХ ЗАДАЧ */}
        {isOpen && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden w-80 max-w-sm flex flex-col max-h-[70vh] animate-slide-up mb-2">
            <div className="px-4 py-3 bg-red-600 text-white flex justify-between items-center shrink-0">
              <div className="flex items-center gap-1.5">
                <Flame className="h-4.5 w-4.5 animate-bounce" />
                <span className="font-bold text-xs uppercase tracking-wider">Горящие задачи ({urgentTasks.length})</span>
              </div>
              <button 
                onClick={() => setIsOpen(false)} 
                className="text-white hover:text-red-200 cursor-pointer"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            <div className="p-4 space-y-3 divide-y divide-slate-100 overflow-y-auto">
              {urgentTasks.map((task, idx) => (
                <div 
                  key={task.id} 
                  onClick={() => { router.push(`/app/tasks?taskId=${task.id}`); setIsOpen(false); }}
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
                  <h5 className="font-bold text-slate-800 leading-snug line-clamp-2">{task.title}</h5>
                  {task.deadline && (
                    <div className="text-[10px] text-slate-400 flex items-center gap-1">
                      <Clock className="h-3 w-3" /> Дедлайн: {new Date(task.deadline).toLocaleDateString("ru-RU")}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 🔥 КРУГЛАЯ ПЛАВАЮЩАЯ КНОПКА-ВИДЖЕТ С ОГОНЬКОМ (ЕДИНАЯ ДЛЯ МОБИЛЬНЫХ И ПК) */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="h-12 w-12 rounded-full bg-red-600 hover:bg-red-700 text-white shadow-2xl flex items-center justify-center transition-all border border-red-500 cursor-pointer relative shrink-0 hover:scale-105 active:scale-95"
        >
          <Flame className="h-5.5 w-5.5 animate-pulse" />
          <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-slate-900 border-2 border-white text-[10px] font-black flex items-center justify-center text-white">
            {urgentTasks.length}
          </span>
        </button>
      </div>
    </>
  );
}