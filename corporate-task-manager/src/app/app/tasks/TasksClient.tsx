// src/app/app/tasks/TasksClient.tsx
"use client";

import React, { useState, useTransition } from "react";
import { 
  createGoal, 
  createTask, 
  updateAssignmentStatus,
  updateGoal,
  deleteGoal,
  addComment,
  createTaskStatus,
  deleteTaskStatus,
  updateTask
} from "@/server/actions/tasks";
import { 
  Plus, 
  FolderPlus, 
  Lock, 
  Unlock, 
  Clock, 
  CheckCircle2, 
  Eye, 
  AlertCircle,
  X,
  ListOrdered,
  Settings,
  Pencil,
  Trash2,
  Check,
  Send,
  Sliders,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { useRouter } from "next/navigation";

type Goal = {
  id: string;
  title: string;
  color: string;
  isTemplate: boolean;
};

type TaskStatus = {
  id: string;
  name: string;
  color: string | null;
  isDefault: boolean;
};

type Comment = {
  id: string;
  text: string;
  createdAt: string;
  user: { name: string; initials: string };
};

type Assignment = {
  id: string;
  userId: string;
  sequenceOrder: number;
  isBlocked: boolean;
  completedAt: string | null;
  statusId: string;
  user: { name: string; initials: string };
  status: TaskStatus;
};

type Task = {
  id: string;
  title: string;
  description: string | null;
  deadline: string | null;
  intermediateControl: boolean;
  controlReport: string | null;
  adminNotes: string | null;
  assignmentType: "INDIVIDUAL" | "SIMULTANEOUS" | "SEQUENTIAL";
  isPriority: boolean; // Добавляем приоритет
  goal: Goal;
  assignments: Assignment[];
  comments: Comment[];
};

interface TasksClientProps {
  initialTasks: Task[];
  goals: Goal[];
  users: { id: string; name: string; initials: string }[];
  statuses: TaskStatus[];
  currentUserId: string;
  isAdmin: boolean;
  currentPage: number; // Пагинация
  totalPages: number;  // Пагинация
}

export function TasksClient({
  initialTasks,
  goals,
  users,
  statuses,
  currentUserId,
  isAdmin,
  currentPage,
  totalPages,
}: TasksClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isGoalOpen, setIsGoalOpen] = useState(false);
  const [isManageGoalsOpen, setIsManageGoalsOpen] = useState(false);
  const [isManageStatusesOpen, setIsManageStatusesOpen] = useState(false);
  const [isTaskOpen, setIsTaskOpen] = useState(false);
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  // Состояние свернутых/развернутых описаний задач в списке (Пункт 5)
  const [expandedTaskIds, setExpandedTaskIds] = useState<string[]>([]);

  // Состояние редактирования задачи
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // Стейты новой цели
  const [goalTitle, setGoalTitle] = useState("");
  const [goalColor, setGoalColor] = useState("#3b82f6");

  // Стейты редактирования цели
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);
  const [editGoalTitle, setEditGoalTitle] = useState("");
  const [editGoalColor, setEditGoalColor] = useState("#3b82f6");

  // Стейты нового кастомного статуса
  const [newStatusName, setNewStatusName] = useState("");
  const [newStatusColor, setNewStatusColor] = useState("#3b82f6");

  // Стейт нового комментария
  const [commentText, setCommentText] = useState("");

  // Специфические стейты для создания/редактирования задачи
  const [selectedAssignees, setSelectedAssignees] = useState<string[]>([]);
  const [assignmentType, setAssignmentType] = useState<"INDIVIDUAL" | "SIMULTANEOUS" | "SEQUENTIAL">("INDIVIDUAL");
  const [isPriority, setIsPriority] = useState(false); // Стейт приоритета

  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      try {
        await createGoal(goalTitle, goalColor);
        setGoalTitle("");
        setIsGoalOpen(false);
        router.refresh();
      } catch (err: any) {
        alert(err.message || "Ошибка создания цели");
      }
    });
  };

  const handleUpdateGoal = async (goalId: string) => {
    if (!editGoalTitle.trim()) {
      alert("Название цели не может быть пустым");
      return;
    }
    startTransition(async () => {
      try {
        await updateGoal(goalId, editGoalTitle, editGoalColor);
        setEditingGoalId(null);
        router.refresh();
      } catch (err: any) {
        alert(err.message || "Ошибка обновления цели");
      }
    });
  };

  const handleDeleteGoal = async (goalId: string, title: string) => {
    if (
      !window.confirm(
        `ВНИМАНИЕ! Удаление цели "${title}" приведет к БЕЗВОЗВРАТНОМУ удалению ВСЕХ привязанных к ней задач! Вы уверены?`
      )
    ) {
      return;
    }
    startTransition(async () => {
      try {
        await deleteGoal(goalId);
        router.refresh();
      } catch (err: any) {
        alert(err.message || "Ошибка удаления цели");
      }
    });
  };

  const handleCreateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStatusName.trim()) return;

    startTransition(async () => {
      try {
        await createTaskStatus(newStatusName, newStatusColor);
        setNewStatusName("");
        router.refresh();
      } catch (err: any) {
        alert(err.message || "Ошибка создания статуса");
      }
    });
  };

  const handleDeleteStatus = async (statusId: string, name: string) => {
    if (!window.confirm(`Вы уверены, что хотите полностью удалить статус "${name}"?`)) return;

    startTransition(async () => {
      try {
        await deleteTaskStatus(statusId);
        router.refresh();
      } catch (err: any) {
        alert(err.message || "Ошибка удаления статуса");
      }
    });
  };

  const openCreateTaskModal = () => {
    setEditingTask(null);
    setAssignmentType("INDIVIDUAL");
    setSelectedAssignees([]);
    setIsPriority(false);
    setIsTaskOpen(true);
  };

  const openEditTaskModal = (task: Task, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingTask(task);
    setAssignmentType(task.assignmentType);
    setSelectedAssignees(task.assignments.map(as => as.userId));
    setIsPriority(task.isPriority);
    setIsTaskOpen(true);
  };

  const handleSaveTask = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (selectedAssignees.length === 0) {
      alert("Выберите хотя бы одного исполнителя");
      return;
    }

    const formData = new FormData(e.currentTarget);
    const taskInput = {
      title: formData.get("title") as string,
      description: formData.get("description") as string,
      deadline: formData.get("deadline") as string,
      intermediateControl: formData.get("intermediateControl") === "true",
      adminNotes: formData.get("adminNotes") as string,
      assignmentType,
      goalId: formData.get("goalId") as string,
      assigneeIds: selectedAssignees,
      isPriority, // Сохраняем приоритет
    };

    startTransition(async () => {
      try {
        if (editingTask) {
          await updateTask(editingTask.id, taskInput);
        } else {
          await createTask(taskInput);
        }
        setSelectedAssignees([]);
        setIsTaskOpen(false);
        router.refresh();
      } catch (err: any) {
        alert(err.message || "Ошибка сохранения задачи");
      }
    });
  };

  const handleStatusChange = async (assignmentId: string, newStatusId: string) => {
    startTransition(async () => {
      try {
        await updateAssignmentStatus(assignmentId, newStatusId);
        router.refresh();
        if (activeTask) {
          const updated = initialTasks.find(t => t.id === activeTask.id);
          if (updated) setActiveTask(updated);
        }
      } catch (err: any) {
        alert(err.message || "Не удалось изменить статус");
      }
    });
  };

  const handleSendComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    const tempCommentText = commentText;
    setCommentText("");

    const optimisticComment: Comment = {
      id: `temp-${Date.now()}`,
      text: tempCommentText,
      createdAt: new Date().toISOString(),
      user: {
        name: "Вы",
        initials: "Вы"
      }
    };

    if (activeTask) {
      setActiveTask({
        ...activeTask,
        comments: [...activeTask.comments, optimisticComment]
      });
    }

    startTransition(async () => {
      try {
        await addComment(activeTask!.id, tempCommentText);
        router.refresh();
        const updatedTask = initialTasks.find(t => t.id === activeTask!.id);
        if (updatedTask) {
          setActiveTask(updatedTask);
        }
      } catch (err: any) {
        alert(err.message || "Не удалось отправить комментарий");
        const originalTask = initialTasks.find(t => t.id === activeTask!.id);
        if (originalTask) {
          setActiveTask(originalTask);
        }
      }
    });
  };

  const toggleAssignee = (userId: string) => {
    if (assignmentType === "INDIVIDUAL") {
      setSelectedAssignees([userId]);
    } else {
      setSelectedAssignees((prev) =>
        prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
      );
    }
  };

  const handleTypeChange = (type: "INDIVIDUAL" | "SIMULTANEOUS" | "SEQUENTIAL") => {
    setAssignmentType(type);
    setSelectedAssignees([]);
  };

  const startEditingGoal = (goal: Goal) => {
    setEditingGoalId(goal.id);
    setEditGoalTitle(goal.title);
    setEditGoalColor(goal.color);
  };

  const toggleExpandTask = (taskId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedTaskIds(prev =>
      prev.includes(taskId) ? prev.filter(id => id !== taskId) : [...prev, taskId]
    );
  };

  // Переключение страниц в пагинации (Пункт 7)
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      router.push(`/app/tasks?page=${newPage}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Шапка модуля задач */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 print:hidden">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Задачи и цели</h2>
          <p className="text-slate-500 text-sm">Оперативное управление задачами и глобальными направлениями</p>
        </div>

        {isAdmin && (
          <div className="flex flex-wrap gap-2 w-full md:w-auto">
            <button
              onClick={() => setIsManageStatusesOpen(true)}
              className="flex items-center justify-center gap-2 border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 px-3.5 py-2 rounded-lg text-sm font-semibold transition-colors cursor-pointer"
              title="Управление статусами"
            >
              <Sliders className="h-4 w-4 text-slate-500" />
              Статусы
            </button>
            <button
              onClick={() => setIsManageGoalsOpen(true)}
              className="flex items-center justify-center gap-2 border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 px-3.5 py-2 rounded-lg text-sm font-semibold transition-colors cursor-pointer"
              title="Управление целями"
            >
              <Settings className="h-4 w-4 text-slate-500" />
              Цели
            </button>
            <button
              onClick={() => setIsGoalOpen(true)}
              className="flex items-center justify-center gap-2 border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 px-3.5 py-2 rounded-lg text-sm font-semibold transition-colors cursor-pointer"
            >
              <FolderPlus className="h-4 w-4 text-slate-500" />
              Добавить цель
            </button>
            <button
              onClick={openCreateTaskModal}
              className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors shadow-sm cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              Добавить задачу
            </button>
          </div>
        )}
      </div>

      {/* РЕНДЕР ДЛЯ АДМИНИСТРАТОРА */}
      {isAdmin && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="p-5 border-b border-slate-200 bg-slate-50">
            <h3 className="font-bold text-slate-800">Все задачи организации</h3>
          </div>
          <div className="divide-y divide-slate-100">
            {initialTasks.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-sm">Задач пока нет</div>
            ) : (
              initialTasks.map((task) => {
                const isExpanded = expandedTaskIds.includes(task.id);

                return (
                  <div key={task.id} className="p-5 hover:bg-slate-50/50 transition-colors flex flex-col md:flex-row justify-between gap-4">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span
                          className="px-2.5 py-0.5 rounded-full text-xs font-semibold text-white"
                          style={{ backgroundColor: task.goal.color }}
                        >
                          {task.goal.title}
                        </span>
                        <span className="text-xs text-slate-400 font-medium">
                          {task.assignmentType === "SEQUENTIAL" && "Последовательная"}
                          {task.assignmentType === "SIMULTANEOUS" && "Параллельная"}
                          {task.assignmentType === "INDIVIDUAL" && "Индивидуальная"}
                        </span>
                        {task.isPriority && (
                          <span className="text-[10px] bg-red-100 text-red-700 border border-red-200 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider animate-pulse">
                            Срочно
                          </span>
                        )}
                      </div>
                      <h4 className="font-bold text-slate-900 text-base">{task.title}</h4>
                      
                      {/* Сворачиваемое описание задачи (Пункт 5) */}
                      {task.description && (
                        <div className="space-y-1">
                          <p className={`text-sm text-slate-500 leading-relaxed ${isExpanded ? "" : "line-clamp-1"}`}>
                            {task.description}
                          </p>
                          <button
                            onClick={(e) => toggleExpandTask(task.id, e)}
                            className="text-[10px] text-blue-600 font-bold hover:underline flex items-center gap-0.5 cursor-pointer"
                          >
                            {isExpanded ? (
                              <>Свернуть описание <ChevronUp className="h-3 w-3" /></>
                            ) : (
                              <>Развернуть описание <ChevronDown className="h-3 w-3" /></>
                            )}
                          </button>
                        </div>
                      )}

                      {task.deadline && (
                        <div className="text-xs text-slate-400 flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" /> Дедлайн: {new Date(task.deadline).toLocaleDateString("ru-RU")}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 md:w-80 justify-end">
                      {task.assignments.map((as) => (
                        <div
                          key={as.id}
                          className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs"
                        >
                          <div className="h-6 w-6 rounded-full bg-slate-200 text-slate-700 font-bold flex items-center justify-center">
                            {as.user.initials}
                          </div>
                          <div>
                            <div className="font-medium text-slate-700">{as.user.name}</div>
                            <div className="flex items-center gap-1 text-[10px] text-slate-500">
                              {as.isBlocked ? (
                                <span className="flex items-center text-red-500 gap-0.5"><Lock className="h-2.5 w-2.5" /> Ожидает</span>
                              ) : (
                                <span>{as.status.name}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                      <div className="flex gap-1">
                        <button
                          onClick={(e) => openEditTaskModal(task, e)}
                          className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                          title="Редактировать задачу"
                        >
                          <Pencil className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => setActiveTask(task)}
                          className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                          title="Просмотреть детали"
                        >
                          <Eye className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* РЕНДЕР ДЛЯ СОТРУДНИКА */}
      {!isAdmin && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
          {statuses.map((status) => {
            const myTasks = initialTasks.filter((task) => {
              const myAssignment = task.assignments.find((as) => as.userId === currentUserId);
              return myAssignment?.statusId === status.id;
            });

            return (
              <div key={status.id} className="flex flex-col bg-slate-100 rounded-2xl p-4 min-h-[500px]">
                <div className="flex items-center justify-between mb-4 px-2">
                  <h3 className="font-bold text-slate-700 text-sm">{status.name}</h3>
                  <span className="bg-white text-slate-600 font-bold text-xs px-2 py-0.5 rounded-full border border-slate-200">
                    {myTasks.length}
                  </span>
                </div>

                <div className="space-y-3 flex-1 overflow-y-auto">
                  {myTasks.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-xs text-slate-400 py-12">Нет задач</div>
                  ) : (
                    myTasks.map((task) => {
                      const myAs = task.assignments.find(as => as.userId === currentUserId)!;
                      return (
                        <div
                          key={task.id}
                          onClick={() => setActiveTask(task)}
                          className={`bg-white rounded-xl p-4 shadow-sm border-l-4 hover:shadow transition-all cursor-pointer relative ${
                            task.isPriority ? "ring-2 ring-red-500/10" : ""
                          }`}
                          style={{ borderLeftColor: task.goal.color }}
                        >
                          <div className="flex justify-between items-start gap-2">
                            <span className="text-[10px] text-slate-400 font-semibold bg-slate-50 px-2 py-0.5 rounded border">
                              {task.goal.title}
                            </span>
                            <div className="flex items-center gap-1">
                              {task.isPriority && (
                                <span className="text-red-600 font-bold text-[9px] uppercase tracking-wider">Срочно</span>
                              )}
                              {myAs.isBlocked && (
                                <span className="text-red-600 flex items-center gap-0.5 text-[10px] font-bold">
                                  <Lock className="h-3 w-3" /> Ожидает
                                </span>
                              )}
                            </div>
                          </div>
                          <h4 className="font-bold text-slate-800 text-sm mt-2">{task.title}</h4>
                          {task.description && <p className="text-xs text-slate-500 mt-1 line-clamp-2">{task.description}</p>}
                          
                          <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-100 text-[10px] text-slate-400">
                            <span>{task.assignmentType === "SEQUENTIAL" ? "Последовательная" : "Обычная"}</span>
                            {task.deadline && <span>До {new Date(task.deadline).toLocaleDateString()}</span>}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ПАНЕЛЬ ПАГИНАЦИИ (Пункт 7) */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-3 bg-white px-4 py-3 rounded-xl border border-slate-200 max-w-xs mx-auto shadow-sm print:hidden">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-xs font-bold text-slate-700">
            Страница {currentPage} из {totalPages}
          </span>
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* МОДАЛКА: СОЗДАНИЕ ГЛОБАЛЬНОЙ ЦЕЛИ */}
      {isGoalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl border border-slate-200 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-800">Создать глобальную цель</h3>
              <button onClick={() => setIsGoalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleCreateGoal} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Название цели</label>
                <input
                  type="text"
                  required
                  placeholder="Например, Осенний Квартал"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 text-slate-800"
                  value={goalTitle}
                  onChange={(e) => setGoalTitle(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Цвет подсветки целей</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    className="h-9 w-12 border rounded cursor-pointer"
                    value={goalColor}
                    onChange={(e) => setGoalColor(e.target.value)}
                  />
                  <span className="text-xs text-slate-500 font-mono uppercase">{goalColor}</span>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsGoalOpen(false)} // <-- Исправлено
                  className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-sm"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold disabled:bg-blue-400"
                >
                  Создать цель
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* МОДАЛКА: УПРАВЛЕНИЕ СТАТУСАМИ */}
      {isManageStatusesOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl border border-slate-200 flex flex-col max-h-[85vh]">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-200">
              <h3 className="text-lg font-bold text-slate-800">Управление статусами задач</h3>
              <button onClick={() => setIsManageStatusesOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <form onSubmit={handleCreateStatus} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Создать новый статус</h4>
                <div className="flex gap-3 items-end">
                  <div className="flex-1">
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">Название</label>
                    <input
                      type="text"
                      required
                      placeholder="Например, Ревью кода"
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs focus:outline-none focus:border-blue-500 text-slate-800"
                      value={newStatusName}
                      onChange={(e) => setNewStatusName(e.target.value)}
                    />
                  </div>
                  <div className="w-14 shrink-0">
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">Цвет</label>
                    <input
                      type="color"
                      className="h-8 w-full border rounded cursor-pointer"
                      value={newStatusColor}
                      onChange={(e) => setNewStatusColor(e.target.value)}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isPending}
                    className="px-3.5 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer shrink-0 disabled:bg-blue-400"
                  >
                    Добавить
                  </button>
                </div>
              </form>

              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Существующие статусы</h4>
                <div className="space-y-2">
                  {statuses.map((st) => (
                    <div 
                      key={st.id} 
                      className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl"
                    >
                      <div className="flex items-center gap-2.5">
                        <span 
                          className="h-3.5 w-3.5 rounded-full shrink-0 shadow-sm"
                          style={{ backgroundColor: st.color || "#64748b" }}
                        />
                        <span className="font-semibold text-slate-800 text-sm">{st.name}</span>
                        {st.isDefault && (
                          <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-medium">По умолчанию</span>
                        )}
                      </div>
                      
                      {!st.isDefault && (
                        <button
                          onClick={() => handleDeleteStatus(st.id, st.name)}
                          disabled={isPending}
                          className="p-1.5 hover:bg-red-50 text-red-500 hover:text-red-700 rounded-lg transition-colors cursor-pointer"
                          title="Удалить статус"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-end">
              <button
                onClick={() => setIsManageStatusesOpen(false)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-sm font-semibold transition-colors"
              >
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}

      {/* МОДАЛКА: УПРАВЛЕНИЕ ЦЕЛЯМИ */}
      {isManageGoalsOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl border border-slate-200 flex flex-col max-h-[85vh]">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-200">
              <h3 className="text-lg font-bold text-slate-800">Управление глобальными целями</h3>
              <button onClick={() => { setIsManageGoalsOpen(false); setEditingGoalId(null); }} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-3">
                {goals.map((g) => {
                  const isEditing = editingGoalId === g.id;

                  return (
                    <div 
                      key={g.id} 
                      className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl gap-3"
                    >
                      {isEditing ? (
                        <div className="flex items-center gap-2 flex-1">
                          <input
                            type="color"
                            className="h-8 w-10 border rounded cursor-pointer shrink-0"
                            value={editGoalColor}
                            onChange={(e) => setEditGoalColor(e.target.value)}
                          />
                          <input
                            type="text"
                            required
                            className="flex-1 px-2.5 py-1 border border-slate-300 rounded-lg text-xs focus:outline-none focus:border-blue-500 text-slate-800"
                            value={editGoalTitle}
                            onChange={(e) => setEditGoalTitle(e.target.value)}
                          />
                          <button
                            type="button"
                            disabled={isPending}
                            onClick={() => handleUpdateGoal(g.id)}
                            className="p-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
                            title="Сохранить"
                          >
                            <Check className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingGoalId(null)}
                            className="p-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg transition-colors"
                            title="Отмена"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center gap-3">
                            <span 
                              className="h-3.5 w-3.5 rounded-full shrink-0 shadow-sm"
                              style={{ backgroundColor: g.color }}
                            />
                            <span className="font-semibold text-slate-800 text-sm">{g.title}</span>
                            {g.isTemplate && (
                              <span className="text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full font-medium">Системный шаблон</span>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => startEditingGoal(g)}
                              className="p-1.5 hover:bg-slate-100 text-slate-500 hover:text-slate-800 rounded-lg transition-colors"
                              title="Редактировать цель"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                            {!g.isTemplate && (
                              <button
                                onClick={() => handleDeleteGoal(g.id, g.title)}
                                disabled={isPending}
                                className="p-1.5 hover:bg-red-50 text-red-500 hover:text-red-700 rounded-lg transition-colors"
                                title="Удалить цель"
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
            
            <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-end">
              <button
                onClick={() => { setIsManageGoalsOpen(false); setEditingGoalId(null); }}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-sm font-semibold transition-colors"
              >
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}

      {/* МОДАЛКА: СОЗДАНИЕ ИЛИ РЕДАКТИРОВАНИЕ ЗАДАЧИ */}
      {isTaskOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl border border-slate-200 flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-200">
              <h3 className="text-lg font-bold text-slate-800">
                {editingTask ? `Редактировать задачу: ${editingTask.title}` : "Добавить новую задачу"}
              </h3>
              <button onClick={() => setIsTaskOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSaveTask} className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="flex items-center justify-between p-3 bg-red-50/50 border border-red-100 rounded-xl">
                <div className="space-y-0.5">
                  <h4 className="text-xs font-bold text-slate-800">Приоритетная задача (Срочно)</h4>
                  <p className="text-[10px] text-slate-500">Закрепить вверху списка и подсветить красным</p>
                </div>
                <input
                  type="checkbox"
                  checked={isPriority}
                  onChange={(e) => setIsPriority(e.target.checked)}
                  className="h-4 w-4 text-red-600 border-slate-300 rounded focus:ring-red-500 cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Глобальная цель</label>
                <select
                  name="goalId"
                  required
                  defaultValue={editingTask?.goal.id || ""}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:border-blue-500 text-slate-800"
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
                  placeholder="Собрать аналитику по соцсетям"
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
                <label className="block text-xs font-semibold text-slate-700 mb-1">Тип назначения задачи</label>
                <div className="grid grid-cols-3 gap-2">
                  {(["INDIVIDUAL", "SIMULTANEOUS", "SEQUENTIAL"] as const).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => handleTypeChange(type)}
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
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">Выберите исполнителей</label>
                <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto p-1 border rounded-lg bg-slate-50">
                  {users.map((u) => {
                    const isSelected = selectedAssignees.includes(u.id);
                    const indexInChain = selectedAssignees.indexOf(u.id);

                    return (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => toggleAssignee(u.id)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium border flex items-center gap-1.5 transition-all cursor-pointer ${
                          isSelected
                            ? "bg-blue-600 border-blue-600 text-white"
                            : "bg-white border-slate-200 text-slate-700 hover:bg-slate-100"
                        }`}
                      >
                        {u.name}
                        {assignmentType === "SEQUENTIAL" && isSelected && (
                          <span className="bg-blue-800 text-white text-[10px] h-4 w-4 rounded-full flex items-center justify-center font-bold">
                            {indexInChain + 1}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
                {assignmentType === "SEQUENTIAL" && selectedAssignees.length > 0 && (
                  <div className="mt-3 text-xs bg-blue-50 text-blue-800 p-3 rounded-lg border border-blue-100 space-y-1">
                    <div className="font-bold flex items-center gap-1"><ListOrdered className="h-4 w-4" /> Порядок выполнения цепочки:</div>
                    <div className="text-[11px] font-medium">
                      {selectedAssignees.map((id, index) => {
                        const name = users.find((u) => u.id === id)?.name;
                        return (
                          <span key={id}>
                            {index > 0 && " → "}
                            <span className="font-bold">{name}</span>
                            {index === 0 && " (Начнет сразу)"}
                            {index > 0 && " (Заблокировано)"}
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
                  onClick={() => setIsTaskOpen(false)}
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
      )}

      {/* МОДАЛКА: ПРОСМОТР ДЕТАЛЕЙ ЗАДАЧИ */}
      {activeTask && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 flex-col">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-xl border border-slate-200 flex flex-col h-[90vh]">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-200">
              <h3 className="text-lg font-bold text-slate-800">Детали задачи</h3>
              <button onClick={() => setActiveTask(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              <div className="flex items-center gap-2">
                <span
                  className="px-2.5 py-0.5 rounded-full text-xs font-semibold text-white"
                  style={{ backgroundColor: activeTask.goal.color }}
                >
                  {activeTask.goal.title}
                </span>
                <span className="text-xs text-slate-400 font-bold bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                  {activeTask.assignmentType === "SEQUENTIAL" ? "Последовательная цепочка" : "Обычная задача"}
                </span>
                {activeTask.isPriority && (
                  <span className="text-[10px] bg-red-100 text-red-700 border border-red-200 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider animate-pulse">
                    Срочно
                  </span>
                )}
              </div>

              <div>
                <h4 className="text-xl font-extrabold text-slate-900">{activeTask.title}</h4>
                {activeTask.description && (
                  <p className="text-sm text-slate-600 mt-2 whitespace-pre-line bg-slate-50 p-3 rounded-lg border leading-relaxed">
                    {activeTask.description}
                  </p>
                )}
              </div>

              {activeTask.adminNotes && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
                  <div className="font-bold flex items-center gap-1 mb-1">
                    <AlertCircle className="h-3.5 w-3.5" /> Указание руководителя:
                  </div>
                  <div>{activeTask.adminNotes}</div>
                </div>
              )}

              {activeTask.deadline && (
                <div className="text-xs text-slate-500 font-semibold">
                  🕒 Срок выполнения: {new Date(activeTask.deadline).toLocaleDateString("ru-RU")}
                </div>
              )}

              {/* Управление моим статусом */}
              {!isAdmin && (
                <div className="border-t border-b border-slate-200 py-4 space-y-2">
                  <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Мой статус по задаче</h5>
                  {(() => {
                    const myAs = activeTask.assignments.find((as) => as.userId === currentUserId);
                    if (!myAs) return null;

                    if (myAs.isBlocked) {
                      return (
                        <div className="flex items-center gap-2 text-xs font-bold text-red-600 bg-red-50 border border-red-200 p-3 rounded-xl">
                          <Lock className="h-4 w-4" /> Задача заблокирована. Ожидайте выполнения предыдущего этапа в цепочке.
                        </div>
                      );
                    }

                    return (
                      <div className="space-y-2">
                        <div className="flex gap-2">
                          {statuses.map((st) => {
                            const isActive = myAs.statusId === st.id;
                            return (
                              <button
                                key={st.id}
                                disabled={isPending}
                                onClick={() => handleStatusChange(myAs.id, st.id)}
                                className={`flex-1 px-3 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                  isActive
                                    ? "bg-blue-600 text-white ring-2 ring-blue-500 ring-offset-2"
                                    : "bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100"
                                }`}
                              >
                                {isActive && <span className="mr-1 inline-block">✓</span>}
                                {st.name}
                              </button>
                            );
                          })}
                        </div>
                        {myAs.completedAt && (
                          <div className="text-[10px] text-slate-400 italic">
                            Выполнено: {new Date(myAs.completedAt).toLocaleString()}
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* Прогресс всех участников */}
              <div className="space-y-2">
                <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Исполнители задачи</h5>
                <div className="space-y-2">
                  {activeTask.assignments.map((as) => (
                    <div
                      key={as.id}
                      className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 rounded-full bg-slate-200 text-slate-700 font-bold items-center justify-center text-xs">
                          {as.user.initials}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-800">{as.user.name}</div>
                          {activeTask.assignmentType === "SEQUENTIAL" && (
                            <div className="text-[10px] text-slate-400 font-medium">Этап {as.sequenceOrder + 1}</div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {as.isBlocked ? (
                          <span className="flex items-center text-red-600 gap-1 text-xs font-bold bg-red-50 border border-red-200 px-2 py-1 rounded-lg">
                            <Lock className="h-3 w-3" /> Ожидает
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-xs font-medium text-slate-700">
                            {as.status.name === "Исполнено" && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                            {as.status.name}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* ОБСУЖДЕНИЕ (МИНИ-ЧАТ) */}
              <div className="border-t border-slate-200 pt-4 space-y-3">
                <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Обсуждение по задаче</h5>
                
                {/* Лента сообщений */}
                <div className="space-y-3 max-h-60 overflow-y-auto p-2 bg-slate-50 rounded-xl border border-slate-200">
                  {activeTask.comments.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-400 italic">
                      Сообщений нет. Начните обсуждение первым!
                    </div>
                  ) : (
                    activeTask.comments.map((comment) => (
                      <div key={comment.id} className="flex gap-2.5 items-start text-xs">
                        <div className="flex h-7 w-7 rounded-full bg-blue-100 text-blue-700 font-bold items-center justify-center text-[10px] shrink-0 mt-0.5">
                          {comment.user.initials}
                        </div>
                        <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-sm flex-1 space-y-1">
                          <div className="flex justify-between items-center text-[10px] text-slate-400">
                            <span className="font-bold text-slate-700">{comment.user.name}</span>
                            <span>{new Date(comment.createdAt).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}</span>
                          </div>
                          <p className="text-slate-800 leading-relaxed whitespace-pre-line">{comment.text}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Форма отправки */}
                <form onSubmit={handleSendComment} className="flex gap-2 items-center">
                  <input
                    type="text"
                    required
                    placeholder="Напишите сообщение..."
                    className="flex-1 px-3 py-2 border border-slate-300 rounded-xl text-xs focus:outline-none focus:border-blue-500 text-slate-800 bg-white"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                  />
                  <button
                    type="submit"
                    disabled={isPending || !commentText.trim()}
                    className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors disabled:bg-blue-400 shrink-0 cursor-pointer"
                    title="Отправить сообщение"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </form>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-end">
              <button
                onClick={() => setActiveTask(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-sm font-semibold transition-colors cursor-pointer"
              >
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}