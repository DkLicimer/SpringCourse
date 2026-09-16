// src/app/app/tasks/components/GlobalFocusBanner.tsx
"use client";

import React, { useState, useTransition } from "react";
import { updateGlobalFocus } from "@/server/actions/focus";
import { 
  Pin, 
  Pencil, 
  X, 
  Check, 
  ChevronDown, 
  ChevronUp, 
  Sparkles, 
  Calendar, 
  CheckCircle2, 
  AlertCircle 
} from "lucide-react";
import { useRouter } from "next/navigation";

interface GlobalFocusData {
  title: string;
  content: string;
  updatedAt?: string | Date;
  updatedBy?: { name: string } | null;
}

interface GlobalFocusBannerProps {
  initialFocus: GlobalFocusData | null;
  isAdmin: boolean;
}

const PRESET_TITLES = [
  "Важное сейчас",
  "Фокус недели",
  "Главные акценты",
  "Внимание штата",
  "Цель на сегодня"
];

export function GlobalFocusBanner({ initialFocus, isAdmin }: GlobalFocusBannerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [focus, setFocus] = useState<GlobalFocusData>(() => ({
    title: initialFocus?.title || "Важное сейчас",
    content: initialFocus?.content || "",
    updatedAt: initialFocus?.updatedAt,
    updatedBy: initialFocus?.updatedBy,
  }));

  const [isEditing, setIsEditing] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const [editTitle, setEditTitle] = useState(focus.title);
  const [editContent, setEditContent] = useState(focus.content);
  const [error, setError] = useState<string | null>(null);

  // Если текста нет и это не админ — баннер не занимает лишнее место
  if (!focus.content.trim() && !isAdmin && !isEditing) {
    return null;
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      try {
        const res = await updateGlobalFocus(editTitle, editContent);
        setFocus({
          title: res.title,
          content: res.content,
          updatedAt: res.updatedAt,
          updatedBy: res.updatedBy,
        });
        setIsEditing(false);
        router.refresh();
      } catch (err: any) {
        setError(err.message || "Ошибка сохранения");
      }
    });
  };

  const handleOpenEdit = () => {
    setEditTitle(focus.title);
    setEditContent(focus.content);
    setError(null);
    setIsEditing(true);
  };

  return (
    <div className="bg-gradient-to-r from-blue-900 via-slate-900 to-indigo-950 text-white rounded-2xl shadow-lg border border-blue-800/40 overflow-hidden transition-all">
      {/* Шапка баннера */}
      <div className="px-5 py-3.5 flex items-center justify-between border-b border-blue-800/30 bg-white/[0.03]">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-blue-500/20 text-blue-400 rounded-lg border border-blue-400/20">
            <Pin className="h-4 w-4 transform -rotate-45" />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-extrabold text-sm sm:text-base text-blue-100 tracking-wide">
              {focus.title}
            </h3>
            {focus.updatedAt && (
              <span className="text-[10px] text-blue-300/70 font-medium hidden sm:inline">
                (обновлено {new Date(focus.updatedAt).toLocaleDateString("ru-RU")})
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {isAdmin && !isEditing && (
            <button
              onClick={handleOpenEdit}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600/80 hover:bg-blue-600 text-white rounded-lg text-xs font-bold transition-all border border-blue-400/30 cursor-pointer shadow-sm"
              title="Редактировать важное"
            >
              <Pencil className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Редактировать</span>
            </button>
          )}

          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 text-blue-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
            title={isCollapsed ? "Развернуть" : "Свернуть"}
          >
            {isCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Тело баннера */}
      {!isCollapsed && (
        <div className="p-5">
          {isEditing ? (
            <form onSubmit={handleSave} className="space-y-4 animate-fade-in" autoComplete="off">
              {error && (
                <div className="p-3 bg-rose-500/20 border border-rose-500/30 rounded-xl text-xs text-rose-200 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Выбор пресетов заголовка */}
              <div>
                <label className="block text-[11px] font-bold text-blue-200 uppercase tracking-wider mb-1.5">
                  Заголовок блока
                </label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {PRESET_TITLES.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setEditTitle(t)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all cursor-pointer ${
                        editTitle === t
                          ? "bg-blue-600 border-blue-400 text-white shadow-sm"
                          : "bg-white/5 border-white/10 text-blue-200 hover:bg-white/10"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  required
                  placeholder="Например, Важное сейчас / Фокус недели"
                  className="w-full px-3 py-2 bg-slate-900/90 border border-blue-700/50 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-blue-400 placeholder-slate-500"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                />
              </div>

              {/* Текст объявления */}
              <div>
                <label className="block text-[11px] font-bold text-blue-200 uppercase tracking-wider mb-1.5">
                  Ключевые пункты и задачи (каждый пункт с новой строки)
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder={`1. Заселение первокурсников — кураторам проверить списки\n2. Сдать сметы на выездной тимбилдинг до пятницы\n3. Подготовить посты для Дня Знаний`}
                  className="w-full px-3.5 py-2.5 bg-slate-900/90 border border-blue-700/50 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-blue-400 placeholder-slate-500 leading-relaxed font-sans"
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                />
              </div>

              <div className="flex gap-2 justify-end pt-1">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 bg-white/10 hover:bg-white/15 text-slate-200 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer disabled:bg-blue-800"
                >
                  <Check className="h-4 w-4" />
                  {isPending ? "Сохранение..." : "Опубликовать для всех"}
                </button>
              </div>
            </form>
          ) : focus.content.trim() ? (
            <div className="space-y-2">
              <div className="text-xs sm:text-sm text-blue-50 leading-relaxed whitespace-pre-line font-medium">
                {focus.content.split("\n").map((line, index) => {
                  const trimmed = line.trim();
                  if (!trimmed) return null;
                  return (
                    <div key={index} className="flex items-start gap-2 py-0.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-blue-400 mt-2 shrink-0 shadow-sm shadow-blue-400/50" />
                      <span className="flex-1">{trimmed}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="text-xs text-blue-300/60 italic py-2 flex items-center justify-between">
              <span>Главные акценты недели пока не заданы.</span>
              {isAdmin && (
                <button
                  onClick={handleOpenEdit}
                  className="text-blue-400 hover:text-blue-200 font-bold underline not-italic text-xs cursor-pointer"
                >
                  Написать важное для штата
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}