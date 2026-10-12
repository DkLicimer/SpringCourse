// src/app/app/employees/EmployeesClient.tsx
"use client";

import React, { useState, useTransition, useMemo } from "react";
import { createEmployee, deleteEmployee, updateEmployee } from "@/server/actions/users";
import { 
  UserPlus, 
  Shield, 
  X, 
  Search, 
  Trash2, 
  Pencil, 
  CalendarRange, 
  Eye, 
  EyeOff, 
  Briefcase,
  AlertTriangle,
  Clock,
  ClipboardList,
  Layers,
  ListTodo,
  UserCheck,
  UserX
} from "lucide-react";
import { useRouter } from "next/navigation";

type TableAccess = {
  tableName: string;
  canRead: boolean;
  canWrite: boolean;
};

type UserWithAccess = {
  id: string;
  name: string;
  email: string;
  initials: string;
  role: string;
  department?: string | null;
  isAssignable?: boolean; // Флаг: true = выдавать задачи, false = только учет
  reportingPeriodType?: string;
  periodStartDate?: string | null;
  periodEndDate?: string | null;
  mainDuties?: string | null;
  extraDuties?: string | null;
  orderDuties?: string | null;
  tableAccesses: TableAccess[];
};

interface EmployeesClientProps {
  initialUsers: UserWithAccess[];
  currentUserId: string;
}

function getEmployeePeriodStatus(
  type: string = "MONTH",
  startDateStr?: string | null,
  endDateStr?: string | null
): { status: "EXPIRED" | "EXPIRING_SOON" | "OK"; daysLeft: number; label: string; textClass: string; badgeClass: string } {
  const now = new Date();
  let endDate: Date;
  let typeLabel = "Месяц";

  if (type === "CUSTOM") {
    typeLabel = "Индивидуальный";
    if (!endDateStr) {
      return { 
        status: "EXPIRED", 
        daysLeft: 0, 
        label: "Срок не задан!", 
        textClass: "text-rose-700",
        badgeClass: "bg-rose-100 text-rose-800 border-rose-300 animate-pulse font-black"
      };
    }
    endDate = new Date(endDateStr);
    endDate.setHours(23, 59, 59, 999);
  } else if (type === "QUARTER") {
    typeLabel = "Квартал";
    const quarter = Math.floor(now.getMonth() / 3);
    endDate = new Date(now.getFullYear(), (quarter + 1) * 3, 0, 23, 59, 59, 999);
  } else {
    typeLabel = "Месяц";
    endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  }

  const diffMs = endDate.getTime() - now.getTime();
  const daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (daysLeft < 0) {
    return {
      status: "EXPIRED",
      daysLeft,
      label: "Срок вышел!",
      textClass: "text-rose-700 font-bold",
      badgeClass: "bg-rose-100 text-rose-800 border-rose-300 animate-pulse font-black"
    };
  }

  if (daysLeft <= 3) {
    return {
      status: "EXPIRING_SOON",
      daysLeft,
      label: `Ост. ${daysLeft} дн.`,
      textClass: "text-amber-700 font-bold",
      badgeClass: "bg-amber-100 text-amber-800 border-amber-300 font-bold"
    };
  }

  return {
    status: "OK",
    daysLeft,
    label: typeLabel,
    textClass: "text-slate-600",
    badgeClass: "bg-slate-100 text-slate-700 border-slate-200 font-semibold"
  };
}

function countDutyItems(text?: string | null): number {
  if (!text || !text.trim()) return 0;
  return text.split("\n").filter((line) => line.trim().length > 0).length;
}

