// src/app/app/duties/DutiesClient.tsx
"use client";

import React from "react";
import { 
  ClipboardList, 
  Briefcase, 
  Layers, 
  ListTodo, 
  Printer, 
  CheckCircle2,
  Building2,
  UserCheck
} from "lucide-react";

interface DutiesClientProps {
  user: {
    id: string;
    name: string;
    department?: string | null;
    role: string;
    mainDuties?: string | null;
    extraDuties?: string | null;
    orderDuties?: string | null;
  };
}

function parseDutyLines(text?: string | null): string[] {
  if (!text || !text.trim()) return [];
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

export function DutiesClient({ user }: DutiesClientProps) {
  const mainList = parseDutyLines(user.mainDuties);
  const extraList = parseDutyLines(user.extraDuties);
  const orderList = parseDutyLines(user.orderDuties);

  const totalDuties = mainList.length + extraList.length + orderList.length;

  return (
    <div className="space-y-6">
      {/* Шапка страницы */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs print:border-none print:p-0">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-blue-600 text-white rounded-2xl shadow-xs">
              <ClipboardList className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Должностные обязанности
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 font-medium">
                {user.name} {user.department && `• ${user.department}`}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 print:hidden self-stretch sm:self-auto">
          <button
            onClick={() => window.print()}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            <Printer className="h-4 w-4 text-blue-600" />
            <span>Распечатать / PDF</span>
          </button>
        </div>
      </div>

      {/* Если обязанностей пока нет */}
      {totalDuties === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-3 shadow-xs">
          <div className="inline-flex p-4 bg-blue-50 text-blue-600 rounded-2xl">
            <ClipboardList className="h-8 w-8" />
          </div>
          <h3 className="text-base font-bold text-slate-800">Обязанности еще не назначены</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
            Руководитель пока не заполнил ваш перечень обязанностей. Как только они будут внесены в систему, они отобразятся здесь по трем категориям.
          </p>
        </div>
      ) : (
        /* ⚡ 3 КОЛОНКИ ОБЯЗАННОСТЕЙ */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 print:grid-cols-3">
          {/* Колонка 1: Основные обязанности */}
          <div className="bg-white rounded-3xl border-2 border-blue-200/80 shadow-xs flex flex-col overflow-hidden print:border-slate-300">
            <div className="p-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Briefcase className="h-4 w-4" />
                <h3 className="font-extrabold text-xs uppercase tracking-wider">
                  Основные обязанности
                </h3>
              </div>
              <span className="px-2 py-0.5 bg-white/20 text-white text-[10px] font-black rounded-full">
                {mainList.length}
              </span>
            </div>

            <div className="p-5 flex-1 space-y-2.5">
              {mainList.length === 0 ? (
                <p className="text-xs text-slate-400 italic py-4 text-center">Пункт не заполнен</p>
              ) : (
                mainList.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-800 leading-relaxed p-2 rounded-xl hover:bg-slate-50 transition-colors">
                    <span className="h-5 w-5 rounded-full bg-blue-100 text-blue-800 font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <span className="font-medium pt-0.5">{item}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Колонка 2: Дополнительные обязанности */}
          <div className="bg-white rounded-3xl border-2 border-purple-200/80 shadow-xs flex flex-col overflow-hidden print:border-slate-300">
            <div className="p-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4" />
                <h3 className="font-extrabold text-xs uppercase tracking-wider">
                  Дополнительные
                </h3>
              </div>
              <span className="px-2 py-0.5 bg-white/20 text-white text-[10px] font-black rounded-full">
                {extraList.length}
              </span>
            </div>

            <div className="p-5 flex-1 space-y-2.5">
              {extraList.length === 0 ? (
                <p className="text-xs text-slate-400 italic py-4 text-center">Пункт не заполнен</p>
              ) : (
                extraList.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-800 leading-relaxed p-2 rounded-xl hover:bg-slate-50 transition-colors">
                    <span className="h-5 w-5 rounded-full bg-purple-100 text-purple-800 font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <span className="font-medium pt-0.5">{item}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Колонка 3: Поручения */}
          <div className="bg-white rounded-3xl border-2 border-amber-200/80 shadow-xs flex flex-col overflow-hidden print:border-slate-300">
            <div className="p-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ListTodo className="h-4 w-4" />
                <h3 className="font-extrabold text-xs uppercase tracking-wider">
                  Поручения
                </h3>
              </div>
              <span className="px-2 py-0.5 bg-white/20 text-white text-[10px] font-black rounded-full">
                {orderList.length}
              </span>
            </div>

            <div className="p-5 flex-1 space-y-2.5">
              {orderList.length === 0 ? (
                <p className="text-xs text-slate-400 italic py-4 text-center">Пункт не заполнен</p>
              ) : (
                orderList.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-800 leading-relaxed p-2 rounded-xl hover:bg-slate-50 transition-colors">
                    <span className="h-5 w-5 rounded-full bg-amber-100 text-amber-800 font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <span className="font-medium pt-0.5">{item}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}