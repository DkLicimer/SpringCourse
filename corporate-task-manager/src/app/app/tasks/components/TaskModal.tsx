// src/app/app/tasks/components/TaskModal.tsx
"use client";

import React, { useState } from "react";
import { createTask, updateTask } from "@/server/actions/tasks";
import { X, ListOrdered, Users } from "lucide-react";

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingTask: any | null;
  goals: any[];
  users: any[];
  isPending: boolean;
  onSaved: (msg: string) => void;
  onError: (msg: string) => void;
}

export function TaskModal({
  isOpen,
  onClose,
  editingTask,
  goals,
  users,
  isPending,
  onSaved,
  onError,
}: TaskModalProps) {
  if (!isOpen) return null;

  const [assignmentType, setAssignmentType] = useState<"INDIVIDUAL" | "SIMULTANEOUS" | "SEQUENTIAL">(
    editingTask ? editingTask.assignmentType : "INDIVIDUAL"
  );
  const [selectedAssignees, setSelectedAssignees] = useState<string[]>(
    editingTask ? editingTask.assignments.map((as: any) => as.userId) : []
  );
  const [isPriority, setIsPriority] = useState(editingTask ? editingTask.isPriority : false);
  const [isRecurring, setIsRecurring] = useState(editingTask ? editingTask.isRecurring : false);
  const [isPerspective, setIsPerspective] = useState(editingTask ? editingTask.isPerspective : false);
  const [createSeparateCopies, setCreateSeparateCopies] = useState(false);

  const [stepInstructions, setStepInstructions] = useState<Record<string, string>>(() => {
    if (!editingTask) return {};
    const dict: Record<string, string> = {};
    editingTask.assignments.forEach((as: any) => {
      dict[as.userId] = as.stepInstruction || "";
    });
    return dict;
  });

  const todayStr = new Date().toISOString().split("T")[0];

  const toggleAssignee = (userId: string) => {
    if (assignmentType === "INDIVIDUAL" && !createSeparateCopies) {
      setSelectedAssignees([userId]);
    } else {
      setSelectedAssignees((prev) =>
        prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
      );
    }
  };

  const handleSelectAll = () => {
    setSelectedAssignees(users.map((u) => u.id));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (selectedAssignees.length === 0) {
      onError("Выберите хотя бы одного исполнителя");
      return;
    }

    const formData = new FormData(e.currentTarget);
    const stepInstructionsArray = selectedAssignees.map((userId) => stepInstructions[userId] || "");

    const taskInput = {
      title: formData.get("title") as string,
      description: formData.get("description") as string,
      deadline: formData.get("deadline") as string,
      intermediateControl: formData.get("intermediateControl") === "true",
      adminNotes: formData.get("adminNotes") as string,
      assignmentType,
      goalId: formData.get("goalId") as string,
      assigneeIds: selectedAssignees,
      isPriority,
      isRecurring,
      isPerspective,
      reminderDate: isPerspective ? (formData.get("reminderDate") as string) : undefined,
      stepInstructions: stepInstructionsArray,
      createSeparateCopies,
    };

    try {
      if (editingTask) {
        await updateTask(editingTask.id, taskInput);
        onSaved("Задача успешно обновлена");
      } else {
        await createTask(taskInput);
        onSaved(
          createSeparateCopies && selectedAssignees.length > 1
            ? `Создано ${selectedAssignees.length} индивидуальных задач для каждого сотрудника!`
            : "Новая задача успешно создана!"
        );
      }
      onClose();
    } catch (err: any) {
      onError(err.message || "Ошибка сохранения задачи");
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl border border-slate-200 flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center px-6 py-4 border-b border-slate-200">
          <h3 className="text-lg font-bold text-slate-800">
            {editingTask ? `Редактировать задачу: ${editingTask.title}` : "Добавить новую задачу"}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 cursor-pointer">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4" autoComplete="off">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center justify-between p-3 bg-red-50/50 border border-red-100 rounded-xl">
              <div className="space-y-0.5">
                <h4 className="text-[11px] font-bold text-slate-800 uppercase tracking-wide">Срочная</h4>
                <p className="text-[9px] text-slate-500">Закрепить вверху</p>
              </div>
              <input
                type="checkbox"
                checked={isPriority}
                onChange={(e) => setIsPriority(e.target.checked)}
                className="h-4 w-4 text-red-600 border-slate-300 rounded focus:ring-red-500 cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-purple-50/50 border border-purple-100 rounded-xl">
              <div className="space-y-0.5">
                <h4 className="text-[11px] font-bold text-slate-800 uppercase tracking-wide">Регулярная</h4>
                <p className="text-[9px] text-slate-500">Маркер повтора</p>
              </div>
              <input
                type="checkbox"
                checked={isRecurring}
                onChange={(e) => setIsRecurring(e.target.checked)}
                className="h-4 w-4 text-purple-600 border-slate-300 rounded focus:ring-purple-500 cursor-pointer"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3">
            <div className="flex items-center justify-between p-3 bg-blue-50/30 border border-blue-100 rounded-xl">
              <div className="space-y-0.5">
                <h4 className="text-[11px] font-bold text-slate-800 uppercase tracking-wide">Внести на перспективу</h4>
                <p className="text-[9px] text-slate-500">Отложить запуск исполнителям</p>
              </div>
              <input
                type="checkbox"
                checked={isPerspective}
                onChange={(e) => setIsPerspective(e.target.checked)}
                className="h-4 w-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500 cursor-pointer"
              />
            </div>

            {isPerspective && (
              <div className="p-3 bg-amber-50/50 border border-amber-100 rounded-xl animate-fade-in">
                <label className="block text-xs font-semibold text-slate-700 mb-1">Дата напоминания</label>
                <input
                  type="date"
                  name="reminderDate"
                  required
                  min={todayStr}
                  defaultValue={editingTask?.reminderDate ? editingTask.reminderDate.split("T")[0] : ""}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 text-slate-800"
                />
              </div>
            )}
          </div>

          {/* Тема (бывшая цель) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Тема (Направление)</label>
            <select
              name="goalId"
              required
              defaultValue={editingTask?.goal.id || ""}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:border-blue-500 text-slate-800 cursor-pointer"
            >
              {goals.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Название задачи</label>
            <input
              type="text"
              name="title"
              required
              defaultValue={editingTask?.title || ""}
              placeholder="Например, Заполнить отчет по инфополям"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 text-slate-800"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Описание задачи</label>
            <textarea
              name="description"
              rows={3}
              defaultValue={editingTask?.description || ""}
              placeholder="Опишите суть работы, ссылки и чек-листы..."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 text-slate-800"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Дедлайн</label>
              <input
                type="date"
                name="deadline"
                min={todayStr}
                defaultValue={editingTask?.deadline ? editingTask.deadline.split("T")[0] : ""}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 text-slate-800"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Промежуточный контроль</label>
              <select
                name="intermediateControl"
                defaultValue={editingTask?.intermediateControl ? "true" : "false"}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:border-blue-500 text-slate-800"
              >
                <option value="false">Нет контроля</option>
                <option value="true">Требуется текстовый отчет</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Примечания руководителя</label>
            <input
              type="text"
              name="adminNotes"
              defaultValue={editingTask?.adminNotes || ""}
              placeholder="Важные акценты для исполнителей"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 text-slate-800"
            />
          </div>

          <div className="border-t border-slate-200 pt-4 space-y-3">
            <label className="block text-xs font-semibold text-slate-700 mb-1">Тип назначения</label>
            <div className="grid grid-cols-3 gap-2">
              {(["INDIVIDUAL", "SIMULTANEOUS", "SEQUENTIAL"] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => {
                    setAssignmentType(type);
                    if (type !== "INDIVIDUAL") setCreateSeparateCopies(false);
                    setSelectedAssignees([]);
                    setStepInstructions({});
                  }}
                  className={`px-3 py-2.5 rounded-lg border text-xs font-bold transition-all text-center cursor-pointer ${
                    assignmentType === type
                      ? "border-blue-600 bg-blue-50 text-blue-700"
                      : "border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {type === "INDIVIDUAL" && "Индивидуальная"}
                  {type === "SIMULTANEOUS" && "Параллельная"}
                  {type === "SEQUENTIAL" && "Цепочка"}
                </button>
              ))}
            </div>

            {/* ⚡ ОПЦИЯ «ЗАДАЧА ДЛЯ ВСЕХ / КЛОНИРОВАНИЕ» */}
            {assignmentType === "INDIVIDUAL" && !editingTask && (
              <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-xl flex items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-emerald-900 block">Задача для всех (отдельные копии)</span>
                  <span className="text-[10px] text-emerald-700 leading-tight block">
                    Создаст отдельную индивидуальную задачу каждому выбранному сотруднику
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={createSeparateCopies}
                  onChange={(e) => {
                    setCreateSeparateCopies(e.target.checked);
                    if (!e.target.checked && selectedAssignees.length > 1) {
                      setSelectedAssignees([selectedAssignees[0]]);
                    }
                  }}
                  className="h-4 w-4 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500 cursor-pointer"
                />
              </div>
            )}
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-semibold text-slate-700">Выберите исполнителей</label>
              {(assignmentType !== "INDIVIDUAL" || createSeparateCopies) && (
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="text-[11px] font-bold text-blue-600 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Users className="h-3.5 w-3.5" /> Выбрать всех ({users.length})
                </button>
              )}
            </div>

            <div className="flex flex-wrap gap-2 max-h-56 overflow-y-auto p-1 border rounded-lg bg-slate-50">
              {users.map((u) => {
                const isSelected = selectedAssignees.includes(u.id);
                const indexInChain = selectedAssignees.indexOf(u.id);

                return (
                  <div key={u.id} className="w-full flex flex-col gap-1.5 p-1">
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => toggleAssignee(u.id)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border flex items-center justify-between gap-1.5 transition-all cursor-pointer ${
                        isSelected
                          ? "bg-blue-600 border-blue-600 text-white"
                          : "bg-white border-slate-200 text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      <span>{u.name} {u.department ? `(${u.department})` : ""}</span>
                      {assignmentType === "SEQUENTIAL" && isSelected && (
                        <span className="bg-blue-800 text-white text-[10px] h-4 w-4 rounded-full flex items-center justify-center font-bold">
                          {indexInChain + 1}
                        </span>
                      )}
                    </button>
                    
                    {assignmentType === "SEQUENTIAL" && isSelected && (
                      <div className="pl-4">
                        <input
                          type="text"
                          placeholder={`Указание для этапа ${indexInChain + 1}: Что должен сделать ${u.name.split(" ")[0]}?`}
                          className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-[11px] focus:outline-none focus:border-blue-500 text-slate-800 bg-white"
                          value={stepInstructions[u.id] || ""}
                          onChange={(e) => setStepInstructions(prev => ({ ...prev, [u.id]: e.target.value }))}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {assignmentType === "SEQUENTIAL" && selectedAssignees.length > 0 && (
              <div className="mt-3 text-xs bg-blue-50 text-blue-800 p-3 rounded-lg border border-blue-100 space-y-1">
                <div className="font-bold flex items-center gap-1"><ListOrdered className="h-4 w-4" /> Порядок цепочки:</div>
                <div className="text-[11px] font-medium">
                  {selectedAssignees.map((id, index) => {
                    const name = users.find((u) => u.id === id)?.name;
                    return (
                      <span key={id}>
                        {index > 0 && " → "}
                        <span className="font-bold">{name}</span>
                        {index === 0 && " (Сразу)"}
                        {index > 0 && " (Ожидает)"}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-sm cursor-pointer"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold disabled:bg-blue-400 cursor-pointer"
            >
              {editingTask ? "Сохранить изменения" : "Создать задачу"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}