export function EmployeesClient({ initialUsers, currentUserId }: EmployeesClientProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterMode, setFilterMode] = useState<"ALL" | "EXPIRING">("ALL");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [editingUser, setEditingUser] = useState<UserWithAccess | null>(null);
  const [viewingDutiesUser, setViewingDutiesUser] = useState<UserWithAccess | null>(null);

  const [reportingPeriodType, setReportingPeriodType] = useState("MONTH");
  const [periodStartDate, setPeriodStartDate] = useState("");
  const [periodEndDate, setPeriodEndDate] = useState("");
  const [department, setDepartment] = useState("");
  const [initials, setInitials] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [passwordValue, setPasswordValue] = useState("");

  // Флаг: выдавать ли задачи (isAssignable)
  const [isAssignable, setIsAssignable] = useState(true);

  // Обязанности сотрудника
  const [mainDuties, setMainDuties] = useState("");
  const [extraDuties, setExtraDuties] = useState("");
  const [orderDuties, setOrderDuties] = useState("");

  const [access, setAccess] = useState({
    canReadSocial: false,
    canWriteSocial: false,
    canReadTeam: false,
    canWriteTeam: false,
    canReadContent: false,
    canWriteContent: false,
    canReadPost: false,
    canWritePost: false,
    canReadInfo: false,
    canWriteInfo: false,
  });

  const usersWithPeriodStatus = useMemo(() => {
    return initialUsers.map((user) => {
      const periodInfo = getEmployeePeriodStatus(
        user.reportingPeriodType,
        user.periodStartDate,
        user.periodEndDate
      );
      return { ...user, periodInfo };
    });
  }, [initialUsers]);

  const urgentUsers = useMemo(() => {
    return usersWithPeriodStatus.filter(
      (u) => u.role !== "ADMIN" && (u.periodInfo.status === "EXPIRED" || u.periodInfo.status === "EXPIRING_SOON")
    );
  }, [usersWithPeriodStatus]);

  const filteredUsers = useMemo(() => {
    return usersWithPeriodStatus.filter((u) => {
      const matchesSearch =
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (u.department && u.department.toLowerCase().includes(searchTerm.toLowerCase()));

      if (filterMode === "EXPIRING") {
        return matchesSearch && u.role !== "ADMIN" && (u.periodInfo.status === "EXPIRED" || u.periodInfo.status === "EXPIRING_SOON");
      }

      return matchesSearch;
    });
  }, [usersWithPeriodStatus, searchTerm, filterMode]);

  const openCreateModal = () => {
    setEditingUser(null);
    setReportingPeriodType("MONTH");
    setPeriodStartDate("");
    setPeriodEndDate("");
    setInitials("");
    setDepartment("");
    setShowPassword(false);
    setPasswordValue("");
    setIsAssignable(true); // По умолчанию участвует в задачах
    setMainDuties("");
    setExtraDuties("");
    setOrderDuties("");
    setAccess({
      canReadSocial: false,
      canWriteSocial: false,
      canReadTeam: false,
      canWriteTeam: false,
      canReadContent: false,
      canWriteContent: false,
      canReadPost: false,
      canWritePost: false,
      canReadInfo: false,
      canWriteInfo: false,
    });
    setIsOpen(true);
  };

  const openEditModal = (user: UserWithAccess) => {
    setEditingUser(user);
    setReportingPeriodType(user.reportingPeriodType || "MONTH");
    setPeriodStartDate(user.periodStartDate ? user.periodStartDate.split("T")[0] : "");
    setPeriodEndDate(user.periodEndDate ? user.periodEndDate.split("T")[0] : "");
    setInitials(user.initials || "");
    setDepartment(user.department || "");
    setShowPassword(false);
    setPasswordValue("");
    setIsAssignable(user.isAssignable ?? true);

    setMainDuties(user.mainDuties || "");
    setExtraDuties(user.extraDuties || "");
    setOrderDuties(user.orderDuties || "");

    const social = user.tableAccesses.find(a => a.tableName === "social_passport");
    const team = user.tableAccesses.find(a => a.tableName === "teambuilding");
    const content = user.tableAccesses.find(a => a.tableName === "content_plan");
    const post = user.tableAccesses.find(a => a.tableName === "post_request");
    const info = user.tableAccesses.find(a => a.tableName === "info_space");

    setAccess({
      canReadSocial: social?.canRead || false,
      canWriteSocial: social?.canWrite || false,
      canReadTeam: team?.canRead || false,
      canWriteTeam: team?.canWrite || false,
      canReadContent: content?.canRead || false,
      canWriteContent: content?.canWrite || false,
      canReadPost: post?.canRead || false,
      canWritePost: post?.canWrite || false,
      canReadInfo: info?.canRead || false,
      canWriteInfo: info?.canWrite || false,
    });
    setIsOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const formData = new FormData(e.currentTarget);
    formData.append("canReadSocial", String(access.canReadSocial));
    formData.append("canWriteSocial", String(access.canWriteSocial));
    formData.append("canReadTeam", String(access.canReadTeam));
    formData.append("canWriteTeam", String(access.canWriteTeam));
    formData.append("canReadContent", String(access.canReadContent));
    formData.append("canWriteContent", String(access.canWriteContent));
    formData.append("canReadPost", String(access.canReadPost));
    formData.append("canWritePost", String(access.canWritePost));
    formData.append("canReadInfo", String(access.canReadInfo));
    formData.append("canWriteInfo", String(access.canWriteInfo));

    formData.append("reportingPeriodType", reportingPeriodType);
    formData.append("periodStartDate", periodStartDate);
    formData.append("periodEndDate", periodEndDate);
    formData.append("initials", initials);
    formData.append("department", department);

    // Флаг выдачи задач
    formData.append("isAssignable", String(isAssignable));

    formData.append("mainDuties", mainDuties);
    formData.append("extraDuties", extraDuties);
    formData.append("orderDuties", orderDuties);

    if (passwordValue.trim()) {
      formData.set("password", passwordValue.trim());
    }

    startTransition(async () => {
      try {
        if (editingUser) {
          await updateEmployee(editingUser.id, formData);
        } else {
          await createEmployee(formData);
        }
        setIsOpen(false);
        router.refresh();
      } catch (err: any) {
        setError(err.message || "Ошибка при сохранении");
      }
    });
  };

  const handleDelete = async (userId: string, userName: string) => {
    if (!window.confirm(`Вы уверены, что хотите безвозвратно удалить сотрудника ${userName}?`)) {
      return;
    }

    startTransition(async () => {
      try {
        await deleteEmployee(userId);
        router.refresh();
      } catch (err: any) {
        alert(err.message || "Не удалось удалить сотрудника");
      }
    });
  };

  const renderAccessBadge = (canRead: boolean, canWrite: boolean) => {
    if (canWrite) return <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold uppercase">Запись</span>;
    if (canRead) return <span className="text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-bold uppercase">Чтение</span>;
    return <span className="text-[10px] bg-slate-100 text-slate-400 px-2 py-0.5 rounded-full font-bold uppercase">Нет</span>;
  };

  return (
    <div className="space-y-4">
      {/* Баннер руководителя об истекших периодах */}
      {urgentUsers.length > 0 && (
        <div className="bg-gradient-to-r from-rose-50 via-amber-50 to-orange-50 border-2 border-rose-300 rounded-2xl p-4 shadow-sm animate-fade-in space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="p-2 bg-rose-600 text-white rounded-xl shadow-xs">
                <AlertTriangle className="h-5 w-5 animate-bounce" />
              </span>
              <div>
                <h4 className="font-black text-rose-950 text-sm tracking-tight">
                  Требуется внимание: у {urgentUsers.length} {urgentUsers.length === 1 ? "сотрудника" : "сотрудников"} завершился или истекает отчетный период!
                </h4>
                <p className="text-xs text-rose-800 mt-0.5">
                  Для корректного расчета KPI и статистики установите сотрудникам новый отчетный период.
                </p>
              </div>
            </div>
            <button
              onClick={() => setFilterMode(filterMode === "EXPIRING" ? "ALL" : "EXPIRING")}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer"
            >
              {filterMode === "EXPIRING" ? "Показать всех" : "Показать только их"}
            </button>
          </div>

          <div className="flex flex-wrap gap-2 pt-1 border-t border-rose-200">
            {urgentUsers.map((u) => (
              <button
                key={u.id}
                onClick={() => openEditModal(u)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold border transition-all cursor-pointer shadow-2xs hover:scale-105 ${
                  u.periodInfo.status === "EXPIRED"
                    ? "bg-rose-600 text-white border-rose-700"
                    : "bg-amber-100 text-amber-900 border-amber-300"
                }`}
                title="Нажмите, чтобы настроить период"
              >
                <span>{u.name.split(" ")[0]} ({u.periodInfo.label})</span>
                <Pencil className="h-3 w-3" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Поиск, Фильтры и Добавление */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-stretch sm:items-center">
        <div className="flex flex-1 gap-2 max-w-lg">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Поиск по ФИО, отделу или Email..."
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-blue-500 text-slate-800 shadow-2xs"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {urgentUsers.length > 0 && (
            <button
              onClick={() => setFilterMode(filterMode === "ALL" ? "EXPIRING" : "ALL")}
              className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 shrink-0 shadow-2xs ${
                filterMode === "EXPIRING"
                  ? "bg-rose-600 text-white border-rose-700 shadow-xs"
                  : "bg-white text-rose-700 border-rose-200 hover:bg-rose-50"
              }`}
            >
              <AlertTriangle className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Требуют внимания</span> ({urgentUsers.length})
            </button>
          )}
        </div>

        <button
          onClick={openCreateModal}
          className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-colors shadow-xs cursor-pointer"
        >
          <UserPlus className="h-4 w-4" />
          Добавить сотрудника
        </button>
      </div>

      {/* ДЕСКТОПНАЯ ТАБЛИЦА */}
      <div className="hidden lg:block bg-white rounded-2xl border border-slate-200 overflow-x-auto shadow-xs">
        <table className="min-w-full divide-y divide-slate-200 text-xs">
          <thead className="bg-slate-50">
            <tr>
              <th className="sticky left-0 bg-slate-50 z-20 px-4 py-3 text-left font-semibold text-slate-500 uppercase tracking-wider min-w-[220px] shadow-[2px_0_5px_-2px_rgba(0,0,0,0.06)]">
                Сотрудник (ФИО)
              </th>
              <th className="px-3 py-3 text-center font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                Статус в пуле задач
              </th>
              <th className="px-3 py-3 text-center font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                Обязанности
              </th>
              <th className="px-3 py-3 text-left font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">Период (Сигнал)</th>
              <th className="px-3 py-3 text-center font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">Коллектив</th>
              <th className="px-3 py-3 text-center font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">Тимбилдинг</th>
              <th className="px-3 py-3 text-center font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">Контент</th>
              <th className="px-3 py-3 text-center font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">Заявки</th>
              <th className="px-3 py-3 text-center font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">ИНФО</th>
              <th className="px-4 py-3 text-right font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">Действия</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white">
            {filteredUsers.map((user) => {
              const socialAccess = user.tableAccesses.find((a) => a.tableName === "social_passport");
              const teamAccess = user.tableAccesses.find((a) => a.tableName === "teambuilding");
              const contentAccess = user.tableAccesses.find((a) => a.tableName === "content_plan");
              const postAccess = user.tableAccesses.find((a) => a.tableName === "post_request");
              const infoAccess = user.tableAccesses.find((a) => a.tableName === "info_space");

              const mainCount = countDutyItems(user.mainDuties);
              const extraCount = countDutyItems(user.extraDuties);
              const orderCount = countDutyItems(user.orderDuties);
              const totalDuties = mainCount + extraCount + orderCount;
              
              const isAssignable = user.isAssignable ?? true;

              return (
                <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="sticky left-0 bg-white z-10 px-4 py-3 whitespace-nowrap shadow-[2px_0_5px_-2px_rgba(0,0,0,0.06)]">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-700 font-bold text-xs shrink-0">
                        {user.initials}
                      </div>
                      <div className="overflow-hidden">
                        <div className="text-xs font-bold text-slate-900 truncate">{user.name}</div>
                        <div className="text-[10px] text-slate-400 truncate">{user.email}</div>
                        {user.department && (
                          <div className="text-[9px] text-blue-600 font-extrabold uppercase truncate flex items-center gap-0.5">
                            <Briefcase className="h-2.5 w-2.5 shrink-0" /> {user.department}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Бейдж статуса в пуле задач */}
                  <td className="px-3 py-3 whitespace-nowrap text-center">
                    {user.role === "ADMIN" ? (
                      <span className="text-[9px] px-2 py-0.5 rounded-full font-bold uppercase bg-purple-100 text-purple-800">
                        Администратор
                      </span>
                    ) : isAssignable ? (
                      <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-full font-bold">
                        <UserCheck className="h-3 w-3 text-emerald-600" /> Исполнитель
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] bg-slate-100 text-slate-500 border border-slate-200 px-2 py-0.5 rounded-full font-medium" title="Только учёт и дни рождения в календаре, задачи не назначаются">
                        <UserX className="h-3 w-3 text-slate-400" /> Только учёт
                      </span>
                    )}
                  </td>

                  {/* Кнопка обязанностей */}
                  <td className="px-3 py-3 whitespace-nowrap text-center">
                    {user.role === "ADMIN" ? (
                      <span className="text-[10px] text-slate-400 italic">—</span>
                    ) : (
                      <button
                        onClick={() => setViewingDutiesUser(user)}
                        className={`px-2.5 py-1 rounded-xl text-[10px] font-bold border transition-all cursor-pointer inline-flex items-center gap-1.5 shadow-2xs ${
                          totalDuties > 0
                            ? "bg-blue-50 text-blue-800 border-blue-200 hover:bg-blue-100"
                            : "bg-slate-50 text-slate-400 border-slate-200 hover:bg-slate-100 hover:text-slate-700"
                        }`}
                        title="Посмотреть обязанности сотрудника"
                      >
                        <ClipboardList className="h-3.5 w-3.5 text-blue-600" />
                        <span>{totalDuties > 0 ? `Обязанности (${mainCount}/${extraCount}/${orderCount})` : "+ Задать"}</span>
                      </button>
                    )}
                  </td>
                  
                  {/* Вывод сигнала срока отчетного периода */}
                  <td className="px-3 py-3 whitespace-nowrap text-slate-600">
                    {user.role === "ADMIN" ? (
                      <span className="text-[9px] px-2 py-0.5 rounded-full font-bold uppercase bg-purple-100 text-purple-800">
                        Администратор
                      </span>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => openEditModal(user)}
                          className={`text-[9px] px-2.5 py-1 rounded-full border transition-all cursor-pointer flex items-center gap-1 ${user.periodInfo.badgeClass}`}
                          title="Нажмите, чтобы настроить отчетный период"
                        >
                          {user.periodInfo.status === "EXPIRED" && <AlertTriangle className="h-3 w-3 text-rose-600" />}
                          {user.periodInfo.status === "EXPIRING_SOON" && <Clock className="h-3 w-3 text-amber-600" />}
                          <span>{user.periodInfo.label}</span>
                        </button>
                      </div>
                    )}
                  </td>

                  <td className="px-3 py-3 whitespace-nowrap text-center">
                    {user.role === "ADMIN" ? <span className="text-[10px] font-bold text-slate-400">ПОЛНЫЙ</span> : renderAccessBadge(socialAccess?.canRead || false, socialAccess?.canWrite || false)}
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap text-center">
                    {user.role === "ADMIN" ? <span className="text-[10px] font-bold text-slate-400">ПОЛНЫЙ</span> : renderAccessBadge(teamAccess?.canRead || false, teamAccess?.canWrite || false)}
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap text-center">
                    {user.role === "ADMIN" ? <span className="text-[10px] font-bold text-slate-400">ПОЛНЫЙ</span> : renderAccessBadge(contentAccess?.canRead || false, contentAccess?.canWrite || false)}
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap text-center">
                    {user.role === "ADMIN" ? <span className="text-[10px] font-bold text-slate-400">ПОЛНЫЙ</span> : renderAccessBadge(postAccess?.canRead || false, postAccess?.canWrite || false)}
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap text-center">
                    {user.role === "ADMIN" ? <span className="text-[10px] font-bold text-slate-400">ПОЛНЫЙ</span> : renderAccessBadge(infoAccess?.canRead || false, infoAccess?.canWrite || false)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-right text-xs">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => openEditModal(user)}
                        className="text-slate-500 hover:text-slate-800 p-1.5 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                        title="Редактировать сотрудника"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      {user.id !== currentUserId ? (
                        <button
                          onClick={() => handleDelete(user.id, user.name)}
                          disabled={isPending}
                          className="text-red-500 hover:text-red-700 p-1.5 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                          title="Удалить"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      ) : (
                        <span className="text-[10px] text-slate-400 italic px-1">Вы</span>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* МОБИЛЬНАЯ ВЕРСИЯ */}
      <div className="block lg:hidden space-y-4">
        {filteredUsers.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-sm bg-white rounded-xl border">
            Сотрудники не найдены
          </div>
        ) : (
          filteredUsers.map((user) => {
            const isAssignable = user.isAssignable ?? true;
            return (
              <div key={user.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                <div className="flex justify-between items-start border-b border-slate-100 pb-2.5">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-700 font-bold text-xs">
                      {user.initials}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-900 leading-snug">{user.name}</div>
                      <div className="text-[10px] text-slate-500 leading-none">{user.email}</div>
                      {user.department && <div className="text-[10px] text-blue-600 font-bold mt-1 uppercase">🏢 {user.department}</div>}
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1">
                    {user.role === "ADMIN" ? (
                      <span className="text-[9px] px-2 py-0.5 rounded-full font-bold uppercase bg-purple-100 text-purple-800">
                        Админ
                      </span>
                    ) : isAssignable ? (
                      <span className="text-[9px] px-2 py-0.5 rounded-full font-bold uppercase bg-emerald-100 text-emerald-800">
                        Исполнитель
                      </span>
                    ) : (
                      <span className="text-[9px] px-2 py-0.5 rounded-full font-bold uppercase bg-slate-100 text-slate-500">
                        Только учёт
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex justify-end gap-1.5 pt-2 border-t border-slate-100">
                  <button
                    onClick={() => openEditModal(user)}
                    className="text-slate-500 hover:text-slate-800 p-1.5 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  {user.id !== currentUserId && (
                    <button
                      onClick={() => handleDelete(user.id, user.name)}
                      disabled={isPending}
                      className="text-red-500 hover:text-red-700 p-1.5 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* МОДАЛЬНОЕ ОКНО СОЗДАНИЯ / РЕДАКТИРОВАНИЯ */}
      {isOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-4xl shadow-2xl border border-slate-200 flex flex-col max-h-[92vh] overflow-hidden">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-200 bg-slate-50">
              <h3 className="text-lg font-bold text-slate-800">
                {editingUser ? `Редактировать сотрудника: ${editingUser.name}` : "Добавить нового сотрудника"}
              </h3>
              <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5" autoComplete="off">
              {error && (
                <div className="rounded-xl bg-red-50 p-4 text-xs text-red-600 border border-red-100">
                  {error}
                </div>
              )}

              {/* Основные данные */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                <div className="sm:col-span-4">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">ФИО сотрудника</label>
                  <input
                    type="text"
                    name="name"
                    required
                    defaultValue={editingUser?.name || ""}
                    placeholder="Например, Петров Петр"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:border-blue-500 text-slate-800"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Инициалы / Код</label>
                  <input
                    type="text"
                    name="initials"
                    maxLength={5}
                    placeholder="ПЕТР"
                    value={initials}
                    onChange={(e) => setInitials(e.target.value.toUpperCase())}
                    className="w-full px-2 py-2 border border-slate-300 rounded-xl text-xs font-bold focus:outline-none focus:border-blue-500 text-slate-800 uppercase text-center tracking-wider"
                  />
                </div>
                <div className="sm:col-span-3">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Подразделение (Отдел)</label>
                  <input
                    type="text"
                    name="department"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder="Например, IT-отдел..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:border-blue-500 text-slate-800"
                  />
                </div>
                <div className="sm:col-span-3">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    name="email"
                    required
                    defaultValue={editingUser?.email || ""}
                    placeholder="petrov@company.com"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:border-blue-500 text-slate-800"
                  />
                </div>
              </div>

              {/* Пароль и ТУМБЛЕР НАЗНАЧЕНИЯ ЗАДАЧ */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {editingUser ? "Новый пароль (оставьте пустым для сохранения прежнего)" : "Пароль"}
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      required={!editingUser}
                      value={passwordValue}
                      onChange={(e) => setPasswordValue(e.target.value)}
                      placeholder={editingUser ? "Введите новый пароль, если нужно изменить" : "Укажите пароль для входа"}
                      className="w-full px-3 py-2 pr-10 border border-slate-300 rounded-xl text-sm focus:outline-none focus:border-blue-500 text-slate-800"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                    </button>
                  </div>
                </div>

                {/* ⚡ ТУМБЛЕР: УЧАСТИЕ В ВЫДАЧЕ ЗАДАЧ (ПУНКТ 4) */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <label className="text-xs font-bold text-slate-800 block cursor-pointer" htmlFor="isAssignableCheck">
                      Участвует в назначении задач
                    </label>
                    <p className="text-[10px] text-slate-500 leading-tight">
                      Если выключить — сотрудник остаётся в общем учёте и календаре (дни рождения), но скрывается из списка выдачи задач
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    id="isAssignableCheck"
                    checked={isAssignable}
                    onChange={(e) => setIsAssignable(e.target.checked)}
                    className="h-5 w-5 text-blue-600 border-slate-300 rounded focus:ring-blue-500 cursor-pointer shrink-0"
                  />
                </div>
              </div>

              {/* ТАБЛИЦА ОБЯЗАННОСТЕЙ СОТРУДНИКА */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs space-y-0">
                <div className="px-4 py-3 bg-slate-900 text-white flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ClipboardList className="h-4 w-4 text-blue-400" />
                    <span className="font-extrabold text-xs uppercase tracking-wider">
                      Должностные обязанности сотрудника (3 категории)
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 hidden sm:inline">
                    Каждый пункт с новой строки
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-200 bg-slate-50/50">
                  <div className="p-4 space-y-2 bg-blue-50/20">
                    <div className="flex items-center justify-between border-b border-blue-200 pb-1.5">
                      <label className="text-xs font-black text-blue-900 flex items-center gap-1.5 uppercase">
                        <Briefcase className="h-3.5 w-3.5 text-blue-600" />
                        <span>1. Основные</span>
                      </label>
                      <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-2 py-0.2 rounded-full">
                        {countDutyItems(mainDuties)} шт.
                      </span>
                    </div>
                    <textarea
                      rows={5}
                      placeholder={"1. Ведение учебных журналов\n2. Проведение занятий по расписанию..."}
                      value={mainDuties}
                      onChange={(e) => setMainDuties(e.target.value)}
                      className="w-full px-3 py-2 border border-blue-200 rounded-xl text-xs focus:outline-none focus:border-blue-500 text-slate-800 bg-white leading-relaxed"
                    />
                  </div>

                  <div className="p-4 space-y-2 bg-purple-50/20">
                    <div className="flex items-center justify-between border-b border-purple-200 pb-1.5">
                      <label className="text-xs font-black text-purple-900 flex items-center gap-1.5 uppercase">
                        <Layers className="h-3.5 w-3.5 text-purple-600" />
                        <span>2. Дополнительные</span>
                      </label>
                      <span className="text-[10px] bg-purple-100 text-purple-800 font-bold px-2 py-0.2 rounded-full">
                        {countDutyItems(extraDuties)} шт.
                      </span>
                    </div>
                    <textarea
                      rows={5}
                      placeholder={"1. Дежурство на этаже\n2. Участие в методических советах..."}
                      value={extraDuties}
                      onChange={(e) => setExtraDuties(e.target.value)}
                      className="w-full px-3 py-2 border border-purple-200 rounded-xl text-xs focus:outline-none focus:border-purple-500 text-slate-800 bg-white leading-relaxed"
                    />
                  </div>

                  <div className="p-4 space-y-2 bg-amber-50/20">
                    <div className="flex items-center justify-between border-b border-amber-200 pb-1.5">
                      <label className="text-xs font-black text-amber-900 flex items-center gap-1.5 uppercase">
                        <ListTodo className="h-3.5 w-3.5 text-amber-600" />
                        <span>3. Поручения</span>
                      </label>
                      <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.2 rounded-full">
                        {countDutyItems(orderDuties)} шт.
                      </span>
                    </div>
                    <textarea
                      rows={5}
                      placeholder={"1. Контроль сдачи отчетов\n2. Связь с типографией..."}
                      value={orderDuties}
                      onChange={(e) => setOrderDuties(e.target.value)}
                      className="w-full px-3 py-2 border border-amber-200 rounded-xl text-xs focus:outline-none focus:border-blue-500 text-slate-800 bg-white leading-relaxed"
                    />
                  </div>
                </div>
              </div>

              {/* Настройка отчетного периода */}
              <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-black text-slate-800 uppercase flex items-center gap-1.5">
                    <CalendarRange className="h-4 w-4 text-blue-600" />
                    <span>Отчетный период сотрудника (KPI)</span>
                  </div>
                  {editingUser && editingUser.role !== "ADMIN" && (
                    <span className="text-[10px] font-extrabold text-blue-800 bg-white border border-blue-200 px-2 py-0.5 rounded-lg shadow-2xs">
                      {getEmployeePeriodStatus(reportingPeriodType, periodStartDate, periodEndDate).label}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">Тип периода</label>
                    <select
                      value={reportingPeriodType}
                      onChange={(e) => setReportingPeriodType(e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-xl text-xs bg-white text-slate-800 focus:outline-none focus:border-blue-500 cursor-pointer font-medium"
                    >
                      <option value="MONTH">Каждый месяц</option>
                      <option value="QUARTER">Каждый квартал</option>
                      <option value="CUSTOM">Индивидуальный период</option>
                    </select>
                  </div>

                  {reportingPeriodType === "CUSTOM" && (
                    <>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 mb-1">Дата начала</label>
                        <input
                          type="date"
                          required
                          value={periodStartDate}
                          onChange={(e) => setPeriodStartDate(e.target.value)}
                          className="w-full px-2 py-1.5 border border-slate-300 rounded-xl text-xs focus:outline-none focus:border-blue-500 text-slate-800 bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 mb-1">Дата окончания</label>
                        <input
                          type="date"
                          required
                          value={periodEndDate}
                          onChange={(e) => setPeriodEndDate(e.target.value)}
                          className="w-full px-2 py-1.5 border border-slate-300 rounded-xl text-xs focus:outline-none focus:border-blue-500 text-slate-800 bg-white"
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Права доступа к таблицам */}
              <div className="border-t border-slate-200 pt-3 space-y-3">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Shield className="h-4 w-4" /> Права доступа к таблицам
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                    <div className="text-[11px] font-bold text-slate-700 uppercase">Состав коллектива</div>
                    <div className="flex gap-3 text-xs">
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input type="checkbox" checked={access.canReadSocial} onChange={(e) => setAccess({ ...access, canReadSocial: e.target.checked })} /> Чтение
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input type="checkbox" checked={access.canWriteSocial} onChange={(e) => setAccess({ ...access, canWriteSocial: e.target.checked })} /> Запись
                      </label>
                    </div>
                  </div>

                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                    <div className="text-[11px] font-bold text-slate-700 uppercase">Командообразование</div>
                    <div className="flex gap-3 text-xs">
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input type="checkbox" checked={access.canReadTeam} onChange={(e) => setAccess({ ...access, canReadTeam: e.target.checked })} /> Чтение
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input type="checkbox" checked={access.canWriteTeam} onChange={(e) => setAccess({ ...access, canWriteTeam: e.target.checked })} /> Запись
                      </label>
                    </div>
                  </div>

                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                    <div className="text-[11px] font-bold text-slate-700 uppercase">Контент-План</div>
                    <div className="flex gap-3 text-xs">
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input type="checkbox" checked={access.canReadContent} onChange={(e) => setAccess({ ...access, canReadContent: e.target.checked })} /> Чтение
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input type="checkbox" checked={access.canWriteContent} onChange={(e) => setAccess({ ...access, canWriteContent: e.target.checked })} /> Запись
                      </label>
                    </div>
                  </div>

                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                    <div className="text-[11px] font-bold text-slate-700 uppercase">Заявки на посты</div>
                    <div className="flex gap-3 text-xs">
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input type="checkbox" checked={access.canReadPost} onChange={(e) => setAccess({ ...access, canReadPost: e.target.checked })} /> Чтение
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input type="checkbox" checked={access.canWritePost} onChange={(e) => setAccess({ ...access, canWritePost: e.target.checked })} /> Запись
                      </label>
                    </div>
                  </div>

                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                    <div className="text-[11px] font-bold text-slate-700 uppercase">ИНФОпространство</div>
                    <div className="flex gap-3 text-xs">
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input type="checkbox" checked={access.canReadInfo} onChange={(e) => setAccess({ ...access, canReadInfo: e.target.checked })} /> Чтение
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input type="checkbox" checked={access.canWriteInfo} onChange={(e) => setAccess({ ...access, canWriteInfo: e.target.checked })} /> Запись
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="flex-1 px-4 py-2.5 border border-slate-300 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold transition-colors disabled:bg-blue-400 cursor-pointer shadow-xs hover:bg-blue-700"
                >
                  {isPending ? "Сохранение..." : editingUser ? "Сохранить изменения" : "Создать сотрудника"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* МОДАЛЬНОЕ ОКНО ПРОСМОТРА ОБЯЗАННОСТЕЙ */}
      {viewingDutiesUser && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-4xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-200 bg-slate-50">
              <div className="flex items-center gap-2.5">
                <ClipboardList className="h-5 w-5 text-blue-600" />
                <div>
                  <h3 className="text-base font-bold text-slate-800 leading-tight">
                    Обязанности: {viewingDutiesUser.name}
                  </h3>
                  <span className="text-[11px] text-slate-500 font-medium">
                    {viewingDutiesUser.department || "Основное подразделение"}
                  </span>
                </div>
              </div>
              <button onClick={() => setViewingDutiesUser(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="p-4 bg-blue-50/40 border border-blue-200 rounded-2xl flex flex-col justify-start space-y-2">
                <div className="flex items-center justify-between border-b border-blue-200 pb-2">
                  <h4 className="font-black text-blue-900 uppercase text-xs flex items-center gap-1.5">
                    <Briefcase className="h-4 w-4 text-blue-600" /> Основные
                  </h4>
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full font-bold text-[10px]">
                    {countDutyItems(viewingDutiesUser.mainDuties)}
                  </span>
                </div>
                <div className="space-y-1.5 pt-1 overflow-y-auto flex-1">
                  {!viewingDutiesUser.mainDuties?.trim() ? (
                    <span className="text-slate-400 italic">Не заданы</span>
                  ) : (
                    viewingDutiesUser.mainDuties.split("\n").filter(Boolean).map((item, idx) => (
                      <div key={idx} className="flex items-start gap-1.5 text-slate-700 leading-relaxed">
                        <span className="h-1.5 w-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                        <span>{item.trim()}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="p-4 bg-purple-50/40 border border-purple-200 rounded-2xl flex flex-col justify-start space-y-2">
                <div className="flex items-center justify-between border-b border-purple-200 pb-2">
                  <h4 className="font-black text-purple-900 uppercase text-xs flex items-center gap-1.5">
                    <Layers className="h-4 w-4 text-purple-600" /> Дополнительные
                  </h4>
                  <span className="px-2 py-0.5 bg-purple-100 text-purple-800 rounded-full font-bold text-[10px]">
                    {countDutyItems(viewingDutiesUser.extraDuties)}
                  </span>
                </div>
                <div className="space-y-1.5 pt-1 overflow-y-auto flex-1">
                  {!viewingDutiesUser.extraDuties?.trim() ? (
                    <span className="text-slate-400 italic">Не заданы</span>
                  ) : (
                    viewingDutiesUser.extraDuties.split("\n").filter(Boolean).map((item, idx) => (
                      <div key={idx} className="flex items-start gap-1.5 text-slate-700 leading-relaxed">
                        <span className="h-1.5 w-1.5 rounded-full bg-purple-500 mt-1.5 shrink-0" />
                        <span>{item.trim()}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="p-4 bg-amber-50/40 border border-amber-200 rounded-2xl flex flex-col justify-start space-y-2">
                <div className="flex items-center justify-between border-b border-amber-200 pb-2">
                  <h4 className="font-black text-amber-900 uppercase text-xs flex items-center gap-1.5">
                    <ListTodo className="h-4 w-4 text-amber-600" /> Поручения
                  </h4>
                  <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full font-bold text-[10px]">
                    {countDutyItems(viewingDutiesUser.orderDuties)}
                  </span>
                </div>
                <div className="space-y-1.5 pt-1 overflow-y-auto flex-1">
                  {!viewingDutiesUser.orderDuties?.trim() ? (
                    <span className="text-slate-400 italic">Не заданы</span>
                  ) : (
                    viewingDutiesUser.orderDuties.split("\n").filter(Boolean).map((item, idx) => (
                      <div key={idx} className="flex items-start gap-1.5 text-slate-700 leading-relaxed">
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                        <span>{item.trim()}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex justify-between items-center">
              <button
                onClick={() => {
                  const targetUser = viewingDutiesUser;
                  setViewingDutiesUser(null);
                  openEditModal(targetUser);
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <Pencil className="h-3.5 w-3.5" /> Редактировать обязанности
              </button>
              <button
                onClick={() => setViewingDutiesUser(null)}
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