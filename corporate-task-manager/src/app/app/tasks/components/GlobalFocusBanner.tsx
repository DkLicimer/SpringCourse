// src/app/app/tasks/components/GlobalFocusBanner.tsx
"use client";

import React, { useState, useTransition } from "react";
import { updateGlobalFocus } from "@/server/actions/focus";
import { 
  Pencil, 
  ChevronDown, 
  ChevronUp, 
  Check, 
  Target, 
  Megaphone, 
  Zap, 
  AlertCircle,
  X
} from "lucide-react";
import { useRouter } from "next/navigation";

interface GlobalFocusData {
  focusWeek?: string | null;
  staffAttention?: string | null;
  importantNow?: string | null;
  content?: string | null; // Совместимость со старым форматом
  updatedAt?: string | Date;
  updatedBy?: { name: string } | null;
}

interface GlobalFocusBannerProps {
  initialFocus: GlobalFocusData | null;
  isAdmin: boolean;
}

export function GlobalFocusBanner({ initialFocus, isAdmin }: GlobalFocusBannerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [focus, setFocus] = useState<GlobalFocusData>(() => ({
    focusWeek: initialFocus?.focusWeek || "",
    staffAttention: initialFocus?.staffAttention || "",
    importantNow: initialFocus?.importantNow || initialFocus?.content || "",
    updatedAt: initialFocus?.updatedAt,
    updatedBy: initialFocus?.updatedBy,
  }));

  const [isEditing, setIsEditing] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const [editFocusWeek, setEditFocusWeek] = useState(focus.focusWeek || "");
  const [editStaffAttention, setEditStaffAttention] = useState(focus.staffAttention || "");
  const [editImportantNow, setEditImportantNow] = useState(focus.importantNow || "");
  const [error, setError] = useState<string | null>(null);

  const hasAnyContent = Boolean(
    (focus.focusWeek && focus.focusWeek.trim()) ||
    (focus.staffAttention && focus.staffAttention.trim()) ||
    (focus.importantNow && focus.importantNow.trim())
  );

  // Если блок пуст и зашел обычный сотрудник — не занимаем место
  if (!hasAnyContent && !isAdmin && !isEditing) {
    return null;
  }

  const handleOpenEdit = () => {
    setEditFocusWeek(focus.focusWeek || "");
    setEditStaffAttention(focus.staffAttention || "");
    setEditImportantNow(focus.importantNow || "");
    setError(null);
    setIsEditing(true);
    setIsCollapsed(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      try {
        const res = await updateGlobalFocus({
          focusWeek: editFocusWeek,
          staffAttention: editStaffAttention,
          importantNow: editImportantNow,
        });

        setFocus({
          focusWeek: res.focusWeek,
          staffAttention: res.staffAttention,
          importantNow: res.importantNow,
          updatedAt: res.updatedAt,
          updatedBy: res.updatedBy,
        });
        setIsEditing(false);
        router.refresh();
      } catch (err: any) {
        setError(err.message || "Ошибка сохранения акцентов");
      }
    });
  };

  // Вспомогательный рендер списка строк
  const renderLines = (text?: string | null) => {
    if (!text || !text.trim()) return null;
    return text.split("\n").map((line, idx) => {
      const trimmed = line.trim();
      if (!trimmed) return null;
      return (
        <div key={idx} className="flex items-start gap-1.5 py-0.5 text-xs text-slate-100 leading-snug">
          <span className="h-1.5 w-1.5 rounded-full bg-blue-400 mt-1.5 shrink-0" />
          <span className="flex-1">{trimmed}</span>
        </div>
      );
    });
  };

  return (
    <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 text-white rounded-2xl shadow-md border border-blue-800/40 overflow-hidden transition-all">
      {/* Шапка баннера */}
      <div className="px-4 py-2.5 flex items-center justify-between border-b border-blue-800/30 bg-white/[0.03]">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-blue-300 font-bold text-xs uppercase tracking-wider">
            <Target className="h-4 w-4 text-blue-400" />
            <span>Главные акценты команды</span>
          </div>
          {focus.updatedAt && (
            <span className="text-[10px] text-slate-400 font-medium hidden sm:inline">
              (обновлено {new Date(focus.updatedAt).toLocaleDateString("ru-RU")})
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {isAdmin && !isEditing && (
            <button
              onClick={handleOpenEdit}
              className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-600/80 hover:bg-blue-600 text-white rounded-lg text-xs font-bold transition-all border border-blue-400/30 cursor-pointer shadow-sm"
              title="Редактировать фокусы"
            >
              <Pencil className="h-3 w-3" />
              <span>Редактировать</span>
            </button>
          )}

          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1 text-blue-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
            title={isCollapsed ? "Развернуть" : "Свернуть"}
          >
            {isCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Тело баннера */}
      {!isCollapsed && (
        <div className="p-3.5">
          {isEditing ? (
            /* ФОРМА РЕДАКТИРОВАНИЯ ТРЕХ БЛОКОВ */
            <form onSubmit={handleSave} className="space-y-3 animate-fade-in" autoComplete="off">
              {error && (
                <div className="p-2.5 bg-rose-500/20 border border-rose-500/30 rounded-xl text-xs text-rose-200 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* 1. Фокус недели */}
                <div className="bg-slate-900/80 p-3 rounded-xl border border-blue-700/40 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-extrabold text-blue-300 flex items-center gap-1.5 uppercase tracking-wide">
                      <Target className="h-3.5 w-3.5 text-blue-400" /> 1. Фокус недели
                    </label>
                    {editFocusWeek && (
                      <button
                        type="button"
                        onClick={() => setEditFocusWeek("")}
                        className="text-[10px] text-slate-400 hover:text-rose-300"
                        title="Очистить"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                  <textarea
                    rows={3}
                    placeholder="Например: Заселение первокурсников, подготовка к 1 сентября..."
                    className="w-full px-2.5 py-1.5 bg-slate-950/70 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-400 leading-relaxed"
                    value={editFocusWeek}
                    onChange={(e) => setEditFocusWeek(e.target.value)}
                  />
                </div>

                {/* 2. Внимание штата */}
                <div className="bg-slate-900/80 p-3 rounded-xl border border-amber-700/40 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-extrabold text-amber-300 flex items-center gap-1.5 uppercase tracking-wide">
                      <Megaphone className="h-3.5 w-3.5 text-amber-400" /> 2. Внимание штата
                    </label>
                    {editStaffAttention && (
                      <button
                        type="button"
                        onClick={() => setEditStaffAttention("")}
                        className="text-[10px] text-slate-400 hover:text-rose-300"
                        title="Очистить"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                  <textarea
                    rows={3}
                    placeholder="Например: Кураторы — проверить журналы и графики дежурств..."
                    className="w-full px-2.5 py-1.5 bg-slate-950/70 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 leading-relaxed"
                    value={editStaffAttention}
                    onChange={(e) => setEditStaffAttention(e.target.value)}
                  />
                </div>

                {/* 3. Важное сейчас */}
                <div className="bg-slate-900/80 p-3 rounded-xl border border-emerald-700/40 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-extrabold text-emerald-300 flex items-center gap-1.5 uppercase tracking-wide">
                      <Zap className="h-3.5 w-3.5 text-emerald-400" /> 3. Важное сейчас
                    </label>
                    {editImportantNow && (
                      <button
                        type="button"
                        onClick={() => setEditImportantNow("")}
                        className="text-[10px] text-slate-400 hover:text-rose-300"
                        title="Очистить"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                  <textarea
                    rows={3}
                    placeholder="Например: Сдать сметы на выезд до 17:00 пятницы..."
                    className="w-full px-2.5 py-1.5 bg-slate-950/70 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400 leading-relaxed"
                    value={editImportantNow}
                    onChange={(e) => setEditImportantNow(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-1">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-3 py-1.5 bg-white/10 hover:bg-white/15 text-slate-200 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex items-center gap-1 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-all shadow-sm cursor-pointer disabled:bg-blue-800"
                >
                  <Check className="h-3.5 w-3.5" />
                  {isPending ? "Сохранение..." : "Опубликовать"}
                </button>
              </div>
            </form>
          ) : hasAnyContent ? (
            /* ОТОБРАЖЕНИЕ 3 КОМПАКТНЫХ БЛОКОВ */
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Блок 1: Фокус недели */}
              {focus.focusWeek && focus.focusWeek.trim() && (
                <div className="bg-white/[0.04] border border-blue-500/30 rounded-xl p-3 flex flex-col justify-start">
                  <div className="text-[11px] font-extrabold text-blue-300 uppercase tracking-wider flex items-center gap-1.5 mb-1.5 pb-1 border-b border-blue-500/20">
                    <Target className="h-3.5 w-3.5 text-blue-400" />
                    <span>Фокус недели</span>
                  </div>
                  <div className="space-y-0.5">{renderLines(focus.focusWeek)}</div>
                </div>
              )}

              {/* Блок 2: Внимание штата */}
              {focus.staffAttention && focus.staffAttention.trim() && (
                <div className="bg-white/[0.04] border border-amber-500/30 rounded-xl p-3 flex flex-col justify-start">
                  <div className="text-[11px] font-extrabold text-amber-300 uppercase tracking-wider flex items-center gap-1.5 mb-1.5 pb-1 border-b border-amber-500/20">
                    <Megaphone className="h-3.5 w-3.5 text-amber-400" />
                    <span>Внимание штата</span>
                  </div>
                  <div className="space-y-0.5">{renderLines(focus.staffAttention)}</div>
                </div>
              )}

              {/* Блок 3: Важное сейчас */}
              {focus.importantNow && focus.importantNow.trim() && (
                <div className="bg-white/[0.04] border border-emerald-500/30 rounded-xl p-3 flex flex-col justify-start">
                  <div className="text-[11px] font-extrabold text-emerald-300 uppercase tracking-wider flex items-center gap-1.5 mb-1.5 pb-1 border-b border-emerald-500/20">
                    <Zap className="h-3.5 w-3.5 text-emerald-400" />
                    <span>Важное сейчас</span>
                  </div>
                  <div className="space-y-0.5">{renderLines(focus.importantNow)}</div>
                </div>
              )}
            </div>
          ) : (
            /* ПУСТОЙ БЛОК ДЛЯ АДМИНИСТРАТОРА */
            <div className="text-xs text-blue-200/70 italic py-1 flex items-center justify-between">
              <span>Акценты недели еще не заполнены.</span>
              {isAdmin && (
                <button
                  onClick={handleOpenEdit}
                  className="text-blue-400 hover:text-blue-200 font-bold underline not-italic text-xs cursor-pointer"
                >
                  Заполнить 3 блока фокуса
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}