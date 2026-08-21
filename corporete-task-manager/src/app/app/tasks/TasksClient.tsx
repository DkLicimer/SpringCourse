// src/app/app/tasks/TasksClient.tsx
"use client";

import React, { useState, useTransition, useEffect, useRef } from "react";
import { 
  createGoal, 
  createTask, 
  updateAssignmentStatus,
  updateGoal,
  deleteGoal,
  addComment,
  createTaskStatus,
  deleteTaskStatus,
  updateTask,
  requestExtension,
  approveExtension,
  rejectExtension,
  duplicateTask,
  deleteTask,
  activateTask
} from "@/server/actions/tasks";
import { 
  Plus, 
  FolderPlus, 
  Lock, 
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
  ChevronUp,
  Search,
  Filter,
  LayoutGrid,
  TableProperties,
  CalendarDays,
  Repeat,
  History,
  AlertTriangle,
  FolderLock,
  Play,
  Briefcase
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
  stepInstruction: string | null;
  user: { name: string; initials: string; department?: string | null }; // Добавлено подразделение
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
  isPriority: boolean;
  isRecurring: boolean;
  isPerspective: boolean;
  reminderDate: string | null;
  goal: Goal;
  assignments: Assignment[];
  comments: Comment[];
  createdAt: string; 
};

type ExtensionRequest = {
  id: string;
  taskId: string;
  status: string;
  createdAt: string;
  reason: string | null;
  task: { title: string; deadline: string | null };
  user: { name: string; initials: string };
};

