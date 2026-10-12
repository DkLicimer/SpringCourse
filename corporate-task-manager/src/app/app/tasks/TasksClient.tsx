// src/app/app/tasks/TasksClient.tsx
"use client";

import React, { useState, useTransition, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { 
  updateAssignmentStatus,
  addComment,
  deleteTask,
  activateTask,
  submitTaskReport,
  reopenTask,
  createExtensionRequest,
  approveExtensionRequest,
  rejectExtensionRequest
} from "@/server/actions/tasks";
import { 
  Plus, 
  Settings, 
  History, 
  FolderLock, 
  LayoutGrid, 
  TableProperties, 
  Calendar,
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
  Lock,
  MessageSquareCheck,
  FileCheck2,
  Sparkles,
  Briefcase,
  RotateCcw,
  CalendarPlus,
  Check,
  AlertTriangle,
  Copy,
  Link as LinkIcon
} from "lucide-react";
import { TaskModal } from "./components/TaskModal";
import { ManageGoalsModal } from "./components/ManageGoalsModal";
import { GlobalFocusBanner } from "./components/GlobalFocusBanner";

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
  globalFocus: any | null;
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
  globalFocus,
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
  const [reassignParentTask, setReassignParentTask] = useState<any | null>(null); // ⚡ Задача для переназначения (Пункт 7)
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isManageGoalsOpen, setIsManageGoalsOpen] = useState(false);
  const [commentText, setCommentText] = useState("");

  // Модальные окна переносов
  const [isExtensionModalOpen, setIsExtensionModalOpen] = useState(false);
  const [isAllExtensionsModalOpen, setIsAllExtensionsModalOpen] = useState(false);
  const [extensionDeadlineInput, setExtensionDeadlineInput] = useState("");
  const [extensionReasonInput, setExtensionReasonInput] = useState("");

  // Поле обратной связи / отчета исполнителя
  const [reportInput, setReportInput] = useState("");

  const [searchQuery, setSearchQuery] = useState(currentFilters.search);
  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  useEffect(() => {
    if (taskToOpen) {
      setActiveTask(taskToOpen);
      const myAs = taskToOpen.assignments?.find((as: any) => as.userId === currentUserId);
      setReportInput(myAs?.reportText || "");
    }
  }, [taskToOpen, currentUserId]);

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
  const pendingExtensions = extensionRequests.filter((r) => r.status === "PENDING");
  const pendingExtensionsCount = pendingExtensions.length;

  const copyTaskReference = (taskNumber: number, title: string) => {
    const refText = `№ ${taskNumber} «${title}»`;
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(refText);
      showToast(`Номер ${refText} скопирован в буфер!`, "info");
    }
  };

  // ⚡ Функция открытия модалки повторного назначения
  const handleOpenReassignModal = (task: any, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setActiveTask(null); 
    setEditingTask(null);
    setReassignParentTask(task);
    setIsTaskModalOpen(true);
  };

  const handleStatusChange = async (assignmentId: string, newStatusId: string) => {
    if (newStatusId === "status-done" && activeTask?.intermediateControl && !isAdmin) {
      if (!reportInput.trim()) {
        showToast("Для завершения задачи с промежуточным контролем обязательно заполните отчет!", "error");
        return;
      }
    }

    startTransition(async () => {
      try {
        await updateAssignmentStatus(assignmentId, newStatusId, reportInput);
        
        if (activeTask) {
          setActiveTask((prev: any) => {
            if (!prev) return null;
            return {
              ...prev,
              assignments: prev.assignments.map((as: any) =>
                as.id === assignmentId
                  ? { ...as, statusId: newStatusId, reportText: reportInput.trim(), completedAt: newStatusId === "status-done" ? new Date().toISOString() : null }
                  : as
              ),
            };
          });
        }

        showToast("Статус задачи обновлен", "success");
        router.refresh();
      } catch (err: any) {
        showToast(err.message || "Ошибка смены статуса", "error");
      }
    });
  };

  const handleReopenWholeTask = async (taskId: string) => {
    if (!window.confirm("Вернуть задачу в активную работу? Статусы исполнителей перейдут в «Взял в работу».")) {
      return;
    }

    startTransition(async () => {
      try {
        await reopenTask(taskId, "status-in-progress");
        if (activeTask && activeTask.id === taskId) {
          setActiveTask((prev: any) => {
            if (!prev) return null;
            return {
              ...prev,
              assignments: prev.assignments.map((as: any) => ({
                ...as,
                statusId: "status-in-progress",
                completedAt: null,
                isBlocked: false,
              })),
            };
          });
        }
        showToast("Задача возвращена в работу!", "success");
        router.refresh();
      } catch (err: any) {
        showToast(err.message || "Ошибка возврата задачи", "error");
      }
    });
  };

  const handleSubmitExtensionRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTask || !extensionDeadlineInput || !extensionReasonInput.trim()) {
      showToast("Заполните желаемую дату и причину", "error");
      return;
    }

    startTransition(async () => {
      try {
        const req = await createExtensionRequest({
          taskId: activeTask.id,
          requestedDeadline: extensionDeadlineInput,
          reason: extensionReasonInput.trim(),
        });

        if (activeTask) {
          setActiveTask((prev: any) => ({
            ...prev,
            extensionRequests: [req, ...(prev.extensionRequests || [])],
          }));
        }

        setIsExtensionModalOpen(false);
        setExtensionReasonInput("");
        setExtensionDeadlineInput("");
        showToast("Запрос на продление отправлен руководителю!", "success");
        router.refresh();
      } catch (err: any) {
        showToast(err.message || "Ошибка отправки запроса", "error");
      }
    });
  };

  const handleApproveExtension = async (requestId: string, approvedDeadline?: string) => {
    startTransition(async () => {
      try {
        await approveExtensionRequest({ requestId, approvedDeadline });
        showToast("Срок задачи успешно продлен!", "success");
        setIsAllExtensionsModalOpen(false);
        router.refresh();
      } catch (err: any) {
        showToast(err.message || "Ошибка одобрения", "error");
      }
    });
  };

  const handleRejectExtension = async (requestId: string) => {
    const rejectionReason = window.prompt("Укажите причину отказа (необязательно):") || undefined;
    startTransition(async () => {
      try {
        await rejectExtensionRequest({ requestId, rejectionReason });
        showToast("Запрос на продление отклонен", "info");
        setIsAllExtensionsModalOpen(false);
        router.refresh();
      } catch (err: any) {
        showToast(err.message || "Ошибка отклонения", "error");
      }
    });
  };

  const handleSaveReport = async (assignmentId: string) => {
    if (!reportInput.trim()) {
      showToast("Введите текст отчета", "error");
      return;
    }

    startTransition(async () => {
      try {
        await submitTaskReport(assignmentId, reportInput);
        
        if (activeTask) {
          setActiveTask((prev: any) => {
            if (!prev) return null;
            return {
              ...prev,
              assignments: prev.assignments.map((as: any) =>
                as.id === assignmentId
                  ? { ...as, reportText: reportInput.trim() }
                  : as
              ),
            };
          });
        }

        showToast("Обратная связь / отчет сохранен!", "success");
        router.refresh();
      } catch (err: any) {
        showToast(err.message || "Ошибка отправки отчета", "error");
      }
    });
  };

  const handleSendComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || !activeTask) return;
    const text = commentText.trim();
    setCommentText("");

    const optimisticComment = {
      id: `temp-${Date.now()}`,
      taskId: activeTask.id,
      userId: currentUserId,
      text,
      createdAt: new Date().toISOString(),
      user: {
        id: currentUserId,
        name: "Вы",
        initials: "ВЫ",
      },
    };

    setActiveTask((prev: any) => {
      if (!prev) return null;
      return {
        ...prev,
        comments: [...(prev.comments || []), optimisticComment],
      };
    });

    startTransition(async () => {
      try {
        const savedComment = await addComment(activeTask.id, text);
        if (savedComment) {
          setActiveTask((prev: any) => {
            if (!prev) return null;
            const filtered = (prev.comments || []).filter((c: any) => c.id !== optimisticComment.id);
            return {
              ...prev,
              comments: [...filtered, savedComment],
            };
          });
        }
        router.refresh();
      } catch (err: any) {
        showToast("Ошибка отправки комментария", "error");
      }
    });
  };

  return (
    <div className="space-y-5">
      {/* Toast уведомления */}
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
          <button onClick={() => setToast(null)} className="ml-2 text-slate-400 hover:text-slate-600 cursor-pointer">
            <X className="h-3 w-3" />
          </button>
        </div>
      )}

      {/* Заголовок страницы */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="space-y-0.5">
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Задачи и темы</h2>
          <p className="text-slate-500 text-xs">Оперативное управление задачами по всем направлениям</p>
        </div>

        {!isAdmin && currentUserPeriod && (
          <div className="flex items-center gap-3 bg-white border border-slate-200 px-3.5 py-2 rounded-xl shadow-xs self-stretch sm:self-auto">
            <CalendarDays className="h-4 w-4 text-blue-500 shrink-0" />
            <div className="text-xs">
              <div className="text-slate-400 font-bold uppercase text-[9px] tracking-wider">
                Моя успеваемость ({currentUserPeriod.type === "MONTH" ? "Месяц" : currentUserPeriod.type === "QUARTER" ? "Квартал" : "Период"})
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="font-extrabold text-slate-800 text-xs">{currentUserPeriod.completionRate}%</span>
                <div className="w-16 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: `${currentUserPeriod.completionRate}%` }} />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 1. Блок главных акцентов */}
      <GlobalFocusBanner
        initialFocus={globalFocus}
        isAdmin={isAdmin}
      />

      {/* 2. Панель управления и переключателей */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-2.5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2">
          {isAdmin ? (
            <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                onClick={() => updateUrlFilters({ tab: "active" })}
                className={`py-1.5 px-3.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  currentFilters.tab === "active" 
                    ? "bg-white text-blue-600 shadow-xs" 
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                В работе (активные)
              </button>
              <button
                onClick={() => updateUrlFilters({ tab: "perspective" })}
                className={`py-1.5 px-3.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  currentFilters.tab === "perspective" 
                    ? "bg-white text-purple-600 shadow-xs" 
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <FolderLock className="h-3.5 w-3.5 text-purple-600" /> 
                <span>На перспективу</span>
              </button>
            </div>
          ) : (
            <div className="text-xs font-bold text-slate-700 px-2 flex items-center gap-1.5">
              <Briefcase className="h-4 w-4 text-blue-600" />
              <span>Мои задачи</span>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setViewMode("standard")}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === "standard" ? "bg-white text-blue-600 shadow-xs" : "text-slate-600 hover:text-slate-900"
              }`}
              title="Отображение плитками / канбан"
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              <span>{isAdmin ? "Плитки" : "Канбан"}</span>
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === "table" ? "bg-white text-blue-600 shadow-xs" : "text-slate-600 hover:text-slate-900"
              }`}
              title="Отображение таблицей"
            >
              <TableProperties className="h-3.5 w-3.5" />
              <span>Таблица</span>
            </button>
          </div>

          {isAdmin && (
            <div className="flex items-center gap-2">
              {pendingExtensionsCount > 0 && (
                <button
                  onClick={() => setIsAllExtensionsModalOpen(true)}
                  className="flex items-center gap-1.5 border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 px-3 py-1.5 rounded-xl text-xs font-black transition-all animate-pulse cursor-pointer shadow-xs"
                  title="Открыть запросы сотрудников на перенос срока"
                >
                  <History className="h-3.5 w-3.5 text-red-600" />
                  <span>Переносы ({pendingExtensionsCount})</span>
                </button>
              )}

              <button
                onClick={() => setIsManageGoalsOpen(true)}
                className="flex items-center gap-1.5 border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs"
              >
                <Settings className="h-3.5 w-3.5 text-slate-500" />
                <span>Темы</span>
              </button>

              <button
                onClick={() => { setEditingTask(null); setReassignParentTask(null); setIsTaskModalOpen(true); }}
                className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Добавить задачу</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Панель фильтрации */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
          <Filter className="h-3.5 w-3.5 text-slate-400" /> Фильтрация задач
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-3 items-end">
          <form onSubmit={handleSearchSubmit} className="relative">
            <label className="block text-[10px] font-bold text-slate-500 mb-1">Поиск по №, тексту, архиву</label>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Поиск (напр. № 5)..."
                className="w-full pl-8 pr-3 py-1.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-blue-500 text-slate-800 bg-slate-50 focus:bg-white"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </form>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 mb-1">Статус / Архив</label>
            <select
              value={currentFilters.statusId}
              onChange={(e) => updateUrlFilters({ statusId: e.target.value })}
              className="w-full px-2.5 py-1.5 border border-slate-200 rounded-xl text-xs bg-slate-50 focus:bg-white text-slate-700 focus:outline-none focus:border-blue-500 cursor-pointer font-medium"
            >
              <option value="all">Все статусы</option>
              <option value="overdue" className="text-red-600 font-bold">⚠️ Просроченные задачи</option>
              {statuses.map((st) => (
                <option key={st.id} value={st.id}>
                  {st.id === "status-done" ? "Исполнено (Архив)" : st.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 mb-1">Тема</label>
            <select
              value={currentFilters.goalId}
              onChange={(e) => updateUrlFilters({ goalId: e.target.value })}
              className="w-full px-2.5 py-1.5 border border-slate-200 rounded-xl text-xs bg-slate-50 focus:bg-white text-slate-700 focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="all">Все темы</option>
              {goals.map((g) => (
                <option key={g.id} value={g.id}>{g.title}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 mb-1">Отдел</label>
            <select
              value={currentFilters.department}
              onChange={(e) => updateUrlFilters({ department: e.target.value })}
              className="w-full px-2.5 py-1.5 border border-slate-200 rounded-xl text-xs bg-slate-50 focus:bg-white text-slate-700 focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="all">Все отделы</option>
              {uniqueDepartments.map((dept) => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 mb-1">Исполнитель</label>
            <select
              value={currentFilters.assigneeId}
              onChange={(e) => updateUrlFilters({ assigneeId: e.target.value })}
              className="w-full px-2.5 py-1.5 border border-slate-200 rounded-xl text-xs bg-slate-50 focus:bg-white text-slate-700 focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="all">Все сотрудники</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-between gap-2">
            <label className="flex items-center gap-1.5 text-[11px] text-slate-700 font-bold cursor-pointer select-none">
              <input
                type="checkbox"
                checked={currentFilters.priorityOnly}
                onChange={(e) => updateUrlFilters({ priorityOnly: e.target.checked })}
                className="rounded border-slate-300 text-red-600 focus:ring-red-500 h-3.5 w-3.5 cursor-pointer"
              />
              Срочные
            </label>

            {(currentFilters.search || currentFilters.goalId !== "all" || currentFilters.statusId !== "all" || currentFilters.assigneeId !== "all" || currentFilters.department !== "all" || currentFilters.priorityOnly) && (
              <button onClick={clearFilters} className="text-[10px] text-blue-600 hover:text-blue-800 font-bold underline cursor-pointer">
                Сбросить
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ТАБЛИЦА ЗАДАЧ */}
      {viewMode === "table" ? (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-x-auto shadow-xs">
          <table className="min-w-full divide-y divide-slate-200 text-xs">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3.5 text-left font-bold text-slate-500 uppercase tracking-wider">Тема / Задача</th>
                <th className="px-4 py-3.5 text-left font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">Поставлена</th>
                <th className="px-4 py-3.5 text-left font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">Срок (Дедлайн)</th>
                <th className="px-4 py-3.5 text-left font-bold text-slate-500 uppercase tracking-wider">Приоритет</th>
                <th className="px-4 py-3.5 text-left font-bold text-slate-500 uppercase tracking-wider">Исполнители / Подзадачи</th>
                <th className="px-4 py-3.5 text-left font-bold text-slate-500 uppercase tracking-wider">Отчет / Контроль</th>
                <th className="px-4 py-3.5 text-right font-bold text-slate-500 uppercase tracking-wider">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {initialTasks.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-slate-400 italic">Задач по выбранным фильтрам нет</td>
                </tr>
              ) : (
                initialTasks.map((task) => {
                  const myAs = !isAdmin ? task.assignments.find((as: any) => as.userId === currentUserId) : null;
                  const isCompleted = isAdmin 
                    ? task.assignments.every((as: any) => as.statusId === "status-done")
                    : myAs?.statusId === "status-done";
                  const isOverdue = !isCompleted && task.deadline && new Date(task.deadline) < startOfToday;
                  const hasReports = task.assignments.some((as: any) => !!as.reportText);
                  const hasPendingExtension = task.extensionRequests?.some((r: any) => r.status === "PENDING");

                  return (
                    <tr 
                      key={task.id} 
                      onClick={() => setActiveTask(task)}
                      className={`hover:bg-slate-50/70 transition-colors cursor-pointer ${isCompleted ? "opacity-60 bg-slate-50/30" : ""}`}
                    >
                      <td className="px-4 py-3.5">
                        <div className="flex flex-col gap-1 items-start">
                          <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                            <span 
                              className="px-2 py-0.5 rounded text-[10px] font-black bg-slate-900 text-white shadow-xs tracking-wider flex items-center gap-0.5"
                              title={`Порядковый номер: № ${task.taskNumber || task.id.slice(0, 4)}`}
                            >
                              № {task.taskNumber || "—"}
                            </span>
                            <span 
                              className="px-2 py-0.5 rounded text-[9px] font-extrabold text-white leading-none"
                              style={{ backgroundColor: task.goal.color }}
                            >
                              {task.goal.title}
                            </span>
                            {/* ⚡ Бейдж повторной задачи */}
                            {task.parentTask && (
                              <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-orange-100 text-orange-800 border border-orange-200 flex items-center gap-0.5">
                                <RotateCcw className="h-2.5 w-2.5 text-orange-600" /> Повторная (от №{task.parentTask.taskNumber})
                              </span>
                            )}
                          </div>
                          
                          <span className={`font-bold text-slate-900 text-sm leading-snug ${isCompleted ? "line-through text-slate-400" : ""}`}>
                            {task.title}
                          </span>
                          {myAs?.stepInstruction && (
                            <span className="text-[10px] bg-blue-50 text-blue-800 border border-blue-200 px-2 py-0.5 rounded-md font-semibold flex items-center gap-1 mt-0.5">
                              <Sparkles className="h-3 w-3 text-blue-500" /> Ваша часть: {myAs.stepInstruction}
                            </span>
                          )}
                          {hasPendingExtension && (
                            <span className="text-[9px] bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-md font-bold flex items-center gap-1 mt-0.5 animate-pulse">
                              <History className="h-3 w-3 text-amber-600" /> Запрос на перенос срока
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="px-4 py-3.5 whitespace-nowrap text-slate-600">
                        <div className="flex items-center gap-1.5 font-medium">
                          <Calendar className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          <span>{new Date(task.createdAt).toLocaleDateString("ru-RU")}</span>
                        </div>
                      </td>

                      <td className="px-4 py-3.5 whitespace-nowrap">
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
                      <td className="px-4 py-3.5 whitespace-nowrap">
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
                      <td className="px-4 py-3.5">
                        <div className="flex flex-col gap-1">
                          <div className="flex -space-x-1.5 overflow-hidden">
                            {task.assignments.map((as: any) => (
                              <div
                                key={as.id}
                                className="inline-block h-6 w-6 rounded-full ring-2 ring-white bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-[10px] shadow-xs"
                                title={`${as.user.name}: ${as.stepInstruction || as.status.name}`}
                              >
                                {as.user.initials}
                              </div>
                            ))}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 max-w-xs truncate text-slate-500">
                        {hasReports ? (
                          <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-full font-bold text-[10px] flex items-center gap-1 w-fit">
                            <FileCheck2 className="h-3 w-3 text-emerald-600" /> Есть отчет
                          </span>
                        ) : task.intermediateControl ? (
                          <span className="bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-full font-bold text-[10px] flex items-center gap-1 w-fit">
                            <MessageSquareCheck className="h-3 w-3 text-amber-600" /> Ждет отчета
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap text-right">
                        <div className="flex justify-end gap-1.5">
                          {isAdmin && (
                            <>
                              {/* ⚡ Кнопка «Назначить повторно» для просроченной задачи (Пункт 7) */}
                              {isOverdue && (
                                <button
                                  onClick={(e) => handleOpenReassignModal(task, e)}
                                  className="p-1.5 hover:bg-orange-50 text-orange-600 rounded-lg cursor-pointer transition-colors"
                                  title="Назначить повторно от просроченной"
                                >
                                  <RotateCcw className="h-4 w-4" />
                                </button>
                              )}
                              {isCompleted && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleReopenWholeTask(task.id);
                                  }}
                                  className="p-1.5 hover:bg-blue-50 text-blue-600 rounded-lg cursor-pointer"
                                  title="Вернуть в работу"
                                >
                                  <RotateCcw className="h-4 w-4" />
                                </button>
                              )}
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
                                  className="p-1.5 hover:bg-emerald-50 text-emerald-600 rounded-lg cursor-pointer"
                                  title="Запустить в работу"
                                >
                                  <Play className="h-4 w-4" />
                                </button>
                              )}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setReassignParentTask(null);
                                  setEditingTask(task);
                                  setIsTaskModalOpen(true);
                                }}
                                className="p-1.5 hover:bg-slate-100 text-slate-500 rounded-lg cursor-pointer"
                                title="Редактировать"
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
                                className="p-1.5 hover:bg-red-50 text-red-500 rounded-lg cursor-pointer"
                                title="Удалить"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </>
                          )}
                          <button
                            onClick={(e) => { e.stopPropagation(); setActiveTask(task); }}
                            className="p-1.5 hover:bg-slate-100 text-slate-500 rounded-lg cursor-pointer"
                            title="Открыть"
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
                        className="bg-white rounded-xl p-4 shadow-xs border-l-4 hover:shadow-md transition-all cursor-pointer space-y-2"
                        style={{ borderLeftColor: task.goal.color }}
                      >
                        <div className="flex justify-between items-start gap-2">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[10px] font-black bg-slate-900 text-white px-2 py-0.5 rounded shadow-xs">
                              № {task.taskNumber || "—"}
                            </span>
                            <span className="text-[10px] text-slate-500 font-bold bg-slate-50 px-2 py-0.5 rounded border">
                              {task.goal.title}
                            </span>
                            {task.parentTask && (
                              <span className="text-[9px] font-bold bg-orange-50 text-orange-800 border border-orange-200 px-1.5 py-0.2 rounded">
                                Повт. №{task.parentTask.taskNumber}
                              </span>
                            )}
                          </div>
                          {task.isPriority && (
                            <span className="text-red-600 font-bold text-[9px] uppercase">Срочно</span>
                          )}
                        </div>
                        <h4 className="font-bold text-slate-800 text-sm leading-snug">{task.title}</h4>
                        
                        <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-100">
                          <span className="flex items-center gap-1" title="Дата постановки">
                            <Calendar className="h-3 w-3 text-slate-400" />
                            {new Date(task.createdAt).toLocaleDateString("ru-RU")}
                          </span>
                          {task.deadline && (
                            <span className="flex items-center gap-1 font-semibold text-slate-600" title="Срок сдачи">
                              <Clock className="h-3 w-3 text-slate-400" />
                              До {new Date(task.deadline).toLocaleDateString("ru-RU")}
                            </span>
                          )}
                        </div>
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
        <div className="flex justify-center items-center gap-3 bg-white px-4 py-3 rounded-2xl border border-slate-200 max-w-xs mx-auto shadow-xs">
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
        onClose={() => { setIsTaskModalOpen(false); setReassignParentTask(null); }}
        editingTask={editingTask}
        reassignParentTask={reassignParentTask}
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
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-xl text-xs font-black bg-slate-900 text-white shadow-xs">
                  № {activeTask.taskNumber || "—"}
                </span>
                <h3 className="text-lg font-bold text-slate-800">Рабочее пространство задачи</h3>
                {activeTask.taskNumber && (
                  <button
                    onClick={() => copyTaskReference(activeTask.taskNumber, activeTask.title)}
                    className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                    title="Скопировать ссылку с номером задачи"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                )}
              </div>
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
                  {activeTask.intermediateControl && (
                    <span className="text-[10px] bg-amber-100 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-full font-bold">
                      Контроль / Требуется отчет
                    </span>
                  )}

                  {/* ⚡ Кнопка «Назначить повторно» в шапке карточки для просроченной задачи */}
                  {isAdmin && activeTask.deadline && new Date(activeTask.deadline) < startOfToday && (
                    <button
                      onClick={() => handleOpenReassignModal(activeTask)}
                      className="text-[10px] bg-orange-100 hover:bg-orange-200 text-orange-900 border border-orange-300 px-2.5 py-0.5 rounded-full font-black uppercase tracking-wider flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <RotateCcw className="h-3 w-3 text-orange-600" /> Назначить повторно
                    </button>
                  )}
                </div>

                {/* ⚡ ПЕРЕКРЕСТНЫЕ ССЫЛКИ РОДИТЕЛЬСКОЙ И ПОВТОРНОЙ ЗАДАЧ (ПУНКТ 7) */}
                {activeTask.parentTask && (
                  <div className="p-3 bg-orange-50 border border-orange-200 rounded-2xl flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2 text-orange-900">
                      <RotateCcw className="h-4 w-4 text-orange-600 shrink-0" />
                      <span>Повторное поручение от задачи <strong>№{activeTask.parentTask.taskNumber}</strong> «{activeTask.parentTask.title}»</span>
                    </div>
                    <button
                      onClick={() => {
                        const target = initialTasks.find((t) => t.id === activeTask.parentTask.id);
                        if (target) setActiveTask(target);
                        else router.push(`/app/tasks?taskId=${activeTask.parentTask.id}`);
                      }}
                      className="px-2.5 py-1 bg-white hover:bg-orange-100 text-orange-800 border border-orange-300 rounded-lg text-[10px] font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1"
                    >
                      <LinkIcon className="h-3 w-3" /> Открыть исходную
                    </button>
                  </div>
                )}

                {activeTask.childTasks && activeTask.childTasks.length > 0 && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-2xl flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2 text-blue-900">
                      <AlertTriangle className="h-4 w-4 text-blue-600 shrink-0" />
                      <span>По этой задаче назначено повторное поручение: <strong>№{activeTask.childTasks[0].taskNumber}</strong> «{activeTask.childTasks[0].title}»</span>
                    </div>
                    <button
                      onClick={() => {
                        const target = initialTasks.find((t) => t.id === activeTask.childTasks[0].id);
                        if (target) setActiveTask(target);
                        else router.push(`/app/tasks?taskId=${activeTask.childTasks[0].id}`);
                      }}
                      className="px-2.5 py-1 bg-white hover:bg-blue-100 text-blue-800 border border-blue-300 rounded-lg text-[10px] font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1"
                    >
                      <LinkIcon className="h-3 w-3" /> Перейти к новой
                    </button>
                  </div>
                )}

                {/* Блок запросов на продление срока */}
                {isAdmin && activeTask.extensionRequests?.some((r: any) => r.status === "PENDING") && (
                  <div className="p-4 bg-amber-50 border border-amber-300 rounded-2xl space-y-2 animate-fade-in">
                    <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
                      <AlertTriangle className="h-4 w-4 text-amber-600" />
                      <span>Запрос на продление дедлайна от исполнителя:</span>
                    </div>
                    {activeTask.extensionRequests.filter((r: any) => r.status === "PENDING").map((req: any) => (
                      <div key={req.id} className="space-y-1.5 text-xs text-slate-800 bg-white p-3 rounded-xl border border-amber-200 shadow-xs">
                        <div className="flex justify-between font-bold">
                          <span>👤 {req.user?.name || "Сотрудник"}</span>
                          <span className="text-blue-700">
                            Желаемый срок: {req.requestedDeadline ? new Date(req.requestedDeadline).toLocaleDateString("ru-RU") : "Не указан"}
                          </span>
                        </div>
                        <p className="text-slate-600 italic">«{req.reason}»</p>
                        <div className="flex gap-2 pt-1.5">
                          <button
                            onClick={() => handleApproveExtension(req.id)}
                            disabled={isPending}
                            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                          >
                            <Check className="h-3.5 w-3.5" /> Одобрить перенос
                          </button>
                          <button
                            onClick={() => handleRejectExtension(req.id)}
                            disabled={isPending}
                            className="px-3 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                          >
                            <X className="h-3.5 w-3.5" /> Отклонить
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div>
                  <h4 className="text-xl font-extrabold text-slate-900">
                    <span className="text-blue-600 mr-2">№{activeTask.taskNumber}</span>
                    {activeTask.title}
                  </h4>
                  
                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 mt-1.5 font-medium">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-slate-400" />
                      <span>Поставлена: <strong>{new Date(activeTask.createdAt).toLocaleDateString("ru-RU")}</strong></span>
                    </div>
                    {activeTask.deadline && (
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 text-slate-400" />
                        <span>Срок сдачи: <strong>{new Date(activeTask.deadline).toLocaleDateString("ru-RU")}</strong></span>
                      </div>
                    )}
                  </div>

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

                {/* Персональные задания исполнителям в задаче */}
                <div className="border-t border-slate-100 pt-4 space-y-2">
                  <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Исполнители и подзадачи</h5>
                  <div className="space-y-2">
                    {activeTask.assignments.map((as: any) => (
                      <div key={as.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-slate-800 text-sm">{as.user.name}</span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                            {as.status.name}
                          </span>
                        </div>
                        {as.stepInstruction && (
                          <div className="text-[11px] text-blue-700 font-medium flex items-center gap-1">
                            <Sparkles className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                            <span>Указание: {as.stepInstruction}</span>
                          </div>
                        )}
                        {as.reportText && (
                          <div className="p-2.5 bg-white border border-slate-200 rounded-lg text-xs space-y-0.5 shadow-xs">
                            <span className="text-[10px] font-bold text-emerald-700 uppercase flex items-center gap-1">
                              <FileCheck2 className="h-3 w-3" /> Обратная связь / Отчет исполнителя:
                            </span>
                            <p className="text-slate-800 whitespace-pre-line leading-relaxed font-medium">{as.reportText}</p>
                          </div>
                        )}

                        {isAdmin && (
                          <div className="pt-2 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
                            <span className="text-[10px] text-slate-500 font-bold uppercase">Установить статус:</span>
                            <div className="flex gap-1.5">
                              {statuses.map((st) => (
                                <button
                                  key={st.id}
                                  disabled={isPending || as.statusId === st.id}
                                  onClick={() => handleStatusChange(as.id, st.id)}
                                  className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                                    as.statusId === st.id
                                      ? "bg-slate-300 text-slate-800 cursor-default"
                                      : "bg-white border border-slate-300 text-slate-700 hover:bg-slate-100"
                                  }`}
                                >
                                  {st.name}
                                </button>
                              ))}
                              {as.statusId === "status-done" && (
                                <button
                                  disabled={isPending}
                                  onClick={() => handleStatusChange(as.id, "status-in-progress")}
                                  className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-blue-600 hover:bg-blue-700 text-white transition-all flex items-center gap-1 cursor-pointer"
                                  title="Вернуть сотрудника в работу"
                                >
                                  <RotateCcw className="h-3 w-3" /> Вернуть
                                </button>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Статус задачи сотрудника, форма отчета и кнопка продления срока */}
                {!isAdmin && (
                  <div className="border-t border-slate-100 pt-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Мой статус и действия</h5>
                      {(() => {
                        const myAs = activeTask.assignments.find((as: any) => as.userId === currentUserId);
                        const myPendingReq = activeTask.extensionRequests?.find(
                          (r: any) => r.userId === currentUserId && r.status === "PENDING"
                        );

                        if (!myAs || myAs.statusId === "status-done") return null;

                        if (myPendingReq) {
                          return (
                            <span className="text-[10px] bg-amber-50 text-amber-800 border border-amber-200 px-2 py-1 rounded-lg font-bold flex items-center gap-1 animate-pulse">
                              <History className="h-3 w-3 text-amber-600" />
                              Запрос на продление до {myPendingReq.requestedDeadline ? new Date(myPendingReq.requestedDeadline).toLocaleDateString("ru-RU") : "..."} на рассмотрении
                            </span>
                          );
                        }

                        return (
                          <button
                            type="button"
                            onClick={() => {
                              setExtensionDeadlineInput(activeTask.deadline ? activeTask.deadline.split("T")[0] : "");
                              setIsExtensionModalOpen(true);
                            }}
                            className="flex items-center gap-1 px-3 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer"
                          >
                            <CalendarPlus className="h-3.5 w-3.5 text-amber-600" />
                            <span>Продлить срок</span>
                          </button>
                        );
                      })()}
                    </div>

                    {(() => {
                      const myAs = activeTask.assignments.find((as: any) => as.userId === currentUserId);
                      if (!myAs) return null;

                      if (myAs.isBlocked) {
                        return (
                          <div className="flex items-center gap-2 text-xs font-bold text-red-600 bg-red-50 border border-red-200 p-3 rounded-xl">
                            <Lock className="h-4 w-4" /> Задача заблокирована. Ожидайте завершения предыдущего этапа в цепочке.
                          </div>
                        );
                      }

                      return (
                        <div className="space-y-3">
                          <div className="flex gap-2">
                            {statuses.map((st) => (
                              <button
                                key={st.id}
                                disabled={isPending || (myAs.statusId === "status-done" && st.id !== "status-done")}
                                onClick={() => handleStatusChange(myAs.id, st.id)}
                                className={`flex-1 px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                                  myAs.statusId === st.id
                                    ? "bg-blue-600 text-white ring-2 ring-blue-500 ring-offset-2"
                                    : "bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100 cursor-pointer"
                                } ${myAs.statusId === "status-done" && st.id !== "status-done" ? "opacity-50 cursor-not-allowed" : ""}`}
                              >
                                {myAs.statusId === st.id && "✓ "}
                                {st.name}
                              </button>
                            ))}
                          </div>

                          {myAs.statusId === "status-done" && (
                            <p className="text-[11px] text-slate-500 italic">
                              * Задача отмечена как исполненная. Если требуется возобновить работу, обратитесь к руководителю.
                            </p>
                          )}

                          {/* Поле ввода отчета / обратной связи */}
                          <div className={`p-3.5 rounded-xl space-y-2 border ${
                            activeTask.intermediateControl && !myAs.reportText
                              ? "bg-amber-50/60 border-amber-300"
                              : "bg-slate-50 border-slate-200"
                          }`}>
                            <label className="block text-xs font-bold text-slate-700 flex items-center justify-between">
                              <span className="flex items-center gap-1">
                                <FileCheck2 className="h-4 w-4 text-emerald-600" />
                                Ваш отчет / Обратная связь руководителю
                              </span>
                              {activeTask.intermediateControl && (
                                <span className="text-[10px] text-amber-700 font-extrabold uppercase">
                                  * Обязательно для закрытия
                                </span>
                              )}
                            </label>
                            <textarea
                              rows={2}
                              placeholder="Опишите результат выполнения, прикрепите ссылки на готовые файлы..."
                              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:border-blue-500 text-slate-800 bg-white"
                              value={reportInput}
                              onChange={(e) => setReportInput(e.target.value)}
                            />
                            <button
                              type="button"
                              disabled={isPending || !reportInput.trim()}
                              onClick={() => handleSaveReport(myAs.id)}
                              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors disabled:bg-emerald-300 cursor-pointer"
                            >
                              Сохранить отчет
                            </button>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>

              {/* Чат обсуждения задачи */}
              <div className="lg:col-span-5 p-6 bg-slate-50/50 flex flex-col h-full overflow-hidden border-t lg:border-t-0 lg:border-l border-slate-200">
                <div className="border-b border-slate-100 pb-3 mb-3 flex items-center gap-2 shrink-0">
                  <Send className="h-4 w-4 text-blue-500" />
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Обсуждение</span>
                </div>

                <div className="flex-1 overflow-y-auto space-y-3 pr-1 mb-4">
                  {!activeTask.comments || activeTask.comments.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-xs text-slate-400 italic">
                      Сообщений пока нет.
                    </div>
                  ) : (
                    activeTask.comments.map((comment: any) => (
                      <div key={comment.id} className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-xs space-y-1 text-xs">
                        <div className="flex justify-between items-center text-[10px] text-slate-400">
                          <span className="font-bold text-slate-700">{comment.user?.name || "Пользователь"}</span>
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

      {/* МОДАЛЬНОЕ ОКНО ЗАПРОСА НА ПРОДЛЕНИЕ ДЕДЛАЙНА (ДЛЯ СОТРУДНИКА) */}
      {isExtensionModalOpen && activeTask && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-200 bg-slate-50">
              <div className="flex items-center gap-2">
                <CalendarPlus className="h-5 w-5 text-amber-600" />
                <h3 className="text-base font-bold text-slate-800">Запрос на перенос срока</h3>
              </div>
              <button onClick={() => setIsExtensionModalOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitExtensionRequest} className="p-6 space-y-4" autoComplete="off">
              <div>
                <span className="text-xs text-slate-500 font-medium">Задача:</span>
                <p className="font-bold text-slate-900 text-sm">
                  <span className="text-blue-600 mr-1.5 font-black">№{activeTask.taskNumber}</span>
                  {activeTask.title}
                </p>
                {activeTask.deadline && (
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Текущий дедлайн: {new Date(activeTask.deadline).toLocaleDateString("ru-RU")}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Желаемый новый срок выполнения *
                </label>
                <input
                  type="date"
                  required
                  min={new Date().toISOString().split("T")[0]}
                  value={extensionDeadlineInput}
                  onChange={(e) => setExtensionDeadlineInput(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:border-amber-500 text-slate-800 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Причина переноса срока (для руководителя) *
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Опишите, с чем связана задержка и сколько времени требуется..."
                  value={extensionReasonInput}
                  onChange={(e) => setExtensionReasonInput(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:outline-none focus:border-amber-500 text-slate-800 bg-white"
                />
              </div>

              <div className="flex gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsExtensionModalOpen(false)}
                  className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={isPending || !extensionDeadlineInput || !extensionReasonInput.trim()}
                  className="flex-1 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs disabled:bg-amber-300 cursor-pointer"
                >
                  {isPending ? "Отправка..." : "Отправить руководителю"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* МОДАЛЬНОЕ ОКНО ВСЕХ ЗАПРОСОВ НА ПЕРЕНОС (ДЛЯ РУКОВОДИТЕЛЯ) */}
      {isAllExtensionsModalOpen && isAdmin && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh]">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-200 bg-slate-50">
              <div className="flex items-center gap-2">
                <History className="h-5 w-5 text-red-600" />
                <h3 className="text-base font-bold text-slate-800">
                  Запросы сотрудников на перенос срока ({pendingExtensionsCount})
                </h3>
              </div>
              <button onClick={() => setIsAllExtensionsModalOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-3">
              {pendingExtensions.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400 italic">
                  Нет ожидающих рассмотрения запросов
                </div>
              ) : (
                pendingExtensions.map((req: any) => (
                  <div key={req.id} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2 text-xs shadow-xs">
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <span className="font-extrabold text-slate-900 text-sm block">
                          {req.task?.taskNumber && <span className="text-blue-600 mr-1.5">№{req.task.taskNumber}</span>}
                          {req.task?.title}
                        </span>
                        <span className="text-slate-500 text-[11px]">
                          Исполнитель: <strong>{req.user?.name}</strong> {req.user?.department ? `(${req.user.department})` : ""}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-slate-400 block text-[10px]">
                          Текущий срок: {req.task?.deadline ? new Date(req.task.deadline).toLocaleDateString("ru-RU") : "Не установлен"}
                        </span>
                        <span className="font-extrabold text-blue-700 text-xs block">
                          Новый срок: {req.requestedDeadline ? new Date(req.requestedDeadline).toLocaleDateString("ru-RU") : "—"}
                        </span>
                      </div>
                    </div>

                    <div className="p-3 bg-white border border-slate-200 rounded-xl text-slate-700 leading-relaxed italic">
                      «{req.reason}»
                    </div>

                    <div className="flex justify-end gap-2 pt-1 border-t border-slate-200/60">
                      <button
                        onClick={() => handleRejectExtension(req.id)}
                        disabled={isPending}
                        className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                      >
                        <X className="h-3.5 w-3.5" /> Отклонить
                      </button>
                      <button
                        onClick={() => handleApproveExtension(req.id)}
                        disabled={isPending}
                        className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 shadow-xs"
                      >
                        <Check className="h-3.5 w-3.5" /> Одобрить перенос
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex justify-end">
              <button
                onClick={() => setIsAllExtensionsModalOpen(false)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
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