// src/app/app/tasks/TasksClient.tsx
"use client";

import React, { useState, useTransition, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { 
  updateAssignmentStatus,
  addComment,
  deleteTask,
  activateTask
} from "@/server/actions/tasks";
import { 
  Plus, 
  Settings, 
  Sliders, 
  History, 
  FolderLock, 
  LayoutGrid, 
  TableProperties, 
  CalendarDays,
  Search, 
  Filter, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  X, 
  ChevronLeft, 
  ChevronRight,
  Eye,
  Pencil,
  Trash2,
  Play,
  Repeat,
  Send,
  Lock
} from "lucide-react";
import { TaskModal } from "./components/TaskModal";
import { ManageGoalsModal } from "./components/ManageGoalsModal";

interface TasksClientProps {
  initialTasks: any[];
  goals: any[];
  users: any[];
  statuses: any[];
  currentUserId: string;
  isAdmin: boolean;
  currentPage: number;
  totalPages: number;
  taskToOpen: any | null;
  currentUserPeriod?: any;
  extensionRequests?: any[];
  currentFilters: {
    tab: string;
    search: string;
    goalId: string;
    statusId: string;
    assigneeId: string;
    department: string;
    priorityOnly: boolean;
  };
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
  taskToOpen,
  currentUserPeriod,
  extensionRequests = [],
  currentFilters,
}: TasksClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);
  const showToast = (message: string, type: "success" | "error" | "info" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const [viewMode, setViewMode] = useState<"standard" | "table">("table");
  const [activeTask, setActiveTask] = useState<any | null>(taskToOpen);
  const [editingTask, setEditingTask] = useState<any | null>(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isManageGoalsOpen, setIsManageGoalsOpen] = useState(false);
  const [commentText, setCommentText] = useState("");

  const [searchQuery, setSearchQuery] = useState(currentFilters.search);
  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  useEffect(() => {
    if (taskToOpen) setActiveTask(taskToOpen);
  }, [taskToOpen]);

  useEffect(() => {
    if (activeTask && chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [activeTask?.comments?.length]);

  const updateUrlFilters = (overrides: Record<string, string | number | boolean | null | undefined>) => {
    const params = new URLSearchParams();
    const merged: Record<string, string | number | boolean | null | undefined> = {
      page: 1,
      tab: currentFilters.tab,
      search: searchQuery,
      goalId: currentFilters.goalId,
      statusId: currentFilters.statusId,
      assigneeId: currentFilters.assigneeId,
      department: currentFilters.department,
      priorityOnly: currentFilters.priorityOnly ? "true" : "false",
      ...overrides,
    };

    Object.entries(merged).forEach(([k, v]) => {
      if (v !== null && v !== undefined && v !== "" && v !== "all" && String(v) !== "false") {
        params.set(k, String(v));
      }
    });

    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateUrlFilters({ search: searchQuery });
  };

  const clearFilters = () => {
    setSearchQuery("");
    startTransition(() => {
      router.push(`${pathname}?tab=${currentFilters.tab}`);
    });
  };

  const uniqueDepartments = Array.from(new Set(users.map((u) => u.department).filter(Boolean))) as string[];
  const pendingExtensionsCount = extensionRequests.filter((r) => r.status === "PENDING").length;

  const handleStatusChange = async (assignmentId: string, newStatusId: string) => {
    startTransition(async () => {
      try {
        await updateAssignmentStatus(assignmentId, newStatusId);
        showToast("Статус задачи изменен", "success");
        router.refresh();
      } catch (err: any) {
        showToast(err.message || "Ошибка смены статуса", "error");
      }
    });
  };

  const handleSendComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || !activeTask) return;
    const text = commentText;
    setCommentText("");

    startTransition(async () => {
      try {
        await addComment(activeTask.id, text);
        router.refresh();
      } catch (err) {
        showToast("Ошибка отправки комментария", "error");
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 left-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl border text-xs font-semibold animate-slide-up ${
          toast.type === "success" 
            ? "bg-emerald-50 border-emerald-200 text-emerald-800" 
            : toast.type === "error" 
            ? "bg-rose-50 border-rose-200 text-rose-800" 
            : "bg-blue-50 border-blue-200 text-blue-800"
        }`}>
          {toast.type === "success" && <CheckCircle2 className="h-4.5 w-4.5 text-emerald-600 shrink-0" />}
          {toast.type === "error" && <AlertCircle className="h-4.5 w-4.5 text-rose-600 shrink-0" />}
          {toast.type === "info" && <Clock className="h-4.5 w-4.5 text-blue-600 shrink-0" />}
          <span>{toast.message}</span>
          <button onClick={() => setToast(null)} className="ml-2 text-slate-400 hover:text-slate-600">
            <X className="h-3 w-3" />
          </button>
        </div>
      )}

      {/* Шапка */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold text-slate-800">Задачи и темы</h2>
          <p className="text-slate-500 text-sm">Оперативное управление задачами по всем темам и направлениям</p>
        </div>

        {!isAdmin && currentUserPeriod && (
          <div className="flex items-center gap-3 bg-white border border-slate-200 px-4 py-2.5 rounded-2xl shadow-sm self-stretch md:self-auto">
            <CalendarDays className="h-5 w-5 text-blue-500 shrink-0" />
            <div className="text-xs">
              <div className="text-slate-400 font-semibold uppercase text-[9px] tracking-wider">
                Моя успеваемость ({currentUserPeriod.type})
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="font-bold text-slate-800 text-sm">{currentUserPeriod.completionRate}%</span>
                <div className="w-20 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: `${currentUserPeriod.completionRate}%` }} />
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center gap-2 bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
          <button
            onClick={() => setViewMode("standard")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              viewMode === "standard" ? "bg-blue-600 text-white shadow-sm" : "text-slate-600 hover:text-slate-800"
            }`}
          >
            <LayoutGrid className="h-3.5 w-3.5" />
            {isAdmin ? "Плитки" : "Канбан"}
          </button>
          <button
            onClick={() => setViewMode("table")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              viewMode === "table" ? "bg-blue-600 text-white shadow-sm" : "text-slate-600 hover:text-slate-800"
            }`}
          >
            <TableProperties className="h-3.5 w-3.5" />
            Таблица
          </button>
        </div>

        {isAdmin && (
          <div className="flex flex-wrap gap-2 w-full md:w-auto">
            {pendingExtensionsCount > 0 && (
              <div className="flex items-center gap-2 border border-red-200 bg-red-50 text-red-700 px-3.5 py-2 rounded-lg text-xs font-black animate-pulse">
                <History className="h-3.5 w-3.5 text-red-600" />
                Переносы ({pendingExtensionsCount})
              </div>
            )}
            <button
              onClick={() => setIsManageGoalsOpen(true)}
              className="flex items-center gap-2 border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 px-3.5 py-2 rounded-lg text-xs font-semibold cursor-pointer"
            >
              <Settings className="h-3.5 w-3.5 text-slate-500" />
              Темы
            </button>
            <button
              onClick={() => { setEditingTask(null); setIsTaskModalOpen(true); }}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-xs font-bold shadow-sm cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              Добавить задачу
            </button>
          </div>
        )}
      </div>

      {/* Вкладки: В работе / На перспективу */}
      {isAdmin && (
        <div className="flex bg-slate-200/60 p-1 rounded-xl max-w-sm border border-slate-200">
          <button
            onClick={() => updateUrlFilters({ tab: "active" })}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-black transition-all cursor-pointer ${
              currentFilters.tab === "active" ? "bg-white text-blue-600 shadow-sm" : "text-slate-600 hover:text-slate-800"
            }`}
          >
            В работе (активные)
          </button>
          <button
            onClick={() => updateUrlFilters({ tab: "perspective" })}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              currentFilters.tab === "perspective" ? "bg-white text-blue-600 shadow-sm" : "text-slate-600 hover:text-slate-800"
            }`}
          >
            <FolderLock className="h-3.5 w-3.5 text-purple-600" /> На перспективу
          </button>
        </div>
      )}

      {/* Панель фильтрации */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
          <Filter className="h-3.5 w-3.5 text-slate-400" /> Фильтрация задач
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 items-end">
          <form onSubmit={handleSearchSubmit} className="relative">
            <label className="block text-[10px] font-semibold text-slate-500 mb-1">Поиск</label>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Поиск и Enter..."
                className="w-full pl-8 pr-3 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-blue-500 text-slate-800"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </form>

          <div>
            <label className="block text-[10px] font-semibold text-slate-500 mb-1">Тема (Направление)</label>
            <select
              value={currentFilters.goalId}
              onChange={(e) => updateUrlFilters({ goalId: e.target.value })}
              className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-white text-slate-700 focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="all">Все темы</option>
              {goals.map((g) => (
                <option key={g.id} value={g.id}>{g.title}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-semibold text-slate-500 mb-1">Отдел исполнителя</label>
            <select
              value={currentFilters.department}
              onChange={(e) => updateUrlFilters({ department: e.target.value })}
              className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-white text-slate-700 focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="all">Все отделы</option>
              {uniqueDepartments.map((dept) => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-semibold text-slate-500 mb-1">Исполнитель</label>
            <select
              value={currentFilters.assigneeId}
              onChange={(e) => updateUrlFilters({ assigneeId: e.target.value })}
              className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-white text-slate-700 focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="all">Все сотрудники</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-between gap-2">
            <label className="flex items-center gap-1.5 text-[11px] text-slate-600 font-semibold cursor-pointer select-none">
              <input
                type="checkbox"
                checked={currentFilters.priorityOnly}
                onChange={(e) => updateUrlFilters({ priorityOnly: e.target.checked })}
                className="rounded border-slate-300 text-red-600 focus:ring-red-500 h-3.5 w-3.5 cursor-pointer"
              />
              Срочные
            </label>

            {(currentFilters.search || currentFilters.goalId !== "all" || currentFilters.assigneeId !== "all" || currentFilters.department !== "all" || currentFilters.priorityOnly) && (
              <button onClick={clearFilters} className="text-[10px] text-blue-600 hover:text-blue-800 font-bold underline cursor-pointer">
                Сбросить
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ТАБЛИЦА ЗАДАЧ */}
      {viewMode === "table" ? (
        <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto shadow-sm">
          <table className="min-w-full divide-y divide-slate-200 text-xs">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-slate-500 uppercase tracking-wider">Тема / Задача</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-500 uppercase tracking-wider">Срок (Дедлайн)</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-500 uppercase tracking-wider">Приоритет</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-500 uppercase tracking-wider">Исполнители</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-500 uppercase tracking-wider">Примечания</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-500 uppercase tracking-wider">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {initialTasks.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-400 italic">Задач пока нет</td>
                </tr>
              ) : (
                initialTasks.map((task) => {
                  const myAs = !isAdmin ? task.assignments.find((as: any) => as.userId === currentUserId) : null;
                  const isCompleted = isAdmin 
                    ? task.assignments.every((as: any) => as.statusId === "status-done")
                    : myAs?.statusId === "status-done";
                  const isOverdue = !isCompleted && task.deadline && new Date(task.deadline) < startOfToday;

                  return (
                    <tr 
                      key={task.id} 
                      onClick={() => setActiveTask(task)}
                      className={`hover:bg-slate-50/50 transition-colors cursor-pointer ${isCompleted ? "opacity-60 bg-slate-50/30" : ""}`}
                    >
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1 items-start">
                          <span 
                            className="px-2 py-0.5 rounded text-[9px] font-bold text-white leading-none mb-1"
                            style={{ backgroundColor: task.goal.color }}
                          >
                            {task.goal.title}
                          </span>
                          <span className={`font-bold text-slate-900 text-sm leading-snug ${isCompleted ? "line-through text-slate-400" : ""}`}>
                            {task.title}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {task.isPerspective && task.reminderDate ? (
                          <span className="font-bold flex items-center gap-1 text-purple-600">
                            <History className="h-3.5 w-3.5 shrink-0" />
                            Напомнить: {new Date(task.reminderDate).toLocaleDateString("ru-RU")}
                          </span>
                        ) : task.deadline ? (
                          <span className={`font-bold flex items-center gap-1 ${isOverdue ? "text-red-500" : isCompleted ? "text-slate-400" : "text-slate-600"}`}>
                            <Clock className="h-3.5 w-3.5 shrink-0" />
                            {new Date(task.deadline).toLocaleDateString("ru-RU")}
                            {isOverdue && <span className="text-[9px] font-black text-red-500 uppercase tracking-wide">(Просрочена)</span>}
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex flex-col gap-1 items-start">
                          {task.isPriority && (
                            <span className="text-[9px] bg-red-100 text-red-700 border border-red-200 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider animate-pulse">Срочно!</span>
                          )}
                          {task.isRecurring && (
                            <span className="text-[9px] bg-purple-100 text-purple-700 border border-purple-200 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider flex items-center gap-0.5">
                              <Repeat className="h-2.5 w-2.5" /> Регулярная
                            </span>
                          )}
                          {!task.isPriority && !task.isRecurring && (
                            <span className="text-[9px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-semibold">Обычная</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex -space-x-1.5 overflow-hidden">
                          {task.assignments.map((as: any) => (
                            <div
                              key={as.id}
                              className="inline-block h-6 w-6 rounded-full ring-2 ring-white bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-[10px] shadow-sm"
                              title={`${as.user.name} (${as.isBlocked ? "Блокировано" : as.status.name})`}
                            >
                              {as.user.initials}
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3 max-w-xs truncate text-slate-500">
                        {task.adminNotes ? (
                          <span className="bg-amber-100 text-amber-900 border border-amber-200 px-2 py-0.5 rounded font-bold text-[10px]">
                            {task.adminNotes}
                          </span>
                        ) : (
                          task.description || "—"
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right">
                        <div className="flex justify-end gap-1.5">
                          {isAdmin && (
                            <>
                              {task.isPerspective && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (window.confirm(`Запустить задачу «${task.title}» в активную работу?`)) {
                                      activateTask(task.id).then(() => {
                                        showToast("Задача запущена в работу!", "success");
                                        router.refresh();
                                      });
                                    }
                                  }}
                                  className="p-1 hover:bg-emerald-50 text-emerald-600 rounded cursor-pointer"
                                  title="Запустить в работу"
                                >
                                  <Play className="h-4 w-4" />
                                </button>
                              )}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingTask(task);
                                  setIsTaskModalOpen(true);
                                }}
                                className="p-1 hover:bg-slate-100 text-slate-500 rounded cursor-pointer"
                              >
                                <Pencil className="h-4 w-4" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (window.confirm(`Удалить задачу «${task.title}»?`)) {
                                    deleteTask(task.id).then(() => {
                                      showToast("Задача удалена", "success");
                                      router.refresh();
                                    });
                                  }
                                }}
                                className="p-1 hover:bg-red-50 text-red-500 rounded cursor-pointer"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </>
                          )}
                          <button
                            onClick={(e) => { e.stopPropagation(); setActiveTask(task); }}
                            className="p-1 hover:bg-slate-100 text-slate-500 rounded cursor-pointer"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      ) : (
        /* РЕЖИМ ПЛИТОК / КАНБАН */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {statuses.map((status) => {
            const tasksInStatus = initialTasks.filter((task) =>
              task.assignments.some((as: any) => (isAdmin ? as.statusId === status.id : as.userId === currentUserId && as.statusId === status.id))
            );

            return (
              <div key={status.id} className="flex flex-col bg-slate-100 rounded-2xl p-4 min-h-[450px]">
                <div className="flex items-center justify-between mb-4 px-2">
                  <h3 className="font-bold text-slate-700 text-sm">{status.name}</h3>
                  <span className="bg-white text-slate-600 font-bold text-xs px-2 py-0.5 rounded-full border border-slate-200">
                    {tasksInStatus.length}
                  </span>
                </div>

                <div className="space-y-3 flex-1 overflow-y-auto">
                  {tasksInStatus.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-xs text-slate-400 py-12">Нет задач</div>
                  ) : (
                    tasksInStatus.map((task) => (
                      <div
                        key={task.id}
                        onClick={() => setActiveTask(task)}
                        className="bg-white rounded-xl p-4 shadow-sm border-l-4 hover:shadow transition-all cursor-pointer space-y-2"
                        style={{ borderLeftColor: task.goal.color }}
                      >
                        <div className="flex justify-between items-start gap-2">
                          <span className="text-[10px] text-slate-500 font-bold bg-slate-50 px-2 py-0.5 rounded border">
                            {task.goal.title}
                          </span>
                          {task.isPriority && (
                            <span className="text-red-600 font-bold text-[9px] uppercase">Срочно</span>
                          )}
                        </div>
                        <h4 className="font-bold text-slate-800 text-sm">{task.title}</h4>
                        {task.deadline && (
                          <div className="text-[10px] text-slate-400 flex items-center gap-1">
                            <Clock className="h-3 w-3" /> До {new Date(task.deadline).toLocaleDateString("ru-RU")}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Пагинация */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-3 bg-white px-4 py-3 rounded-xl border border-slate-200 max-w-xs mx-auto shadow-sm">
          <button
            onClick={() => updateUrlFilters({ page: currentPage - 1 })}
            disabled={currentPage === 1}
            className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 cursor-pointer"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-xs font-bold text-slate-700">
            Страница {currentPage} из {totalPages}
          </span>
          <button
            onClick={() => updateUrlFilters({ page: currentPage + 1 })}
            disabled={currentPage === totalPages}
            className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 cursor-pointer"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* МОДАЛЬНЫЕ ОКНА */}
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        editingTask={editingTask}
        goals={goals}
        users={users}
        isPending={isPending}
        onSaved={(msg) => { showToast(msg, "success"); router.refresh(); }}
        onError={(msg) => showToast(msg, "error")}
      />

      <ManageGoalsModal
        isOpen={isManageGoalsOpen}
        onClose={() => setIsManageGoalsOpen(false)}
        goals={goals}
        isPending={isPending}
        onSuccess={(msg) => { showToast(msg, "success"); router.refresh(); }}
        onError={(msg) => showToast(msg, "error")}
      />

      {/* Модалка просмотра деталей задачи */}
      {activeTask && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl w-full max-w-5xl shadow-2xl border border-slate-200 flex flex-col h-[85vh] overflow-hidden">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-200 shrink-0">
              <h3 className="text-lg font-bold text-slate-800">Рабочее пространство задачи</h3>
              <button onClick={() => setActiveTask(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden h-full">
              <div className="lg:col-span-7 p-6 overflow-y-auto border-r border-slate-100 space-y-5 h-full">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold text-white" style={{ backgroundColor: activeTask.goal.color }}>
                    {activeTask.goal.title}
                  </span>
                  {activeTask.isPriority && (
                    <span className="text-[10px] bg-red-100 text-red-700 border border-red-200 px-2 py-0.5 rounded-full font-bold uppercase">
                      Срочно
                    </span>
                  )}
                </div>

                <div>
                  <h4 className="text-xl font-extrabold text-slate-900">{activeTask.title}</h4>
                  {activeTask.description && (
                    <p className="text-sm text-slate-600 mt-3 whitespace-pre-line bg-slate-50 p-4 rounded-xl border">
                      {activeTask.description}
                    </p>
                  )}
                </div>

                {activeTask.adminNotes && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
                    <strong>Указание руководителя:</strong> {activeTask.adminNotes}
                  </div>
                )}

                {/* Статус задачи сотрудника */}
                {!isAdmin && (
                  <div className="border-t border-slate-100 pt-4 space-y-2">
                    <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Мой статус</h5>
                    {(() => {
                      const myAs = activeTask.assignments.find((as: any) => as.userId === currentUserId);
                      if (!myAs) return null;

                      if (myAs.isBlocked) {
                        return (
                          <div className="flex items-center gap-2 text-xs font-bold text-red-600 bg-red-50 border border-red-200 p-3 rounded-xl">
                            <Lock className="h-4 w-4" /> Задача заблокирована. Ожидайте выполнения предыдущего этапа в цепочке.
                          </div>
                        );
                      }

                      return (
                        <div className="flex gap-2">
                          {statuses.map((st) => (
                            <button
                              key={st.id}
                              disabled={isPending}
                              onClick={() => handleStatusChange(myAs.id, st.id)}
                              className={`flex-1 px-3 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                myAs.statusId === st.id
                                  ? "bg-blue-600 text-white ring-2 ring-blue-500 ring-offset-2"
                                  : "bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100"
                              }`}
                            >
                              {myAs.statusId === st.id && "✓ "}
                              {st.name}
                            </button>
                          ))}
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>

              {/* Чат задачи */}
              <div className="lg:col-span-5 p-6 bg-slate-50/50 flex flex-col h-full overflow-hidden border-t lg:border-t-0 lg:border-l border-slate-200">
                <div className="border-b border-slate-100 pb-3 mb-3 flex items-center gap-2 shrink-0">
                  <Send className="h-4 w-4 text-blue-500" />
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Обсуждение</span>
                </div>

                <div className="flex-1 overflow-y-auto space-y-3 pr-1 mb-4">
                  {activeTask.comments.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-xs text-slate-400 italic">
                      Сообщений нет.
                    </div>
                  ) : (
                    activeTask.comments.map((comment: any) => (
                      <div key={comment.id} className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-sm space-y-1 text-xs">
                        <div className="flex justify-between items-center text-[10px] text-slate-400">
                          <span className="font-bold text-slate-700">{comment.user.name}</span>
                          <span>{new Date(comment.createdAt).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}</span>
                        </div>
                        <p className="text-slate-800 whitespace-pre-line">{comment.text}</p>
                      </div>
                    ))
                  )}
                  <div ref={chatEndRef} />
                </div>

                <form onSubmit={handleSendComment} className="flex gap-2 items-center shrink-0 border-t border-slate-100 pt-3">
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
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}