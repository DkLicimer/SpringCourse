// src/app/app/employees/EmployeesClient.tsx
"use client";

import React, { useState, useTransition } from "react";
import { createEmployee, deleteEmployee, updateEmployee } from "@/server/actions/users";
import { UserPlus, Shield, X, Search, Trash2, Pencil } from "lucide-react";
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

  // Стейты редактирования сотрудника
  const [editingUser, setEditingUser] = useState<UserWithAccess | null>(null);

  // Состояния для чекбоксов доступа
  const [access, setAccess] = useState({
    canReadSocial: false,
    canWriteSocial: false,
    canReadTeam: false,
    canWriteTeam: false,
  });

  const filteredUsers = initialUsers.filter(
    (u) =>
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const openCreateModal = () => {
    setEditingUser(null);
    setAccess({
      canReadSocial: false,
      canWriteSocial: false,
      canReadTeam: false,
      canWriteTeam: false,
    });
    setIsOpen(true);
  };

  const openEditModal = (user: UserWithAccess) => {
    setEditingUser(user);
    const social = user.tableAccesses.find(a => a.tableName === "social_passport");
    const team = user.tableAccesses.find(a => a.tableName === "teambuilding");
    
    setAccess({
      canReadSocial: social?.canRead || false,
      canWriteSocial: social?.canWrite || false,
      canReadTeam: team?.canRead || false,
      canWriteTeam: team?.canWrite || false,
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

    startTransition(async () => {
      try {
        if (editingUser) {
          // Режим обновления
          await updateEmployee(editingUser.id, formData);
        } else {
          // Режим создания
          await createEmployee(formData);
        }
        setIsOpen(false);
        router.refresh(); // Принудительно обновляем данные на клиенте
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
        router.refresh(); // Мгновенное обновление таблицы без перезагрузки
      } catch (err: any) {
        alert(err.message || "Не удалось удалить сотрудника");
      }
    });
  };

  const renderAccessBadge = (canRead: boolean, canWrite: boolean) => {
    if (canWrite) return <span className="text-xs bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full font-medium">Чтение/Запись</span>;
    if (canRead) return <span className="text-xs bg-blue-100 text-blue-800 px-2.5 py-0.5 rounded-full font-medium">Только Чтение</span>;
    return <span className="text-xs bg-rose-100 text-red-800 px-2.5 py-0.5 rounded-full font-medium">Нет доступа</span>;
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
          className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors shadow-sm cursor-pointer"
        >
          <UserPlus className="h-4 w-4" />
          Добавить сотрудника
        </button>
      </div>

      {/* Таблица */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Сотрудник</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Роль</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Соц Паспорт</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Командообразование</th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Действия</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white">
            {filteredUsers.map((user) => {
              const socialAccess = user.tableAccesses.find((a) => a.tableName === "social_passport");
              const teamAccess = user.tableAccesses.find((a) => a.tableName === "teambuilding");
              
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
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
                      user.role === "ADMIN" ? "bg-purple-100 text-purple-800" : "bg-slate-100 text-slate-800"
                    }`}>
                      {user.role === "ADMIN" ? "Администратор" : "Сотрудник"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {user.role === "ADMIN" ? (
                      <span className="text-xs bg-slate-100 text-slate-800 px-2.5 py-0.5 rounded-full font-medium">Полный (Админ)</span>
                    ) : (
                      renderAccessBadge(socialAccess?.canRead || false, socialAccess?.canWrite || false)
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {user.role === "ADMIN" ? (
                      <span className="text-xs bg-slate-100 text-slate-800 px-2.5 py-0.5 rounded-full font-medium">Полный (Админ)</span>
                    ) : (
                      renderAccessBadge(teamAccess?.canRead || false, teamAccess?.canWrite || false)
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => openEditModal(user)}
                        className="text-slate-500 hover:text-slate-800 p-1.5 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
                        title="Редактировать сотрудника"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      {user.id !== currentUserId ? (
                        <button
                          onClick={() => handleDelete(user.id, user.name)}
                          disabled={isPending}
                          className="text-red-500 hover:text-red-700 p-1.5 hover:bg-red-50 rounded-lg transition-colors inline-flex items-center cursor-pointer"
                          title="Удалить сотрудника"
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

      {/* Модалка */}
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
                <div>
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
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {editingUser ? "Новый пароль (оставьте пустым для сохранения прежнего)" : "Пароль"}
                  </label>
                  <input
                    type="password"
                    name="password"
                    required={!editingUser} // Пароль обязателен только при создании
                    placeholder={editingUser ? "••••••••" : "Укажите сложный пароль"}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 text-slate-800"
                  />
                </div>
              </div>

              <div className="border-t border-slate-200 pt-4 space-y-3">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Shield className="h-4 w-4" /> Права доступа к таблицам
                </h4>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <div className="text-sm font-semibold text-slate-700">Социальный Паспорт</div>
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

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <div className="text-sm font-semibold text-slate-700">Командообразование</div>
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