interface TasksClientProps {
  initialTasks: Task[];
  goals: Goal[];
  users: { id: string; name: string; initials: string; department?: string | null }[];
  statuses: TaskStatus[];
  currentUserId: string;
  isAdmin: boolean;
  currentPage: number;
  totalPages: number;
  taskToOpen: Task | null;
  currentUserPeriod?: {
    type: string;
    start: string;
    end: string;
    completionRate: number;
  };
  extensionRequests?: ExtensionRequest[];
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
}: TasksClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isGoalOpen, setIsGoalOpen] = useState(false);
  const [isManageGoalsOpen, setIsManageGoalsOpen] = useState(false);
  const [isManageStatusesOpen, setIsManageStatusesOpen] = useState(false);
  const [isManageExtensionsOpen, setIsManageExtensionsOpen] = useState(false);
  const [isTaskOpen, setIsTaskOpen] = useState(false);
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  // ⚡ По умолчанию табличный вид открывается первым
  const [viewMode, setViewMode] = useState<"standard" | "table">("table");
  
  // Переключение вкладок "В работе" и "На перспективу"
  const [taskTab, setTaskTab] = useState<"active" | "perspective">("active");

  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

  const showToast = (message: string, type: "success" | "error" | "info" = "success") => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  const [searchQuery, setSearchQuery] = useState("");
  const [filterGoalId, setFilterGoalId] = useState("all");
  const [filterStatusId, setFilterStatusId] = useState("all");
  const [filterAssigneeId, setFilterAssigneeId] = useState("all");
  const [filterPriorityOnly, setFilterPriorityOnly] = useState(false);

  // ⚡ НОВОЕ: Стейты для фильтрации по подразделению исполнителя
  const [filterDepartment, setFilterDepartment] = useState("all");

  // ⚡ НОВОЕ: Стейты для модального окна дублирования/повтора задачи (вместо window.prompt)
  const [isDuplicateModalOpen, setIsDuplicateModalOpen] = useState(false);
  const [duplicateTaskId, setDuplicateTaskId] = useState<string | null>(null);
  const [duplicateDeadline, setDuplicateDeadline] = useState("");

  const [expandedTaskIds, setExpandedTaskIds] = useState<string[]>([]);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const [goalTitle, setGoalTitle] = useState("");
  const [goalColor, setGoalColor] = useState("#3b82f6");

  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);
  const [editGoalTitle, setEditGoalTitle] = useState("");
  const [editGoalColor, setEditGoalColor] = useState("#3b82f6");

  const [newStatusName, setNewStatusName] = useState("");
  const [newStatusColor, setNewStatusColor] = useState("#3b82f6");

  const [commentText, setCommentText] = useState("");
  const [extensionReason, setExtensionReason] = useState("");
  const [isExtensionModalOpen, setIsExtensionReasonOpen] = useState(false);

  const [selectedAssignees, setSelectedAssignees] = useState<string[]>([]);
  const [assignmentType, setAssignmentType] = useState<"INDIVIDUAL" | "SIMULTANEOUS" | "SEQUENTIAL">("INDIVIDUAL");
  const [isPriorityState, setIsPriorityState] = useState(false);
  const [isRecurringState, setIsRecurringState] = useState(false);

  // Стейты под новые поля задач на перспективу
  const [isPerspectiveState, setIsPerspectiveState] = useState(false);
  const [reminderDateState, setReminderDateState] = useState("");

  const [stepInstructions, setStepInstructions] = useState<Record<string, string>>({});

  const [newDeadlines, setNewDeadlines] = useState<Record<string, string>>({});

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const todayStr = startOfToday.toISOString().split("T")[0];

  const chatEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (taskToOpen) {
      setActiveTask(taskToOpen);
    }
  }, [taskToOpen]);

  useEffect(() => {
    if (activeTask) {
      const updated = initialTasks.find(t => t.id === activeTask.id);
      if (updated) {
        setActiveTask(updated);
      }
    }
  }, [initialTasks]);

  useEffect(() => {
    if (!activeTask) return;

    const interval = setInterval(() => {
      startTransition(() => {
        router.refresh();
      });
    }, 5000);

    return () => clearInterval(interval);
  }, [activeTask, router]);

  useEffect(() => {
    if (activeTask && chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [activeTask?.comments?.length, activeTask?.id]);

  // ⚡ Динамический сбор уникальных подразделений для выпадающего списка
  const uniqueDepartments = Array.from(
    new Set(users.map((u) => u.department).filter(Boolean))
  ) as string[];

  // Фильтрация и фильтрация по вкладке "На перспективу"
  const filteredTasks = initialTasks.filter((task) => {
    const matchesTab = taskTab === "perspective" ? task.isPerspective : !task.isPerspective;
    
    const matchesSearch = 
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (task.description && task.description.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesGoal = filterGoalId === "all" || task.goal.id === filterGoalId;
    const matchesStatus = filterStatusId === "all" || task.assignments.some(as => as.statusId === filterStatusId);
    const matchesAssignee = filterAssigneeId === "all" || task.assignments.some(as => as.userId === filterAssigneeId);
    
    // ⚡ Фильтрация по подразделению сотрудника
    const matchesDepartment = filterDepartment === "all" || task.assignments.some(as => as.user.department === filterDepartment);
    
    const matchesPriority = !filterPriorityOnly || task.isPriority;

    return matchesTab && matchesSearch && matchesGoal && matchesStatus && matchesAssignee && matchesDepartment && matchesPriority;
  });

  const sortedTasks = [...filteredTasks].sort((a, b) => {
    const aCompleted = isAdmin 
      ? a.assignments.every(as => as.statusId === "status-done")
      : a.assignments.find(as => as.userId === currentUserId)?.statusId === "status-done";

    const bCompleted = isAdmin 
      ? b.assignments.every(as => as.statusId === "status-done")
      : b.assignments.find(as => as.userId === currentUserId)?.statusId === "status-done";

    if (aCompleted && !bCompleted) return 1;
    if (!aCompleted && bCompleted) return -1;

    if (a.isPriority && !b.isPriority) return -1;
    if (!a.isPriority && b.isPriority) return 1;

    if (a.deadline && b.deadline) {
      return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
    }
    if (a.deadline) return -1;
    if (b.deadline) return 1;

    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      try {
        await createGoal(goalTitle, goalColor);
        setGoalTitle("");
        setIsGoalOpen(false);
        showToast("Новая цель успешно создана!", "success");
        router.refresh();
      } catch (err: any) {
        showToast(err.message || "Ошибка создания цели", "error");
      }
    });
  };

  const handleUpdateGoal = async (goalId: string) => {
    if (!editGoalTitle.trim()) {
      showToast("Название цели не может быть пустым", "error");
      return;
    }
    startTransition(async () => {
      try {
        await updateGoal(goalId, editGoalTitle, editGoalColor);
        setEditingGoalId(null);
        showToast("Глобальная цель обновлена", "success");
        router.refresh();
      } catch (err: any) {
        showToast(err.message || "Ошибка обновления цели", "error");
      }
    });
  };

  const handleDeleteGoal = async (goalId: string, title: string) => {
    if (!window.confirm(`ВНИМАНИЕ! Удаление цели "${title}" приведет к БЕЗВОЗВРАТНОМУ удалению ВСЕХ связанных задач! Вы уверены?`)) {
      return;
    }
    startTransition(async () => {
      try {
        await deleteGoal(goalId);
        showToast("Цель и связанные задачи удалены", "success");
        router.refresh();
      } catch (err: any) {
        showToast(err.message || "Ошибка удаления цели", "error");
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
        showToast("Новый статус задач добавлен", "success");
        router.refresh();
      } catch (err: any) {
        showToast(err.message || "Ошибка создания статуса", "error");
      }
    });
  };

  const handleDeleteStatus = async (statusId: string, name: string) => {
    if (!window.confirm(`Вы уверены, что хотите полностью удалить статус "${name}"?`)) return;

    startTransition(async () => {
      try {
        await deleteTaskStatus(statusId);
        showToast("Статус успешно удален", "success");
        router.refresh();
      } catch (err: any) {
        showToast(err.message || "Ошибка удаления статуса", "error");
      }
    });
  };

  const openCreateTaskModal = () => {
    setEditingTask(null);
    setAssignmentType("INDIVIDUAL");
    setSelectedAssignees([]);
    setIsPriorityState(false);
    setIsRecurringState(false);
    setIsPerspectiveState(false);
    setReminderDateState("");
    setStepInstructions({});
    setIsTaskOpen(true);
  };

  const openEditTaskModal = (task: Task, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingTask(task);
    setAssignmentType(task.assignmentType);
    setSelectedAssignees(task.assignments.map(as => as.userId));
    setIsPriorityState(task.isPriority);
    setIsRecurringState(task.isRecurring);
    setIsPerspectiveState(task.isPerspective);
    setReminderDateState(task.reminderDate ? task.reminderDate.split("T")[0] : "");

    const instructionsDict: Record<string, string> = {};
    task.assignments.forEach(as => {
      instructionsDict[as.userId] = as.stepInstruction || "";
    });
    setStepInstructions(instructionsDict);

    setIsTaskOpen(true);
  };

  const handleSaveTask = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (selectedAssignees.length === 0) {
      showToast("Выберите хотя бы одного исполнителя", "error");
      return;
    }

    const stepInstructionsArray = selectedAssignees.map(userId => stepInstructions[userId] || "");

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
      isPriority: isPriorityState,
      isRecurring: isRecurringState,
      isPerspective: isPerspectiveState,
      reminderDate: isPerspectiveState ? (formData.get("reminderDate") as string) : undefined,
      stepInstructions: stepInstructionsArray,
    };

    startTransition(async () => {
      try {
        if (editingTask) {
          await updateTask(editingTask.id, taskInput);
          showToast("Задача успешно обновлена", "success");
        } else {
          await createTask(taskInput);
          showToast("Новая задача успешно создана!", "success");
        }
        setSelectedAssignees([]);
        setStepInstructions({});
        setIsTaskOpen(false);
        router.refresh();
      } catch (err: any) {
        showToast(err.message || "Ошибка сохранения задачи", "error");
      }
    });
  };

  const handleStatusChange = async (assignmentId: string, newStatusId: string) => {
    startTransition(async () => {
      try {
        await updateAssignmentStatus(assignmentId, newStatusId);
        showToast("Статус задачи изменен", "success");
        router.refresh();
      } catch (err: any) {
        showToast(err.message || "Не удалось изменить статус", "error");
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
      user: { name: "Вы", initials: "Вы" }
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
      } catch (err: any) {
        showToast(err.message || "Не удалось отправить комментарий", "error");
        const originalTask = initialTasks.find(t => t.id === activeTask!.id);
        if (originalTask) {
          setActiveTask(originalTask);
        }
      }
    });
  };

  const handleRequestExtension = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTask) return;

    startTransition(async () => {
      try {
        await requestExtension(activeTask.id, extensionReason);
        setExtensionReason("");
        setIsExtensionReasonOpen(false);
        showToast("Запрос на продление успешно направлен руководителю", "info");
        router.refresh();
      } catch (err: any) {
        showToast(err.message || "Ошибка отправки запроса", "error");
      }
    });
  };

  const handleApproveExtension = async (requestId: string) => {
    const newDate = newDeadlines[requestId];
    if (!newDate) {
      showToast("Укажите новый срок перед одобрением", "error");
      return;
    }

    startTransition(async () => {
      try {
        await approveExtension(requestId, newDate);
        showToast("Перенос срока утвержден", "success");
        router.refresh();
      } catch (err: any) {
        showToast(err.message || "Ошибка применения переноса", "error");
      }
    });
  };

  const handleRejectExtension = async (requestId: string) => {
    if (!window.confirm("Отклонить данный запрос на перенос срока?")) return;

    startTransition(async () => {
      try {
        await rejectExtension(requestId);
        showToast("Запрос на перенос отклонен", "info");
        router.refresh();
      } catch (err: any) {
        showToast(err.message || "Ошибка отклонения", "error");
      }
    });
  };

  // ⚡ УЛУЧШЕНО: Открывает модалку для дублирования с календарем вместо prompt
  const openDuplicateModal = (taskId: string) => {
    setDuplicateTaskId(taskId);
    setDuplicateDeadline("");
    setIsDuplicateModalOpen(true);
  };

  const handleConfirmDuplicate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!duplicateTaskId) return;

    startTransition(async () => {
      try {
        await duplicateTask(duplicateTaskId, duplicateDeadline || undefined);
        showToast("Регулярная задача успешно продублирована на новый срок!", "success");
        setIsDuplicateModalOpen(false);
        setDuplicateTaskId(null);
        setActiveTask(null);
        router.refresh();
      } catch (err: any) {
        showToast(err.message || "Ошибка дублирования задачи", "error");
      }
    });
  };

  const handleDeleteTask = async (taskId: string, title: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm(`Вы действительно хотите БЕЗВОЗВРАТНО удалить задачу "${title}" со всеми комментариями и историей?`)) {
      return;
    }

    startTransition(async () => {
      try {
        await deleteTask(taskId);
        showToast("Задача успешно удалена", "success");
        router.refresh();
      } catch (err: any) {
        showToast(err.message || "Ошибка удаления задачи", "error");
      }
    });
  };

  const handleActivateTask = async (taskId: string, title: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm(`Запустить отложенную задачу "${title}" в активную работу для исполнителей?`)) {
      return;
    }

    startTransition(async () => {
      try {
        await activateTask(taskId);
        showToast("Задача успешно запущена в работу!", "success");
        setActiveTask(null);
        router.refresh();
      } catch (err: any) {
        showToast(err.message || "Ошибка запуска задачи", "error");
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
    setStepInstructions({});
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

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      router.push(`/app/tasks?page=${newPage}`);
    }
  };

  const clearFilters = () => {
    setSearchQuery("");
    setFilterGoalId("all");
    setFilterStatusId("all");
    setFilterAssigneeId("all");
    setFilterDepartment("all"); // Очищаем отдел
    setFilterPriorityOnly(false);
  };

  const pendingExtensionsCount = extensionRequests.filter((req) => req.status === "PENDING").length;

  return (
    <div className="space-y-6">
      {/* Toast-нотификатор */}
      {toast && (
        <div className={`fixed bottom-6 left-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl border text-xs font-semibold animate-slide-up transition-all ${
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
          <button onClick={() => setToast(null)} className="ml-2 text-slate-400 hover:text-slate-600 transition-colors">
            <X className="h-3 w-3" />
          </button>
        </div>
      )}

      {/* Шапка модуля */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 print:hidden">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold text-slate-800">Задачи и цели</h2>
          <p className="text-slate-500 text-sm">Оперативное управление задачами и глобальными направлениями</p>
        </div>

        {/* Успеваемость */}
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
                  <div 
                    className="bg-blue-600 h-1.5 rounded-full" 
                    style={{ width: `${currentUserPeriod.completionRate}%` }} 
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Вид (Таблица/Плитки) */}
        <div className="flex items-center gap-2 self-stretch sm:self-auto bg-white p-1 rounded-xl border border-slate-200 shadow-sm shrink-0">
          <button
            onClick={() => setViewMode("standard")}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              viewMode === "standard"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-slate-600 hover:text-slate-800"
            }`}
          >
            <LayoutGrid className="h-3.5 w-3.5" />
            {isAdmin ? "Плитки" : "Канбан"}
          </button>
          <button
            onClick={() => setViewMode("table")}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              viewMode === "table"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-slate-600 hover:text-slate-800"
            }`}
          >
            <TableProperties className="h-3.5 w-3.5" />
            Компактная таблица
          </button>
        </div>

        {isAdmin && (
          <div className="flex flex-wrap gap-2 w-full md:w-auto">
            {pendingExtensionsCount > 0 && (
              <button
                onClick={() => setIsManageExtensionsOpen(true)}
                className="flex items-center justify-center gap-2 border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 px-3.5 py-2 rounded-lg text-xs font-black transition-colors cursor-pointer animate-pulse shrink-0"
              >
                <History className="h-3.5 w-3.5 text-red-600" />
                Переносы ({pendingExtensionsCount})
              </button>
            )}
            <button
              onClick={() => setIsManageStatusesOpen(true)}
              className="flex items-center justify-center gap-2 border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
            >
              <Sliders className="h-3.5 w-3.5 text-slate-500" />
              Статусы
            </button>
            <button
              onClick={() => setIsManageGoalsOpen(true)}
              className="flex items-center justify-center gap-2 border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
            >
              <Settings className="h-3.5 w-3.5 text-slate-500" />
              Цели
            </button>
            <button
              onClick={() => setIsGoalOpen(true)}
              className="flex items-center justify-center gap-2 border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
            >
              <FolderPlus className="h-3.5 w-3.5 text-slate-500" />
              Добавить цель
            </button>
            <button
              onClick={openCreateTaskModal}
              className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-xs font-bold transition-colors shadow-sm cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              Добавить задачу
            </button>
          </div>
        )}
      </div>

      {/* Переключатель вкладок "В работе" и "На перспективу" */}
      {isAdmin && (
        <div className="flex bg-slate-200/60 p-1 rounded-xl max-w-sm border border-slate-200 shadow-inner print:hidden">
          <button
            onClick={() => setTaskTab("active")}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-black transition-all cursor-pointer ${
              taskTab === "active" 
                ? "bg-white text-blue-600 shadow-sm" 
                : "text-slate-600 hover:text-slate-800"
            }`}
          >
            В работе (активные)
          </button>
          <button
            onClick={() => setTaskTab("perspective")}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              taskTab === "perspective" 
                ? "bg-white text-blue-600 shadow-sm" 
                : "text-slate-600 hover:text-slate-800"
            }`}
          >
            <FolderLock className="h-3.5 w-3.5 text-purple-600" /> На перспективу
          </button>
        </div>
      )}

      {/* 🔍 ПАНЕЛЬ ФИЛЬТРАЦИИ */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
          <Filter className="h-3.5 w-3.5 text-slate-400" /> Фильтрация бэклога задач
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 items-end">
          <div className="relative">
            <label className="block text-[10px] font-semibold text-slate-500 mb-1">Поиск</label>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Поиск..."
                className="w-full pl-8 pr-3 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-blue-500 text-slate-800 placeholder-slate-400"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-semibold text-slate-500 mb-1">Глобальная цель</label>
            <select
              value={filterGoalId}
              onChange={(e) => setFilterGoalId(e.target.value)}
              className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-white text-slate-700 focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="all">Все направления</option>
              {goals.map((g) => (
                <option key={g.id} value={g.id}>{g.title}</option>
              ))}
            </select>
          </div>

          {/* 🏢 НОВОЕ: Фильтрация задач по Подразделению исполнителя */}
          <div>
            <label className="block text-[10px] font-semibold text-slate-500 mb-1">Отдел исполнителя</label>
            <select
              value={filterDepartment}
              onChange={(e) => setFilterDepartment(e.target.value)}
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
              value={filterAssigneeId}
              onChange={(e) => setFilterAssigneeId(e.target.value)}
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
                checked={filterPriorityOnly}
                onChange={(e) => setFilterPriorityOnly(e.target.checked)}
                className="rounded border-slate-300 text-red-600 focus:ring-red-500 h-3.5 w-3.5"
              />
              Срочные
            </label>

            {(searchQuery || filterGoalId !== "all" || filterStatusId !== "all" || filterAssigneeId !== "all" || filterDepartment !== "all" || filterPriorityOnly) && (
              <button
                onClick={clearFilters}
                className="text-[10px] text-blue-600 hover:text-blue-800 font-bold underline cursor-pointer"
              >
                Сбросить
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* РЕЖИМ 1: КОМПАКТНАЯ ТАБЛИЦА */}
      {/* ========================================================================= */}
      {viewMode === "table" ? (
        <div className="space-y-4">
          <div className="hidden md:block bg-white rounded-xl border border-slate-200 overflow-x-auto shadow-sm">
            <table className="min-w-full divide-y divide-slate-200 text-xs">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-slate-500 uppercase tracking-wider">Цель / Задача</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-500 uppercase tracking-wider">Срок (Дедлайн)</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-500 uppercase tracking-wider">Приоритет / Регулярность</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-500 uppercase tracking-wider">Исполнители</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-500 uppercase tracking-wider">Примечания и Указания</th>
                  <th className="px-4 py-3 text-right font-semibold text-slate-500 uppercase tracking-wider">Действия</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {sortedTasks.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-slate-400 italic">Задач пока нет</td>
                  </tr>
                ) : (
                  sortedTasks.map((task) => {
                    const myAs = !isAdmin ? task.assignments.find(as => as.userId === currentUserId) : null;
                    const isCompleted = isAdmin 
                      ? task.assignments.every(as => as.statusId === "status-done")
                      : myAs?.statusId === "status-done";

                    const isOverdue = !isCompleted && task.deadline && new Date(task.deadline) < startOfToday;

                    return (
                      <tr 
                        key={task.id} 
                        onClick={() => setActiveTask(task)}
                        className={`hover:bg-slate-50/50 transition-colors cursor-pointer ${
                          isCompleted ? "opacity-60 bg-slate-50/30" : ""
                        }`}
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
                              <History className="h-3.5 w-3.5 shrink-0 animate-spin-slow" />
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
                            {task.isPerspective && (
                              <span className="text-[9px] bg-blue-100 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">На перспективу</span>
                            )}
                            {!task.isPriority && !task.isRecurring && !task.isPerspective && (
                              <span className="text-[9px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-semibold">Обычная</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex -space-x-1.5 overflow-hidden">
                            {task.assignments.map((as) => (
                              <div
                                key={as.id}
                                className="inline-block h-6 w-6 rounded-full ring-2 ring-white bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-[10px] cursor-pointer shadow-sm"
                                title={`${as.user.name} (${as.isBlocked ? "Блокировано" : as.status.name})`}
                              >
                                {as.user.initials}
                              </div>
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-3 max-w-xs truncate text-slate-500" title={task.adminNotes || task.description || ""}>
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
                                    onClick={(e) => handleActivateTask(task.id, task.title, e)}
                                    className="p-1 hover:bg-emerald-50 text-emerald-600 hover:text-emerald-700 rounded transition-colors cursor-pointer"
                                    title="Запустить задачу в работу"
                                  >
                                    <Play className="h-4 w-4" />
                                  </button>
                                )}
                                <button
                                  onClick={(e) => openEditTaskModal(task, e)}
                                  className="p-1 hover:bg-slate-100 text-slate-500 hover:text-slate-800 rounded transition-colors cursor-pointer"
                                >
                                  <Pencil className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={(e) => handleDeleteTask(task.id, task.title, e)}
                                  className="p-1 hover:bg-red-50 text-red-500 hover:text-red-700 rounded transition-colors cursor-pointer"
                                  title="Удалить задачу"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </>
                            )}
                            <button
                              onClick={(e) => { e.stopPropagation(); setActiveTask(task); }}
                              className="p-1 hover:bg-slate-100 text-slate-500 hover:text-slate-800 rounded transition-colors cursor-pointer"
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

          <div className="block md:hidden space-y-2">
            {sortedTasks.length === 0 ? (
              <div className="p-8 text-center text-slate-400 bg-white rounded-xl border border-slate-200 italic text-sm">Задач пока нет</div>
            ) : (
              sortedTasks.map((task) => {
                const myAs = !isAdmin ? task.assignments.find(as => as.userId === currentUserId) : null;
                const isCompleted = isAdmin 
                  ? task.assignments.every(as => as.statusId === "status-done")
                  : myAs?.statusId === "status-done";

                const isOverdue = !isCompleted && task.deadline && new Date(task.deadline) < startOfToday;

                return (
                  <div 
                    key={task.id} 
                    onClick={() => setActiveTask(task)}
                    className={`bg-white p-3 rounded-lg border border-slate-200 shadow-sm flex flex-col gap-1.5 cursor-pointer hover:border-slate-300 relative ${
                      isCompleted ? "opacity-60 bg-slate-50/50" : ""
                    } ${task.isPriority ? "border-l-4 border-l-red-500" : ""}`}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <span 
                        className="px-2 py-0.5 rounded text-[8px] font-bold text-white uppercase leading-none"
                        style={{ backgroundColor: task.goal.color }}
                      >
                        {task.goal.title}
                      </span>
                      {task.deadline && (
                        <span className={`text-[10px] font-bold flex items-center gap-0.5 ${isOverdue ? "text-red-500" : "text-slate-400"}`}>
                          <Clock className="h-3 w-3" /> {new Date(task.deadline).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    
                    <h4 className={`font-bold text-slate-800 text-xs leading-snug line-clamp-1 ${isCompleted ? "line-through text-slate-400" : ""}`}>{task.title}</h4>
                  </div>
                );
              })
            )}
          </div>
        </div>
      ) : (

        // =========================================================================
        // РЕЖИМ 2: ПЛИТКИ / КАНБАН
        // =========================================================================
        <>
          {isAdmin && (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="p-5 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
                <h3 className="font-bold text-slate-800 text-sm">Все задачи организации</h3>
                <span className="text-xs text-slate-500 font-medium">Отображено задач: {sortedTasks.length}</span>
              </div>
              <div className="divide-y divide-slate-100">
                {sortedTasks.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-sm">Задач пока нет</div>
                ) : (
                  sortedTasks.map((task) => {
                    const isExpanded = expandedTaskIds.includes(task.id);
                    const isCompleted = task.assignments.every(as => as.statusId === "status-done");
                    const isOverdue = !isCompleted && task.deadline && new Date(task.deadline) < startOfToday;

                    return (
                      <div 
                        key={task.id} 
                        className={`p-5 hover:bg-slate-50/50 transition-colors flex flex-col md:flex-row justify-between gap-4 ${
                          isCompleted ? "opacity-60 bg-slate-50/40" : ""
                        }`}
                      >
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-2.5 flex-wrap">
                            <span
                              className="px-2.5 py-0.5 rounded-full text-xs font-semibold text-white"
                              style={{ backgroundColor: task.goal.color }}
                            >
                              {task.goal.title}
                            </span>
                            {task.isPriority && (
                              <span className="text-[10px] bg-red-100 text-red-700 border border-red-200 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider animate-pulse">
                                Срочно
                              </span>
                            )}
                            {task.isRecurring && (
                              <span className="text-[10px] bg-purple-100 text-purple-700 border border-purple-200 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider flex items-center gap-0.5">
                                <Repeat className="h-3 w-3" /> Регулярная
                              </span>
                            )}
                            {task.isPerspective && (
                              <span className="text-[10px] bg-blue-100 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                                На перспективу
                              </span>
                            )}
                          </div>
                          <h4 className={`font-bold text-slate-900 text-base ${isCompleted ? "line-through text-slate-400" : ""}`}>{task.title}</h4>
                          
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

                          {task.isPerspective && task.reminderDate && (
                            <div className="text-xs text-purple-600 font-bold flex items-center gap-1.5">
                              <History className="h-3.5 w-3.5 shrink-0" /> Напоминание: {new Date(task.reminderDate).toLocaleDateString("ru-RU")}
                            </div>
                          )}

                          {!task.isPerspective && task.deadline && (
                            <div className={`text-xs font-semibold flex items-center gap-1 ${isOverdue ? "text-red-500" : "text-slate-400"}`}>
                              <Clock className="h-3.5 w-3.5" /> Дедлайн: {new Date(task.deadline).toLocaleDateString("ru-RU")}
                              {isOverdue && <span className="text-red-600 font-bold uppercase text-[9px] tracking-wide ml-1">(Срок истек!)</span>}
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
                                    <span className={as.statusId === "status-done" ? "text-emerald-600 font-bold" : ""}>{as.status.name}</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                          <div className="flex gap-1">
                            {task.isPerspective && (
                              <button
                                onClick={(e) => handleActivateTask(task.id, task.title, e)}
                                className="p-1.5 hover:bg-emerald-50 rounded-lg text-emerald-600 hover:text-emerald-700 transition-colors cursor-pointer"
                                title="Запустить задачу в работу"
                              >
                                <Play className="h-5 w-5" />
                              </button>
                            )}
                            <button
                              onClick={(e) => openEditTaskModal(task, e)}
                              className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                            >
                              <Pencil className="h-5 w-5" />
                            </button>
                            
                            <button
                              onClick={(e) => handleDeleteTask(task.id, task.title, e)}
                              className="p-1.5 hover:bg-red-50 rounded-lg text-red-500 hover:text-red-700 transition-colors cursor-pointer"
                              title="Удалить задачу"
                            >
                              <Trash2 className="h-5 w-5" />
                            </button>

                            <button
                              onClick={() => setActiveTask(task)}
                              className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
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

          {!isAdmin && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
              {statuses.map((status) => {
                const myTasks = sortedTasks.filter((task) => {
                  const myAssignment = task.assignments.find((as) => as.userId === currentUserId);
                  return myAssignment?.statusId === status.id;
                });

                return (
                  <div key={status.id} className="flex flex-col bg-slate-100 rounded-2xl p-4 min-h-[500px]">
                    <div className="flex items-center gap-2 justify-between mb-4 px-2">
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
                          const isCompleted = myAs.statusId === "status-done";
                          const isOverdue = !isCompleted && task.deadline && new Date(task.deadline) < startOfToday;

                          return (
                            <div
                              key={task.id}
                              onClick={() => setActiveTask(task)}
                              className={`bg-white rounded-xl p-4 shadow-sm border-l-4 hover:shadow transition-all cursor-pointer relative ${
                                isCompleted ? "opacity-60 bg-slate-50/70" : ""
                              } ${task.isPriority ? "ring-2 ring-red-500/10" : ""}`}
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
                                  {task.isRecurring && (
                                    <span className="text-purple-600 font-bold text-[9px] uppercase tracking-wider flex items-center gap-0.5">
                                      <Repeat className="h-2.5 w-2.5" /> Регулярная
                                    </span>
                                  )}
                                  {myAs.isBlocked && (
                                    <span className="text-red-600 flex items-center gap-0.5 text-[10px] font-bold">
                                      <Lock className="h-3 w-3" /> Ожидает
                                    </span>
                                  )}
                                </div>
                              </div>
                              <h4 className={`font-bold text-slate-800 text-sm mt-2 ${isCompleted ? "line-through text-slate-400" : ""}`}>{task.title}</h4>
                              
                              <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-100 text-[10px] text-slate-400">
                                <span>{task.assignmentType === "SEQUENTIAL" ? "Цепочка" : "Обычная"}</span>
                                {task.deadline && (
                                  <span className={isOverdue ? "text-red-500 font-bold animate-pulse" : ""}>
                                    До {new Date(task.deadline).toLocaleDateString()}
                                  </span>
                                )}
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
        </>
      )}

      {/* ПАГИНАЦИЯ */}
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
            {/* ⚡ ИЗМЕНЕНО: Добавлен autoComplete="off" по просьбе заказчика */}
            <form onSubmit={handleCreateGoal} className="space-y-4" autoComplete="off">
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
                  onClick={() => setIsGoalOpen(false)}
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
              <form onSubmit={handleCreateStatus} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3" autoComplete="off">
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
                          >
                            <Check className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingGoalId(null)}
                            className="p-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg transition-colors"
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
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                            {!g.isTemplate && (
                              <button
                                onClick={() => handleDeleteGoal(g.id, g.title)}
                                disabled={isPending}
                                className="p-1.5 hover:bg-red-50 text-red-500 hover:text-red-700 rounded-lg transition-colors"
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

      {/* МОДАЛКА: УПРАВЛЕНИЕ ЗАПРОСАМИ НА ПРОДЛЕНИЕ СРОКОВ */}
      {isManageExtensionsOpen && isAdmin && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-xl border border-slate-200 flex flex-col max-h-[85vh]">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-200">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <History className="h-5 w-5 text-red-600" /> Запросы сотрудников на перенос сроков
              </h3>
              <button onClick={() => setIsManageExtensionsOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {extensionRequests.length === 0 ? (
                <div className="text-center text-slate-400 italic text-sm py-8">Активных запросов нет</div>
              ) : (
                <div className="space-y-3">
                  {extensionRequests.map((req) => (
                    <div key={req.id} className="p-4 bg-slate-50 border rounded-xl space-y-3 text-xs">
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <div className="font-bold text-slate-800 text-sm">Задача: «{req.task.title}»</div>
                          <div className="text-slate-500 mt-1">
                            Исполнитель: <strong>{req.user.name}</strong> | Текущий срок: {req.task.deadline ? new Date(req.task.deadline).toLocaleDateString() : "Не указан"}
                          </div>
                        </div>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                          req.status === "PENDING" ? "bg-amber-100 text-amber-800 animate-pulse" : req.status === "APPROVED" ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
                        }`}>
                          {req.status === "PENDING" ? "Ожидает решения" : req.status === "APPROVED" ? "Одобрено" : "Отклонено"}
                        </span>
                      </div>

                      {req.reason && (
                        <div className="p-2.5 bg-white border rounded-lg italic text-slate-600">
                          Причина переноса: "{req.reason}"
                        </div>
                      )}

                      {req.status === "PENDING" && (
                        <div className="flex flex-wrap gap-2 items-center pt-2 border-t border-slate-100">
                          <div className="flex items-center gap-1.5 flex-1 min-w-[200px]">
                            <label className="font-bold text-slate-700">Установить новый срок:</label>
                            <input
                              type="date"
                              required
                              className="px-2 py-1 border rounded-lg text-xs"
                              onChange={(e) => setNewDeadlines(prev => ({ ...prev, [req.id]: e.target.value }))}
                            />
                          </div>
                          <div className="flex gap-2 shrink-0">
                            <button
                              onClick={() => handleApproveExtension(req.id)}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg"
                            >
                              Одобрить срок
                            </button>
                            <button
                              onClick={() => handleRejectExtension(req.id)}
                              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg"
                            >
                              Отклонить
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-end">
              <button
                onClick={() => setIsManageExtensionsOpen(false)}
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
            <form onSubmit={handleSaveTask} className="flex-1 overflow-y-auto p-6 space-y-4" autoComplete="off">
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center justify-between p-3 bg-red-50/50 border border-red-100 rounded-xl">
                  <div className="space-y-0.5">
                    <h4 className="text-[11px] font-bold text-slate-800 uppercase tracking-wide">Срочная задача</h4>
                    <p className="text-[9px] text-slate-500">Закрепить вверху списка</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={isPriorityState}
                    onChange={(e) => setIsPriorityState(e.target.checked)}
                    className="h-4 w-4 text-red-600 border-slate-300 rounded focus:ring-red-500 cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between p-3 bg-purple-50/50 border border-purple-100 rounded-xl">
                  <div className="space-y-0.5">
                    <h4 className="text-[11px] font-bold text-slate-800 uppercase tracking-wide">Регулярная</h4>
                    <p className="text-[9px] text-slate-500">Маркер повторения</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={isRecurringState}
                    onChange={(e) => setIsRecurringState(e.target.checked)}
                    className="h-4 w-4 text-purple-600 border-slate-300 rounded focus:ring-purple-500 cursor-pointer"
                  />
                </div>
              </div>

              {/* Чекбокс отложенных задач на перспективу */}
              <div className="grid grid-cols-1 gap-3">
                <div className="flex items-center justify-between p-3 bg-blue-50/30 border border-blue-100 rounded-xl">
                  <div className="space-y-0.5">
                    <h4 className="text-[11px] font-bold text-slate-800 uppercase tracking-wide">Внести на перспективу</h4>
                    <p className="text-[9px] text-slate-500">Скрыть из активных и отложить запуск</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={isPerspectiveState}
                    onChange={(e) => setIsPerspectiveState(e.target.checked)}
                    className="h-4 w-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500 cursor-pointer"
                  />
                </div>

                {isPerspectiveState && (
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
                          <span>{u.name}</span>
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
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl w-full max-w-5xl shadow-2xl border border-slate-200 flex flex-col h-[85vh] lg:h-[80vh] overflow-hidden">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-200 shrink-0">
              <h3 className="text-lg font-bold text-slate-800 font-sans tracking-wide">Рабочее пространство задачи</h3>
              <div className="flex items-center gap-2">
                {isAdmin && (
                  <>
                    {/* Кнопка мгновенного запуска в работу отложенной задачи */}
                    {activeTask.isPerspective && (
                      <button
                        onClick={(e) => handleActivateTask(activeTask.id, activeTask.title, e)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold transition-all hover:bg-emerald-100 cursor-pointer"
                        title="Запустить отложенную задачу исполнителю"
                      >
                        <Play className="h-4 w-4" /> Запустить в работу
                      </button>
                    )}

                    {/* ⚡ ИЗМЕНЕНО: Кнопка дублирования теперь вызывает наше красивое модальное окно */}
                    <button
                      onClick={() => openDuplicateModal(activeTask.id)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-purple-50 text-purple-700 border border-purple-200 rounded-xl text-xs font-bold transition-all hover:bg-purple-100 cursor-pointer"
                      title="Повторить / Продублировать задачу на новый срок"
                    >
                      <Repeat className="h-4 w-4" /> Повторить задачу
                    </button>
                    
                    <button
                      onClick={(e) => {
                        handleDeleteTask(activeTask.id, activeTask.title, e);
                        setActiveTask(null);
                      }}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-red-50 text-red-700 border border-red-200 rounded-xl text-xs font-bold transition-all hover:bg-red-100 cursor-pointer"
                      title="Удалить задачу безвозвратно"
                    >
                      <Trash2 className="h-4 w-4" /> Удалить задачу
                    </button>
                  </>
                )}
                
                {!isAdmin && (
                  <button
                    onClick={() => setIsExtensionReasonOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-50 text-amber-800 border border-amber-200 rounded-xl text-xs font-bold transition-all hover:bg-amber-100 cursor-pointer"
                    title="Запросить перенос дедлайна у руководителя"
                  >
                    <History className="h-4 w-4" /> Запросить продление
                  </button>
                )}

                <button onClick={() => setActiveTask(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden h-full">
              <div className="lg:col-span-7 p-6 overflow-y-auto border-r border-slate-100 space-y-5 h-full scrollbar-thin">
                <div className="flex items-center gap-2 flex-wrap">
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
                  {activeTask.isRecurring && (
                    <span className="text-[10px] bg-purple-100 text-purple-700 border border-purple-200 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider flex items-center gap-0.5">
                      <Repeat className="h-3 w-3 animate-spin-slow" /> Регулярная
                    </span>
                  )}
                  {activeTask.isPerspective && (
                    <span className="text-[10px] bg-blue-100 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                      На перспективу
                    </span>
                  )}
                </div>

                <div>
                  <h4 className="text-xl font-extrabold text-slate-900 leading-snug">{activeTask.title}</h4>
                  {activeTask.description && (
                    <p className="text-sm text-slate-600 mt-3 whitespace-pre-line bg-slate-50 p-4 rounded-xl border leading-relaxed shadow-inner">
                      {activeTask.description}
                    </p>
                  )}
                </div>

                {activeTask.adminNotes && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
                    <div className="font-bold flex items-center gap-1 mb-1">
                      <AlertCircle className="h-3.5 w-3.5" /> Указание руководителя:
                    </div>
                    <div>{activeTask.adminNotes}</div>
                  </div>
                )}

                {activeTask.isPerspective && activeTask.reminderDate && (
                  <div className="text-xs text-purple-600 font-bold flex items-center gap-1.5 bg-purple-50 border border-purple-100 p-2.5 rounded-lg self-start">
                    <History className="h-4 w-4 text-purple-500 animate-spin-slow" />
                    Дата напоминания: {new Date(activeTask.reminderDate).toLocaleDateString("ru-RU")}
                  </div>
                )}

                {!activeTask.isPerspective && activeTask.deadline && (
                  <div className="text-xs text-slate-500 font-bold flex items-center gap-1.5 bg-slate-100/50 p-2.5 rounded-lg border self-start">
                    <Clock className="h-4 w-4 text-slate-400" />
                    Срок выполнения: {new Date(activeTask.deadline).toLocaleDateString("ru-RU")}
                    {new Date(activeTask.deadline) < startOfToday && (
                      <span className="text-red-600 uppercase font-black text-[9px] tracking-wider flex items-center gap-0.5"><AlertTriangle className="h-3 w-3" /> Срок просрочен!</span>
                    )}
                  </div>
                )}

                {!isAdmin && (
                  <div className="border-t border-slate-100 pt-4 space-y-2">
                    <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Мой status по задаче</h5>
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
                        </div>
                      );
                    })()}
                  </div>
                )}

                {/* Прогресс всех участников и вывод индивидуальных указаний */}
                <div className="border-t border-slate-100 pt-4 space-y-2">
                  <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Исполнители</h5>
                  <div className="grid grid-cols-1 gap-2.5">
                    {activeTask.assignments.map((as) => (
                      <div
                        key={as.id}
                        className="flex flex-col gap-2 bg-slate-50 border border-slate-200 rounded-2xl p-3 text-xs"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <div className="flex h-7 w-7 rounded-full bg-slate-200 text-slate-700 font-bold items-center justify-center text-[10px]">
                              {as.user.initials}
                            </div>
                            <div>
                              <div className="font-semibold text-slate-800">{as.user.name}</div>
                              {activeTask.assignmentType === "SEQUENTIAL" && (
                                <div className="text-[9px] text-slate-400 font-medium leading-none mt-0.5">Этап {as.sequenceOrder + 1}</div>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 font-bold text-[10px]">
                            {as.isBlocked ? (
                              <span className="text-red-600 bg-red-50 border border-red-100 px-2 py-0.5 rounded flex items-center gap-0.5"><Lock className="h-3 w-3" /> Ожидает</span>
                            ) : (
                              <span className="text-slate-700 bg-slate-100 border px-2 py-0.5 rounded">{as.status.name}</span>
                            )}
                          </div>
                        </div>

                        {as.stepInstruction && (
                          <div className="pl-9.5 text-[11px] text-slate-600 border-t border-slate-200/50 pt-2 mt-1 italic">
                            <strong className="text-blue-600 not-italic">Задание на этом этапе:</strong> «{as.stepInstruction}»
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="lg:col-span-5 p-6 bg-slate-50/50 flex flex-col h-full overflow-hidden border-t lg:border-t-0 lg:border-l border-slate-200">
                <div className="border-b border-slate-100 pb-3 mb-3 flex items-center gap-2 shrink-0">
                  <Send className="h-4 w-4 text-blue-500" />
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Обсуждение и лог</span>
                </div>

                <div className="flex-1 overflow-y-auto space-y-3 pr-1 mb-4 scrollbar-thin">
                  {activeTask.comments.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-xs text-slate-400 italic">
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

      {/* МОДАЛКА: ВВОД ОБОСНОВАНИЯ ПЕРЕНОСА ДЕДЛАЙНА */}
      {isExtensionModalOpen && activeTask && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl border border-slate-200 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-1.5">
                <History className="h-5 w-5 text-amber-500 animate-spin-slow" /> Запросить перенос срока
              </h3>
              <button onClick={() => setIsExtensionReasonOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleRequestExtension} className="space-y-4">
              <div className="text-xs text-slate-500 leading-relaxed bg-amber-50 border border-amber-100 p-3 rounded-xl">
                Ваш запрос будет направлен руководителю. Он изучит причину и установит новую справедливую дату выполнения.
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Обоснуйте причину задержки</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Например, Ожидаю информацию от смежного ИТ-отдела, данные будут завтра утром..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:border-blue-500 text-slate-800"
                  value={extensionReason}
                  onChange={(e) => setExtensionReason(e.target.value)}
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsExtensionReasonOpen(false)}
                  className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-xs"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold disabled:bg-blue-400"
                >
                  Отправить руководителю
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ⚡ НОВОЕ: КРАСИВОЕ МОДАЛЬНОЕ ОКНО ДЛЯ ПОВТОРА/ДУБЛИРОВАНИЯ ЗАДАЧИ С КАЛЕНДАРЕМ (ВМЕСТО PROMPT) */}
      {isDuplicateModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl border border-slate-200 space-y-4 animate-scale-in">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-1.5">
                <Repeat className="h-5 w-5 text-purple-600" /> Повторить задачу
              </h3>
              <button 
                onClick={() => { setIsDuplicateModalOpen(false); setDuplicateTaskId(null); }} 
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleConfirmDuplicate} className="space-y-4">
              <div className="text-xs text-slate-500 leading-normal bg-purple-50 border border-purple-100 p-3 rounded-xl">
                Выберите новый крайний срок (дедлайн) для повторной задачи с помощью календаря. Задача продублируется с теми же исполнителями и целями.
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Новый дедлайн</label>
                <input
                  type="date"
                  required
                  min={todayStr} // Блокировка прошедших дат дедлайна
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 text-slate-800"
                  value={duplicateDeadline}
                  onChange={(e) => setDuplicateDeadline(e.target.value)}
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => { setIsDuplicateModalOpen(false); setDuplicateTaskId(null); }}
                  className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={isPending || !duplicateDeadline}
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg text-xs font-bold disabled:bg-purple-400 cursor-pointer"
                >
                  Повторить задачу
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}