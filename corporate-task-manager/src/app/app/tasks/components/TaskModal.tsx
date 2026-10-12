// src/app/app/tasks/components/TaskModal.tsx
"use client";

import React, { useState, useEffect } from "react";
import { createTask, updateTask } from "@/server/actions/tasks";
import { X, ListOrdered, Users, CheckSquare, Sparkles, RotateCcw, AlertTriangle, Clock, CalendarDays } from "lucide-react";

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingTask: any | null;
  reassignParentTask?: any | null;
  goals: any[];
  users: any[];
  isPending: boolean;
  onSaved: (msg: string) => void;
  onError: (msg: string) => void;
}

const DAYS_OF_WEEK = [
  { id: 1, label: "ПН", full: "Понедельник" },
  { id: 2, label: "ВТ", full: "Вторник" },
  { id: 3, label: "СР", full: "Среда" },
  { id: 4, label: "ЧТ", full: "Четверг" },
  { id: 5, label: "ПТ", full: "Пятница" },
  { id: 6, label: "СБ", full: "Суббота" },
  { id: 7, label: "ВС", full: "Воскресенье" },
];

function calculateNextDayOfWeek(dayId: number): string {
  const now = new Date();
  const currentDay = now.getDay() === 0 ? 7 : now.getDay();
  let daysUntil = dayId - currentDay;
  if (daysUntil <= 0) {
    daysUntil += 7;
  }
  const target = new Date(now);
  target.setDate(now.getDate() + daysUntil);
  return target.toISOString().split("T")[0];
}

