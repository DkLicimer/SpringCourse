// src/app/app/tasks/components/ManageGoalsModal.tsx
"use client";

import React, { useState } from "react";
import { updateGoal, deleteGoal, createGoal } from "@/server/actions/tasks";
import { X, Pencil, Trash2, Check, FolderPlus } from "lucide-react";

interface ManageGoalsModalProps {
  isOpen: boolean;
  onClose: () => void;
  goals: any[];
  isPending: boolean;
  onSuccess: (msg: string) => void;
  onError: (msg: string) => void;
}

export function ManageGoalsModal({
  isOpen,
  onClose,
  goals,
  isPending,
  onSuccess,
  onError,
}: ManageGoalsModalProps) {
  if (!isOpen) return null;

  const [newTitle, setNewTitle] = useState("");
  const [newColor, setNewColor] = useState("#3b82f6");
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editColor, setEditColor] = useState("#3b82f6");

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    try {
      await createGoal(newTitle, newColor);
      setNewTitle("");
      onSuccess("Тема успешно добавлена");
    } catch (err: any) {
      onError(err.message || "Ошибка создания темы");
    }
  };

  const handleUpdate = async (goalId: string) => {
    if (!editTitle.trim()) return;
    try {
      await updateGoal(goalId, editTitle, editColor);
      setEditingGoalId(null);
      onSuccess("Тема обновлена");
    } catch (err: any) {
      onError(err.message || "Ошибка обновления темы");
    }
  };

  const handleDelete = async (goalId: string, title: string) => {
    if (!window.confirm(`ВНИМАНИЕ! Удаление темы «${title}» удалит ВСЕ связанные с ней задачи. Продолжить?`)) {
      return;
    }
    try {
      await deleteGoal(goalId);
      onSuccess("Тема и ее задачи удалены");
    } catch (err: any) {
      onError(err.message || "Ошибка удаления темы");
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl border border-slate-200 flex flex-col max-h-[85vh]">
        <div className="flex justify-between items-center px-6 py-4 border-b border-slate-200">
          <h3 className="text-lg font-bold text-slate-800">Управление темами</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 cursor-pointer">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <form onSubmit={handleCreate} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3" autoComplete="off">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
              <FolderPlus className="h-4 w-4" /> Добавить новую тему
            </h4>
            <div className="flex gap-3 items-end">
              <div className="flex-1">
                <label className="block text-[10px] font-bold text-slate-500 mb-1">Название темы</label>
                <input
                  type="text"
                  required
                  placeholder="Например, Оформление документов, Стипендии..."
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs focus:outline-none focus:border-blue-500 text-slate-800"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                />
              </div>
              <div className="w-14 shrink-0">
                <label className="block text-[10px] font-bold text-slate-500 mb-1">Цвет</label>
                <input
                  type="color"
                  className="h-8 w-full border rounded cursor-pointer"
                  value={newColor}
                  onChange={(e) => setNewColor(e.target.value)}
                />
              </div>
              <button
                type="submit"
                disabled={isPending}
                className="px-3.5 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer shrink-0 disabled:bg-blue-400"
              >
                Создать
              </button>
            </div>
          </form>

          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Существующие темы</h4>
            <div className="space-y-2">
              {goals.map((g) => {
                const isEditing = editingGoalId === g.id;
                return (
                  <div key={g.id} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl gap-3">
                    {isEditing ? (
                      <div className="flex items-center gap-2 flex-1">
                        <input
                          type="color"
                          className="h-8 w-10 border rounded cursor-pointer shrink-0"
                          value={editColor}
                          onChange={(e) => setEditColor(e.target.value)}
                        />
                        <input
                          type="text"
                          required
                          className="flex-1 px-2.5 py-1 border border-slate-300 rounded-lg text-xs focus:outline-none focus:border-blue-500 text-slate-800"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                        />
                        <button
                          type="button"
                          onClick={() => handleUpdate(g.id)}
                          className="p-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors cursor-pointer"
                        >
                          <Check className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingGoalId(null)}
                          className="p-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg transition-colors cursor-pointer"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-3">
                          <span className="h-3.5 w-3.5 rounded-full shrink-0 shadow-sm" style={{ backgroundColor: g.color }} />
                          <span className="font-semibold text-slate-800 text-sm">{g.title}</span>
                          {g.isTemplate && (
                            <span className="text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full font-medium">
                              Системная
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => {
                              setEditingGoalId(g.id);
                              setEditTitle(g.title);
                              setEditColor(g.color);
                            }}
                            className="p-1.5 hover:bg-slate-200 text-slate-500 hover:text-slate-800 rounded-lg transition-colors cursor-pointer"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          {!g.isTemplate && (
                            <button
                              onClick={() => handleDelete(g.id, g.title)}
                              className="p-1.5 hover:bg-red-50 text-red-500 hover:text-red-700 rounded-lg transition-colors cursor-pointer"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-sm font-semibold transition-colors cursor-pointer"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
}