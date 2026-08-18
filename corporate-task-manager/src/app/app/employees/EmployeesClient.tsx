// src/app/app/employees/EmployeesClient.tsx
"use client";

import React, { useState, useTransition } from "react";
import { createEmployee, deleteEmployee, updateEmployee } from "@/server/actions/users";
import { UserPlus, Shield, X, Search, Trash2, Pencil, CalendarRange, Eye, EyeOff } from "lucide-react";
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
  reportingPeriodType?: string;
  periodStartDate?: string | null;
  periodEndDate?: string | null;
  tableAccesses: TableAccess[];
};

interface EmployeesClientProps {
  initialUsers: UserWithAccess[];
  currentUserId: string;
}

export function EmployeesClient({ initialUsers, currentUserId }: EmployeesClientProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [editingUser, setEditingUser] = useState<UserWithAccess | null>(null);

  // Стейты для индивидуального отчетного периода сотрудника
  const [reportingPeriodType, setReportingPeriodType] = useState("MONTH");
  const [periodStartDate, setPeriodStartDate] = useState("");
  const [periodEndDate, setPeriodEndDate] = useState("");

  // Стейты для ручных инициалов
  const [initials, setInitials] = useState("");

  // Стейт для показа/скрытия вводимого пароля
  const [showPassword, setShowPassword] = useState(false);

  const [access, setAccess] = useState({
    canReadSocial: false,
    canWriteSocial: false,
    canReadTeam: false,
    canWriteTeam: false,
    canReadContent: false,
    canWriteContent: false,
    canReadPost: false,
    canWritePost: false,
  });

  const filteredUsers = initialUsers.filter(
    (u) =>
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const openCreateModal = () => {
    setEditingUser(null);
    setReportingPeriodType("MONTH");
    setPeriodStartDate("");
    setPeriodEndDate("");
    setInitials("");
    setShowPassword(false);
    setAccess({
      canReadSocial: false,
      canWriteSocial: false,
      canReadTeam: false,
      canWriteTeam: false,
      canReadContent: false,
      canWriteContent: false,
      canReadPost: false,
      canWritePost: false,
    });
    setIsOpen(true);
  };

  const openEditModal = (user: UserWithAccess) => {
    setEditingUser(user);
    setReportingPeriodType(user.reportingPeriodType || "MONTH");
    setPeriodStartDate(user.periodStartDate ? user.periodStartDate.split("T")[0] : "");
    setPeriodEndDate(user.periodEndDate ? user.periodEndDate.split("T")[0] : "");
    setInitials(user.initials || "");
    setShowPassword(false);

    const social = user.tableAccesses.find(a => a.tableName === "social_passport");
    const team = user.tableAccesses.find(a => a.tableName === "teambuilding");
    const content = user.tableAccesses.find(a => a.tableName === "content_plan");
    const post = user.tableAccesses.find(a => a.tableName === "post_request");
    
    setAccess({
      canReadSocial: social?.canRead || false,
      canWriteSocial: social?.canWrite || false,
      canReadTeam: team?.canRead || false,
      canWriteTeam: team?.canWrite || false,
      canReadContent: content?.canRead || false,
      canWriteContent: content?.canWrite || false,
      canReadPost: post?.canRead || false,
      canWritePost: post?.canWrite || false,
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

    // Передаем отчетные периоды и ручные инициалы в Server Actions
    formData.append("reportingPeriodType", reportingPeriodType);
    formData.append("periodStartDate", periodStartDate);
    formData.append("periodEndDate", periodEndDate);
    formData.append("initials", initials);

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
    if (canWrite) return <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">Запись</span>;
    if (canRead) return <span className="text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">Чтение</span>;
    return <span className="text-[10px] bg-rose-50 text-red-700 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">Нет</span>;
  };

  return (
    <div className="space-y-4">
      {/* Поиск и Добавление */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-stretch sm:items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Поиск по ФИО или Email..."
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 text-slate-800"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors shadow-sm cursor-pointer"
        >
          <UserPlus className="h-4 w-4" />
          Добавить сотрудника
        </button>
      </div>

      {/* 💻 ДЕСКТОПНАЯ ВЕРСИЯ ТАБЛИЦЫ С УЛУЧШЕННОЙ ПРОКРУТКОЙ */}
      <div className="hidden lg:block bg-white rounded-xl border border-slate-200 overflow-x-auto shadow-sm">
        <table className="min-w-full divide-y divide-slate-200 text-xs">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left font-semibold text-slate-500 uppercase tracking-wider">Сотрудник</th>
              <th className="px-6 py-3 text-left font-semibold text-slate-500 uppercase tracking-wider">Роль / Период</th>
              <th className="px-6 py-3 text-left font-semibold text-slate-500 uppercase tracking-wider">Состав коллектива</th>
              <th className="px-6 py-3 text-left font-semibold text-slate-500 uppercase tracking-wider">Тимбилдинг</th>
              <th className="px-6 py-3 text-left font-semibold text-slate-500 uppercase tracking-wider">Контент-План</th>
              <th className="px-6 py-3 text-left font-semibold text-slate-500 uppercase tracking-wider">Заявки</th>
              <th className="px-6 py-3 text-right font-semibold text-slate-500 uppercase tracking-wider">Действия</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white">
            {filteredUsers.map((user) => {
              const socialAccess = user.tableAccesses.find((a) => a.tableName === "social_passport");
              const teamAccess = user.tableAccesses.find((a) => a.tableName === "teambuilding");
              const contentAccess = user.tableAccesses.find((a) => a.tableName === "content_plan");
              const postAccess = user.tableAccesses.find((a) => a.tableName === "post_request");
              
              return (
                <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-700 font-bold text-xs">
                        {user.initials}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-slate-900">{user.name}</div>
                        <div className="text-xs text-slate-500">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap space-y-1">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                      user.role === "ADMIN" ? "bg-purple-100 text-purple-800" : "bg-slate-100 text-slate-800"
                    }`}>
                      {user.role === "ADMIN" ? "Администратор" : "Сотрудник"}
                    </span>
                    {user.role !== "ADMIN" && (
                      <div className="text-[10px] text-slate-400 font-semibold flex items-center gap-0.5">
                        <CalendarRange className="h-3 w-3 text-blue-500" />
                        Период: {user.reportingPeriodType === "MONTH" ? "Месяц" : user.reportingPeriodType === "QUARTER" ? "Квартал" : "Индивидуальный"}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {user.role === "ADMIN" ? <span className="text-[10px] font-bold text-slate-400">ПОЛНЫЙ</span> : renderAccessBadge(socialAccess?.canRead || false, socialAccess?.canWrite || false)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {user.role === "ADMIN" ? <span className="text-[10px] font-bold text-slate-400">ПОЛНЫЙ</span> : renderAccessBadge(teamAccess?.canRead || false, teamAccess?.canWrite || false)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {user.role === "ADMIN" ? <span className="text-[10px] font-bold text-slate-400">ПОЛНЫЙ</span> : renderAccessBadge(contentAccess?.canRead || false, contentAccess?.canWrite || false)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {user.role === "ADMIN" ? <span className="text-[10px] font-bold text-slate-400">ПОЛНЫЙ</span> : renderAccessBadge(postAccess?.canRead || false, postAccess?.canWrite || false)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => openEditModal(user)}
                        className="text-slate-500 hover:text-slate-800 p-1.5 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      {user.id !== currentUserId ? (
                        <button
                          onClick={() => handleDelete(user.id, user.name)}
                          disabled={isPending}
                          className="text-red-500 hover:text-red-700 p-1.5 hover:bg-red-50 rounded-lg transition-colors inline-flex items-center cursor-pointer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      ) : (
                        <span className="text-xs text-slate-400 italic px-2">Это вы</span>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* 📱 МОБИЛЬНАЯ ВЕРСИЯ */}
      <div className="block lg:hidden space-y-4">
        {filteredUsers.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-sm bg-white rounded-xl border">
            Сотрудники не найдены
          </div>
        ) : (
          filteredUsers.map((user) => {
            const socialAccess = user.tableAccesses.find((a) => a.tableName === "social_passport");
            const teamAccess = user.tableAccesses.find((a) => a.tableName === "teambuilding");
            const contentAccess = user.tableAccesses.find((a) => a.tableName === "content_plan");
            const postAccess = user.tableAccesses.find((a) => a.tableName === "post_request");

            return (
              <div key={user.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
                <div className="flex justify-between items-start border-b border-slate-100 pb-2.5">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-700 font-bold text-xs">
                      {user.initials}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-900 leading-snug">{user.name}</div>
                      <div className="text-[10px] text-slate-500 leading-none">{user.email}</div>
                    </div>
                  </div>
                  <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                    user.role === "ADMIN" ? "bg-purple-100 text-purple-800" : "bg-slate-100 text-slate-800"
                  }`}>
                    {user.role === "ADMIN" ? "Админ" : "Сотрудник"}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-slate-50 p-2 rounded-lg border border-slate-100 flex justify-between items-center">
                    <span className="text-slate-400 font-medium text-[10px]">Коллектив</span>
                    {user.role === "ADMIN" ? <span className="text-[10px] font-bold text-slate-400">ПОЛНЫЙ</span> : renderAccessBadge(socialAccess?.canRead || false, socialAccess?.canWrite || false)}
                  </div>
                  <div className="bg-slate-50 p-2 rounded-lg border border-slate-100 flex justify-between items-center">
                    <span className="text-slate-400 font-medium text-[10px]">Тимбилдинг</span>
                    {user.role === "ADMIN" ? <span className="text-[10px] font-bold text-slate-400">ПОЛНЫЙ</span> : renderAccessBadge(teamAccess?.canRead || false, teamAccess?.canWrite || false)}
                  </div>
                  <div className="bg-slate-50 p-2 rounded-lg border border-slate-100 flex justify-between items-center">
                    <span className="text-slate-400 font-medium text-[10px]">Контент-План</span>
                    {user.role === "ADMIN" ? <span className="text-[10px] font-bold text-slate-400">ПОЛНЫЙ</span> : renderAccessBadge(contentAccess?.canRead || false, contentAccess?.canWrite || false)}
                  </div>
                  <div className="bg-slate-50 p-2 rounded-lg border border-slate-100 flex justify-between items-center">
                    <span className="text-slate-400 font-medium text-[10px]">Заявки</span>
                    {user.role === "ADMIN" ? <span className="text-[10px] font-bold text-slate-400">ПОЛНЫЙ</span> : renderAccessBadge(postAccess?.canRead || false, postAccess?.canWrite || false)}
                  </div>
                </div>

                <div className="flex justify-end gap-1.5 pt-2 border-t border-slate-100">
                  <button
                    onClick={() => openEditModal(user)}
                    className="text-slate-500 hover:text-slate-800 p-1.5 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  {user.id !== currentUserId ? (
                    <button
                      onClick={() => handleDelete(user.id, user.name)}
                      disabled={isPending}
                      className="text-red-500 hover:text-red-700 p-1.5 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  ) : (
                    <span className="text-xs text-slate-400 italic flex items-center px-1">Это вы</span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Модальное окно создания/редактирования */}
      {isOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl border border-slate-200 flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-200">
              <h3 className="text-lg font-bold text-slate-800">
                {editingUser ? `Редактировать сотрудника: ${editingUser.name}` : "Добавить нового сотрудника"}
              </h3>
              <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
              {error && (
                <div className="rounded-lg bg-red-50 p-4 text-xs text-red-600 border border-red-100">
                  {error}
                </div>
              )}

              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div className="sm:col-span-3">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">ФИО сотрудника</label>
                    <input
                      type="text"
                      name="name"
                      required
                      defaultValue={editingUser?.name || ""}
                      placeholder="Например, Петров Петр"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 text-slate-800"
                    />
                  </div>
                  {/* ⚡ НОВОЕ: Ввод ручных Инициалов сотрудника */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Инициалы</label>
                    <input
                      type="text"
                      name="initials"
                      maxLength={2}
                      placeholder="ПП"
                      value={initials}
                      onChange={(e) => setInitials(e.target.value.toUpperCase())}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 text-slate-800 uppercase text-center"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    name="email"
                    required
                    defaultValue={editingUser?.email || ""}
                    placeholder="petrov@company.com"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 text-slate-800"
                  />
                </div>
                
                {/* Пароль с кнопкой-глазиком */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {editingUser ? "Новый пароль (оставьте пустым для сохранения прежнего)" : "Пароль"}
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      required={!editingUser}
                      placeholder={editingUser ? "••••••••" : "Укажите сложный пароль"}
                      className="w-full px-3 py-2 pr-10 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 text-slate-800 font-sans"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
                      title={showPassword ? "Скрыть пароль" : "Показать пароль"}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4.5 w-4.5" />
                      ) : (
                        <Eye className="h-4.5 w-4.5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Настройка отчетного периода с эластичной адаптивной сеткой */}
              <div className="p-3.5 bg-blue-50/50 border border-blue-100 rounded-xl space-y-3">
                <div className="text-xs font-bold text-slate-800 uppercase flex items-center gap-1">
                  <CalendarRange className="h-4 w-4 text-blue-600 animate-pulse" /> Настройка отчетного периода для KPI
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">Интервал отчетности</label>
                    <select
                      value={reportingPeriodType}
                      onChange={(e) => setReportingPeriodType(e.target.value)}
                      className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-xs bg-white text-slate-800 focus:outline-none focus:border-blue-500 cursor-pointer"
                    >
                      <option value="MONTH">Каждый месяц</option>
                      <option value="QUARTER">Каждый квартал</option>
                      <option value="CUSTOM">Произвольный период</option>
                    </select>
                  </div>

                  {reportingPeriodType === "CUSTOM" && (
                    <>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-1">Дата начала</label>
                        <input
                          type="date"
                          required
                          value={periodStartDate}
                          onChange={(e) => setPeriodStartDate(e.target.value)}
                          className="w-full px-2 py-1 border border-slate-300 rounded-lg text-xs focus:outline-none focus:border-blue-500 text-slate-800"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-1">Дата окончания</label>
                        <input
                          type="date"
                          required
                          value={periodEndDate}
                          onChange={(e) => setPeriodEndDate(e.target.value)}
                          className="w-full px-2 py-1 border border-slate-300 rounded-lg text-xs focus:outline-none focus:border-blue-500 text-slate-800"
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="border-t border-slate-200 pt-4 space-y-3">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Shield className="h-4 w-4" /> Права доступа к таблицам
                </h4>

                {/* 1. Состав коллектива */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <div className="text-xs font-bold text-slate-700 uppercase">Состав коллектива</div>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 text-xs font-medium text-slate-600 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={access.canReadSocial}
                        onChange={(e) => setAccess({ ...access, canReadSocial: e.target.checked })}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      Разрешить Чтение
                    </label>
                    <label className="flex items-center gap-2 text-xs font-medium text-slate-600 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={access.canWriteSocial}
                        onChange={(e) => setAccess({ ...access, canWriteSocial: e.target.checked })}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      Разрешить Запись
                    </label>
                  </div>
                </div>

                {/* 2. Командообразование */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <div className="text-xs font-bold text-slate-700 uppercase">Командообразование</div>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 text-xs font-medium text-slate-600 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={access.canReadTeam}
                        onChange={(e) => setAccess({ ...access, canReadTeam: e.target.checked })}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      Разрешить Чтение
                    </label>
                    <label className="flex items-center gap-2 text-xs font-medium text-slate-600 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={access.canWriteTeam}
                        onChange={(e) => setAccess({ ...access, canWriteTeam: e.target.checked })}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      Разрешить Запись
                    </label>
                  </div>
                </div>

                {/* 3. Контент-План */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <div className="text-xs font-bold text-slate-700 uppercase">Контент-План публикаций</div>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 text-xs font-medium text-slate-600 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={access.canReadContent}
                        onChange={(e) => setAccess({ ...access, canReadContent: e.target.checked })}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      Разрешить Чтение
                    </label>
                    <label className="flex items-center gap-2 text-xs font-medium text-slate-600 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={access.canWriteContent}
                        onChange={(e) => setAccess({ ...access, canWriteContent: e.target.checked })}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      Разрешить Запись / Одобрение
                    </label>
                  </div>
                </div>

                {/* 4. Заявки на посты */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <div className="text-xs font-bold text-slate-700 uppercase">Подача заявок на посты</div>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 text-xs font-medium text-slate-600 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={access.canReadPost}
                        onChange={(e) => setAccess({ ...access, canReadPost: e.target.checked })}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      Разрешить Чтение всех заявок
                    </label>
                    <label className="flex items-center gap-2 text-xs font-medium text-slate-600 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={access.canWritePost}
                        onChange={(e) => setAccess({ ...access, canWritePost: e.target.checked })}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      Разрешить Подачу заявок
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold transition-colors disabled:bg-blue-400 cursor-pointer"
                >
                  {isPending ? "Сохранение..." : editingUser ? "Сохранить изменения" : "Создать сотрудника"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}