export function TaskModal({
  isOpen,
  onClose,
  editingTask,
  reassignParentTask,
  goals,
  users,
  isPending,
  onSaved,
  onError,
}: TaskModalProps) {
  if (!isOpen) return null;

  const isReassign = !!reassignParentTask;
  const sourceTask = editingTask || reassignParentTask;

  const [assignmentType, setAssignmentType] = useState<"INDIVIDUAL" | "SIMULTANEOUS" | "SEQUENTIAL">(
    sourceTask ? sourceTask.assignmentType : "INDIVIDUAL"
  );
  const [selectedAssignees, setSelectedAssignees] = useState<string[]>(
    sourceTask ? sourceTask.assignments.map((as: any) => as.userId) : []
  );
  const [isPriority, setIsPriority] = useState(sourceTask ? sourceTask.isPriority : false);
  const [isRecurring, setIsRecurring] = useState(sourceTask ? sourceTask.isRecurring : false);
  
  // Регулярный день недели (1..7 или null)
  const [recurringDayOfWeek, setRecurringDayOfWeek] = useState<number | null>(
    sourceTask?.recurringDayOfWeek ?? null
  );

  const [isPerspective, setIsPerspective] = useState(sourceTask ? sourceTask.isPerspective : false);
  const [createSeparateCopies, setCreateSeparateCopies] = useState(false);

  // Умные даты: Дедлайн и Напоминание
  const todayStr = new Date().toISOString().split("T")[0];
  const [reminderDateVal, setReminderDateVal] = useState<string>(
    editingTask?.reminderDate ? editingTask.reminderDate.split("T")[0] : ""
  );
  const [deadlineVal, setDeadlineVal] = useState<string>(
    editingTask?.deadline ? editingTask.deadline.split("T")[0] : ""
  );

  const [stepInstructions, setStepInstructions] = useState<Record<string, string>>(() => {
    if (!sourceTask) return {};
    const dict: Record<string, string> = {};
    sourceTask.assignments.forEach((as: any) => {
      dict[as.userId] = as.stepInstruction || "";
    });
    return dict;
  });

  useEffect(() => {
    if (isPerspective && reminderDateVal) {
      if (!deadlineVal || deadlineVal < reminderDateVal) {
        setDeadlineVal(reminderDateVal);
      }
    }
  }, [reminderDateVal, isPerspective]);

  const handleSelectDayOfWeek = (dayId: number) => {
    if (recurringDayOfWeek === dayId) {
      setRecurringDayOfWeek(null);
    } else {
      setRecurringDayOfWeek(dayId);
      // Автоматически выставляем дедлайн на ближайший такой день
      const nextDate = calculateNextDayOfWeek(dayId);
      setDeadlineVal(nextDate);
    }
  };

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
    const deadlineValue = deadlineVal || (formData.get("deadline") as string);

    if (!deadlineValue || !deadlineValue.trim()) {
      onError("Укажите обязательный срок выполнения (дедлайн) задачи!");
      return;
    }

    const stepInstructionsArray = selectedAssignees.map((userId) => stepInstructions[userId] || "");

    const taskInput = {
      title: formData.get("title") as string,
      description: formData.get("description") as string,
      deadline: deadlineValue,
      intermediateControl: formData.get("intermediateControl") === "true",
      adminNotes: formData.get("adminNotes") as string,
      assignmentType,
      goalId: formData.get("goalId") as string,
      assigneeIds: selectedAssignees,
      isPriority,
      isRecurring,
      recurringDayOfWeek: isRecurring ? recurringDayOfWeek : null,
      isPerspective,
      reminderDate: isPerspective ? reminderDateVal : undefined,
      stepInstructions: stepInstructionsArray,
      createSeparateCopies,
      parentTaskId: isReassign ? reassignParentTask.id : undefined,
    };

    try {
      if (editingTask) {
        await updateTask(editingTask.id, taskInput);
        onSaved("Задача успешно обновлена");
      } else {
        await createTask(taskInput);
        onSaved(
          isReassign
            ? `Задача повторно назначена (связана с задачей №${reassignParentTask.taskNumber})!`
            : createSeparateCopies && selectedAssignees.length > 1
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
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[60] animate-fade-in">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-slate-200 flex flex-col max-h-[90vh] overflow-hidden">
        <div className="flex justify-between items-center px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2">
            {isReassign ? <RotateCcw className="h-5 w-5 text-orange-600" /> : null}
            <h3 className="text-lg font-bold text-slate-800">
              {isReassign
                ? `Повторное назначение задачи №${reassignParentTask.taskNumber}`
                : editingTask
                ? `Редактировать задачу: ${editingTask.title}`
                : "Добавить новую задачу"}
            </h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 cursor-pointer">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4" autoComplete="off">
          {/* Предупреждение о фиксации исходной просрочки в отчетах */}
          {isReassign && (
            <div className="p-3.5 bg-orange-50 border border-orange-200 rounded-2xl text-xs text-orange-950 flex items-start gap-2.5">
              <AlertTriangle className="h-4 w-4 text-orange-600 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <span className="font-extrabold uppercase text-[10px] block">Внимание:</span>
                <p className="leading-tight">
                  Исходная задача <strong>№{reassignParentTask.taskNumber}</strong> останется зафиксированной в отчетах как просроченная. Сейчас будет создана новая задача с новым сроком с перекрестной ссылкой на неё.
                </p>
              </div>
            </div>
          )}

          {/* Чекбоксы: Срочная / Регулярная */}
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
                <p className="text-[9px] text-slate-500">Повторяющееся дело</p>
              </div>
              <input
                type="checkbox"
                checked={isRecurring}
                onChange={(e) => {
                  setIsRecurring(e.target.checked);
                  if (!e.target.checked) setRecurringDayOfWeek(null);
                }}
                className="h-4 w-4 text-purple-600 border-slate-300 rounded focus:ring-purple-500 cursor-pointer"
              />
            </div>
          </div>

          {/* ⚡ ВЫБОР ДНЯ НЕДЕЛИ ДЛЯ РЕГУЛЯРНОЙ ЗАДАЧИ (ПУНКТ 5) */}
          {isRecurring && (
            <div className="p-3 bg-purple-50/70 border border-purple-200 rounded-xl space-y-2 animate-fade-in">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-purple-950 flex items-center gap-1.5">
                  <CalendarDays className="h-4 w-4 text-purple-600" />
                  <span>Повторять в конкретный день недели:</span>
                </label>
                {recurringDayOfWeek && (
                  <span className="text-[10px] font-bold text-purple-700 bg-white px-2 py-0.5 rounded-md border border-purple-200">
                    Каждый {DAYS_OF_WEEK.find(d => d.id === recurringDayOfWeek)?.full.toLowerCase()}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-7 gap-1.5">
                {DAYS_OF_WEEK.map((day) => {
                  const isSelected = recurringDayOfWeek === day.id;
                  return (
                    <button
                      key={day.id}
                      type="button"
                      onClick={() => handleSelectDayOfWeek(day.id)}
                      className={`py-1.5 text-xs font-black rounded-lg transition-all cursor-pointer ${
                        isSelected
                          ? "bg-purple-600 text-white shadow-xs scale-105"
                          : "bg-white text-slate-700 border border-purple-200 hover:bg-purple-100"
                      }`}
                      title={day.full}
                    >
                      {day.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Перспективная задача */}
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
              <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl space-y-1 animate-fade-in">
                <label className="block text-xs font-bold text-amber-900">
                  📅 Дата напоминания руководителю
                </label>
                <input
                  type="date"
                  name="reminderDate"
                  required
                  min={todayStr}
                  value={reminderDateVal}
                  onChange={(e) => setReminderDateVal(e.target.value)}
                  className="w-full px-3 py-2 border border-amber-300 rounded-lg text-sm bg-white focus:outline-none focus:border-amber-500 text-slate-800"
                />
              </div>
            )}
          </div>

          {/* Тема / Направление */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Тема (Направление)</label>
            <select
              name="goalId"
              required
              defaultValue={sourceTask?.goal.id || ""}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm bg-white focus:outline-none focus:border-blue-500 text-slate-800 cursor-pointer"
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
              defaultValue={sourceTask?.title || ""}
              placeholder="Например, Работа по договорам или Заседание профкома"
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:border-blue-500 text-slate-800"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Описание задачи</label>
            <textarea
              name="description"
              rows={3}
              defaultValue={sourceTask?.description || ""}
              placeholder="Общие детали, ссылки, файлы, чек-листы..."
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:border-blue-500 text-slate-800"
            />
          </div>

          {/* СРОК СДАЧИ (ДЕЙДЛАЙН) */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center gap-1">
                <Clock className="h-3.5 w-3.5 text-blue-600" />
                <span>Срок сдачи (Дедлайн) *</span>
              </label>
              <input
                type="date"
                name="deadline"
                required
                min={isPerspective && reminderDateVal ? reminderDateVal : todayStr}
                value={deadlineVal}
                onChange={(e) => setDeadlineVal(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:border-blue-500 text-slate-800 bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Промежуточный контроль</label>
              <select
                name="intermediateControl"
                defaultValue={sourceTask?.intermediateControl ? "true" : "false"}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm bg-white focus:outline-none focus:border-blue-500 text-slate-800"
              >
                <option value="false">Нет контроля</option>
                <option value="true">Требуется обратная связь / отчет</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Примечания руководителя</label>
            <input
              type="text"
              name="adminNotes"
              defaultValue={
                isReassign 
                  ? `Повторное поручение от задачи №${reassignParentTask.taskNumber}. Предыдущий дедлайн был сорван.` 
                  : sourceTask?.adminNotes || ""
              }
              placeholder="Важные акценты для исполнителей"
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:border-blue-500 text-slate-800"
            />
          </div>

          {/* Тип назначения */}
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
                  className={`px-3 py-2.5 rounded-xl border text-xs font-bold transition-all text-center cursor-pointer ${
                    assignmentType === type
                      ? "border-blue-600 bg-blue-50 text-blue-700 shadow-xs"
                      : "border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {type === "INDIVIDUAL" && "Индивидуальная"}
                  {type === "SIMULTANEOUS" && "Параллельная"}
                  {type === "SEQUENTIAL" && "Цепочка"}
                </button>
              ))}
            </div>

            {assignmentType === "INDIVIDUAL" && !editingTask && (
              <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-xl flex items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-emerald-900 block">Задача для всех (отдельные копии)</span>
                  <span className="text-[10px] text-emerald-700 leading-tight block">
                    Создаст отдельную задачу каждому выбранному сотруднику
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

          {/* Список сотрудников */}
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

            <div className="flex flex-col gap-2 max-h-60 overflow-y-auto p-2 border rounded-xl bg-slate-50">
              {users.map((u) => {
                const isSelected = selectedAssignees.includes(u.id);
                const indexInChain = selectedAssignees.indexOf(u.id);

                return (
                  <div
                    key={u.id}
                    className={`rounded-xl border transition-all p-2.5 ${
                      isSelected
                        ? "bg-white border-blue-300 shadow-xs"
                        : "bg-white/60 border-slate-200 hover:bg-white"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => toggleAssignee(u.id)}
                      className="w-full flex items-center justify-between gap-2 text-left cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={`h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                            isSelected ? "bg-blue-600 text-white" : "bg-slate-200 text-slate-600"
                          }`}
                        >
                          {assignmentType === "SEQUENTIAL" && isSelected ? indexInChain + 1 : u.initials}
                        </div>
                        <div>
                          <span className="text-xs font-bold text-slate-800">{u.name}</span>
                          {u.department && (
                            <span className="text-[10px] text-slate-400 block">{u.department}</span>
                          )}
                        </div>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          isSelected ? "bg-blue-100 text-blue-800" : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {isSelected ? "Выбран" : "Выбрать"}
                      </span>
                    </button>

                    {isSelected && (assignmentType === "SIMULTANEOUS" || assignmentType === "SEQUENTIAL") && (
                      <div className="mt-2 pt-2 border-t border-slate-100 animate-fade-in">
                        <label className="block text-[10px] font-bold text-blue-700 mb-1 flex items-center gap-1">
                          <Sparkles className="h-3 w-3 text-blue-500" />
                          {assignmentType === "SIMULTANEOUS"
                            ? `Что конкретно делает ${u.name.split(" ")[0]}? (персональное указание)`
                            : `Указание для этапа ${indexInChain + 1} (${u.name.split(" ")[0]}):`}
                        </label>
                        <input
                          type="text"
                          placeholder="Персональные указания к задаче..."
                          className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs focus:outline-none focus:border-blue-500 text-slate-800 bg-slate-50 focus:bg-white"
                          value={stepInstructions[u.id] || ""}
                          onChange={(e) =>
                            setStepInstructions((prev) => ({ ...prev, [u.id]: e.target.value }))
                          }
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-xl text-sm font-semibold cursor-pointer hover:bg-slate-50"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={isPending}
              className={`flex-1 px-4 py-2 text-white rounded-xl text-sm font-bold disabled:opacity-50 cursor-pointer shadow-xs ${
                isReassign ? "bg-orange-600 hover:bg-orange-700" : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {isReassign ? "Назначить повторно" : editingTask ? "Сохранить изменения" : "Создать задачу"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}